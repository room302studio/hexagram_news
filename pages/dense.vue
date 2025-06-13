<template>
  <div class="min-h-screen bg-black text-zinc-100">
    <!-- Fixed Header -->
    <header class="sticky top-0 z-50 backdrop-blur-sm bg-black/80">
      <div class="container mx-auto px-3 py-2">
        <div class="flex items-baseline justify-between font-mono text-xs">
          <div class="flex items-baseline gap-4">
            <h1 class="text-zinc-100 font-medium">~/scraps</h1>
            <span class="text-zinc-500">{{ totalScraps }} items</span>
            <span class="text-zinc-600">|</span>
            <span class="text-zinc-500">{{ Object.keys(groupedScraps).length }} groups</span>
            <span v-if="isLoading" class="text-zinc-400 animate-pulse">syncing...</span>
          </div>
          
          <!-- Legend -->
          <div class="overflow-hidden w-[400px]">
            <div class="flex gap-1 text-[8px] text-zinc-500 animate-marquee whitespace-nowrap">
              <span class="text-amber-600">r</span>=toread
              <span class="text-blue-600">s</span>=shared
              <span class="text-green-600">e</span>=embedding
              <span class="text-red-600">p</span>=processing
              📷=media
              📍=location
              #=tags
              t=tagcount
              ch=chars
              img=images
              pb=pinboard
              gh=github
              ar=arena
              md=mastodon
              tw=twitter
              yt=youtube
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-3 py-4">
      <!-- Loading States -->
      <div v-if="isLoading && !scraps.length" class="font-mono text-center py-12 text-xs opacity-60">
        Loading scraps...
      </div>

      <div v-else-if="error" class="font-mono text-center py-12 text-xs">
        {{ error.message }}
      </div>

      <!-- Scrap Groups -->
      <div v-else class="space-y-8">
        <section v-for="(group, date) in groupedScraps" :key="date" class="mb-6">
          <h3 class="font-mono text-xs text-zinc-500 mb-2 opacity-60">{{ formatGroupDate(date) }} ({{ group.length }})</h3>

          <div class="space-y-0">
            <DataDense v-for="scrap in group" :key="scrap.id" :scrap="scrap" ref="scrapElements" />
          </div>
        </section>

        <!-- Load More States -->
        <div v-if="isLoading" class="text-center font-mono text-xs opacity-60 py-4">
          Loading more...
        </div>
      </div>
    </main>

    <!-- Infinite Scroll Trigger -->
    <div ref="loadMoreTrigger" class="h-8" />

  </div>
</template>

<script setup>
import { useIntersectionObserver } from '@vueuse/core'
import { format, parseISO, isThisMonth, isThisYear } from 'date-fns'
import DataDense from '~/components/DataDense.vue'
import useScraps from '~/composables/useScraps'

const ITEMS_PER_PAGE = 200

const { scraps, isLoading, error, loadMore, hasMoreScraps, totalScraps } = useScraps()
const loadMoreTrigger = ref(null)
const scrapElements = ref([])

const getMostRelevantDate = (scrap) => {
  return new Date(
    scrap.published_at ||
    scrap.updated_at ||
    scrap.created_at
  )
}

// Group scraps by time period
const groupedScraps = computed(() => {
  const groups = {}
  const now = new Date()

  scraps.value.forEach(scrap => {
    const date = getMostRelevantDate(scrap)
    let groupKey

    const hoursAgo = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    const daysAgo = hoursAgo / 24

    if (hoursAgo < 24) {
      groupKey = 'Last 24 Hours'
    } else if (daysAgo < 7) {
      groupKey = 'This Week'
    } else if (isThisMonth(date)) {
      groupKey = 'This Month'
    } else if (isThisYear(date)) {
      groupKey = format(date, 'MMMM yyyy')
    } else {
      groupKey = format(date, 'yyyy')
    }

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(scrap)
  })

  // Sort scraps within each group by most relevant date
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) =>
      getMostRelevantDate(b).getTime() - getMostRelevantDate(a).getTime()
    )
  })

  return groups
})

const formatGroupDate = (date) => date

// Infinite scroll
useIntersectionObserver(
  loadMoreTrigger,
  ([{ isIntersecting }]) => {
    if (isIntersecting && !isLoading.value && hasMoreScraps.value) {
      loadMore({ limit: ITEMS_PER_PAGE })
    }
  },
  { threshold: 0.5 }
)

// Page metadata
useHead({
  title: 'Scrapbook',
  meta: [
    { name: 'description', content: 'A collection of interesting things found around the web' }
  ]
})
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px)
  }

  to {
    opacity: 1;
    transform: translateY(0)
  }
}

@keyframes marquee {
  0% {
    transform: translateX(100%)
  }
  100% {
    transform: translateX(-100%)
  }
}

.animate-marquee {
  animation: marquee 30s linear infinite;
}

.grid>* {
  animation: fadeIn 0.2s ease-out forwards;
}
</style>
