/* eslint-disable @typescript-eslint/no-explicit-any */
import isRef from "../helpers/isRef"
import toRaw from "../helpers/toRaw"
import type { SYMBOL_RAW } from "../symbols"
import { SYMBOL_REF } from "../symbols"
import isObject from "../utils/isObject"

import reactive from "./reactive"
import { emitGetter, emitSetter } from "./tracker"

export interface Ref<T> {
  [SYMBOL_REF]: true
  value: T
}

export type ShallowUnwrapRef<T> = {
  [K in keyof T]: T[K] extends Ref<infer V>
    ? V
    : // if `V` is `unknown` that means it does not extend `Ref` and is undefined
    T[K] extends Ref<infer V> | undefined
    ? unknown extends V
      ? undefined
      : V | undefined
    : T[K]
}

declare const ShallowRefMarker: unique symbol

export type ShallowRef<T = any> = Ref<T> & { [ShallowRefMarker]?: true }

export type UnwrapRef<T> = T extends ShallowRef<infer V>
  ? V
  : T extends Ref<infer V>
  ? // eslint-disable-next-line no-use-before-define
    UnwrapRefSimple<V>
  : // eslint-disable-next-line no-use-before-define
    UnwrapRefSimple<T>

type IterableCollections = Map<any, any> | Set<any>
type WeakCollections = WeakMap<any, any> | WeakSet<any>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface RefUnwrapBailTypes {}
declare const ShallowReactiveMarker: unique symbol
// eslint-disable-next-line no-multi-spaces
export type UnwrapRefSimple<T> = T extends  // eslint-disable-next-line @typescript-eslint/ban-types
  | Function
  | IterableCollections
  | WeakCollections
  | string
  | number
  | boolean
  | Ref<any>
  | RefUnwrapBailTypes[keyof RefUnwrapBailTypes]
  | { [SYMBOL_RAW]?: true }
  ? T
  : T extends Array<any>
  ? {
      // eslint-disable-next-line @typescript-eslint/space-infix-ops
      [K in keyof T]: UnwrapRefSimple<T[K]>
    }
  : T extends object & {
      // eslint-disable-next-line @typescript-eslint/space-infix-ops
      [ShallowReactiveMarker]?: never
    }
  ? {
      // eslint-disable-next-line @typescript-eslint/space-infix-ops
      [P in keyof T]: P extends symbol ? T[P] : UnwrapRef<T[P]>
    }
  : T

export class RefImpl<T> {
  public readonly [SYMBOL_REF] = true
  private _value: UnwrapRef<T>
  constructor(private _raw: T, private readonly _shallow: boolean) {
    this._value = (
      _shallow || !isObject(_raw) ? _raw : reactive(_raw)
    ) as UnwrapRef<T>
  }

  get value(): UnwrapRef<T> {
    emitGetter(this, "get", "value", this._value)
    return this._value
  }

  set value(val: any) {
    val = this._shallow ? val : toRaw(val)

    if (!Object.is(val, this._raw)) {
      const { _raw: old } = this
      this._raw = val
      this._value = (
        this._shallow || !isObject(val) ? val : reactive(val)
      ) as UnwrapRef<T>
      emitSetter(this, "set", "value", val, old)
    }
  }
}

export function ref<T>(value: T): Ref<UnwrapRef<T>> {
  if (isRef<T>(value)) return value as any

  return new RefImpl(value as any, false)
}
export function shallowRef<T>(value: T): Ref<ShallowUnwrapRef<T>> {
  if (isRef<T>(value)) return value as any

  return new RefImpl(value as any, true) as any
}
