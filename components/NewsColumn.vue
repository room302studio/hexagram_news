<template>
  <div class="column">
    <h2 class="text-xl md:text-2xl lg:text-3xl font-['Karla'] font-extrabold border-b border-gray-200 pb-3 mb-6 md:mb-8 leading-none tracking-tight">
      {{ title }}
    </h2>
    <ul class="space-y-6 md:space-y-8">
      <HeadlineLink 
        v-for="article in articles" 
        :key="article.id" 
        :article="article" 
      />
    </ul>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  articles: {
    type: Array,
    required: true,
    validator: (prop) => {
      return prop.every(article =>
        article.id &&
        article.title &&
        article.url &&
        article.source &&
        article.timestamp
      )
    }
  }
})
</script>

<style scoped>
.column {
  break-inside: avoid;
  page-break-inside: avoid;
}
</style>