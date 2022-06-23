import createReactiveObject from "../helpers/createReactiveObject"
import { shallowReadonlyMap } from "../weak-map"

import createGetter from "./mutables/base/createGetter"
import { mutableShallowHandlers } from "./shallowReactive"

export const mutableShallowReadonlyHandlers: ProxyHandler<object> = {
  ...mutableShallowHandlers,
  get: createGetter(true, true)
}

export default function shallowReadonly<T>(value: T): Readonly<T> {
  return createReactiveObject(
    value,
    true,
    mutableShallowHandlers,
    mutableShallowHandlers,
    shallowReadonlyMap
  )
}
