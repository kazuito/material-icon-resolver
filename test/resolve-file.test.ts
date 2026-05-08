import { describe, expect, it } from "vitest";
import { resolveMaterialIcon } from "../src/index.ts";

describe("resolveMaterialIcon (file)", () => {
	it("matches exact filename (package.json → nodejs)", () => {
		const r = resolveMaterialIcon("package.json", { type: "file" });
		expect(r?.name).toBe("nodejs");
		expect(r?.source).toBe("fileNames");
		expect(r?.filename).toBe("nodejs.svg");
	});

	it("matches simple extension (.tsx → react_ts)", () => {
		const r = resolveMaterialIcon("src/app/page.tsx", { type: "file" });
		expect(r?.name).toBe("react_ts");
		expect(r?.source).toBe("fileExtensions");
	});

	it("prefers compound extension over simple (lib.d.ts)", () => {
		const r = resolveMaterialIcon("lib.d.ts", { type: "file" });
		expect(r?.source).toBe("fileExtensions");
		// upstream registers d.ts → typescript-def; bare ts → typescript
		expect(r?.name).not.toBe("typescript");
	});

	it("matches fileNamesWithPath when parent path matches (.github/FUNDING.yml)", () => {
		const r = resolveMaterialIcon(".github/FUNDING.yml", { type: "file" });
		expect(r?.source).toBe("fileNamesWithPath");
	});

	it("normalizes Windows separators and lowercase", () => {
		const r = resolveMaterialIcon("src\\app\\Page.TSX", { type: "file" });
		expect(r?.name).toBe("react_ts");
	});

	it("falls back to default file icon for truly unknown name", () => {
		const r = resolveMaterialIcon("totally-unknown-binary-blob-xyz", {
			type: "file",
		});
		expect(r?.source).toBe("default");
		expect(r?.name).toBe("file");
	});

	it("returns null when fallback=none and unmatched", () => {
		const r = resolveMaterialIcon("totally-unknown-binary-blob-xyz", {
			type: "file",
			fallback: "none",
		});
		expect(r).toBeNull();
	});

	it("treats path with no extension correctly", () => {
		// LICENSE has no extension and no upstream entry by default → fallback
		const r = resolveMaterialIcon("README", {
			type: "file",
			fallback: "none",
		});
		// readme is a fileName in upstream, so this would resolve. Use a safer
		// non-existent name to assert null.
		// Switching to a guaranteed unknown:
		void r;
		const r2 = resolveMaterialIcon("zzz_no_such_file_name", {
			type: "file",
			fallback: "none",
		});
		expect(r2).toBeNull();
	});
});
