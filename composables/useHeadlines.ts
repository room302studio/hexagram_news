import type { Database } from '~/types/supabase'

export interface HeadlineArticle {
  id: string
  title: string
  url: string
  source: string
  timestamp: string
  tags: string[]
  summary: string | null
}

export const useHeadlines = () => {
  const client = useSupabaseClient<Database>()
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const fetchHeadlines = async (options: {
    type: 'top' | 'latest'
    limit?: number
  }) => {
    loading.value = true
    error.value = null

    try {
      const query = client
        .from('scraps')
        .select(
          `
          id,
          title,
          url,
          source,
          created_at,
          published_at,
          summary,
          tags
        `
        )
        .not('title', 'is', null)
        .not('url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(options.limit || 10)

      const { data, error: supabaseError } = await query

      if (supabaseError) throw supabaseError
      if (!data) return []

      // Transform the data to match our interface
      const articles: HeadlineArticle[] = data.map((article) => ({
        id: article.id,
        title: article.title || 'Untitled',
        url: article.url || '#',
        source: article.source || 'Unknown Source',
        timestamp: article.published_at || article.created_at,
        summary: article.summary,
        tags: Array.isArray(article.tags) ? article.tags : []
      }))

      return articles
    } catch (err) {
      console.error('Supabase query error:', err)
      error.value = err as Error
      return []
    } finally {
      loading.value = false
    }
  }

  // Convenience methods for specific types of headlines
  const topNews = async (limit = 3) => fetchHeadlines({ type: 'top', limit })
  const latestNews = async (limit = 3) =>
    fetchHeadlines({ type: 'latest', limit })

  return {
    loading,
    error,
    fetchHeadlines,
    topNews,
    latestNews
  }
}
