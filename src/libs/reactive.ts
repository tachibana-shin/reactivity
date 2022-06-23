import createReactiveObject from "../helpers/createReactiveObject"
import { reactiveMap } from "../weak-map"

import createGetter from "./mutables/base/createGetter"
import createSetter from "./mutables/base/createSetter"
import createCollectionGetter from "./mutables/collection/createCollectionGetter"
import type { Ref, UnwrapRefSimple } from "./ref"
import { emitGetter, emitSetter } from "./tracker"

const builtInSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .filter((key) => key !== "arguments" && key !== "caller")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((key) => (Symbol as any)[key as keyof symbol])
    .filter((v) => typeof v === "symbol")
)

const mutableHandlers: ProxyHandler<object> = {
  get: createGetter(false, false),
  set: createSetter(false, false),
  deleteProperty(target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldValue = (target as any)[prop]
    const hasKey = prop in target
    const deleted = Reflect.deleteProperty(target, prop)

    if (hasKey && deleted)
      emitSetter(target, "delete", prop, undefined, oldValue)

    return deleted
  },
  has(target, prop) {
    const has = Reflect.has(target, prop)

    if (typeof prop !== "symbol" || !builtInSymbols.has(prop))
      emitGetter(target, "has", prop)

    return has
  },
  ownKeys(target) {
    emitGetter(target, "iterate")

    return Reflect.ownKeys(target)
  }
}
const mutableHandlersCollection: ProxyHandler<object> = {
  get: createCollectionGetter(false, false)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnwrapRef<T> = T extends Ref<any> ? T : UnwrapRefSimple<T>
export default function reactive<T>(value: T): UnwrapRef<T> {
  return createReactiveObject(
    value,
    false,
    mutableHandlers,
    mutableHandlersCollection,
    reactiveMap
  )
}
