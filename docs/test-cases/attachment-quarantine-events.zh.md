# 测试用例：附件隔离／恢复事件

[English](attachment-quarantine-events.md) | 中文

用例见 `packages/core/session/tests/quarantine-events.spec.ts`。

## 追加与读回

- 给定空 `Session`，追加带 `attachmentId` 与 `category` 的 `attachment/quarantine` 会追加一条事件，其 `data` 逐字等于三个字段；`snapshotEvents()` 与 `eventAt()` 可读回；`seq` 单调递增、`time` 为 epoch 毫秒。
- 给定先前的 `attachment/quarantine`，追加 `attachment/recovered` 会追加一条 `data.attachmentId` 等于给定 id 的事件。
- 追加的事件数据被深度冻结，并与调用方输入对象解耦。

## 派生隔离

- 给定仅含隔离／恢复事件，追加前后 `deriveMessages()` 都返回空列表；这些事件不产生模型消息。

## 错误处理

- 给定非 JSON payload（例如 `category` 为 `undefined`），`append` 抛错且日志不变。

## 编译期 surface 拒绝

- 新类型不是 `SurfaceEventType` 成员，因此 `append('attachment/quarantine', …, { surfaceOp: 'append' })` 是类型错误（用 `expectTypeOf` 验证）。
