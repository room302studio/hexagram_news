<template>
  <NuxtLayout name="default">
    <div class="min-h-screen bg-white">
      <!-- Header -->
      <header class="border-b px-4 py-6">
        <div class="max-w-6xl mx-auto">
          <div class="flex items-baseline justify-between">
            <div>
              <h1 class="text-3xl md:text-4xl font-bold text-black">
                Hexagram News
              </h1>
              <p class="text-sm text-gray-600 mt-1">
                Tech news without the bullshit
              </p>
            </div>
            <div class="flex gap-4 text-sm">
              <NuxtLink to="/dense" class="hover:underline"
                >Dense View</NuxtLink
              >
              <span class="text-gray-500">{{
                new Date().toLocaleDateString()
              }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-6xl mx-auto px-4 py-8">
        <!-- Lead Story -->
        <section v-if="leadStory" class="mb-12 pb-8 border-b">
          <div class="grid md:grid-cols-3 gap-8">
            <div class="md:col-span-2">
              <h2 class="text-2xl md:text-3xl font-bold mb-4 leading-tight">
                <a
                  :href="leadStory.url"
                  target="_blank"
                  class="hover:underline"
                >
                  {{ getDisplayTitle(leadStory) }}
                </a>
              </h2>
              <p
                v-if="leadStory.summary"
                class="text-gray-700 leading-relaxed mb-4 text-lg"
              >
                {{ leadStory.summary }}
              </p>
              <div class="flex items-center gap-4 text-sm text-gray-500">
                <span class="font-medium">{{
                  getSourceLabel(leadStory.source)
                }}</span>
                <span>{{
                  formatTime(leadStory.published_at || leadStory.created_at)
                }}</span>
                <div class="flex gap-2">
                  <NuxtLink
                    v-for="tag in (leadStory.tags || []).slice(0, 3)"
                    :key="tag"
                    :to="`/tag/${tag}`"
                    class="hover:underline"
                  >
                    {{ tag }}
                  </NuxtLink>
                </div>
              </div>
            </div>
            <div v-if="getMediaUrl(leadStory)" class="md:col-span-1">
              <img
                :src="getMediaUrl(leadStory)"
                :alt="getDisplayTitle(leadStory)"
                class="w-full h-48 object-cover border"
              />
            </div>
          </div>
        </section>

        <!-- Two Column Layout -->
        <div class="grid md:grid-cols-2 gap-12">
          <!-- Left Column - Latest -->
          <section>
            <h3 class="text-lg font-bold mb-6 pb-2 border-b">Latest</h3>
            <div class="space-y-6">
              <article
                v-for="scrap in latestScraps"
                :key="scrap.id"
                class="pb-4 border-b border-gray-100 last:border-b-0"
              >
                <h4 class="font-bold mb-2 text-lg leading-tight">
                  <a :href="scrap.url" target="_blank" class="hover:underline">
                    {{ getDisplayTitle(scrap) }}
                  </a>
                </h4>
                <p
                  v-if="scrap.content || scrap.summary"
                  class="text-gray-700 mb-3 line-clamp-3"
                >
                  {{ (scrap.summary || scrap.content || '').substring(0, 200)
                  }}{{
                    (scrap.summary || scrap.content || '').length > 200
                      ? '...'
                      : ''
                  }}
                </p>
                <div class="flex items-center gap-4 text-sm text-gray-500">
                  <span>{{ getSourceLabel(scrap.source) }}</span>
                  <span>{{
                    formatTime(scrap.published_at || scrap.created_at)
                  }}</span>
                  <div v-if="scrap.tags?.length" class="flex gap-2">
                    <NuxtLink
                      v-for="tag in scrap.tags.slice(0, 2)"
                      :key="tag"
                      :to="`/tag/${tag}`"
                      class="hover:underline"
                    >
                      {{ tag }}
                    </NuxtLink>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <!-- Right Column - Visual Stories -->
          <section>
            <h3 class="text-lg font-bold mb-6 pb-2 border-b">Visual Stories</h3>
            <div class="space-y-6">
              <article
                v-for="scrap in curatedScraps"
                :key="scrap.id"
                class="pb-4 border-b border-gray-100 last:border-b-0"
              >
                <div v-if="getMediaUrl(scrap)" class="mb-3">
                  <img
                    :src="getMediaUrl(scrap)"
                    :alt="getDisplayTitle(scrap)"
                    class="w-full h-40 object-cover border"
                  />
                </div>
                <h4 class="font-bold mb-2 leading-tight">
                  <a :href="scrap.url" target="_blank" class="hover:underline">
                    {{ getDisplayTitle(scrap) }}
                  </a>
                </h4>
                <p v-if="scrap.summary" class="text-gray-700 mb-3">
                  {{ scrap.summary.substring(0, 150)
                  }}{{ scrap.summary.length > 150 ? '...' : '' }}
                </p>
                <div class="flex flex-wrap gap-2 text-sm">
                  <NuxtLink
                    v-for="tag in (scrap.tags || []).slice(0, 3)"
                    :key="tag"
                    :to="`/tag/${tag}`"
                    class="text-gray-600 hover:underline"
                  >
                    {{ tag }}
                  </NuxtLink>
                </div>
              </article>
            </div>
          </section>
        </div>

        <!-- Load More -->
        <div v-if="hasMoreScraps" class="mt-12 text-center">
          <button
            :disabled="isLoading"
            class="px-6 py-3 border hover:bg-gray-50 transition-colors"
            @click="loadMore"
          >
            {{ isLoading ? 'Loading...' : 'Load More Stories' }}
          </button>
        </div>
      </main>

      <!-- Footer -->
      <footer class="border-t mt-12 py-8">
        <div class="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            {{ totalScraps }} stories • Updated
            {{ new Date().toLocaleTimeString() }}
          </p>
        </div>
      </footer>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { formatDistanceToNow } from 'date-fns'

// Use the enhanced composable
const {
  scraps,
  isLoading,
  totalScraps,
  hasMoreScraps,
  loadMore: loadMoreScraps,
  fetchScraps,
  getMediaUrl,
  getDisplayTitle
} = useScraps()

// Fetch initial data with content filter already applied
await fetchScraps({
  limit: 30,
  sortBy: 'newest'
})

// Computed properties for different sections
const leadStory = computed(() => {
  // Find the first scrap with substantial content AND an image
  return (
    scraps.value.find((s) => (s.content || s.summary) && getMediaUrl(s)) ||
    scraps.value[0]
  )
})

const latestScraps = computed(() => {
  return scraps.value.filter((s) => s.id !== leadStory.value?.id).slice(0, 10)
})

const curatedScraps = computed(() => {
  // Prioritize scraps with images and summaries
  return scraps.value
    .filter(
      (s) => s.id !== leadStory.value?.id && (s.summary || getMediaUrl(s))
    )
    .slice(0, 8)
})

// Helper functions
const formatTime = (dateString) => {
  if (!dateString) return 'unknown'
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  } catch {
    return 'recently'
  }
}

const getSourceLabel = (source) => {
  const sourceMap = {
    pinboard: 'Pinboard',
    github: 'GitHub',
    arena: 'Are.na',
    mastodon: 'Mastodon',
    twitter: 'Twitter',
    youtube: 'YouTube',
    lock: 'Private'
  }
  return sourceMap[source?.toLowerCase()] || 'Unknown'
}

const loadMore = () => {
  loadMoreScraps()
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
