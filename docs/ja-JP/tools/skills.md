---
read_when:
    - Skillsの追加または変更
    - Skillのゲーティングまたは読み込みルールの変更
summary: 'Skills: managedとworkspace、ゲーティングルール、およびconfig/envの配線'
title: Skills
x-i18n:
    generated_at: "2026-04-22T04:28:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2ff6a3a92bc3c1c3892620a00e2eb01c73364bc6388a3513943defa46e49749
    source_path: tools/skills.md
    workflow: 15
---

# Skills（OpenClaw）

OpenClawは、エージェントにツールの使い方を教えるために**[AgentSkills](https://agentskills.io)互換**のskillフォルダーを使用します。各skillは、YAML frontmatterと指示を含む`SKILL.md`を持つディレクトリです。OpenClawは**バンドル済みSkills**と任意のローカル上書きを読み込み、環境、設定、バイナリの存在に基づいて読み込み時にフィルタリングします。

## 場所と優先順位

OpenClawは次のソースからSkillsを読み込みます。

1. **追加skillフォルダー**: `skills.load.extraDirs`で設定
2. **バンドル済みSkills**: インストールとともに配布されるもの（npm packageまたはOpenClaw.app）
3. **managed/local skills**: `~/.openclaw/skills`
4. **個人agent skills**: `~/.agents/skills`
5. **プロジェクトagent skills**: `<workspace>/.agents/skills`
6. **workspace skills**: `<workspace>/skills`

skill名が衝突した場合の優先順位は次のとおりです。

`<workspace>/skills`（最高）→ `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → バンドル済みSkills → `skills.load.extraDirs`（最低）

## エージェントごとのSkillsと共有Skills

**multi-agent**構成では、各agentはそれぞれ独自のworkspaceを持ちます。つまり:

- **エージェントごとのSkills**は、そのagent専用の`<workspace>/skills`にあります。
- **プロジェクトagent skills**は`<workspace>/.agents/skills`にあり、通常のworkspace `skills/`フォルダーより前にそのworkspaceへ適用されます。
- **個人agent skills**は`~/.agents/skills`にあり、そのマシン上のworkspace全体に適用されます。
- **共有Skills**は`~/.openclaw/skills`（managed/local）にあり、同じマシン上の**すべてのagent**から見えます。
- **共有フォルダー**は、複数agentで使う共通skill packが欲しい場合、`skills.load.extraDirs`経由でも追加できます（最低優先順位）。

同じskill名が複数箇所に存在する場合、通常の優先順位が適用されます。workspaceが勝ち、次にproject agent skills、次にpersonal agent skills、次にmanaged/local、次にbundled、最後にextra dirsです。

## エージェントskill許可リスト

skillの**場所**とskillの**可視性**は別の制御です。

- 場所/優先順位は、同名skillのどのコピーが勝つかを決定します。
- agent許可リストは、見えているskillのうち、そのagentが実際にどれを使えるかを決定します。

共通のベースラインには`agents.defaults.skills`を使用し、agentごとの上書きには`agents.list[].skills`を使います。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // github, weather を継承
      { id: "docs", skills: ["docs-search"] }, // defaults を置き換える
      { id: "locked-down", skills: [] }, // Skillsなし
    ],
  },
}
```

ルール:

- デフォルトでskill無制限にするには`agents.defaults.skills`を省略します。
- `agents.defaults.skills`を継承するには`agents.list[].skills`を省略します。
- Skillsなしにするには`agents.list[].skills: []`を設定します。
- 空でない`agents.list[].skills`一覧は、そのagentの最終セットです。defaultsとはマージされません。

OpenClawは、実効agent skillセットを、プロンプト構築、skill slash command検出、sandbox同期、skill snapshot全体に適用します。

## Plugins + Skills

Pluginsは、`openclaw.plugin.json`で`skills`ディレクトリ（pluginルートからの相対パス）を列挙することで、自身のSkillsを同梱できます。pluginが有効なときにplugin skillが読み込まれます。現在、これらのディレクトリは`skills.load.extraDirs`と同じ低優先順位パスにマージされるため、同名のbundled、managed、agent、またはworkspace skillがそれらを上書きします。
pluginのconfigエントリ上の`metadata.openclaw.requires.config`経由でゲートできます。検出/設定については[Plugins](/ja-JP/tools/plugin)、それらのSkillsが教えるtool surfaceについては[Tools](/ja-JP/tools)を参照してください。

## Skill Workshop

任意の実験的なSkill Workshop pluginは、agent作業中に観測された再利用可能な手順からworkspace skillを作成または更新できます。これはデフォルトでは無効で、`plugins.entries.skill-workshop`を通じて明示的に有効化する必要があります。

Skill Workshopは`<workspace>/skills`にのみ書き込み、生成コンテンツをスキャンし、保留承認または自動安全書き込みをサポートし、安全でない提案を隔離し、書き込み成功後にskill snapshotを更新するため、新しいSkillsをGateway再起動なしで利用可能にできます。

「次回はGIF attributionを確認する」のような修正や、media QA checklistのような苦労して得たworkflowを、永続的な手順指示にしたいときに使ってください。まずは保留承認から始め、提案内容を確認したうえで、信頼できるworkspaceに限って自動書き込みを使ってください。完全なガイド:
[Skill Workshop Plugin](/ja-JP/plugins/skill-workshop)。

## ClawHub（インストール + 同期）

ClawHubはOpenClaw向けの公開Skillsレジストリです。閲覧先:
[https://clawhub.ai](https://clawhub.ai)。skillの検出/インストール/更新にはネイティブ`openclaw skills`コマンドを使用し、公開/同期workflowが必要な場合は別の`clawhub` CLIを使用してください。
完全なガイド: [ClawHub](/ja-JP/tools/clawhub)。

一般的なフロー:

- workspaceにskillをインストールする:
  - `openclaw skills install <skill-slug>`
- インストール済みのすべてのskillを更新する:
  - `openclaw skills update --all`
- 同期（スキャン + 更新を公開）:
  - `clawhub sync --all`

ネイティブの`openclaw skills install`は、アクティブなworkspaceの`skills/`ディレクトリにインストールします。別の`clawhub` CLIも、現在の作業ディレクトリ配下の`./skills`にインストールします（または設定済みOpenClaw workspaceへフォールバックします）。OpenClawは次のセッションでそれを`<workspace>/skills`として認識します。

## セキュリティに関する注意

- サードパーティskillは**信頼できないコード**として扱ってください。有効化前に読んでください。
- 信頼できない入力や危険なtoolに対してはsandbox実行を優先してください。[Sandboxing](/ja-JP/gateway/sandboxing)を参照してください。
- workspaceおよびextra-dirのskill検出は、解決されたrealpathが設定済みルート内にとどまるskillルートと`SKILL.md`ファイルのみを受け付けます。
- Gateway経由のskill依存関係インストール（`skills.install`、オンボーディング、およびSkills設定UI）は、installer metadataを実行する前に組み込みの危険コードスキャナーを実行します。`critical`な検出結果は、呼び出し元が明示的に危険オーバーライドを設定しない限りデフォルトでブロックされます。疑わしい検出結果は警告のみです。
- `openclaw skills install <slug>`は異なります。これはClawHub skillフォルダーをworkspaceへダウンロードするもので、上記のinstaller-metadata経路は使用しません。
- `skills.entries.*.env`と`skills.entries.*.apiKey`は、そのagent turnに対して**ホスト**プロセスへsecretを注入します（sandboxではありません）。secretをプロンプトやログに入れないでください。
- より広い脅威モデルとchecklistについては[Security](/ja-JP/gateway/security)を参照してください。

## 形式（AgentSkills + Pi互換）

`SKILL.md`には少なくとも次が必要です。

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

注意:

- レイアウト/意図についてはAgentSkills仕様に従います。
- embedded agentが使用するparserは**単一行**frontmatter keyのみをサポートします。
- `metadata`は**単一行JSONオブジェクト**である必要があります。
- 指示内でskillフォルダーパスを参照するには`{baseDir}`を使用します。
- 任意のfrontmatter key:
  - `homepage` — macOS Skills UIで「Website」として表示されるURL（`metadata.openclaw.homepage`経由でもサポート）。
  - `user-invocable` — `true|false`（デフォルト: `true`）。`true`の場合、skillはユーザーslash commandとして公開されます。
  - `disable-model-invocation` — `true|false`（デフォルト: `false`）。`true`の場合、skillはモデルプロンプトから除外されます（ユーザー呼び出しでは引き続き利用可能）。
  - `command-dispatch` — `tool`（任意）。`tool`に設定すると、slash commandはモデルをバイパスして直接toolへdispatchします。
  - `command-tool` — `command-dispatch: tool`が設定されている場合に呼び出すtool名。
  - `command-arg-mode` — `raw`（デフォルト）。tool dispatchでは、生のargs文字列をtoolへ転送します（core解析なし）。

    toolは次のparamsで呼び出されます:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。

## ゲーティング（読み込み時フィルター）

OpenClawは`metadata`（単一行JSON）を使用して、**読み込み時にskillをフィルタリング**します。

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

`metadata.openclaw`配下のフィールド:

- `always: true` — 常にskillを含める（他のゲートをスキップ）。
- `emoji` — macOS Skills UIで使用される任意の絵文字。
- `homepage` — macOS Skills UIで「Website」として表示される任意のURL。
- `os` — 任意のプラットフォーム一覧（`darwin`、`linux`、`win32`）。設定されている場合、そのOSでのみskillが有効になります。
- `requires.bins` — 一覧。各項目が`PATH`上に存在する必要があります。
- `requires.anyBins` — 一覧。少なくとも1つが`PATH`上に存在する必要があります。
- `requires.env` — 一覧。env varが存在する**か**、configで提供されている必要があります。
- `requires.config` — truthyでなければならない`openclaw.json`パスの一覧。
- `primaryEnv` — `skills.entries.<name>.apiKey`に関連付けられるenv var名。
- `install` — macOS Skills UIで使用されるinstaller specの任意配列（brew/node/go/uv/download）。

sandboxingに関する注意:

- `requires.bins`は、skill読み込み時に**ホスト**上で確認されます。
- agentがsandbox化されている場合、そのバイナリは**コンテナ内**にも存在する必要があります。
  `agents.defaults.sandbox.docker.setupCommand`（またはカスタムイメージ）でインストールしてください。
  `setupCommand`はコンテナ作成後に一度だけ実行されます。
  パッケージインストールには、network egress、書き込み可能なroot FS、sandbox内のrootユーザーも必要です。
  例: `summarize` skill（`skills/summarize/SKILL.md`）は、そこで実行するにはsandboxコンテナ内に`summarize` CLIが必要です。

installerの例:

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

注意:

- 複数のinstallerが列挙されている場合、gatewayは**単一の**優先オプションを選びます（brewが利用可能ならbrew、そうでなければnode）。
- すべてのinstallerが`download`の場合、OpenClawは利用可能なartifactが見えるよう各エントリを一覧表示します。
- installer specには、オプションをプラットフォームでフィルタリングするために`os: ["darwin"|"linux"|"win32"]`を含めることができます。
- Node installは`openclaw.json`内の`skills.install.nodeManager`に従います（デフォルト: npm、選択肢: npm/pnpm/yarn/bun）。
  これは**skill install**のみに影響します。Gateway runtimeは引き続きNodeであるべきです
  （WhatsApp/TelegramではBunは推奨されません）。
- Gateway経由のinstaller選択はnode-onlyではなく、preference駆動です:
  install specに複数kindが混在する場合、OpenClawは`skills.install.preferBrew`が有効で`brew`が存在すればHomebrewを優先し、次に`uv`、次に設定済みnode manager、次に`go`や`download`のような他のフォールバックを選びます。
- すべてのinstall specが`download`の場合、OpenClawは1つの優先installerへまとめず、すべてのdownloadオプションを表示します。
- Go install: `go`がなく`brew`が利用可能な場合、gatewayはまずHomebrew経由でGoをインストールし、可能であれば`GOBIN`をHomebrewの`bin`に設定します。
- Download install: `url`（必須）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（デフォルト: archive検出時は自動）、`stripComponents`、`targetDir`（デフォルト: `~/.openclaw/tools/<skillKey>`）。

`metadata.openclaw`が存在しない場合、そのskillは常に有効です（configで無効化されている場合、またはバンドル済みskillに対して`skills.allowBundled`でブロックされている場合を除く）。

## Config上書き（`~/.openclaw/openclaw.json`）

bundled/managed skillは切り替え可能で、env値も供給できます:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
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

注意: skill名にハイフンが含まれる場合は、キーを引用符で囲んでください（JSON5では引用符付きキーを使用できます）。

OpenClaw自体の中で標準の画像生成/編集を使いたい場合は、バンドル済みskillではなく、`agents.defaults.imageGenerationModel`と一緒にcoreの`image_generate` toolを使用してください。ここでのskill例は、カスタムまたはサードパーティworkflow向けです。

ネイティブ画像解析には、`agents.defaults.imageModel`と一緒に`image` toolを使用してください。
ネイティブ画像生成/編集には、`agents.defaults.imageGenerationModel`と一緒に`image_generate`を使用してください。`openai/*`、`google/*`、`fal/*`、またはその他のprovider固有の画像モデルを選ぶ場合は、そのproviderのauth/API keyも追加してください。

configキーはデフォルトで**skill名**に一致します。skillが`metadata.openclaw.skillKey`を定義している場合は、`skills.entries`配下でそのキーを使用してください。

ルール:

- `enabled: false`は、そのskillがbundled/installedであっても無効化します。
- `env`: 変数がプロセス内ですでに設定されていない**場合にのみ**注入されます。
- `apiKey`: `metadata.openclaw.primaryEnv`を宣言するskill向けの簡易設定です。
  平文文字列またはSecretRefオブジェクト（`{ source, provider, id }`）をサポートします。
- `config`: カスタムのskillごとフィールド用の任意バッグです。カスタムキーはここに置く必要があります。
- `allowBundled`: **bundled** skill専用の任意の許可リストです。設定されている場合、一覧にあるbundled skillだけが有効になります（managed/workspace skillは影響を受けません）。

## 環境注入（agent実行ごと）

agent実行が始まると、OpenClawは次を行います。

1. skill metadataを読み取る。
2. `skills.entries.<key>.env`または`skills.entries.<key>.apiKey`を`process.env`へ適用する。
3. **有効な**Skillsを使ってsystem promptを構築する。
4. 実行終了後に元の環境を復元する。

これは**agent実行にスコープされた**ものであり、グローバルなshell環境ではありません。

バンドル済みの`claude-cli` backendでは、OpenClawは同じ有効snapshotを一時的なClaude Code pluginとして実体化し、`--plugin-dir`とともに渡します。これによりClaude Codeはネイティブのskill resolverを使えますが、OpenClawは依然として優先順位、agentごとの許可リスト、ゲーティング、および`skills.entries.*`のenv/API key注入を管理します。他のCLI backendはprompt catalogのみを使用します。

## セッションsnapshot（パフォーマンス）

OpenClawは、**セッション開始時**に有効なSkillsをsnapshotし、同じセッション内の後続ターンでその一覧を再利用します。skillまたはconfigの変更は、次に新しく始まるセッションで有効になります。

Skills watcherが有効な場合、または新たな有効remote nodeが現れた場合には、Skillsはセッション途中でも更新されることがあります（下記参照）。これは**hot reload**と考えてください。更新された一覧は次のagent turnで反映されます。

そのセッションに対する実効agent skill許可リストが変わった場合、OpenClawはsnapshotを更新し、見えているSkillsが現在のagentに一致した状態を保ちます。

## Remote macOSノード（Linux Gateway）

GatewayがLinux上で動作していても、**macOSノード**が接続されていて、かつ**`system.run`が許可されている**場合（Exec approvals securityが`deny`に設定されていない場合）、OpenClawは、そのノード上に必要なバイナリが存在すれば、macOS専用Skillsを有効として扱えます。agentはそれらのskillを`host=node`付きの`exec` tool経由で実行すべきです。

これは、ノードがコマンドサポートを報告することと、`system.run`経由のbin probeに依存しています。後でmacOSノードがオフラインになっても、Skillsは見えたままです。ノードが再接続されるまで、呼び出しは失敗することがあります。

## Skills watcher（自動更新）

デフォルトでは、OpenClawはskillフォルダーを監視し、`SKILL.md`ファイルが変更されるとskills snapshotを更新します。これは`skills.load`配下で設定します。

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

## トークン影響（skills一覧）

Skillsが有効な場合、OpenClawは利用可能なSkillsのコンパクトなXML一覧をsystem promptへ注入します（`pi-coding-agent`内の`formatSkillsForPrompt`経由）。コストは決定的です。

- **ベースオーバーヘッド（1つ以上のskillがある場合のみ）:** 195文字。
- **skillごと:** 97文字 + XMLエスケープ済み`<name>`、`<description>`、`<location>`値の長さ。

式（文字数）:

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

注意:

- XMLエスケープにより、`& < > " '`はエンティティ（`&amp;`、`&lt;`など）へ展開され、長さが増えます。
- トークン数はモデルのtokenizerによって異なります。OpenAI系のおおよその見積もりでは約4文字/トークンなので、**97文字 ≈ 24トークン**がskillごとにかかり、さらに実際の各フィールド長が加わります。

## Managed skillsのライフサイクル

OpenClawは、インストールの一部としてベースラインのskill群を**bundled skills**として同梱します（npm packageまたはOpenClaw.app）。`~/.openclaw/skills`はローカル上書き用に存在します（たとえば、bundledコピーを変更せずにskillをpin/patchしたい場合）。workspace skillはユーザー所有であり、名前衝突時には両方を上書きします。

## Configリファレンス

完全な設定スキーマについては[Skills config](/ja-JP/tools/skills-config)を参照してください。

## もっとSkillsを探していますか？

[https://clawhub.ai](https://clawhub.ai)を参照してください。

---

## 関連

- [Creating Skills](/ja-JP/tools/creating-skills) — カスタムSkillsの作成
- [Skills Config](/ja-JP/tools/skills-config) — skill設定リファレンス
- [Slash Commands](/ja-JP/tools/slash-commands) — 利用可能なすべてのslash command
- [Plugins](/ja-JP/tools/plugin) — pluginシステム概要
