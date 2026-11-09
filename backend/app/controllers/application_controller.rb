class ApplicationController < ActionController::API
  include ActionController::HttpAuthentication::Token::ControllerMethods
  include Authentication

  rescue_from ActiveRecord::RecordNotFound do
    render json: { error: "That record doesn't exist or isn't yours." }, status: :not_found
  end

  rescue_from ActionController::ParameterMissing do |error|
    render json: { error: error.message }, status: :bad_request
  end

  private

  def render_errors(record)
    render json: { errors: record.errors.full_messages }, status: 422
  end
end
