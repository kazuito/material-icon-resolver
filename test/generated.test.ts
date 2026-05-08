import { describe, expect, it } from "vitest";
import {
  defaultFile,
  fileExtensions,
  fileNames,
  fileNamesWithPath,
  languageIds,
} from "../src/generated/file-icons.ts";
import {
  defaultFolder,
  folderNames,
  folderNamesExpanded,
  rootFolderNames,
  rootFolderNamesExpanded,
} from "../src/generated/folder-icons.ts";
import { metadata } from "../src/generated/metadata.ts";

const allMaps = {
  fileNames,
  fileNamesWithPath,
  fileExtensions,
  languageIds,
  folderNames,
  folderNamesExpanded,
  rootFolderNames,
  rootFolderNamesExpanded,
};

describe("generated map invariants", () => {
  for (const [mapName, map] of Object.entries(allMaps)) {
    it(`${mapName}: every key is the result of toLowerCase()`, () => {
      for (const key of Object.keys(map)) {
        expect(key, `key="${key}"`).toBe(key.toLowerCase());
      }
    });

    it(`${mapName}: every value is a non-empty string`, () => {
      for (const [key, value] of Object.entries(map)) {
        expect(value, `key="${key}"`).toBeTypeOf("string");
        expect(value.length, `key="${key}"`).toBeGreaterThan(0);
      }
    });
  }

  it("fileNamesWithPath keys all contain a slash", () => {
    for (const key of Object.keys(fileNamesWithPath)) {
      expect(key.includes("/"), `key="${key}"`).toBe(true);
    }
  });

  it("fileNames keys never contain a slash (path-form is in fileNamesWithPath)", () => {
    for (const key of Object.keys(fileNames)) {
      expect(key.includes("/"), `key="${key}"`).toBe(false);
    }
  });

  it("fileExtensions keys never start with a dot", () => {
    for (const key of Object.keys(fileExtensions)) {
      expect(key.startsWith("."), `key="${key}"`).toBe(false);
    }
  });

  it("folderNamesExpanded shares keys with folderNames", () => {
    // Current generator copies the map; surface a regression if that changes
    // without also updating the runtime that switches on `open`.
    expect(Object.keys(folderNamesExpanded).sort()).toEqual(
      Object.keys(folderNames).sort(),
    );
  });

  it("rootFolderNamesExpanded shares keys with rootFolderNames", () => {
    expect(Object.keys(rootFolderNamesExpanded).sort()).toEqual(
      Object.keys(rootFolderNames).sort(),
    );
  });
});

describe("generated map sanity checks", () => {
  it("default icon names are non-empty", () => {
    expect(defaultFile.length).toBeGreaterThan(0);
    expect(defaultFolder.length).toBeGreaterThan(0);
  });

  it("metadata fields are populated", () => {
    expect(metadata.upstreamVersion).toMatch(/^\d+\.\d+\.\d+/);
    expect(metadata.upstreamCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(metadata.upstreamRepo).toBe(
      "material-extensions/vscode-material-icon-theme",
    );
    expect(metadata.generatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    );
  });

  it("fileExtensions covers core languages", () => {
    // Spot-check a handful of language-derived extensions to catch
    // regressions in the language-id pipeline.
    expect(fileExtensions.ts).toBe("typescript");
    expect(fileExtensions.tsx).toBe("react_ts");
    expect(fileExtensions.js).toBe("javascript");
    expect(fileExtensions.rs).toBe("rust");
    expect(fileExtensions.go).toBe("go");
    expect(fileExtensions.py).toBe("python");
  });

  it("languageIds covers core languages", () => {
    expect(languageIds.typescript).toBe("typescript");
    expect(languageIds.javascript).toBe("javascript");
    expect(languageIds.python).toBe("python");
    expect(languageIds.rust).toBe("rust");
    expect(languageIds.go).toBe("go");
    // Compound ids preserve their hyphens
    expect(languageIds.shellscript).toBeTruthy();
  });

  it("languageIds contains a reasonable number of entries", () => {
    // Lower bound prevents an empty/degenerate generation from sneaking in.
    expect(Object.keys(languageIds).length).toBeGreaterThan(100);
  });

  it("fileNames covers well-known config filenames", () => {
    expect(fileNames["package.json"]).toBe("nodejs");
    expect(fileNames["tsconfig.json"]).toBeTypeOf("string");
  });
});
