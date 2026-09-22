import type { HttpError } from '../errors/HttpError.error.js'

export interface RetryOptions {
  attempts: number
  delay: number
  retryOn?: (error: HttpError, attempt: number) => boolean
}
