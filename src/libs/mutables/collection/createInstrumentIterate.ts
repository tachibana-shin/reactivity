import { isMap } from "util/types"

import toRaw from "../../../helpers/toRaw"
import toReactive from "../../../helpers/toReactive"
import toReadonly from "../../../helpers/toReadonly"
import toShallow from "../../../helpers/toShallow"
import { SYMBOL_RAW } from "../../../symbols"
import { emitGetter } from "../../tracker"

export default function createInstrumentIterate<
  T,
  V,
  M extends "keys" | "values" | "entries" | typeof Symbol.iterator
>(method: M, isReadonly: boolean, isShallow: boolean): Map<T, V>[M] {
  // eslint-disable-next-line functional/functional-parameters, @typescript-eslint/no-explicit-any
  return function (this: any, ...args: any[]) {
    const target = this[SYMBOL_RAW] as Map<T, V> // raw value

    const rawTarget = toRaw(target)

    const targetIsMap = isMap(rawTarget)
    const isPair =
      method === "entries" || (method === Symbol.iterator && targetIsMap)

    const isKeyOnly = method === "keys" && targetIsMap
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const innerIterator = target[method](...args)
    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive

    if (!isReadonly) emitGetter(rawTarget, "iterate", isKeyOnly) // because readonly not change

    // return a wrapped iterator which returns observed versions of the
    // values emitted from the real iterator
    return {
      // iterator protocol
      next() {
        const { value, done } = innerIterator.next()
        return done
          ? { value, done }
          : {
              value: isPair
                ? [wrap((value as [T, V])[0]), wrap((value as [T, V])[1])]
                : wrap(value),
              done
            }
      },
      // iterable protocol
      [Symbol.iterator]() {
        return this
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as unknown as any
}
