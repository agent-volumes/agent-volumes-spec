# Code Style Guide

This document defines the code style standards for the `scripts/` directory in this repository, based on [Oxlint](https://oxc.rs/docs/guide/usage/linter) rules. It serves as a reference for contributors and maintainers.

## Active Rules

The following rules are active and lint findings should be resolved through code changes. Rules that protect type safety, module boundaries, and maintainable control flow are enforced as errors; rules that remain advisory are kept as warnings in `.oxlintrc.json`.

### `eslint/no-magic-numbers`

**What it does:** Flags numeric literals that appear without context, making code harder to understand.

**Why maintain:** Magic numbers obscure intent. Extracting domain-significant values into named constants improves readability and makes future changes safer.

**Incorrect:**

```typescript
const finalPrice = basePrice + basePrice * 0.25;
if (statusCode === 404) { ... }
```

**Correct:**

```typescript
const TAX_RATE = 0.25;
const HTTP_NOT_FOUND = 404;

const finalPrice = basePrice + basePrice * TAX_RATE;
if (statusCode === HTTP_NOT_FOUND) { ... }
```

**Configuration:** `["warn", { "ignoreArrayIndexes": true }]`

**Project style:** Prefer named constants for reusable or domain-significant values, including HTTP status codes, protocol versions, prefix lengths, CLI argument indexes, JSON indentation widths, and exit codes. Inline literals are acceptable when extracting a name would reduce clarity, such as direct cardinality checks (`length > 0`, `length === 0`) or parser/index arithmetic.

**Avoid broad ignores:** Do not add `ignore: [0, 1, -1]` as a blanket exception. In this repository, those values often carry domain meaning and should be reviewed case by case.

---

### `import/group-exports`

**What it does:** Requires all named exports to be consolidated into a single `export { ... }` declaration.

**Why maintain:** Grouping exports at the end of a file makes the module's public API immediately visible.

**Incorrect:**

```typescript
export const first = true;
export const second = true;
```

**Correct:**

```typescript
const first = true;
const second = true;

export { first, second };
```

---

### `import/no-namespace`

**What it does:** Disallows namespace imports such as `import * as phase from "./phase"`.

**Why maintain:** Namespace imports hide which exports a module actually uses. Explicit imports make dependencies easier to scan, simplify refactors, and avoid pulling an entire module namespace into local scope.

**Incorrect:**

```typescript
import * as advisoryPhase from "./validate-artifacts/phases/advisory.ts";

const phases = [advisoryPhase];

for (const phase of phases) {
  phase.run(ctx);
}
```

**Correct:**

```typescript
import { run as runAdvisoryPhase } from "./validate-artifacts/phases/advisory.ts";

const phases = [runAdvisoryPhase];

for (const phase of phases) {
  phase(ctx);
}
```

**Project style:** Import only the named bindings used by a script. When multiple phase modules export the same name, alias the import at the import site, such as `run as runOpenapiPhase`, instead of importing each phase as a namespace object.

---

### `import/no-cycle`

**What it does:** Detects dependency cycles where an imported module can resolve a path back to the importing module.

**Why maintain:** Cyclic dependencies make validator architecture harder to reason about and can surface as partially initialized or `undefined` imports at runtime. Keeping the dependency graph one-way also preserves the intended `scripts/validate-artifacts/` layering: entry points orchestrate phases, phases call assertion and core helpers, and shared helpers do not import back upward.

**Incorrect:**

```typescript
// scripts/validate-artifacts/core/schema-context.ts
import { readFixture } from "./files.ts";

function createSchemaContext(): void {
  readFixture();
}

export { createSchemaContext };

// scripts/validate-artifacts/core/files.ts
import { createSchemaContext } from "./schema-context.ts";

function readFixture(): void {
  createSchemaContext();
}

export { readFixture };
```

**Correct:**

```typescript
// scripts/validate-artifacts/core/files.ts
function readFixture(): void {
  /* ... */
}

export { readFixture };

// scripts/validate-artifacts/core/schema-context.ts
import { readFixture } from "./files.ts";

function createSchemaContext(): void {
  readFixture();
}

export { createSchemaContext };
```

**Configuration:** `["error", { "maxDepth": 3 }]`

**Project style:** Preserve acyclic imports across the validation script tree. If two modules need each other, extract the shared type, constant, or helper into a lower-level `core/` module rather than importing sideways or back upward. Type-only imports are ignored by Oxlint's default `ignoreTypes: true`, but prefer keeping runtime dependencies acyclic even when type boundaries are involved.

---

### `typescript/explicit-function-return-type`

**What it does:** Requires explicit return type annotations on functions.

**Why maintain:** Explicit return types improve readability and can speed up TypeScript type checking in large codebases.

**Incorrect:**

```typescript
function test() {
  return;
}

function label() {
  return "test";
}
```

**Correct:**

```typescript
function test(): void {
  return;
}

function label(): string {
  return "test";
}
```

---

### `typescript/explicit-module-boundary-types`

**What it does:** Requires explicit return and argument types on exported functions and public class methods.

**Why maintain:** Makes the module's public API contract explicit for consumers.

**Incorrect:**

```typescript
function test() {
  return;
}

function label() {
  return "test";
}

export { label, test };
```

**Correct:**

```typescript
function test(): void {
  return;
}

function label(): string {
  return "test";
}

export { label, test };
```

---

### `typescript/no-explicit-any`

**What it does:** Disallows explicit use of the `any` type.

**Why maintain:** `any` is TypeScript's escape hatch from the type system. It disables type checking for the annotated value and can hide real mismatches in parsed JSON, OpenAPI objects, and validator context wiring. TypeScript's `noImplicitAny` prevents inferred `any`, but it does not prevent explicit `any`; this rule closes that gap.

**Incorrect:**

```typescript
type JsonValue = any;

interface ValidationContext {
  ajv: any;
}
```

**Correct:**

```typescript
import type Ajv2020 from "ajv/dist/2020";

type JsonValue = ReturnType<typeof JSON.parse>;

interface ValidationContext {
  ajv: Ajv2020;
}
```

**Project style:** Do not use `any` for dynamic artifact data or third-party objects. For parsed JSON, derive the dynamic value type from the parser boundary, such as `ReturnType<typeof JSON.parse>`, and narrow later with guards like `isJsonObject`. For library instances, import the library's public type, such as `Ajv2020`, instead of treating the dependency as untyped. Use `unknown` only when the value is genuinely opaque and must be narrowed before use.

---

### `typescript/no-unnecessary-type-assertion`

**What it does:** Flags type assertions that do not change the expression's type.

**Why maintain:** Redundant assertions add noise and can hide uncertainty about the validator's parsed JSON types. When TypeScript already knows the type, remove the assertion instead of repeating it.

**Incorrect:**

```typescript
for (const [responseName, response] of Object.entries(openapi.components.responses) as [
  string,
  JsonObject,
][]) {
  assertProblemDetails(ctx, response.value, responseName);
}
```

**Correct:**

```typescript
for (const [responseName, response] of Object.entries(openapi.components.responses)) {
  assert(isJsonObject(response), `OpenAPI ${responseName} response must be an object`);
  assertProblemDetails(ctx, response.value, responseName);
}
```

**Project style:** Prefer removing tuple or object-entry assertions when the existing expression already carries the needed type. If the value comes from parsed JSON and the compiler cannot know its shape, add an object guard such as `isJsonObject` before property access rather than asserting the loop entry type.

**Note:** Oxlint's default configuration does not flag literal `as const` assertions for this rule. Keep `as const` when it intentionally preserves a literal type.

---

### `typescript/no-unsafe-type-assertion`

**What it does:** Flags type assertions that narrow an expression to a more specific type.

**Why maintain:** Narrowing assertions bypass TypeScript's checks and can turn malformed fixtures or OpenAPI data into runtime failures. Broadening a type is safer because it makes TypeScript know less; narrowing should happen through guards, existing helper contracts, or wider expressions.

**Incorrect:**

```typescript
const requestedDependencies = Object.values(
  dependencyCase["component-dependencies"],
).flat() as string[];

artifactErrorMessage = errorMessage(error as Error);

for (const [pathName, pathItem] of Object.entries(openapi.paths as JsonObject)) {
  for (const [method, operation] of Object.entries(pathItem as JsonObject)) {
    const operationObject = operation as JsonObject;
    validateOperation(operationObject, pathName, method);
  }
}
```

**Correct:**

```typescript
const requestedDependencies = Object.values(dependencyCase["component-dependencies"]).flat();

artifactErrorMessage = errorMessage(error);

assert(isJsonObject(openapi.paths), "OpenAPI paths must be an object");
for (const [pathName, pathItem] of Object.entries(openapi.paths)) {
  assert(isJsonObject(pathItem), `OpenAPI ${pathName} path item must be an object`);
  for (const [method, operation] of Object.entries(pathItem)) {
    assert(
      isJsonObject(operation),
      `OpenAPI ${pathName} ${method} must define an operation object`,
    );
    validateOperation(operation, pathName, method);
  }
}
```

**Project style:** For parsed JSON fixtures, OpenAPI objects, TOML-derived values, and caught errors, avoid `as` for narrowing. Use existing helpers such as `assert`, `isJsonObject`, and `errorMessage`, or keep values at their wider dynamic type when the following code already handles that shape. For keyed lookup tables, prefer a guard or `Object.entries(...).find(...)` over `key as keyof typeof table`.

---

### `import/exports-last`

**What it does:** Requires all export statements to appear at the end of the file.

**Why maintain:** Keeps the module's public API in one predictable location.

**Incorrect:**

```typescript
export const foo = 1;
const bar = 2;
export const baz = 3;
```

**Correct:**

```typescript
const foo = 1;
const bar = 2;
const baz = 3;

export { foo, baz };
```

---

### `eslint/no-use-before-define`

**What it does:** Flags variables and functions used before their declaration.

**Why maintain:** Prevents temporal dead zone issues with `const`/`let` and improves top-to-bottom readability.

**Incorrect:**

```typescript
console.log(foo);
const foo = 1;
```

**Correct:**

```typescript
const foo = 1;
console.log(foo);
```

---

### `eslint/no-implicit-coercion`

**What it does:** Flags shorthand type conversions that use operators such as `!!value`, `+value`, or `"" + value` instead of explicit conversion functions.

**Why maintain:** Explicit conversions make validator intent easier to read. In parsed fixture and regex-match code, `Boolean(...)`, `Number(...)`, and `String(...)` state the expected target type directly, while shorthand operators can look like incidental punctuation.

**Incorrect:**

```typescript
const match = componentPurl.match(componentPurlPattern);

return {
  hasVersion: !!(match && match[3]),
};
```

**Correct:**

```typescript
const match = componentPurl.match(componentPurlPattern);

return {
  hasVersion: Boolean(match && match[3]),
};
```

**Project style:** Use `Boolean(value)` for boolean conversion, `Number(value)` for numeric conversion, and `String(value)` for string conversion. Prefer direct comparisons such as `items.length > 0` when that reads more clearly than converting a value just to test truthiness.

---

### `eslint/no-continue`

**What it does:** Disallows `continue` statements.

**Why maintain:** `continue` can make loop control flow harder to follow. Prefer refactoring into early returns or filtering before the loop.

**Incorrect:**

```typescript
for (const item of items) {
  if (item.skip) {
    continue;
  }
  process(item);
}
```

**Correct:**

```typescript
for (const item of items) {
  if (!item.skip) {
    process(item);
  }
}
```

---

### `eslint/max-statements`

**What it does:** Limits the number of statements in a function (default: 10).

**Why maintain:** Encourages function decomposition and single-responsibility functions.

**Incorrect:**

```typescript
function processData(data: unknown) {
  // 15+ statements doing validation, transformation,
  // filtering, mapping, and formatting all at once
}
```

**Correct:**

```typescript
function validateData(data: unknown): void {
  /* ... */
}
function transformData(data: unknown): void {
  /* ... */
}
function filterData(data: unknown): void {
  /* ... */
}

function processData(data: unknown): void {
  validateData(data);
  transformData(data);
  filterData(data);
}
```

---

### `unicorn/prefer-ternary`

**What it does:** Prefers ternary expressions over simple `if/else` statements when both branches are single-line.

**Why maintain:** Simple `if/else` branches for the same operation are often shorter and clearer when expressed as a ternary. The `only-single-line` option restricts this to cases where the condition and both branches fit on a single line, preventing unreadable nested or multi-line ternaries.

**Configuration:** `["warn", "only-single-line"]`

**Incorrect:**

```typescript
if (test) {
  return a;
} else {
  return b;
}
```

**Correct:**

```typescript
return test ? a : b;
```

**Note:** This rule conflicts with `eslint/no-ternary`, which unconditionally disallows all ternary expressions. We disable `no-ternary` in favor of `prefer-ternary` with the `only-single-line` option to allow concise single-line ternaries while keeping multi-line ternaries disallowed.

---

### `import/first`

**What it does:** Requires all import statements to appear before other code.

**Why maintain:** Ensures dependencies are loaded before module execution.

**Incorrect:**

```typescript
const config = loadConfig();
import { helper } from "./helper";
```

**Correct:**

```typescript
import { helper } from "./helper";

const config = loadConfig();
```

---

### `unicorn/no-null` + `eslint/no-undefined`

**What they do:** `unicorn/no-null` flags `null` values, while `eslint/no-undefined` flags direct use of the `undefined` identifier.

**Why maintain:** Supporting both `null` and `undefined` as validator-internal sentinels makes parsed artifact handling harder to reason about. Oxlint's `unicorn/no-null` guidance highlights that teams often use `null` and `undefined` inconsistently, that supporting both values complicates input validation, and that `null` makes TypeScript shapes more verbose, such as `foo?: string | null` instead of `foo?: string`. Separately, `undefined` can be reassigned in non-strict mode. Use `void 0` for explicit undefined comparisons, and avoid adding new `null` values except when an external JSON contract requires them.

At the same time, replacing `null` with a bare `undefined` would just trade one warning for another. Use omission, explicit predicates, or a domain-specific sentinel instead.

**Incorrect:**

```typescript
function routeIdentityFromPath(route: JsonValue): JsonValue {
  const match = route.match(routePattern);
  if (!match) {
    return null;
  }
  return parseRouteMatch(match);
}

if (value === undefined) { ... }
```

**Correct:**

```typescript
function routeIdentityFromPath(route: JsonValue): JsonValue {
  const match = route.match(routePattern);
  if (!match) {
    return false;
  }
  return parseRouteMatch(match);
}

if (value === void 0) { ... }
```

**Configuration:** `unicorn/no-null` is pinned to `checkStrictEquality: false` so validator code can keep explicit `=== null` checks at JSON contract boundaries.

**Project style:** Do not use `null` as an internal sentinel, and do not replace it with bare `undefined`. Prefer omitting optional properties, using `void 0` for explicit undefined comparisons, or returning a typed domain sentinel such as `false` when callers only need a falsy “no match” result. Keep `null` values and `null` comparisons only when validating external JSON contracts that explicitly require `null`, such as problem-detail fixtures for empty response payloads.

---

### `eslint/func-style`

**What it does:** Enforces function declarations for named function bindings while allowing arrow functions for inline callbacks and small function values.

**Why maintain:** The TypeScript under `scripts/` is repository-maintenance tooling: validators, assertion helpers, build helpers, and phase runners. Top-level and exported functions usually represent named procedures rather than function values, so declarations make the module's operations easier to scan and let orchestration appear before lower-level helper details.

Arrow functions remain appropriate for short callbacks passed directly to collection APIs such as `.map`, `.filter`, `.some`, `.every`, and `.toSorted`. In those cases the callback is part of the surrounding expression, and naming it separately would often obscure the predicate or mapper being applied.

**Configuration:** `["error", "declaration", { "allowArrowFunctions": true }]`

**Incorrect:**

```typescript
const assertReleaseMetadata = (metadata: JsonValue): void => {
  /* ... */
};
```

**Correct:**

```typescript
function assertReleaseMetadata(metadata: JsonValue): void {
  /* ... */
}

const releaseNames = releases.map((release: JsonValue) => release.name);
```

**Project style:** Use function declarations for module-level helpers, exported validators, assertion functions, build steps, and phase runners. Keep arrow functions for concise inline callbacks. If a local callback grows, is reused, or names a domain rule, promote it to a function declaration.

---

### `eslint/complexity`

**What it does:** Limits cyclomatic complexity (default: 20).

**Why maintain:** High complexity indicates a function does too much. Extract helpers.

**Incorrect:**

```typescript
function processOrder(order: unknown) {
  if (order.status === "pending") {
    if (order.items.length > 0) {
      for (const item of order.items) {
        if (item.inStock) {
          if (item.price > 100) {
            // deeply nested logic
          }
        }
      }
    }
  }
}
```

**Correct:**

```typescript
const HIGH_VALUE_PRICE_THRESHOLD = 100;

function isHighValueItem(item: OrderItem): boolean {
  return item.price > HIGH_VALUE_PRICE_THRESHOLD;
}

function processInStockItem(item: OrderItem): void {
  if (isHighValueItem(item)) {
    // handle high-value item
  }
}

function processOrder(order: Order): void {
  if (order.status !== "pending") return;
  if (order.items.length === 0) return;

  for (const item of order.items) {
    if (item.inStock) {
      processInStockItem(item);
    }
  }
}
```

---

### `eslint/max-params`

**What it does:** Limits the number of function parameters (default: 3).

**Why maintain:** Too many parameters hurt readability. Prefer destructuring or options objects.

**Incorrect:**

```typescript
const fn = (a, b, c, d, e) => { ... };
```

**Correct:**

```typescript
interface Options {
  a: string;
  b: string;
  c: string;
  d: string;
  e: string;
}

function fn(options: Options): void {
  /* ... */
}
```

---

### `eslint/no-underscore-dangle`

**What it does:** Flags identifiers with leading or trailing underscores, a pattern historically used to mimic private members in JavaScript.

**Why maintain:** Private-like names obscure intent now that JavaScript supports formal private class fields. The rule remains active so new internal identifiers such as `_internal` or `value_` are treated as style issues.

**Configuration:** `["warn", { "allow": ["_type"] }]`

**Project exception:** `_type` is allowed because in-toto and SLSA JSON statements use `_type` as a standardized artifact field. Do not generalize this exception to other underscore-prefixed names; prefer the external field name only when validating or mapping those artifacts.

---

## Disabled Rules

The following rules are intentionally disabled in `.oxlintrc.json` because they conflict with this project's architecture or runtime environment.

### `import/no-named-export` + `import/prefer-default-export`

**Why disabled:** This project uses an intentional **named export architecture**.

- **10 phase modules** export `run(ctx: ValidationContext): void` functions
- **0 default exports** exist in the entire `scripts/validate-artifacts/` tree
- The entry point imports phase runners as named aliases, such as `import { run as runOpenapiPhase } from "..."`

Converting to default exports would:

1. Hide the shared `run` phase-runner contract behind file-local default names
2. Create anonymous functions in stack traces
3. Make assertions modules (which export multiple helpers) unnecessarily verbose

**Project style:** Use named exports exclusively. Group module-level helper exports at the end of the file per `import/group-exports`; exported phase runners and assertion functions can remain declarations so their public procedure names are visible at definition time.

---

### `import/no-relative-parent-imports`

**Why disabled:** The module structure requires sibling-directory imports.

```text
scripts/validate-artifacts/
├── core/           # Shared utilities
├── phases/         # Validation phases (import from ../core/)
├── assertions/     # Helper assertions (import from ../core/)
```

Both `phases/` and `assertions/` depend on `core/`, necessitating `../core/` imports. Alternative solutions (path aliases, flat structure) would introduce more complexity than benefit for this self-contained script tree.

**Project style:** Relative parent imports (`../core/`, `../phases/`) are acceptable and expected.

---

### `oxc/no-optional-chaining`

**Why disabled:** This rule targets pre-2020 browser compatibility concerns. This project runs on Node.js/Bun where optional chaining is fully supported. Additionally, optional chaining is idiomatic for safely accessing properties on parsed JSON fixture objects.

**Project style:** Optional chaining (`?.`) is permitted and encouraged where it improves readability.

---

### `import/no-nodejs-modules`

**Why disabled:** These are Node.js CLI scripts. Built-in modules (`node:crypto`, `node:fs`, `node:path`) are required for file system operations, hashing, and path resolution.

**Project style:** Use `node:` prefixed imports for built-in modules.

---

### `oxc/no-async-await`

**Why disabled:** Build scripts (e.g., `build-site-openapi.ts`) use async I/O for file operations. Async/await is the standard pattern for asynchronous code in modern JavaScript.

**Project style:** Async/await is permitted where asynchronous operations are needed.

---

### `eslint/no-console`

**Why disabled:** CLI scripts legitimately use `console.log` for user-facing output and progress reporting.

**Project style:** Console output is acceptable in scripts. Use `console.error` for errors.

---

### `oxc/no-rest-spread-properties`

**Why disabled:** Object spread is a standard, well-supported JavaScript feature with no compatibility concerns in this project's runtime environment.

**Project style:** Object and array spread syntax is permitted.

---

### `eslint/no-ternary`

**Why disabled:** This rule unconditionally disallows all ternary expressions, which conflicts with `unicorn/prefer-ternary`.

- `eslint/no-ternary` forbids `const x = condition ? a : b;`
- `unicorn/prefer-ternary` (with `only-single-line` option) encourages single-line ternaries like `return condition ? a : b;`

These two rules are mutually exclusive. We keep `prefer-ternary` with the `only-single-line` option because:

1. Single-line ternaries are concise and idiomatic for simple conditional assignments and returns
2. The `only-single-line` option prevents unreadable nested or multi-line ternaries
3. `if/else` remains available for complex conditional logic

**Project style:** Use ternary expressions only when the condition and both branches fit on a single line. Use `if/else` for multi-line conditional logic.

---

### `eslint/sort-imports`

**Why disabled:** Import ordering is owned by Oxfmt via `.oxfmtrc.json` with `sortImports: true`.

Oxlint's `eslint/sort-imports` rule and Oxfmt's import sorter can disagree on declaration ordering. Keeping both active causes formatter/linter churn where `bun run format:oxfmt` rewrites imports into the formatter's order and `bun run lint:oxlint` reports the same block again.

**Project style:** Do not hand-sort imports to satisfy Oxlint. Run `bun run format:oxfmt` or `bun run format` and let Oxfmt produce the canonical order.

---

## Rule Reference

For the complete list of Oxlint rules and their documentation, see:
<https://oxc.rs/docs/guide/usage/linter/rules>
