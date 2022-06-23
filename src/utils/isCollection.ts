export default function isCollection<T extends object>(target: T): boolean {
  switch (target.toString().slice(8, -1)) {
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return true

    default:
      return false
  }
}
