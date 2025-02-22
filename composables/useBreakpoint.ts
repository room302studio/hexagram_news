import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

export function useBreakpoint() {
  const breakpoints = useBreakpoints(breakpointsTailwind)

  const isMobile = breakpoints.smaller('md')
  const isTablet = breakpoints.between('md', 'lg')
  const isDesktop = breakpoints.greater('lg')
  const isLargeDesktop = breakpoints.greater('xl')

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop
  }
}
