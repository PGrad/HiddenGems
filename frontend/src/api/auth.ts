const FLASK_API_URL = import.meta.env.VITE_FLASK_API_URL || 'http://localhost:5173/api';

export async function getAuthUrl(): Promise<string> {
  try {
    const response = await fetch(`${FLASK_API_URL}/auth/url`);
    const data = await response.json();
    return data.url;
  } catch (e) {
    throw new Error('Failed to get auth URL');
  }
}

export async function getAuthCode(): Promise<string | null> {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('code');
  } catch (e) {
    throw new Error('Failed to get auth code');
  }
}

export interface AuthToken {
    access_token: string;
    type: 'none' | 'auth_code' | 'refresh_token';
}

export async function getAccessToken(token: AuthToken): Promise<[string, string]> {
    try {
        const response = await fetch(`${FLASK_API_URL}/auth/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: token.type,
                access_token: token.access_token
            }),
        });

        const data = await response.json();

        if (response.ok && Array.isArray(data) && data.length === 2) {
            return [data[0], data[1]];
        }

        return ["", ""];
    } catch (e) {
        return ["", ""];
    }
}
