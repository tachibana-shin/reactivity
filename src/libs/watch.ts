import { isMap, isSet } from "util/types"

import isReactive from "../helpers/isReactive"
import isRef from "../helpers/isRef"
import noop from "../noop"
import { SYMBOL_FORCE_UPDATE, SYMBOL_SKIP } from "../symbols"
import isObject from "../utils/isObject"

import type { Ref } from "./ref"
import type { TrackEffect } from "./tracker"
import {
  addListenerTrackEffect,
  createTrackEffect,
  removeListenerTrackEffect
} from "./tracker"

type WatchSource<T> = Ref<T> | (() => T)
type MapSources<T, Immediate> = {
  [K in keyof T]: T[K] extends WatchSource<infer V>
    ? Immediate extends true
      ? V | undefined
      : V
    : T[K] extends object
    ? Immediate extends true
      ? T[K] | undefined
      : T[K]
    : never
}

type WatchStop = () => void
interface WatchOptions<Immediate extends boolean> {
  deep?: boolean
  immediate?: Immediate
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WatchCallback<N, O> = (newValue: N, oldValue: O) => any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function traverse(value: any, deep: boolean, seed = new WeakSet()) {
  if (value?.[SYMBOL_SKIP]) return value

  if (seed.has(value)) return value

  // eslint-disable-next-line no-unused-expressions, @typescript-eslint/no-explicit-any
  if (deep && isReactive(value)) (value as any)[SYMBOL_FORCE_UPDATE]
  else if (isRef(value)) traverse(value.value, deep, seed)
  else if (Array.isArray(value) || isMap(value) || isSet(value))
    value.forEach((item) => traverse(item, deep, seed))
  else if (isObject(value))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item in value) traverse((value as any)[item], deep, seed)

  return value
}

function watch<
  T extends (WatchSource<unknown> | object)[],
  Immediate extends Readonly<boolean> = false
>(
  source: [...T],
  cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
  options?: WatchOptions<Immediate>
): WatchStop
// eslint-disable-next-line no-redeclare
function watch<
  T extends (WatchSource<unknown> | object)[],
  Immediate extends Readonly<boolean> = false
>(
  source: T,
  cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
  options?: WatchOptions<Immediate>
): WatchStop
// eslint-disable-next-line no-redeclare
function watch<T, Immediate extends Readonly<boolean> = false>(
  source: WatchSource<T>,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: WatchOptions<Immediate>
): WatchStop
// eslint-disable-next-line no-redeclare
function watch<T extends object, Immediate extends Readonly<boolean> = false>(
  source: T,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: WatchOptions<Immediate>
): WatchStop
// eslint-disable-next-line no-redeclare, @typescript-eslint/no-explicit-any
function watch<T = any, Immediate extends Readonly<boolean> = false>(
  source: T | WatchSource<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cb: any,
  options?: WatchOptions<Immediate>
): WatchStop {
  // eslint-disable-next-line functional/no-let
  let deep: boolean = options?.deep ?? false
  // eslint-disable-next-line functional/no-let
  let getter: () => unknown

  if (isRef(source)) {
    getter = () => source.value
  } else if (isReactive(source)) {
    getter = () => source
    deep = true
    // source never is reactive(array[]) because checked reactive
  } else if (Array.isArray(source)) {
    getter = () =>
      source.map((item) => {
        if (isRef(item)) return item.value

        if (isReactive(item)) return traverse(item, true)

        if (typeof item === "function") return cb()

        return undefined
      })
  } else if (typeof source === "function") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getter = () => (source as any)()
  } else {
    getter = noop
  }

  if (deep) {
    const cache = getter
    getter = () => traverse(cache(), true)
  }

  // eslint-disable-next-line functional/no-let
  let getters: TrackEffect
  // eslint-disable-next-line functional/no-let
  let stop = false
  const start = () => {
    if (stop === true) return
    removeListenerTrackEffect(getters, start)

    const cancelTrack = createTrackEffect()

    const newValue = getter()
    if (deep || !Object.is(oldValue, newValue)) cb(newValue, oldValue)
    oldValue = newValue

    getters = cancelTrack()

    addListenerTrackEffect(getters, start)
  }

  const cancelTrack = createTrackEffect()
  // eslint-disable-next-line functional/no-let
  let oldValue = getter()
  getters = cancelTrack()
  addListenerTrackEffect(getters, start)

  if (options?.immediate) cb(oldValue, undefined)

  return () => {
    stop = true
    removeListenerTrackEffect(getters, start)
  }
}

export default watch
