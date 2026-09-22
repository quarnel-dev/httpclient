import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HttpClient } from './HttpClient.js'

function jsonResponse(body: unknown, status = 200, statusText = 'OK') {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'Content-Type': 'application/json' },
  })
}

function textResponse(body: string, status = 200, statusText = 'OK') {
  return new Response(body, {
    status,
    statusText,
    headers: { 'Content-Type': 'text/plain' },
  })
}

describe('HttpClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  describe('URL building', () => {
    it('uses raw url when no baseURL is set', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient()

      await client.get('https://api.example.com/users/1')

      expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/users/1', expect.objectContaining({ method: 'GET' }))
    })

    it('joins baseURL and path', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await client.get('/users/1')

      expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/users/1', expect.objectContaining({ method: 'GET' }))
    })

    it('preserves baseURL path when joining with relative url', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com/api/v1' })

      await client.get('/users')

      expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/api/v1/users', expect.objectContaining({ method: 'GET' }))
    })

    it('joins baseURL with trailing slash and url without leading slash', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com/api/v1/' })

      await client.get('users')

      expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/api/v1/users', expect.objectContaining({ method: 'GET' }))
    })

    it('joins baseURL and url both without slashes correctly', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com/api/v1' })

      await client.get('users')

      expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/api/v1/users', expect.objectContaining({ method: 'GET' }))
    })

    it('absolute url ignores baseURL', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await client.get('https://other.example.com/resource')

      expect(fetchMock).toHaveBeenCalledWith('https://other.example.com/resource', expect.objectContaining({ method: 'GET' }))
    })

    it('preserves query string in url when joining with baseURL', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com/api/v1' })

      await client.get('/users?page=2')

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/users?page=2',
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  describe('HTTP methods', () => {
    it.each([
      ['get', 'GET'],
      ['delete', 'DELETE'],
    ] as const)('%s() sends %s request', async (fnName, method) => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await client[fnName]('/resource')

      expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/resource', expect.objectContaining({ method }))
    })

    it.each([
      ['post', 'POST'],
      ['put', 'PUT'],
      ['patch', 'PATCH'],
    ] as const)('%s() sends %s request with JSON body', async (fnName, method) => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await client[fnName]('/resource', { name: 'John' })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/resource',
        expect.objectContaining({
          method,
          body: JSON.stringify({ name: 'John' }),
        })
      )

      const call = fetchMock.mock.calls[0]?.[1]
      const headers = call.headers as Headers
      expect(headers.get('Content-Type')).toBe('application/json')
    })
  })

  describe('body serialization', () => {
    it('serializes plain object to JSON and sets Content-Type', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await client.post('/users', { name: 'John' })

      const call = fetchMock.mock.calls[0]?.[1]
      expect(call.body).toBe(JSON.stringify({ name: 'John' }))
      expect((call.headers as Headers).get('Content-Type')).toBe('application/json')
    })

    it('does not touch Content-Type if already set explicitly', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await client.post('/users', { name: 'John' }, { headers: { 'Content-Type': 'application/vnd.api+json' } })

      const call = fetchMock.mock.calls[0]?.[1]
      expect((call.headers as Headers).get('Content-Type')).toBe('application/vnd.api+json')
    })

    it('passes string body as-is without JSON serialization', async () => {
      fetchMock.mockResolvedValue(textResponse('ok'))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await client.post('/raw', 'plain text body')

      const call = fetchMock.mock.calls[0]?.[1]
      expect(call.body).toBe('plain text body')
      expect((call.headers as Headers).has('Content-Type')).toBe(false)
    })

    it('passes FormData body as-is without JSON serialization', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      const form = new FormData()
      form.append('file', 'content')

      await client.post('/upload', form)

      const call = fetchMock.mock.calls[0]?.[1]
      expect(call.body).toBe(form)
      expect((call.headers as Headers).has('Content-Type')).toBe(false)
    })

    it('passes URLSearchParams body as-is without JSON serialization', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      const params = new URLSearchParams({ a: '1' })

      await client.post('/form', params)

      const call = fetchMock.mock.calls[0]?.[1]
      expect(call.body).toBe(params)
    })

    it('passes ArrayBuffer body as-is without JSON serialization', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      const buffer = new Uint8Array([1, 2, 3]).buffer

      await client.post('/upload', buffer)

      const call = fetchMock.mock.calls[0]?.[1]
      expect(call.body).toBe(buffer)
      expect((call.headers as Headers).has('Content-Type')).toBe(false)
    })

    it('passes ArrayBufferView (TypedArray) body as-is without JSON serialization', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      const view = new Uint8Array([1, 2, 3])

      await client.post('/upload', view)

      const call = fetchMock.mock.calls[0]?.[1]
      expect(call.body).toBe(view)
      expect((call.headers as Headers).has('Content-Type')).toBe(false)
    })

    it('passes ReadableStream body as-is without JSON serialization', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      const stream = new ReadableStream()

      await client.post('/upload', stream)

      const call = fetchMock.mock.calls[0]?.[1]
      expect(call.body).toBe(stream)
      expect((call.headers as Headers).has('Content-Type')).toBe(false)
    })

    it('does not include body key when no body is provided', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await client.get('/resource')

      const call = fetchMock.mock.calls[0]?.[1]
      expect('body' in call).toBe(false)
    })
  })

  describe('headers merging', () => {
    it('applies default headers from constructor', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({
        baseURL: 'https://api.example.com',
        headers: { Authorization: 'Bearer token' },
      })

      await client.get('/resource')

      const call = fetchMock.mock.calls[0]?.[1]
      expect((call.headers as Headers).get('Authorization')).toBe('Bearer token')
    })

    it('merges per-request headers with defaults', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({
        baseURL: 'https://api.example.com',
        headers: { Authorization: 'Bearer token', 'X-Default': 'yes' },
      })

      await client.get('/resource', { headers: { 'X-Request': 'yes' } })

      const call = fetchMock.mock.calls[0]?.[1]
      const headers = call.headers as Headers
      expect(headers.get('Authorization')).toBe('Bearer token')
      expect(headers.get('X-Default')).toBe('yes')
      expect(headers.get('X-Request')).toBe('yes')
    })

    it('per-request header overrides default header with the same name', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({
        baseURL: 'https://api.example.com',
        headers: { Authorization: 'Bearer default' },
      })

      await client.get('/resource', { headers: { Authorization: 'Bearer override' } })

      const call = fetchMock.mock.calls[0]?.[1]
      expect((call.headers as Headers).get('Authorization')).toBe('Bearer override')
    })
  })

  describe('response parsing', () => {
    it('parses JSON response when Content-Type is application/json', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ id: 1, name: 'John' }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      const result = await client.get<{ id: number; name: string }>('/users/1')

      expect(result).toEqual({ id: 1, name: 'John' })
    })

    it('parses text response when Content-Type is not JSON', async () => {
      fetchMock.mockResolvedValue(textResponse('plain response'))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      const result = await client.get<string>('/plain')

      expect(result).toBe('plain response')
    })

    it('parses text response when Content-Type header is missing', async () => {
      const response = new Response('no content-type body', { status: 200 })
      fetchMock.mockResolvedValue(response)
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      const result = await client.get<string>('/no-content-type')

      expect(result).toBe('no content-type body')
    })
  })

  describe('error handling', () => {
    it('throws an error when response status is not ok (404)', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'Not Found' }, 404, 'Not Found'))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await expect(client.get('/missing')).rejects.toThrow('HTTP 404: Not Found')
    })

    it('throws an error when response status is not ok (500)', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'Server Error' }, 500, 'Internal Server Error'))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await expect(client.post('/resource', {})).rejects.toThrow('HTTP 500: Internal Server Error')
    })

    it('propagates network errors from fetch', async () => {
      const networkError = new TypeError('Failed to fetch')
      fetchMock.mockRejectedValue(networkError)
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await expect(client.get('/resource')).rejects.toMatchObject({
        name: 'HttpError',
        message: 'Network request failed',
        status: undefined,
        cause: networkError,
      })
    })
  })

  describe('passthrough options', () => {
    it('forwards other RequestInit options like signal', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      const controller = new AbortController()
      await client.get('/resource', { signal: controller.signal })

      const call = fetchMock.mock.calls[0]?.[1]
      expect(call.signal).toBe(controller.signal)
    })
  })

  describe('HttpClient edge cases', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
      fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)
    })

    it('handles 204 No Content without throwing on empty body', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204, statusText: 'No Content' }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await expect(client.delete('/resource/1')).resolves.toBe('')
    })

    it('handles 205 Reset Content without throwing on empty body', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 205, statusText: 'Reset Content' }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await expect(client.post('/reset')).resolves.toBe('')
    })

    it('handles 200 with empty body and JSON content-type gracefully', async () => {
      fetchMock.mockResolvedValue(new Response('', { status: 200, headers: { 'Content-Type': 'application/json' } }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await expect(client.get('/empty')).rejects.toThrow()
    })

    it('does not set Content-Type for string body', async () => {
      fetchMock.mockResolvedValue(textResponse('ok'))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await client.post('/raw', 'hello')

      const call = fetchMock.mock.calls[0]?.[1]
      expect((call.headers as Headers).has('Content-Type')).toBe(false)
    })

    it('serializes null body as JSON "null"', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await client.post('/resource', null)

      const call = fetchMock.mock.calls[0]?.[1]
      expect(call.body).toBe('null')
      expect((call.headers as Headers).get('Content-Type')).toBe('application/json')
    })

    it('serializes array body as JSON', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await client.post('/batch', [1, 2, 3])

      const call = fetchMock.mock.calls[0]?.[1]
      expect(call.body).toBe('[1,2,3]')
      expect((call.headers as Headers).get('Content-Type')).toBe('application/json')
    })

    it('serializes number body as JSON', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await client.post('/count', 42)

      const call = fetchMock.mock.calls[0]?.[1]
      expect(call.body).toBe('42')
    })

    it('does not mutate default headers after request with per-request headers', async () => {
      fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ ok: true })))
      const client = new HttpClient({
        baseURL: 'https://api.example.com',
        headers: { Authorization: 'Bearer default' },
      })

      await client.get('/a', { headers: { Authorization: 'Bearer override', 'X-Extra': '1' } })
      await client.get('/b')

      const firstCall = fetchMock.mock.calls[0]?.[1]
      const secondCall = fetchMock.mock.calls[1]?.[1]

      expect((firstCall.headers as Headers).get('Authorization')).toBe('Bearer override')
      expect((firstCall.headers as Headers).get('X-Extra')).toBe('1')

      expect((secondCall.headers as Headers).get('Authorization')).toBe('Bearer default')
      expect((secondCall.headers as Headers).has('X-Extra')).toBe(false)
    })

    it('accepts Headers instance as per-request headers', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      const headers = new Headers({ 'X-From-Headers': 'yes' })
      await client.get('/resource', { headers })

      const call = fetchMock.mock.calls[0]?.[1]
      expect((call.headers as Headers).get('X-From-Headers')).toBe('yes')
    })

    it('accepts array of tuples as per-request headers', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await client.get('/resource', { headers: [['X-From-Array', 'yes']] })

      const call = fetchMock.mock.calls[0]?.[1]
      expect((call.headers as Headers).get('X-From-Array')).toBe('yes')
    })

    it('parses JSON response with charset parameter in Content-Type', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
      )
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await expect(client.get('/resource')).resolves.toEqual({ ok: true })
    })

    it('throws on invalid JSON when Content-Type is application/json', async () => {
      fetchMock.mockResolvedValue(
        new Response('not-json{', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await expect(client.get('/broken')).rejects.toThrow()
    })

    it('propagates AbortError as-is without wrapping', async () => {
      const abortError = new DOMException('The operation was aborted.', 'AbortError')
      fetchMock.mockRejectedValue(abortError)
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await expect(client.get('/resource')).rejects.toMatchObject({ name: 'AbortError' })
    })

    it('uses url as-is when baseURL is empty string', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: '' })

      await client.get('https://api.example.com/users')

      expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/users', expect.objectContaining({ method: 'GET' }))
    })

    it('does not send body for GET even if body argument is passed internally', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await client.get('/resource')

      const call = fetchMock.mock.calls[0]?.[1]
      expect('body' in call).toBe(false)
    })

    it('overrides default Content-Type with per-request one for JSON body', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({
        baseURL: 'https://api.example.com',
        headers: { 'Content-Type': 'application/vnd.api+json' },
      })

      await client.post('/resource', { a: 1 })

      const call = fetchMock.mock.calls[0]?.[1]
      expect((call.headers as Headers).get('Content-Type')).toBe('application/vnd.api+json')
    })

    it('sets Content-Type application/json when body is JSON and no header provided', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await client.post('/resource', { a: 1 })

      const call = fetchMock.mock.calls[0]?.[1]
      expect((call.headers as Headers).get('Content-Type')).toBe('application/json')
    })

    it('does not include undefined body in request init', async () => {
      fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ ok: true })))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await client.post('/resource', undefined)

      const call = fetchMock.mock.calls[0]?.[1]
      expect('body' in call).toBe(false)
    })

    it('forwards RequestInit options like cache and credentials', async () => {
      fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ ok: true })))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await client.get('/resource', { cache: 'no-cache', credentials: 'include' })

      const call = fetchMock.mock.calls[0]?.[1]
      expect(call.cache).toBe('no-cache')
      expect(call.credentials).toBe('include')
    })

    it('supports multiple sequential requests with different methods', async () => {
      fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ ok: true })))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await client.get('/a')
      await client.post('/b', { x: 1 })
      await client.delete('/c')

      expect(fetchMock).toHaveBeenCalledTimes(3)
      expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('GET')
      expect(fetchMock.mock.calls[1]?.[1]?.method).toBe('POST')
      expect(fetchMock.mock.calls[2]?.[1]?.method).toBe('DELETE')
    })
  })
})
