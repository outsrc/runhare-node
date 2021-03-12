# @runhare/node

Node helper functions for RunHare platform.

To use RunHare SDK you will need two elements:

- Namespace
- Send Keys: Are used to secure sending and receiving events from RunHare's platform.

## Sending Events

To send a Background Task Event you will create a Client and use it to fire the event with the associated payload.

```typescript
import { createClient } from '@runhare/node'

interface SendEmail {
  to: string
  subject: string
  content: string
}

interface DemoEvents {
  'send-email': SendEmail
}

const client = createClient<DemoEvents>('la329bg', process.env.SENDKEY, 'demo')

client
  .sendEvent('send-email', {
    to: 'ernesto@codexsw.com',
    subject: 'Hello from SDK',
    content: 'Yes, this works'
  })
  .then(response => {
    console.log(response)
  })
```

### TypeScript support

Event types in RunHare are checked against a registered schema. On the RunHare Console you can export TypeScript type definitions for all Event types your Namespace uses.

Using this type definitions you can have autocomplete hints of the properties different payloads requires.

### API Reference

Exported types

```typescript
export declare type RunHareEventPriority = 'normal' | 'high'

export declare type RunHareEventStatus = 'queued' | 'prequed'

export interface RunHareResponse<EventTypes> {
  status: RunHareEventStatus
  message: keyof EventTypes
  priority: RunHareEventPriority
}
```

RunHare Client.

```typescript
export declare const createClient: <EventTypes>(
  namespace: string,
  sendKey?: string | undefined,
  origin?: string | undefined
) => {
  sendEvent: <K extends keyof EventTypes>(
    event: K,
    message: EventTypes[K],
    priority?: RunHareEventPriority,
    signal?: boolean | undefined
  ) => Promise<RunHareResponse<EventTypes>>
}
```

`createClient<T>(namespace, sendKey?, origin?)`

- **namespace** : Unique Namespace name
- **sendKey** : Send secret used to sign requests
- **origin** : Helps identify which process sent the request. Will be received as a `X-RunHare-Origin` header on the consumer

`client.sendEvent(event, message, priority?, signal?) -> Response`

- **event** : Event identifier as defined on RunHare's console.
- **message** : Event Payload, must pass Event schema
- **priority** : `"normal"` | `"high"` (default `"normal"`)
- **signal** : `true` | `false` (default `false`) Signal events return a `pre-queued` state meaning they are faster to respond but no direct garantee of being queued.

`Response`

- **status** : `"queued"` | `"pre-queued"`
- **event** : Event identifier as defined on RunHare's console.
- **priority** : `"normal"` | `"high"`

## Consuming Events

RunHare sends events to registered HTTP endpoints where your consumer functions receive the payloads according to the event types they are registered. As such, consumers live inside a HTTP server handler, preferably using a framework.

```typescript
interface SendEmail {
  to: string
  subject: string
  content: string
}

interface DemoEvents {
  'send-email': SendEmail
}

const consumer = createConsumer<DemoEvents>(process.env.SENDKEY)

const sendEmailHandler = consumer.createHandler(
  ['send-email'],
  async (
    event,
    payload: SendEmail,
    headers: any
  ): Promise<ConsumerResponse> => {
    await EmailClient.sendEmail(payload)
    return { result: 'sucess' }
  }
)

const payload = {
  to: 'john@gmail.com',
  subject: 'Hello',
  world: 'World'
}

const signature = signPayload(payload, process.env.SENDKEY)

const response = await handler(payload, {
  ...signature.headers,
  'x-runhare-event': 'dothis'
})
```

We provide wrappers for ExpressJS and NextJS.

### ExpressJS

```javascript
const express = require('express')
const consumer = require('@runhare/express')

const sendEmailHandler = async (event, payload, headers) => {
  await EmailClient.sendEmail(payload)
  return { result: 'sucess' }
}

app.post(
  '/send-email',
  consumer(['send-email'], process.env.SENDKEY, sendEmailHandler)
)

app.listen(3000, () => {
  console.log(`Email consumer listening at http://localhost:${port}`)
})
```

### NextJs

```typescript
// 'src/pages/api/send-email.ts'
import consumer from '@runhare/next'

interface SendEmail {
  to: string
  subject: string
  content: string
}

interface DemoEvents {
  'send-email': SendEmail
}

export default consumer([
  'send-email',
  process.env.SENDKEY,
  async (
    event,
    payload: SendEmail,
    headers: any
  ): Promise<ConsumerResponse> => {
    await EmailClient.sendEmail(payload)
    return { result: 'sucess' }
  }
])
```

### API Reference

Exported types

```typescript
export interface ConsumerOptions {
  rejectUnregisteredMessages?: boolean
}
export interface EventSuccess {
  result: 'sucess'
}
export interface EventFailed {
  result: 'fail'
  error: string
}
export declare type ConsumerResponse = EventSuccess | EventFailed
export declare const createConsumer: <EventTypes>(
  sendKey?: string | undefined,
  options?: ConsumerOptions | undefined
) => {
  createHandler: <K extends keyof EventTypes>(
    events: K[],
    consumer: (
      event: K,
      payload: EventTypes[K],
      headers?: PayloadHeaders | undefined
    ) => Promise<ConsumerResponse>
  ) => (
    payload: EventTypes[K],
    headers?: PayloadHeaders | undefined
  ) => Promise<ConsumerResponse>
}
```

`createConsumer<T>(sendKey?, options?)`

- **sendKey** : Shared secret used to verify messages signatures.
- **options.rejectUnregisteredMessages** : If set, messages received not in the subscription list will be marked as failed (potentially retrying them)

`createHandler(events, consumer) -> handler(event, payload, headers)`

- **events** : Array of subscribed event types
- **consumer** : Asynchronous Consumer function

Returns Handler function

- **event** : Received event
- **payload** : Clean payload
- **headers** : Request headers
