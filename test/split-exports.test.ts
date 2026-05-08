import { describe, expect, it } from "vitest";
import {
  getMaterialFileIconCdnUrl,
  getMaterialFileIconName,
  resolveMaterialFileIcon,
  resolveMaterialFileIconByLanguageId,
} from "../src/file.ts";
import {
  getMaterialFolderIconCdnUrl,
  getMaterialFolderIconName,
  resolveMaterialFolderIcon,
} from "../src/folder.ts";

describe("file-only resolver", () => {
  it("resolves file paths without folder options", () => {
    const r = resolveMaterialFileIcon("src/index.ts");
    expect(r).toMatchObject({
      name: "typescript",
      filename: "typescript.svg",
      type: "file",
      source: "fileExtensions",
    });
  });

  it("resolves language ids and file convenience helpers", () => {
    expect(resolveMaterialFileIconByLanguageId("rust")?.name).toBe("rust");
    expect(getMaterialFileIconName("package.json")).toBe("nodejs");
    expect(getMaterialFileIconCdnUrl("index.ts", { baseUrl: "/icons" })).toBe(
      "/icons/typescript.svg",
    );
  });

  it("supports file-only fallback modes", () => {
    expect(
      resolveMaterialFileIcon("zzz_no_such", { fallback: "none" }),
    ).toBeNull();
    expect(resolveMaterialFileIcon("zzz_no_such")?.name).toBe("file");
  });
});

describe("folder-only resolver", () => {
  it("resolves folder paths without file options", () => {
    const r = resolveMaterialFolderIcon("src", { open: true });
    expect(r).toMatchObject({
      name: "folder-src",
      filename: "folder-src-open.svg",
      type: "folder",
      source: "folderNames",
    });
  });

  it("resolves folder convenience helpers", () => {
    expect(getMaterialFolderIconName("node_modules")).toBe("folder-node");
    expect(getMaterialFolderIconCdnUrl("src", { baseUrl: "/icons" })).toBe(
      "/icons/folder-src.svg",
    );
  });

  it("supports folder-only fallback modes", () => {
    expect(
      resolveMaterialFolderIcon("totally-unknown-folder-xyz", {
        fallback: "none",
      }),
    ).toBeNull();
    expect(resolveMaterialFolderIcon("totally-unknown-folder-xyz")?.name).toBe(
      "folder",
    );
  });
});
