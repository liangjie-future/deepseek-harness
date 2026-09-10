# Quarantine placeholder test cases

English | [中文](quarantine-placeholder.zh.md)

Test scenarios for [`quarantinePlaceholder`](../../packages/llm/llm/src/content.ts). Implemented in [`packages/llm/llm/tests/quarantine-placeholder.spec.ts`](../../packages/llm/llm/tests/quarantine-placeholder.spec.ts).

## Determinism

- Same reference and category produce the identical string across repeated calls.
- Two distinct reference objects with equal fields produce the identical string, proving the result depends on field values, not object identity.

## Composition

- With a display name, the text composes name, id prefix, and category in that fixed order.
- Without a display name, the name segment is absent; the id prefix and category remain, and `undefined` never appears.

## Category distinction

- The id prefix stays fixed while the category varies.
- Each of the three categories renders its own distinct text.
