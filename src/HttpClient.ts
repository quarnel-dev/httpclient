import { HttpError } from './errors/HttpError.error.js'
import { isRawBody } from './utils/isRawBody.util.js'

import type { HttpClientOptions, RequestOptions, HttpMethod, HttpHeaders, RequestBody } from './types/httpClient.types.js'

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
    const { headers: optionHeaders, ...restOptions } = options

    const fullUrl = this.buildUrl(url)

    const mergedHeaders = new Headers(this.defaultHeaders)
    if (optionHeaders) {
      new Headers(optionHeaders).forEach((value, key) => {
        mergedHeaders.set(key, value)
      })
    }

    let finalBody: RequestBody | undefined

    if (body !== undefined) {
      if (isRawBody(body)) {
        finalBody = body
      } else {
        finalBody = JSON.stringify(body)
        if (!mergedHeaders.has('Content-Type')) {
          mergedHeaders.set('Content-Type', 'application/json')
        }
      }
    }

    let response: Response

    try {
      response = await fetch(fullUrl, {
        ...restOptions,
        method,
        headers: mergedHeaders,
        ...(finalBody !== undefined ? { body: finalBody } : {}),
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err
      }
      throw new HttpError('Network request failed', {
        url: fullUrl,
        cause: err,
      })
    }

    if (!response.ok) {
      throw new HttpError(`HTTP ${response.status}: ${response.statusText}`, {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
      })
    }

    const contentType = response.headers.get('Content-Type') ?? ''

    if (contentType.includes('application/json')) {
      return (await response.json()) as T
    }

    return (await response.text()) as T
  }

  private buildUrl(url: string) {
    if (!this.baseUrl) return url

    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) return url

    const base = this.baseUrl.replace(/\/+$/, '')
    const path = url.replace(/^\/+/, '')

    return path ? `${base}/${path}` : base
  }
}
