import { describe, expect, it } from "vitest";
import {
	getBasename,
	getExtensionCandidates,
	getParentName,
	normalizePath,
} from "../src/normalize.ts";

describe("normalizePath", () => {
	it("converts backslashes to forward slashes", () => {
		expect(normalizePath("src\\app\\page.tsx")).toBe("src/app/page.tsx");
	});

	it("strips trailing slash", () => {
		expect(normalizePath("src/")).toBe("src");
	});

	it("preserves root slash", () => {
		expect(normalizePath("/")).toBe("/");
	});

	it("strips query string", () => {
		expect(normalizePath("foo.ts?v=1")).toBe("foo.ts");
	});

	it("strips hash fragment", () => {
		expect(normalizePath("foo.ts#section")).toBe("foo.ts");
	});

	it("strips query before hash", () => {
		expect(normalizePath("foo.ts?v=1#section")).toBe("foo.ts");
	});

	it("strips query when it appears before deeper segments (raw URL)", () => {
		// real-world: full URLs may carry queries; we only care about the path part
		expect(normalizePath("a/b/c.txt?download=1")).toBe("a/b/c.txt");
	});

	it("returns empty string unchanged", () => {
		expect(normalizePath("")).toBe("");
	});

	it("handles mixed separators", () => {
		expect(normalizePath("a\\b/c\\d.ts")).toBe("a/b/c/d.ts");
	});
});

describe("getBasename", () => {
	it("returns segment after last slash", () => {
		expect(getBasename("a/b/c.ts")).toBe("c.ts");
	});

	it("returns whole string when no slash", () => {
		expect(getBasename("foo.ts")).toBe("foo.ts");
	});

	it("returns empty string for trailing slash input", () => {
		// Callers normalize first, but defensively:
		expect(getBasename("a/b/")).toBe("");
	});

	it("returns dotfile basename intact", () => {
		expect(getBasename("dir/.gitignore")).toBe(".gitignore");
	});
});

describe("getParentName", () => {
	it("returns immediate parent for nested path", () => {
		expect(getParentName("a/b/c.ts")).toBe("b");
	});

	it("returns single parent for two-segment path", () => {
		expect(getParentName(".github/FUNDING.yml")).toBe(".github");
	});

	it("returns empty string when no slash", () => {
		expect(getParentName("foo.ts")).toBe("");
	});

	it("returns empty parent for absolute root file", () => {
		expect(getParentName("/foo.ts")).toBe("");
	});
});

describe("getExtensionCandidates", () => {
	it("returns simple extension", () => {
		expect(getExtensionCandidates("foo.ts")).toEqual(["ts"]);
	});

	it("returns compound extensions longest first", () => {
		expect(getExtensionCandidates("page.test.tsx")).toEqual([
			"test.tsx",
			"tsx",
		]);
	});

	it("returns three-level compound extension", () => {
		expect(getExtensionCandidates("foo.a.b.c")).toEqual(["a.b.c", "b.c", "c"]);
	});

	it("lowercases the extension", () => {
		expect(getExtensionCandidates("Page.TSX")).toEqual(["tsx"]);
	});

	it("returns the trailing piece for dotfiles (.gitignore → ['gitignore'])", () => {
		expect(getExtensionCandidates(".gitignore")).toEqual(["gitignore"]);
	});

	it("returns empty array for name with no dot", () => {
		expect(getExtensionCandidates("Makefile")).toEqual([]);
	});

	it("returns empty array for name ending with a dot", () => {
		expect(getExtensionCandidates("foo.")).toEqual([]);
	});

	it("returns empty array for empty input", () => {
		expect(getExtensionCandidates("")).toEqual([]);
	});
});
