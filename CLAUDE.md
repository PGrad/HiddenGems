# API Migration Plan: HiddenGems → Flask Tutorial

## Overview
Replace all API glue functions in `src/api/` with HTTP calls to the Flask Tutorial API endpoints. The Flask Tutorial API provides equivalent functionality with a clean 1:1 mapping.

## Current State Analysis

### HiddenGems API Functions (`src/api/`)
**auth.ts:**
- `getAuthUrl()` - Generates Spotify auth URL with PKCE
- `getAuthCode()` - Extracts auth code from URL parameters
- `getAccessToken(token: AuthToken)` - Exchanges code/refresh token for access token

**api.ts:**
- `getSongs(artist, limit, hipster, token)` - Searches for artist songs
- `getUserTopArtists(token)` - Gets user's top artists
- `getCurrentArtist(token)` - Gets currently playing artist
- `getArtist(id, token)` - Gets artist by ID
- `getUser(token)` - Gets user info (id, image)
- `createPlaylist(artist, id, token)` - Creates playlist
- `getPlaylist(id, token)` - Gets playlist info
- `addSongsToPlaylist(playlist_id, songs, token)` - Adds songs to playlist

### Flask Tutorial API Endpoints (`../flask_tutorial/app/api/`)
**auth.py:**
- `GET /auth/url` - Generates Spotify auth URL
- `GET /auth/code?code=&state=` - Validates auth code
- `POST /auth/token` - Exchanges tokens

**music.py:**
- `GET /songs?artist=&limit=&hipster=&token=` - Searches songs
- `GET /artists/top?token=` - Gets top artists
- `GET /artists/current?token=` - Gets current artist
- `GET /artists?id=&token=` - Gets artist by ID
- `GET /user?token=` - Gets user info
- `GET /playlist?id=&token=` - Gets playlist info
- `POST /playlist` (body: artist, id, token) - Creates playlist
- `PUT /playlist` (body: playlist_id, songs, token) - Adds songs

## Migration Strategy

### Phase 1: Configuration
1. **Add Flask API base URL configuration**
   - Add environment variable for Flask API URL (e.g., `VITE_FLASK_API_URL`)
   - Default to `http://localhost:5000/api` for development

### Phase 2: Replace Authentication Functions (`src/api/auth.ts`)
1. **getAuthUrl()**
   - Replace local generation with `GET /auth/url`
   - Remove client-side PKCE code generation
   - Return URL from Flask response

2. **getAuthCode()**
   - Replace local URL parsing with `GET /auth/code?code=&state=`
   - Let Flask handle state validation
   - Return code from Flask response

3. **getAccessToken()**
   - Replace direct Spotify API call with `POST /auth/token`
   - Send token data as JSON body instead of form data
   - Maintain same return format `[access_token, refresh_token]`

### Phase 3: Replace Music API Functions (`src/api/api.ts`)
1. **Remove direct Spotify API calls**
   - Delete `callAPI()` helper function
   - All functions will use Flask API instead

2. **Replace each function with HTTP calls:**
   - `getSongs()` → `GET /songs?artist=&limit=&hipster=&token=`
   - `getUserTopArtists()` → `GET /artists/top?token=`
   - `getCurrentArtist()` → `GET /artists/current?token=`
   - `getArtist()` → `GET /artists?id=&token=`
   - `getUser()` → `GET /user?token=`
   - `getPlaylist()` → `GET /playlist?id=&token=`
   - `createPlaylist()` → `POST /playlist` with JSON body
   - `addSongsToPlaylist()` → `PUT /playlist` with JSON body

### Phase 4: Implementation Details

#### Error Handling
- Maintain existing try/catch patterns
- Handle Flask API errors (4xx/5xx responses)
- Preserve fallback behaviors (empty arrays, null values)

#### Request Format Changes
- **Query Parameters:** Functions using tokens as parameters will send them as query params
- **JSON Bodies:** `createPlaylist()` and `addSongsToPlaylist()` will send data as JSON bodies instead of query params
- **Response Format:** Flask API returns JSON responses that should match current function return formats

#### HTTP Client
- Use `fetch()` for all HTTP requests (consistent with existing code)
- Add proper error handling for network failures
- Set appropriate headers (`Content-Type: application/json` for POST/PUT)

### Phase 5: Environment Setup
1. **Development:**
   - Ensure Flask Tutorial API is running on `localhost:5000`
   - Configure CORS if needed for cross-origin requests

2. **Production:**
   - Deploy Flask Tutorial API to production environment
   - Update `VITE_FLASK_API_URL` to production Flask API URL

## Benefits of Migration
1. **Centralized Logic:** All Spotify API logic centralized in Flask backend
2. **Security:** Client secrets and sensitive operations moved to backend
3. **Consistency:** Single source of truth for API interactions
4. **Maintainability:** Easier to update Spotify API integration in one place
5. **Error Handling:** Better server-side error handling and logging

## Risk Mitigation
1. **Backward Compatibility:** Maintain exact same function signatures and return types
2. **Gradual Migration:** Migrate one function at a time to minimize risk
3. **Testing:** Test each migrated function thoroughly before proceeding
4. **Rollback Plan:** Keep original functions commented out until migration is complete

## Implementation Order
1. Configure Flask API base URL
2. Migrate `getAuthUrl()` first (simplest, no token required)
3. Migrate `getAuthCode()` and `getAccessToken()`
4. Migrate read-only functions (`getUserTopArtists`, `getCurrentArtist`, `getUser`, etc.)
5. Migrate write functions (`createPlaylist`, `addSongsToPlaylist`) last

## Notes
- Flask Tutorial API has a `breakpoint()` in line 66 of `music.py` that should be removed
- All Flask endpoints use async/await, so they handle concurrent requests well
- The Flask API maintains the same data structures and response formats as current functions