<script setup lang="ts">
import { ref } from 'vue';
const props = defineProps<{
    img: string,
    url: string,
    uri: string,
    name: string
    onLike?: (s: string) => Promise<void>
}>();

const clicked = ref<boolean>(false)

const handleClick = () => {
    clicked.value = true
    if (props.onLike) {
        props.onLike(props.uri)
    }
}
</script>

<style scoped>
  svg {
    color: #4ade80;
    cursor: pointer;
  }

  .song-link {
    border-bottom: solid white 1px;
    font-size: 22px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 15rem;
  }
</style>

<template>
    <img :src="img" class="w-15 inline-block h-fit rounded-t-md" />
    <a class="song-link no-underline text-green-400 hover:text-white" target="_blank" :href="url" >{{ name }}</a>
</template>