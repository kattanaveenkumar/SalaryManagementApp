# frozen_string_literal: true

FactoryBot.define do
  factory :employee do
    full_name { "#{Faker::Name.first_name} #{Faker::Name.last_name}" }
    job_title { "Software Engineer" }
    country   { "United States" }
    salary    { 75_000 }

    trait :high_earner do
      salary { 200_000 }
    end

    trait :low_earner do
      salary { 25_000 }
    end
  end
end
