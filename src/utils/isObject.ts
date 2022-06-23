// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function isObject(value: any): value is object {
  return value !== null && typeof value === "object"
}
