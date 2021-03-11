import hmacSHA256 from 'crypto-js/hmac-sha256'
import Base64 from 'crypto-js/enc-base64'
import axios from 'axios'

interface RunHarePayloadSignature {
  headers: {
    'x-runhare-auth': string
    'x-runhare-auth-expiry': number
    'content-type': 'application/json'
  }
  payload: string
}

const TTL = 2000

const signPayload = <T>(
  payload: T,
  secret: string
): RunHarePayloadSignature => {
  const message = JSON.stringify(payload)

  const privateKey = secret
  const now = Date.now()
  const expiry = now + TTL

  const hmacDigest = Base64.stringify(hmacSHA256(expiry + message, privateKey))

  return {
    headers: {
      'x-runhare-auth': hmacDigest,
      'x-runhare-auth-expiry': expiry,
      'content-type': 'application/json'
    },
    payload: message
  }
}

export type RunHareEventPriority = 'normal' | 'high'
export type RunHareEventStatus = 'queued' | 'prequed'
export interface RunHareResponse<EventTypes> {
  status: RunHareEventStatus
  message: keyof EventTypes
  priority: RunHareEventPriority
}

export const createClient = <EventTypes>(
  namespace: string,
  sendKey?: string,
  origin?: string
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
        sendKey || ''
      )
      const response = await axios.post<RunHareResponse<EventTypes>>(
        `https://harex.in/${namespace}`,
        signature.payload,
        {
          headers: signature.headers
        }
      )

      return response.data
    } catch (ex) {
      throw new Error('message-failed')
    }
  }

  return {
    sendEvent
  }
}
