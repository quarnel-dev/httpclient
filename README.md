# HttpClient (@quarnel/httpclient)

[Read in Russian](README.ru.md) | English

Isomorphic HTTP client built on native `fetch`. No dependencies, no polyfills.

## Features

- **Isomorphic:** works in Node.js and browsers on native `fetch`/`Headers`/`AbortController`.
- **Zero dependencies:** no wrappers, no polyfills.
- **Smart body handling:** JSON by default, raw pass-through for `FormData`, `Blob`, `URLSearchParams`, `ArrayBuffer`, `ArrayBufferView`, `ReadableStream`, and `string`.
- **Retry:** configurable attempts, delay, and retry condition.
- **Timeout:** per-request or global, composable with your own `AbortSignal`.
- **HttpError:** unified error with `status`, `url`, `cause`, `isNetworkError`, and `timeout`.

## Installation

```bash
npm i @quarnel/httpclient
```

## Quick Start

```ts
import { HttpClient } from '@quarnel/httpclient'

const client = new HttpClient({ baseURL: 'https://api.example.com' })

const user = await client.get('/users/1')
await client.post('/users', { name: 'Quarnel' })
```

## API

### new HttpClient(options?)

| Option    | Type           | Description                              |
| --------- | -------------- | ----------------------------------------- |
| `baseURL` | `string`       | Base URL prepended to relative paths      |
| `headers` | `HttpHeaders`  | Default headers merged into every request |
| `retry`   | `RetryOptions` | Default retry behavior                    |
| `timeout` | `number`       | Default timeout in ms                     |

### Methods

```ts
client.get(url, options?)
client.post(url, body?, options?)
client.put(url, body?, options?)
client.patch(url, body?, options?)
client.delete(url, body?, options?)
```

`options` extends the native `RequestInit` (minus `body`/`method`/`headers`) plus `headers`, `retry`, and `timeout`.

## Retry

```ts
client.get('/resource', {
  retry: { attempts: 3, delay: 300 }
})
```

| Field      | Type                                          | Description                                      |
| ---------- | ---------------------------------------------- | ------------------------------------------------- |
| `attempts` | `number`                                       | Total attempts, including the first one           |
| `delay`    | `number`                                       | Fixed delay between attempts, ms                  |
| `retryOn`  | `(error: HttpError, attempt: number) => boolean` | Custom retry condition (default: network errors, 429, 5xx) |

Method-level `retry` fully replaces the constructor's `retry` (no deep merge). Pass `retry: false` to disable retry for a single call.

## Timeout

```ts
client.get('/resource', { timeout: 5000 })
```

Throws `HttpError` with `timeout: true` when exceeded. Composes with a user-provided `signal` via `AbortSignal.any` — aborting either one aborts the request.

## Error Handling

```ts
import { HttpClient, HttpError } from '@quarnel/httpclient'

const client = new HttpClient({ baseURL: 'https://api.example.com' })

try {
  await client.get('/resource')
} catch (error) {
  if (error instanceof HttpError) {
    console.log(error.status, error.isNetworkError, error.timeout)
  }
}
```

*Made with ❤️ by Quarnel*
