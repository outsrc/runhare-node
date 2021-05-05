import hmacSHA256 from 'crypto-js/hmac-sha256'
import Base64 from 'crypto-js/enc-base64'
import axios from 'axios'
interface RunHarePayloadSignature {
  headers: {
    'x-runhare-auth': string
    'x-runhare-auth-expiry': string
    'content-type': 'application/json'
  }
  payload: string
}

const TTL = 2000

export const signPayload = <T>(
  payload: T,
  secret: string,
  ttl: number = TTL
): RunHarePayloadSignature => {
  const message = JSON.stringify(payload)

  const privateKey = secret
  const now = Date.now()
  const expiry = now + ttl

  const hmacDigest = Base64.stringify(hmacSHA256(expiry + message, privateKey))

  return {
    headers: {
      'x-runhare-auth': hmacDigest,
      'x-runhare-auth-expiry': expiry.toString(10),
      'content-type': 'application/json'
    },
    payload: message
  }
}

const secureParseInt = (value: string): number | null => {
  if (!value) {
    return null
  }

  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) {
    return null
  }

  return parsed
}

export const verifyRequest = (
  sendKey: string,
  payload: any,
  headers: any
): { verified: true } | { verified: false; error: string } => {
  const authorization = headers['x-runhare-auth']
  const expiry = secureParseInt(
    (headers['x-runhare-auth-expiry'] || '').toString()
  )

  if (!authorization || !expiry) {
    return { verified: false, error: 'missing-signature' }
  }

  const hmacDigest = Base64.stringify(
    hmacSHA256(expiry + JSON.stringify(payload), sendKey)
  )
  if (hmacDigest !== authorization) {
    return { verified: false, error: 'bad-signature' }
  }

  if (expiry < Date.now()) {
    return { verified: false, error: 'expired-signature' }
  }

  return { verified: true }
}

export type RunHareEventPriority = 'normal' | 'high'
export type RunHareEventStatus = 'queued' | 'prequed'
export interface RunHareResponse<EventTypes> {
  status: RunHareEventStatus
  message: keyof EventTypes
  priority: RunHareEventPriority
}

export interface PayloadHeaders {
  'x-runhare-auth'?: string
  'x-runhare-auth-expiry'?: string
  'x-runhare-event'?: string
  [key: string]: string | undefined
}

export const createClient = <EventTypes>(
  namespace: string,
  sendKey?: string,
  origin?: string,
  ttl?: number,
  tracer?: (payload: any, headers: any) => void
) => {
  const sendEvent = async <K extends keyof EventTypes>(
    event: K,
    message: EventTypes[K],
    priority: RunHareEventPriority = 'normal',
    signal?: boolean
  ): Promise<RunHareResponse<EventTypes>> => {
    try {
      const payload = {
        type: event,
        data: message,
        priority,
        signal,
        ...(origin ? { origin } : {})
      }

      const signature: RunHarePayloadSignature = signPayload(
        payload,
        sendKey || '',
        ttl
      )

      if (tracer) {
        tracer(payload, signature.headers)
      }

      const response = await axios.post<RunHareResponse<EventTypes>>(
        `https://harex.in/${namespace}`,
        signature.payload,
        {
          headers: signature.headers
        }
      )

      return response.data
    } catch (ex) {
      throw new Error(`message-failed:${ex.message}`)
    }
  }

  return {
    sendEvent
  }
}

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

export type ConsumerResponse = EventSuccess | EventFailed

export const createConsumer = <EventTypes>(
  sendKey?: string,
  options?: ConsumerOptions
) => {
  const createHandler = <K extends keyof EventTypes>(
    events: K[],
    consumer: (
      event: K,
      payload: EventTypes[K],
      headers?: PayloadHeaders
    ) => Promise<ConsumerResponse>
  ) => {
    const handler = async (
      payload: EventTypes[K],
      headers?: PayloadHeaders
    ): Promise<ConsumerResponse> => {
      const event = (headers || {})['x-runhare-event']

      const isRegisteredEvent = events.some(e => e === event)
      if (!isRegisteredEvent || !event) {
        return !options?.rejectUnregisteredMessages
          ? { result: 'sucess' }
          : { result: 'fail', error: 'event-not-registered' }
      }

      // Check payload signature
      if (!event.startsWith('webhook-')) {
        const verification = verifyRequest(sendKey || '', payload, headers)
        if (!verification.verified) {
          return { result: 'fail', error: verification.error }
        }
      }

      // Pass down to actual consumer
      try {
        const response = await consumer(event as K, payload, headers)
        return response
      } catch (ex) {
        return { result: 'fail', error: ex.message }
      }
    }

    return handler
  }

  return { createHandler }
}
