import crypto from "node:crypto";
import path from "node:path";

import { decodeFixtureArtifact } from "../assertions/mapping-artifacts.ts";
import {
  assertCycloneDxArtifact,
  assertSigstoreArtifact,
  assertSlsaArtifact,
} from "../assertions/trust-artifacts.ts";
import { assert, assertSpecVersion } from "../core/assert.ts";
import { errorMessage } from "../core/json.ts";
import { gitCommitPattern } from "../core/patterns.ts";
import { canonicalComponentPurl, canonicalReleasePurl } from "../core/purl.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

const isInvalidNormalizedPath = (pathValue: JsonValue) =>
  pathValue.startsWith("/") ||
  pathValue.split("/").some((segment: JsonValue) => segment === "." || segment === "..");
const normalizeArchivePath = (pathValue: JsonValue) => path.posix.normalize(pathValue);
const isInvalidArchivePath = (pathValue: JsonValue) => {
  const normalized = normalizeArchivePath(pathValue);
  return (
    pathValue.startsWith("/") ||
    normalized === "." ||
    pathValue.split("/").some((segment: JsonValue) => segment === "." || segment === "..")
  );
};

export const run = (ctx: ValidationContext) => {
  const trustArtifactVerificationCases = ctx.readJson(
    "conformance/fixtures/trust-artifact-verification-cases.json",
  );
  ctx.validate(
    "trustArtifactVerificationCase",
    trustArtifactVerificationCases,
    "trust artifact verification cases fixture",
  );
  assertSpecVersion(ctx, trustArtifactVerificationCases, "trust artifact verification cases");
  for (const trustCategory of ["bom", "provenance", "signature"]) {
    assert(
      trustArtifactVerificationCases.cases.some(
        (trustCase: JsonValue) =>
          trustCase.category === trustCategory && trustCase.expected.valid === true,
      ),
      `trust artifact verification cases must include valid ${trustCategory} binding`,
    );
  }
  for (const trustCase of trustArtifactVerificationCases.cases) {
    if (trustCase.category === "bom") {
      assert(
        trustCase.format.family === "cyclonedx" ||
          trustCase.expected.failureCategory === "unsupported-artifact-format",
        `trust artifact case ${trustCase.name} BOM must use cyclonedx family`,
      );
    }
    if (trustCase.category === "provenance") {
      assert(
        trustCase.format.family === "slsa-provenance",
        `trust artifact case ${trustCase.name} provenance must use slsa-provenance family`,
      );
      if (trustCase.expected.valid) {
        assert(
          trustCase.artifactSubject?.predicateType === "https://slsa.dev/provenance/v1",
          `trust artifact case ${trustCase.name} valid provenance must use SLSA v1 predicate`,
        );
      } else if (trustCase.expected.failureCategory === "unsupported-provenance-predicate") {
        assert(
          trustCase.artifactSubject?.predicateType !== "https://slsa.dev/provenance/v1",
          `trust artifact case ${trustCase.name} must exercise wrong SLSA predicate`,
        );
      }
    }
    if (trustCase.category === "signature") {
      assert(
        trustCase.format.family === "sigstore-bundle",
        `trust artifact case ${trustCase.name} signature must use sigstore-bundle family`,
      );
      if (trustCase.expected.valid) {
        assert(
          trustCase.artifactSubject?.signatureFormat === "sigstore-bundle",
          `trust artifact case ${trustCase.name} valid signature must use sigstore-bundle format`,
        );
      } else if (trustCase.expected.failureCategory === "unsupported-signature-format") {
        assert(
          trustCase.artifactSubject?.signatureFormat !== "sigstore-bundle",
          `trust artifact case ${trustCase.name} must exercise signature format mismatch`,
        );
      }
    }
    if (trustCase.expected.failureCategory === "subject-binding-mismatch") {
      assert(
        trustCase.artifactSubject?.integrity !== trustCase.subject.integrity ||
          trustCase.artifactSubject?.purl !== trustCase.subject.purl,
        `trust artifact case ${trustCase.name} must exercise subject mismatch`,
      );
    }
    if (trustCase.expected.failureCategory === "missing-artifact-subject") {
      assert(
        !trustCase.artifactSubject?.purl || !trustCase.artifactSubject?.integrity,
        `trust artifact case ${trustCase.name} must omit at least one artifact subject fact`,
      );
    }
    if (trustCase.expected.failureCategory === "revoked-trust-artifact") {
      assert(
        trustCase.lifecycleStatus?.state === "revoked" && trustCase.expected.valid === false,
        `trust artifact case ${trustCase.name} must model revoked attachments as default failures`,
      );
    }
    if (trustCase.expected.failureCategory === "invalid-trust-artifact") {
      assert(
        (trustCase.lifecycleStatus?.state === "invalid" || trustCase.artifact) &&
          trustCase.expected.valid === false,
        `trust artifact case ${trustCase.name} must model invalid lifecycle or malformed artifact failures`,
      );
    }
    if (trustCase.expected.failureCategory === "stale-trust-evidence-only") {
      assert(
        trustCase.lifecycleStatus?.state === "superseded" && trustCase.expected.valid === false,
        `trust artifact case ${trustCase.name} must model superseded attachments as stale current evidence`,
      );
    }
    if (trustCase.expected.valid) {
      assert(
        trustCase.artifactSubject?.integrity === trustCase.subject.integrity,
        `trust artifact case ${trustCase.name} valid artifact must bind immutable identity`,
      );
      assert(
        trustCase.artifactSubject?.purl === trustCase.subject.purl,
        `trust artifact case ${trustCase.name} valid artifact must bind logical identity`,
      );
    }
    if (trustCase.artifact) {
      assert(
        trustCase.artifact.mediaType === trustCase.format.mediaType,
        `trust artifact case ${trustCase.name} artifact mediaType must match declared format`,
      );
      let artifactError: unknown;
      try {
        const artifactJson = decodeFixtureArtifact(
          trustCase.artifact,
          `trust artifact case ${trustCase.name}`,
        );
        if (trustCase.category === "bom") {
          assertCycloneDxArtifact(artifactJson, trustCase);
        }
        if (trustCase.category === "provenance") {
          assertSlsaArtifact(artifactJson, trustCase);
        }
        if (trustCase.category === "signature") {
          assertSigstoreArtifact(artifactJson, trustCase);
        }
      } catch (error) {
        artifactError = error;
      }
      if (trustCase.expected.valid) {
        assert(
          !artifactError,
          artifactError
            ? errorMessage(artifactError)
            : `trust artifact case ${trustCase.name} must validate`,
        );
      } else if (trustCase.expected.failureCategory === "invalid-trust-artifact") {
        assert(
          artifactError,
          `trust artifact case ${trustCase.name} must fail artifact validation`,
        );
      } else {
        assert(
          !artifactError,
          artifactError
            ? errorMessage(artifactError)
            : `trust artifact case ${trustCase.name} artifact validation failed`,
        );
      }
    }
  }

  const digestVectors = ctx.readJson("conformance/fixtures/digest-vectors.json");
  assertSpecVersion(ctx, digestVectors, "digest vectors");
  for (const fixture of digestVectors.fixtures) {
    const canonicalInputBytes = fixture.canonicalInputBase64
      ? Buffer.from(fixture.canonicalInputBase64, "base64")
      : Buffer.from(fixture.canonicalInput, "utf8");
    assert(
      fixture.normalizedFiles.every((file: JsonValue) => {
        const contentBytes = file.contentBase64
          ? Buffer.from(file.contentBase64, "base64")
          : Buffer.from(file.content, "utf8");
        const recordHeader = Buffer.from(
          `file ${file.path} ${file.executable ? 1 : 0} ${contentBytes.byteLength}\n`,
          "utf8",
        );
        return canonicalInputBytes.includes(recordHeader);
      }),
      `digest vector ${fixture.name} canonical input must use byte lengths from normalized files`,
    );
    const actual = `sha256:${crypto.createHash("sha256").update(canonicalInputBytes).digest("hex")}`;
    assert(
      actual === fixture.expectedIntegrity,
      `digest vector ${fixture.name} expected ${fixture.expectedIntegrity} but computed ${actual}`,
    );
  }

  const digestInvalidCases = ctx.readJson("conformance/fixtures/digest-invalid-cases.json");
  assertSpecVersion(ctx, digestInvalidCases, "digest invalid cases");
  for (const digestCase of digestInvalidCases.cases) {
    if (digestCase.expected.failureCategory === "invalid-path") {
      assert(
        digestCase.normalizedFiles.some((file: JsonValue) => isInvalidNormalizedPath(file.path)),
        `digest invalid case ${digestCase.name} must contain an invalid path`,
      );
    }
    if (digestCase.expected.failureCategory === "duplicate-path") {
      const paths = digestCase.normalizedFiles.map((file: JsonValue) => file.path);
      assert(
        new Set(paths).size !== paths.length,
        `digest invalid case ${digestCase.name} must contain duplicate normalized paths`,
      );
    }
    if (digestCase.expected.failureCategory === "non-regular-file") {
      assert(
        digestCase.normalizedFiles.some(
          (file: JsonValue) => file.entryType && file.entryType !== "file",
        ),
        `digest invalid case ${digestCase.name} must contain a non-regular entry`,
      );
    }
    assert(
      digestCase.expected.valid === false,
      `digest invalid case ${digestCase.name} must be expected invalid`,
    );
  }

  const tarArchiveProfileCases = ctx.readJson(
    "conformance/fixtures/tar-archive-profile-cases.json",
  );
  assertSpecVersion(ctx, tarArchiveProfileCases, "tar archive profile cases");
  for (const archiveCase of tarArchiveProfileCases.cases) {
    assert(
      Array.isArray(archiveCase.archiveEntries),
      `tar archive case ${archiveCase.name} needs archive entries`,
    );
    if (archiveCase.expected.valid === false) {
      assert(
        typeof archiveCase.expected.failureCategory === "string",
        `tar archive case ${archiveCase.name} needs failure category`,
      );
    }
    if (archiveCase.expected.failureCategory === "invalid-archive-path") {
      assert(
        archiveCase.archiveEntries.some((entry: JsonValue) => isInvalidArchivePath(entry.path)),
        `tar archive case ${archiveCase.name} must contain an invalid archive path`,
      );
    }
    if (archiveCase.expected.failureCategory === "duplicate-archive-path") {
      const normalizedPaths = archiveCase.archiveEntries.map((entry: JsonValue) =>
        normalizeArchivePath(entry.path),
      );
      assert(
        new Set(normalizedPaths).size !== normalizedPaths.length,
        `tar archive case ${archiveCase.name} must contain duplicate normalized archive paths`,
      );
    }
    if (archiveCase.expected.failureCategory === "non-regular-archive-entry") {
      assert(
        archiveCase.archiveEntries.some((entry: JsonValue) => entry.entryType !== "file"),
        `tar archive case ${archiveCase.name} must contain a non-regular archive entry`,
      );
    }
  }

  const purlCanonicalizationCases = ctx.readJson(
    "conformance/fixtures/purl-canonicalization-cases.json",
  );
  assertSpecVersion(ctx, purlCanonicalizationCases, "purl canonicalization cases");
  for (const purlCase of purlCanonicalizationCases.cases) {
    const expected = purlCase.component
      ? canonicalComponentPurl(purlCase.volume, purlCase.version, purlCase.component)
      : canonicalReleasePurl(purlCase.volume, purlCase.version);
    assert(
      expected === purlCase.expectedPurl,
      `purl case ${purlCase.name} expectedPurl must be canonical`,
    );
    if (purlCase.expected.valid === false) {
      assert(
        purlCase.candidatePurl !== purlCase.expectedPurl,
        `purl case ${purlCase.name} must exercise a non-canonical candidate`,
      );
      assert(
        purlCase.expected.failureCategory === "non-canonical-purl",
        `purl case ${purlCase.name} must classify non-canonical purl failure`,
      );
    }
  }

  const upstreamBaselines = ctx.readJson("conformance/upstream-baselines.json");
  ctx.validate("upstreamBaseline", upstreamBaselines, "upstream PURL/VERS baselines");
  assertSpecVersion(ctx, upstreamBaselines, "upstream PURL/VERS baselines");
  const invalidUpstreamBaselines = ctx.readJson(
    "conformance/fixtures/upstream-baselines-invalid.json",
  );
  assertSpecVersion(ctx, invalidUpstreamBaselines, "invalid upstream PURL/VERS baseline cases");
  for (const invalidBaselineCase of invalidUpstreamBaselines.cases) {
    ctx.validateExpectedFailure(
      "upstreamBaseline",
      invalidBaselineCase.payload,
      `invalid upstream PURL/VERS baseline case ${invalidBaselineCase.name}`,
    );
    assert(
      invalidBaselineCase.expected.valid === false,
      `invalid upstream baseline case ${invalidBaselineCase.name} must fail`,
    );
  }
  assert(
    upstreamBaselines.baselines.some((baseline: JsonValue) => baseline.name === "package-url-spec"),
    "upstream baselines must include Package URL spec",
  );
  assert(
    upstreamBaselines.baselines.some((baseline: JsonValue) => baseline.name === "vers-spec"),
    "upstream baselines must include VERS spec",
  );
  for (const baseline of upstreamBaselines.baselines) {
    assert(
      gitCommitPattern.test(baseline.revision),
      `upstream baseline ${baseline.name} revision must be immutable`,
    );
  }
};
