async function callAPI(url: string, token: string, props?: object) {
    const data = await fetch(`https://api.spotify.com/v1/${url}`,
        {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            ...props,
        });
    return await data.json();
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

export async function getRecommendations(artist: string, songs: string[], token: string) {
    const songUris = songs.map(song => song.split(":")[2]);
    console.log(artist, songs);
    const json = await callAPI(`recommendations?seed_artists=${artist}&seed_tracks=${songUris.join(",")}`, token);
    console.log(json["tracks"]);
    return json["tracks"].map((song: any) => (
        {
            "name": song.name,
            "url": song.external_urls.spotify,
            "uri": song.uri,
            "img": song.album.images[0].url
        }
    ));
}