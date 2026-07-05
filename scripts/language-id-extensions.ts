/**
 * Residual VS Code language ID → file extensions / fileNames associations.
 *
 * This map holds ONLY what the two authoritative sources don't provide:
 *
 * 1. Upstream `fileIcons.ts` explicit entries (always win).
 * 2. `scripts/generated/vscode-language-map.json` — synced from the
 *    `contributes.languages` sections of VS Code's built-in extensions at a
 *    pinned release tag via `pnpm sync-language-ids`.
 *
 * Every entry here is defined by a third-party marketplace extension (or is
 * a curated supplement) and must cite its origin in a comment:
 * - `via <extension/project> — <repo url>` when the defining extension's
 *   `contributes.languages` is the source.
 * - `curated: <reason>` when no upstream manifest could be confirmed.
 *
 * Keys already covered by the sources above must not be re-added; the
 * generator warns when an entry becomes fully shadowed (delete it then).
 *
 * Extensions are stored WITHOUT the leading dot, lowercase.
 * fileNames are stored as-is (case is preserved; the generator lowercases).
 */

export type LanguageIdAssoc = {
  extensions?: string[];
  fileNames?: string[];
};

export const languageIdAssociations: Record<string, LanguageIdAssoc> = {
  // --- supplements to VS Code built-in language ids ---

  // curated: plain `.env` file; built-in `properties` covers only `.env.*` via filenamePatterns
  properties: { fileNames: [".env"] },
  // curated: JSONC-parsed tool configs (swc, jsfmt) not listed by the built-in jsonc extension
  jsonc: { fileNames: [".jsfmtrc", ".swcrc"] },
  // via Raku (Perl 6) community extensions — https://github.com/Raku/vscode-perl6
  perl6: {
    extensions: ["rakumod", "rakutest", "rakudoc", "nqp", "p6", "pl6", "pm6"],
  },
  // curated: `.text` alias for plain text files
  plaintext: { extensions: ["text"] },
  // curated: `.rbprc` ruby tooling config
  ruby: { extensions: ["rbprc"] },
  // curated: Oil shell / yash rc files plus shell dotfiles kept as fileNames
  shellscript: {
    extensions: ["osh", "yash"],
    fileNames: [
      ".bashrc",
      ".bash_aliases",
      ".bash_profile",
      ".bash_login",
      ".profile",
      ".zshrc",
      ".zshenv",
      ".zlogin",
      ".zlogout",
      ".zprofile",
      ".kshrc",
      ".cshrc",
      ".tcshrc",
    ],
  },
  // curated: RELAX NG (.rngs) and RSS 2.0 (.rss2) XML dialects
  xml: { extensions: ["rngs", "rss2"] },
  // curated: CITA (.cita) and `Gemfile.yaml`-style lockfiles
  yaml: { extensions: ["cita", "gemfileyaml"] },
  // via Docker (ms-azuretools.vscode-docker) — https://github.com/microsoft/vscode-docker
  dockercompose: {
    fileNames: ["docker-compose.vs.debug.yml", "docker-compose.vs.release.yml"],
  },
  // via Docker (ms-azuretools.vscode-docker) — https://github.com/microsoft/vscode-docker
  ignore: { fileNames: [".dockerignore"] },
  // via Python (ms-python.python) — https://github.com/microsoft/vscode-python
  "pip-requirements": {
    fileNames: [
      "requirements-dev.txt",
      "requirements-test.txt",
      "constraints.txt",
    ],
  },
  // via Remote - SSH (ms-vscode-remote.remote-ssh-edit) — https://github.com/microsoft/vscode-remote-release
  ssh_config: {
    extensions: ["ssh_config"],
    fileNames: ["ssh_config", ".ssh/config", "sshd_config"],
  },
  // curated: `.gitkeep` placeholder, plus git dotfile extensions that the
  // built-in `properties` id also claims — the `git` language id is merged
  // first, keeping these on the git icon as upstream VS Code renders them
  git: { extensions: ["gitkeep", "gitattributes", "gitconfig", "gitmodules"] },

  // --- third-party language ids ---

  // via Ansible (redhat.ansible) — https://github.com/ansible/vscode-ansible
  ansible: { extensions: ["ansible"] },
  // via Salesforce Apex (salesforce.salesforcedx-vscode-apex) — https://github.com/forcedotcom/salesforcedx-vscode
  apex: { extensions: ["apex", "trigger"] },
  // curated: gawk/mawk/nawk dialect extensions
  awk: { extensions: ["gawk", "mawk", "nawk"] },
  // via C3 (tonios2.c3-vscode) — https://github.com/c3lang/vscode-c3
  c3: { extensions: ["c3i", "c3t"] },
  // curated: Cap'n Proto binary schema
  capnb: { extensions: ["capnb"] },
  // curated: ConTeXt mark II/IV/VI/XL/LX sources
  context: { extensions: ["mkii", "mkiv", "mkvi", "mkxl", "mklx"] },
  // via Django (batisteo.vscode-django) — https://github.com/vscode-django/vscode-django
  "django-html": { extensions: ["djhtml"] },
  // via Django (batisteo.vscode-django) — https://github.com/vscode-django/vscode-django
  "django-txt": { extensions: ["djtxt"] },
  // via Docker DX (docker.docker) — https://github.com/docker/vscode-extension
  dockerbake: { fileNames: ["docker-bake.hcl", "docker-bake.json"] },
  // via ElixirLS (jakebecker.elixir-ls) — https://github.com/elixir-lsp/vscode-elixir-ls
  elixir: { extensions: ["neex", "sface"] },
  // via Erlang (pgourlain.erlang) — https://github.com/pgourlain/vscode_erlang
  erlang: { extensions: ["hrl", "escript"] },
  // curated: OpenHarmony ArkTS (extended TypeScript)
  ets: { extensions: ["ets"] },
  // via Shader languages support (slevesque.shader) — https://github.com/stef-levesque/vscode-shader
  glsl: { extensions: ["vs"] },
  // curated: gnuplot script extensions
  gnuplot: { extensions: ["gnuplot", "plt", "plot"] },
  // via Hack (pranayagarwal.vscode-hack) — https://github.com/slackhq/vscode-hack
  hack: { extensions: ["hack", "hhi"] },
  // via Kubernetes (ms-kubernetes-tools.vscode-kubernetes-tools) — https://github.com/vscode-kubernetes-tools/vscode-kubernetes-tools
  helm: { fileNames: ["Chart.yaml", "Chart.lock", "values.yaml"] },
  // via Haxe (nadako.vshaxe) — https://github.com/vshaxe/vshaxe
  hxml: { extensions: ["hxml"] },
  // curated: literate Idris
  idris: { extensions: ["lidr"] },
  // via lean4 (leanprover.lean4) — https://github.com/leanprover/vscode-lean4
  lean: { extensions: ["olean"] },
  // curated: templated nginx configs
  nginx: { fileNames: ["nginx.conf.template"] },
  // via Nim (nim-lang.org) — https://github.com/nim-lang/vscode-nim
  nim: { extensions: ["nims"] },
  // via PostCSS Language Support (csstools.postcss) — https://github.com/csstools/postcss-language
  postcss: { extensions: ["postcss"] },
  // via Puppet (puppet.puppet-vscode) — https://github.com/puppetlabs/puppet-vscode
  puppet: { extensions: ["epp"] },
  // via RobotCode (d-biehl.robotcode) — https://github.com/robotcodedev/robotcode
  robotframework: { extensions: ["resource"] },
  // curated: Sweave / knitr R documents
  rsweave: { extensions: ["rnw", "snw", "rtex"] },
  // curated: Cadence SKILL sources and init files
  skill: { extensions: ["il", "ils", "cdsenv", "cdsinit"] },
  // via Spring Boot Tools (vmware.vscode-spring-boot) — https://github.com/spring-projects/sts4
  "spring-boot-properties": {
    fileNames: [
      "application.properties",
      "application-dev.properties",
      "application-prod.properties",
      "application-test.properties",
    ],
  },
  // via Spring Boot Tools (vmware.vscode-spring-boot) — https://github.com/spring-projects/sts4
  "spring-boot-properties-yaml": {
    fileNames: [
      "application.yml",
      "application.yaml",
      "application-dev.yml",
      "application-dev.yaml",
      "application-prod.yml",
      "application-prod.yaml",
      "application-test.yml",
      "application-test.yaml",
    ],
  },
  // via Systemd Helper (hangxingliu.vscode-systemd-support) — https://github.com/hangxingliu/vscode-systemd
  "systemd-conf": { extensions: ["link", "netdev", "network"] },
  // via Systemd Helper (hangxingliu.vscode-systemd-support) — https://github.com/hangxingliu/vscode-systemd
  "systemd-unit-file": {
    extensions: [
      "automount",
      "device",
      "mount",
      "path",
      "scope",
      "service",
      "slice",
      "socket",
      "swap",
      "target",
      "timer",
    ],
  },
  // curated: JetBrains IdeaVim config
  viml: { extensions: ["ideavimrc"] },
  // curated: XQuery module/script extensions
  xquery: { extensions: ["xq", "xql", "xqm", "xqy"] },
};
