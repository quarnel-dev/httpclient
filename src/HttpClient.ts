import type { HttpClientOptions, RequestOptions, HttpMethod, HttpHeaders } from './types/httpClient.types.js'

export class HttpClient {
  private readonly baseUrl: string
  private readonly defaultHeaders: HttpHeaders

  constructor(options: HttpClientOptions = {}) {
    this.baseUrl = options.baseURL ?? ''
    this.defaultHeaders = options.headers ?? {}
  }

  get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', url, undefined, options)
  }

  post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', url, body, options)
  }

  put<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', url, body, options)
  }

  patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', url, body, options)
  }

  delete<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', url, body, options)
  }

  private async request<T>(method: HttpMethod, url: string, body: unknown, options: RequestOptions = {}): Promise<T> {
    throw new Error('not implemented')
  }
}
