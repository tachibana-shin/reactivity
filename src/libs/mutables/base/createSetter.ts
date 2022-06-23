import isReadonly from "../../../helpers/isReadonly"
import isRef from "../../../helpers/isRef"
import isShallow from "../../../helpers/isShallow"
import toRaw from "../../../helpers/toRaw"
import { emitSetter } from "../../tracker"

export default function createGetter(
  readonly: boolean,
  shallow: boolean
): ProxyHandler<object>["set"] {
  if (readonly) {
    return function set(target, key) {
      // if (true === tru) {
      // eslint-disable-next-line no-undef
      if (__DEV__) {
        console.warn(
          `Set operation on key "${String(key)}" failed: target is readonly.`,
          target
        )
      }
      // }

      return true
    }
  }

  return function set(target, prop, value, receiver) {
    // eslint-disable-next-line functional/no-let, @typescript-eslint/no-explicit-any
    let oldValue = (target as any)[prop]

    if (isReadonly(oldValue)) return false

    if (isRef(oldValue) && !isRef(value)) return false

    // skip ref but not skip item in array
    if (!shallow && !isReadonly(value)) {
      if (!isShallow(value)) {
        value = toRaw(value)
        oldValue = toRaw(oldValue)
      }
      if (!Array.isArray(target) && isRef(oldValue) && !isRef(value)) {
        // eslint-disable-next-line functional/immutable-data
        oldValue.value = value
        return true
      }
    }

    const isKeyInTarget = prop in target

    const settee = Reflect.set(target, prop, value, receiver)

    if (target === toRaw(receiver)) {
      if (isKeyInTarget) {
        if (!Object.is(oldValue, value))
          emitSetter(target, "set", prop, value, oldValue)
      } else {
        emitSetter(target, "add", prop, value)
      }
    }

    return settee
  }
}
