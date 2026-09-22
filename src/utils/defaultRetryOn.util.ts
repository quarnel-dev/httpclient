import type { HttpError } from '../errors/HttpError.error.js'

export function defaultRetryOn(error: HttpError): boolean {
  return error.isNetworkError || error.status === 429 || (error.status !== undefined && error.status >= 500)
}
