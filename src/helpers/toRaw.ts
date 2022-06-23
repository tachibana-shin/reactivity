import { SYMBOL_RAW } from "../symbols"

export default function toRaw<T>(value: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (value as any)?.[SYMBOL_RAW]
  return raw ? toRaw(raw) : value
}
