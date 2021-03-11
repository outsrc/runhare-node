# @runhare/node

Node helper functions for RunHare platform.

To use RunHare SDK you will need two elements:

- Namespace
- Send Keys: Are used to secure sending and receiving events from RunHare's platform.

## Sending Events

To send a Background Task Event you will create a Client and use it to fire the event with the associated payload.

```typescript
import { createClient } from '@runhare/node'

const SENDKEY = process.env.SENDKEY

interface SendEmail {
  to: string
  subject: string
  content: string
}

interface DemoEvents {
  'send-email': SendEmail
}

const client = createClient<DemoEvents>('la329bg', SENDKEY, 'demo')

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
