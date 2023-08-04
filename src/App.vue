<script setup lang="ts">
import { ref, watch } from 'vue';
import Search from './components/Search.vue'
import * as Api from "./api/api";

const promptValue = ref('');
const songs = ref<any[]>([]);
const img = ref<string>('');
const name = ref<string>('');

const debounce = (fn: any, delay: number) => {
  let timeoutId: number;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const debouncedLog =
  debounce(async (value: any) => {
    const arr: any = [];
    // Spotify's API can't exactly match artists,
    // and if we search for hipster tracks it will
    // probably be artists that the user is not looking for.
    // The solution is to find the top track, which is probably
    // the artist, and filter on their ID.
    const topData = await Api.getSongs(value, 1, false);
    const artistId = topData.tracks.items[0].artists[0].id;
    const songData = await Api.getSongs(value, 10, true);
    songData.tracks.items.forEach((item: any) => {
      if (item.artists[0].id !== artistId) return;

      arr.push({
        name: item.name,
        url: item.external_urls.spotify
      });
    });
    songs.value = arr;
    const imgData = await Api.getArtist(artistId);
    console.log(imgData);
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
  debouncedLog(value);
});

</script>

<style scoped>
  .songs-table {
    background-color: rgba(0, 0, 0, .4);
    border-radius: 5%;
    list-style-type: none;
    display: flex;
    flex-direction: column;
    text-align: left;
    padding: 2em;
    gap: 1em;
  }

  .song-link {
    color: greenyellow;
    border-bottom: solid white 1px;
    font-size: 20px;
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
  }

  .artist-name {
    color: red;
  }

  .first {
    color: orange;
  }

  .second {
    color: blueviolet;
  }
</style>

<template>
  <h1 class="title">
    <span class="first">H</span>idden <span class="second">G</span>ems
  </h1>
  <Search v-model:prompt-value="promptValue" />
  <ul v-if="songs.length > 0" class="songs-table" >
    <h3 class="artist-q">How well do you know <span class="artist-name">{{ name }}</span>?</h3>
    <img :src="img" class="artist-img" />
    <li v-for="song in songs" :key="song" >
      <a class="song-link" :href="song.url" >{{ song.name }}</a>
    </li>
  </ul>
  <p v-else>Too popular, normie...</p>
</template>
