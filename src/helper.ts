function b642arr(b64str: string): Uint8Array {
  const atob = b64Encoded => Buffer.from(b64Encoded, 'base64').toString('binary')

  return Uint8Array.from(atob(b64str), c => c.charCodeAt(0))
}

function arr2b64(byteArray): string {
  const btoa = arr => Buffer.from(arr, 'binary').toString('base64')

  return btoa(Array.from(new Uint8Array(byteArray)).map(val => String.fromCharCode(val)).join(''))
}

function arr2b64url(byteArray): string {
  return arr2b64(byteArray).replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
}

export {
  b642arr,
  arr2b64,
  arr2b64url
}