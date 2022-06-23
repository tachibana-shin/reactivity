import { SYMBOL_READONLY } from "../symbols"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function isReadonly(value: any): boolean {
  return value?.[SYMBOL_READONLY] === true
}
