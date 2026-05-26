import type Ajv2020 from "ajv/dist/2020";

type JsonValue = ReturnType<typeof JSON.parse>;
type JsonObject = Record<string, JsonValue>;

interface ValidationContext {
  root: string;
  readJson: (relativePath: string) => JsonValue;
  readJsonFile: (relativePath: string) => JsonValue;
  readText: (relativePath: string) => string;
  pathExists: (relativePath: string) => boolean;
  isDirectory: (relativePath: string) => boolean;
  readJsonPaths: Set<string>;
  schemas: Record<string, JsonValue>;
  reservedExtensionNamespaces: JsonValue;
  validate: (name: string, value: JsonValue, label: string) => void;
  validateExpectedFailure: (name: string, value: JsonValue, label: string) => void;
  ajv: Ajv2020;
}

export { type JsonObject, type JsonValue, type ValidationContext };
