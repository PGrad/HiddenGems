<script setup lang="ts">
import { ref, watch } from 'vue';
import Search from './components/Search.vue'
import * as Api from "./api/api";

const promptValue = ref('');
const songs = ref<any[] | null>(null);
const img = ref<string>('');
const name = ref<string>('');

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
    const artistId = topData.tracks.items[0].artists[0].id;
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

  @media (prefers-color-scheme: dark) {
    .songs-table {
      background-color: rgba(0, 0, 0, .4);
    }
  }

  @media (prefers-color-scheme: light) {
    .songs-table {
      background-color: #8400ff;
    }
  }

  .songs-table {
    border-radius: 5%;
    list-style-type: none;
    display: flex;
    flex-direction: column;
    text-align: left;
    padding: 2em;
    gap: 1em;
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
</style>

<template>
  <main class=".main">
    <img src="./assets/logo.gif" class="logo" />
    <h1 class="title">
      <span class="first">H</span>idden <span class="second">G</span>ems
    </h1>
    <h3 v-if="songs === null">Find hidden gems from your favorite artists!</h3>
    <Search v-model:prompt-value="promptValue" />
    <ul v-if="songs !== null && songs.length > 0" class="songs-table" >
      <h3 class="artist-q">How well do you know <span class="artist-name">{{ name }}</span>?</h3>
      <img :src="img" class="artist-img" />
      <li v-for="song in songs" :key="song" >
        <a class="song-link" target="_blank" :href="song.url" >{{ song.name }}</a>
      </li>
    </ul>
    <p v-else-if="songs !== null && promptValue !== ''">Too popular, normie...</p>
  </main>
  <footer class="footer">Powered by Spotify Web API.<br/>Logo courtesy of wiki.hypixel.net.</footer>
</template>
