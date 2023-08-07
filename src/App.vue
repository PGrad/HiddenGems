<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import Search from './components/Search.vue'
import * as Api from "./api/api";
import * as Auth from "./api/auth";
import "./App.css";

const promptValue = ref('');
const songs = ref<any[] | null>(null);
const img = ref<string>('');
const name = ref<string>('');
const errorMsg = ref<string>('Too popular, normie...');
const loggedIn = ref<boolean>(false);
const playlistUrl = ref<string | null>(null);

async function setRefreshToken(code: string): Promise<string> {
  if (!code)
    throw new Error('No auth code found');
  const token = await Auth.getAccessToken({
    access_token: code,
    type: 'auth_code'
  });
  localStorage.setItem('r_token', token[1]);
  return token[1];
}

async function getAccessToken(): Promise<string> {
  let r_token = localStorage.getItem('r_token');
  const code = Auth.getAuthCode();
  if (code && !r_token)
    r_token = await setRefreshToken(code);

  let new_token;
  if (r_token) {
    new_token = await Auth.getAccessToken({
      access_token: r_token,
      type: 'refresh_token'
    });
    localStorage.setItem('r_token', new_token[1]);
  } else {
    new_token = await Auth.getAccessToken({
      access_token: '',
      type: 'none'
    });
  }
  return new_token[0];
}

onMounted(() => {
  const query = localStorage.getItem('query');
  if (query) {
    promptValue.value = query;
    localStorage.removeItem('query');
  }
  const r_token = localStorage.getItem('r_token');
  const auth_code = Auth.getAuthCode();
  if (auth_code) {
    loggedIn.value = true;
  } else if (r_token) {
    loggedIn.value = true;
  }
});

const debounce = (fn: any, delay: number) => {
  let timeoutId: number;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const debouncedSearch =
  debounce(async (value: any) => {
    playlistUrl.value = null;
    if (promptValue.value === '') return; // do nothing.
    const arr: any = [];
    // Spotify's API can't exactly match artists,
    // and if we search for hipster tracks it will
    // probably be artists that the user is not looking for.
    // The solution is to find the top track, which is probably
    // the artist, and filter on their ID.
    const token = await getAccessToken();
    const topData = await Api.getSongs(value, 1, false, token);
    const artistId = topData.tracks.items[0]?.artists[0]?.id;
    if (artistId === undefined) {
      songs.value = [];
      errorMsg.value = 'I don\'t even know who that is, hipster...';
      return;
    }
    errorMsg.value = 'Too popular, normie...';
    const songData = await Api.getSongs(value, 50, true, token);
    songs.value = [];
    const songSet = new Set();
    songData.tracks.items.forEach((item: any) => {
      if (item.artists[0].id !== artistId) return;

      // Some songs get added over and over
      // in greatest hits and stuff, ignore those.
      if (songSet.has(item.name)) return;

      songSet.add(item.name);
      arr.push({
        name: item.name,
        url: item.external_urls.spotify,
        uri: item.uri,
      });
    });
    songs.value = arr;
    const imgData = await Api.getArtist(artistId, token);
    name.value = imgData.name;
    img.value = imgData.images[0].url;
  }, 1000);

/* window.onSpotifyIframeApiReady = (IFrameAPI) => {
  const element = document.getElementById('embed-iframe');=
  const options = {
      uri: 'spotify:episode:7makk4oTQel546B0PZlDM5'
    };
  const callback = (EmbedController) => {};
  IFrameAPI.createController(element, options, callback); 
} */

watch(promptValue, async (value) => {
  if (value === '') {
    songs.value = null;
    return; // do nothing.
  }
  debouncedSearch(value);
});

async function makePlaylist() {
  const auth_code = Auth.getAuthCode();
  const r_token = localStorage.getItem('r_token');
  if (!auth_code && !r_token) {
    localStorage.setItem('query', promptValue.value);
    window.location.href = await Auth.getAuthUrl();
  }
  else {
    const token = await getAccessToken();
    const user = await Api.getUser(token);
    const playlist = await Api.createPlaylist(
      name.value, user, token);
    const uris = songs.value!.map((song: any) => song.uri);
    await Api.addSongsToPlaylist(playlist.id, uris, token);
    playlistUrl.value = playlist.external_url;
  }
}
</script>

<style scoped>
  .main {
    display: flex;
    flex-direction: column;
    gap: 2em
  }

  @media (min-width: 1024px) {
    .songs-list {
      column-count: 2;
      column-width: 10em;
    }
  }

  @media (min-width: 1400px) {
    .songs-list {
      column-count: 3;
    }
  }

  .songs-table {
    display: flex;
    flex-direction: column;
    text-align: left;
    padding: 2em;
    gap: 1em;
  }

  .songs-list {
    list-style-type: decimal;
  }

  .song-link {
    border-bottom: solid white 1px;
    font-size: 22px;
  }

  .song-list li {
    width: 10em;
  }

  .artist-img {
    width: 200px;
    height: 200px;
    align-self: center;
    border-radius: 50%;
  }

  .artist-q {
    color: white;
    text-align: center;
    font-size: 24px;
  }

  @media (prefers-color-scheme: dark) {
    .artist-name {
      color: orange;
    }
  }

  @media (prefers-color-scheme: light) {
    .artist-name {
      color: orange;
    }
  }

  .first {
    color: orange;
  }

  .second {
    color: blueviolet;
  }

  .footer {
    margin-top: 2em;
  }

</style>

<template>
  <main class="main">
    <div class="search flex flex-col items-center">
      <img src="./assets/logo.gif" class="logo w-60" />
      <h1 class="text-5xl m-2">
        <span class="first">H</span>idden <span class="second">G</span>ems
      </h1>
      <h3 class="m-2 text-lg" v-if="songs === null">Find hidden gems from your favorite artists!</h3>
      <Search v-model:prompt-value="promptValue" />
    </div>
    <div v-if="songs !== null && songs.length > 0" class="songs-table items-center bg-gradient-to-r from-purple-700 to-slate-600 dark:from-slate-500 dark:via-slate-600 dark:to-purple-900" >
      <h3 class="artist-q">How well do you know <span class="artist-name">{{ name }}</span>?</h3>
      <img :src="img" class="artist-img" />
      <t-button @click="makePlaylist" v-if="playlistUrl === null" class="btn btn-green-shadow text-lg flex items-center justify-between gap-2">
        <img src="./assets/spotify_icon.svg" class="w-10" />
        {{ loggedIn ? 'Make a playlist' : 'Login to Make a Playlist!'}}
      </t-button>
      <a class="playlist-link anchor-no-highlight btn btn-green-to-blue text-lg" v-if="playlistUrl !== null" target="_blank" :href="playlistUrl">Playlist</a>
      <ul class="songs-list">
        <li v-for="song in songs" :key="song" >
          <a class="song-link text-green-400 hover:text-white" target="_blank" :href="song.url" >{{ song.name }}</a>
        </li>
      </ul>
    </div>
    <p class="errMsg" v-else-if="songs !== null && promptValue !== ''">{{ errorMsg }}</p>
  </main>
  <footer class="footer">Powered by Spotify Web API.<br/>Logo courtesy of wiki.hypixel.net.</footer>
</template>
