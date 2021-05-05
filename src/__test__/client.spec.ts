import { createClient, RunHareResponse } from '..'
import nock from 'nock'

interface TestEvents {
  dothis: { what: string; when: string }
}

describe('RunHare Client', () => {
  const mockNamespace = 'here'
  const mockSendKey = 'secret-key'

  afterAll(() => {
    nock.cleanAll()
  })

  it('creates client', () => {
    const client = createClient(mockNamespace, mockSendKey)

    expect(client).toHaveProperty('sendEvent')
  })

  it('sends event', async () => {
    const scope = nock('https://harex.in')
      .post(`/${mockNamespace}`, {
        type: 'dothis',
        data: { what: 'Run it', when: 'Now' },
        priority: 'normal'
      })
      .reply(200, {
        status: 'queued',
        message: 'dothis',
        priority: 'normal'
      } as RunHareResponse<TestEvents>)

    const client = createClient<TestEvents>(mockNamespace, mockSendKey)
    const response = await client.sendEvent('dothis', {
      what: 'Run it',
      when: 'Now'
    })

    expect(response).toEqual({
      status: 'queued',
      message: 'dothis',
      priority: 'normal'
    })
    scope.done()
  })

  it('sends event, with origin', async () => {
    const scope = nock('https://harex.in')
      .post(`/${mockNamespace}`, {
        type: 'dothis',
        data: { what: 'Run it', when: 'Now' },
        priority: 'normal',
        origin: 'test-suite'
      })
      .reply(200, {
        status: 'queued',
        message: 'dothis',
        priority: 'normal'
      } as RunHareResponse<TestEvents>)

    const client = createClient<TestEvents>(
      mockNamespace,
      mockSendKey,
      'test-suite'
    )
    const response = await client.sendEvent('dothis', {
      what: 'Run it',
      when: 'Now'
    })

    expect(response).toEqual({
      status: 'queued',
      message: 'dothis',
      priority: 'normal'
    })
    scope.done()
  })

  it('sends event, high priority', async () => {
    const scope = nock('https://harex.in')
      .post(`/${mockNamespace}`, {
        type: 'dothis',
        data: { what: 'Run it', when: 'Now' },
        priority: 'high',
        origin: 'test-suite'
      })
      .reply(200, {
        status: 'queued',
        message: 'dothis',
        priority: 'normal'
      } as RunHareResponse<TestEvents>)

    const client = createClient<TestEvents>(
      mockNamespace,
      mockSendKey,
      'test-suite'
    )
    const response = await client.sendEvent(
      'dothis',
      {
        what: 'Run it',
        when: 'Now'
      },
      'high'
    )

    expect(response).toEqual({
      status: 'queued',
      message: 'dothis',
      priority: 'normal'
    })
    scope.done()
  })

  it('sends event, no sendkey', async () => {
    const scope = nock('https://harex.in')
      .post(`/${mockNamespace}`, {
        type: 'dothis',
        data: { what: 'Run it', when: 'Now' },
        priority: 'normal'
      })
      .reply(200, {
        status: 'queued',
        message: 'dothis',
        priority: 'normal'
      } as RunHareResponse<TestEvents>)

    const client = createClient<TestEvents>(mockNamespace)
    const response = await client.sendEvent('dothis', {
      what: 'Run it',
      when: 'Now'
    })

    expect(response).toEqual({
      status: 'queued',
      message: 'dothis',
      priority: 'normal'
    })
    scope.done()
  })

  it('sends event, failure', async () => {
    const scope = nock('https://harex.in')
      .post(`/${mockNamespace}`, {
        type: 'dothis',
        data: { what: 'Run it', when: 'Now' },
        priority: 'normal'
      })
      .replyWithError('failed')

    const client = createClient<TestEvents>(mockNamespace)
    await client
      .sendEvent('dothis', {
        what: 'Run it',
        when: 'Now'
      })
      .catch(error => {
        expect(error).toBeTruthy()
        expect(error.message).toBe('message-failed:failed')
      })
    scope.done()
  })
})
