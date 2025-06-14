import pkg from './package.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: pkg.name,
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: pkg.version }
      ]
    }
  },

  devtools: { enabled: true },

  modules: [
    [
      '@nuxtjs/supabase',
      {
        redirect: false,
        cookieOptions: {
          secure: false,
          sameSite: 'lax'
        }
      }
    ],
    '@vueuse/nuxt',
    [
      '@nuxtjs/google-fonts',
      {
        families: {
          Karla: [400, 500, 600, 700, 800],
          Newsreader: {
            wght: [300, 400, 500, 600, 700],
            ital: [300, 400, 500, 600, 700]
          }
        }
      }
    ]
  ],

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      PRODUCTION: process.env.PRODUCTION
    }
  },

  ssr: true,

  css: ['~/assets/css/fonts.css', '~/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },

  build: {
    rollupOptions: {
      external: ['date-fns']
    }
  },

  compatibilityDate: '2025-04-21'
})