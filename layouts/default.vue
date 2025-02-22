<template>
  <div class="min-h-screen bg-white flex flex-col">
    <!-- Header -->
    <header class="border-b border-gray-100">
      <div class="max-w-screen-xl mx-auto px-4 py-8 md:py-12">
        <slot name="header">
          <h1 class="text-2xl md:text-4xl font-['Karla'] font-extrabold">Hexagram News</h1>
        </slot>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 max-w-screen-xl mx-auto px-4 py-8 md:py-12">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-100">
      <div class="max-w-screen-xl mx-auto px-4 py-8 md:py-12">
        <slot name="footer" />
      </div>
    </footer>
  </div>
</template>

<script setup>
const { isMobile } = useBreakpoint()
</script>