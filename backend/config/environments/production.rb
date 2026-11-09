Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = true
  config.consider_all_requests_local = false

  # Render (and most hosts) terminate TLS at the proxy.
  config.assume_ssl = true
  config.force_ssl = true
  config.ssl_options = { redirect: { exclude: ->(request) { request.path == "/up" } } }

  config.log_tags = [:request_id]
  config.logger = ActiveSupport::TaggedLogging.new(ActiveSupport::Logger.new($stdout))
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")

  config.cache_store = :memory_store
  config.active_support.report_deprecations = false
  config.active_record.dump_schema_after_migration = false
end
