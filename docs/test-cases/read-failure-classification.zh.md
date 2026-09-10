# 测试用例：读取失败分类

[English](read-failure-classification.md) | 中文

`classifyReadFailure(ref, error)` 的用例。`ref` 是其 `readImage()` 抛出 `error` 的 `ImageAttachmentRef`；结果为 `{ attachmentId, category }` 或 `undefined`。

## 映射

1. `ATTACHMENT_NOT_FOUND` 映射为类别 `NOT_FOUND`。
2. `ATTACHMENT_CORRUPT` 映射为类别 `CORRUPT`。
3. `ATTACHMENT_READ_FAILED` 映射为类别 `READ_FAILED`。

## 身份

4. `attachmentId` 等于 `ref.attachmentId`，即使错误消息命名了不同的附件 id。

## 未分类

5. 普通 `Error('boom')` 返回 `undefined`。
6. 携带准入 code（`INVALID_IMAGE`）的 `AttachmentError` 返回 `undefined`。
7. 携带 `INVALID_ATTACHMENT_REF` 的 `AttachmentError` 返回 `undefined`。
8. 携带未知读取相邻 code（`ATTACHMENT_WRITE_FAILED`）的 `AttachmentError` 返回 `undefined`。
9. 结构兼容且携带 `code: 'OTHER'` 的外部错误返回 `undefined`（`isAttachmentError` 对未知 code 失败关闭）。

## 跨安装识别

10. 携带自有数据 `code: 'ATTACHMENT_NOT_FOUND'` 的外部 `Error` 被分类为 `NOT_FOUND`（经由 `isAttachmentError` 的重复安装安全）。
