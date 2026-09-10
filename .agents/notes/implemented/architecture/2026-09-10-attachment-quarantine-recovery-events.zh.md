# Agent Note: 附件隔离／恢复会话事件

Status: implemented

[English](2026-09-10-attachment-quarantine-recovery-events.md) | 中文

## 问题

已接纳的 `ImageAttachmentRef` 会一直留在持久会话历史里，即使其底层对象已经丢失或损坏。此后每次回放时 `AttachmentStore.readImage()` 都会反复失败，导致会话永久不可用。会话需要一份持久记录，用来记住哪些附件被隔离（以便后续读取跳过它们）以及哪些附件之后被恢复。

## 决策

`@deepseek-ai/dsh-session/types` 中所属的 `SessionEventMap` 新增两个仅日志（log-only）事件类型：

- `attachment/quarantine { attachmentId, category, retryable }` — 一次已接纳的隔离转换。`category` 把附件后端的三个失败码映射为稳定字面量 `NOT_FOUND`／`CORRUPT`／`READ_FAILED`；`retryable` 仅在 `READ_FAILED` 时为 `true`。
- `attachment/recovered { attachmentId }` — 附件重新通过校验后的一次已接纳恢复。

两者都是携带完整变更后状态的整值记录，且都不是 `SurfaceEventType` 成员，因此不携带 `surfaceOp`／`sourceEventSeqs`，也不参与 `deriveMessages()`；编译器会在 `Session.append()` 处拒绝 surface 标记。payload 声明 `attachmentId: string` 而非 `AttachmentId` 品牌：`dsh-session` 不依赖 `dsh-attachment`，且该 id 在持久日志层是透明的内容寻址文本。

本次变更只交付事件词汇与追加／读取语义。何时隔离、重试或恢复——以及把隔离引用替换为占位文本的投影——属于后续 FP-005 隔离转换任务；不可重试／可恢复的拆分让重试路径（FP-007）与恢复校验（FP-010）与持久记录保持解耦。

## 曾考虑的替代方案

**把事件放在 `dsh-attachment` 包而非所属词汇中。** 事件词汇由 `dsh-session` 拥有；每个插件贡献都通过声明合并进入，且附件 seam 没有会话依赖。把持久日志事件放在所属 map 之外会割裂词汇并让持久化目录复杂化。不予采用。

**payload 引用 `AttachmentId`。** 品牌在跨越附件／会话包边界的边界上提供编译期安全，但会迫使 `dsh-session` 依赖 `dsh-attachment`，而该字段只是透明的内容寻址文本。`string` 让日志层保持零依赖，同时不削弱持久记录。不予采用。

## 后果

- 生成的持久化目录与运行时 `KNOWN_SESSION_EVENT_TYPES` 集合各新增两个条目；无需提升 `SESSION_FORMAT_VERSION`——这些是普通的新增事件类型，由现有 `ignorable` 标记增长契约覆盖。
- 隔离投影与转换／延迟策略仍未实现（FP-005、FP-007、FP-010）；在这些任务落地前，这些事件只会被记录而不会被消费。
