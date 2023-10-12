<script setup lang="ts">

import { computed } from 'vue';

const props = defineProps({ 
  'promptValue': String,
  'searchHandler': Function
});
const emit = defineEmits([ 'update:promptValue' ]);

const value = computed({
  get() {
    return props.promptValue;
  },
  set(value) {
    emit('update:promptValue', value);
  },
});

const searchHandler = () => {
  props.searchHandler!(value.value);
}

</script>

<template>
  <div class="flex flex-column items-center">
    <input class="artist-input bg-purple-200 dark:bg-slate-500" v-model="value" placeholder="search for your favorite artist..." />
    <button class="search-button bg-lime-500" @click="searchHandler">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
  .artist-input {
    font-size: 20px;
    padding: .4rem;
    border-radius: .4em 0 0 .4em;
  }
  .search-button {
    padding: .52rem;
    border-radius: 0 .4em .4em 0;
  }
</style>
