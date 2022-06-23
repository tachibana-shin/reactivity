/* eslint-disable indent */
import { SYMBOL_RAW, SYMBOL_READONLY, SYMBOL_SHALLOW } from "../../../symbols"

import createInstrumentAdd from "./createInstrumentAdd"
import createInstrumentClear from "./createInstrumentClear"
import createInstrumentDelete from "./createInstrumentDelete"
import createInstrumentForEach from "./createInstrumentForEach"
import createInstrumentGet from "./createInstrumentGet"
import createInstrumentHas from "./createInstrumentHas"
import createInstrumentIterate from "./createInstrumentIterate"
import createInstrumentSet from "./createInstrumentSet"
import createInstrumentSize from "./createInstrumentSize"

const iteratorMethods: (
  | "keys"
  | "values"
  | "entries"
  | typeof Symbol.iterator
)[] = ["keys", "values", "entries", Symbol.iterator]

export default function createCollectionGetter(
  isReadonly: boolean,
  isShallow: boolean
): ProxyHandler<object>["get"] {
  const sizeCaller = createInstrumentSize(isReadonly)
  const instrumentations: Pick<Set<unknown>, "add"> &
    Pick<
      Map<unknown, unknown>,
      "clear" | "delete" | "forEach" | "get" | "has" | "set" | "size"
    > = {
    add: createInstrumentAdd(isReadonly),
    clear: createInstrumentClear(isReadonly),
    delete: createInstrumentDelete(isReadonly),
    forEach: createInstrumentForEach(isReadonly, isShallow),
    get: createInstrumentGet(isReadonly, isShallow),
    has: createInstrumentHas(isReadonly),
    // eslint-disable-next-line n/no-unsupported-features/es-builtins
    ...Object.fromEntries(
      iteratorMethods.map((method) => {
        return [method, createInstrumentIterate(method, isReadonly, isShallow)]
      })
    ),
    set: createInstrumentSet(isReadonly),
    get size() {
      return sizeCaller.call(this)
    }
  }

  return function get(target, prop, receiver) {
    switch (prop) {
      case SYMBOL_RAW:
        return target
      case SYMBOL_READONLY:
        return isReadonly
      case SYMBOL_SHALLOW:
        return isShallow
    }

    if (prop in instrumentations)
      return Reflect.get(instrumentations, prop, receiver)

    return Reflect.get(target, prop, receiver)
  }
}
