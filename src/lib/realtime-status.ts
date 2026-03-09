/**
 * Module-level realtime connection status store.
 * Allows any component to read current status and react to changes
 * without needing React Context.
 */

export type RealtimeStatus = 'connected' | 'reconnecting' | 'offline';

export const REALTIME_STATUS_EVENT = 'mirrorai:realtime-status';

let _status: RealtimeStatus = 'offline';

/** Read the current realtime connection status synchronously. */
export function getRealtimeStatus(): RealtimeStatus {
  return _status;
}

/**
 * Update the status and dispatch a window event.
 * Called internally by the realtime sync hook.
 */
export function setRealtimeStatus(next: RealtimeStatus) {
  if (_status === next) return;
  _status = next;
  window.dispatchEvent(
    new CustomEvent(REALTIME_STATUS_EVENT, { detail: { status: next } })
  );
}
