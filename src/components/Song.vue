<script setup lang="ts">
defineProps<{
    img: string,
    url: string,
    uri: string,
    name: string
    onLike?: (s: string) => Promise<void>
}>();

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
  }
</style>

<template>
    <img :src="img" class="w-fit inline-block h-fit rounded-t-md" />
    <a class="@max-sm:max-w-40 max-w-60 song-link no-underline text-green-400 hover:text-white" target="_blank" :href="url" >{{ name }}</a>
</template>