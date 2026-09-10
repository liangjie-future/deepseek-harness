# Quarantine placeholder text

English | [中文](quarantine-placeholder.zh.md)

This design covers the deterministic placeholder text that replaces an unreadable historical image reference in a model request. It is one step of [quarantining unreadable historical attachments](../../.agents/notes/proposed/bug-fix/2026-08-20-attachment-read-quarantine.md); the classification, projection, and recovery steps are separate.

## Decision

One pure function, `quarantinePlaceholder(ref, category)`, lives beside the existing image placeholders in [`packages/llm/llm/src/content.ts`](../../packages/llm/llm/src/content.ts). It returns a model-visible text block built only from the reference and the failure category, so the same quarantined request reconstructs byte-for-byte after restart or fork.

The composition is fixed in order and separators: the display name when present, then the content-addressed id prefix, then the failure category.

- **Display name** — `ref.name`, quoted and space-terminated when present; omitted entirely when absent.
- **Id prefix** — the first eight hex digits after the `sha256:` scheme, reusing the exact `slice` already used by `textOnlyImageText` and `fileHandleText`.
- **Failure category** — one of `NOT_FOUND`, `CORRUPT`, `READ_FAILED`, supplied by the caller (the classifier, not this function).

The result is deterministic because no random, clock, or environment value enters it: `ref.attachmentId` is content-addressed and stable, `ref.name` is already stripped of local path information, and the category is a fixed closed set.

## Why a closed category union

The category is typed as `QuarantineCategory`, a closed union of the three classes the attachment store reports. An invalid value fails at compile time rather than reaching model text. The function does not classify; the caller owns the read and the classification, and passes the outcome in.

## Not in scope

Replacement timing and targets, classification, and recovery belong to the quarantine projection and read steps, not this function.
