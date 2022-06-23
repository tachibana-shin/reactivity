import { SYMBOL_RAW, SYMBOL_READONLY, SYMBOL_SKIP } from "../symbols"
import isObject from "../utils/isObject"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function targetTypeMap(rawType: any) {
  switch (Object.prototype.toString.call(rawType).slice(8, -1)) {
    case "Object":
    case "Array":
      return 1 /* COMMON */
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2 /* COLLECTION */
    default:
      return 0 /* INVALID */
  }
}

export default function createReactiveObject<T extends object>(
  target: T,
  readonly: boolean,
  baseControl: ProxyHandler<T>,
  collectionControl: ProxyHandler<T>,
  proxyMap: WeakMap<T, T>
): T {
  // eslint-disable-next-line no-undef
  if (__DEV__) {
    if (!isObject(target)) {
      console.warn(`value cannot be made reactive: ${String(target)}`)
      return target
    }
  }

  if (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (target as any)[SYMBOL_RAW] &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !(readonly && (target as any)[SYMBOL_READONLY])
  )
    return target

  const proxyInCache = proxyMap.get(target)
  if (proxyInCache) return proxyInCache

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((target as any)[SYMBOL_SKIP] || !Object.isExtensible(target))
    return target

  const type = targetTypeMap(target)

  if (type === 0) return target

  const proxy = new Proxy(target, type === 2 ? collectionControl : baseControl)

  proxyMap.set(target, proxy)

  return proxy
}
