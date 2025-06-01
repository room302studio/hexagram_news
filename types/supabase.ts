export interface Database {
  public: {
    Tables: {
      scraps: {
        Row: {
          id: string
          content: string | null
          summary: string | null
          created_at: string | null
          updated_at: string | null
          tags: string[] | null
          relationships: any | null
          metadata: any | null
          scrap_id: string | null
          embedding: number[] | null
          graph_imported: boolean | null
          url: string | null
          screenshot_url: string | null
          location: string | null
          title: string | null
          latitude: number | null
          longitude: number | null
          type: string | null
          published_at: string | null
          shared: boolean | null
          embedding_nomic: number[] | null
          image_embedding: number[] | null
          processing_instance_id: string | null
          processing_started_at: string | null
          source: string | null
        }
        Insert: {
          id?: string
          content?: string | null
          summary?: string | null
          created_at?: string | null
          updated_at?: string | null
          tags?: string[] | null
          relationships?: any | null
          metadata?: any | null
          scrap_id?: string | null
          embedding?: number[] | null
          graph_imported?: boolean | null
          url?: string | null
          screenshot_url?: string | null
          location?: string | null
          title?: string | null
          latitude?: number | null
          longitude?: number | null
          type?: string | null
          published_at?: string | null
          shared?: boolean | null
          embedding_nomic?: number[] | null
          image_embedding?: number[] | null
          processing_instance_id?: string | null
          processing_started_at?: string | null
          source?: string | null
        }
        Update: {
          id?: string
          content?: string | null
          summary?: string | null
          created_at?: string | null
          updated_at?: string | null
          tags?: string[] | null
          relationships?: any | null
          metadata?: any | null
          scrap_id?: string | null
          embedding?: number[] | null
          graph_imported?: boolean | null
          url?: string | null
          screenshot_url?: string | null
          location?: string | null
          title?: string | null
          latitude?: number | null
          longitude?: number | null
          type?: string | null
          published_at?: string | null
          shared?: boolean | null
          embedding_nomic?: number[] | null
          image_embedding?: number[] | null
          processing_instance_id?: string | null
          processing_started_at?: string | null
          source?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
