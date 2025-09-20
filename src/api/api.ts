const FLASK_API_URL = import.meta.env.VITE_FLASK_API_URL || 'http://localhost:5000';

export async function getSongs(artist: string, limit: number, hipster: boolean, token: string) {
    try {
        const params = new URLSearchParams({
            artist,
            limit: limit.toString(),
            hipster: hipster.toString(),
            token
        });

        const response = await fetch(`${FLASK_API_URL}/songs?${params}`);
        const data = await response.json();

        if (response.ok) {
            return data;
        }
        return [];
    } catch (e) {
        return [];
    }
}

export async function getUserTopArtists(token: string) {
    try {
        const params = new URLSearchParams({ token });
        const response = await fetch(`${FLASK_API_URL}/artists/top?${params}`);
        const data = await response.json();

        if (response.ok) {
            return data;
        }
        return [];
    } catch (e) {
        return [];
    }
}

export async function getCurrentArtist(token: string) {
    try {
        const params = new URLSearchParams({ token });
        const response = await fetch(`${FLASK_API_URL}/artists/current?${params}`);
        const data = await response.json();

        if (response.ok) {
            return data;
        }
        return null;
    } catch (e) {
        return null;
    }
}

export async function getArtist(id: string, token: string) {
    try {
        const params = new URLSearchParams({ id, token });
        const response = await fetch(`${FLASK_API_URL}/artists?${params}`);
        const data = await response.json();

        if (response.ok) {
            return data;
        }
        return {};
    } catch (e) {
        return {};
    }
}

export async function getUser(token: string): Promise<[string, string]> {
    try {
        const params = new URLSearchParams({ token });
        const response = await fetch(`${FLASK_API_URL}/user?${params}`);
        const data = await response.json();

        if (response.ok && Array.isArray(data) && data.length === 2) {
            return [data[0], data[1]];
        }
        return ['', ''];
    } catch (e) {
        return ['', ''];
    }
}

export async function createPlaylist(artist: string, id: string, token: string) {
    try {
        const response = await fetch(`${FLASK_API_URL}/playlist`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                artist,
                id,
                token
            })
        });

        const data = await response.json();

        if (response.ok) {
            return data;
        }
        return { id: '', uri: '', external_url: '' };
    } catch (e) {
        return { id: '', uri: '', external_url: '' };
    }
}

export async function getPlaylist(id: string, token: string) {
    try {
        const params = new URLSearchParams({ id, token });
        const response = await fetch(`${FLASK_API_URL}/playlist?${params}`);
        const data = await response.json();

        if (response.ok) {
            return data;
        }
        return { img: '' };
    } catch (e) {
        return { img: '' };
    }
}

export async function addSongsToPlaylist(playlist_id: string, songs: string[], token: string) {
    try {
        const response = await fetch(`${FLASK_API_URL}/playlist`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                playlist_id,
                songs,
                token
            })
        });

        const data = await response.json();

        if (response.ok) {
            return data;
        }
        return {};
    } catch (e) {
        return {};
    }
}
