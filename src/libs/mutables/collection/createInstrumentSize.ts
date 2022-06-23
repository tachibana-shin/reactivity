import toRaw from "../../../helpers/toRaw"
import { SYMBOL_RAW } from "../../../symbols"
import { emitGetter } from "../../tracker"

export default function createInstrumentSize<T, V>(
  isReadonly: boolean
): () => Map<T, V>["size"] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function size(this: any) {
    const target = this[SYMBOL_RAW] as Map<T, V> // raw value

    if (!isReadonly) emitGetter(toRaw(target), "iterate")

    return Reflect.get(target, "size", target)
  }
}
