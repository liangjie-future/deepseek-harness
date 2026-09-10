# 隔离占位测试用例

[English](quarantine-placeholder.md) | 中文

[`quarantinePlaceholder`](../../packages/llm/llm/src/content.ts) 的测试场景。实现于 [`packages/llm/llm/tests/quarantine-placeholder.spec.ts`](../../packages/llm/llm/tests/quarantine-placeholder.spec.ts)。

## 确定性

- 相同引用与类别在多次调用中产生完全一致的字符串。
- 字段相同的两个不同引用对象产生完全一致的字符串，证明结果取决于字段值而非对象身份。

## 组合

- 有显示名称时，文本按名称、ID 前缀、类别的固定顺序组合。
- 无显示名称时，名称段缺省；ID 前缀与类别保留，且绝不出现 `undefined`。

## 类别区分

- 类别变化时 ID 前缀保持不变。
- 三种类别各自渲染出互不相同的文本。
