# 设计：附件隔离／恢复会话事件（FP-001）

[English](attachment-quarantine-events.md) | 中文

## 目标

在可合并扩展的 `SessionEventMap` 中新增两个仅日志事件类型，使被隔离的图片附件可持久化并从会话日志重建。这只是持久化底座：记录哪个附件不可读、之后是否恢复。它不决定何时隔离、重试或还原。

## 决策

1. 通过对 `@deepseek-ai/dsh-session/types` 的声明合并新增两个事件键：

   - `attachment/quarantine { attachmentId, category, retryable }` — 针对某个内容寻址图片 id 的一次有效隔离转换。
   - `attachment/recovered { attachmentId }` — 恢复校验通过，附件重新可用。

2. 两者都是仅日志事件：不是 `SurfaceEventType` 成员，因此不携带 `surfaceOp`／`sourceEventSeqs`，也不参与 `deriveMessages()`。编译器通过现有条件 `SurfaceIntent` 类型在 `Session.append()` 处强制执行。

3. 整值事件：每个事件携带完整变更后状态（隔离的 id 加上失败类别与可重试性，恢复的 id），不做增量。`category` 把附件后端的三个失败码映射为稳定字面量（`NOT_FOUND`、`CORRUPT`、`READ_FAILED`）。

4. payload 类型用 `string` 表示附件 id，而非 `AttachmentId`。所属的 `dsh-session` 包不依赖 `dsh-attachment`；该 id 是透明的内容寻址文本，品牌在持久日志层不增加价值。任务内嵌契约指定 `attachmentId: string`。

## 后果

- 生成的持久化目录（`docs/persistence-catalog.md`）与运行时已知词汇集合（`known-event-types.ts`）新增两个条目。无需提升 `SESSION_FORMAT_VERSION`：这些是普通新增事件类型，由现有 `ignorable` 标记增长契约覆盖。

- 所属 Agent Note 记录词汇决策与延迟的投影／替换工作（FP-005）。
