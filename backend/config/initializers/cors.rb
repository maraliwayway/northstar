# The React client lives on a different origin (GitHub Pages), so the API must
# explicitly allow it. Set FRONTEND_ORIGINS to a comma-separated list, e.g.
#   https://yourname.github.io,http://localhost:5173
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*ENV.fetch("FRONTEND_ORIGINS", "http://localhost:5173").split(",").map(&:strip))
    resource "/api/*",
      headers: :any,
      methods: %i[get post patch put delete options head],
      max_age: 600
  end
end
