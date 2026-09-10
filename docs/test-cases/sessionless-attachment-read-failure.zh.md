# 测试用例：无会话附件读取失败

[English](sessionless-attachment-read-failure.md) | 中文

用例位于 `packages/acp/acp/tests/content.spec.ts` 与 `packages/api/session-controller/tests/commands-queue-attachment.host.spec.ts`。

## 会话控制器 attachment 命令

- 给定一个引用图片的冷会话，且存储的 `readImage` 以 `ATTACHMENT_NOT_FOUND` 拒绝时，命令以 `session/attachment-invalid` 与 `reason: 'ATTACHMENT_NOT_FOUND'` 拒绝。
- 给定 `ATTACHMENT_CORRUPT` 时，以 `session/attachment-invalid` 与 `reason: 'ATTACHMENT_CORRUPT'` 拒绝。
- 给定 `ATTACHMENT_READ_FAILED` 时，以 `session/attachment-invalid` 与 `reason: 'ATTACHMENT_READ_FAILED'` 拒绝。
- 给定未分类失败时，以 `gateway/internal` 拒绝。
- 上述任何路径都不追加 `attachment/quarantine` 事件。

## ACP assistant 图片交付

- 给定存储的 `readImage` 以 `ATTACHMENT_NOT_FOUND` 拒绝时，`assistantBlockToAcp` 以 `kind: 'internal'` 与消息 `cannot deliver assistant image: the attachment is unavailable or corrupt` 拒绝。
- 给定无附件存储时，以 `kind: 'internal'` 与消息 `cannot deliver assistant image: no attachment store is mounted` 拒绝。
- 成功读取仍返回内联 base64，不产生任何占位文本。

## 分类形态

- 分类基于附件错误 `code` 而非类原型，因此来自另一份包拷贝的结构兼容错误仍会映射到 `session/attachment-invalid`。
