/* eslint-disable functional/immutable-data */
import { describe, expect, test } from "vitest"

import isReactive from "../helpers/isReactive"
import isRef from "../helpers/isRef"
import markRaw from "../helpers/markRaw"
import toRaw from "../helpers/toRaw"
import { SYMBOL_SKIP } from "../symbols"

import computed from "./computed"
import reactive from "./reactive"
import { ref } from "./ref"
import watchEffect from "./watchEffect"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).__DEV__ = true

describe("reactivity/reactive", () => {
  test("Object", () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    expect(observed).not.toBe(original)
    expect(isReactive(observed)).toBe(true)
    expect(isReactive(original)).toBe(false)
    // get
    expect(observed.foo).toBe(1)
    // has
    expect("foo" in observed).toBe(true)
    // ownKeys
    expect(Object.keys(observed)).toEqual(["foo"])
  })

  test("proto", () => {
    const obj = {}
    const reactiveObj = reactive(obj)
    expect(isReactive(reactiveObj)).toBe(true)
    // read prop of reactiveObject will cause reactiveObj[prop] to be reactive
    const otherObj = { data: ["a"] }
    expect(isReactive(otherObj)).toBe(false)
    const reactiveOther = reactive(otherObj)
    expect(isReactive(reactiveOther)).toBe(true)
    expect(reactiveOther.data[0]).toBe("a")
  })

  test("nested reactives", () => {
    const original = {
      nested: {
        foo: 1
      },
      array: [{ bar: 2 }]
    }
    const observed = reactive(original)
    expect(isReactive(observed.nested)).toBe(true)
    expect(isReactive(observed.array)).toBe(true)
    expect(isReactive(observed.array[0])).toBe(true)
  })

  test("observing subtypes of IterableCollections(Map, Set)", () => {
    // subtypes of Map
    class CustomMap extends Map {}
    const cmap = reactive(new CustomMap())

    expect(cmap instanceof Map).toBe(true)
    expect(isReactive(cmap)).toBe(true)

    cmap.set("key", {})
    expect(isReactive(cmap.get("key"))).toBe(true)

    // subtypes of Set
    class CustomSet extends Set {}
    const cset = reactive(new CustomSet())

    expect(cset instanceof Set).toBe(true)
    expect(isReactive(cset)).toBe(true)

    // eslint-disable-next-line functional/no-let
    let dummy
    watchEffect(() => (dummy = cset.has("value")))
    expect(dummy).toBe(false)
    cset.add("value")
    expect(dummy).toBe(true)
    cset.delete("value")
    expect(dummy).toBe(false)
  })

  test("observing subtypes of WeakCollections(WeakMap, WeakSet)", () => {
    // subtypes of WeakMap
    class CustomMap extends WeakMap {}
    const cmap = reactive(new CustomMap())

    expect(cmap instanceof WeakMap).toBe(true)
    expect(isReactive(cmap)).toBe(true)

    const key = {}
    cmap.set(key, {})
    expect(isReactive(cmap.get(key))).toBe(true)

    // subtypes of WeakSet
    class CustomSet extends WeakSet {}
    const cset = reactive(new CustomSet())

    expect(cset instanceof WeakSet).toBe(true)
    expect(isReactive(cset)).toBe(true)

    // eslint-disable-next-line functional/no-let
    let dummy
    watchEffect(() => (dummy = cset.has(key)))
    expect(dummy).toBe(false)
    cset.add(key)
    expect(dummy).toBe(true)
    cset.delete(key)
    expect(dummy).toBe(false)
  })

  test("observed value should proxy mutations to original (Object)", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const original: any = { foo: 1 }
    const observed = reactive(original)
    // set
    observed.bar = 1
    expect(observed.bar).toBe(1)
    expect(original.bar).toBe(1)
    // delete
    delete observed.foo
    expect("foo" in observed).toBe(false)
    expect("foo" in original).toBe(false)
  })

  test("original value change should reflect in observed value (Object)", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const original: any = { foo: 1 }
    const observed = reactive(original)
    // set
    original.bar = 1
    expect(original.bar).toBe(1)
    expect(observed.bar).toBe(1)
    // delete
    delete original.foo
    expect("foo" in original).toBe(false)
    expect("foo" in observed).toBe(false)
  })

  test("setting a property with an unobserved value should wrap with reactive", () => {
    const observed = reactive<{ foo?: object }>({})
    const raw = {}
    observed.foo = raw
    expect(observed.foo).not.toBe(raw)
    expect(isReactive(observed.foo)).toBe(true)
  })

  test("observing already observed value should return same Proxy", () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    const observed2 = reactive(observed)
    expect(observed2).toBe(observed)
  })

  test("observing the same value multiple times should return same Proxy", () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    const observed2 = reactive(original)
    expect(observed2).toBe(observed)
  })

  test("should not pollute original object with Proxies", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const original: any = { foo: 1 }
    const original2 = { bar: 2 }
    const observed = reactive(original)
    const observed2 = reactive(original2)
    observed.bar = observed2
    expect(observed.bar).toBe(observed2)
    expect(original.bar).toBe(original2)
  })

  test("toRaw", () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    expect(toRaw(observed)).toBe(original)
    expect(toRaw(original)).toBe(original)
  })

  test("toRaw on object using reactive as prototype", () => {
    const original = reactive({})
    const obj = Object.create(original)
    const raw = toRaw(obj)
    expect(raw).toBe(obj)
    expect(raw).not.toBe(toRaw(original))
  })

  test("should not unwrap Ref<T>", () => {
    const observedNumberRef = reactive(ref(1))
    const observedObjectRef = reactive(ref({ foo: 1 }))

    expect(isRef(observedNumberRef)).toBe(true)
    expect(isRef(observedObjectRef)).toBe(true)
  })

  test("should unwrap computed refs", () => {
    // readonly
    const a = computed(() => 1)
    // writable
    const b = computed({
      get: () => 1,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      set: () => {}
    })
    const obj = reactive({ a, b })
    // check type
    // eslint-disable-next-line no-unused-expressions
    obj.a + 1
    // eslint-disable-next-line no-unused-expressions
    obj.b + 1
    expect(typeof obj.a).toBe("number")
    expect(typeof obj.b).toBe("number")
  })

  test("should allow setting property from a ref to another ref", () => {
    const foo = ref(0)
    const bar = ref(1)
    const observed = reactive({ a: foo })
    const dummy = computed(() => observed.a)
    expect(dummy.value).toBe(0)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    observed.a = bar
    expect(dummy.value).toBe(1)

    bar.value++
    expect(dummy.value).toBe(2)
  })

  test("non-observable values", () => {
    // built-ins should work and return same value
    const p = Promise.resolve()
    expect(reactive(p)).toBe(p)
    const r = /(?:)/
    expect(reactive(r)).toBe(r)
    const d = new Date()
    expect(reactive(d)).toBe(d)
  })

  test("markRaw", () => {
    const obj = reactive({
      foo: { a: 1 },
      bar: markRaw({ b: 2 })
    })
    expect(isReactive(obj.foo)).toBe(true)
    expect(isReactive(obj.bar)).toBe(false)
  })

  test("should not observe non-extensible objects", () => {
    const obj = reactive({
      foo: Object.preventExtensions({ a: 1 }),
      // sealed or frozen objects are considered non-extensible as well
      bar: Object.freeze({ a: 1 }),
      baz: Object.seal({ a: 1 })
    })
    expect(isReactive(obj.foo)).toBe(false)
    expect(isReactive(obj.bar)).toBe(false)
    expect(isReactive(obj.baz)).toBe(false)
  })

  test("should not observe objects with SYMBOL_SKIP", () => {
    const original = {
      foo: 1,
      [SYMBOL_SKIP]: true
    }
    const observed = reactive(original)
    expect(isReactive(observed)).toBe(false)
  })
})
