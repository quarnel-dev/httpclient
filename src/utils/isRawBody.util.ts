import type { RequestBody } from '../types/httpClient.types.js'

export function isRawBody(body: unknown): body is RequestBody {
  return (
    typeof body === 'string' ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ReadableStream ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  )
}
