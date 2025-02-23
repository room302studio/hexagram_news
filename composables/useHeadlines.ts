import type { Database } from '~/types/supabase'

export interface HeadlineArticle {
  id: number
  title: string
  url: string
  source: string
  timestamp: string
  tags: string[]
  summary: string | null
}

interface NewsTagsResponse {
  id: number
  title: string
  url: string
  source: string
  timestamp: string
  summary: string | null
  news_tags: Array<{
    tags: {
      name: string
    }
  }>
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
      const { data, error: supabaseError } = await client
        .from('hexagramnews')
        .select(
          `
          id,
          title,
          url,
          source,
          timestamp,
          summary,
          news_tags!inner (
            tags (
              name
            )
          )
        `
        )
        .order('timestamp', { ascending: false })
        .limit(options.limit || 10)

      if (supabaseError) throw supabaseError
      if (!data) return []

      // Transform the data to match our interface
      const articles: HeadlineArticle[] = data.map((article) => ({
        id: article.id as number,
        title: article.title as string,
        url: article.url as string,
        source: article.source as string,
        timestamp: article.timestamp as string,
        summary: article.summary as string | null,
        tags: ((article.news_tags ?? []) as any[]).map(
          (tag) => tag.tags.name as string
        )
      }))

      return articles
    } catch (err) {
      error.value = err as Error
      return []
    } finally {
      loading.value = false
    }
  }

  // Convenience composables for specific types of headlines
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
