# HttpClient (@quarnel/httpclient)

[Читать на английском](README.md) | Русский

Изоморфный HTTP-клиент на нативном `fetch`. Без зависимостей, без полифилов.

## Возможности

- **Изоморфность:** работает в Node.js и браузере на нативных `fetch`/`Headers`/`AbortController`.
- **Без зависимостей:** никаких обёрток, никаких полифилов.
- **Умная обработка тела запроса:** JSON по умолчанию, raw-передача для `FormData`, `Blob`, `URLSearchParams`, `ArrayBuffer`, `ArrayBufferView`, `ReadableStream` и `string`.
- **Retry:** настраиваемое число попыток, задержка и условие ретрая.
- **Timeout:** на запрос или глобальный, комбинируется с собственным `AbortSignal`.
- **HttpError:** единый класс ошибки с `status`, `url`, `cause`, `isNetworkError` и `timeout`.

## Установка

```bash
npm i @quarnel/httpclient
```

## Быстрый старт

```ts
import { HttpClient } from '@quarnel/httpclient'

const client = new HttpClient({ baseURL: 'https://api.example.com' })

const user = await client.get('/users/1')
await client.post('/users', { name: 'John' })
```

## API

### new HttpClient(options?)

| Опция     | Тип            | Описание                                         |
| --------- | -------------- | ------------------------------------------------ |
| `baseURL` | `string`       | Базовый URL, добавляемый к относительным путям   |
| `headers` | `HttpHeaders`  | Заголовки по умолчанию, мёржатся в каждый запрос |
| `retry`   | `RetryOptions` | Поведение ретраев по умолчанию                   |
| `timeout` | `number`       | Таймаут по умолчанию, мс                         |

### Методы

```ts
client.get(url, options?)
client.post(url, body?, options?)
client.put(url, body?, options?)
client.patch(url, body?, options?)
client.delete(url, body?, options?)
```

`options` расширяет нативный `RequestInit` (без `body`/`method`/`headers`) плюс `headers`, `retry` и `timeout`.

## Retry

```ts
client.get('/resource', {
  retry: { attempts: 3, delay: 300 },
})
```

| Поле       | Тип                                              | Описание                                                     |
| ---------- | ------------------------------------------------ | ------------------------------------------------------------ |
| `attempts` | `number`                                         | Общее число попыток, включая первую                          |
| `delay`    | `number`                                         | Фиксированная задержка между попытками, мс                   |
| `retryOn`  | `(error: HttpError, attempt: number) => boolean` | Своё условие ретрая (по умолчанию: сетевые ошибки, 429, 5xx) |

`retry` в опциях метода полностью заменяет `retry` из конструктора (без глубокого мёржа). `retry: false` отключает ретраи для конкретного вызова.

## Timeout

```ts
client.get('/resource', { timeout: 5000 })
```

При превышении бросается `HttpError` с `timeout: true`. Комбинируется с переданным `signal` через `AbortSignal.any` — отмена любого из них отменяет запрос.

## Обработка ошибок

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

_Сделано с ❤️ от Quarnel_
