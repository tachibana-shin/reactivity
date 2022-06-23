import toRaw from "../../../helpers/toRaw"
import { SYMBOL_RAW } from "../../../symbols"
import { emitSetter } from "../../tracker"

export default function createInstrumentDelete<T, V>(
  isReadonly: boolean
): Map<T, V>["delete"] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function set(this: any, key: T) {
    const target = this[SYMBOL_RAW] as Map<T, V> // raw value

    if (isReadonly) {
      // eslint-disable-next-line no-undef
      if (__DEV__) {
        console.warn(
          // eslint-disable-next-line quotes
          'Set operation on action "delete" failed: target is readonly.',
          target
        )
      }

      return this
    }

    const { has, get } = target
    const hadKey = has.call(target, key) || has.call(target, toRaw(key))

    const oldValue = get ? get.call(target, key) : undefined
    // forward the operation before queueing reactions
    const result = target.delete(key)
    if (hadKey) emitSetter(toRaw(target), "delete", key, undefined, oldValue)

    return result
  }
}
