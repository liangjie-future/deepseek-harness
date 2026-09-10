# Agent Note: Sessionless attachment reads stay explicit

Status: implemented

English | [中文](2026-09-10-sessionless-attachment-read-failure.zh.md)

## Problem

[Quarantining unreadable historical attachments](../../proposed/bug-fix/2026-08-20-attachment-read-quarantine.md) records unreadable references by appending `attachment/quarantine` events and projecting placeholder text. That requires a writable session log. Some auxiliary call sites — the session controller's `attachment` command and ACP's `assistantBlockToAcp` — read image attachments without a live session to append to. They cannot quarantine, and silently degrading or fabricating state would regress the fail-loud guarantee these calls already provide.

## Decision

Sessionless read sites keep failing explicitly and stay outside quarantine. The session controller maps a classified read failure to `session/attachment-invalid` with `reason` set to the attachment code; ACP maps a failed assistant-image read to `AcpContentError` with `kind` `internal` and the fixed message `cannot deliver assistant image: the attachment is unavailable or corrupt`. Neither appends a quarantine event or emits placeholder text.

Read-failure classification keys on `AttachmentError.code` through `isAttachmentError(error)` instead of `error instanceof AttachmentError`. This is the cross-install-safe shape the subagent prompt-rejection path already uses: two copies of `dsh-attachment` in one process produce distinct prototypes, so class identity can misclassify a structural `AttachmentError` from a provider. The recognized codes are `ATTACHMENT_NOT_FOUND`, `ATTACHMENT_CORRUPT`, and `ATTACHMENT_READ_FAILED`.

## Alternatives considered

**Keep `instanceof AttachmentError`.** Class identity fails across duplicate package installations, so a real read failure could fall through to the `gateway/internal` branch and lose its `reason`. Code-based classification already exists in the seam and costs nothing.

**Route sessionless failures through the quarantine placeholder.** The placeholder is model-visible and derives from session log state; emitting it without the durable event would make replay depend on which adapter happened to be present, the exact failure the quarantine design rejects. Sessionless call sites have no log to record into.

## Consequences

The session-backed quarantine semantics of FP-005 are untouched; only the sessionless call sites stay explicit. The session controller now classifies by code, so a failure raised by a second `dsh-attachment` copy with a different prototype still maps to `session/attachment-invalid`.
