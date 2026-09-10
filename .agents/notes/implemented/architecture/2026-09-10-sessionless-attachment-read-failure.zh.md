# Agent Note: 无会话附件读取保持显式失败

Status: implemented

[English](2026-09-10-sessionless-attachment-read-failure.md) | 中文

## 问题

[隔离不可读历史附件](../../proposed/bug-fix/2026-08-20-attachment-read-quarantine.zh.md) 通过追加 `attachment/quarantine` 事件并投影占位文本来记录不可读引用。这需要可写的会话日志。某些辅助调用点——会话控制器的 `attachment` 命令与 ACP 的 `assistantBlockToAcp`——在没有活跃会话可追加的情况下读取图片附件。它们无法隔离，而静默降级或伪造状态会破坏这些调用已有的快速失败保证。

## 决策

无会话读取点保持显式失败并处于隔离之外。会话控制器把已分类的读取失败映射为 `session/attachment-invalid`，其 `reason` 等于附件 code；ACP 把失败的 assistant 图片读取映射为 `kind` 为 `internal` 的 `AcpContentError`，消息固定为 `cannot deliver assistant image: the attachment is unavailable or corrupt`。两者都不追加隔离事件，也不产生占位文本。

读取失败分类通过 `isAttachmentError(error)` 基于 `AttachmentError.code`，而非 `error instanceof AttachmentError`。这是 subagent 提示词拒绝路径已采用的跨安装安全形态：同一进程中的两份 `dsh-attachment` 拷贝会产生不同的原型，因此类身份可能把来自提供方的结构兼容 `AttachmentError` 误判。可识别的 code 为 `ATTACHMENT_NOT_FOUND`、`ATTACHMENT_CORRUPT` 与 `ATTACHMENT_READ_FAILED`。

## 曾考虑的替代方案

**保留 `instanceof AttachmentError`。** 类身份在重复包安装下会失效，导致真实读取失败落入 `gateway/internal` 分支并丢失 `reason`。基于 code 的分类已存在于该 seam 中，且不增加成本。

**让无会话失败走隔离占位。** 占位文本对模型可见并派生于会话日志状态；在没有持久事件的情况下产生占位会让回放依赖于恰好存在的适配器，这正是隔离设计所拒绝的失败模式。无会话调用点没有可写入的日志。

## 后果

FP-005 的会话支撑隔离语义保持不变；只有无会话调用点保持显式。会话控制器现在按 code 分类，因此由第二份 `dsh-attachment` 拷贝以不同原型抛出的失败仍会映射到 `session/attachment-invalid`。
