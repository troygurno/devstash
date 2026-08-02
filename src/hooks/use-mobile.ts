import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onStoreChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY)
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

/**
 * shadcn ships this hook with a setState inside an effect, which the
 * `react-hooks/set-state-in-effect` rule in eslint-config-next 16 rejects.
 * useSyncExternalStore gets the same behavior without the effect. The server
 * snapshot is `false`, matching the old hook's pre-mount value.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false
  )
}
