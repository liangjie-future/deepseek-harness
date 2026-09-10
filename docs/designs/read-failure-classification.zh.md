# 设计说明：读取失败分类

[English](read-failure-classification.md) | 中文

## 目标

在请求投影消费方分派给 provider 之前，必须知道每一个不可读历史图片引用的准确身份（附件 ID）与失败类别。`AttachmentStore.readImage()` 会抛出携带稳定机器 `code` 的 `AttachmentError`；本任务把「抛出的错误 + 触发读取的引用」归为持久的 `ClassifiedReadFailure`。该结果同时服务隔离（FP-005）、重试（FP-007）与无活跃会话失败策略（FP-011）。

## 输出契约

```ts
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment'

type QuarantineFailureCategory = 'NOT_FOUND' | 'CORRUPT' | 'READ_FAILED'

interface ClassifiedReadFailure {
  attachmentId: string
  category: QuarantineFailureCategory
}

declare function classifyReadFailure(
  ref: ImageAttachmentRef,
  error: unknown,
): ClassifiedReadFailure | undefined
```

## 决策

- **纯函数，无服务。** 分类是一次数据映射，不接收 Cordis context，也不做 I/O，因此以导出的纯函数形式落在 `packages/llm/llm/src/read-failure.ts`，与既有投影辅助函数并排。它是提供方（被后续任务调用），不是消费方。
- **按 `AttachmentError.code` 路由，绝不解析消息文本或依赖原型链。** `isAttachmentError`（`@deepseek-ai/dsh-attachment` 已导出）能识别来自重复包安装的结构兼容错误。三个读取 code 映射为类别：`ATTACHMENT_NOT_FOUND` → `NOT_FOUND`、`ATTACHMENT_CORRUPT` → `CORRUPT`、`ATTACHMENT_READ_FAILED` → `READ_FAILED`。
- **未分类返回 `undefined`。** 准入类 code、`INVALID_ATTACHMENT_REF`、未知 code 与非 `AttachmentError` 值都不进入隔离路径。对三个读取 code 的 switch 落空时返回 `undefined`，而不是 `assertNever`，因为 `AttachmentErrorCode` 是一个与其他调用方共享的封闭但宽泛的联合。
- **身份来自引用，而非错误。** `attachmentId` 读取自 `ref.attachmentId`（带品牌 `AttachmentId`），保证调用方记录的是它实际尝试读取的那个引用，即使错误消息回显了不同或截断的 id。
- **落在 `dsh-llm`。** 消费方是请求投影与隔离状态，属于 LLM/attachment 请求管线。`dsh-llm` 目前把 `@deepseek-ai/dsh-attachment` 声明为 dev 依赖（在 `types.ts`、`content.ts`、`index.ts` 中仅类型使用）。新增运行时 `isAttachmentError` 导入会把该关系提升为运行时 `dependencies` 条目。

## 不在范围内

隔离转换与占位投影（FP-005）、重试（FP-007）、恢复校验（FP-010）与辅助无活跃会话错误映射（FP-011）复用本分类，但由各自任务实现。
