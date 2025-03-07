async function callAPI(url: string, token: string, props?: object) {
    const data = await fetch(`https://api.spotify.com/v1/${url}`,
        {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            ...props,
        });

    try {
        return await data.json();
    } catch (e) {
        return {};
    }
}

export async function getSongs(artist: string, limit: number, hipster: boolean, token: string) {
    const escaped = encodeURIComponent(artist);
    let filteredSongs: any[] = [];
    let offset = 0;
    while (filteredSongs.length < limit && offset < 1000) {
        const songs = await callAPI(`search?q=artist:${escaped}%20${hipster ? "tag:hipster" : ""}&type=track&limit=50&offset=${offset}`, token);
        filteredSongs = filteredSongs.concat(songs.tracks.items.filter((song: any) => song.album.album_type !== "compilation"));
        offset += 50;
        if (songs.length === 0) break;
    }
    return filteredSongs;
}

export async function getUserTopArtists(token: string) {
    const json = await callAPI("me/top/artists", token);
    return json?.["items"].map((artist: any) => artist?.["name"] ?? '') ?? [];
}

export async function getCurrentArtist(token: string) {
    const json = await callAPI("me/player/currently-playing", token);
    return json?.["item"]?.["artists"]?.[0]?.["name"] ?? null;
}

export async function getArtist(id: string, token: string) {
    return await callAPI(`artists/${id}`, token);
}

export async function getUser(token: string): Promise<[string, string]> {
    const json = await callAPI("me", token);
    const img = json["images"].length > 0 ? json["images"][0]["url"] : null;
    return [json["id"], img];
}

export async function createPlaylist(artist: string, id: string, token: string) {
    const json = await callAPI(`users/${id}/playlists`, token,
        {
            method: "POST",
            body: JSON.stringify({
                "name": `${artist}'s Hidden Gems`,
                "description": `A playlist of ${artist}'s hidden gems`,
                "public": false
            })
        });

    return { id: json["id"], uri: json["uri"], external_url: json["external_urls"]["spotify"] };
}

export async function getPlaylist(id: string, token: string) {
    const json = await callAPI(`playlists/${id}`, token);
    return { img: json["images"][0]["url"] };
}

export async function addSongsToPlaylist(playlist_id: string, songs: string[], token: string) {
    return await callAPI(`playlists/${playlist_id}/tracks`, token,
        {
            method: "POST",
            body: JSON.stringify({
                "uris": songs
            })
        });
}
