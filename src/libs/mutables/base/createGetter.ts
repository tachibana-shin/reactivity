import isRef from "../../../helpers/isRef"
import {
  SYMBOL_RAW,
  SYMBOL_READONLY,
  SYMBOL_REF,
  SYMBOL_SHALLOW
} from "../../../symbols"
import isObject from "../../../utils/isObject"
import {
  reactiveMap,
  readonlyMap,
  shallowReactiveMap,
  shallowReadonlyMap
} from "../../../weak-map"
import reactive from "../../reactive"
import { emitGetter } from "../../tracker"

const builtInSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .filter((key) => key !== "arguments" && key !== "caller")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((key) => (Symbol as any)[key as keyof symbol])
    .filter((v) => typeof v === "symbol")
)

export default function createGetter(
  isReadonly: boolean,
  isShallow: boolean
): ProxyHandler<object>["get"] {
  // prettier-ignore
  const weakMapStore = isReadonly
    ? isShallow
      ? shallowReadonlyMap
      : readonlyMap
    : isShallow
      ? shallowReactiveMap
      : reactiveMap

  return function get(target, prop, receiver) {
    switch (prop) {
      case SYMBOL_RAW:
        if (weakMapStore.get(target) === receiver) return target
        return undefined
      case SYMBOL_READONLY:
        return isReadonly
      case SYMBOL_SHALLOW:
        return isShallow
    }

    const value = Reflect.get(target, prop, receiver)

    if (
      typeof prop === "symbol"
        ? builtInSymbols.has(prop) || prop === SYMBOL_REF
        : prop === "__proto__"
    )
      return value

    if (!isReadonly) emitGetter(target, "get", prop, value)

    if (isShallow) return value

    // skip ref but not skip item in array
    if (isRef(value)) {
      return Array.isArray(target) && Number.isInteger(Number(prop))
        ? value
        : value.value
    }

    if (isObject(value))
      return isReadonly ? /* readonly(value) */ undefined : reactive(value)

    return value
  }
}
