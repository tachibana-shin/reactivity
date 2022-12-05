import toRaw from "../helpers/toRaw"
import { SYMBOL_READONLY, SYMBOL_REF } from "../symbols"

import TrackerEffect from "./TrackerEffect"
import type { UnwrapRef } from "./ref"
import { emitGetter, emitSetter } from "./tracker"

const setterDefault = () => {
  // eslint-disable-next-line no-undef
  if (__DEV__)
    console.warn("Write operation failed: computed value is readonly")
}
class ComputedImplement<T> {
  public readonly [SYMBOL_REF] = true
  public readonly [SYMBOL_READONLY]?: true
  private _ruv = true
  private _v?: T
  public effect: TrackerEffect<T>

  constructor(
    private readonly _getter: () => T,
    private readonly _setter: (value: T) => void,
    readonly?: boolean
  ) {
    this.effect = new TrackerEffect(this._getter, () => {
      if (!this._ruv) {
        this._ruv = true
        emitSetter(this, "set", "value", undefined, undefined)
      }
    })

    if (readonly) this[SYMBOL_READONLY] = true
  }

  get value(): T {
    if (this._ruv) {
      this._v = this.effect.run()
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

export interface WritableComputedRef<T> {
  [SYMBOL_REF]: true
  value: UnwrapRef<T>
  effect: Pick<TrackerEffect<T>, "stop">
}
export interface ReadableComputedRef<T> {
  [SYMBOL_REF]: true
  [SYMBOL_READONLY]: true
  readonly value: UnwrapRef<T>
  effect: Pick<TrackerEffect<T>, "stop">
}

type Computed<T> = ReadableComputedRef<T> | WritableComputedRef<T>

function computed<T>(options: {
  get: () => T
  set?: (value: T) => void
}): WritableComputedRef<T>
// eslint-disable-next-line no-redeclare
function computed<T>(getter: () => T): ReadableComputedRef<T>
// eslint-disable-next-line no-redeclare
function computed<T>(
  options:
    | (() => T)
    | {
        get: () => T
        set?: (value: T) => void
      }
): Computed<T> {
  // eslint-disable-next-line functional/no-let
  let getter: () => T, setter: (value: T) => void
  // eslint-disable-next-line functional/no-let
  let onlyGetter: true | void

  if (typeof options === "function") {
    getter = options
    setter = setterDefault
    onlyGetter = true
  } else {
    getter = options.get
    setter = options.set || setterDefault
  }

  return new ComputedImplement<T>(
    getter,
    setter,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onlyGetter || !(options as any).set
  ) as unknown as Computed<T>
}

export default computed
