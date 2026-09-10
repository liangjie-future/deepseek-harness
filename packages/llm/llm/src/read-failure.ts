/**
 * Classification of unreadable historical attachment references.
 *
 * Turns the error `AttachmentStore.readImage()` throws, paired with the
 * reference that triggered the read, into the durable
 * `{ attachmentId, category }` identity used by quarantine and retry.
 *
 * @module @deepseek-ai/dsh-llm/read-failure
 */

import { isAttachmentError } from '@deepseek-ai/dsh-attachment'
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment'

/** Failure classes that enter the quarantine path. */
export type QuarantineFailureCategory = 'NOT_FOUND' | 'CORRUPT' | 'READ_FAILED'

/** Exact identity and class of one unreadable historical image reference. */
export interface ClassifiedReadFailure {
  /** The reference whose read failed, taken from the caller-supplied reference. */
  attachmentId: string
  /** Stable failure class derived from the attachment error code. */
  category: QuarantineFailureCategory
}

/**
 * Classify one `readImage()` failure into its attachment identity and class.
 *
 * Reads the stable machine code on an attachment error without depending on
 * prototype identity, so errors from a duplicate package installation classify
 * the same way. Only the three read-failure codes map to a category; admission
 * errors, invalid-reference errors, unknown codes, and non-attachment errors
 * return `undefined` and stay outside the quarantine path.
 * @param ref - the reference whose read raised `error`; its id is the source of the returned identity.
 * @param error - the value thrown by the failed read.
 * @returns the classified failure, or `undefined` when the error is not a classified read failure.
 */
export function classifyReadFailure(ref: ImageAttachmentRef, error: unknown): ClassifiedReadFailure | undefined {
  if (!isAttachmentError(error)) return undefined
  switch (error.code) {
    case 'ATTACHMENT_NOT_FOUND':
      return { attachmentId: ref.attachmentId, category: 'NOT_FOUND' }
    case 'ATTACHMENT_CORRUPT':
      return { attachmentId: ref.attachmentId, category: 'CORRUPT' }
    case 'ATTACHMENT_READ_FAILED':
      return { attachmentId: ref.attachmentId, category: 'READ_FAILED' }
    default:
      return undefined
  }
}
