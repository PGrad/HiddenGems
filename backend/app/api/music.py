from app.api import bp
from flask import request, jsonify
import aiohttp
import json
from urllib.parse import quote

base_url = "https://api.spotify.com/v1/"

def get_headers(token: str):
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

async def fetch_data(session, endpoint):
    url = f"{base_url}{endpoint}"
    async with session.get(url) as response:
        data = await response.json()
        return data

async def post_data(session, endpoint, body):
    url = f"{base_url}{endpoint}"
    async with session.post(url, data=body) as response:
        data = await response.json()
        return data

@bp.route('/songs', methods=['GET'])
async def get_songs():
    artist = request.args.get('artist', type=str)
    limit = request.args.get('limit', type=int)
    hipster = request.args.get('hipster', type=bool)
    token = request.args.get('token', type=str)

    filteredSongs = []
    offset = 0

    headers = get_headers(token)
    async with aiohttp.ClientSession(headers=headers) as session:
        while (len(filteredSongs) < limit and offset < 1000):
            escaped_artist = quote(artist)
            hipster_tag = "%20tag:hipster" if hipster else ""
            songs = await fetch_data(session, f"search?q=artist:{escaped_artist}{hipster_tag}&type=track&limit=50&offset={offset}")
            items = songs["tracks"]["items"]
            filteredSongs.extend(list(filter(lambda song: song["album"]["album_type"] != "compilation", items)))
            offset += 50
            if not songs.get('tracks', {}).get('items'):
                break

    return jsonify(filteredSongs[:limit])

@bp.route('/artists/top', methods=["GET"])
async def get_top_artists():
    token = request.args.get('token', type=str)

    headers = get_headers(token)
    async with aiohttp.ClientSession(headers=headers) as session:
        json_data = await fetch_data(session, "me/top/artists")
        artists = [artist.get('name', '') for artist in json_data.get('items', [])]
        return jsonify(artists)

@bp.route('/artists/current', methods=["GET"])
async def get_current_artist():
    token = request.args.get('token', type=str)

    headers = get_headers(token)
    async with aiohttp.ClientSession(headers=headers) as session:
        json_data = await fetch_data(session, "me/player/currently-playing")
        current_artist = json_data.get('item', {}).get('artists', [{}])[0].get('name')
        return jsonify(current_artist)

@bp.route('/artists', methods=["GET"])
async def get_artists():
    artist_id = request.args.get('id', type=str)
    token = request.args.get('token', type=str)

    headers = get_headers(token)
    async with aiohttp.ClientSession(headers=headers) as session:
        artist_data = await fetch_data(session, f"artists/{artist_id}")
        return jsonify(artist_data)

@bp.route('/user', methods=["GET"])
async def get_user():
    token = request.args.get('token', type=str)

    headers = get_headers(token)
    async with aiohttp.ClientSession(headers=headers) as session:
        json_data = await fetch_data(session, "me")
        user_id = json_data.get('id')
        img = json_data.get('images', [{}])[0].get('url') if json_data.get('images') else None
        return jsonify([user_id, img])

@bp.route('/playlist', methods=["GET"])
async def get_playlist():
    playlist_id = request.args.get('id', type=str)
    token = request.args.get('token', type=str)

    headers = get_headers(token)
    async with aiohttp.ClientSession(headers=headers) as session:
        json_data = await fetch_data(session, f"playlists/{playlist_id}")
        img = json_data.get('images', [{}])[0].get('url') if json_data.get('images') else None
        return jsonify({'img': img})

@bp.route('/playlist', methods=["POST"])
async def create_playlist():
    data = request.get_json()
    artist = data.get('artist')
    user_id = data.get('id')
    token = data.get('token')

    headers = get_headers(token)
    playlist_data = {
        "name": f"{artist}'s Hidden Gems",
        "description": f"A playlist of {artist}'s hidden gems",
        "public": False
    }

    async with aiohttp.ClientSession(headers=headers) as session:
        json_data = await post_data(session, f"users/{user_id}/playlists", json.dumps(playlist_data))
        result = {
            'id': json_data.get('id'),
            'uri': json_data.get('uri'),
            'external_url': json_data.get('external_urls', {}).get('spotify')
        }
        return jsonify(result)

@bp.route('/playlist', methods=["PUT"])
async def add_songs():
    data = request.get_json()
    playlist_id = data.get('playlist_id')
    songs = data.get('songs')
    token = data.get('token')

    headers = get_headers(token)
    songs_data = {"uris": songs}

    async with aiohttp.ClientSession(headers=headers) as session:
        result = await post_data(session, f"playlists/{playlist_id}/tracks", json.dumps(songs_data))
        return jsonify(result)