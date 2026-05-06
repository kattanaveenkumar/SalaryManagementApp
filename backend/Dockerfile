# Stage 1: Install gems
FROM ruby:3.2.2-alpine AS gems
WORKDIR /app
RUN apk add --no-cache build-base postgresql-dev

COPY Gemfile Gemfile.lock ./
RUN bundle config set --local without "development test" \
 && bundle install --jobs 4 --retry 3

# Stage 2: Production image (no build tools)
FROM ruby:3.2.2-alpine AS runner
WORKDIR /app

RUN apk add --no-cache postgresql-client bash

RUN addgroup --system --gid 1001 rails \
 && adduser  --system --uid 1001 --ingroup rails rails

COPY --from=gems /usr/local/bundle /usr/local/bundle
COPY --chown=rails:rails . .

ENV RAILS_ENV=production
ENV RAILS_LOG_TO_STDOUT=1
ENV RAILS_SERVE_STATIC_FILES=false

USER rails
EXPOSE 3000

CMD ["bash", "bin/docker-entrypoint"]
