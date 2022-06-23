import createReactiveObject from "../helpers/createReactiveObject"
import { readonlyMap } from "../weak-map"

import createGetter from "./mutables/base/createGetter"

const mutableReadonlyHandlers: ProxyHandler<object> = {
  get: createGetter(true, false),
  set(target, key) {
    // eslint-disable-next-line no-undef
    if (__DEV__) {
      console.warn(
        `Set operation on key "${String(key)}" failed: target is readonly.`,
        target
      )
    }
    return true
  },
  deleteProperty(target, key) {
    // eslint-disable-next-line no-undef
    if (__DEV__) {
      console.warn(
        `Delete operation on key "${String(key)}" failed: target is readonly.`,
        target
      )
    }

    return true
  }
}

export default function readonly<T>(value: T): Readonly<T> {
  return createReactiveObject(
    value,
    true,
    mutableReadonlyHandlers,
    mutableReadonlyHandlers,
    readonlyMap
  )
}
