# Hexagram News - Enhanced Components Integration

This document explains how to integrate the data-dense scrapbook components copied from website2 to enhance the news display capabilities.

## Components Copied Over

### 1. `DataDense.vue` - Hacker-aesthetic data row component

**Location**: `components/DataDense.vue`

**What it does**:

- Displays scraps in ultra-compact, terminal-style rows
- Shows metadata indicators: `r`(toread), `s`(shared), `e`(embedding), `p`(processing)
- Clickable tags for filtering
- Content stats: character count, image count, tag count
- Fixed-width columns for perfect vertical scanning

**How to use**:

```vue
<template>
  <DataDense :scrap="scrap" />
</template>
```

### 2. `useScraps.ts` - Enhanced composable with filtering

**Location**: `composables/useScraps.ts`

**Features**:

- Advanced filtering by type, source, shared status
- Sorting options (newest, oldest, updated)
- Pagination with infinite scroll support
- Helper functions for media URLs, display titles, source data
- Date processing to prevent future dates

**How to use**:

```js
const {
  scraps,
  isLoading,
  error,
  loadMore,
  fetchScraps,
  getMediaUrl,
  getDisplayTitle,
  getSourceData
} = useScraps()

// Fetch with filters
fetchScraps({
  filters: { type: 'article', source: 'pinboard' },
  sortBy: 'newest',
  limit: 50
})
```

### 3. Tag Filtering Page

**Location**: `pages/tag/[tag].vue`

**What it does**:

- Shows all scraps filtered by a specific tag
- Uses the same data-dense display
- Breadcrumb navigation back to main view
- Maintains the hacker aesthetic

**URL**: `/tag/politics`, `/tag/tech`, etc.

### 4. Dense View Page

**Location**: `pages/dense.vue`

**What it does**:

- Alternative view to the main news layout
- Shows ALL scraps in data-dense format
- Includes scrolling marquee legend
- Terminal-style header with stats

**URL**: `/dense`

## Integration Steps

### Step 1: Add Dense View to Navigation

Add a link to the dense view in your main layout:

```vue
<NuxtLink to="/dense" class="font-mono text-xs hover:underline">
  [dense view]
</NuxtLink>
```

### Step 2: Make Tags Clickable in Existing Components

Update `HeadlineLink.vue` to make tags clickable:

```vue
<!-- Replace existing tag display with: -->
<NuxtLink
  v-for="tag in article.tags"
  :key="tag"
  :to="`/tag/${tag}`"
  class="text-xs bg-gray-100 px-1 rounded hover:bg-gray-200"
>
  {{ tag }}
</NuxtLink>
```

### Step 3: Add Dense Mode Toggle

Add a toggle between normal and dense view on the homepage:

```vue
<div class="flex gap-2 mb-4">
  <button 
    @click="viewMode = 'normal'" 
    :class="{ 'font-bold': viewMode === 'normal' }">
    Normal
  </button>
  <button 
    @click="viewMode = 'dense'" 
    :class="{ 'font-bold': viewMode === 'dense' }">
    Dense
  </button>
</div>

<!-- Then in your content area: -->
<div v-if="viewMode === 'normal'">
  <!-- Existing news columns -->
</div>
<div v-else class="space-y-0">
  <DataDense v-for="scrap in scraps" :key="scrap.id" :scrap="scrap" />
</div>
```

### Step 4: Style Integration

The DataDense component uses these Tailwind classes that should work with your existing setup:

- `bg-black`, `text-zinc-100` for dark theme
- `hover:bg-zinc-900/10` for subtle hover
- `font-mono` for terminal aesthetic
- Various `text-[8px]` to `text-[11px]` micro-typography

### Step 5: Add Marquee Legend (Optional)

Copy the CSS animation from `dense.vue` to add the scrolling legend:

```css
@keyframes marquee {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

.animate-marquee {
  animation: marquee 30s linear infinite;
}
```

## Enhanced Features Available

### Advanced Filtering

```js
// Filter by multiple criteria
fetchScraps({
  filters: {
    type: 'article',
    source: 'reuters',
    shared: true
  },
  sortBy: 'newest'
})
```

### Source-Based Views

Create pages like `/source/reuters`, `/source/apnews` using the same pattern as tag filtering.

### Search Integration

The enhanced `useScraps` can be extended to support full-text search across content, titles, and summaries.

### Stats Dashboard

Use the helper functions to create analytics:

- Most active sources
- Tag frequency analysis
- Content type breakdown
- Publishing velocity

## Migration Strategy

### Phase 1: Add Dense View

1. Test that `/dense` works with your existing data
2. Verify tag filtering works with `/tag/[tag]`

### Phase 2: Enhance Existing Views

1. Make tags clickable in `HeadlineLink.vue`
2. Add view mode toggle to homepage
3. Test that filtering preserves news-focused content

### Phase 3: Advanced Features

1. Add source filtering
2. Implement search
3. Create stats/analytics views
4. Add keyboard shortcuts for power users

## Notes

- The components assume the same Supabase `scraps` table structure
- All styling is compatible with your existing Tailwind setup
- The hacker aesthetic can be toned down by adjusting colors and fonts
- Consider adding a "news mode" vs "data mode" toggle for different user preferences

---

## Quick Start

To immediately see the dense view:

1. Visit `/dense`
2. Click any tag to filter
3. Use the breadcrumb to navigate back

The dense view shows ~10x more content per screen and is perfect for power users who want to scan large amounts of news quickly.
