module Api
  class ReviewsController < ApplicationController
    include CrudActions

    def create
      review = scope.new(record_params)
      review.reviewed_on ||= Date.current
      review.net_worth_cents = NetWorth.new(current_user).totals[:net_cents]
      review.save ? render(json: review, status: :created) : render_errors(review)
    end

    private

    def scope
      current_user.reviews
    end

    def ordering
      { reviewed_on: :desc }
    end

    def record_params
      params.require(:review).permit(:reviewed_on, :keep_rule, :change_rule, :watch_weakness, :next_goal,
                                     answers: Review::QUESTIONS.keys)
    end
  end
end
