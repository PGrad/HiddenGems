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
