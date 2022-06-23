import toRaw from "../../../helpers/toRaw"
import { SYMBOL_RAW } from "../../../symbols"
import { emitSetter } from "../../tracker"

export default function createInstrumentAdd<T>(
  isReadonly: boolean
): Set<T>["add"] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function add(this: any, value: T) {
    const target = this[SYMBOL_RAW] as Set<T> // raw value

    if (isReadonly) {
      // eslint-disable-next-line no-undef
      if (__DEV__) {
        console.warn(
          // eslint-disable-next-line quotes
          'Set operation on action "add" failed: target is readonly.',
          target
        )
      }

      return this
    }

    const rawTarget = toRaw(target)

    value = toRaw(value)
    const hadKey = rawTarget.has(value)

    if (!hadKey) {
      rawTarget.add(value)

      emitSetter(rawTarget, "add", value, value)
    }

    return this
  }
}
