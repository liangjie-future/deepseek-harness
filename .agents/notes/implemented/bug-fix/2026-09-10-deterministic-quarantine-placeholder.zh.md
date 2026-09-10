# Agent Note: 确定性隔离占位文本

Status: implemented

[English](2026-09-10-deterministic-quarantine-placeholder.md) | 中文

## 问题

[隔离无法读取的历史附件](../../proposed/bug-fix/2026-08-20-attachment-read-quarantine.zh.md)用模型可见的占位文本替换无法读取的图片块。该文本必须具有确定性：仅由 `ImageAttachmentRef` 与失败类别重建，不含随机、时钟或读写环境输入，因此重启或 fork 能逐字节重建同一隔离请求。

## 决策

`quarantinePlaceholder(ref, category)` 与其他图片占位一起位于 `packages/llm/llm/src/content.ts`。它按顺序组合三个固定段：可用时的带引号显示名称、内容寻址 ID 在 `sha256:` 方案之后的前八位十六进制、以及失败类别。类别为封闭联合 `QuarantineCategory = 'NOT_FOUND' | 'CORRUPT' | 'READ_FAILED'`；函数只接受这些值，绝不自行对读取分类。ID 前缀沿用 `textOnlyImageText` 与 `fileHandleText` 已使用的同一 `slice`。

## 考虑过的替代方案

- **按类别把名称与 ID 内插进自由句式。** 可读性更强，但三段式布局由上游决策固定，且周边占位已使用简洁的方括号文本。
- **让函数自行分类读取。** 分类属于投影之前运行的读取步骤与重试策略；会执行读取的占位会重新引入本函数必须保持无 I/O 的负担。
- **输出完整 ID 而非前缀。** 完整摘要与历史中已存在的持久引用冗余，且徒增 token 开销，对重建无益。

## 后果

占位是纯函数，因此天然确定且可独立测试。`QuarantineCategory` 联合在编译期约束调用方。精确渲染文本由单元测试钉住而非会话快照，因为尚无会话级投影；预计 FP-005 投影步骤会补充把占位钉在完整请求中的快照。
