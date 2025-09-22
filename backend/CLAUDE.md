# Flask Auth API Implementation Plan for Spotify OAuth

## Overview

Convert JavaScript OAuth code from `js.example` to Python Flask implementation in `app/api/auth.py`. The JavaScript implements Spotify OAuth 2.0 with PKCE (Proof Key for Code Exchange) flow.

## Required Packages

**No additional packages needed!** All required dependencies are already available:

- `flask` (with async support) ✓
- `aiohttp` ✓
- `python-dotenv` ✓
- Built-in modules: `secrets`, `hashlib`, `base64`, `urllib.parse`, `os`, `json`

## JavaScript Functions to Convert

### 1. `generateRandomString(length)` → Helper Function
- **Purpose:** Creates cryptographically secure random string for PKCE code verifier
- **Python Implementation:** Use `secrets.token_urlsafe()`

### 2. `generateCodeChallenge(codeVerifier)` → Helper Function
- **Purpose:** Creates SHA-256 hash of code verifier for PKCE challenge
- **Python Implementation:** Use `hashlib.sha256()` + `base64.urlsafe_b64encode()`

### 3. `getAuthUrl()` → `/auth/url` (GET)
- **Purpose:** Generate Spotify authorization URL with PKCE parameters
- **Parameters:** None (reads from environment)
- **Returns:** Authorization URL string
- **Environment Variables:**
  - `SPOTIFY_CLIENT_ID`
  - `HOST` (redirect URI)

### 4. `getAuthCode()` → `/auth/code` (GET)
- **Purpose:** Extract authorization code from callback URL
- **Parameters:** `code`, `state` (query params)
- **Returns:** Authorization code or error
- **Session:** Validate state parameter against stored value

### 5. `getAccessToken(token)` → `/auth/token` (POST)
- **Purpose:** Exchange auth code/refresh token for access token
- **Parameters:** JSON body with token type and value
- **Token Types:**
  - `auth_code`: Exchange authorization code
  - `refresh_token`: Refresh existing token
  - `client_credentials`: Client credentials flow
- **Returns:** `[access_token, refresh_token]`

## Implementation Strategy

### Session Management
- Replace JavaScript `sessionStorage` with Flask session
- Store `code_verifier` and `state` in server-side session
- Use Flask's built-in session handling with secret key

### Environment Variables
- Use `os.environ` to read:
  - `SPOTIFY_CLIENT_ID`
  - `SPOTIFY_CLIENT_SECRET`
  - `HOST` (redirect URI)

### Async HTTP Requests
- Use `aiohttp` for token exchange (consistent with `music.py`)
- Implement proper error handling for Spotify API responses

### Flask Route Structure
```python
from app.api import bp

@bp.route('/auth/url', methods=['GET'])
@bp.route('/auth/code', methods=['GET'])
@bp.route('/auth/token', methods=['POST'])
```

### Error Handling
- Return proper JSON error responses
- Validate required environment variables
- Handle Spotify API errors gracefully
- Validate PKCE state parameter

### Security Considerations
- Use cryptographically secure random generation
- Validate state parameter to prevent CSRF
- Store sensitive data in server-side session only
- Follow OAuth 2.0 and PKCE security best practices

## Key Differences from JavaScript

1. **Session Storage**: Server-side Flask session vs browser sessionStorage
2. **Environment Access**: `os.environ` vs `import.meta.env`
3. **Async Patterns**: Python async/await vs JavaScript promises
4. **URL Handling**: `urllib.parse` vs JavaScript URL API
5. **HTTP Requests**: `aiohttp` vs `fetch()`
6. **Route Handling**: Flask decorators vs exported functions

## Implementation Steps

1. Create `app/api/auth.py` with blueprint import
2. Implement helper functions for PKCE generation
3. Create `/auth/url` endpoint for authorization URL
4. Create `/auth/code` endpoint for code extraction
5. Create `/auth/token` endpoint for token exchange
6. Add proper error handling and validation
7. Test OAuth flow end-to-end

This implementation maintains the same OAuth 2.0 PKCE flow as the JavaScript while adapting to Flask's server-side architecture.