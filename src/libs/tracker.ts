import isRef from "../helpers/isRef"
import { SYMBOL_FORCE_UPDATE, SYMBOL_READONLY } from "../symbols"
import isObject from "../utils/isObject"

// eslint-disable-next-line func-call-spacing
const trackerGetters = new Set<
  (
    target: object,
    type: string,
    prop: string | symbol,
    value: unknown,
    every: boolean
  ) => void
>()
function emitGetter(
  target: object,
  type: "get" | "has",
  prop: unknown,
  value?: unknown
): void
// eslint-disable-next-line no-redeclare
function emitGetter(target: object, type: "iterate", onlyKey?: boolean): void
// eslint-disable-next-line no-redeclare
function emitGetter(
  target: object,
  type: "get" | "has" | "iterate",
  prop?: unknown,
  value?: unknown
) {
  if (type === "iterate")
    prop = Array.isArray(target) ? "length" : Symbol.iterator

  const every = type === "get" && prop === SYMBOL_FORCE_UPDATE

  trackerGetters.forEach((cb) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cb(target, type as any, prop as any, value, every)
  })
}

export { emitGetter }

const trackerSetter = new WeakMap<
  object,
  Map<string | symbol, typeof emitSetter[]>
>()
function emitSetter(
  target: object,
  type: "add",
  prop: unknown,
  newValue: unknown
): void
// eslint-disable-next-line no-redeclare
function emitSetter(
  target: object,
  type: "set",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prop: any,
  newValue: unknown,
  oldValue: unknown
): void
// eslint-disable-next-line no-redeclare
function emitSetter(
  target: object,
  type: "delete",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prop: any,
  newValue: void,
  oldValue: unknown
): void
// eslint-disable-next-line no-redeclare
function emitSetter(target: object, type: "clear"): void
// eslint-disable-next-line no-redeclare
function emitSetter(
  target: object,
  type: "add" | "set" | "delete" | "clear",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prop?: any,
  newValue?: unknown,
  oldValue?: unknown
) {
  trackerSetter
    .get(target)
    ?.get(prop ?? "size")
    ?.forEach((cb) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cb(target, type as any, prop as any, newValue, oldValue)
    })
  trackerSetter
    .get(target)
    ?.get(SYMBOL_FORCE_UPDATE)
    ?.forEach((cb) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cb(target, type as any, prop as any, newValue, oldValue)
    })
}

export { emitSetter }

export type TrackEffect = Map<object, Set<string | symbol> | true>
export function createTrackEffect() {
  const getters: TrackEffect = new Map()
  const handle: (
    target: object,
    type: string,
    prop: string | symbol,
    value: unknown,
    every: boolean
  ) => void = (target, type, prop, value, every) => {
    // bypass object handle. Handle object, reactive in result
    if (
      !isRef(target) &&
      isObject(value) &&
      (value as any)[SYMBOL_READONLY] === false
    ) {
      if (process.env.NODE_ENV === "development")
        console.log("loggggg", target, prop)

      return
    }

    if (every) {
      getters.set(target, true)
      return
    }

    // eslint-disable-next-line functional/no-let
    let props = getters.get(target)
    if (props === true) return
    if (!props) getters.set(target, (props = new Set()))
    props.add(prop)
  }

  trackerGetters.add(handle)

  return () => {
    trackerGetters.delete(handle)

    return getters
  }
}

export function addListenerTrackEffect(
  source: ReturnType<ReturnType<typeof createTrackEffect>>,
  cb: typeof emitSetter
): void {
  source.forEach((props, target) => {
    // eslint-disable-next-line functional/no-let
    let trackProps = trackerSetter.get(target)
    if (!trackProps) trackerSetter.set(target, (trackProps = new Map()))

    if (props === true) {
      // eslint-disable-next-line functional/no-let, @typescript-eslint/no-non-null-assertion
      let tracksProp = trackProps!.get(SYMBOL_FORCE_UPDATE)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (!tracksProp) trackProps!.set(SYMBOL_FORCE_UPDATE, (tracksProp = []))
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      tracksProp!.push(cb)
      return
    }
    props.forEach((prop) => {
      // eslint-disable-next-line functional/no-let, @typescript-eslint/no-non-null-assertion
      let tracksProp = trackProps!.get(prop)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (!tracksProp) trackProps!.set(prop, (tracksProp = []))
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      tracksProp!.push(cb)
    })
  })
}
export function removeListenerTrackEffect(
  source: ReturnType<ReturnType<typeof createTrackEffect>>,
  cb: typeof emitSetter
): void {
  source.forEach((props, target) => {
    const trackProps = trackerSetter.get(target)
    if (!trackProps) return

    if (props === true) {
      const tracksProp = trackProps.get(SYMBOL_FORCE_UPDATE)
      if (!tracksProp) return

      tracksProp.splice(tracksProp.indexOf(cb) >>> 0, 1)
      return
    }
    props.forEach((prop) => {
      const tracksProp = trackProps.get(prop)
      if (!tracksProp) return

      tracksProp.splice(tracksProp.indexOf(cb) >>> 0, 1)
    })
  })
}

// const user = reactive({
//   name: "Tachibana Shin",
//   email: "tachib.shin@gmail.com",
//   permission: ["get"],
//   geo: {
//     loc: 0,
//     lat: 0
//   }
// })

// watch(
//   user,
//   (value) => {

//     console.log("changed")
//   },
//   {
//     // deep: true
//   }
// )

// // user.name = "Shin"
// user.geo.loc++
