module Api
  class ProfilesController < ApplicationController
    SETTINGS = [
      :emergency_months, :starter_goal_cents, :raise_invest_percent, :reset_started_on, :next_payday,
      { motivations: [], completed_weeks: [], custom_targets: Finance::Allocation::ASSET_CLASSES,
        card_rules: %i[allowed autopay_full rewards_plan paused] }
    ].freeze

    def show
      render json: current_user
    end

    def update
      attrs = params.require(:profile).permit(
        :name, :birth_year, :province, :annual_income_cents, :monthly_take_home_cents,
        :monthly_expenses_cents, :pay_frequency, :risk_profile, :why_statement, settings: SETTINGS
      )
      new_settings = attrs.delete(:settings)
      previous_take_home = current_user.monthly_take_home_cents

      current_user.assign_attributes(attrs)
      current_user.settings = current_user.preferences.merge(new_settings.to_h) if new_settings
      note_raise(previous_take_home)

      if current_user.save
        render json: current_user
      else
        render_errors(current_user)
      end
    end

    # Lifestyle-inflation guard: when take-home pay goes up, offer to send part
    # of the raise straight to the first investing rule.
    def route_raise
      raise_info = current_user.preferences["last_raise"]
      rule = current_user.automation_rules.find_by(kind: "invest")

      if raise_info && params[:apply].present? && ActiveModel::Type::Boolean.new.cast(params[:apply])
        if rule.nil?
          return render json: { error: "Add an investing step to your paycheque plan first." }, status: 422
        end

        rule.update!(amount_cents: rule.amount_cents.to_i + raise_info["suggested_invest_cents"].to_i) if rule.percent.to_f.zero?
      end

      current_user.update!(settings: current_user.preferences.merge("last_raise" => nil))
      render json: current_user
    end

    def destroy
      current_user.destroy!
      head :no_content
    end

    private

    def note_raise(previous)
      delta = current_user.monthly_take_home_cents.to_i - previous.to_i
      return unless previous.to_i.positive? && delta.positive?

      share = current_user.preferences["raise_invest_percent"].to_i
      current_user.settings = current_user.preferences.merge(
        "last_raise" => { "delta_cents" => delta, "suggested_invest_cents" => delta * share / 100, "noted_on" => Date.current.iso8601 }
      )
    end
  end
end
