# Agent Note: Deterministic quarantine placeholder text

Status: implemented

English | [中文](2026-09-10-deterministic-quarantine-placeholder.zh.md)

## Problem

[Quarantining unreadable historical attachments](../../proposed/bug-fix/2026-08-20-attachment-read-quarantine.md) replaces an unreadable image block with model-visible placeholder text. That text must be deterministic: rebuilt from `ImageAttachmentRef` and the failure category alone, with no random, clock, or read-write environment input, so a restart or fork reconstructs the same quarantined request byte-for-byte.

## Decision

`quarantinePlaceholder(ref, category)` lives beside the other image placeholders in `packages/llm/llm/src/content.ts`. It composes three fixed segments in order: the quoted display name when present, the first eight hex digits of the content-addressed id after the `sha256:` scheme, and the failure category. The category is the closed union `QuarantineCategory = 'NOT_FOUND' | 'CORRUPT' | 'READ_FAILED'`; the function accepts only these values and never classifies a read itself. The id prefix reuses the same `slice` already used by `textOnlyImageText` and `fileHandleText`.

## Alternatives considered

- **Interpolate name and id into free-form sentences per category.** More readable prose, but the three-segment layout is fixed by the upstream decision and the surrounding placeholders already use terse bracket text.
- **Have the function classify the read itself.** Classification belongs to the read step and retry policy, which run before projection; a placeholder that reads would reintroduce the I/O this function must stay free of.
- **Emit the whole id instead of a prefix.** The full digest is redundant with the durable reference already in history and adds token cost for no reconstruction benefit.

## Consequences

The placeholder is a pure function, so it is trivially deterministic and testable in isolation. The `QuarantineCategory` union constrains the caller at compile time. The exact rendered text is pinned by unit tests rather than a session snapshot because no session-scoped projection exists yet; the FP-005 projection step is expected to add the snapshot that pins the placeholder in a full request.
