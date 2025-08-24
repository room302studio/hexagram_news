<template>
  <div class="min-h-screen bg-black text-zinc-100">
    <!-- Fixed Header -->
    <header class="sticky top-0 z-50 backdrop-blur-sm bg-black/80">
      <div class="container mx-auto px-3 py-2">
        <div class="flex items-baseline justify-between font-mono text-xs">
          <div class="flex items-baseline gap-4">
            <NuxtLink to="/scrapbook" class="text-zinc-500 hover:text-zinc-300">~/scraps</NuxtLink>
            <span class="text-zinc-600">/</span>
            <h1 class="text-zinc-100 font-medium">{{ route.params.tag }}</h1>
            <span class="text-zinc-500">{{ totalScraps }} items</span>
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
        Loading scraps for {{ route.params.tag }}...
      </div>

      <div v-else-if="error" class="font-mono text-center py-12 text-xs">
        {{ error.message }}
      </div>

      <!-- No results -->
      <div v-else-if="!scraps.length" class="font-mono text-center py-12 text-xs opacity-60">
        No scraps found with tag {{ route.params.tag }}
      </div>

      <!-- Scrap Groups -->
      <div v-else class="space-y-8">
        <section v-for="(group, date) in groupedScraps" :key="date" class="mb-6">
          <h3 class="font-mono text-xs text-zinc-500 mb-2 opacity-60">{{ formatGroupDate(date) }} ({{ group.length }})</h3>

          <div class="space-y-0">
            <DataDense v-for="scrap in group" :key="scrap.id" ref="scrapElements" :scrap="scrap" />
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
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useIntersectionObserver } from '@vueuse/core'
import { format, isThisMonth, isThisYear } from 'date-fns'
import DataDense from '~/components/DataDense.vue'

const route = useRoute()
const ITEMS_PER_PAGE = 200

// We'll implement a custom fetch for tag filtering since useScraps doesn't support it yet
const scraps = ref([])
const isLoading = ref(false)
const error = ref(null)
const totalScraps = ref(0)
const currentPage = ref(1)
const hasMore = ref(true)
const loadMoreTrigger = ref(null)
const scrapElements = ref([])

const config = useRuntimeConfig()
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(
  config.public.SUPABASE_URL,
  config.public.SUPABASE_KEY
)

const fetchTaggedScraps = async (page = 1) => {
  if (isLoading.value) return
  
  isLoading.value = true
  error.value = null

  try {
    const tag = route.params.tag
    
    // For now, let's fetch all shared scraps and filter client-side
    // This is less efficient but will work reliably
    let query = supabase
      .from('scraps')
      .select('*', { count: 'exact' })
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })

    // For initial version, fetch a larger set and filter client-side
    const limit = ITEMS_PER_PAGE * 5 // Fetch more to account for filtering
    query = query.range(0, limit - 1)

    const { data: allData, error: queryError } = await query

    if (queryError) throw queryError

    // Filter client-side for tags
    const filteredData = allData?.filter(scrap => 
      scrap.tags && Array.isArray(scrap.tags) && scrap.tags.includes(tag)
    ) || []

    // Paginate the filtered results
    const offset = (page - 1) * ITEMS_PER_PAGE
    const data = filteredData.slice(offset, offset + ITEMS_PER_PAGE)
    const count = filteredData.length

    if (data && count !== null) {
      // Process dates to ensure none are in the future
      const processedScraps = data.map((scrap) => ({
        ...scrap,
        created_at:
          new Date(scrap.created_at) > new Date()
            ? new Date().toISOString()
            : scrap.created_at,
        published_at:
          scrap.published_at && new Date(scrap.published_at) > new Date()
            ? new Date().toISOString()
            : scrap.published_at
      }))

      scraps.value = page === 1 ? processedScraps : [...scraps.value, ...processedScraps]
      totalScraps.value = count
      currentPage.value = page
      hasMore.value = data.length === ITEMS_PER_PAGE
    }
  } catch (err) {
    console.error('Error fetching tagged scraps:', err)
    error.value = err instanceof Error ? err : new Error('Failed to fetch scraps')
  } finally {
    isLoading.value = false
  }
}

const loadMore = () => {
  if (!isLoading.value && hasMore.value) {
    fetchTaggedScraps(currentPage.value + 1)
  }
}

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
    if (isIntersecting && !isLoading.value && hasMore.value) {
      loadMore()
    }
  },
  { threshold: 0.5 }
)

// Initial fetch
fetchTaggedScraps(1)

// Page metadata
useHead({
  title: `Scrapbook: ${route.params.tag}`,
  meta: [
    { name: 'description', content: `Scraps tagged with ${route.params.tag}` }
  ]
})
</script>

<style scoped>
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
</style>