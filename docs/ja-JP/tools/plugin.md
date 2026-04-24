---
read_when:
    - Pluginのインストールまたは設定
    - Pluginの検出と読み込みルールの理解
    - Codex/Claude互換Pluginバンドルの操作
sidebarTitle: Install and Configure
summary: OpenClaw Pluginのインストール、設定、および管理
title: Plugin
x-i18n:
    generated_at: "2026-04-24T09:03:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ab1218d6677ad518a4991ca546d55eed9648e1fa92b76b7433ecd5df569e28
    source_path: tools/plugin.md
    workflow: 15
---

Pluginは、OpenClawに新しい機能を追加します: チャンネル、モデルプロバイダー、エージェントハーネス、ツール、Skills、音声、realtime文字起こし、realtime音声、メディア理解、画像生成、動画生成、Web取得、Web検索などです。Pluginには、**core**（OpenClawに同梱）なものと、**external**（コミュニティがnpmで公開）なものがあります。

## クイックスタート

<Steps>
  <Step title="読み込まれているものを確認">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Pluginをインストール">
    ```bash
    # npmから
    openclaw plugins install @openclaw/voice-call

    # ローカルディレクトリまたはアーカイブから
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gatewayを再起動">
    ```bash
    openclaw gateway restart
    ```

    その後、設定ファイルの `plugins.entries.\<id\>.config` 配下で設定します。

  </Step>
</Steps>

チャットネイティブな操作を好む場合は、`commands.plugins: true` を有効にして次を使います:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

インストールパスはCLIと同じリゾルバーを使用します: ローカルパス/アーカイブ、明示的な `clawhub:<pkg>`、または裸のパッケージ指定（最初にClawHub、次にnpmへフォールバック）。

設定が無効な場合、通常はインストールは安全側で失敗し、`openclaw doctor --fix` を案内します。唯一の回復例外は、`openclaw.install.allowInvalidConfigRecovery` にオプトインしたPlugin向けの、狭いバンドル済みPlugin再インストールパスです。

パッケージ化されたOpenClawインストールでは、すべてのバンドル済みPluginのランタイム依存ツリーを事前に積極インストールしません。バンドル済みのOpenClaw所有Pluginが、Plugin設定、従来のチャンネル設定、またはデフォルト有効マニフェストから有効になっている場合、起動時の修復では、そのPluginが宣言したランタイム依存関係のみをimport前に修復します。外部Pluginとカスタム読み込みパスは、引き続き `openclaw plugins install` でインストールする必要があります。

## Pluginの種類

OpenClawは2つのPlugin形式を認識します:

| Format     | 仕組み                                                       | 例                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイムモジュール。インプロセスで実行される       | 公式Plugin、コミュニティnpmパッケージ               |
| **Bundle** | Codex/Claude/Cursor互換レイアウト。OpenClaw機能へマップされる | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

どちらも `openclaw plugins list` に表示されます。Bundleの詳細は [Plugin Bundles](/ja-JP/plugins/bundles) を参照してください。

ネイティブPluginを書いている場合は、[Building Plugins](/ja-JP/plugins/building-plugins)
と [Plugin SDK Overview](/ja-JP/plugins/sdk-overview) から始めてください。

## 公式Plugin

### インストール可能（npm）

| Plugin          | Package                | Docs                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ja-JP/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ja-JP/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ja-JP/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ja-JP/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ja-JP/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ja-JP/plugins/zalouser)   |

### core（OpenClawに同梱）

<AccordionGroup>
  <Accordion title="モデルプロバイダー（デフォルトで有効）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="メモリPlugin">
    - `memory-core` — バンドル済みメモリ検索（デフォルトは `plugins.slots.memory` 経由）
    - `memory-lancedb` — 必要時インストールの長期メモリ。自動recall/capture付き（`plugins.slots.memory = "memory-lancedb"` を設定）
  </Accordion>

  <Accordion title="音声プロバイダー（デフォルトで有効）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` — browserツール、`openclaw browser` CLI、`browser.request` Gatewayメソッド、browserランタイム、およびデフォルトbrowser controlサービス向けのバンドル済みbrowser Plugin（デフォルトで有効。置き換える前に無効化してください）
    - `copilot-proxy` — VS Code Copilot Proxyブリッジ（デフォルトでは無効）
  </Accordion>
</AccordionGroup>

サードパーティPluginを探していますか？ [Community Plugins](/ja-JP/plugins/community) を参照してください。

## 設定

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Field            | 説明                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | マスタートグル（デフォルト: `true`）                           |
| `allow`          | Plugin allowlist（任意）                               |
| `deny`           | Plugin denylist（任意。denyが優先）                     |
| `load.paths`     | 追加のPluginファイル/ディレクトリ                            |
| `slots`          | 排他的スロット選択子（例: `memory`, `contextEngine`） |
| `entries.\<id\>` | Pluginごとのトグル + 設定                               |

設定変更には**Gatewayの再起動が必要**です。Gatewayが設定監視 + インプロセス再起動有効状態（デフォルトの `openclaw gateway` パス）で動作している場合、その再起動は通常、設定書き込みの少し後に自動実行されます。

<Accordion title="Plugin状態: disabled vs missing vs invalid">
  - **Disabled**: Pluginは存在するが、有効化ルールによって無効化されています。設定は保持されます。
  - **Missing**: 設定がPlugin IDを参照しているが、検出で見つかりませんでした。
  - **Invalid**: Pluginは存在するが、その設定が宣言されたスキーマに一致しません。
</Accordion>

## 検出と優先順位

OpenClawは、次の順序でPluginをスキャンします（最初に一致したものが優先）:

<Steps>
  <Step title="設定パス">
    `plugins.load.paths` — 明示的なファイルまたはディレクトリパス。
  </Step>

  <Step title="ワークスペースPlugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` および `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバルPlugin">
    `~/.openclaw/<plugin-root>/*.ts` および `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="バンドル済みPlugin">
    OpenClawに同梱されています。多くはデフォルトで有効です（モデルプロバイダー、音声など）。
    その他は明示的な有効化が必要です。
  </Step>
</Steps>

### 有効化ルール

- `plugins.enabled: false` はすべてのPluginを無効化します
- `plugins.deny` は常にallowより優先されます
- `plugins.entries.\<id\>.enabled: false` はそのPluginを無効化します
- ワークスペース由来のPluginは**デフォルトで無効**です（明示的に有効化する必要があります）
- バンドル済みPluginは、上書きされない限り組み込みのデフォルト有効セットに従います
- 排他的スロットは、そのスロットに選ばれたPluginを強制的に有効化することがあります
- 一部のバンドル済みオプトインPluginは、設定でプロバイダーのmodel ref、チャンネル設定、ハーネスランタイムなどのPlugin所有サーフェスが指定されると自動的に有効化されます
- OpenAI系のCodexルートは独立したPlugin境界を保ちます:
  `openai-codex/*` はOpenAI Pluginに属し、一方でバンドル済みCodex
  app-server Pluginは `embeddedHarness.runtime: "codex"` または従来の
  `codex/*` model refs によって選択されます

## Pluginスロット（排他的カテゴリ）

一部のカテゴリは排他的です（一度に1つだけ有効）:

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // または "none" で無効化
      contextEngine: "legacy", // またはPlugin id
    },
  },
}
```

| Slot            | 制御対象      | デフォルト             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active Memory Plugin  | `memory-core`       |
| `contextEngine` | アクティブなコンテキストエンジン | `legacy`（組み込み） |

## CLIリファレンス

```bash
openclaw plugins list                       # コンパクトな一覧
openclaw plugins list --enabled            # 読み込まれたPluginのみ
openclaw plugins list --verbose            # Pluginごとの詳細行
openclaw plugins list --json               # 機械可読な一覧
openclaw plugins inspect <id>              # 詳細情報
openclaw plugins inspect <id> --json       # 機械可読
openclaw plugins inspect --all             # 全体表
openclaw plugins info <id>                 # inspectの別名
openclaw plugins doctor                    # 診断

openclaw plugins install <package>         # インストール（最初にClawHub、次にnpm）
openclaw plugins install clawhub:<pkg>     # ClawHubのみからインストール
openclaw plugins install <spec> --force    # 既存インストールを上書き
openclaw plugins install <path>            # ローカルパスからインストール
openclaw plugins install -l <path>         # 開発用にリンク（コピーなし）
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 解決された正確なnpm specを記録
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 1つのPluginを更新
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # すべて更新
openclaw plugins uninstall <id>          # 設定/インストール記録を削除
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

バンドル済みPluginはOpenClawに同梱されています。多くはデフォルトで有効です（たとえば
バンドル済みモデルプロバイダー、バンドル済み音声プロバイダー、バンドル済みbrowser
Plugin）。その他のバンドル済みPluginは、引き続き `openclaw plugins enable <id>` が必要です。

`--force` は、既存のインストール済みPluginまたはフックパックをその場で上書きします。追跡中のnpm
Pluginの通常アップグレードには `openclaw plugins update <id-or-npm-spec>` を使用してください。これは `--link` ではサポートされません。`--link` は管理対象のインストール先へコピーせず、元のパスを再利用するためです。

`plugins.allow` がすでに設定されている場合、`openclaw plugins install` は、インストールした
Plugin IDをそのallowlistへ追加してから有効化するため、再起動後すぐに読み込み可能になります。

`openclaw plugins update <id-or-npm-spec>` は追跡中のインストールに適用されます。dist-tagまたは正確なバージョン付きのnpmパッケージspecを渡すと、パッケージ名を追跡中Pluginレコードへ解決し直し、将来の更新用に新しいspecを記録します。バージョンなしのパッケージ名を渡すと、正確にpinされたインストールはレジストリのデフォルトリリースラインへ戻されます。インストール済みnpm Pluginが、解決されたバージョンと記録済みアーティファクトIDにすでに一致している場合、OpenClawはダウンロード、再インストール、設定書き換えを行わずに更新をスキップします。

`--pin` はnpm専用です。`--marketplace` ではサポートされません。marketplaceインストールはnpm specではなく、marketplaceソースメタデータを永続化するためです。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーによる誤検知に対する緊急用オーバーライドです。これにより、組み込みの `critical` 所見を超えてPluginインストールとPlugin更新を継続できますが、それでもPluginの `before_install` ポリシーブロックやスキャン失敗によるブロックは回避しません。

このCLIフラグは、Pluginのインストール/更新フローにのみ適用されます。GatewayバックのSkill依存関係インストールでは、代わりに対応する `dangerouslyForceUnsafeInstall` リクエストオーバーライドを使用します。一方、`openclaw skills install` は別個のClawHub Skillsダウンロード/インストールフローのままです。

互換Bundleは、同じPluginの一覧表示/inspect/enable/disableフローに参加します。現在のランタイムサポートには、bundle Skills、Claude command-skills、Claude `settings.json` デフォルト、Claude `.lsp.json` とマニフェスト宣言の `lspServers` デフォルト、Cursor command-skills、および互換Codexフックディレクトリが含まれます。

`openclaw plugins inspect <id>` は、bundleバックPlugin向けに、検出されたbundle機能に加えて、サポートされる/サポートされないMCPおよびLSPサーバーエントリも報告します。

Marketplaceソースには、`~/.claude/plugins/known_marketplaces.json` にあるClaudeの既知marketplace名、ローカルmarketplaceルートまたは `marketplace.json` パス、`owner/repo` のようなGitHub省略記法、GitHubリポジトリURL、またはgit URLを使用できます。リモートmarketplaceでは、Pluginエントリはクローンしたmarketplaceリポジトリ内にとどまり、相対パスソースのみを使用する必要があります。

完全な詳細は [`openclaw plugins` CLIリファレンス](/ja-JP/cli/plugins) を参照してください。

## Plugin API概要

ネイティブPluginは、`register(api)` を公開するエントリオブジェクトをexportします。古いPluginはまだ従来の別名として `activate(api)` を使うことがありますが、新しいPluginは `register` を使うべきです。

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClawはエントリオブジェクトを読み込み、Plugin有効化時に `register(api)` を呼び出します。ローダーは古いPlugin向けに引き続き `activate(api)` へフォールバックしますが、バンドル済みPluginと新しい外部Pluginでは、`register` を公開契約として扱うべきです。

一般的な登録メソッド:

| Method                                  | 登録するもの           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | モデルプロバイダー（LLM）        |
| `registerChannel`                       | チャットチャンネル                |
| `registerTool`                          | エージェントツール                  |
| `registerHook` / `on(...)`              | ライフサイクルフック             |
| `registerSpeechProvider`                | テキスト読み上げ / STT        |
| `registerRealtimeTranscriptionProvider` | ストリーミングSTT               |
| `registerRealtimeVoiceProvider`         | 双方向realtime音声       |
| `registerMediaUnderstandingProvider`    | 画像/音声解析        |
| `registerImageGenerationProvider`       | 画像生成            |
| `registerMusicGenerationProvider`       | 音楽生成            |
| `registerVideoGenerationProvider`       | 動画生成            |
| `registerWebFetchProvider`              | Web取得 / スクレイププロバイダー |
| `registerWebSearchProvider`             | Web検索                  |
| `registerHttpRoute`                     | HTTPエンドポイント               |
| `registerCommand` / `registerCli`       | CLIコマンド                |
| `registerContextEngine`                 | コンテキストエンジン              |
| `registerService`                       | バックグラウンドサービス          |

型付きライフサイクルフックのフックガード動作:

- `before_tool_call`: `{ block: true }` は終端です。より低優先度のハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` はno-opであり、以前のblockを解除しません。
- `before_install`: `{ block: true }` は終端です。より低優先度のハンドラーはスキップされます。
- `before_install`: `{ block: false }` はno-opであり、以前のblockを解除しません。
- `message_sending`: `{ cancel: true }` は終端です。より低優先度のハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` はno-opであり、以前のcancelを解除しません。

型付きフックの完全な動作については、[SDK Overview](/ja-JP/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## 関連

- [Building Plugins](/ja-JP/plugins/building-plugins) — 独自Pluginを作成
- [Plugin Bundles](/ja-JP/plugins/bundles) — Codex/Claude/Cursor Bundle互換
- [Plugin Manifest](/ja-JP/plugins/manifest) — マニフェストスキーマ
- [Registering Tools](/ja-JP/plugins/building-plugins#registering-agent-tools) — Pluginにエージェントツールを追加
- [Plugin Internals](/ja-JP/plugins/architecture) — 機能モデルと読み込みパイプライン
- [Community Plugins](/ja-JP/plugins/community) — サードパーティ一覧
