# 隔离占位文本

[English](quarantine-placeholder.md) | 中文

本设计说明涵盖在模型请求中替换不可读历史图片引用的确定性占位文本。它是[隔离无法读取的历史附件](../../.agents/notes/proposed/bug-fix/2026-08-20-attachment-read-quarantine.zh.md)的一个步骤；分类、投影与恢复步骤各自独立。

## 决策

一个纯函数 `quarantinePlaceholder(ref, category)` 与现有图片占位一起位于 [`packages/llm/llm/src/content.ts`](../../packages/llm/llm/src/content.ts)。它返回一段仅由引用和失败类别构成的模型可见文本块，因此同一隔离请求在重启或 fork 后能逐字节重建。

组合顺序与分隔符固定：可用时的显示名称，然后是内容寻址 ID 前缀，最后是失败类别。

- **显示名称** — `ref.name`，存在时加引号并以空格结尾；不存在时完全省略。
- **ID 前缀** — `sha256:` 方案之后的前八位十六进制，沿用 `textOnlyImageText` 与 `fileHandleText` 已使用的同一 `slice`。
- **失败类别** — `NOT_FOUND`、`CORRUPT`、`READ_FAILED` 之一，由调用方（分类器，而非本函数）传入。

结果是确定性的，因为其中没有随机、时钟或环境值：`ref.attachmentId` 是内容寻址且稳定的，`ref.name` 已剥离本地路径信息，类别则是一个固定的封闭集合。

## 为何使用封闭类别联合

类别类型为 `QuarantineCategory`，即附件存储报告的三个类别的封闭联合。非法值在编译期失败，而非进入模型文本。本函数不分类；调用方负责读取与分类，并将结果传入。

## 不在范围内

替换时机与对象、分类与恢复属于隔离投影和读取步骤，而非本函数。
