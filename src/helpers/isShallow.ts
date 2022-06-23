import { SYMBOL_SHALLOW } from "../symbols"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function isShallow(value: any): boolean {
  return value?.[SYMBOL_SHALLOW] === true
}
