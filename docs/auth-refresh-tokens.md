# Replace stored passwords with refresh tokens

Status: proposed, not started (noted 2026-11-24)
Repositories: `sindit-frontend` (most of the work) and `sindit` (backend)

## Problem

At sign-in, the SvelteKit server proxy keeps the user's **plain-text password** in a
browser cookie so it can log in again when the backend token expires.

- Login stores three cookies: `session_username`, `session_password` and `api_token`
  (`src/routes/api/proxy/+server.ts`, `POST` handler for `endpoint=login`).
- On every proxied request the proxy reads `session_username` and `session_password`
  (`handleProxy`). If the backend answers 401, it calls `getToken(username, password)`
  again and stores the new `api_token`.
- Logout clears the three cookies.

The cookies are `httpOnly`, `secure` and `sameSite: strict`, which blocks page scripts,
plain HTTP and cross-site requests. The remaining risks:

- The password sits in plain text in the browser's cookie store. Anyone with access to
  that browser (shared computer, developer tools, a copied profile) can read it.
- It is sent to the frontend server with every request, so any logging of request
  headers there would capture it.
- The cookies have no `maxAge`. They last for the browser session, and browsers that
  restore sessions keep them much longer.

Related: the sign-in code also returns the access token to the browser and stores it in
`localStorage` (`sindit_auth_user` in `src/lib/components/states/auth.svelte.ts`).
`localStorage` is readable by any script on the page, so an XSS bug would leak the token.
The proxy already keeps the token in an `httpOnly` cookie, so the browser copy is not
needed.

## Why it is not a quick fix

The proxy needs some way to get a new access token without the password. The backend's
`POST /token` only returns a short-lived access token:

- Keycloak mode (`sindit/src/sindit/authentication/keycloak.py`): `create_access_token`
  calls `keycloak_openid.token(username, password)`. Keycloak's response includes
  `refresh_token`, `expires_in` and `refresh_expires_in`, but only `access_token` is
  passed on.
- In-memory mode (`sindit/src/sindit/authentication/in_memory.py`): issues a JWT valid for
  30 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES`). It has no refresh concept.

So the backend has to expose refresh tokens, and the proxy has to use them.

## Proposed design

Use the password only once, at sign-in. Afterwards, keep only tokens.

### Backend (`sindit`)

1. Extend the `Token` model (`authentication/models.py`) with optional fields:
   `refresh_token`, `expires_in`, `refresh_expires_in`. Optional, so existing clients
   that read only `access_token` keep working.
2. Keycloak mode: return those fields from Keycloak's token response in
   `create_access_token`.
3. Add `POST /token/refresh` taking `{"refresh_token": "..."}` in the JSON body (not the
   URL; see the vault fix). Keycloak mode calls `keycloak_openid.refresh_token(...)` and
   returns a new `Token`. Return 401 if the refresh token is expired or revoked.
4. Add `POST /token/logout` taking the refresh token, calling
   `keycloak_openid.logout(refresh_token)` so the Keycloak session ends server-side.
5. In-memory mode: either issue a separate long-lived refresh JWT (with a claim such as
   `"typ": "refresh"`, which `verify_token` must reject as an access token), or document
   that in-memory mode is development-only and keep its current behaviour there.
6. Never put tokens in URLs or log messages: send them only in JSON bodies or headers,
   because the access log records full URLs.

### Frontend proxy (`sindit-frontend`)

1. Login (`endpoint=login`): call `/token` with the password, then store only
   `api_token` and `refresh_token` in `httpOnly`, `secure`, `sameSite: strict` cookies.
   Do not store the password. Set `maxAge` from `expires_in` and `refresh_expires_in`.
2. On a backend 401: call `/token/refresh` with the refresh-token cookie, store the new
   pair, and retry the request once. If refreshing fails, clear the cookies and return
   401, so the UI shows the sign-in page.
3. Logout: call `/token/logout`, then clear the cookies.
4. Remove `session_username` and `session_password` everywhere, including `getToken`
   usage in `handleProxy`.
5. Stop returning `access_token` to the browser from the login endpoint, and stop storing
   it in `localStorage`. Keep only non-secret profile data there (username, full name,
   email).
6. Migration: on first request after deploy, an old session has
   `session_password` but no `refresh_token`. Treat that as signed out: clear the old
   cookies and return 401. Users sign in again once.

### Keycloak

- Check the realm's token lifetimes (Realm settings › Sessions/Tokens): SSO session idle
  and max, and the access-token lifespan. These set how long a user stays signed in.
- Consider enabling refresh-token rotation (revoke refresh token on use), so a stolen
  refresh token stops working once the real client refreshes.

## Files to change

| Repository | File | Change |
|---|---|---|
| sindit | `src/sindit/authentication/models.py` | Optional refresh fields on `Token` |
| sindit | `src/sindit/authentication/authentication_service.py` | `refresh_access_token`, `logout` on the interface |
| sindit | `src/sindit/authentication/keycloak.py` | Pass refresh token through; implement refresh and logout |
| sindit | `src/sindit/authentication/in_memory.py` | Refresh JWT, or mark as dev-only |
| sindit | `src/sindit/api/authentication_endpoints.py` | `POST /token/refresh`, `POST /token/logout` |
| sindit-frontend | `src/routes/api/proxy/+server.ts` | Token-only cookies, refresh-on-401, logout call |
| sindit-frontend | `src/lib/components/states/auth.svelte.ts` | Drop the token from `localStorage` |
| sindit-frontend | `src/lib/api-client.ts` | Same cleanup |

## Testing

- Sign in, then check the browser's cookies: no `session_password`; only `api_token` and
  `refresh_token`, both `HttpOnly`.
- Shorten the access-token lifespan in Keycloak (e.g. 1 minute), wait, and use the app:
  requests keep working, and the proxy log shows one refresh.
- Revoke the session in the Keycloak admin console: the next request ends at the sign-in
  page.
- Logout, then reuse the old refresh token against `/token/refresh`: expect 401.
- Other API clients that call `/token` and read only `access_token` (e.g. the Quasar
  backend) still work.

## Deploy order

Backend first (the new fields and endpoints are additive), then the frontend. Users with
an old session are asked to sign in once.
