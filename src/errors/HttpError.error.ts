import type { HttpErrorOptions } from '../types/HttpError.types.js'

export class HttpError extends Error {
  readonly status?: number | undefined
  readonly statusText?: string | undefined
  readonly url: string
  readonly body?: unknown
  readonly timeout: boolean

  constructor(message: string, options: HttpErrorOptions) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined)

    this.name = 'HttpError'
    this.status = options.status
    this.statusText = options.statusText
    this.url = options.url
    this.body = options.body
    this.timeout = options.timeout ?? false
  }

  get isNetworkError(): boolean {
    return this.status === undefined
  }
}
