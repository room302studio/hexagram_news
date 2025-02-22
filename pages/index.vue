<template>
  <div class="max-w-screen-lg mx-auto p-4">
    <h1 class="text-6xl py-4 font-bold">Hexagram News</h1>

    <!-- news columns-->
    <div class="columns columns-2 w-full py-4">
      <div class="column">
        <h2 class="text-4xl font-bold">Top News</h2>
        <ul>
          <li v-for="article in topNews" :key="article.id">
            <a :href="article.url" class="text-blue-500 hover:underline">{{ article.title }}</a>
          </li>
        </ul>
      </div>
      <div class="column">
        <h2 class="text-4xl font-bold">Latest News</h2>
        <ul>
          <li v-for="article in latestNews" :key="article.id">
            <a :href="article.url" class="text-blue-500 hover:underline">{{ article.title }}</a>
          </li>
        </ul>
      </div>
    </div>

    <h4>Sign up for our mailing list</h4>
    <form class="flex flex-col" @submit.prevent="subscribe">
      <input v-model="email" type="email" placeholder="Email" class="p-2 my-2 border border-gray-300 rounded" />
      <button type="submit" class="p-2 bg-blue-500 text-white rounded">
        Subscribe
      </button>
    </form>
  </div>
</template>

<script setup>
const store = useAppStore()
const { chat, hasValidKey } = useOpenRouter()
const input = ref('')
const isLoading = ref(false)
const messages = computed(() => store.itemList.value)

function clearChat() {
  store.itemList.value = []
}

const topNews = [
  {
    id: 1,
    title: 'Hexagram News is now live!',
    url: 'https://hexagram.io/news'
  },
  {
    id: 2,
    title: 'Hexagram News is now live!',
    url: 'https://hexagram.io/news'
  },
  {
    id: 3,
    title: 'Hexagram News is now live!',
    url: 'https://hexagram.io/news'
  }
]

const latestNews = [
  {
    id: 1,
    title: 'Hexagram News is now live!',
    url: 'https://hexagram.io/news'
  },
  {
    id: 2,
    title: 'Hexagram News is now live!',
    url: 'https://hexagram.io/news'
  },
  {
    id: 3,
    title: 'Hexagram News is now live!',
    url: 'https://hexagram.io/news'
  }
]

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
</script>
