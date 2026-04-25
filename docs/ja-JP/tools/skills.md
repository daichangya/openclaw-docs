---
read_when:
    - |-
      Skills を追加または変更するម្ប്രായassistant to=functions.read մեկնաբանություն +天天中彩票  北京赛车女json
      {"path":"/home/runner/work/docs/docs/source/docs/skills/index.mdx"}
    - Skills のゲート設定または読み込みルールを変更する
summary: 'Skills: 管理対象とワークスペース、ゲートルール、config/env の配線'
title: Skills
x-i18n:
    generated_at: "2026-04-25T14:01:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44f946d91588c878754340aaf55e0e3b9096bba12aea36fb90c445cd41e4f892
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw は、エージェントにツールの使い方を教えるために **[AgentSkills](https://agentskills.io) 互換** の skill フォルダーを使います。各 skill は、YAML frontmatter と手順を含む `SKILL.md` を持つディレクトリです。OpenClaw は **同梱 Skills** と任意のローカル上書きを読み込み、環境、config、バイナリの有無に基づいて読み込み時にフィルタリングします。

## 配置場所と優先順位

OpenClaw は、次のソースから Skills を読み込みます。

1. **追加 skill フォルダー**: `skills.load.extraDirs` で設定
2. **同梱 Skills**: インストール物（npm package または OpenClaw.app）に同梱
3. **管理対象/ローカル Skills**: `~/.openclaw/skills`
4. **個人エージェント Skills**: `~/.agents/skills`
5. **プロジェクトエージェント Skills**: `<workspace>/.agents/skills`
6. **ワークスペース Skills**: `<workspace>/skills`

skill 名が競合する場合の優先順位は次のとおりです。

`<workspace>/skills`（最高）→ `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 同梱 Skills → `skills.load.extraDirs`（最低）

## エージェント単位の Skills と共有 Skills

**マルチエージェント** 構成では、各エージェントが独自のワークスペースを持ちます。つまり:

- **エージェント単位の Skills** は、そのエージェント専用の `<workspace>/skills` に置かれます。
- **プロジェクトエージェント Skills** は `<workspace>/.agents/skills` に置かれ、通常のワークスペース `skills/` フォルダーより前にそのワークスペースへ適用されます。
- **個人エージェント Skills** は `~/.agents/skills` に置かれ、そのマシン上のワークスペース全体に適用されます。
- **共有 Skills** は `~/.openclaw/skills`（管理対象/ローカル）に置かれ、同じマシン上の **すべてのエージェント** から見えます。
- **共有フォルダー** は `skills.load.extraDirs`（最低優先順位）経由でも追加でき、複数エージェントで共通の skills pack を使いたい場合に利用できます。

同じ skill 名が複数の場所に存在する場合、通常の優先順位が適用されます。ワークスペースが優先され、その次にプロジェクトエージェント Skills、個人エージェント Skills、管理対象/ローカル、同梱、追加ディレクトリの順です。

## エージェント skill allowlist

skill の **場所** と skill の **可視性** は別の制御です。

- 場所/優先順位は、同名 skill のどのコピーが勝つかを決めます。
- エージェント allowlist は、見えている skill のうち、そのエージェントが実際に使えるものを決めます。

共有ベースラインには `agents.defaults.skills` を使い、エージェント単位の上書きには `agents.list[].skills` を使います。

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

- デフォルトで skills を無制限にするには `agents.defaults.skills` を省略します。
- `agents.defaults.skills` を継承するには `agents.list[].skills` を省略します。
- Skills なしにするには `agents.list[].skills: []` を設定します。
- 空でない `agents.list[].skills` リストは、そのエージェントの最終セットです。defaults とはマージされません。

OpenClaw は、有効なエージェント skill セットを、prompt 構築、skill のスラッシュコマンド検出、sandbox 同期、skill スナップショット全体に適用します。

## Plugins + Skills

Plugins は、`openclaw.plugin.json` に `skills` ディレクトリ（Plugin ルートからの相対パス）を列挙することで、自身の Skills を同梱できます。Plugin Skills は、その Plugin が有効なときに読み込まれます。これは、ツール説明には長すぎるが、Plugin がインストールされている限り常に利用可能であるべき、ツール固有の運用ガイドに適した場所です。たとえば browser Plugin は、複数ステップのブラウザー制御のために `browser-automation` skill を同梱しています。現在、それらのディレクトリは `skills.load.extraDirs` と同じ低優先順位パスにマージされるため、同名の同梱 skill、管理対象 skill、agent skill、または workspace skill がそれらを上書きします。
Plugin の config エントリにある `metadata.openclaw.requires.config` を使ってそれらをゲートできます。検出/config については [Plugins](/ja-JP/tools/plugin) を、これらの skill が教えるツールサーフェスについては [Tools](/ja-JP/tools) を参照してください。

## Skill Workshop

任意の実験的な Skill Workshop Plugin は、エージェント作業中に観測された再利用可能な手順から、workspace Skills を作成または更新できます。これはデフォルトで無効であり、`plugins.entries.skill-workshop` を通じて明示的に有効化する必要があります。

Skill Workshop は `<workspace>/skills` にのみ書き込み、生成されたコンテンツをスキャンし、保留承認または自動安全書き込みをサポートし、安全でない提案を隔離し、書き込み成功後に skill スナップショットを更新するため、Gateway の再起動なしで新しい Skills が利用可能になります。

「次回は GIF の attribution を確認すること」のような修正や、メディア QA チェックリストのような苦労して得たワークフローを、永続的な手順として残したい場合に使ってください。まずは保留承認から始め、自動書き込みは、提案を確認したうえで信頼できるワークスペースでのみ使用してください。完全ガイド:
[Skill Workshop Plugin](/ja-JP/plugins/skill-workshop)。

## ClawHub（インストール + 同期）

ClawHub は OpenClaw の公開 skills レジストリです。閲覧先:
[https://clawhub.ai](https://clawhub.ai)。ネイティブの `openclaw skills`
コマンドを使って skill を検出/インストール/更新するか、公開/同期ワークフローが必要な場合は別の `clawhub` CLI を使います。
完全ガイド: [ClawHub](/ja-JP/tools/clawhub)。

一般的なフロー:

- ワークスペースに skill をインストールする:
  - `openclaw skills install <skill-slug>`
- インストール済み skill をすべて更新する:
  - `openclaw skills update --all`
- 同期（スキャン + 更新を公開）:
  - `clawhub sync --all`

ネイティブの `openclaw skills install` は、アクティブなワークスペースの `skills/`
ディレクトリにインストールします。別の `clawhub` CLI も、現在の作業ディレクトリ配下の `./skills` にインストールします（または設定済みの OpenClaw workspace にフォールバックします）。
OpenClaw は次のセッションで、それを `<workspace>/skills` として認識します。

## セキュリティに関する注意

- サードパーティ Skill は **信頼されていないコード** として扱ってください。有効化前に読んでください。
- 信頼できない入力や危険なツールには、sandbox 実行を優先してください。[Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。
- workspace および extra-dir の skill 検出では、解決後 realpath が設定済みルート内に収まる skill ルートと `SKILL.md` ファイルのみを受け付けます。
- Gateway を介した skill 依存関係インストール（`skills.install`、オンボーディング、および Skills 設定 UI）は、インストーラーメタデータを実行する前に組み込みの dangerous-code scanner を実行します。`critical` 検出は、呼び出し元が明示的に dangerous override を設定しない限りデフォルトでブロックされます。suspicious 検出は警告のみです。
- `openclaw skills install <slug>` はこれとは異なります。これは ClawHub の skill フォルダーを workspace にダウンロードするものであり、上記の installer-metadata パスは使いません。
- `skills.entries.*.env` と `skills.entries.*.apiKey` は、そのエージェントターンの **ホスト** プロセスに secret を注入します
  （sandbox ではありません）。secret を prompt やログに含めないでください。
- より広い脅威モデルとチェックリストについては、[Security](/ja-JP/gateway/security) を参照してください。

## 形式（AgentSkills + Pi 互換）

`SKILL.md` には、少なくとも次が必要です。

```markdown
---
name: image-lab
description: provider-backed の画像ワークフローで画像を生成または編集する
---
```

注記:

- レイアウト/意図については AgentSkills spec に従います。
- 組み込みエージェントで使われるパーサーは、**単一行** frontmatter キーのみをサポートします。
- `metadata` は **単一行の JSON object** にする必要があります。
- skill フォルダーパスを参照するには、手順内で `{baseDir}` を使ってください。
- 任意の frontmatter キー:
  - `homepage` — macOS Skills UI で「Website」として表示される URL（`metadata.openclaw.homepage` 経由でもサポート）。
  - `user-invocable` — `true|false`（デフォルト: `true`）。`true` の場合、この skill はユーザーのスラッシュコマンドとして公開されます。
  - `disable-model-invocation` — `true|false`（デフォルト: `false`）。`true` の場合、この skill はモデル prompt から除外されます（ユーザー呼び出しでは引き続き利用可能）。
  - `command-dispatch` — `tool`（任意）。`tool` に設定すると、スラッシュコマンドはモデルをバイパスして直接ツールへディスパッチされます。
  - `command-tool` — `command-dispatch: tool` が設定されているときに呼び出すツール名。
  - `command-arg-mode` — `raw`（デフォルト）。ツールディスパッチでは、生の引数文字列をそのままツールへ渡します（コア側での解析なし）。

    ツールは次の params で呼び出されます:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。

## ゲート設定（読み込み時フィルター）

OpenClaw は、`metadata`（単一行 JSON）を使って **読み込み時に Skills をフィルタリング** します。

```markdown
---
name: image-lab
description: provider-backed の画像ワークフローで画像を生成または編集する
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
- `os` — 任意のプラットフォーム一覧（`darwin`、`linux`、`win32`）。設定されている場合、その skill はそれらの OS でのみ対象になります。
- `requires.bins` — リスト。各項目が `PATH` 上に存在していなければなりません。
- `requires.anyBins` — リスト。少なくとも 1 つが `PATH` 上に存在していなければなりません。
- `requires.env` — リスト。env var が存在するか、config で提供されていなければなりません。
- `requires.config` — truthy でなければならない `openclaw.json` パスの一覧。
- `primaryEnv` — `skills.entries.<name>.apiKey` に関連付けられる env var 名。
- `install` — macOS Skills UI で使われる installer spec の任意配列（brew/node/go/uv/download）。

`metadata.openclaw` がない場合、レガシーの `metadata.clawdbot` ブロックも引き続き受け付けられるため、古くインストールされた skill でも依存関係ゲートと installer ヒントを維持できます。新規および更新済み skill では
`metadata.openclaw` を使うべきです。

sandboxing に関する注記:

- `requires.bins` は、skill 読み込み時に **ホスト** 上で確認されます。
- エージェントが sandbox 化されている場合、そのバイナリは **コンテナー内** にも存在していなければなりません。
  `agents.defaults.sandbox.docker.setupCommand`（またはカスタムイメージ）を使ってインストールしてください。
  `setupCommand` は、コンテナー作成後に 1 回だけ実行されます。
  package インストールには network egress、書き込み可能な root FS、sandbox 内の root user も必要です。
  例: `summarize` skill（`skills/summarize/SKILL.md`）は、そこで実行するには sandbox コンテナー内に `summarize` CLI が必要です。

installer の例:

```markdown
---
name: gemini
description: Gemini CLI をコーディング支援と Google 検索参照に使う。
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
              "label": "Gemini CLI をインストールする（brew）",
            },
          ],
      },
  }
---
```

注記:

- 複数の installer が列挙されている場合、gateway は **1 つの** 優先オプションを選びます（利用可能なら brew、そうでなければ node）。
- すべての installer が `download` の場合、OpenClaw は利用可能な artifact が見えるよう各エントリを列挙します。
- installer spec には `os: ["darwin"|"linux"|"win32"]` を含めることができ、プラットフォームごとにオプションをフィルタリングできます。
- Node インストールは `openclaw.json` の `skills.install.nodeManager` に従います（デフォルト: npm、選択肢: npm/pnpm/yarn/bun）。
  これは **skill インストール** にのみ影響します。Gateway ランタイムは引き続き Node
  を使うべきです（WhatsApp/Telegram では Bun は推奨されません）。
- Gateway を介した installer 選択は、node 専用ではなく優先設定駆動です:
  install spec に複数の kind が混在している場合、OpenClaw は
  `skills.install.preferBrew` が有効で `brew` が存在すれば Homebrew を優先し、その次に `uv`、その次に設定済みの node manager、その次に `go` や `download` のような他のフォールバックを優先します。
- すべての install spec が `download` の場合、OpenClaw は 1 つの優先 installer に畳み込まず、すべての download オプションを表示します。
- Go インストール: `go` がなく `brew` が利用可能な場合、gateway はまず Homebrew 経由で Go をインストールし、可能なら `GOBIN` を Homebrew の `bin` に設定します。
- Download インストール: `url`（必須）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（デフォルト: archive 検出時は自動）、`stripComponents`、`targetDir`（デフォルト: `~/.openclaw/tools/<skillKey>`）。

`metadata.openclaw` が存在しない場合、その skill は常に対象になります（config で無効化されている場合、または同梱 skill に対して `skills.allowBundled` でブロックされている場合を除く）。

## config の上書き（`~/.openclaw/openclaw.json`）

同梱/管理対象 skill は、有効化/無効化したり、env 値を与えたりできます。

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // または plaintext 文字列
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

注記: skill 名にハイフンが含まれる場合は、キーをクォートしてください（JSON5 ではクォート付きキーが使えます）。

OpenClaw 自体の中で標準的な画像生成/編集を使いたい場合は、同梱 skill ではなく、`agents.defaults.imageGenerationModel` を指定してコアの
`image_generate` ツールを使ってください。ここでの skill 例は、カスタムまたはサードパーティワークフロー向けです。

ネイティブな画像解析には `agents.defaults.imageModel` とともに `image` ツールを使ってください。
ネイティブな画像生成/編集には
`agents.defaults.imageGenerationModel` とともに `image_generate` を使ってください。`openai/*`、`google/*`、
`fal/*`、または他の provider 固有の画像 model を選ぶ場合は、その provider の auth/API
キーも追加してください。

config キーは、デフォルトでは **skill 名** に一致します。skill が
`metadata.openclaw.skillKey` を定義している場合は、`skills.entries` の下でそのキーを使ってください。

ルール:

- `enabled: false` は、その skill が同梱/インストール済みであっても無効にします。
- `env`: その変数が process にまだ設定されていない **場合にのみ** 注入されます。
- `apiKey`: `metadata.openclaw.primaryEnv` を宣言する skill 向けの簡易指定です。
  plaintext 文字列または SecretRef object（`{ source, provider, id }`）をサポートします。
- `config`: カスタムな skill 単位フィールドのための任意の bag です。カスタムキーはここに置かなければなりません。
- `allowBundled`: **同梱** skill のみを対象とする任意の allowlist です。設定した場合、
  リスト内の同梱 skill だけが対象になります（管理対象/workspace skill には影響しません）。

## 環境注入（エージェント実行ごと）

エージェント実行が始まると、OpenClaw は次を行います。

1. skill metadata を読み込む。
2. `skills.entries.<key>.env` または `skills.entries.<key>.apiKey` を
   `process.env` に適用する。
3. **対象** skill を使って system prompt を構築する。
4. 実行終了後に元の環境を復元する。

これは **エージェント実行にスコープされたもの** であり、グローバルなシェル環境ではありません。

同梱の `claude-cli` バックエンドでは、OpenClaw は同じ対象スナップショットを一時的な Claude Code plugin として実体化し、`--plugin-dir` で渡します。これにより Claude Code はネイティブの skill resolver を使えますが、優先順位、エージェント単位 allowlist、ゲート設定、`skills.entries.*` の env/API キー注入は引き続き OpenClaw が管理します。その他の CLI バックエンドでは prompt catalog のみを使います。

## セッションスナップショット（パフォーマンス）

OpenClaw は、**セッション開始時** に対象 skill をスナップショットし、同じセッションの後続ターンではその一覧を再利用します。skill または config の変更は、次に新しく始めるセッションで有効になります。

skills watcher が有効な場合、または新しい対象の remote node が出現した場合（下記参照）、Skills はセッション途中でも更新できます。これは **ホットリロード** と考えてください。更新後の一覧は次のエージェントターンで反映されます。

そのセッションに対する有効なエージェント skill allowlist が変わると、OpenClaw はスナップショットを更新し、見えている skill が現在のエージェントと一致したままになるようにします。

## リモート macOS node（Linux gateway）

Gateway が Linux 上で動作していても、**`system.run` が許可された状態で** **macOS node** が接続されていれば（Exec approvals のセキュリティが `deny` に設定されていない）、必要なバイナリがその node 上に存在する場合、OpenClaw は macOS 専用 skill を対象として扱えます。エージェントはそれらの skill を `exec` ツールで `host=node` を指定して実行するべきです。

これは、その node がコマンド対応状況を報告し、`system.run` による bin probe を行えることに依存します。後で macOS node がオフラインになっても、skills は表示されたままです。node が再接続するまでは呼び出しが失敗する可能性があります。

## Skills watcher（自動更新）

デフォルトでは、OpenClaw は skill フォルダーを監視し、`SKILL.md` ファイルが変わると skills スナップショットを更新します。これは `skills.load` 配下で設定します。

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

## トークンへの影響（skills 一覧）

skill が対象になると、OpenClaw は利用可能な Skills の簡潔な XML 一覧を system prompt に注入します（`pi-coding-agent` の `formatSkillsForPrompt` 経由）。コストは決定的です。

- **ベースオーバーヘッド（1 件以上の skill がある場合のみ）:** 195 文字。
- **skill ごと:** 97 文字 + XML エスケープ済みの `<name>`、`<description>`、`<location>` の長さ。

式（文字数）:

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

注記:

- XML エスケープでは `& < > " '` が実体参照（`&amp;`、`&lt;` など）に展開されるため、長さが増えます。
- トークン数は model の tokenizer によって異なります。OpenAI 風の概算ではおよそ 4 文字/トークンなので、**97 文字 ≈ 24 トークン** が skill ごとにかかり、これに実際のフィールド長が加わります。

## 管理対象 Skills のライフサイクル

OpenClaw は、インストール物（npm package または OpenClaw.app）の一部として、ベースラインとなる Skills を **同梱 Skills** として提供します。`~/.openclaw/skills` は、ローカル上書き用に存在します（たとえば、同梱コピーを変えずに skill を固定/パッチする場合）。Workspace Skills はユーザー所有であり、名前が競合する場合は両方を上書きします。

## config リファレンス

完全な設定スキーマは [Skills config](/ja-JP/tools/skills-config) を参照してください。

## さらに Skills を探すには

[https://clawhub.ai](https://clawhub.ai) を参照してください。

---

## 関連

- [Creating Skills](/ja-JP/tools/creating-skills) — カスタム Skills の作成
- [Skills Config](/ja-JP/tools/skills-config) — Skill 設定リファレンス
- [Slash Commands](/ja-JP/tools/slash-commands) — 利用可能なすべてのスラッシュコマンド
- [Plugins](/ja-JP/tools/plugin) — Plugin システム概要
