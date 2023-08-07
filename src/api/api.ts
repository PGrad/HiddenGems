export async function getSongs(artist: string, limit: number, hipster: boolean, token: string) {
    const escaped = encodeURIComponent(artist);
    const data = await fetch(`https://api.spotify.com/v1/search?q=artist:${escaped}%20${hipster ? "tag:hipster" : ""}&type=track&limit=${limit}`,
        {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
    const json = await data.json();
    return json;
}

export async function getArtist(id: string, token: string) {
    const data = await fetch(`https://api.spotify.com/v1/artists/${id}`,
        {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
    const json = await data.json();
    return json;
}

export async function getUser(token: string): Promise<string> {
    const data = await fetch(`https://api.spotify.com/v1/me`,
        {
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });
    const json = await data.json();
    return json["id"];
}

export async function createPlaylist(artist: string, id: string, token: string) {
    const data = await fetch(`https://api.spotify.com/v1/users/${id}/playlists`,
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "name": `${artist}'s Hidden Gems`,
                "description": `A playlist of ${artist}'s hidden gems`,
                "public": false
            })
        });
    const json = await data.json();
    return { id: json["id"], uri: json["uri"], external_url: json["external_urls"]["spotify"] };
}

export async function addSongsToPlaylist(playlist_id: string, songs: string[], token: string) {
    const data = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "uris": songs
            })
        });
    const json = await data.json();
    return json;
}