export function forEachValue(object, fn) {
  for (const key in object) {
    if (Object.hasOwnProperty.call(object, key)) {
      fn(object[key], key)
    }
  }
}

export function isPromise(val) {
  return val && typeof val.then === 'function'
}
