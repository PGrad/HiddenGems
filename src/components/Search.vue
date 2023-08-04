<script setup lang="ts">

import { computed } from 'vue';

const props = defineProps({ 'promptValue': String });
const emit = defineEmits([ 'update:promptValue' ]);

const value = computed({
  get() {
    return props.promptValue;
  },
  set(value) {
    emit('update:promptValue', value);
  },
});

</script>

<template>
  <input class="artist-input" v-model="value" placeholder="search for your favorite artist..." />
</template>

<style scoped>
  .artist-input {
    font-size: 20px;
    padding: .4em;
    border-radius: .4em;
  }
</style>
