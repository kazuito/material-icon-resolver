import { describe, expect, it } from "vitest";
import { resolveMaterialIcon } from "../src/index.ts";

describe("resolveMaterialIcon (folder)", () => {
	it("matches plain folder name", () => {
		const r = resolveMaterialIcon("src", { type: "folder" });
		expect(r?.name).toBe("folder-src");
		expect(r?.source).toBe("folderNames");
		expect(r?.filename).toBe("folder-src.svg");
	});

	it("matches expanded folder-name variants", () => {
		for (const p of [".src", "_src", "-src", "__src__"]) {
			const r = resolveMaterialIcon(p, { type: "folder" });
			expect(r?.name, `for ${p}`).toBe("folder-src");
		}
	});

	it("uses -open suffix when open=true", () => {
		const r = resolveMaterialIcon("src", { type: "folder", open: true });
		expect(r?.name).toBe("folder-src");
		expect(r?.filename).toBe("folder-src-open.svg");
	});

	it("matches node_modules", () => {
		const r = resolveMaterialIcon("packages/node_modules", {
			type: "folder",
		});
		expect(r?.name).toBe("folder-node");
	});

	it("falls back to default folder for unknown", () => {
		const r = resolveMaterialIcon("totally-unknown-folder-xyz", {
			type: "folder",
		});
		expect(r?.source).toBe("default");
		expect(r?.name).toBe("folder");
	});

	it("default folder open uses -open filename", () => {
		const r = resolveMaterialIcon("totally-unknown-folder-xyz", {
			type: "folder",
			open: true,
		});
		expect(r?.filename).toBe("folder-open.svg");
	});

	it("returns null with fallback=none for unknown folder", () => {
		const r = resolveMaterialIcon("totally-unknown-folder-xyz", {
			type: "folder",
			fallback: "none",
		});
		expect(r).toBeNull();
	});

	it("ignores trailing slash", () => {
		const r = resolveMaterialIcon("src/", { type: "folder" });
		expect(r?.name).toBe("folder-src");
	});

	it("normalizes Windows separators in folder paths", () => {
		const r = resolveMaterialIcon("project\\src", { type: "folder" });
		expect(r?.name).toBe("folder-src");
	});

	it("matches folder name case-insensitively", () => {
		const r = resolveMaterialIcon("SRC", { type: "folder" });
		expect(r?.name).toBe("folder-src");
	});

	it("returns folder type and source on a miss with default fallback", () => {
		const r = resolveMaterialIcon("totally-unknown-folder-xyz", {
			type: "folder",
		});
		expect(r?.type).toBe("folder");
		expect(r?.source).toBe("default");
	});

	it("fallback='file' on a missed folder returns file default", () => {
		const r = resolveMaterialIcon("totally-unknown-folder-xyz", {
			type: "folder",
			fallback: "file",
		});
		expect(r?.type).toBe("file");
		expect(r?.name).toBe("file");
		expect(r?.source).toBe("default");
	});

	it("languageId option does not affect folder resolution", () => {
		const r = resolveMaterialIcon("totally-unknown-folder-xyz", {
			type: "folder",
			languageId: "rust",
			fallback: "none",
		});
		expect(r).toBeNull();
	});

	it("returns empty string folder as default", () => {
		const r = resolveMaterialIcon("", { type: "folder" });
		expect(r?.source).toBe("default");
		expect(r?.name).toBe("folder");
	});

	it("returns empty filename as null with fallback=none", () => {
		const r = resolveMaterialIcon("", {
			type: "folder",
			fallback: "none",
		});
		expect(r).toBeNull();
	});
});
