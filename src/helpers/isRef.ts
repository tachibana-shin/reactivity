import type { Ref } from "../libs/ref"
import { SYMBOL_REF } from "../symbols"

export default function isRef<T = unknown>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
): value is Ref<T> {
  return value?.[SYMBOL_REF] === true
}
