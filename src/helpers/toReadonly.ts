import readonly from "../libs/readonly"
import isObject from "../utils/isObject"

export default function toReadonly<T>(value: T): T {
  if (isObject(value)) return readonly(value)

  return value
}
