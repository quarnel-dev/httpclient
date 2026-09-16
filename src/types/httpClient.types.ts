export type HttpHeaders = Record<string, string> | Headers | [string, string][]

export interface HttpClientOptions {
  baseURL?: string
  headers?: HttpHeaders
}

export interface RequestOptions extends Omit<RequestInit, 'body' | 'method' | 'headers'> {
  headers?: HttpHeaders
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type RequestBody = string | FormData | Blob | URLSearchParams
