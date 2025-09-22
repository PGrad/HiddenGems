from app.api import bp
from flask import request, jsonify, session
import aiohttp
import secrets
import hashlib
import base64
import os
from urllib.parse import urlencode

base_url = "https://accounts.spotify.com"

def generate_random_string(length: int) -> str:
    return secrets.token_urlsafe(length)[:length]

def generate_code_challenge(code_verifier: str) -> str:
    digest = hashlib.sha256(code_verifier.encode('utf-8')).digest()
    challenge = base64.urlsafe_b64encode(digest).decode('utf-8')
    return challenge.rstrip('=')

@bp.route('/auth/url', methods=['GET'])
def get_auth_url():
    try:
        client_id = os.environ.get('SPOTIFY_CLIENT_ID')
        host = os.environ.get('HOST')

        if not client_id or not host:
            return jsonify({'error': 'Missing required environment variables'}), 400

        code_verifier = generate_random_string(128)
        code_challenge = generate_code_challenge(code_verifier)
        state = generate_random_string(16)

        session['code_verifier'] = code_verifier
        session['state'] = state

        params = {
            'response_type': 'code',
            'client_id': client_id,
            'scope': 'playlist-modify-private user-read-currently-playing user-top-read',
            'redirect_uri': host,
            'code_challenge_method': 'S256',
            'code_challenge': code_challenge,
            'state': state
        }

        auth_url = f"{base_url}/authorize?{urlencode(params)}"
        return jsonify({'url': auth_url})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/auth/token', methods=['POST'])
async def get_access_token():
    try:
        data = request.get_json()
        token_type = data.get('type')
        token_value = data.get('access_token')

        client_id = os.environ.get('SPOTIFY_CLIENT_ID')
        client_secret = os.environ.get('SPOTIFY_CLIENT_SECRET')
        host = os.environ.get('HOST')

        if not client_id or not client_secret:
            return jsonify({'error': 'Client ID or client secret not defined'}), 400

        form_data = {
            'client_id': client_id,
            'client_secret': client_secret
        }

        if token_type == 'auth_code':
            form_data.update({
                'grant_type': 'authorization_code',
                'code': token_value,
                'redirect_uri': host,
                'code_verifier': session.get('code_verifier', '')
            })
        elif token_type == 'refresh_token':
            form_data.update({
                'grant_type': 'refresh_token',
                'refresh_token': token_value
            })
        else:
            form_data.update({
                'grant_type': 'client_credentials'
            })

        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        async with aiohttp.ClientSession() as session_http:
            async with session_http.post(
                f'{base_url}/api/token',
                headers=headers,
                data=form_data
            ) as response:
                json_data = await response.json()

                if 'access_token' in json_data:
                    access_token = json_data['access_token']
                    refresh_token = json_data.get('refresh_token', '')
                    return jsonify([access_token, refresh_token])
                else:
                    return jsonify(['', ''])

    except Exception as e:
        return jsonify({'error': str(e)}), 500