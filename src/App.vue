<script setup lang="ts">
import { ref, watch } from 'vue';
import Search from './components/Search.vue'
import * as Api from "./api/api";

const promptValue = ref('');
const songs = ref<any[] | null>(null);
const img = ref<string>('');
const name = ref<string>('');
const errorMsg = ref<string>('Too popular, normie...');

const debounce = (fn: any, delay: number) => {
  let timeoutId: number;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const debouncedSearch =
  debounce(async (value: any) => {
    if (promptValue.value === '') return; // do nothing.
    const arr: any = [];
    // Spotify's API can't exactly match artists,
    // and if we search for hipster tracks it will
    // probably be artists that the user is not looking for.
    // The solution is to find the top track, which is probably
    // the artist, and filter on their ID.
    const topData = await Api.getSongs(value, 1, false);
    const artistId = topData.tracks.items[0]?.artists[0]?.id;
    if (artistId === undefined) {
      songs.value = [];
      errorMsg.value = 'I don\'t even know who that is, hipster...';
      return;
    }
    errorMsg.value = 'Too popular, normie...';
    const songData = await Api.getSongs(value, 50, true);
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
        url: item.external_urls.spotify
      });
    });
    songs.value = arr;
    const imgData = await Api.getArtist(artistId);
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

</script>

<style scoped>
  .title {
    margin-top: 0;
  }

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

  @media (min-width: 1280px) {
    .songs-list {
      column-count: 3;
    }
  }

  @media (prefers-color-scheme: dark) {
    .songs-table {
      background: linear-gradient(rgba(0, 0, 0, .4), grey);
    }
  }

  @media (prefers-color-scheme: light) {
    .songs-table {
      background: linear-gradient(#8400ff, #9198e5);
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

  @media (prefers-color-scheme: dark) {
    .song-link {
      color: greenyellow;
    }
  }

  @media (prefers-color-scheme: light) {
    .song-link {
      color: #00FF84;
    }
  }

  .song-link {
    border-bottom: solid white 1px;
    font-size: 24px;
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
      color: red;
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
    <div class="search">
      <img src="./assets/logo.gif" class="logo" />
      <h1 class="title">
        <span class="first">H</span>idden <span class="second">G</span>ems
      </h1>
      <h3 v-if="songs === null">Find hidden gems from your favorite artists!</h3>
      <Search v-model:prompt-value="promptValue" />
    </div>
    <div v-if="songs !== null && songs.length > 0" class="songs-table" >
      <h3 class="artist-q">How well do you know <span class="artist-name">{{ name }}</span>?</h3>
      <img :src="img" class="artist-img" />
      <ul class="songs-list">
        <li v-for="song in songs" :key="song" >
          <a class="song-link" target="_blank" :href="song.url" >{{ song.name }}</a>
        </li>
      </ul>
    </div>
    <p class="errMsg" v-else-if="songs !== null && promptValue !== ''">{{ errorMsg }}</p>
  </main>
  <footer class="footer">Powered by Spotify Web API.<br/>Logo courtesy of wiki.hypixel.net.</footer>
</template>
