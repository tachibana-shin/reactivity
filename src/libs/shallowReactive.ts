import createReactiveObject from "../helpers/createReactiveObject"
import { shallowReactiveMap } from "../weak-map"

import createGetter from "./mutables/base/createGetter"
import createSetter from "./mutables/base/createSetter"

export const mutableShallowHandlers: ProxyHandler<object> = {
  get: createGetter(false, true),
  set: createSetter(false, true)
}

export default function shallowReactive<T>(value: T): T {
  return createReactiveObject(
    value,
    false,
    mutableShallowHandlers,
    mutableShallowHandlers,
    shallowReactiveMap
  )
}
