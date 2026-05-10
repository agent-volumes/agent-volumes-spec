#!/usr/bin/env python3
"""
Spec Readiness Validator

Analyzes a specification directory and checks for implementer-ready criteria.

Usage:
    validate_spec.py <path-to-spec-directory> [--output json|markdown]

Example:
    validate_spec.py ./my-spec --output markdown
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional


class SpecValidator:
    """Validates specification readiness criteria."""

    def __init__(self, spec_path: str):
        self.spec_path = Path(spec_path).resolve()
        self.findings = []
        self.warnings = []
        self.errors = []

    def _find_spec_files(self) -> List[Path]:
        """Find specification markdown files."""
        spec_files = []
        for pattern in ["*.md", "**/*.md"]:
            spec_files.extend(self.spec_path.glob(pattern))
        return [f for f in spec_files if "README" in f.name or "SPEC" in f.name or "spec" in f.name]

    def _find_schema_files(self) -> List[Path]:
        """Find machine-readable schema files."""
        schemas = []
        for pattern in ["schemas/**/*", "**/*.json", "**/*.yaml", "**/*.yml", "**/*.ts"]:
            schemas.extend(self.spec_path.glob(pattern))
        return [s for s in schemas if "schema" in s.name.lower() or "openapi" in s.name.lower()]

    def _find_test_files(self) -> List[Path]:
        """Find conformance test files."""
        tests = []
        for pattern in ["conformance/**/*", "tests/**/*", "**/*test*", "**/*spec*"]:
            tests.extend(self.spec_path.glob(pattern))
        return tests

    def check_normative_language(self) -> Dict:
        """Check for BCP 14 terms and testable requirements."""
        spec_files = self._find_spec_files()
        if not spec_files:
            return {"status": "FAIL", "message": "No spec files found"}

        bcp14_terms = ["MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
                       "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", "OPTIONAL"]

        total_terms = 0
        files_with_terms = 0

        for spec_file in spec_files:
            content = spec_file.read_text()
            file_terms = 0
            for term in bcp14_terms:
                file_terms += len(re.findall(rf'\b{term}\b', content))

            if file_terms > 0:
                files_with_terms += 1
                total_terms += file_terms

        if total_terms == 0:
            return {
                "status": "FAIL",
                "message": "No BCP 14 normative terms found (MUST, SHOULD, MAY, etc.)"
            }

        lowercase_issues = []
        for spec_file in spec_files:
            rel_parts = spec_file.relative_to(self.spec_path).parts
            # Skip non-normative directories
            if any(p in rel_parts for p in ("decisions", ".agents", "node_modules")):
                continue
            content = spec_file.read_text()
            for term in ["must", "should", "may"]:
                if re.search(rf'\b{term}\b', content):
                    lowercase_issues.append(
                        f"{'/'.join(rel_parts)}: lowercase '{term}' found"
                    )

        result = {
            "status": "PASS",
            "message": f"Found {total_terms} BCP 14 terms across {files_with_terms} files",
            "details": {
                "total_terms": total_terms,
                "files_with_terms": files_with_terms,
                "lowercase_warnings": lowercase_issues[:5]
            }
        }

        if lowercase_issues:
            result["status"] = "WARN"
            result["message"] += f" ({len(lowercase_issues)} lowercase warnings)"

        return result

    def check_machine_readable_schema(self) -> Dict:
        """Check for machine-readable schema artifacts."""
        schema_files = self._find_schema_files()

        if not schema_files:
            return {
                "status": "FAIL",
                "message": "No machine-readable schema files found (JSON Schema, OpenAPI, TypeScript, etc.)"
            }

        schema_dir = self.spec_path / "schemas"
        has_schema_dir = schema_dir.exists() and schema_dir.is_dir()

        openapi_files = [s for s in schema_files if "openapi" in s.name.lower()]
        json_schema_files = [s for s in schema_files if s.suffix == ".json"]

        return {
            "status": "PASS",
            "message": f"Found {len(schema_files)} schema files",
            "details": {
                "total_schemas": len(schema_files),
                "has_schema_directory": has_schema_dir,
                "openapi_files": len(openapi_files),
                "json_schema_files": len(json_schema_files),
                "schema_files": [str(s.relative_to(self.spec_path)) for s in schema_files[:10]]
            }
        }

    def check_versioning(self) -> Dict:
        """Check for explicit versioning policy."""
        spec_files = self._find_spec_files()

        version_patterns = [
            r'version.*policy',
            r'backward.*compat',
            r'breaking.*change',
            r'version.*negotiat',
            r'SemVer',
            r'semantic.*version'
        ]

        found_patterns = []
        for spec_file in spec_files:
            content = spec_file.read_text().lower()
            for pattern in version_patterns:
                if re.search(pattern, content):
                    found_patterns.append(pattern)

        if len(found_patterns) < 2:
            return {
                "status": "FAIL",
                "message": "No explicit versioning/compatibility policy found",
                "details": {"found_patterns": found_patterns}
            }

        return {
            "status": "PASS",
            "message": f"Found {len(found_patterns)} versioning-related patterns",
            "details": {"found_patterns": found_patterns}
        }

    def check_error_semantics(self) -> Dict:
        """Check for closed error semantics."""
        spec_files = self._find_spec_files()

        error_patterns = [
            r'error.*code',
            r'error.*enum',
            r'json.*error',
            r'error.*envelope',
            r'error.*response',
            r'finite.*error'
        ]

        found_patterns = []
        for spec_file in spec_files:
            content = spec_file.read_text().lower()
            for pattern in error_patterns:
                if re.search(pattern, content):
                    found_patterns.append(pattern)

        if len(found_patterns) < 2:
            return {
                "status": "FAIL",
                "message": "No explicit error semantics found",
                "details": {"found_patterns": found_patterns}
            }

        return {
            "status": "PASS",
            "message": f"Found {len(found_patterns)} error-related patterns",
            "details": {"found_patterns": found_patterns}
        }

    def check_security_model(self) -> Dict:
        """Check for security and trust model."""
        spec_files = self._find_spec_files()

        security_patterns = [
            r'trust.*model',
            r'trust.*assumption',
            r'least.*privilege',
            r'security.*policy',
            r'threat.*model',
            r'install.*risk',
            r'security.*scheme',
            r'authentication',
            r'authorization'
        ]

        found_patterns = []
        for spec_file in spec_files:
            content = spec_file.read_text().lower()
            for pattern in security_patterns:
                if re.search(pattern, content):
                    found_patterns.append(pattern)

        if len(found_patterns) < 2:
            return {
                "status": "FAIL",
                "message": "No explicit security/trust model found",
                "details": {"found_patterns": found_patterns}
            }

        return {
            "status": "PASS",
            "message": f"Found {len(found_patterns)} security-related patterns",
            "details": {"found_patterns": found_patterns}
        }

    def check_registry_behavior(self) -> Dict:
        """Check for registry/catalog behavior definition."""
        spec_files = self._find_spec_files()

        registry_patterns = [
            r'pagination',
            r'listing',
            r'referrer',
            r'reserved.*namespace',
            r'catalog',
            r'registry'
        ]

        found_patterns = []
        for spec_file in spec_files:
            content = spec_file.read_text().lower()
            for pattern in registry_patterns:
                if re.search(pattern, content):
                    found_patterns.append(pattern)

        if len(found_patterns) < 2:
            return {
                "status": "FAIL",
                "message": "No explicit registry behavior found",
                "details": {"found_patterns": found_patterns}
            }

        return {
            "status": "PASS",
            "message": f"Found {len(found_patterns)} registry-related patterns",
            "details": {"found_patterns": found_patterns}
        }

    def check_conformance_suite(self) -> Dict:
        """Check for conformance tests."""
        test_files = self._find_test_files()

        if not test_files:
            return {
                "status": "FAIL",
                "message": "No conformance test files found"
            }

        conformance_dir = self.spec_path / "conformance"
        has_conformance_dir = conformance_dir.exists()

        test_extensions = {}
        for test_file in test_files:
            ext = test_file.suffix
            test_extensions[ext] = test_extensions.get(ext, 0) + 1

        return {
            "status": "PASS",
            "message": f"Found {len(test_files)} test files",
            "details": {
                "total_tests": len(test_files),
                "has_conformance_directory": has_conformance_dir,
                "test_extensions": test_extensions,
                "test_files": [str(t.relative_to(self.spec_path)) for t in test_files[:10]]
            }
        }

    def check_schema_conformance_alignment(self) -> Dict:
        """Check for schema and conformance alignment."""
        schema_files = self._find_schema_files()
        test_files = self._find_test_files()

        if not schema_files or not test_files:
            return {
                "status": "FAIL",
                "message": "Cannot check alignment without both schemas and tests"
            }

        schema_names = [s.stem for s in schema_files]
        test_references = []

        for test_file in test_files:
            if test_file.suffix in [".md", ".txt", ".json"]:
                try:
                    content = test_file.read_text()
                    for schema_name in schema_names:
                        if schema_name in content:
                            test_references.append(f"{test_file.name} -> {schema_name}")
                except:
                    pass

        return {
            "status": "PASS",
            "message": f"Found {len(schema_files)} schemas and {len(test_files)} tests",
            "details": {
                "schema_test_references": test_references[:10],
                "alignment_score": min(len(test_references) / max(len(schema_files), 1), 1.0)
            }
        }

    def validate(self) -> Dict:
        """Run all validation checks."""
        if not self.spec_path.exists():
            return {
                "status": "ERROR",
                "message": f"Path does not exist: {self.spec_path}"
            }

        checks = {
            "normative_language": self.check_normative_language(),
            "machine_readable_schema": self.check_machine_readable_schema(),
            "versioning": self.check_versioning(),
            "error_semantics": self.check_error_semantics(),
            "security_model": self.check_security_model(),
            "registry_behavior": self.check_registry_behavior(),
            "conformance_suite": self.check_conformance_suite(),
            "schema_conformance_alignment": self.check_schema_conformance_alignment()
        }

        statuses = [c["status"] for c in checks.values()]
        if "FAIL" in statuses or "ERROR" in statuses:
            overall = "NOT READY"
        elif "WARN" in statuses:
            overall = "PARTIAL"
        else:
            overall = "READY"

        return {
            "spec_path": str(self.spec_path),
            "overall_status": overall,
            "checks": checks,
            "summary": {
                "pass": statuses.count("PASS"),
                "warn": statuses.count("WARN"),
                "fail": statuses.count("FAIL"),
                "error": statuses.count("ERROR")
            }
        }


def output_json(results: Dict):
    """Output results as JSON."""
    print(json.dumps(results, indent=2))


def output_markdown(results: Dict):
    """Output results as Markdown report."""
    print(f"## Spec Readiness Assessment")
    print()
    print(f"**Path**: `{results['spec_path']}`")
    print(f"**Status**: {results['overall_status']}")
    print()

    print("### Automated Checks")
    print()
    print("| Criterion | Status | Details |")
    print("|-----------|--------|---------|")

    check_names = {
        "normative_language": "Normative Language",
        "machine_readable_schema": "Machine-Readable Schema",
        "versioning": "Versioning Policy",
        "error_semantics": "Error Semantics",
        "security_model": "Security Model",
        "registry_behavior": "Registry Behavior",
        "conformance_suite": "Conformance Suite",
        "schema_conformance_alignment": "Schema-Conformance Alignment"
    }

    for key, check in results["checks"].items():
        status_icon = "✅" if check["status"] == "PASS" else "⚠️" if check["status"] == "WARN" else "❌"
        print(f"| {check_names.get(key, key)} | {status_icon} {check['status']} | {check['message']} |")

    print()
    print("### Summary")
    print(f"- ✅ Pass: {results['summary']['pass']}")
    print(f"- ⚠️ Warn: {results['summary']['warn']}")
    print(f"- ❌ Fail: {results['summary']['fail']}")
    print(f"- 💥 Error: {results['summary']['error']}")
    print()

    if results['overall_status'] != "READY":
        print("### Required Actions")
        print("Address all FAIL items before the spec is implementer-ready.")
        print()
        for key, check in results["checks"].items():
            if check["status"] in ["FAIL", "ERROR"]:
                print(f"- **{check_names.get(key, key)}**: {check['message']}")


def main():
    parser = argparse.ArgumentParser(
        description="Validate specification implementer-readiness"
    )
    parser.add_argument("path", help="Path to specification directory")
    parser.add_argument(
        "--output", "-o",
        choices=["json", "markdown"],
        default="markdown",
        help="Output format (default: markdown)"
    )

    args = parser.parse_args()

    validator = SpecValidator(args.path)
    results = validator.validate()

    if args.output == "json":
        output_json(results)
    else:
        output_markdown(results)

    if results["overall_status"] != "READY":
        sys.exit(1)


if __name__ == "__main__":
    main()
