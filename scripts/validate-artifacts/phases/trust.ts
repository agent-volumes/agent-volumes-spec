import { assert } from "../core/assert.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

export function run(ctx: ValidationContext): void {
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
