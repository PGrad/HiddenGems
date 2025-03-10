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
const img = ref<string>('');
const name = ref<string>('');
const errorMsg = ref<string>('Loading...');
const loggedIn = ref<boolean>(false);
const playlistUrl = ref<string | null>(null);
const avatarUrl = ref<string>('');
const userId = ref<string>('');
const artistId = ref<string>('');
const topArtists = ref<string[]>([]);
const idx = ref<number>(0);
const currentArtist = ref<string>('');

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
    try {
      const currentArtist = await Api.getCurrentArtist(await getAccessToken());
      if (currentArtist) {
        topArtists.value.push(currentArtist);
      }
      topArtists.value.push(...(await Api.getUserTopArtists(await getAccessToken())));
    } catch (e) {
      console.error('Error getting current artist', e);
    }
  }
});

const debounce = (fn: any, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const debouncedSearch =
  debounce(async (value: string) => {
    playlistUrl.value = null;
    songs.value = [];
    errorMsg.value = 'Loading...';
    const noResults = 'Try another artist from your favorites:';

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
      errorMsg.value = noResults;
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
    errorMsg.value = noResults;
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

watch([idx, userId, topArtists], (new_values, _) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      if (new_values[2].length > 0) {
        const num = (new_values[0] + 1) % new_values[2].length;
        idx.value = num;
        currentArtist.value = new_values[2][num];
      }
    }, 1000);
  },
  { immediate: true, deep: true }
);

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
    await Api.addSongsToPlaylist(playlist.id, [...uris], token);
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
    list-style-type: none;
    flex-wrap: wrap;
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
    <section class="search flex flex-col items-center">
      <img src="./assets/logo.gif" class="logo w-50" />
      <h1 class="text-5xl m-2">
        <span class="first">H</span>idden <span class="second">G</span>ems
      </h1>
      <Search v-if="loggedIn && avatarUrl !== ''" v-model:prompt-value="promptValue" :search-handler="debouncedSearch" />
      <h3 v-if="currentArtist !== '' && songs === null" class="mt-6 inline-flex flex-col justify-between gap-1 m-2 text-lg">
        Find rare songs from <span class="animate-bounce artist-name w-60 md:w-100 whitespace-nowrap overflow-hidden text-ellipsis" >{{ currentArtist }}</span>
      </h3>
      <button v-if="!loggedIn || avatarUrl === ''" @click="makePlaylist" class="btn btn-green-shadow text-lg flex items-center justify-between gap-2 mt-2">
        <img src="./assets/spotify_icon.svg" class="w-10" />
        Login to Spotify
      </button>
    </section>
    <section v-if="songs !== null && songs.length > 0" class="songs-table items-center bg-linear-to-r from-purple-700 to-slate-500 dark:from-slate-500 dark:via-slate-600 dark:to-purple-900" >
      <h3 class="artist-q">How well do you know <span class="artist-name">{{ name }}</span>?</h3>
      <img :src="img" class="artist-img" />
      <button @click="makePlaylist" v-if="loggedIn && avatarUrl !== '' && playlistUrl === null" class="btn btn-green-shadow text-lg flex items-center justify-between gap-2">
        <img :src="avatarUrl" class="w-10 rounded-full" />
        Make a playlist
      </button>
      <a class="playlist-link anchor-no-highlight btn btn-green-to-blue text-lg" v-if="playlistUrl !== null" target="_blank" :href="playlistUrl">
        {{ name }} Playlist
      </a>
      <ul class="grid songs-list gap-2 @container grid-cols-[repeat(auto-fill,minmax(15rem,1fr)) md:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]"> 
        <li v-for="(song, idx) in getHighlights(songs)" @click="goToUrl(song.url)" :key="idx" class="flex flex-col gap-4 mt-2 items-center bg-slate-100 dark:bg-slate-800 pb-3 rounded-md w-50 @xs:max-md:w-60 @md:w-80 drop-shadow-[0.2rem_0.5rem_0.5rem_rgba(0,0,0,0.8)] cursor-pointer hover:bg-slate-700" >
          <Song :img="song.img" :uri="song.uri" :url="song.url" :name="song.name" />
        </li>
      </ul>
    </section>
    <section v-else-if="songs !== null && promptValue !== ''">
      <p class="errMsg" >{{ errorMsg }}</p>
      <ul v-if="errorMsg !== 'Loading...'" class="mt-2 gap-1 gap-y-3 grid songs-list @container grid-cols-[repeat(auto-fill,minmax(5rem,1fr)) md:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
        <li v-for="artist in topArtists" class="button bg-slate-100 dark:bg-slate-800 p-2 pl-3 rounded-md w-fit drop-shadow-[0.2rem_0.5rem_0.5rem_rgba(0,0,0,0.8)] cursor-pointer hover:bg-slate-200" @click="promptValue = artist">
          {{ artist }}
        </li>
      </ul>
    </section>
  </main>
  <footer class="footer">Powered by Spotify Web API.<br/>Logo courtesy of wiki.hypixel.net.</footer>
</template>
