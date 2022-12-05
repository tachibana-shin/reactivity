import type { TrackEffect } from "./tracker"
import {
  addListenerTrackEffect,
  createTrackEffect,
  removeListenerTrackEffect
} from "./tracker"

export default class TrackerEffect<T> {
  private _ruv = false
  private _ge?: TrackEffect
  private _ru: () => void

  constructor(private fn: () => T, scheduler?: () => void) {
    this._ru = scheduler || this.run.bind(this)
  }

  run() {
    if (this._ruv === true) return this.fn()
    if (this._ge) removeListenerTrackEffect(this._ge, this._ru)

    const cancelTrack = createTrackEffect()
    const val = this.fn()
    this._ge = cancelTrack()
    addListenerTrackEffect(this._ge, this._ru)

    return val
  }

  stop() {
    this._ruv = true
    if (this._ge) {
      removeListenerTrackEffect(this._ge, this._ru)
      this._ge = undefined
    }
  }
}
