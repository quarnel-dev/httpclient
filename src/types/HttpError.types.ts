export interface HttpErrorOptions {
  status?: number
  statusText?: string
  url: string
  body?: unknown
  cause?: unknown
  timeout?: boolean
}
