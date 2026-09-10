# Design note: read-failure classification

English | [中文](read-failure-classification.zh.md)

## Goal

Before the request-projection consumer dispatches to a provider, it must know the exact identity (attachment id) and failure class of every unreadable historical image reference. `AttachmentStore.readImage()` throws an `AttachmentError` carrying a stable machine `code`; this task turns that thrown error, paired with the reference that triggered the read, into a durable `ClassifiedReadFailure`. The result feeds quarantine (FP-005), retry (FP-007), and the no-active-session failure policy (FP-011).

## Output contract

```ts
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment'

type QuarantineFailureCategory = 'NOT_FOUND' | 'CORRUPT' | 'READ_FAILED'

interface ClassifiedReadFailure {
  attachmentId: string
  category: QuarantineFailureCategory
}

declare function classifyReadFailure(
  ref: ImageAttachmentRef,
  error: unknown,
): ClassifiedReadFailure | undefined
```

## Decisions

- **Pure function, no service.** Classification is a data mapping; it takes no Cordis context and performs no I/O, so it lives as an exported pure function in `packages/llm/llm/src/read-failure.ts` beside the existing projection helpers. It is a provider (called by later tasks), not a consumer.
- **Route on `AttachmentError.code`, never on message text or the prototype chain.** `isAttachmentError` (already exported by `@deepseek-ai/dsh-attachment`) recognizes structurally compatible errors from duplicate package installations. The three read codes map to categories: `ATTACHMENT_NOT_FOUND` → `NOT_FOUND`, `ATTACHMENT_CORRUPT` → `CORRUPT`, `ATTACHMENT_READ_FAILED` → `READ_FAILED`.
- **Unclassified returns `undefined`.** Admission codes, `INVALID_ATTACHMENT_REF`, unknown codes, and non-`AttachmentError` values do not enter the quarantine path. A switch over the three read codes falls through to `undefined` rather than an `assertNever`, because `AttachmentErrorCode` is a closed-but-wide union shared with other callers.
- **Identity comes from the reference, not the error.** `attachmentId` is read from `ref.attachmentId` (the branded `AttachmentId`), guaranteeing the caller records the exact reference it attempted to read even if the error message echoed a different or truncated id.
- **Placement in `dsh-llm`.** The consumers are request projection and quarantine state, which belong to the LLM/attachment request pipeline. `dsh-llm` currently declares `@deepseek-ai/dsh-attachment` as a dev dependency (types-only use in `types.ts`, `content.ts`, `index.ts`). Adding the runtime `isAttachmentError` import promotes that relationship to a runtime `dependencies` entry.

## Not in scope

Quarantine transition and placeholder projection (FP-005), retry (FP-007), recovery verification (FP-010), and auxiliary no-active-session error mapping (FP-011) reuse this classification but are implemented by their own tasks.
