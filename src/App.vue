<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import Search from './components/Search.vue'
import Song from './components/Song.vue';
import * as Api from "./api/api";
import * as Auth from "./api/auth";
import { SongData } from "./types";
import "./App.css";

const promptValue = ref('');
const songs = ref<SongData[] | null>(null);
const likedSongs = ref<any[] | null>(null);
const recommendedSongs = ref<SongData[] | null>(null);
const img = ref<string>('');
const name = ref<string>('');
const errorMsg = ref<string>('Loading...');
const loggedIn = ref<boolean>(false);
const playlistUrl = ref<string | null>(null);
const avatarUrl = ref<string | null>(null);
const userId = ref<string>('');
const artistId = ref<string>('');

async function setRefreshToken(code: string): Promise<string> {
  if (!code)
    throw new Error('No auth code found');
  const token = await Auth.getAccessToken({
    access_token: code,
    type: 'auth_code'
  });
  sessionStorage.setItem('r_token', token[1]);
  return token[1];
}

async function getAccessToken(): Promise<string> {
  let r_token = sessionStorage.getItem('r_token');
  const code = Auth.getAuthCode();
  if (code && !r_token)
    r_token = await setRefreshToken(code);

  let new_token;
  if (r_token) {
    new_token = await Auth.getAccessToken({
      access_token: r_token,
      type: 'refresh_token'
    });
    sessionStorage.setItem('r_token', new_token[1]);
  } else {
    new_token = await Auth.getAccessToken({
      access_token: '',
      type: 'none'
    });
  }
  return new_token[0];
}

onMounted(async () => {
  const query = sessionStorage.getItem('query');
  if (query) {
    promptValue.value = query;
    sessionStorage.removeItem('query');
  }
  const r_token = sessionStorage.getItem('r_token');
  const auth_code = Auth.getAuthCode();
  if (auth_code) {
    loggedIn.value = true;
  } else if (r_token) {
    loggedIn.value = true;
  }
  if (loggedIn.value) {
    const [id, img] = await Api.getUser(await getAccessToken());
    userId.value = id;
    avatarUrl.value = img;
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
  debounce(async (value: string) => {
    playlistUrl.value = null;
    songs.value = [];
    recommendedSongs.value = [];
    errorMsg.value = 'Loading...';

    if (promptValue.value === '') return; // do nothing.
    const arr: any = [];
    // Spotify's API can't exactly match artists,
    // and if we search for hipster tracks it will
    // probably be artists that the user is not looking for.
    // The solution is to find the top track, which is probably
    // the artist, and filter on their ID.
    const token = await getAccessToken();
    const topTracks = await Api.getSongs(value, 1, false, token);
    artistId.value = topTracks[0]?.artists[0]?.id;
    if (artistId.value === undefined) {
      errorMsg.value = 'I don\'t even know who that is, hipster...';
      return;
    }
    const tracks = await Api.getSongs(value, 50, true, token);
    const songSet = new Set();
    tracks.forEach((item: any) => {
      if (item.artists[0].id !== artistId.value) return;

      // Some songs get added over and over
      // in greatest hits and stuff, ignore those.
      if (songSet.has(item.name)) return;

      songSet.add(item.name);
      arr.push({
        name: item.name,
        url: item.external_urls.spotify,
        uri: item.uri,
        img: item.album.images[0].url,
        albumId: item.album.id,
      });
    });
    songs.value = arr;
    const imgData = await Api.getArtist(artistId.value, token);
    name.value = imgData.name;
    img.value = imgData.images[0].url;
    errorMsg.value = 'Too popular, normie...';
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
  const r_token = sessionStorage.getItem('r_token');
  if (!auth_code && !r_token) {
    sessionStorage.setItem('query', promptValue.value);
    window.location.href = await Auth.getAuthUrl();
  }
  else if (userId.value) {
    const token = await getAccessToken();
    const playlist = await Api.createPlaylist(
      name.value, userId.value, token);
    const uris = songs.value!.map((song: any) => song.uri);
    const recommended_uris = recommendedSongs.value!.map((song: any) => song.uri);
    await Api.addSongsToPlaylist(playlist.id, [...uris, ...recommended_uris], token);
    playlistUrl.value = playlist.external_url;
  }
}

function getHighlights(songs: SongData[]) {
  const albumSet = new Set();
  const checkAlbum = (id: string) => {
    if (albumSet.has(id)) return false;
    albumSet.add(id);
    return true;
  };
  const highlights = songs.filter((song) => checkAlbum(song.albumId));
  return highlights;
}

async function handleLike(songId: string) {
  if (!likedSongs.value) {
    likedSongs.value = [songId];
  } else {
    likedSongs.value = [songId, ...likedSongs.value!];
  }

  const token = await getAccessToken();
  recommendedSongs.value = await Api.getRecommendations(artistId.value, likedSongs.value!, token);
}

function goToUrl(url: string) {
  console.log('going to url', url);
  window.open(url, "_blank");
}
</script>

<style scoped>
  .main {
    display: flex;
    flex-direction: column;
    gap: 2em
  }

  .songs-table {
    display: flex;
    flex-direction: column;
    text-align: left;
    padding: 2em;
    gap: 1em;
  }

  .songs-list {
    display: grid;
    width: 100%;
    place-items: center;
    grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
    list-style-type: none;
    flex-wrap: wrap;
    gap: 2rem;
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
      <img src="./assets/logo.gif" class="logo w-50" />
      <h1 class="text-5xl m-2">
        <span class="first">H</span>idden <span class="second">G</span>ems
      </h1>
      <h3 class="m-2 text-lg" v-if="songs === null">Find rare songs from your favorite artists!</h3>
      <Search v-model:prompt-value="promptValue" :search-handler="debouncedSearch" />
    </div>
    <div v-if="songs !== null && songs.length > 0" class="songs-table items-center bg-gradient-to-r from-purple-700 to-slate-500 dark:from-slate-500 dark:via-slate-600 dark:to-purple-900" >
      <h3 class="artist-q">How well do you know <span class="artist-name">{{ name }}</span>?</h3>
      <img :src="img" class="artist-img" />
      <button @click="makePlaylist" v-if="playlistUrl === null" class="btn btn-green-shadow text-lg flex items-center justify-between gap-2">
        <img v-if="!loggedIn || avatarUrl === null" src="./assets/spotify_icon.svg" class="w-10" />
        <img v-else :src="avatarUrl" class="w-10 rounded-full" />
        {{ loggedIn ? 'Make a playlist' : 'Login to Spotify'}}
      </button>
      <a class="playlist-link anchor-no-highlight btn btn-green-to-blue text-lg" v-if="playlistUrl !== null" target="_blank" :href="playlistUrl">
        {{ name }} Playlist
      </a>
      <ul class="songs-list">
        <li v-for="(song, idx) in getHighlights(songs)" @click="goToUrl(song.url)" :key="idx" class="flex flex-col gap-4 mt-2 items-center bg-slate-100 dark:bg-slate-800 pb-3 rounded-md w-80 drop-shadow-[0.2rem_0.5rem_0.5rem_rgba(0,0,0,0.8)] cursor-pointer hover:bg-slate-700" >
          <Song :img="song.img" :uri="song.uri" :url="song.url" :name="song.name" :on-like="handleLike" />
        </li>
      </ul>
    </div>
    <p class="errMsg" v-else-if="songs !== null && promptValue !== ''">{{ errorMsg }}</p>
    <div v-if="recommendedSongs !== null && recommendedSongs.length > 0">
      <h2>You might also like:</h2>
      <li v-for="(song, idx) in recommendedSongs" :key="idx" class="flex gap-2 mt-2 items-center bg-slate-100 dark:bg-slate-800 p-2 pl-3 rounded-md" >
          <Song :img="song.img" :uri="song.uri" :url="song.url" :name="song.name" />
      </li>
    </div>
  </main>
  <footer class="footer">Powered by Spotify Web API.<br/>Logo courtesy of wiki.hypixel.net.</footer>
</template>
