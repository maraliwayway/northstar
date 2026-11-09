# Bearer-token auth. Tokens (not cookies) are used because the client is on
# github.io and the API on another domain, where Safari blocks third-party cookies.
module Authentication
  extend ActiveSupport::Concern

  included do
    before_action :require_authentication
  end

  class_methods do
    def allow_unauthenticated_access(**options)
      skip_before_action :require_authentication, **options
    end
  end

  private

  attr_reader :current_session

  def current_user
    current_session&.user
  end

  def require_authentication
    @current_session = authenticate_with_http_token { |token, _options| Session.find_active_by_token(token) }

    if @current_session
      @current_session.touch(:last_used_at) if @current_session.last_used_at.nil? || @current_session.last_used_at < 1.hour.ago
    else
      render json: { error: "Your session has ended. Sign in again." }, status: :unauthorized
    end
  end

  def start_session_for(user)
    user.sessions.create!(user_agent: request.user_agent.to_s[0, 255], ip_address: request.remote_ip)
  end
end
