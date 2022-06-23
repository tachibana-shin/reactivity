import { SYMBOL_RAW, SYMBOL_READONLY } from "../symbols"

import isReadonly from "./isReadonly"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function isReactive(value: any): boolean {
  if (isReadonly(value)) return isReactive(value[SYMBOL_RAW])

  return value?.[SYMBOL_READONLY] === false
}
