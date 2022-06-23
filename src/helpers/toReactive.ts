import reactive from "../libs/reactive"
import isObject from "../utils/isObject"

export default function toReactive<T>(value: T): T {
  if (isObject(value)) return reactive(value)

  return value
}
