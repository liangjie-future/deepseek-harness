# Test cases: read-failure classification

English | [中文](read-failure-classification.zh.md)

Cases for `classifyReadFailure(ref, error)`. `ref` is the `ImageAttachmentRef` whose `readImage()` raised `error`; the result is `{ attachmentId, category }` or `undefined`.

## Mapping

1. `ATTACHMENT_NOT_FOUND` maps to category `NOT_FOUND`.
2. `ATTACHMENT_CORRUPT` maps to category `CORRUPT`.
3. `ATTACHMENT_READ_FAILED` maps to category `READ_FAILED`.

## Identity

4. `attachmentId` equals `ref.attachmentId`, even when the error message names a different attachment id.

## Unclassified

5. A plain `Error('boom')` returns `undefined`.
6. `AttachmentError` with an admission code (`INVALID_IMAGE`) returns `undefined`.
7. `AttachmentError` with `INVALID_ATTACHMENT_REF` returns `undefined`.
8. `AttachmentError` with an unknown read-adjacent code (`ATTACHMENT_WRITE_FAILED`) returns `undefined`.
9. A structurally compatible foreign error carrying `code: 'OTHER'` returns `undefined` (`isAttachmentError` fails closed on unknown codes).

## Cross-install recognition

10. A foreign `Error` carrying an own-data `code: 'ATTACHMENT_NOT_FOUND'` is classified as `NOT_FOUND` (duplicate-install safety via `isAttachmentError`).
