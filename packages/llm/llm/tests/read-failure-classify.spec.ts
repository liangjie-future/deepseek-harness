import { describe, expect, it } from 'vitest'
import { AttachmentError, AttachmentId } from '@deepseek-ai/dsh-attachment'
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment'
import { classifyReadFailure } from '../src/index.ts'

function ref(id: string): ImageAttachmentRef {
  return {
    attachmentId: AttachmentId(id),
    mediaType: 'image/png',
    bytes: 3,
    width: 1,
    height: 1,
  }
}

describe('classifyReadFailure', () => {
  it('maps ATTACHMENT_NOT_FOUND to NOT_FOUND', () => {
    expect(classifyReadFailure(ref('sha256:gone'), new AttachmentError('missing', 'ATTACHMENT_NOT_FOUND')))
      .toEqual({ attachmentId: 'sha256:gone', category: 'NOT_FOUND' })
  })

  it('maps ATTACHMENT_CORRUPT to CORRUPT', () => {
    expect(classifyReadFailure(ref('sha256:corrupt'), new AttachmentError('bad bytes', 'ATTACHMENT_CORRUPT')))
      .toEqual({ attachmentId: 'sha256:corrupt', category: 'CORRUPT' })
  })

  it('maps ATTACHMENT_READ_FAILED to READ_FAILED', () => {
    expect(classifyReadFailure(ref('sha256:io'), new AttachmentError('unreadable', 'ATTACHMENT_READ_FAILED')))
      .toEqual({ attachmentId: 'sha256:io', category: 'READ_FAILED' })
  })

  it('takes the attachment id from the reference, not the error message', () => {
    const target = ref('sha256:actual')
    expect(classifyReadFailure(target, new AttachmentError('missing sha256:decoy', 'ATTACHMENT_NOT_FOUND')))
      .toEqual({ attachmentId: 'sha256:actual', category: 'NOT_FOUND' })
  })

  it('returns undefined for a plain error', () => {
    expect(classifyReadFailure(ref('sha256:x'), new Error('boom'))).toBeUndefined()
  })

  it('returns undefined for an admission-code attachment error', () => {
    expect(classifyReadFailure(ref('sha256:x'), new AttachmentError('bad image', 'INVALID_IMAGE'))).toBeUndefined()
  })

  it('returns undefined for INVALID_ATTACHMENT_REF', () => {
    expect(classifyReadFailure(ref('sha256:x'), new AttachmentError('bad ref', 'INVALID_ATTACHMENT_REF'))).toBeUndefined()
  })

  it('returns undefined for a non-read attachment code', () => {
    expect(classifyReadFailure(ref('sha256:x'), new AttachmentError('disk full', 'ATTACHMENT_WRITE_FAILED'))).toBeUndefined()
  })

  it('returns undefined for a foreign error carrying an unknown code', () => {
    expect(classifyReadFailure(ref('sha256:x'), Object.assign(new Error('foreign'), { code: 'OTHER' }))).toBeUndefined()
  })

  it('classifies a structurally compatible foreign error by code', () => {
    const error = Object.assign(new Error('missing from another install'), { code: 'ATTACHMENT_NOT_FOUND' })
    expect(classifyReadFailure(ref('sha256:foreign'), error))
      .toEqual({ attachmentId: 'sha256:foreign', category: 'NOT_FOUND' })
  })
})
