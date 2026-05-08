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
});
