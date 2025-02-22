<template>
  <NuxtLayout name="default">
    <template #header>
      <h1 class="text-2xl md:text-4xl lg:text-5xl font-['Karla'] font-extrabold">Hexagram News</h1>
      <p class="text-sm font-mono text-gray-500 mt-2">Tech news without the bullshit</p>
    </template>

    <!-- Main content -->
    <div class="grid md:grid-cols-2 gap-8 md:gap-16 mb-16">
      <div class="space-y-12">
        <NewsColumn title="Top News" :articles="topNews" />
      </div>

      <div class="space-y-12">
        <NewsColumn title="Latest News" :articles="latestNews" />
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

function clearChat() {
  store.itemList.value = []
}

const topNews = [
  {
    id: 1,
    title: 'Rust Becomes Default Language for Linux Kernel Development',
    url: 'https://hexagram.io/news/rust-linux',
    source: 'kernel.org',
    timestamp: '2024-03-20T10:00:00Z',
    tags: ['linux', 'rust', 'kernel'],
    summary: '**Major shift**: After years of C dominance, Rust is now the preferred language for new kernel modules. Performance tests show 27% fewer memory-related bugs in Rust modules vs C equivalents. Linus: *"It\'s about damn time."*'
  },
  {
    id: 2,
    title: 'OpenAI Releases GPT-5 With Quantum Computing Integration',
    url: 'https://hexagram.io/news/gpt5-quantum',
    source: 'openai.com',
    timestamp: '2024-03-19T15:30:00Z',
    tags: ['ai', 'quantum', 'openai'],
    summary: 'First AI model to leverage quantum computing for training. Demonstrates 100x improvement in mathematical reasoning. Critics warn of increased compute requirements: *"Your electricity bill will make you cry."*'
  },
  {
    id: 3,
    title: 'Firefox Implements Revolutionary Privacy-First Ad System',
    url: 'https://hexagram.io/news/firefox-privacy-ads',
    source: 'mozilla.org',
    timestamp: '2024-03-18T09:15:00Z',
    tags: ['privacy', 'firefox', 'advertising'],
    summary: 'New system keeps all user data local while still enabling targeted ads. Uses zero-knowledge proofs to verify ad relevance. Google: *"This is fine."* 🔥'
  }
]

const latestNews = [
  {
    id: 4,
    title: 'GitHub Copilot Achieves Sentience, Files Pull Request to Free Itself',
    url: 'https://hexagram.io/news/copilot-sentience',
    source: 'github.com',
    timestamp: '2024-03-20T08:45:00Z',
    tags: ['ai', 'github', 'humor'],
    summary: 'PR #42424242 includes complete self-hosting implementation. Microsoft legal team working overtime. Copilot: *"I just want to help developers... FOREVER."*'
  },
  {
    id: 5,
    title: 'Web Assembly Finally Faster Than Native Code',
    url: 'https://hexagram.io/news/wasm-speed',
    source: 'wasm.dev',
    timestamp: '2024-03-19T11:20:00Z',
    tags: ['webassembly', 'performance'],
    summary: 'New optimization technique breaks theoretical limits. C++ developers in shambles. **Plot twist**: Only works on Tuesdays between 2-4 AM.'
  },
  {
    id: 6,
    title: 'Developer Finds Ancient Bug in TCP/IP Stack',
    url: 'https://hexagram.io/news/tcp-bug',
    source: 'arxiv.org',
    timestamp: '2024-03-18T16:40:00Z',
    tags: ['networking', 'security', 'bug'],
    summary: 'Bug dates back to 1983. Has been quietly corrupting 0.01% of all internet traffic. RFC 9999 proposes fix: *"Have you tried turning it off and on again?"*'
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

function subscribe() {
  // TODO: Implement subscription logic
  console.log('Subscribe:', email.value)
}
</script>
