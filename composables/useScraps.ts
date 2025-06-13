import { ref, computed } from 'vue'
import type { Database } from '~/types/supabase'

// Match the database schema exactly
interface Scrap {
  // Required fields
  id: string
  created_at: string

  // Content fields
  content: string | null
  summary: string | null
  title: string | null

  // Media fields
  screenshot_url: string | null
  url: string | null

  // Metadata
  metadata: {
    screenshotUrl?: string
    image?: {
      thumb?: {
        url: string
      }
    }
    images?: Array<{ url: string }>
    href?: string
    description?: string
    [key: string]: any
  } | null

  // Classification
  type: string | null
  source: ScrapSource | null
  tags: string[] | null

  // Timestamps
  updated_at: string | null
  published_at: string | null

  // Location data
  location: string | null
  latitude: number | null
  longitude: number | null

  // Relationships
  relationships:
    | {
        id: string
        type: string
        target_id: string
      }[]
    | null

  // Processing status
  processing_instance_id: string | null
  processing_started_at: string | null
  shared: boolean | null
}

export const enum ScrapSource {
  Lock = 'lock',
  Pinboard = 'pinboard',
  Twitter = 'twitter',
  Github = 'github',
  Arena = 'arena',
  Mastodon = 'mastodon'
}

interface ScrapFilters {
  type?: string
  source?: string
  shared?: boolean
}

interface FetchOptions {
  page?: number
  limit?: number
  filters?: ScrapFilters
  sortBy?: 'newest' | 'oldest' | 'updated'
}

export default function useScraps() {
  const supabase = useSupabaseClient<Database>()

  const scraps = ref<Scrap[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const currentPage = ref(1)
  const totalScraps = ref(0)
  const totalPages = ref(0)

  const hasMoreScraps = computed(() => currentPage.value < totalPages.value)

  const fetchScraps = async (options: FetchOptions = {}) => {
    if (isLoading.value) return

    isLoading.value = true
    error.value = null

    try {
      // Start building the query
      let query = supabase.from('scraps').select('*', { count: 'exact' })

      // IMPORTANT: Only fetch scraps with substantial content
      query = query.or('content.not.is.null,summary.not.is.null,screenshot_url.not.is.null')
      
      // Apply filters
      if (options.filters?.type) {
        query = query.eq('type', options.filters.type)
      }
      if (options.filters?.source) {
        query = query.eq('source', options.filters.source)
      }
      if (typeof options.filters?.shared !== 'undefined') {
        query = query.eq('shared', options.filters.shared)
      }

      // Apply sorting
      const sortBy = options.sortBy || 'newest'
      switch (sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'updated':
          query = query
            .order('updated_at', { ascending: false })
            .order('created_at', { ascending: false })
          break
        case 'newest':
        default:
          query = query
            .order('published_at', { ascending: false, nullsFirst: false })
            .order('updated_at', { ascending: false })
            .order('created_at', { ascending: false })
      }

      // Apply pagination
      const limit = options.limit || 20
      const offset = ((options.page || currentPage.value) - 1) * limit
      query = query.range(offset, offset + limit - 1)

      // Execute query
      const { data, error: queryError, count } = await query

      if (queryError) throw queryError

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

        scraps.value =
          options.page === 1
            ? processedScraps
            : [...scraps.value, ...processedScraps]

        totalScraps.value = count
        currentPage.value = options.page || currentPage.value
        totalPages.value = Math.ceil(count / limit)
      }
    } catch (err) {
      console.error('Error fetching scraps:', err)
      error.value =
        err instanceof Error ? err : new Error('Failed to fetch scraps')
    } finally {
      isLoading.value = false
    }
  }

  const loadMore = (filters?: ScrapFilters) => {
    if (!isLoading.value && hasMoreScraps.value) {
      fetchScraps({
        page: currentPage.value + 1,
        filters
      })
    }
  }

  // Helper functions for UI
  const getMediaUrl = (scrap: Scrap): string | null => {
    return (
      scrap.screenshot_url ||
      scrap.metadata?.screenshotUrl ||
      scrap.metadata?.image?.thumb?.url ||
      scrap.metadata?.images?.[0]?.url ||
      null
    )
  }

  const hasMedia = (scrap: Scrap): boolean => !!getMediaUrl(scrap)

  const getDisplayTitle = (scrap: Scrap): string => {
    return scrap.title || scrap.content || scrap.summary || 'Untitled Scrap'
  }

  const getSourceData = (scrap: Scrap) => {
    const sourceMap = {
      pinboard: { icon: 'simple-icons:pinboard', label: 'Pinboard' },
      github: { icon: 'simple-icons:github', label: 'GitHub' },
      arena: { icon: 'i-heroicons-square-3-stack-3d', label: 'Are.na' },
      mastodon: { icon: 'simple-icons:mastodon', label: 'Mastodon' },
      twitter: { icon: 'simple-icons:twitter', label: 'Twitter' },
      youtube: { icon: 'simple-icons:youtube', label: 'YouTube' },
      lock: { icon: 'i-heroicons-lock-closed', label: 'Private' }
    }
    return (
      sourceMap[scrap.source?.toLowerCase() as keyof typeof sourceMap] || {
        icon: 'i-heroicons-question-mark-circle',
        label: scrap.source || 'Unknown'
      }
    )
  }

  return {
    scraps,
    isLoading,
    error,
    loadMore,
    hasMoreScraps,
    totalScraps: computed(() => totalScraps.value),
    totalPages: computed(() => totalPages.value),
    fetchScraps,
    // Helper functions
    getMediaUrl,
    hasMedia,
    getDisplayTitle,
    getSourceData
  }
}
