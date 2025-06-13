<template>
  <div class="hover:bg-zinc-900/10 transition-colors group py-1">
    <div class="flex items-start gap-3 font-mono text-xs">
      <!-- Timestamp -->
      <time class="text-zinc-500 w-[40px] text-[10px] leading-tight">
        {{ formatTimestamp(mostRelevantDate) }}
      </time>
      
      <!-- Source -->
      <div class="flex-shrink-0 w-[20px] text-zinc-600 text-[9px] uppercase">
        {{ sourceData.label }}
      </div>
      
      <!-- Type + metadata indicators -->
      <div class="flex-shrink-0 w-[60px] text-zinc-600 text-[9px] uppercase flex gap-1">
        {{ scrap.type || 'unk' }}
        <span v-if="isToRead" class="text-amber-600">r</span>
        <span v-if="isShared" class="text-blue-600">s</span>
        <span v-if="hasEmbedding" class="text-green-600">e</span>
        <span v-if="hasProcessing" class="text-red-600">p</span>
      </div>
      
      <!-- Main Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start gap-2">
          <!-- Title/Content -->
          <div class="flex-1 min-w-0">
            <a v-if="scrap.url" 
               :href="scrap.url" 
               target="_blank" 
               rel="noopener noreferrer"
               class="text-zinc-200 hover:text-white leading-tight block text-[11px]"
               :title="displayTitle">
              {{ truncateText(displayTitle, 90) }}
            </a>
            <div v-else 
                 class="text-zinc-200 leading-tight text-[11px]"
                 :title="displayTitle">
              {{ truncateText(displayTitle, 90) }}
            </div>
            
            <!-- URL + Provider info -->
            <div class="flex gap-2 text-zinc-500 text-[9px] mt-0.5">
              <span v-if="scrap.url">{{ getDomain(scrap.url) }}</span>
              <span v-if="provider && provider !== getDomain(scrap.url)" class="opacity-60">via {{ provider }}</span>
              <span v-if="scrap.location" class="opacity-60">📍{{ scrap.location }}</span>
            </div>
          </div>
          
          <!-- Compact stats -->
          <div class="flex-shrink-0 text-[9px] text-zinc-500 flex gap-1">
            <span v-if="scrap.tags?.length" class="opacity-60">{{ scrap.tags.length }}t</span>
            <span v-if="scrap.relationships?.length" class="opacity-60">{{ scrap.relationships.length }}r</span>
            <span v-if="hasMedia" class="opacity-60">📷</span>
            <span v-if="imageCount > 1" class="opacity-60">{{ imageCount }}img</span>
            <span v-if="contentLength" class="opacity-60">{{ contentLength }}ch</span>
          </div>
        </div>
        
        <!-- Tags inline -->
        <div v-if="scrap.tags?.length" class="mt-0.5 text-[8px] text-zinc-400 opacity-60">
          <NuxtLink 
            v-for="tag in scrap.tags.slice(0, 12)" 
            :key="tag" 
            :to="`/scrapbook/tag/${tag}`"
            class="mr-1 hover:text-zinc-200 hover:opacity-100 transition-all"
            @click.stop
          >
{{ tag }}
          </NuxtLink>
          <span v-if="scrap.tags.length > 12">+{{ scrap.tags.length - 12 }}</span>
        </div>
        
        <!-- Summary/Description if compact -->
        <div v-if="description && description.length < 100" class="mt-0.5 text-zinc-400 text-[9px] leading-relaxed opacity-60">
          {{ description }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

const props = defineProps({
  scrap: {
    type: Object,
    required: true,
  },
})

const sourceData = computed(() => {
  const sourceMap = {
    pinboard: { icon: 'simple-icons:pinboard', label: 'pb' },
    github: { icon: 'simple-icons:github', label: 'gh' },
    arena: { icon: 'i-heroicons-square-3-stack-3d', label: 'ar' },
    mastodon: { icon: 'simple-icons:mastodon', label: 'md' },
    twitter: { icon: 'simple-icons:twitter', label: 'tw' },
    youtube: { icon: 'simple-icons:youtube', label: 'yt' },
    lock: { icon: 'i-heroicons-lock-closed', label: 'pv' }
  }
  return sourceMap[props.scrap.source?.toLowerCase()] || {
    icon: 'i-heroicons-question-mark-circle',
    label: props.scrap.source?.substring(0, 2) || '??'
  }
})

const mostRelevantDate = computed(() => {
  return new Date(
    props.scrap.published_at ||
    props.scrap.updated_at ||
    props.scrap.created_at
  )
})

const formatTimestamp = (date) => {
  if (isToday(date)) {
    return format(date, 'HH:mm')
  } else if (isYesterday(date)) {
    return 'yesterday'
  } else {
    return format(date, 'MM/dd')
  }
}

const displayTitle = computed(() =>
  props.scrap.title || props.scrap.content || props.scrap.summary || '[no title]'
)

const description = computed(() =>
  props.scrap.summary || props.scrap.metadata?.description
)

const hasMedia = computed(() => {
  return !!(props.scrap.screenshot_url ||
    props.scrap.metadata?.screenshotUrl ||
    props.scrap.metadata?.image?.thumb?.url ||
    props.scrap.metadata?.images?.[0]?.url)
})

const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '…' : text
}

const getDomain = (url) => {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

// New metadata computed properties
const isToRead = computed(() => {
  return props.scrap.metadata?.toread === true || 
         props.scrap.metadata?.original?.toread === 'yes'
})

const isShared = computed(() => {
  return props.scrap.shared === true ||
         props.scrap.metadata?.shared === true ||
         props.scrap.metadata?.original?.shared === 'yes'
})

const hasEmbedding = computed(() => {
  return !!(props.scrap.embedding || props.scrap.embedding_nomic || props.scrap.image_embedding)
})

const hasProcessing = computed(() => {
  return !!(props.scrap.processing_instance_id || props.scrap.processing_started_at)
})

const provider = computed(() => {
  return props.scrap.metadata?.source_data?.provider ||
         props.scrap.metadata?.original?.provider
})

const imageCount = computed(() => {
  const images = props.scrap.metadata?.image_urls?.length || 0
  const screenshots = props.scrap.screenshot_url ? 1 : 0
  return images + screenshots
})

const contentLength = computed(() => {
  const content = props.scrap.content || props.scrap.summary || ''
  return content.length > 0 ? content.length : null
})
</script>