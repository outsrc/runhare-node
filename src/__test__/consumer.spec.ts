import { ConsumerResponse, createConsumer, signPayload } from '..'
import nock from 'nock'

interface TestEvents {
  dothis: { what: string; when: string }
  'webhook-appx': any
}

describe('RunHare Consumer', () => {
  const mockSendKey = 'secret-key'

  const createMockHandler = (options?: {
    rejectUnregisteredMessages?: boolean
    throwException?: boolean
    withWebhook?: boolean
  }) => {
    const consumer = createConsumer<TestEvents>(mockSendKey, {
      rejectUnregisteredMessages: options?.rejectUnregisteredMessages
    })

    return consumer.createHandler(
      options?.withWebhook ? ['webhook-appx', 'dothis'] : ['dothis'],
      async (
        _event,
        _payload: { what: string; when: string },
        _headers: any
      ): Promise<ConsumerResponse> => {
        if (options?.throwException) {
          throw new Error('exception')
        }

        return { result: 'sucess' }
      }
    )
  }

  afterAll(() => {
    nock.cleanAll()
  })

  it('consumer success', async () => {
    const handler = createMockHandler()
    const payload = { when: 'now', what: 'scratch' }
    const signature = signPayload(payload, mockSendKey)

    const response = await handler(payload, {
      ...signature.headers,
      'x-runhare-event': 'dothis'
    })
    expect(response).toEqual({ result: 'sucess' })
  })

  it('consumer success, unregistered event', async () => {
    const handler = createMockHandler({ rejectUnregisteredMessages: false })
    const payload = { when: 'now', what: 'scratch' }
    const signature = signPayload(payload, mockSendKey)

    const response = await handler(payload, {
      ...signature.headers,
      'x-runhare-event': 'something-else'
    })
    expect(response).toEqual({ result: 'sucess' })
  })

  it('consumer success, webhook', async () => {
    const handler = createMockHandler({
      rejectUnregisteredMessages: true,
      withWebhook: true
    })
    const payload = { when: 'now', what: 'scratch' }

    const response = await handler(payload, {
      'x-runhare-event': 'webhook-appx'
    })
    expect(response).toEqual({ result: 'sucess' })
  })

  it('consumer fails, unregistered event', async () => {
    const handler = createMockHandler({ rejectUnregisteredMessages: true })
    const payload = { when: 'now', what: 'scratch' }
    const signature = signPayload(payload, mockSendKey)

    const response = await handler(payload, {
      ...signature.headers,
      'x-runhare-event': 'something-else'
    })
    expect(response).toEqual({ result: 'fail', error: 'event-not-registered' })
  })

  it('consumer fails, bad signature', async () => {
    const handler = createMockHandler({ rejectUnregisteredMessages: true })
    const payload = { when: 'now', what: 'scratch' }
    const signature = signPayload(payload, 'wrong-key')

    const response = await handler(payload, {
      ...signature.headers,
      'x-runhare-event': 'dothis'
    })
    expect(response).toEqual({ result: 'fail', error: 'bad-signature' })
  })

  it('consumer fails, not signature', async () => {
    const handler = createMockHandler({ rejectUnregisteredMessages: true })
    const payload = { when: 'now', what: 'scratch' }

    const response = await handler(payload, {
      'x-runhare-event': 'dothis'
    })
    expect(response).toEqual({ result: 'fail', error: 'missing-signature' })
  })

  it('consumer fails, signature bad expiry', async () => {
    const handler = createMockHandler({ rejectUnregisteredMessages: true })
    const payload = { when: 'now', what: 'scratch' }

    const response = await handler(payload, {
      'x-runhare-auth': 'some-value',
      'x-runhare-auth-expiry': 'not-a-number',
      'x-runhare-event': 'dothis'
    })
    expect(response).toEqual({ result: 'fail', error: 'missing-signature' })
  })

  it('consumer fails, by exception', async () => {
    const handler = createMockHandler({
      rejectUnregisteredMessages: true,
      throwException: true
    })
    const payload = { when: 'now', what: 'scratch' }
    const signature = signPayload(payload, mockSendKey)

    const response = await handler(payload, {
      ...signature.headers,
      'x-runhare-event': 'dothis'
    })
    expect(response).toEqual({ result: 'fail', error: 'exception' })
  })

  it('consumer fails, expired auth', async () => {
    const handler = createMockHandler()
    const payload = { when: 'now', what: 'scratch' }
    const signature = signPayload(payload, mockSendKey, -1000)

    const response = await handler(payload, {
      ...signature.headers,
      'x-runhare-event': 'dothis'
    })
    expect(response).toEqual({ result: 'fail', error: 'expired-signature' })
  })
})
