import toRaw from "../../../helpers/toRaw"
import { SYMBOL_RAW } from "../../../symbols"
import { emitSetter } from "../../tracker"

export default function createInstrumentClear<T, V>(
  isReadonly: boolean
): Map<T, V>["clear"] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function set(this: any) {
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

    const hadItems = target.size !== 0
    // forward the operation before queueing reactions
    const result = target.clear()
    if (hadItems) emitSetter(toRaw(target), "clear")

    return result
  }
}
