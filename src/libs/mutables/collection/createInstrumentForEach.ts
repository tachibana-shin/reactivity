import toRaw from "../../../helpers/toRaw"
import toReactive from "../../../helpers/toReactive"
import toReadonly from "../../../helpers/toReadonly"
import toShallow from "../../../helpers/toShallow"
import { SYMBOL_RAW } from "../../../symbols"
import { emitGetter } from "../../tracker"

export default function createInstrumentForEach<T, V>(
  isReadonly: boolean,
  isShallow: boolean
): Map<T, V>["forEach"] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function forEach(this: any, callback, thisArg: any) {
    const target = this[SYMBOL_RAW] as Map<T, V> // raw value

    const rawTarget = toRaw(target)

    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive

    if (!isReadonly) emitGetter(rawTarget, "iterate") // because readonly not change

    return target.forEach((value, key) => {
      // important: make sure the callback is
      // 1. invoked with the reactive map as `this` and 3rd arg
      // 2. the value received should be a corresponding reactive/readonly.
      return callback.call(thisArg, wrap(value), wrap(key), this)
    })
  }
}
