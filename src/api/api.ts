
export async function getAccessToken(): Promise<string> {
    const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
    const formData = new URLSearchParams();
    formData.append("grant_type", "client_credentials");
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
        return json["access_token"] as string;
    }

    return "";
}

export async function getSongs(artist: string, limit: number, hipster: boolean) {
    const token = await getAccessToken();
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

export async function getArtist(id: string) {
    const token = await getAccessToken();
    const data = await fetch(`https://api.spotify.com/v1/artists/${id}`,
        {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
    const json = await data.json();
    return json;
}

/* export function initOpenAI() {
    const key = import.meta.env.VITE_OPENAI_API_KEY;
    if (!key)
        throw new Error("api key is not defined");

    config = new Configuration({
        organization: "org-PLOQrmXXbo0UNOqoMEwG6lKE",
        apiKey: key,
    });

    openai = new OpenAIApi(config);
}

export async function getSongs(artist: string) {
    const prompt = `
        Provide me with names and only the names of 10 songs by
        the artist ${artist} that are not well known songs and
        are separated by commas with no quotes and no numbers.
    `;
    return openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 4000
    });
} */

/* function generateRandomString(length) {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier) {
  function base64encode(string: ArrayBuffer) {
    return btoa(String.fromCharCode.apply(null,
        Array.from(new Uint8Array(string)))
    )
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);

  return base64encode(digest);
}

const clientId = 'YOUR_CLIENT_ID';
const redirectUri = 'http://localhost:8080';

let codeVerifier = generateRandomString(128);

generateCodeChallenge(codeVerifier).then(codeChallenge => {
  let state = generateRandomString(16);
  let scope = 'user-read-private user-read-email';

  localStorage.setItem('code_verifier', codeVerifier);

  let args = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scope,
    redirect_uri: redirectUri,
    state: state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge
  });

  window.location = 'https://accounts.spotify.com/authorize?' + args;
}); */
