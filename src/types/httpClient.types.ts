import type { RetryOptions } from './retry.types.js'

export type HttpHeaders = Record<string, string> | Headers | [string, string][]

export interface HttpClientOptions {
  baseURL?: string
  headers?: HttpHeaders
  retry?: RetryOptions
}

export interface RequestOptions extends Omit<RequestInit, 'body' | 'method' | 'headers'> {
  headers?: HttpHeaders
  retry?: RetryOptions | false
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type RequestBody = NonNullable<RequestInit['body']>
