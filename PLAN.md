# `material-icon-resolver` 実装計画書

## 0. 本計画書の位置付け

本計画書は、`material-icon-resolver` を実装するための初期草案である。

ここに記載した API、内部構造、実装手順、ディレクトリ構成、マイルストーンは固定ではない。実装中に判明した upstream の構造、互換性上の都合、保守性、利用者体験を踏まえて自由に変更してよい。

特に、`vscode-material-icon-theme` 側の実装構造や icon association の管理方法を確認した結果、本計画よりも再現性・保守性の高い方法が見つかった場合は、そちらを優先する。

## 1. 目的

`material-icon-resolver` は、ファイルパスまたはフォルダパスから VS Code Material Icon Theme 互換のアイコン名・SVG ファイル名・CDN URL を解決する TypeScript ライブラリである。

主な用途は、GitHub 風ファイルツリー、AI コードエディタ、ドキュメントビューア、SaaS のプロジェクトブラウザなどで、VS Code Material Icon Theme に近いファイルアイコンを簡単に表示することである。

基本的な利用例は次の通り。

```ts
import { resolveMaterialIcon } from "material-icon-resolver";

resolveMaterialIcon("src/app/page.tsx", {
  type: "file",
  cdn: "jsdelivr",
  version: "5.34.0",
  fallback: "file",
});

// returns
// {
//   name: "react_ts",
//   filename: "react_ts.svg",
//   cdnUrl: "https://cdn.jsdelivr.net/npm/material-icon-theme@5.34.0/icons/react_ts.svg"
// }
```

## 2. 基本方針

このパッケージは VS Code 拡張ではなく、通常の npm ライブラリとして提供する。VS Code API や language service には依存しない。

対象 upstream は、ローカルに clone 済みの以下の repository とする。

```txt
~/dev/oss/vscode-material-icon-theme
```

実装時には、この repository の実装、icon association 定義、manifest 生成処理、resolver に相当する処理、型定義、定数、utility などをよく参照する。利用可能なコードやロジックは適切に拝借・移植し、できるだけ `vscode-material-icon-theme` の実際の挙動に近い path-based resolution を再現する。

目的は、独自解釈で resolver を作ることではなく、upstream の実装に寄せて互換性・再現性を高めることである。

ただし、この package は VS Code 拡張として動作するものではなく、ファイルパス・フォルダパスからアイコンを解決する汎用 npm package である。そのため、VS Code API、ユーザー設定、custom icon association、language id などに依存する処理は取り込まない。

upstream からコードやロジックを借用する場合は、ライセンス表記と attribution を適切に扱う。

## 3. スコープ

初期スコープは次の通り。

* ファイルパスから icon name を解決する
* フォルダパスから icon name を解決する
* SVG ファイル名を返す
* jsDelivr CDN URL を返す
* unpkg CDN URL を返す
* 任意の version を指定できる
* self-host 用に `baseUrl` を指定できる
* fallback icon を指定できる
* TypeScript 型定義を同梱する
* ESM package として配布する

## 4. 非目標

初期実装では以下を扱わない。

* VS Code 拡張としての動作
* VS Code settings との連携
* language id による icon resolution
* custom file association
* custom folder association
* custom SVG icon
* icon clone 機能
* ユーザー設定による icon pack 切り替え
* dynamic import による icon SVG 本体の読み込み
* CJS 配布

特に重要なのは、language id を使わない点である。このライブラリはファイルパスだけを入力とするため、VS Code 上の表示と完全一致しないケースがある。README ではこの制約を明記する。

## 5. 互換性目標

完全互換ではなく、path-based compatibility を目標にする。

このライブラリで再現する対象は、主に次の association である。

```txt
fileNames
fileExtensions
folderNames
folderNamesExpanded
rootFolderNames
rootFolderNamesExpanded
```

language id は対象外とする。

file resolver の優先順位は、VS Code icon theme の挙動に近づけるため、概ね次の順序を目標にする。

```txt
file name with parent
> file name
> file extension with parent
> file extension
> default file
```

folder resolver の優先順位は次の通り。

```txt
root folder name / expanded root folder name
> folder name with parent
> folder name / expanded folder name
> default folder / default expanded folder
```

実際の優先順位は、`~/dev/oss/vscode-material-icon-theme` の実装を確認したうえで必要に応じて修正する。

## 6. 想定 API

### 6.1 メイン API

```ts
import { resolveMaterialIcon } from "material-icon-resolver";

const icon = resolveMaterialIcon("src/app/page.tsx", {
  type: "file",
  cdn: "jsdelivr",
  version: "5.34.0",
  fallback: "file",
});
```

戻り値の基本形は次の通り。

```ts
type ResolvedMaterialIcon = {
  name: string;
  filename: string;
  cdnUrl: string;
};
```

### 6.2 推奨する戻り値

実運用では、デバッグしやすさのために `type` と `source` も含める。

```ts
type ResolvedMaterialIcon = {
  name: string;
  filename: string;
  cdnUrl: string;
  type: "file" | "folder";
  source:
    | "fileNameWithParent"
    | "fileName"
    | "fileExtensionWithParent"
    | "fileExtension"
    | "folderNameWithParent"
    | "folderName"
    | "rootFolderName"
    | "default";
};
```

`source` は、どのルールで解決されたかを確認するために使う。

### 6.3 便利関数

最初から提供する候補は次の通り。

```ts
resolveMaterialIcon(path, options);
getMaterialIconName(path, options);
getMaterialIconFilename(path, options);
getMaterialIconCdnUrl(path, options);
```

ただし、初期実装では `resolveMaterialIcon` を中心にし、便利関数は必要最低限に抑えてもよい。

## 7. Options 設計

```ts
type ResolveMaterialIconOptions = {
  type?: "file" | "folder";
  cdn?: "jsdelivr" | "unpkg";
  version?: string;
  fallback?: "file" | "folder" | "none";
  open?: boolean;
  baseUrl?: string;
};
```

### 7.1 `type`

`type` は `"file"` または `"folder"` を指定する。

```ts
resolveMaterialIcon("src/app/page.tsx", { type: "file" });
resolveMaterialIcon("src/components", { type: "folder" });
```

将来的に `"auto"` を追加する余地はある。ただし、パス文字列だけでは file/folder を正確に判定できないため、初期実装では明示指定を推奨する。

### 7.2 `cdn`

対応する CDN は初期では次の 2 つ。

```ts
type CdnProvider = "jsdelivr" | "unpkg";
```

デフォルトは `"jsdelivr"` とする。

### 7.3 `version`

`version` は `material-icon-theme` package の version を指定する。

```ts
resolveMaterialIcon("package.json", {
  version: "5.34.0",
});

resolveMaterialIcon("package.json", {
  version: "latest",
});
```

デフォルトは `latest` ではなく、生成済み association data と対応する検証済み upstream version に固定するのが望ましい。CDN 側だけ `latest` にすると、resolver が持つ association table と CDN 上の icons がズレる可能性があるためである。

ただし、利用者が明示的に `version: "latest"` を指定することは許可する。

### 7.4 `fallback`

fallback は解決できなかった場合の挙動を指定する。

```ts
type Fallback = "file" | "folder" | "none";
```

`"none"` の場合は、解決失敗時に `null` を返す設計も検討する。

```ts
type ResolvedMaterialIconOrNull = ResolvedMaterialIcon | null;
```

ただし、API の単純さを優先するなら、初期実装では常に fallback を返す方が扱いやすい。

### 7.5 `open`

`open` は folder icon の expanded 状態を表す。

```ts
resolveMaterialIcon("src/components", {
  type: "folder",
  open: true,
});
```

`type: "file"` の場合は無視する。

### 7.6 `baseUrl`

`baseUrl` が指定された場合、CDN URL ではなく self-host URL を生成する。

```ts
resolveMaterialIcon("src/app/page.tsx", {
  type: "file",
  baseUrl: "/material-icons",
});

// /material-icons/react_ts.svg
```

Next.js の `public/material-icons` や Vite の static assets と相性が良い。

## 8. データ生成方針

`material-icon-resolver` では、upstream の association data をもとに静的な generated file を作る。

参照元は次のローカル repository とする。

```txt
~/dev/oss/vscode-material-icon-theme
```

生成コマンド例。

```bash
MATERIAL_ICON_THEME_REPO=~/dev/oss/vscode-material-icon-theme pnpm generate
```

生成スクリプトの責務は次の通り。

```txt
1. upstream の source を読む
2. file icon association を抽出する
3. folder icon association を抽出する
4. default file/folder icon を抽出する
5. icon filename の存在を検証する
6. src/generated/*.ts に静的データとして出力する
7. upstream version や commit hash を metadata として保存する
```

生成物の例。

```ts
// src/generated/file-icons.ts
export const fileNames = {
  "package.json": "nodejs",
  "tsconfig.json": "tsconfig",
} as const;

export const fileExtensions = {
  "ts": "typescript",
  "tsx": "react_ts",
} as const;

export const fileNameWithParent = {
  "github/workflows": "github-actions",
} as const;
```

実際の upstream の構造は実装時に確認する。最初は `src/core/icons/fileIcons.ts`、`src/core/icons/folderIcons.ts`、manifest generator 周辺を重点的に読む。

## 9. Resolver アルゴリズム

### 9.1 共通正規化

入力パスは次のように正規化する。

```txt
- Windows separator `\` を `/` に変換する
- trailing slash を削除する
- query/hash が混ざっている場合は削除するか非対応として扱う
- basename を取得する
- parent folder name を取得する
- matching key は lowercase にする
```

例。

```txt
src/app/page.tsx

basename: page.tsx
parent: app
normalized: src/app/page.tsx
```

### 9.2 file resolver

解決順序は次の通り。

```txt
1. parent/basename 完全一致
2. basename 完全一致
3. parent/compound extension
4. compound extension
5. parent/simple extension
6. simple extension
7. fallback file icon
```

compound extension の例。

```txt
page.test.tsx

candidate extensions:
test.tsx
tsx
```

`lib.d.ts` のような複数 dot のファイルでは、長い extension から順に評価する。

擬似コード。

```ts
function resolveFileIcon(path: string, options: ResolveMaterialIconOptions) {
  const normalized = normalizePath(path);
  const basename = getBasename(normalized).toLowerCase();
  const parent = getParentName(normalized).toLowerCase();

  const parentFileNameKey = `${parent}/${basename}`;

  if (fileNameWithParent[parentFileNameKey]) {
    return from("fileNameWithParent", fileNameWithParent[parentFileNameKey]);
  }

  if (fileNames[basename]) {
    return from("fileName", fileNames[basename]);
  }

  for (const ext of getCompoundExtensions(basename)) {
    const parentExtKey = `${parent}/${ext}`;

    if (fileExtensionsWithParent[parentExtKey]) {
      return from("fileExtensionWithParent", fileExtensionsWithParent[parentExtKey]);
    }

    if (fileExtensions[ext]) {
      return from("fileExtension", fileExtensions[ext]);
    }
  }

  return fallbackFile();
}
```

### 9.3 folder resolver

解決順序は次の通り。

```txt
1. root folder name / expanded root folder name
2. parent/folderName
3. folderName / expanded folderName
4. default folder / default expanded folder
```

例。

```ts
resolveMaterialIcon("src/components", {
  type: "folder",
});

resolveMaterialIcon("src/components", {
  type: "folder",
  open: true,
});
```

`open: true` の場合は expanded folder icon を優先する。

## 10. CDN URL 生成

初期対応 CDN は次の通り。

```ts
type CdnProvider = "jsdelivr" | "unpkg";
```

URL builder の基本形。

```ts
function buildCdnUrl(input: {
  cdn: "jsdelivr" | "unpkg";
  packageName: string;
  version: string;
  filename: string;
}) {
  if (input.cdn === "jsdelivr") {
    return `https://cdn.jsdelivr.net/npm/${input.packageName}@${input.version}/icons/${input.filename}`;
  }

  return `https://unpkg.com/${input.packageName}@${input.version}/icons/${input.filename}`;
}
```

デフォルト package name は次の通り。

```ts
const MATERIAL_ICON_THEME_PACKAGE = "material-icon-theme";
```

`baseUrl` が指定された場合は CDN を使わず、次のように URL を生成する。

```ts
function buildBaseUrl(baseUrl: string, filename: string) {
  return `${baseUrl.replace(/\/$/, "")}/${filename}`;
}
```

## 11. パッケージ構成

```txt
material-icon-resolver/
  src/
    index.ts
    resolve.ts
    normalize.ts
    cdn.ts
    types.ts
    generated/
      file-icons.ts
      folder-icons.ts
      metadata.ts
  scripts/
    generate.ts
    validate-icons.ts
  test/
    resolve-file.test.ts
    resolve-folder.test.ts
    cdn.test.ts
    fixtures/
  package.json
  tsdown.config.ts
  tsconfig.json
  README.md
  LICENSE
```

`src/generated` は手編集しない。upstream 更新時は `pnpm generate` で再生成する。

## 12. Build / Packaging 方針

パッケージングには `tsdown` を利用する。

`material-icon-resolver` は小規模な TypeScript library として配布するため、library bundler として扱いやすい `tsdown` を採用する。`tsdown` により、ESM 出力、型定義ファイル生成、clean build、将来的な複数 entry 対応を行う。

初期リリースでは ESM only を基本とする。CJS 対応は、利用者からの需要が明確になった場合に検討する。

`tsdown.config.ts` の例。

```ts
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
});
```

`package.json` の例。

```json
{
  "name": "material-icon-resolver",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsdown",
    "generate": "tsx scripts/generate.ts",
    "test": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "tsdown": "latest",
    "tsx": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

## 13. テスト計画

テストは大きく 4 種類に分ける。

### 13.1 基本 file path テスト

```ts
expect(resolveMaterialIcon("package.json", { type: "file" }).name)
  .toBe("nodejs");

expect(resolveMaterialIcon("src/app/page.tsx", { type: "file" }).name)
  .toBe("react_ts");
```

### 13.2 優先順位テスト

確認すべき優先順位は次の通り。

```txt
file name match > extension match
parent/file name match > file name match
parent/extension match > extension match
compound extension > simple extension
```

この部分は VS Code との互換性に直結するため、重点的にテストする。

### 13.3 folder path テスト

```ts
resolveMaterialIcon("src", { type: "folder" });
resolveMaterialIcon("src", { type: "folder", open: true });
resolveMaterialIcon("node_modules", { type: "folder" });
```

### 13.4 URL 生成テスト

```ts
expect(resolveMaterialIcon("src/app/page.tsx", {
  type: "file",
  cdn: "jsdelivr",
  version: "5.34.0",
}).cdnUrl).toBe(
  "https://cdn.jsdelivr.net/npm/material-icon-theme@5.34.0/icons/react_ts.svg"
);
```

## 14. Upstream 追従計画

upstream 追従手順は次の通り。

```txt
1. ~/dev/oss/vscode-material-icon-theme を更新する
2. pnpm generate を実行する
3. generated diff を確認する
4. icon filename existence validation を実行する
5. fixture tests を実行する
6. package version を更新する
7. changelog に upstream version を記録する
```

`metadata.ts` には upstream 情報を保存する。

```ts
export const metadata = {
  upstream: "material-extensions/vscode-material-icon-theme",
  upstreamPath: "~/dev/oss/vscode-material-icon-theme",
  upstreamVersion: "5.34.0",
  upstreamCommit: "<commit-hash>",
  generatedAt: "2026-05-08T00:00:00.000Z",
} as const;
```

## 15. README に明記すべき制約

README には以下を明記する。

```md
This package resolves icons from file and folder paths only.
It does not use VS Code language IDs.
Therefore, it is compatible with Material Icon Theme's file name,
file extension, and folder name associations, but not fully identical
to VS Code's runtime icon resolution.
```

また、custom icon associations、custom SVG icons、custom clones は非対応と明記する。

日本語での説明例。

```md
このパッケージは、ファイルパス・フォルダパスのみから Material Icon Theme 互換のアイコンを解決します。
VS Code の language id は利用しないため、VS Code 上の表示と完全に一致しないケースがあります。
また、custom icon association や custom SVG icon には対応していません。
```

## 16. 実装マイルストーン

### Milestone 1: 最小 resolver

```txt
- package scaffold
- tsdown build
- normalizePath()
- resolveFileIcon()
- resolveFolderIcon()
- buildCdnUrl()
- static hand-written minimal associations
- vitest setup
```

この段階では `ts`, `tsx`, `js`, `json`, `md`, `package.json`, `src`, `node_modules` など少数の fixture で動作確認する。

### Milestone 2: upstream data generator

```txt
- ~/dev/oss/vscode-material-icon-theme を参照する
- upstream source から association data を抽出する
- generated/*.ts を出力する
- icons directory に filename が存在するか検証する
```

この段階で本格的に `vscode-material-icon-theme` 互換へ寄せる。

### Milestone 3: VS Code 仕様寄せ

```txt
- parent segment 付き fileNames
- parent segment 付き fileExtensions
- compound extension
- folderNamesExpanded
- rootFolderNames
- rootFolderNamesExpanded
```

### Milestone 4: npm publish-ready

```txt
- README
- API docs
- license notice
- changelog
- npm package metadata
- CI
- provenance publish
```

## 17. リスク

最大のリスクは upstream の内部構造変更である。`fileIcons.ts` や `folderIcons.ts` の export 形式が変わると generator が壊れる可能性がある。対策として、生成スクリプトに validation を入れ、壊れた場合は明確に fail させる。

次のリスクは VS Code 完全互換への期待値である。language id を使わないため、VS Code と 100% 同じ結果にはならない。これは README、型コメント、ドキュメントで明確にする。

もう一つは CDN version と resolver data のズレである。デフォルト version は generated metadata の upstream version に固定し、`latest` は明示 opt-in にするのが安全である。

## 18. 採用する初期 API

最初の公開 API は次の形を基本とする。

```ts
export function resolveMaterialIcon(
  path: string,
  options?: ResolveMaterialIconOptions,
): ResolvedMaterialIcon;

export function getMaterialIconName(
  path: string,
  options?: ResolveMaterialIconOptions,
): string;

export function getMaterialIconCdnUrl(
  path: string,
  options?: ResolveMaterialIconOptions,
): string;
```

型定義。

```ts
export type ResolveMaterialIconOptions = {
  type?: "file" | "folder";
  cdn?: "jsdelivr" | "unpkg";
  version?: string;
  fallback?: "file" | "folder" | "none";
  open?: boolean;
  baseUrl?: string;
};

export type ResolvedMaterialIcon = {
  name: string;
  filename: string;
  cdnUrl: string;
  type: "file" | "folder";
  source: string;
};
```

## 19. 最初に作るべきファイル

```txt
src/types.ts
src/normalize.ts
src/cdn.ts
src/generated/file-icons.ts
src/generated/folder-icons.ts
src/generated/metadata.ts
src/resolve.ts
src/index.ts
test/resolve-file.test.ts
test/resolve-folder.test.ts
test/cdn.test.ts
scripts/generate.ts
scripts/validate-icons.ts
```

最初は generated data を手書きの小さい fixture にして resolver を完成させる。その後、upstream clone からの generator に置き換える。これが一番実装リスクが低い。

## 20. 成功条件

v0.1.0 の成功条件は次の通り。

```txt
- file path から icon name を解決できる
- folder path から icon name を解決できる
- jsDelivr CDN URL を生成できる
- unpkg CDN URL を生成できる
- version pin ができる
- baseUrl による self-host URL 生成ができる
- languageId 非対応を明記している
- custom icon 非対応を明記している
- upstream generated data を再生成できる
- tsdown によって ESM + d.ts を配布できる
- npm package として publish 可能な構成になっている
```

この計画により、`material-icon-resolver` は単なる CDN URL builder ではなく、VS Code Material Icon Theme 由来の path-based icon resolver として成立する。初期実装としての価値は十分にある。
