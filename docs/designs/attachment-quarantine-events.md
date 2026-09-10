# Design: Attachment quarantine/recovery session events (FP-001)

English | [中文](attachment-quarantine-events.zh.md)

## Goal

Add two log-only event types to the merge-extensible `SessionEventMap` so a quarantined image attachment is durable and reconstructable from the session log. This is the persistence substrate only: it records which attachment is unreadable and whether it was later recovered. It does not decide when to quarantine, retry, or restore.

## Decisions

1. Two event keys via declaration merging into `@deepseek-ai/dsh-session/types`:

   - `attachment/quarantine { attachmentId, category, retryable }` — a valid quarantine transition for one content-addressed image id.
   - `attachment/recovered { attachmentId }` — a recovery validation passed and the attachment is usable again.

2. Both are log-only: they are not `SurfaceEventType` members, so they carry no `surfaceOp`/`sourceEventSeqs` and contribute nothing to `deriveMessages()`. The compiler enforces this at `Session.append()` through the existing conditional `SurfaceIntent` typing.

3. Whole-value events: each event carries the complete post-change state (the id plus its failure category/retryability, or the id for recovery) — no increments. The `category` values map the attachment backend's three failure codes to stable literals (`NOT_FOUND`, `CORRUPT`, `READ_FAILED`).

4. The payload types reference `string` for the attachment id, not `AttachmentId`. The owning `dsh-session` package has no dependency on `dsh-attachment`; the id is opaque content-addressed text and the brand adds nothing at the durable-log layer. The task's embedded contract specifies `attachmentId: string`.

## Consequences

- The generated persistence catalog (`docs/persistence-catalog.md`) and the runtime known-vocabulary set (`known-event-types.ts`) gain the two new entries. No `SESSION_FORMAT_VERSION` bump: these are ordinary additive event types covered by the existing `ignorable`-marker growth contract.

- The owning Agent Note records the vocabulary decision and the deferred projection/replacement work (FP-005).
