<template>
  <NuxtLayout name="default">
    <template #header>
      <h1 class="text-2xl md:text-4xl lg:text-5xl font-['Karla'] font-extrabold">Hexagram News</h1>
      <p class="text-sm font-mono text-gray-500 mt-2">Tech news without the bullshit</p>
    </template>

    <!-- Main content -->
    <div class="grid md:grid-cols-2 gap-8 md:gap-16 mb-16">
      <div class="space-y-12">
        <NewsColumn title="Top News" :articles="topNewsArticles" :loading="loading" :error="error" />
      </div>

      <div class="space-y-12">
        <NewsColumn title="Latest News" :articles="latestNewsArticles" :loading="loading" :error="error" />
      </div>
    </div>

    <template #footer>
      <div class="max-w-sm">
        <h4 class="text-sm font-['Karla'] font-bold">Stay Updated</h4>
        <p class="text-xs text-gray-600 mt-1 mb-4 font-['Newsreader']">Get the latest tech news delivered to your inbox.
        </p>
        <form class="flex flex-col gap-2" @submit.prevent="subscribe">
          <input v-model="email" type="email" placeholder="your@email.com"
            class="p-2 text-sm border border-gray-200 rounded font-mono bg-white/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors" />
          <button type="submit"
            class="p-2 bg-gray-900 text-white rounded text-xs font-mono uppercase tracking-wider hover:bg-gray-800 transition-colors">
            Subscribe
          </button>
        </form>
      </div>
    </template>
  </NuxtLayout>
</template>

<script setup>
const store = useAppStore()
const { chat, hasValidKey } = useOpenRouter()
const input = ref('')
const isLoading = ref(false)
const messages = computed(() => store.itemList.value)
const email = ref('')
const { isMobile } = useBreakpoint()
const { topNews, latestNews, loading, error } = useHeadlines()

function clearChat() {
  store.itemList.value = []
}

// Replace the hardcoded arrays with async data
const articles = await Promise.all([
  topNews(3),
  latestNews(3)
])

const topNewsArticles = articles[0]
const latestNewsArticles = articles[1]

async function sendMessage() {
  if (!input.value.trim() || isLoading.value) return

  // Add user message as an object
  store.addItem({
    role: 'user',
    content: input.value
  })

  input.value = ''
  isLoading.value = true

  try {
    // Messages are already in the correct format for the API
    const response = await chat(messages.value)

    // Add AI response as an object
    store.addItem({
      role: 'assistant',
      content: response.content
    })
  } catch (error) {
    console.error('Error:', error)
    store.addItem({
      role: 'system',
      content: 'Error: Could not get AI response'
    })
  } finally {
    isLoading.value = false
  }
}

function subscribe() {
  // TODO: Implement subscription logic
  console.log('Subscribe:', email.value)
}
</script>
