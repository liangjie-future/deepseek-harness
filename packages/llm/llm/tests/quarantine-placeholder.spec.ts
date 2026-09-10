import { describe, expect, it } from 'vitest'
import { AttachmentId } from '@deepseek-ai/dsh-attachment'
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment'
import { quarantinePlaceholder } from '../src/index.ts'

function ref(name?: string): ImageAttachmentRef {
  return {
    attachmentId: AttachmentId('sha256:abcdef1234567890'),
    mediaType: 'image/png',
    bytes: 10,
    width: 1,
    height: 1,
    ...name === undefined ? {} : { name },
  }
}

describe('quarantinePlaceholder', () => {
  it('returns the same text for the same reference and category on every call', () => {
    const attachment = ref('photo.png')
    const first = quarantinePlaceholder(attachment, 'NOT_FOUND')
    expect(quarantinePlaceholder(attachment, 'NOT_FOUND')).toBe(first)
    expect(quarantinePlaceholder(ref('photo.png'), 'NOT_FOUND')).toBe(first)
  })

  it('composes display name, id prefix, and failure category in a fixed order', () => {
    expect(quarantinePlaceholder(ref('photo.png'), 'NOT_FOUND')).toBe(
      '[image unavailable: "photo.png" sha256:abcdef12 (NOT_FOUND)]',
    )
  })

  it('omits the name segment when the reference has no display name', () => {
    const placeholder = quarantinePlaceholder(ref(), 'CORRUPT')
    expect(placeholder).toBe('[image unavailable: sha256:abcdef12 (CORRUPT)]')
    expect(placeholder).not.toContain('undefined')
  })

  it('keeps the same id prefix across categories while differing by category', () => {
    const notFound = quarantinePlaceholder(ref('photo.png'), 'NOT_FOUND')
    const readFailed = quarantinePlaceholder(ref('photo.png'), 'READ_FAILED')
    expect(notFound).not.toBe(readFailed)
    expect(readFailed).toBe('[image unavailable: "photo.png" sha256:abcdef12 (READ_FAILED)]')
  })

  it.each([
    ['NOT_FOUND', '[image unavailable: sha256:abcdef12 (NOT_FOUND)]'],
    ['CORRUPT', '[image unavailable: sha256:abcdef12 (CORRUPT)]'],
    ['READ_FAILED', '[image unavailable: sha256:abcdef12 (READ_FAILED)]'],
  ] as const)('renders %s from the id prefix and category alone', (category, expected) => {
    expect(quarantinePlaceholder(ref(), category)).toBe(expected)
  })
})
