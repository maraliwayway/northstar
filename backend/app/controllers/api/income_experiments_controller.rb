module Api
  class IncomeExperimentsController < ApplicationController
    include CrudActions

    private

    def scope
      current_user.income_experiments
    end

    def ordering
      { created_at: :desc }
    end

    def record_params
      params.require(:income_experiment).permit(:idea, :started_on, :earned_cents, :hours, :status, :notes)
    end
  end
end
