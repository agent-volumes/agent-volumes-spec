import { assert } from "../core/assert.ts";
import type { JsonValue } from "../core/types.ts";

export const assertCycloneDxArtifact = (artifactJson: JsonValue, trustCase: JsonValue) => {
  const component = artifactJson.metadata?.component;
  assert(
    artifactJson.bomFormat === "CycloneDX",
    `trust artifact case ${trustCase.name} BOM must declare CycloneDX`,
  );
  assert(
    artifactJson.specVersion === trustCase.format.version,
    `trust artifact case ${trustCase.name} BOM specVersion must match format.version`,
  );
  assert(
    artifactJson.serialNumber?.startsWith("urn:uuid:"),
    `trust artifact case ${trustCase.name} BOM must declare a deterministic CycloneDX serialNumber`,
  );
  assert(
    artifactJson.version === 1,
    `trust artifact case ${trustCase.name} BOM must declare document version 1`,
  );
  assert(
    component?.type,
    `trust artifact case ${trustCase.name} BOM metadata component needs a type`,
  );
  assert(
    component?.purl === trustCase.subject.purl,
    `trust artifact case ${trustCase.name} BOM purl must bind subject`,
  );
  assert(
    component?.hashes?.some(
      (hash: JsonValue) =>
        hash.alg === "SHA-256" && `sha256:${hash.content}` === trustCase.subject.integrity,
    ),
    `trust artifact case ${trustCase.name} BOM hashes must bind immutable identity`,
  );
};

export const assertSlsaArtifact = (artifactJson: JsonValue, trustCase: JsonValue) => {
  assert(
    artifactJson.payloadType === "application/vnd.in-toto+json",
    `trust artifact case ${trustCase.name} SLSA envelope must declare in-toto payloadType`,
  );
  assert(
    Array.isArray(artifactJson.signatures) && artifactJson.signatures.length > 0,
    `trust artifact case ${trustCase.name} SLSA envelope needs deterministic signature material`,
  );
  for (const signature of artifactJson.signatures) {
    assert(
      signature.sig,
      `trust artifact case ${trustCase.name} SLSA envelope signature bytes are required`,
    );
  }
  const statement = JSON.parse(Buffer.from(artifactJson.payload, "base64").toString("utf8"));
  assert(
    statement._type === "https://in-toto.io/Statement/v1",
    `trust artifact case ${trustCase.name} needs in-toto Statement v1`,
  );
  assert(
    statement.predicateType === "https://slsa.dev/provenance/v1",
    `trust artifact case ${trustCase.name} needs SLSA v1 predicateType`,
  );
  assert(
    Array.isArray(statement.subject) && statement.subject.length > 0,
    `trust artifact case ${trustCase.name} SLSA statement needs at least one subject`,
  );
  assert(
    statement.subject?.some(
      (subject: JsonValue) =>
        subject.name === trustCase.subject.purl &&
        subject.digest?.sha256 === trustCase.subject.integrity.slice(7),
    ),
    `trust artifact case ${trustCase.name} SLSA subject must bind release subject`,
  );
  assert(
    statement.predicate?.buildDefinition?.buildType,
    `trust artifact case ${trustCase.name} needs SLSA buildType`,
  );
  assert(
    statement.predicate?.runDetails?.builder?.id,
    `trust artifact case ${trustCase.name} needs SLSA builder id`,
  );
};

export const assertSigstoreArtifact = (artifactJson: JsonValue, trustCase: JsonValue) => {
  assert(
    artifactJson.media_type === "application/vnd.dev.sigstore.bundle.v0.3+json",
    `trust artifact case ${trustCase.name} Sigstore bundle must declare v0.3 media_type`,
  );
  assert(
    artifactJson.verification_material,
    `trust artifact case ${trustCase.name} Sigstore bundle needs verification material`,
  );
  assert(
    artifactJson.verification_material.public_key ||
      artifactJson.verification_material.x509_certificate_chain,
    `trust artifact case ${trustCase.name} Sigstore bundle needs public key or certificate material`,
  );
  assert(
    Array.isArray(artifactJson.verification_material.tlog_entries) &&
      artifactJson.verification_material.tlog_entries.length > 0,
    `trust artifact case ${trustCase.name} Sigstore bundle needs bundled transparency evidence`,
  );
  const hasMessageSignature = Boolean(artifactJson.message_signature);
  const hasDsseEnvelope = Boolean(artifactJson.dsse_envelope);
  assert(
    hasMessageSignature !== hasDsseEnvelope,
    `trust artifact case ${trustCase.name} Sigstore bundle must use exactly one content form`,
  );
  if (hasMessageSignature) {
    assert(
      artifactJson.message_signature.message_digest?.digest ===
        trustCase.subject.integrity.slice(7),
      `trust artifact case ${trustCase.name} Sigstore message digest must bind release subject`,
    );
    assert(
      artifactJson.message_signature.signature,
      `trust artifact case ${trustCase.name} Sigstore signature is required`,
    );
  }
  if (hasDsseEnvelope) {
    assert(
      artifactJson.dsse_envelope.signatures?.length > 0,
      `trust artifact case ${trustCase.name} DSSE signatures are required`,
    );
  }
};
