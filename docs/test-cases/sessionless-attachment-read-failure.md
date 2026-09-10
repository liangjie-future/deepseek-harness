# Test cases: sessionless attachment read failure

English | [中文](sessionless-attachment-read-failure.zh.md)

Cases are exercised in `packages/acp/acp/tests/content.spec.ts` and `packages/api/session-controller/tests/commands-queue-attachment.host.spec.ts`.

## Session controller attachment command

- Given a cold session referencing an image and a store whose `readImage` rejects with `ATTACHMENT_NOT_FOUND`, the command rejects with `session/attachment-invalid` and `reason: 'ATTACHMENT_NOT_FOUND'`.
- Given `ATTACHMENT_CORRUPT`, it rejects with `session/attachment-invalid` and `reason: 'ATTACHMENT_CORRUPT'`.
- Given `ATTACHMENT_READ_FAILED`, it rejects with `session/attachment-invalid` and `reason: 'ATTACHMENT_READ_FAILED'`.
- Given an unclassified failure, it rejects with `gateway/internal`.
- No `attachment/quarantine` event is appended in any of these paths.

## ACP assistant image delivery

- Given a store whose `readImage` rejects with `ATTACHMENT_NOT_FOUND`, `assistantBlockToAcp` rejects with `kind: 'internal'` and the message `cannot deliver assistant image: the attachment is unavailable or corrupt`.
- Given no attachment store, it rejects with `kind: 'internal'` and the message `cannot deliver assistant image: no attachment store is mounted`.
- A successful read still returns inline base64 without any placeholder text.

## Classification shape

- Classification keys on the attachment error `code`, not the class prototype, so a structurally compatible error from another package copy still maps to `session/attachment-invalid`.
