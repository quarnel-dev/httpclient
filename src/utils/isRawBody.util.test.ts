import { describe, it, expect } from 'vitest'
import { isRawBody } from './isRawBody.util'

describe('isRawBody', () => {
  it.each([
    ['string', 'hello'],
    ['FormData', new FormData()],
    ['Blob', new Blob(['x'])],
    ['URLSearchParams', new URLSearchParams()],
    ['ReadableStream', new ReadableStream()],
    ['ArrayBuffer', new ArrayBuffer(8)],
    ['Uint8Array', new Uint8Array(8)],
    ['DataView', new DataView(new ArrayBuffer(8))],
  ])('returns true for %s', (_label, value) => {
    expect(isRawBody(value)).toBe(true)
  })

  it.each([
    ['plain object', { a: 1 }],
    ['array', [1, 2, 3]],
    ['null', null],
    ['number', 42],
    ['boolean', true],
  ])('returns false for %s', (_label, value) => {
    expect(isRawBody(value)).toBe(false)
  })
})
