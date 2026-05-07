# Security

## Authentication

JWT-based authentication using the `jwt` gem. Tokens are issued on login/signup and must accompany every protected request via the `Authorization: Bearer <token>` header.

- Tokens are signed with `SECRET_KEY_BASE` (HS256 algorithm)
- Passwords are hashed with bcrypt via `has_secure_password` — plaintext is never stored
- Emails are downcased before storage; case-insensitive lookup avoids duplicate accounts

## Authorisation

All `/api/v1/employees` and `/api/v1/insights` endpoints require a valid JWT. The `authenticate_user!` before-action in `ApplicationController` decodes the token and sets `current_user` for every request. Auth endpoints (`/api/v1/auth/*`) are explicitly excluded via `skip_before_action`.

Two roles exist: `hr_manager` (default) and `admin`. Role is embedded in the JWT payload.

## Input Validation

- **Strong params** (`params.require(:employee).permit(...)`) — no mass assignment possible
- **ActiveRecord validations** on all fields — salary bounds, email format, inclusion in allowed enum sets
- **`per_page` clamped** to `[1, 100]` server-side — clients cannot dump all rows in a single request
- **`top_earners` limit clamped** to `[1, 100]` in the controller

## SQL Injection

All dynamic queries use parameterised ActiveRecord calls or `?` placeholders:

```ruby
scope.where("full_name ILIKE ?", "%#{name}%")  # safe — bound parameter
scope.where(country: country)                   # safe — AR scope
```

Sort column and direction are whitelisted against explicit allow-lists before touching SQL:

```ruby
SORTABLE_COLUMNS.include?(params[:sort_by]) ? params[:sort_by] : "id"
SORT_ORDERS.include?(params[:sort_order]) ? params[:sort_order] : "asc"
```

## CORS

Configured via `rack-cors`. The `CORS_ORIGINS` environment variable controls allowed origins. Default is `http://localhost:3001`. In production, set this to the deployed frontend domain.

## Known Limitations

| Gap | Notes |
|-----|-------|
| No rate limiting | Straightforward to add with `rack-attack` |
| No token refresh | Tokens are long-lived; consider a short TTL + refresh in production |
| No 2FA | Not in scope for this assessment; required before handling real compensation data |
| Secrets in env vars | `SECRET_KEY_BASE` defaults to `change_me` — must be replaced in production |
| No audit log | Employee record changes are not logged to an audit trail |

## Reporting a Vulnerability

Open an issue with the label `security`. Do not include exploit details in the public issue body — request a private channel first.
