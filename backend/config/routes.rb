# frozen_string_literal: true

Rails.application.routes.draw do
  get "/health", to: "health#index"

  namespace :api do
    namespace :v1 do
      # Public — no token required
      post "auth/signup", to: "auth#signup"
      post "auth/login",  to: "auth#login"

      # Protected — JWT required
      resources :employees, only: %i[index show create update destroy]

      scope "/insights" do
        get :company_kpis,       to: "insights#company_kpis"
        get :country_salaries,   to: "insights#country_salaries"
        get :job_title_salaries, to: "insights#job_title_salaries"
        get :salary_percentiles, to: "insights#salary_percentiles"
        get :top_earners,        to: "insights#top_earners"
      end
    end
  end
end
