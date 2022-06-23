import { SYMBOL_SKIP } from "../symbols"

export default function markRaw<T extends object>(value: T): T {
  Object.defineProperty(value, SYMBOL_SKIP, {
    configurable: true,
    enumerable: false,
    value: true
  })
  return value
}
