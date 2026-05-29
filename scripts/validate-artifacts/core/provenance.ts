import { assert } from "./assert.ts";
import { EMPTY_COUNT } from "./numeric-constants.ts";

interface AssertionSource {
  anchor: string;
  artifact: string;
  reason: string;
}

function assertRepresentativeAssertionSources(
  assertionId: string,
  sources: AssertionSource[],
): void {
  assert(sources.length > EMPTY_COUNT, `${assertionId} must declare at least one durable source`);
  for (const source of sources) {
    assert(source.artifact.length > EMPTY_COUNT, `${assertionId} source must name an artifact`);
    assert(source.anchor.length > EMPTY_COUNT, `${assertionId} source must name an anchor`);
    assert(
      source.reason.length > EMPTY_COUNT,
      `${assertionId} source must explain the assertion basis`,
    );
  }
}

export { assertRepresentativeAssertionSources };
export type { AssertionSource };
