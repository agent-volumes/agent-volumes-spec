import { assert } from "../core/assert.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

function validateTrustFixtures(ctx: ValidationContext): void {
  ctx.validate(
    "trustSummary",
    ctx.readJson("conformance/fixtures/trust-summary.json"),
    "trust summary fixture",
  );
  ctx.validate(
    "trustSummary",
    ctx.readJson("conformance/fixtures/trust-summary-empty.json"),
    "empty trust summary fixture",
  );
  ctx.validate(
    "trustDetail",
    ctx.readJson("conformance/fixtures/trust-detail.json"),
    "trust detail fixture",
  );
  ctx.validate(
    "trustDetail",
    ctx.readJson("conformance/fixtures/trust-detail-empty.json"),
    "empty trust detail fixture",
  );
  ctx.validate(
    "trustDetail",
    ctx.readJson("conformance/fixtures/trust-detail-status-variants.json"),
    "trust detail status variants fixture",
  );
}

function assertTrustStatusVariants(ctx: ValidationContext): void {
  const trustDetailStatusVariants = ctx.readJson(
    "conformance/fixtures/trust-detail-status-variants.json",
  );
  const trustStates = new Set(
    trustDetailStatusVariants.attachments.map((attachment: JsonValue) => attachment.status.state),
  );
  for (const requiredState of ["revoked", "superseded", "invalid"]) {
    assert(
      trustStates.has(requiredState),
      `trust detail status variants fixture must include ${requiredState}`,
    );
  }
}

function assertTrustDetailFormats(ctx: ValidationContext): void {
  const trustDetailFixture = ctx.readJson("conformance/fixtures/trust-detail.json");
  const trustFormatFamilies = new Set(
    trustDetailFixture.attachments.map((attachment: JsonValue) => attachment.format.family),
  );
  for (const requiredFamily of ["cyclonedx", "slsa-provenance", "sigstore-bundle"]) {
    assert(
      trustFormatFamilies.has(requiredFamily),
      `trust detail fixture must include ${requiredFamily} format family`,
    );
  }
  assert(
    trustDetailFixture.attachments.some((attachment: JsonValue) => attachment.format.profile),
    "trust detail fixture must exercise format.profile",
  );
}

function assertAttachmentSubjectBinding(trustDetail: JsonValue, label: string): void {
  for (const attachment of trustDetail.attachments) {
    if (attachment.verification?.subjectDigest && attachment.status.state !== "invalid") {
      assert(
        attachment.verification.subjectDigest === trustDetail.subject.integrity,
        `${label} attachment ${attachment.id} verification subjectDigest must bind the release subject`,
      );
    }
  }
}

function assertInvalidSubjectBindingCoverage(trustDetail: JsonValue, label: string): void {
  assert(
    trustDetail.attachments.some(
      (attachment: JsonValue) =>
        attachment.status.state === "invalid" &&
        attachment.verification?.subjectDigest &&
        attachment.verification.subjectDigest !== trustDetail.subject.integrity,
    ),
    `${label} must include invalid attachment subject-binding mismatch coverage`,
  );
}

function assertTrustDetailSubjectBindings(ctx: ValidationContext): void {
  const trustDetailFixture = ctx.readJson("conformance/fixtures/trust-detail.json");
  const trustDetailStatusVariants = ctx.readJson(
    "conformance/fixtures/trust-detail-status-variants.json",
  );
  assertAttachmentSubjectBinding(trustDetailFixture, "trust detail fixture");
  assertAttachmentSubjectBinding(trustDetailStatusVariants, "trust detail status variants fixture");
  assertInvalidSubjectBindingCoverage(
    trustDetailStatusVariants,
    "trust detail status variants fixture",
  );
}

function run(ctx: ValidationContext): void {
  validateTrustFixtures(ctx);
  assertTrustStatusVariants(ctx);
  assertTrustDetailFormats(ctx);
  assertTrustDetailSubjectBindings(ctx);
}

export { run };
