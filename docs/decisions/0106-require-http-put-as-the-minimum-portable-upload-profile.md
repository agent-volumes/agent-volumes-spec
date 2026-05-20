---
status: accepted
date: 12026-05-11
decision-makers: Yunseo Kim
---

# Require `http-put` as the minimum portable upload profile in v0.1

## Context and Problem Statement

ADR-0099 adopts a two-phase trust attachment upload API, and ADR-0102 adopts a
two-phase release upload API for hosted archive publishing. Both decisions define
the portable write lifecycle as:

1. create an upload intent
2. upload bytes using bibliotheca-provided instructions
3. finalize the upload
4. expose the accepted release or trust attachment only after finalize succeeds

Those decisions intentionally avoid standardizing object-storage protocols,
multipart upload protocols, OCI-native upload, CDN behavior, byte-range behavior,
or a broad upload-mode negotiation framework. However, leaving the byte-transfer
step fully opaque weakens generic write-client interoperability: a conforming
write-capable client may be unable to upload bytes to a conforming write-capable
bibliotheca unless both sides share out-of-band conventions for
`upload.instructionType`.

That creates a narrower v0.1 question: **should Agent Volumes define one minimum
portable byte-transfer profile for upload intents, while still allowing
bibliothecas to advertise and support additional upload profiles later?**

## Decision Drivers

- Preserve the ADR-0099 and ADR-0102 two-phase intent/finalize lifecycle.
- Make generic write-capable clients practically interoperable with generic
  write-capable bibliothecas for the v0.1 baseline.
- Avoid expanding v0.1 into a broad upload-mode negotiation framework.
- Keep conformance fixtures focused on one mandatory portable upload profile.
- Allow future upload profiles such as `multipart-form`, `tus`, and `oci-push`
  to be added without changing the v0.1 minimum profile.
- Keep storage backend choices implementation-local behind portable upload
  instructions.

## Considered Options

- Keep byte transfer fully implementation-local.
- Require a minimum portable `http-put` upload profile.
- Define optional upload profiles only through capability metadata.
- Define a broad upload-profile registry in v0.1.

## Decision Outcome

Chosen option: **Require a minimum portable `http-put` upload profile and expose
supported upload profiles through capability metadata**, because it gives v0.1 one
practical generic write path while keeping future upload-profile expansion
incremental.

Under this decision, every write-capable v0.1 bibliotheca that exposes release
upload intents or trust attachment upload intents MUST support the `http-put`
upload profile for those upload surfaces it claims to support.

The `http-put` profile is the only official v0.1 portable upload profile.
Conformance fixtures and portable baseline tests for byte transfer in v0.1 focus
on `http-put` only.

Additional upload profiles MAY be introduced in later profiles, later
specification releases, or extension-defined capability metadata. Candidate
future profile names include:

- `multipart-form`
- `tus`
- `oci-push`

These names are intentionally not given normative v0.1 byte-transfer semantics by
this decision. A bibliotheca MAY experiment with non-core upload profiles through
extension metadata or local documentation, but baseline clients are only required
to understand `http-put`.

### `http-put` profile semantics

For an upload intent using `http-put`, the returned upload instructions identify a
single HTTP request that uploads the complete byte payload for the pending upload
intent.

At minimum, an `http-put` instruction MUST provide:

- `instructionType = "http-put"`
- a `url` value that is an opaque URI-reference upload target
- `method = "PUT"`, or an omitted method that baseline clients interpret as
  `PUT` for this profile

The upload target MAY be a bibliotheca endpoint, a time-limited object-storage
URL, a signed temporary URL, an internal staging endpoint, or another backend
target. Clients MUST treat the URL as opaque and MUST NOT infer release identity,
trust identity, authorization scope, lifecycle state, or final availability from
the URL itself.

The upload request body is the full byte payload associated with the upload
intent:

- release uploads use the hosted archive payload, currently `.tar.gz` with
  `application/gzip` for the v0.1 hosted archive transport profile
- trust attachment uploads use the trust attachment bytes described by the upload
  intent metadata

Headers returned in the upload instruction are part of the opaque upload
instruction. A baseline client that uses the `http-put` profile MUST send the
specified headers exactly as instructed, subject to ordinary HTTP client safety
behavior. If both the upload instruction and the upload intent declare a media
type, the media type used for upload MUST be consistent with the intent's declared
payload semantics.

The upload request does not publish the release or activate the trust attachment.
The upload is only staged bytes. The upload becomes part of the Agent Volumes
state model only after the corresponding finalize operation succeeds under
ADR-0099 or ADR-0102.

During finalize, the bibliotheca remains responsible for verifying uploaded-byte
availability, declared digest, declared size when present, subject or identity
binding, payload media type, archive validity for release uploads, and all other
finalize-time checks required by the release or trust upload lifecycle.

If a client does not support an upload profile advertised by an upload intent, it
MUST fail locally with an unsupported-upload-profile diagnostic rather than
attempting a profile-specific interpretation. A baseline v0.1 client that supports
publishing or trust attachment uploads SHOULD support `http-put`.

### Capability metadata

Bibliotheca capability metadata MUST expose the supported upload profiles for the
upload surfaces the bibliotheca advertises.

At minimum, a write-capable v0.1 bibliotheca that supports release uploads or
trust attachment uploads MUST advertise `http-put` as a supported upload profile
for the corresponding surface.

The capability metadata model should keep upload-profile discovery narrow:

- it identifies supported upload-profile names
- it does not negotiate backend storage details
- it does not require clients to understand non-core upload profiles
- unknown upload-profile values are ignored by baseline clients unless a stricter
  local policy chooses otherwise

Future profiles MAY define additional upload-profile names and semantics. Adding a
new optional upload profile is additive when it does not redefine `http-put` or
change the v0.1 mandatory baseline.

## Consequences

- Good, because v0.1 gains one real generic byte-transfer path for write-capable
  clients and bibliothecas.
- Good, because conformance for upload byte transfer can focus on one mandatory
  profile instead of a broad matrix.
- Good, because object storage, signed URLs, internal staging endpoints, and
  direct bibliotheca endpoints can all implement `http-put` behind the same
  instruction shape.
- Good, because future profiles such as `multipart-form`, `tus`, and `oci-push`
  can be added without destabilizing the v0.1 minimum baseline.
- Good, because the release subject remains the normalized file tree and trust
  attachments remain release-subject-bound; uploaded transport bytes are still not
  the canonical release subject.
- Neutral, because bibliothecas must ensure at least one `PUT`-compatible staging
  target for each write surface they claim to support.
- Neutral, because clients may still need adapters for future or local upload
  profiles beyond `http-put`.
- Bad, because some backend-native upload mechanisms cannot be exposed as the only
  write path for a v0.1 write-capable bibliotheca.
- Bad, because v0.1 must define and maintain capability metadata and conformance
  expectations for upload profiles, even though only one profile is initially
  official.

## Confirmation

- Verify that release upload intent schemas and trust upload intent schemas can
  express `instructionType = "http-put"`, an upload URL, method, and headers.
- Verify that capability metadata exposes supported upload profiles for release
  uploads and trust attachment uploads.
- Verify that v0.1 conformance fixtures for upload byte transfer focus on
  `http-put` only.
- Verify that finalize remains the only operation that publishes a release or
  activates a trust attachment.
- Verify that `http-put` does not make transport bytes the canonical release
  subject and does not weaken normalized-file-tree digest verification.
- Verify that future profiles such as `multipart-form`, `tus`, and `oci-push` can
  be introduced additively without changing the `http-put` baseline.
- Verify that unsupported upload profiles produce explicit client diagnostics
  rather than silent interpretation as `http-put`.

## Pros and Cons of the Options

### Keep byte transfer fully implementation-local

- Good, because it is the smallest change from ADR-0099 and ADR-0102.
- Good, because every storage backend can return its own opaque instructions.
- Good, because the v0.1 core avoids even a small transfer-profile vocabulary.
- Neutral, because paired reference implementations can still work through local
  conventions.
- Bad, because generic write-capable clients cannot rely on one portable upload
  path.
- Bad, because write-capable conformance would not imply practical byte-transfer
  interoperability.

### Require a minimum portable `http-put` upload profile

- Good, because it gives all write-capable implementations one common byte-transfer
  path.
- Good, because it maps naturally to bibliotheca endpoints, object-storage signed
  URLs, and simple staging services.
- Good, because it keeps retry, expiration, digest, and activation semantics in the
  existing intent/finalize lifecycle rather than creating a new upload protocol.
- Neutral, because it is less capable than multipart or resumable uploads for very
  large artifacts.
- Bad, because implementations that only want OCI-native, multipart, or custom
  upload flows must still provide an `http-put` path to claim v0.1 write
  capability.

### Define optional upload profiles only through capability metadata

- Good, because it provides a discovery mechanism without forcing one transport
  profile on every bibliotheca.
- Good, because generic clients can choose bibliothecas whose profiles they
  understand.
- Neutral, because it could be sufficient in a small or centrally coordinated
  ecosystem.
- Bad, because two conforming write-capable implementations may still have no
  mutually supported profile.
- Bad, because conformance claims become weaker unless one profile is mandatory.

### Define a broad upload-profile registry in v0.1

- Good, because it could cover `http-put`, `multipart-form`, `tus`, `oci-push`,
  and future transfer strategies explicitly.
- Good, because clients and bibliothecas could negotiate richer upload behavior
  from the beginning.
- Neutral, because this may become useful once multiple mature implementation
  strategies exist.
- Bad, because it substantially expands v0.1 scope and conformance surface.
- Bad, because it risks prematurely freezing profiles whose operational needs are
  not yet well evidenced.
- Bad, because v0.1 conformance would need a broader upload matrix instead of one
  focused mandatory baseline.
