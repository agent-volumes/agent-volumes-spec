import { assertProblemDetails } from "../assertions/problem-details.ts";
import { assertReleaseMetadata } from "../assertions/release-metadata.ts";
import { assert, assertSpecVersion } from "../core/assert.ts";
import { digestPattern } from "../core/patterns.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

export const run = (ctx: ValidationContext) => {
  const releaseUploadLifecycle = ctx.readJson("conformance/fixtures/release-upload-lifecycle.json");
  assertSpecVersion(ctx, releaseUploadLifecycle, "release upload lifecycle fixture");
  const releaseUploadFailures = new Set(
    releaseUploadLifecycle.fixtures
      .filter((fixture: JsonValue) => fixture.schema === "problem-details")
      .map((fixture: JsonValue) => fixture.expected.failureCategory),
  );
  const releaseUploadStates = new Set(
    releaseUploadLifecycle.fixtures
      .filter((fixture: JsonValue) => fixture.schema === "release-upload-intent")
      .map((fixture: JsonValue) => fixture.payload.state),
  );
  for (const requiredState of ["pending-upload", "uploading", "uploaded", "expired", "failed"]) {
    assert(
      releaseUploadStates.has(requiredState),
      `release upload lifecycle missing ${requiredState} state`,
    );
  }
  for (const failureCategory of [
    "version-conflict",
    "invalid-archive",
    "invalid-manifest",
    "authorization-failed",
    "payload-too-large",
    "unsupported-media-type",
    "identity-mismatch",
    "digest-mismatch",
    "missing-uploaded-bytes",
    "invalid-upload-state",
    "idempotency-conflict",
    "upload-expired",
  ]) {
    assert(
      releaseUploadFailures.has(failureCategory),
      `release upload lifecycle missing ${failureCategory}`,
    );
  }
  for (const fixture of releaseUploadLifecycle.fixtures) {
    if (fixture.schema === "release-upload-intent") {
      ctx.validate(
        "releaseUploadIntent",
        fixture.payload,
        `release upload lifecycle ${fixture.name}`,
      );
      assert(
        fixture.payload.mediaType === "application/gzip",
        `release upload lifecycle ${fixture.name} must use application/gzip`,
      );
      assert(
        fixture.payload.upload.instructionType === "http-put",
        `release upload lifecycle ${fixture.name} must use http-put upload instructions`,
      );
      assert(
        fixture.payload.upload.method === undefined || fixture.payload.upload.method === "PUT",
        `release upload lifecycle ${fixture.name} http-put method must be omitted or PUT`,
      );
      assert(
        fixture.payload.upload.url,
        `release upload lifecycle ${fixture.name} http-put upload needs a URL`,
      );
      if (fixture.expected.state) {
        assert(
          fixture.payload.state === fixture.expected.state,
          `release upload lifecycle ${fixture.name} expected state must match payload state`,
        );
        assert(
          fixture.expected.finalizable === (fixture.payload.state === "uploaded"),
          `release upload lifecycle ${fixture.name} finalizable flag must match uploaded-only finalization rule`,
        );
      }
    }
    if (fixture.schema === "release-upload-finalize") {
      ctx.validate(
        "releaseUploadFinalize",
        fixture.payload,
        `release upload lifecycle ${fixture.name}`,
      );
      assertReleaseMetadata(
        ctx,
        fixture.payload.release,
        `release upload lifecycle ${fixture.name} release metadata`,
      );
    }
    if (fixture.schema === "problem-details") {
      assertProblemDetails(ctx, fixture.payload, `release upload lifecycle ${fixture.name}`);
      assert(
        fixture.payload.type.endsWith(`/${fixture.expected.failureCategory}`),
        `release upload lifecycle ${fixture.name} failureCategory must match problem type slug`,
      );
    }
  }

  const trustUploadLifecycle = ctx.readJson("conformance/fixtures/trust-upload-lifecycle.json");
  assertSpecVersion(ctx, trustUploadLifecycle, "trust upload lifecycle fixture");
  const trustUploadIntentCategories = new Set();
  const trustUploadStates = new Set();
  const trustUploadFailures = new Set();
  for (const fixture of trustUploadLifecycle.fixtures) {
    if (fixture.schema === "trust-upload-intent") {
      ctx.validate("trustUploadIntent", fixture.payload, `trust upload lifecycle ${fixture.name}`);
      trustUploadIntentCategories.add(fixture.payload.attachment.category);
      trustUploadStates.add(fixture.payload.state);
      assert(
        fixture.payload.upload.instructionType === "http-put",
        `trust upload lifecycle ${fixture.name} must use http-put upload instructions`,
      );
      assert(
        fixture.payload.upload.method === undefined || fixture.payload.upload.method === "PUT",
        `trust upload lifecycle ${fixture.name} http-put method must be omitted or PUT`,
      );
      assert(
        fixture.payload.upload.url,
        `trust upload lifecycle ${fixture.name} http-put upload needs a URL`,
      );
      if (fixture.expected.state) {
        assert(
          fixture.payload.state === fixture.expected.state,
          `trust upload lifecycle ${fixture.name} expected state must match payload state`,
        );
        assert(
          fixture.expected.finalizable === (fixture.payload.state === "uploaded"),
          `trust upload lifecycle ${fixture.name} finalizable flag must match uploaded-only finalization rule`,
        );
      }
    }
    if (fixture.schema === "trust-upload-finalize") {
      ctx.validate(
        "trustUploadFinalize",
        fixture.payload,
        `trust upload lifecycle ${fixture.name}`,
      );
      assert(
        digestPattern.test(fixture.payload.artifactDigest),
        `trust upload lifecycle ${fixture.name} must preserve finalized artifact digest`,
      );
    }
    if (fixture.schema === "problem-details") {
      assertProblemDetails(ctx, fixture.payload, `trust upload lifecycle ${fixture.name}`);
      trustUploadFailures.add(fixture.expected.failureCategory);
      assert(
        fixture.payload.type.endsWith(`/${fixture.expected.failureCategory}`),
        `trust upload lifecycle ${fixture.name} failureCategory must match problem type slug`,
      );
    }
  }
  for (const requiredState of ["pending-upload", "uploading", "uploaded", "expired", "failed"]) {
    assert(
      trustUploadStates.has(requiredState),
      `trust upload lifecycle missing ${requiredState} state`,
    );
  }
  for (const requiredTrustUploadCategory of ["bom", "provenance", "signature"]) {
    assert(
      trustUploadIntentCategories.has(requiredTrustUploadCategory),
      `trust upload lifecycle must include ${requiredTrustUploadCategory} intent`,
    );
  }
  for (const failureCategory of [
    "digest-mismatch",
    "upload-expired",
    "subject-binding-mismatch",
    "missing-uploaded-bytes",
    "idempotency-conflict",
    "invalid-upload-state",
    "payload-too-large",
    "unsupported-media-type",
    "authorization-failed",
  ]) {
    assert(
      trustUploadFailures.has(failureCategory),
      `trust upload lifecycle missing ${failureCategory}`,
    );
  }
};
