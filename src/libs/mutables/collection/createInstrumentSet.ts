import toRaw from "../../../helpers/toRaw"
import { SYMBOL_RAW } from "../../../symbols"
import { emitSetter } from "../../tracker"

export default function createInstrumentSet<T, V>(
  isReadonly: boolean
): Map<T, V>["set"] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function set(this: any, key: T, value: V) {
    const target = this[SYMBOL_RAW] as Map<T, V> // raw value

    if (isReadonly) {
      // eslint-disable-next-line no-undef
      if (__DEV__) {
        console.warn(
          // eslint-disable-next-line quotes
          'Set operation on action "set" failed: target is readonly.',
          target
        )
      }

      return this
    }

    const rawTarget = toRaw(target)

    value = toRaw(value)
    const { has, get } = target

    const hadKey = has.call(target, key) || has.call(target, toRaw(key))

    const oldValue = get.call(target, key)
    target.set(key, value)

    if (!hadKey) emitSetter(rawTarget, "add", key, value)
    else if (!Object.is(value, oldValue))
      emitSetter(rawTarget, "set", key, value, oldValue)

    return this
  }
}
