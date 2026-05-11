# website

`material-icon-resolver` のデモ / 動作確認ページ。入力したパスがどのアイコンに解決されるかを即座に確認できる。

## スタック

- Next.js 16 (App Router) + React 19
- Tailwind CSS v4
- shadcn/ui (`base-nova` スタイル、内部は `@base-ui/react`)
- Biome (lint / format)
- 解析ライブラリ本体は pnpm workspace 経由で参照 (`material-icon-resolver: workspace:*`)

## ディレクトリ構成

```
website/
├── app/
│   ├── _components/      # このページ専用のドメインコンポーネント
│   │   ├── icon-resolver.tsx   # 状態を持つクライアントアイランド
│   │   ├── header.tsx
│   │   ├── toolbar.tsx          # cdn / fallback / version / open の操作
│   │   ├── path-input.tsx       # textarea + プリセット
│   │   ├── stats.tsx
│   │   ├── result-row.tsx
│   │   └── presets.ts           # DEFAULT_PATHS と PRESETS の定義
│   ├── globals.css       # Tailwind トークン + lime / warn / danger 拡張
│   ├── layout.tsx
│   └── page.tsx
├── components/ui/        # shadcn が生成した汎用プリミティブ
├── lib/utils.ts          # cn() ヘルパー
└── public/
```

ページ固有のコンポーネントは `app/_components/` にコロケート、汎用 UI プリミティブだけが `components/ui/` に置かれる、という分け方。

## 開発

```sh
pnpm --filter website dev      # http://localhost:3000
pnpm --filter website build
pnpm --filter website lint     # biome lint
pnpm --filter website check    # biome check --write (Run this to check lint/format at once)
```

ライブラリ側 (`../src`) を編集したときは `pnpm --filter material-icon-resolver build` で `dist/` を更新すると website 側に反映される。
