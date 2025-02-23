export interface Database {
  public: {
    Tables: {
      hexagramnews: {
        Row: {
          id: number
          title: string
          url: string
          source: string
          timestamp: string
          summary: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          url: string
          source: string
          timestamp?: string
          summary?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          url?: string
          source?: string
          timestamp?: string
          summary?: string | null
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: number
          name: string
          created_at: string
        }
        Insert: {
          name: string
          created_at?: string
        }
        Update: {
          name?: string
        }
      }
      news_tags: {
        Row: {
          news_id: number
          tag_id: number
          created_at: string
        }
        Insert: {
          news_id: number
          tag_id: number
          created_at?: string
        }
        Update: {
          news_id?: number
          tag_id?: number
        }
      }
      subscriptions: {
        Row: {
          id: number
          email: string
          verified: boolean
          verification_token: string
          created_at: string
          updated_at: string
        }
        Insert: {
          email: string
          verified?: boolean
          verification_token?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          verified?: boolean
          verification_token?: string
          updated_at?: string
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
