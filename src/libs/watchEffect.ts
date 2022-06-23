import type { TrackEffect } from "./tracker"
import {
  addListenerTrackEffect,
  createTrackEffect,
  removeListenerTrackEffect
} from "./tracker"

export default function watchEffect(cb: () => void): () => void {
  // eslint-disable-next-line functional/no-let
  let getters: TrackEffect = new Map()
  // eslint-disable-next-line functional/no-let
  let stop = false
  const start = () => {
    if (stop === true) return
    removeListenerTrackEffect(getters, start)

    const cancelTrack = createTrackEffect()
    cb()
    getters = cancelTrack()

    addListenerTrackEffect(getters, start)
  }

  start()

  return () => {
    stop = true
    removeListenerTrackEffect(getters, start)
  }
}
