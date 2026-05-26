export type JsonValue = any;
export type JsonObject = Record<string, JsonValue>;

export interface ValidationContext {
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
  ajv: any;
}
