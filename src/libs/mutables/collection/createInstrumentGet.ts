import toRaw from "../../../helpers/toRaw"
import toReactive from "../../../helpers/toReactive"
import toReadonly from "../../../helpers/toReadonly"
import toShallow from "../../../helpers/toShallow"
import { SYMBOL_RAW } from "../../../symbols"
import { emitGetter } from "../../tracker"

export default function createInstrumentGet<T, V>(
  isReadonly: boolean,
  isShallow: boolean
): Map<T, V>["get"] {
  const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function get(this: any, key: T) {
    const target = this[SYMBOL_RAW] as Map<T, V> // raw value

    const rawTarget = toRaw(target)

    if (!isReadonly) emitGetter(rawTarget, "get", key) // because readonly not change

    const { has } = rawTarget

    if (has.call(rawTarget, key)) return wrap(target.get(key))

    const rawKey = toRaw(key)
    if (has.call(rawTarget, rawKey)) return wrap(target.get(rawKey))

    if (target !== rawTarget) target.get(key)
  }
}
