import { describe, expect, it } from "vitest";
import {
	buildBaseUrl,
	buildCdnUrl,
	resolveMaterialIcon,
} from "../src/index.ts";

describe("CDN URL", () => {
	it("builds jsDelivr URL by default", () => {
		const r = resolveMaterialIcon("src/app/page.tsx", {
			type: "file",
			version: "5.34.0",
		});
		expect(r?.cdnUrl).toBe(
			"https://cdn.jsdelivr.net/npm/material-icon-theme@5.34.0/icons/react_ts.svg",
		);
	});

	it("builds unpkg URL", () => {
		const r = resolveMaterialIcon("src/app/page.tsx", {
			type: "file",
			cdn: "unpkg",
			version: "5.34.0",
		});
		expect(r?.cdnUrl).toBe(
			"https://unpkg.com/material-icon-theme@5.34.0/icons/react_ts.svg",
		);
	});

	it("uses metadata.upstreamVersion by default", () => {
		const r = resolveMaterialIcon("page.tsx", { type: "file" });
		expect(r?.cdnUrl).toMatch(/material-icon-theme@\d+\.\d+\.\d+\//);
	});

	it("respects baseUrl when provided", () => {
		const r = resolveMaterialIcon("src/app/page.tsx", {
			type: "file",
			baseUrl: "/material-icons",
		});
		expect(r?.cdnUrl).toBe("/material-icons/react_ts.svg");
	});

	it("normalizes trailing slash on baseUrl", () => {
		const r = resolveMaterialIcon("src/app/page.tsx", {
			type: "file",
			baseUrl: "/material-icons/",
		});
		expect(r?.cdnUrl).toBe("/material-icons/react_ts.svg");
	});

	it("buildCdnUrl helper is exported", () => {
		expect(
			buildCdnUrl({ cdn: "jsdelivr", version: "1.0.0", filename: "x.svg" }),
		).toBe(
			"https://cdn.jsdelivr.net/npm/material-icon-theme@1.0.0/icons/x.svg",
		);
	});

	it("buildBaseUrl helper is exported", () => {
		expect(buildBaseUrl("/icons", "x.svg")).toBe("/icons/x.svg");
		expect(buildBaseUrl("/icons/", "x.svg")).toBe("/icons/x.svg");
	});

	it("folder open uses -open filename in cdn url", () => {
		const r = resolveMaterialIcon("src", {
			type: "folder",
			open: true,
			version: "5.34.0",
		});
		expect(r?.cdnUrl).toBe(
			"https://cdn.jsdelivr.net/npm/material-icon-theme@5.34.0/icons/folder-src-open.svg",
		);
	});

	it("baseUrl takes precedence over cdn and version", () => {
		const r = resolveMaterialIcon("foo.ts", {
			baseUrl: "/icons",
			cdn: "unpkg",
			version: "9.9.9",
		});
		expect(r?.cdnUrl).toBe("/icons/typescript.svg");
	});

	it("baseUrl with no leading slash is preserved as relative", () => {
		const r = resolveMaterialIcon("foo.ts", { baseUrl: "icons" });
		expect(r?.cdnUrl).toBe("icons/typescript.svg");
	});

	it("baseUrl works with absolute https URLs", () => {
		const r = resolveMaterialIcon("foo.ts", {
			baseUrl: "https://cdn.example.com/v2",
		});
		expect(r?.cdnUrl).toBe("https://cdn.example.com/v2/typescript.svg");
	});

	it("custom version is reflected in URL", () => {
		const r = resolveMaterialIcon("foo.ts", { version: "latest" });
		expect(r?.cdnUrl).toBe(
			"https://cdn.jsdelivr.net/npm/material-icon-theme@latest/icons/typescript.svg",
		);
	});

	it("default fallback file icon also has a cdn URL", () => {
		const r = resolveMaterialIcon("zzz_no_such_file_xyz", { version: "5.34.0" });
		expect(r?.source).toBe("default");
		expect(r?.cdnUrl).toBe(
			"https://cdn.jsdelivr.net/npm/material-icon-theme@5.34.0/icons/file.svg",
		);
	});
});
