<template>
  <div>
    <slot />
  </div>
</template>

<script setup>
const { isMobile } = useBreakpoint()
</script>