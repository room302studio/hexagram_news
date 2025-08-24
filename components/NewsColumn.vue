<template>
  <div class="column">
    <h2
      class="text-xl md:text-2xl lg:text-3xl font-['Karla'] font-extrabold border-b border-gray-200 pb-3 mb-6 md:mb-8 leading-none tracking-tight"
    >
      {{ title }}
    </h2>

    <!-- Loading state -->
    <div v-if="loading" class="space-y-6">
      <div v-for="n in 3" :key="n" class="animate-pulse">
        <div class="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-100 rounded w-1/4"></div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-red-500 text-sm font-mono">
      {{ error.message }}
    </div>

    <!-- Empty state -->
    <div v-else-if="!articles.length" class="text-gray-500 text-sm font-mono">
      No articles found
    </div>

    <!-- Articles list -->
    <ul v-else class="space-y-6 md:space-y-8">
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
      return prop.every(
        (article) =>
          article.id &&
          article.title &&
          article.url &&
          article.source &&
          article.timestamp
      )
    }
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: Error,
    default: null
  }
})
</script>

<style scoped>
.column {
  break-inside: avoid;
  page-break-inside: avoid;
}
</style>
