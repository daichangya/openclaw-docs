---
read_when:
    - Skills を追加または変更している
    - Skill のゲーティングまたはロードルールを変更している
summary: 'Skills: managed と workspace、ゲーティングルール、設定/env の配線'
title: Skills
x-i18n:
    generated_at: "2026-04-05T13:01:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6bb0e2e7c2ff50cf19c759ea1da1fd1886dc11f94adc77cbfd816009f75d93ee
    source_path: tools/skills.md
    workflow: 15
---

# Skills（OpenClaw）

OpenClaw は、エージェントにツールの使い方を教えるために **[AgentSkills](https://agentskills.io) 互換** の skill フォルダーを使用します。各 skill は、YAML frontmatter と説明を含む `SKILL.md` を持つディレクトリです。OpenClaw は **バンドル済み Skills** と任意のローカル上書きを読み込み、環境、設定、バイナリーの存在に基づいてロード時にそれらをフィルタリングします。

## 場所と優先順位

OpenClaw は次のソースから Skills を読み込みます。

1. **追加 skill フォルダー**: `skills.load.extraDirs` で設定
2. **バンドル済み Skills**: インストールに同梱（npm パッケージまたは OpenClaw.app）
3. **managed/local Skills**: `~/.openclaw/skills`
4. **個人エージェント Skills**: `~/.agents/skills`
5. **プロジェクトエージェント Skills**: `<workspace>/.agents/skills`
6. **workspace Skills**: `<workspace>/skills`

skill 名が競合する場合の優先順位は次のとおりです。

`<workspace>/skills`（最高）→ `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → バンドル済み Skills → `skills.load.extraDirs`（最低）

## エージェント単位の Skills と共有 Skills

**マルチエージェント** 構成では、各エージェントは独自の workspace を持ちます。つまり:

- **エージェント単位の Skills** は、そのエージェント専用の `<workspace>/skills` にあります。
- **プロジェクトエージェント Skills** は `<workspace>/.agents/skills` にあり、
  通常の workspace `skills/` フォルダーより前にその workspace に適用されます。
- **個人エージェント Skills** は `~/.agents/skills` にあり、
  そのマシン上の複数 workspace にまたがって適用されます。
- **共有 Skills** は `~/.openclaw/skills`（managed/local）にあり、
  同じマシン上の **すべてのエージェント** から見えます。
- 複数エージェントで使う共通の Skills パックが必要なら、
  `skills.load.extraDirs`（最低優先度）で **共有フォルダー** を追加することもできます。

同じ skill 名が複数の場所に存在する場合は、通常の優先順位が
適用されます: workspace が優先され、その次が project agent Skills、personal agent skills、
managed/local、bundled、extra dirs の順です。

## エージェント Skill allowlist

Skill の **場所** と Skill の **可視性** は別の制御です。

- 場所/優先順位は、同名 skill のどのコピーが勝つかを決定します。
- エージェント allowlist は、可視な Skills のうちそのエージェントが実際に使えるものを決定します。

共有ベースラインには `agents.defaults.skills` を使い、エージェント単位の上書きには
`agents.list[].skills` を使います。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // github, weather を継承
      { id: "docs", skills: ["docs-search"] }, // defaults を置き換える
      { id: "locked-down", skills: [] }, // Skills なし
    ],
  },
}
```

ルール:

- デフォルトで Skills を無制限にするには `agents.defaults.skills` を省略します。
- `agents.defaults.skills` を継承するには `agents.list[].skills` を省略します。
- Skills なしにするには `agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストはそのエージェントの最終セットであり、
  defaults とはマージされません。

OpenClaw は、有効なエージェント Skill セットを、プロンプト構築、Skill の
slash-command 検出、sandbox sync、および Skill snapshot 全体に適用します。

## Plugins + Skills

Plugins は、`openclaw.plugin.json` に `skills` ディレクトリを列挙することで
独自の Skills を同梱できます（plugin ルートからの相対パス）。plugin の Skills は
plugin が有効なときに読み込まれます。現時点では、それらのディレクトリは
`skills.load.extraDirs` と同じ低優先度パスにマージされるため、同名の bundled、
managed、agent、または workspace skill がそれらを上書きします。
plugin の設定エントリ上で `metadata.openclaw.requires.config` によりゲートできます。
検出/設定については [Plugins](/tools/plugin)、それらの Skills が教える
ツールサーフェスについては [Tools](/tools) を参照してください。

## ClawHub（インストール + 同期）

ClawHub は OpenClaw の公開 Skills レジストリです。
[https://clawhub.ai](https://clawhub.ai) で参照できます。Skills の検出/インストール/更新には
ネイティブの `openclaw skills`
コマンドを使用し、公開/同期ワークフローが必要な場合は別の `clawhub` CLI を使ってください。
完全ガイド: [ClawHub](/tools/clawhub)。

一般的なフロー:

- workspace に skill をインストールする:
  - `openclaw skills install <skill-slug>`
- インストール済みのすべての Skills を更新する:
  - `openclaw skills update --all`
- 同期する（スキャン + 更新を公開）:
  - `clawhub sync --all`

ネイティブの `openclaw skills install` は、アクティブな workspace の `skills/`
ディレクトリにインストールします。別個の `clawhub` CLI も、現在の作業ディレクトリ配下の `./skills`
にインストールします（または設定済みの OpenClaw workspace にフォールバックします）。
OpenClaw は次のセッションでそれを `<workspace>/skills` として検出します。

## セキュリティ上の注意

- サードパーティの Skills は **信頼されていないコード** として扱ってください。有効化する前に読んでください。
- 信頼できない入力や危険なツールには sandboxed 実行を優先してください。[Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。
- workspace と extra-dir の skill 検出では、解決された realpath が設定済みルート内にとどまる skill ルートと `SKILL.md` ファイルのみを受け付けます。
- Gateway バックの skill 依存関係インストール（`skills.install`、オンボーディング、および Skills 設定 UI）は、installer metadata を実行する前に組み込みの dangerous-code scanner を実行します。`critical` な検出結果は、呼び出し側が明示的に dangerous override を設定しない限り、デフォルトでブロックされます。疑わしい検出結果は警告のみです。
- `openclaw skills install <slug>` は異なります。これは ClawHub の skill フォルダーを workspace にダウンロードし、上記の installer-metadata パスは使用しません。
- `skills.entries.*.env` と `skills.entries.*.apiKey` は、そのエージェントターンに対して **host** プロセスへ secret を注入します
  （sandbox ではありません）。secret をプロンプトやログに含めないでください。
- より広い脅威モデルとチェックリストについては [Security](/ja-JP/gateway/security) を参照してください。

## 形式（AgentSkills + Pi 互換）

`SKILL.md` には少なくとも次が必要です。

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

補足:

- レイアウト/意図については AgentSkills 仕様に従っています。
- 組み込みエージェントで使われる parser は **single-line** frontmatter キーのみをサポートします。
- `metadata` は **single-line JSON object** である必要があります。
- skill フォルダーパスを参照するには、説明内で `{baseDir}` を使用してください。
- 任意の frontmatter キー:
  - `homepage` — macOS Skills UI で「Website」として表示される URL（`metadata.openclaw.homepage` 経由でもサポート）。
  - `user-invocable` — `true|false`（デフォルト: `true`）。`true` の場合、この skill はユーザー slash command として公開されます。
  - `disable-model-invocation` — `true|false`（デフォルト: `false`）。`true` の場合、この skill は model prompt から除外されます（ユーザー呼び出しでは引き続き利用可能）。
  - `command-dispatch` — `tool`（任意）。`tool` に設定すると、slash command は model をバイパスしてツールへ直接ディスパッチされます。
  - `command-tool` — `command-dispatch: tool` が設定されているときに呼び出すツール名。
  - `command-arg-mode` — `raw`（デフォルト）。ツールディスパッチでは、生の args 文字列をそのままツールへ転送します（core 側の解析なし）。

    ツールは次の params で呼び出されます:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。

## ゲーティング（ロード時フィルター）

OpenClaw は `metadata`（single-line JSON）を使って **ロード時に Skills をフィルタリング** します。

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

`metadata.openclaw` 配下のフィールド:

- `always: true` — 常にその skill を含めます（他のゲートをスキップ）。
- `emoji` — macOS Skills UI で使われる任意の絵文字。
- `homepage` — macOS Skills UI で「Website」として表示される任意の URL。
- `os` — 任意のプラットフォーム一覧（`darwin`、`linux`、`win32`）。設定されている場合、その skill はその OS でのみ対象になります。
- `requires.bins` — 一覧。各項目が `PATH` 上に存在する必要があります。
- `requires.anyBins` — 一覧。少なくとも 1 つが `PATH` 上に存在する必要があります。
- `requires.env` — 一覧。env var が存在する **か**、設定で提供されている必要があります。
- `requires.config` — truthy でなければならない `openclaw.json` パスの一覧。
- `primaryEnv` — `skills.entries.<name>.apiKey` に関連付けられる env var 名。
- `install` — macOS Skills UI で使われる installer spec の任意配列（brew/node/go/uv/download）。

sandboxing に関する補足:

- `requires.bins` は、skill ロード時に **host** 上でチェックされます。
- エージェントが sandboxed の場合、そのバイナリーは **container 内にも** 存在する必要があります。
  `agents.defaults.sandbox.docker.setupCommand`（または custom image）でインストールしてください。
  `setupCommand` は container 作成後に 1 回実行されます。
  パッケージインストールには、network egress、書き込み可能な root FS、そして sandbox 内の root ユーザーも必要です。
  例: `summarize` skill（`skills/summarize/SKILL.md`）がそこで実行されるには、
  `summarize` CLI が sandbox container 内に必要です。

installer の例:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

補足:

- 複数の installer が列挙されている場合、gateway は **単一の** 優先オプションを選びます（brew が利用可能なら brew、そうでなければ node）。
- すべての installer が `download` の場合、OpenClaw は利用可能なアーティファクトを見られるよう各エントリを列挙します。
- installer spec には `os: ["darwin"|"linux"|"win32"]` を含めて、プラットフォーム別に選択肢をフィルタリングできます。
- Node インストールは `openclaw.json` 内の `skills.install.nodeManager` に従います（デフォルト: npm。選択肢: npm/pnpm/yarn/bun）。
  これは **skill インストール** にのみ影響します。Gateway ランタイムは引き続き Node
  であるべきです（WhatsApp/Telegram では Bun は推奨されません）。
- Gateway バックの installer 選択は node-only ではなく、優先度駆動です:
  install spec に複数 kind が混在している場合、OpenClaw は
  `skills.install.preferBrew` が有効で `brew` が存在すれば Homebrew を優先し、その後 `uv`、次に設定済みの node manager、その後 `go` や `download` などの他のフォールバックを使います。
- すべての install spec が `download` の場合、OpenClaw は 1 つの優先 installer にまとめず、
  すべての download オプションを表示します。
- Go インストール: `go` がなく `brew` が利用可能な場合、gateway は先に Homebrew で Go をインストールし、可能なら `GOBIN` を Homebrew の `bin` に設定します。
- Download インストール: `url`（必須）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（デフォルト: archive 検出時は自動）、`stripComponents`、`targetDir`（デフォルト: `~/.openclaw/tools/<skillKey>`）。

`metadata.openclaw` が存在しない場合、その skill は常に対象になります
（設定で無効化されている場合、または bundled skill に対して `skills.allowBundled` でブロックされている場合を除く）。

## 設定上書き（`~/.openclaw/openclaw.json`）

bundled/managed Skills は切り替え可能で、env 値も提供できます。

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // または plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

補足: skill 名にハイフンが含まれる場合はキーを引用してください（JSON5 では quoted key が使えます）。

OpenClaw 自体の中で標準の画像生成/編集を使いたい場合は、bundled
skill ではなく、`agents.defaults.imageGenerationModel` とともに core の
`image_generate` ツールを使用してください。ここでの skill 例は custom または third-party ワークフロー向けです。

ネイティブの画像解析には `agents.defaults.imageModel` とともに `image` ツールを使ってください。
ネイティブの画像生成/編集には
`agents.defaults.imageGenerationModel` とともに `image_generate` を使ってください。`openai/*`、`google/*`、
`fal/*`、または他の provider 固有の画像モデルを選ぶ場合は、その provider の auth/API
キーも追加してください。

設定キーはデフォルトで **skill 名** に一致します。skill が
`metadata.openclaw.skillKey` を定義している場合は、
`skills.entries` 配下でそのキーを使用してください。

ルール:

- `enabled: false` は、bundled/installed であってもその skill を無効化します。
- `env`: 変数が process 内でまだ設定されていない **場合のみ** 注入されます。
- `apiKey`: `metadata.openclaw.primaryEnv` を宣言した skill 向けの
  便利機能。plaintext string または SecretRef object（`{ source, provider, id }`）をサポートします。
- `config`: custom な skill ごとのフィールドのための任意の bag。custom key はここに置く必要があります。
- `allowBundled`: **bundled** Skills 専用の任意の allowlist。設定した場合、
  一覧内の bundled skill のみが対象になります（managed/workspace Skills には影響しません）。

## 環境注入（エージェント実行単位）

エージェント実行が始まると、OpenClaw は次を行います。

1. skill metadata を読み取る。
2. `skills.entries.<key>.env` または `skills.entries.<key>.apiKey` を
   `process.env` に適用する。
3. **対象となる** Skills を使って system prompt を構築する。
4. 実行終了後、元の環境を復元する。

これは **エージェント実行単位** であり、グローバルな shell 環境ではありません。

## セッション snapshot（パフォーマンス）

OpenClaw は、**セッション開始時に** 対象となる Skills を snapshot し、同じセッション内の以降のターンでその一覧を再利用します。Skills または設定の変更は、次の新しいセッションで反映されます。

Skills watcher が有効な場合、または新しい対象 remote node が現れた場合、Skills はセッション途中でも更新されることがあります（下記参照）。これは **ホットリロード** と考えてください: 更新された一覧は次のエージェントターンで取り込まれます。

そのセッションの有効なエージェント Skill allowlist が変わった場合、OpenClaw
は snapshot を更新し、可視な Skills が現在のエージェントと一致した状態を保ちます。

## リモート macOS node（Linux gateway）

Gateway が Linux 上で動作していて、**macOS node** が **`system.run` 許可あり**
（Exec approvals security が `deny` ではない）で接続されている場合、OpenClaw は
必要なバイナリーがその node 上に存在すれば、macOS 専用 Skills を対象として扱えます。エージェントはそれらの Skills を `exec` ツールで `host=node` として実行すべきです。

これは、node がその command support を報告し、`system.run` による bin probe を行うことに依存します。後で macOS node がオフラインになっても、Skills は表示されたままです。node が再接続するまで呼び出しは失敗する可能性があります。

## Skills watcher（自動更新）

デフォルトでは、OpenClaw は skill フォルダーを監視し、`SKILL.md` ファイルが変わると Skills snapshot を更新します。これは `skills.load` 配下で設定します。

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## トークンへの影響（Skills 一覧）

Skills が対象になると、OpenClaw は利用可能な Skills のコンパクトな XML 一覧を system prompt に注入します（`pi-coding-agent` の `formatSkillsForPrompt` 経由）。コストは決定的です。

- **ベースオーバーヘッド（1 つ以上の skill がある場合のみ）:** 195 文字。
- **skill ごと:** 97 文字 + XML エスケープされた `<name>`、`<description>`、`<location>` の長さ。

式（文字数）:

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

補足:

- XML エスケープでは `& < > " '` がエンティティ（`&amp;`、`&lt;` など）に展開され、長さが増えます。
- トークン数は model tokenizer によって異なります。OpenAI 風の概算では約 4 文字/トークンなので、**97 文字 ≈ 24 トークン**/skill に実際のフィールド長が加わります。

## managed Skills のライフサイクル

OpenClaw は、インストール
（npm パッケージまたは OpenClaw.app）の一部として、ベースラインの Skills 一式を **bundled Skills** として同梱します。`~/.openclaw/skills` はローカル
上書き用です（たとえば、bundled
コピーを変更せずに skill を pin/patch する場合）。workspace Skills はユーザー所有であり、名前の競合時には両方を上書きします。

## 設定リファレンス

完全な設定スキーマは [Skills config](/tools/skills-config) を参照してください。

## もっと多くの Skills を探していますか？

[https://clawhub.ai](https://clawhub.ai) を参照してください。

---

## 関連

- [Creating Skills](/tools/creating-skills) — custom Skills の作成
- [Skills Config](/tools/skills-config) — Skill 設定リファレンス
- [Slash Commands](/tools/slash-commands) — 利用可能なすべての slash command
- [Plugins](/tools/plugin) — plugin システム概要
