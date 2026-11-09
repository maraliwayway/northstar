module Api
  class GoalsController < ApplicationController
    include CrudActions

    private

    def scope
      current_user.goals
    end

    def ordering
      { completed: :asc, due_on: :asc }
    end

    def record_params
      params.require(:goal).permit(:horizon, :title, :target_cents, :current_cents, :due_on, :completed)
    end
  end
end
