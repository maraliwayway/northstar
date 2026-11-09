module Api
  class RegistrationsController < ApplicationController
    allow_unauthenticated_access only: :create
    rate_limit to: 5, within: 10.minutes, only: :create,
               with: -> { render json: { error: "Too many sign-ups from here. Try again later." }, status: :too_many_requests }

    def create
      user = User.new(params.require(:user).permit(:name, :email, :password))
      user.settings = { "reset_started_on" => Date.current.iso8601 }

      if user.save
        session = start_session_for(user)
        render json: { token: session.token, user: user }, status: :created
      else
        render_errors(user)
      end
    end
  end
end
