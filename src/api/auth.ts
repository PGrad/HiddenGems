function generateRandomString(length: number): string {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  function base64encode(string: ArrayBuffer): string {
    return btoa(
        String.fromCharCode.apply(null,
            Array.from(new Uint8Array(string))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window
    .crypto.subtle.digest('SHA-256', data);

  sessionStorage.setItem('verifier', codeVerifier);

  return base64encode(digest);
}

export async function getAuthUrl(): Promise<string> {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const HOST = import.meta.env.VITE_HOST;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    scope: 'playlist-modify-private',
    redirect_uri: HOST,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  const url = new URL('https://accounts.spotify.com/authorize');
  url.search = params.toString();

  return url.toString();
}

export function getAuthCode(): string | null {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (state !== sessionStorage.getItem('state')) {
    throw new Error('State mismatch');
  }

  return code;
}

export interface AuthToken {
    access_token: string;
    type: 'none' | 'auth_code' | 'refresh_token';
}

export async function getAccessToken(token: AuthToken): Promise<[string, string]> {
    const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
    const HOST = import.meta.env.VITE_HOST;
    if (!CLIENT_ID || !CLIENT_SECRET)
        throw new Error("client id or client secret is not defined");

    const formData = new URLSearchParams();
    if (token.type === 'auth_code') {
        formData.append("grant_type", "authorization_code");
        formData.append("code", token.access_token);
        formData.append("redirect_uri", HOST);
        formData.append("code_verifier", sessionStorage.getItem('verifier') || "");
        formData.append("client_id", CLIENT_ID);
    } else if (token.type === 'refresh_token') {
        formData.append("grant_type", "refresh_token");
        formData.append("refresh_token", token.access_token);
    }
    else {
        formData.append("grant_type", "client_credentials");
    }
    formData.append("client_id", CLIENT_ID);
    formData.append("client_secret", CLIENT_SECRET);
    const data = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
    });
    const json = await data.json()

    if (json.hasOwnProperty("access_token")) {
        if (json.hasOwnProperty("refresh_token"))
            return [json["access_token"], json["refresh_token"]];
        return [json["access_token"], ""];
    }

    return ["", ""];
}
