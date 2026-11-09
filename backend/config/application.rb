require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_record/railtie"
require "action_controller/railtie"

Bundler.require(*Rails.groups)

module Northstar
  class Application < Rails::Application
    config.load_defaults 8.0
    config.autoload_lib(ignore: %w[tasks])

    # JSON API only: the React client is hosted separately on GitHub Pages.
    config.api_only = true
    config.time_zone = "Pacific Time (US & Canada)"
  end
end
