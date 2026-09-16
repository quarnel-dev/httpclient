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
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
      const client = new HttpClient({ baseURL: 'https://api.example.com' })

      await expect(client.get('/resource')).rejects.toThrow('Failed to fetch')
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
})
