import toRaw from "../helpers/toRaw"
import { SYMBOL_READONLY, SYMBOL_REF } from "../symbols"

import type { TrackEffect } from "./tracker"
import {
  addListenerTrackEffect,
  createTrackEffect,
  emitGetter,
  emitSetter,
  removeListenerTrackEffect
} from "./tracker"

const setterDefault = () => {
  // eslint-disable-next-line no-undef
  if (__DEV__)
    console.warn("Write operation failed: computed value is readonly")
}
class ComputedImplement<T> {
  public readonly [SYMBOL_REF] = true
  private readonly [SYMBOL_READONLY]?: true
  private _ruv = true
  private _v?: T
  private _ge?: TrackEffect
  private _ru: () => void
  constructor(
    private readonly _getter: () => T,
    private readonly _setter: (value: T) => void,
    readonly?: boolean
  ) {
    this._ru = () => {
      if (!this._ruv) {
        this._ruv = true
        emitSetter(this, "set", "value", undefined, undefined)
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      removeListenerTrackEffect(this._ge!, this._ru)
    }

    if (readonly) this[SYMBOL_READONLY] = true
  }

  get value(): T {
    if (this._ruv) {
      const cancelTrack = createTrackEffect()
      const val = this._getter()
      this._ge = cancelTrack()
      addListenerTrackEffect(this._ge, this._ru)

      this._v = val
      this._ruv = false
    }

    // fix future by forceRef
    emitGetter(toRaw(this), "get", "value", this._v)

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this._v!
  }

  set value(val: T) {
    this._setter(val)
  }
}

function computed<T>(options: {
  get: () => T
  set?: (value: T) => void
}): ComputedImplement<T>
// eslint-disable-next-line no-redeclare
function computed<T>(getter: () => T): ComputedImplement<T>
// eslint-disable-next-line no-redeclare
function computed<T>(
  options:
    | (() => T)
    | {
        get: () => T
        set?: (value: T) => void
      }
): ComputedImplement<T> {
  // eslint-disable-next-line functional/no-let
  let getter: () => T, setter: (value: T) => void
  // eslint-disable-next-line functional/no-let
  let onlyGetter: true | void

  if (typeof options === "function") {
    getter = options
    onlyGetter = true
  } else {
    getter = options.get
    setter = options.set || setterDefault
  }

  return new ComputedImplement<T>(
    getter,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    setter!,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onlyGetter || !(options as any).set
  )
}

export default computed
