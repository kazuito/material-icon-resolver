export const DEFAULT_PATHS = [
  ".claude/settings.json",
  ".claude/statusline.sh",
  ".codex/config.toml",
  ".config/eza/theme.yml",
  ".config/gh/config.yml",
  "src/index.ts",
  "src/App.vue",
  "src/",
  "node_modules/",
  ".github/",
  ".github/workflows/ci.yml",
  "package.json",
  "Dockerfile",
  "Cargo.toml",
  "Makefile",
  "README.md",
  ".env.local",
].join("\n");

export type Preset = { label: string; paths: string[] };

export const PRESETS: Preset[] = [
  {
    label: "files",
    paths: [
      "index.ts",
      "index.js",
      "page.tsx",
      "style.css",
      "config.yml",
      "Dockerfile",
      "Makefile",
      "Cargo.toml",
      ".gitignore",
      "package.json",
      "README.md",
      "main.go",
      "main.rs",
      "main.py",
      "app.rb",
      ".env",
    ],
  },
  {
    label: "folders",
    paths: [
      "src/",
      "node_modules/",
      ".github/",
      "public/",
      "test/",
      "docs/",
      "dist/",
      ".vscode/",
    ],
  },
  {
    label: "yaml",
    paths: [
      "config.yml",
      "compose.yaml",
      "docker-compose.yml",
      ".github/workflows/ci.yml",
      "helm/values.yaml",
    ],
  },
  {
    label: "edge",
    paths: [
      ".config/ghostty/config",
      "some-binary",
      "weird.unknown.ext",
      "src/lib.d.ts",
      "page.test.tsx",
      ".github/FUNDING.yml",
    ],
  },
];
