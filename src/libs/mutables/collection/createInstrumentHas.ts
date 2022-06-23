import toRaw from "../../../helpers/toRaw"
import { SYMBOL_RAW } from "../../../symbols"
import { emitGetter } from "../../tracker"

export default function createInstrumentHas<T, V>(
  isReadonly = false
): Map<T, V>["has"] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function has(this: any, key: T) {
    const target = this[SYMBOL_RAW] as Map<T, V> // raw value

    const rawTarget = toRaw(target)

    if (!isReadonly) emitGetter(rawTarget, "has", key)

    return target.has(key) || target.has(toRaw(key))
  }
}
