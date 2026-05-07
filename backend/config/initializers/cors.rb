# frozen_string_literal: true

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Production: set CORS_ORIGINS to your frontend domain(s), comma-separated.
    # Development/Docker: defaults to localhost on common ports.
    origins_list = ENV.fetch("CORS_ORIGINS", "http://localhost:3001,http://localhost:3000")
    origins origins_list.split(",").map(&:strip)

    resource "*",
             headers: :any,
             methods: %i[get post put patch delete options head],
             expose: ["Authorization"]
  end
end
