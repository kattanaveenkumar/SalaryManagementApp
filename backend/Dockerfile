# Stage 1: Install gems
FROM ruby:3.2.2-alpine AS gems
WORKDIR /app
RUN apk add --no-cache build-base postgresql-dev

COPY Gemfile Gemfile.lock ./
# force_ruby_platform: compile all native gems from source so pre-built
# glibc binaries (x86_64-linux) are not used on Alpine's musl libc.
RUN bundle config set --local without "development test" \
 && bundle config set --local force_ruby_platform true \
 && bundle install --jobs 4 --retry 3

# Stage 2: Production image (no build tools)
FROM ruby:3.2.2-alpine AS runner
WORKDIR /app

RUN apk add --no-cache postgresql-client bash tzdata

RUN addgroup --system --gid 1001 rails \
 && adduser  --system --uid 1001 --ingroup rails rails

COPY --from=gems /usr/local/bundle /usr/local/bundle
COPY --chown=rails:rails . .

RUN mkdir -p /app/tmp/pids /app/tmp/sockets /app/tmp/cache \
 && chown -R rails:rails /app/tmp

ENV RAILS_ENV=production
ENV RAILS_LOG_TO_STDOUT=1
ENV RAILS_SERVE_STATIC_FILES=false

USER rails
EXPOSE 3000

CMD ["bash", "bin/docker-entrypoint"]
