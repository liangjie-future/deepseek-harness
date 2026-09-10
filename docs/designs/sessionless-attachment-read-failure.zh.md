# 设计：无会话附件读取的显式失败

[English](sessionless-attachment-read-failure.md) | 中文

## 目标

读取图片附件但没有活跃会话日志可写的辅助调用，必须在读取失败时保持显式失败。由会话支撑的隔离投影会追加 `attachment/quarantine` 事件，而这些调用没有可写的会话，因此它们把读取失败映射为稳定的远程或协议错误码，绝不伪造占位或隔离状态。

## 决策

1. 两个无会话读取点保持快速失败并处于隔离之外：会话控制器的 `attachment` 命令与 ACP 的 `assistantBlockToAcp`。两者都不追加 `attachment/quarantine` 事件、不产生占位文本、不伪造状态。

2. 读取失败分类复用 `AttachmentError.code` 值而非类身份。会话控制器从 `error instanceof AttachmentError` 切换为基于 code 的 `isAttachmentError(error)`，与 FP-004 共享的分类口径一致，也与 subagent 提示词拒绝路径已采用的跨安装安全形态一致。这能识别 `ATTACHMENT_NOT_FOUND`、`ATTACHMENT_CORRUPT` 与 `ATTACHMENT_READ_FAILED`，而无需收窄到某个进程的类实例。

3. 错误码保持原样。会话控制器把已分类的附件失败映射为 `session/attachment-invalid`，其 `reason` 等于附件 code；ACP 把 assistant 图片的任何读取失败映射为 `kind` 为 `internal` 的 `AcpContentError`，消息固定为 `cannot deliver assistant image: the attachment is unavailable or corrupt`。

## 后果

FP-005 的会话支撑隔离语义保持不变；只有无会话调用点保持显式。会话控制器现在按 code 分类，因此由第二份 `dsh-attachment` 拷贝以不同原型抛出的失败仍会映射到 `session/attachment-invalid`。
