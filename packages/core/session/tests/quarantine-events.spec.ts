import { describe, expect, expectTypeOf, it } from 'vitest'
import { Session, SessionId, SessionSeq } from '@deepseek-ai/dsh-session'
import type { SessionEvent, SurfaceEventType } from '@deepseek-ai/dsh-session'

describe('attachment quarantine/recovery events', () => {
  it('appends and reads back an attachment/quarantine event verbatim', () => {
    const session = Session.create(SessionId('quarantine'))
    const event = session.append('attachment/quarantine', {
      attachmentId: 'sha256:deadbeef',
      category: 'NOT_FOUND',
      retryable: false,
    })

    expect(event.type).toBe('attachment/quarantine')
    expect(event.data).toEqual({
      attachmentId: 'sha256:deadbeef',
      category: 'NOT_FOUND',
      retryable: false,
    })
    expect(event.seq).toBe(SessionSeq(0))
    expect(Number.isSafeInteger(event.time)).toBe(true)

    expect(session.snapshotEvents()).toEqual([event])
    expect(session.eventAt(SessionSeq(0))).toBe(event)
  })

  it('appends and reads back an attachment/recovered event', () => {
    const session = Session.create(SessionId('recovered'))
    session.append('attachment/quarantine', {
      attachmentId: 'sha256:deadbeef',
      category: 'NOT_FOUND',
      retryable: false,
    })
    const recovered = session.append('attachment/recovered', { attachmentId: 'sha256:deadbeef' })

    expect(recovered.type).toBe('attachment/recovered')
    expect(recovered.data).toEqual({ attachmentId: 'sha256:deadbeef' })
    expect(recovered.seq).toBe(SessionSeq(1))
    expect(session.snapshotEvents()).toHaveLength(2)
  })

  it('accepts every category and the retryable flag for READ_FAILED', () => {
    const session = Session.create(SessionId('categories'))
    for (const category of ['NOT_FOUND', 'CORRUPT', 'READ_FAILED'] as const) {
      session.append('attachment/quarantine', {
        attachmentId: 'sha256:cafe',
        category,
        retryable: category === 'READ_FAILED',
      })
    }
    const events = session.snapshotEvents()
    expect(events.map(event => event.type)).toEqual([
      'attachment/quarantine',
      'attachment/quarantine',
      'attachment/quarantine',
    ])
    expect(events[0]?.data).toMatchObject({ category: 'NOT_FOUND', retryable: false })
    expect(events[1]?.data).toMatchObject({ category: 'CORRUPT', retryable: false })
    expect(events[2]?.data).toMatchObject({ category: 'READ_FAILED', retryable: true })
  })

  it('does not contribute to derived message history', () => {
    const session = Session.create(SessionId('derive'))
    expect(session.deriveMessages()).toEqual([])
    session.append('attachment/quarantine', {
      attachmentId: 'sha256:deadbeef',
      category: 'NOT_FOUND',
      retryable: false,
    })
    session.append('attachment/recovered', { attachmentId: 'sha256:deadbeef' })
    expect(session.deriveMessages()).toEqual([])
  })

  it('rejects a non-JSON payload without changing the log', () => {
    const session = Session.create(SessionId('reject'))
    expect(() => session.append('attachment/quarantine', {
      attachmentId: 'sha256:deadbeef',
      category: undefined as never,
      retryable: false,
    })).toThrow(/non-JSON-serializable/)
    expect(session.snapshotEvents()).toEqual([])
  })

  it('detaches and freezes appended data from the caller input', () => {
    const session = Session.create(SessionId('detach'))
    const input = { attachmentId: 'sha256:deadbeef', category: 'NOT_FOUND' as const, retryable: false }
    const event = session.append('attachment/quarantine', input)
    input.attachmentId = 'sha256:mutated'
    expect(event.data.attachmentId).toBe('sha256:deadbeef')
    expect(Object.isFrozen(event.data)).toBe(true)
  })

  it('excludes the new types from SurfaceEventType at the type level', () => {
    expectTypeOf<Extract<SurfaceEventType, 'attachment/quarantine'>>().toEqualTypeOf<never>()
    expectTypeOf<Extract<SurfaceEventType, 'attachment/recovered'>>().toEqualTypeOf<never>()
  })

  it('replays a seeded quarantine/recovered log unchanged', () => {
    const original = Session.create(SessionId('seed-source'))
    original.append('attachment/quarantine', {
      attachmentId: 'sha256:deadbeef',
      category: 'CORRUPT',
      retryable: false,
    })
    original.append('attachment/recovered', { attachmentId: 'sha256:deadbeef' })

    const replayed = Session.create(SessionId('seed-replay'), original.snapshotEvents())
    expect(replayed.snapshotEvents().slice(0, 2)).toEqual(original.snapshotEvents())
  })

  it('switch on the event type narrows data without a cast', () => {
    const event = {
      type: 'attachment/quarantine',
      seq: SessionSeq(0),
      time: 1,
      data: { attachmentId: 'sha256:deadbeef', category: 'NOT_FOUND', retryable: false },
    } as const satisfies SessionEvent
    switch (event.type) {
      case 'attachment/quarantine':
        expect(event.data.category).toBe('NOT_FOUND')
        break
      default:
        throw new Error('unexpected event type')
    }
  })
})
