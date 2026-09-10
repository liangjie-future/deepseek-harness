# Design: Explicit failure for sessionless attachment reads

English | [中文](sessionless-attachment-read-failure.zh.md)

## Goal

Auxiliary calls that read image attachments but have no live session log to write to must keep failing explicitly when the read fails. The session-backed quarantine projection appends `attachment/quarantine` events, which require a writable session; these calls have none, so they map a read failure to a stable remote or protocol error code and never fabricate placeholder or quarantine state.

## Decisions

1. Two sessionless read sites stay fail-loud and outside quarantine: the session controller's `attachment` command and ACP's `assistantBlockToAcp`. Neither appends an `attachment/quarantine` event, emits placeholder text, or fabricates state.

2. Read-failure classification reuses the `AttachmentError.code` value rather than the class identity. The session controller switches from `error instanceof AttachmentError` to the code-based `isAttachmentError(error)`, matching the classification criteria shared with FP-004 and the cross-install-safe shape the subagent prompt-rejection path already uses. This recognizes `ATTACHMENT_NOT_FOUND`, `ATTACHMENT_CORRUPT`, and `ATTACHMENT_READ_FAILED` without narrowing to one process's class instance.

3. Error codes stay as-is. The session controller maps a classified attachment failure to `session/attachment-invalid` with `reason` equal to the attachment code; ACP maps any read failure of an assistant image to `AcpContentError` with `kind` `internal` and the fixed message `cannot deliver assistant image: the attachment is unavailable or corrupt`.

## Consequences

The session-backed quarantine semantics of FP-005 are untouched; only the sessionless call sites stay explicit. The session controller now classifies by code, so a failure raised by a second copy of `dsh-attachment` with a different prototype still maps to `session/attachment-invalid`.
