# Agent Note: Attachment quarantine/recovery session events

Status: implemented

English | [中文](2026-09-10-attachment-quarantine-recovery-events.zh.md)

## Problem

An admitted `ImageAttachmentRef` stays in the persistent session history even after its underlying object is lost or corrupted. `AttachmentStore.readImage()` then fails repeatedly on every replay, leaving the session permanently unusable. The session needs a durable record of which attachments are quarantined so later reads skip them, and of which were later recovered.

## Decision

The owning `SessionEventMap` in `@deepseek-ai/dsh-session/types` gains two log-only event types:

- `attachment/quarantine { attachmentId, category, retryable }` — one accepted quarantine transition. `category` maps the attachment backend's three failure codes to stable literals `NOT_FOUND` / `CORRUPT` / `READ_FAILED`; `retryable` is `true` only for `READ_FAILED`.
- `attachment/recovered { attachmentId }` — one accepted recovery after the attachment passed its verification again.

Both are whole-value records carrying complete post-change state, and neither is a `SurfaceEventType` member, so they carry no `surfaceOp`/`sourceEventSeqs` and contribute nothing to `deriveMessages()`; the compiler rejects a surface marker at `Session.append()`. The payload declares `attachmentId: string` rather than the `AttachmentId` brand: `dsh-session` has no dependency on `dsh-attachment`, and the id is opaque content-addressed text at the durable-log layer.

This change ships the vocabulary and append/read semantics only. When to quarantine, retry, or recover — and the projection that replaces a quarantined reference with placeholder text — belong to the later FP-005 isolation-transition task; the non-retryable/recoverable split keeps the retry path (FP-007) and recovery verification (FP-010) separable from the durable record.

## Alternatives considered

**Place the events in the `dsh-attachment` package instead of the owning vocabulary.** The event vocabulary is owned by `dsh-session`; every plugin contribution goes through declaration merging, and the attachment seam has no session dependency. Placing durable-log events outside the owning map would split the vocabulary and complicate the persistence catalog. Rejected.

**Reference `AttachmentId` in the payload.** A brand adds compile-time safety at a boundary that already crosses the attachment/session package line, and would force a `dsh-session` → `dsh-attachment` dependency solely for a field that is opaque content-addressed text. `string` keeps the log layer dependency-free without weakening the durable record. Rejected.

## Consequences

- The generated persistence catalog and the runtime `KNOWN_SESSION_EVENT_TYPES` set grow by two entries; no `SESSION_FORMAT_VERSION` bump — these are ordinary additive event types covered by the existing `ignorable`-marker growth contract.
- The quarantine projection and the transition/deferral policy remain unwritten (FP-005, FP-007, FP-010); until they land, these events are recorded but never consumed.
