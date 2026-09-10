# Test cases: attachment quarantine/recovery events

English | [中文](attachment-quarantine-events.zh.md)

Cases are exercised in `packages/core/session/tests/quarantine-events.spec.ts`.

## Append and read-back

- Given an empty `Session`, appending `attachment/quarantine` with an `attachmentId` and `category` appends one event whose `data` equals the three fields verbatim; `snapshotEvents()` and `eventAt()` read it back; `seq` is monotonic and `time` is epoch ms.
- Given a prior `attachment/quarantine`, appending `attachment/recovered` appends one event whose `data.attachmentId` equals the given id.
- Appended event data is deeply frozen and detached from the caller's input object.

## Derivation isolation

- Given only quarantine/recovery events, `deriveMessages()` returns an empty list before and after the append; the events produce no model message.

## Error handling

- Given a non-JSON payload (e.g. `undefined` in `category`), `append` throws and the log stays unchanged.

## Compile-time surface rejection

- The new types are not members of `SurfaceEventType`, so `append('attachment/quarantine', …, { surfaceOp: 'append' })` is a type error (verified with `expectTypeOf`).
