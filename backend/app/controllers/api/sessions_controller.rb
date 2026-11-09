module Api
  class SessionsController < ApplicationController
    allow_unauthenticated_access only: :create
    rate_limit to: 10, within: 3.minutes, only: :create,
               with: -> { render json: { error: "Too many attempts. Wait a few minutes and try again." }, status: :too_many_requests }

    def create
      user = User.authenticate_by(email: params.require(:email), password: params.require(:password))

      if user
        session = start_session_for(user)
        render json: { token: session.token, user: user }, status: :created
      else
        render json: { error: "That email and password don't match." }, status: :unauthorized
      end
    end

    def destroy
      current_session.destroy!
      head :no_content
    end
  end
end
