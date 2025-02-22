<template>
  <li class="mb-4 last:mb-0 group md:mb-6">
    <article>
      <!-- Title -->
      <a :href="article.url" class="block group">
        <h3
          class="text-sm md:text-base lg:text-lg font-['Karla'] leading-tight font-extrabold group-hover:text-blue-600 transition-colors">
          {{ article.title }}
        </h3>
      </a>

      <!-- Summary -->
      <div v-if="article.summary"
        class="mt-1 text-xs font-['Newsreader'] leading-snug text-gray-600 prose-em:italic prose-strong:font-semibold md:text-sm lg:text-base"
        v-html="markdownToHtml(article.summary)" />

      <!-- Metadata and Tags -->
      <div class="mt-1 flex flex-col gap-1">
        <!-- Source and time -->
        <div class="flex items-baseline gap-1.5">
          <MetaData class="font-bold uppercase tracking-wider">{{ article.source }}</MetaData>
          <MetaData class="tabular-nums">{{ formatDate(article.timestamp) }}</MetaData>
        </div>

        <!-- Tags -->
        <div class="flex flex-wrap gap-0.5">
          <MetaData v-for="tag in article.tags" :key="tag" class="bg-gray-50 px-1 py-px rounded-sm">
            {{ tag }}
          </MetaData>
        </div>
      </div>
    </article>
  </li>
</template>

<script setup>
import { formatDistance } from 'date-fns'
import { marked } from 'marked'

const props = defineProps({
  article: {
    type: Object,
    required: true,
    validator: (prop) => {
      return prop.id &&
        prop.title &&
        prop.url &&
        prop.source &&
        prop.timestamp &&
        Array.isArray(prop.tags)
    }
  }
})

function formatDate(timestamp) {
  if (!timestamp) return ''
  return formatDistance(new Date(timestamp), new Date(), { addSuffix: true })
}

function markdownToHtml(text) {
  if (!text) return ''
  return marked(text)
}
</script>

<style>
.prose-em em::before,
.prose-em em::after {
  content: '"';
  font-family: Monaspace, monospace;
}
</style>