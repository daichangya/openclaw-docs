---
read_when:
    - プラグインをインストールまたは設定するとき
    - プラグインの検出ルールや読み込みルールを理解するとき
    - Codex/Claude 互換のプラグインバンドルを扱うとき
sidebarTitle: Install and Configure
summary: OpenClaw プラグインのインストール、設定、管理
title: プラグイン
x-i18n:
    generated_at: "2026-04-05T13:00:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 707bd3625596f290322aeac9fecb7f4c6f45d595fdfb82ded7cbc8e04457ac7f
    source_path: tools/plugin.md
    workflow: 15
---

# プラグイン

プラグインは OpenClaw を新しい機能で拡張します。たとえば、チャネル、モデルプロバイダー、
ツール、Skills、speech、realtime transcription、realtime voice、
media-understanding、image generation、video generation、web fetch、web
search などです。一部のプラグインは**コア**（OpenClaw に同梱）で、他は
**外部**（コミュニティが npm で公開）です。

## クイックスタート

<Steps>
  <Step title="読み込まれているものを確認する">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="プラグインをインストールする">
    ```bash
    # npm から
    openclaw plugins install @openclaw/voice-call

    # ローカルディレクトリまたはアーカイブから
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gateway を再起動する">
    ```bash
    openclaw gateway restart
    ```

    その後、設定ファイル内の `plugins.entries.\<id\>.config` で設定してください。

  </Step>
</Steps>

チャットネイティブな操作を好む場合は、`commands.plugins: true` を有効にして次を使います。

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

インストールパスは CLI と同じリゾルバーを使います。ローカルパス/アーカイブ、明示的な
`clawhub:<pkg>`、または素のパッケージ指定（ClawHub 優先、その後 npm フォールバック）です。

config が無効な場合、通常はインストールは安全側に倒れて失敗し、
`openclaw doctor --fix` を案内します。唯一の回復例外は、選択した同梱プラグインが
`openclaw.install.allowInvalidConfigRecovery` にオプトインしている場合の、
限定的な bundled-plugin 再インストール経路です。

## プラグインの種類

OpenClaw は 2 つのプラグイン形式を認識します。

| Format     | 仕組み                                                       | 例                                                     |
| ---------- | ------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイムモジュール。プロセス内で実行 | 公式プラグイン、コミュニティの npm パッケージ         |
| **Bundle** | Codex/Claude/Cursor 互換レイアウト。OpenClaw 機能にマッピング | `.codex-plugin/`、`.claude-plugin/`、`.cursor-plugin/` |

どちらも `openclaw plugins list` に表示されます。バンドルの詳細は [Plugin Bundles](/ja-JP/plugins/bundles) を参照してください。

Native プラグインを書く場合は、[Building Plugins](/ja-JP/plugins/building-plugins)
および [Plugin SDK Overview](/ja-JP/plugins/sdk-overview) から始めてください。

## 公式プラグイン

### インストール可能（npm）

| Plugin          | Package                | ドキュメント                           |
| --------------- | ---------------------- | -------------------------------------- |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ja-JP/channels/matrix)             |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ja-JP/channels/msteams)   |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ja-JP/channels/nostr)               |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ja-JP/plugins/voice-call)      |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ja-JP/channels/zalo)                 |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ja-JP/plugins/zalouser)     |

### コア（OpenClaw に同梱）

<AccordionGroup>
  <Accordion title="モデルプロバイダー（デフォルトで有効）">
    `anthropic`、`byteplus`、`cloudflare-ai-gateway`、`github-copilot`、`google`、
    `huggingface`、`kilocode`、`kimi-coding`、`minimax`、`mistral`、`qwen`、
    `moonshot`、`nvidia`、`openai`、`opencode`、`opencode-go`、`openrouter`、
    `qianfan`、`synthetic`、`together`、`venice`、
    `vercel-ai-gateway`、`volcengine`、`xiaomi`、`zai`
  </Accordion>

  <Accordion title="メモリプラグイン">
    - `memory-core` — 同梱のメモリ検索（`plugins.slots.memory` 経由のデフォルト）
    - `memory-lancedb` — オンデマンドインストールの長期メモリ。自動リコール/キャプチャ対応（`plugins.slots.memory = "memory-lancedb"` を設定）
  </Accordion>

  <Accordion title="音声プロバイダー（デフォルトで有効）">
    `elevenlabs`、`microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` — browser ツール、`openclaw browser` CLI、`browser.request` gateway メソッド、browser ランタイム、およびデフォルトの browser control service 向けの同梱 browser プラグイン（デフォルトで有効。置き換える前に無効化してください）
    - `copilot-proxy` — VS Code Copilot Proxy ブリッジ（デフォルトでは無効）
  </Accordion>
</AccordionGroup>

サードパーティプラグインを探していますか？ [Community Plugins](/ja-JP/plugins/community) を参照してください。

## 設定

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Field            | 説明                                                     |
| ---------------- | -------------------------------------------------------- |
| `enabled`        | マスタートグル（デフォルト: `true`）                     |
| `allow`          | プラグイン許可リスト（任意）                             |
| `deny`           | プラグイン拒否リスト（任意。拒否が優先）                 |
| `load.paths`     | 追加のプラグインファイル/ディレクトリ                    |
| `slots`          | 排他的スロットの選択子（例: `memory`、`contextEngine`）  |
| `entries.\<id\>` | プラグインごとのトグル + config                          |

config の変更には**gateway の再起動が必要**です。Gateway が config
watch + プロセス内再起動有効で実行されている場合（デフォルトの `openclaw gateway` 経路）、
その再起動は通常、config の書き込み完了直後に自動的に行われます。

<Accordion title="プラグイン状態: disabled vs missing vs invalid">
  - **Disabled**: プラグインは存在するが、有効化ルールによって無効化されている。config は保持される。
  - **Missing**: config がプラグイン id を参照しているが、検出では見つからなかった。
  - **Invalid**: プラグインは存在するが、その config が宣言されたスキーマと一致しない。
</Accordion>

## 検出と優先順位

OpenClaw は次の順序でプラグインをスキャンします（最初に一致したものが優先）。

<Steps>
  <Step title="Config パス">
    `plugins.load.paths` — 明示的なファイルまたはディレクトリパス。
  </Step>

  <Step title="ワークスペース拡張">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` と `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバル拡張">
    `~/.openclaw/<plugin-root>/*.ts` と `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="同梱プラグイン">
    OpenClaw に同梱。多くはデフォルトで有効です（モデルプロバイダー、speech など）。
    それ以外は明示的な有効化が必要です。
  </Step>
</Steps>

### 有効化ルール

- `plugins.enabled: false` はすべてのプラグインを無効化します
- `plugins.deny` は常に許可より優先します
- `plugins.entries.\<id\>.enabled: false` はそのプラグインを無効化します
- ワークスペース由来のプラグインは**デフォルトで無効**です（明示的に有効化する必要があります）
- 同梱プラグインは、上書きされない限り組み込みの default-on セットに従います
- 排他的スロットは、そのスロットで選ばれたプラグインを強制的に有効化することがあります

## プラグインスロット（排他的カテゴリ）

一部のカテゴリは排他的です（一度に 1 つだけ有効）。

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // または無効化するには "none"
      contextEngine: "legacy", // またはプラグイン id
    },
  },
}
```

| Slot            | 制御対象                 | デフォルト            |
| --------------- | ------------------------ | --------------------- |
| `memory`        | アクティブなメモリプラグイン   | `memory-core`         |
| `contextEngine` | アクティブなコンテキストエンジン | `legacy`（組み込み）  |

## CLI リファレンス

```bash
openclaw plugins list                       # コンパクトな一覧
openclaw plugins list --enabled            # 読み込まれたプラグインのみ
openclaw plugins list --verbose            # プラグインごとの詳細行
openclaw plugins list --json               # 機械可読の一覧
openclaw plugins inspect <id>              # 詳細表示
openclaw plugins inspect <id> --json       # 機械可読
openclaw plugins inspect --all             # 全体表
openclaw plugins info <id>                 # inspect のエイリアス
openclaw plugins doctor                    # 診断

openclaw plugins install <package>         # インストール（ClawHub 優先、その後 npm）
openclaw plugins install clawhub:<pkg>     # ClawHub のみからインストール
openclaw plugins install <spec> --force    # 既存インストールを上書き
openclaw plugins install <path>            # ローカルパスからインストール
openclaw plugins install -l <path>         # 開発用にリンク（コピーなし）
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 解決済みの正確な npm spec を記録
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # 単一プラグインを更新
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # すべて更新
openclaw plugins uninstall <id>          # config/インストール記録を削除
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

同梱プラグインは OpenClaw に付属しています。多くはデフォルトで有効です（たとえば、
同梱モデルプロバイダー、同梱音声プロバイダー、同梱 browser
プラグイン）。その他の同梱プラグインは、やはり `openclaw plugins enable <id>` が必要です。

`--force` は、既存のインストール済みプラグインまたは hook pack をその場で上書きします。
これは `--link` とは併用できません。`--link` は管理対象のインストール先へ
コピーする代わりにソースパスを再利用するためです。

`--pin` は npm 専用です。`--marketplace` とは併用できません。これは、
marketplace インストールでは npm spec ではなく marketplace のソースメタデータが保持されるためです。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーの誤検知に対する
非常時オーバーライドです。これにより、組み込みの `critical` 検出結果があっても
プラグインのインストールと更新を継続できますが、それでも
プラグインの `before_install` ポリシーブロックやスキャン失敗によるブロックは回避しません。

この CLI フラグは、プラグインのインストール/更新フローにのみ適用されます。Gateway ベースの Skill
依存関係インストールでは、代わりに対応する `dangerouslyForceUnsafeInstall` リクエストオーバーライドを使います。一方、`openclaw skills install` は依然として別個の ClawHub Skill ダウンロード/インストールフローです。

互換バンドルは、同じプラグインの list/inspect/enable/disable
フローに参加します。現在のランタイムサポートには、bundle Skills、Claude command-skills、
Claude `settings.json` デフォルト、Claude `.lsp.json` と manifest 宣言の
`lspServers` デフォルト、Cursor command-skills、互換性のある Codex hook
ディレクトリが含まれます。

`openclaw plugins inspect <id>` は、bundle ベースのプラグインについて、検出された bundle 機能に加え、
サポートされる/されない MCP および LSP server エントリーも報告します。

Marketplace ソースには、`~/.claude/plugins/known_marketplaces.json` にある
Claude の既知 marketplace 名、ローカル marketplace ルートまたは
`marketplace.json` パス、`owner/repo` のような GitHub 短縮表記、GitHub リポジトリ
URL、または git URL を指定できます。リモート marketplace では、プラグインエントリーは
クローンされた marketplace リポジトリ内にとどまり、ソースには相対パスのみを使う必要があります。

詳細は [`openclaw plugins` CLI reference](/cli/plugins) を参照してください。

## プラグイン API 概要

Native プラグインは `register(api)` を公開するエントリーオブジェクトをエクスポートします。古い
プラグインはレガシーなエイリアスとして `activate(api)` をまだ使っている場合がありますが、新しいプラグインは
`register` を使うべきです。

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

OpenClaw はエントリーオブジェクトを読み込み、プラグイン
有効化時に `register(api)` を呼び出します。ローダーは古いプラグイン向けに依然として `activate(api)` にフォールバックしますが、
同梱プラグインと新しい外部プラグインでは、`register` を
公開契約として扱うべきです。

一般的な登録メソッド:

| Method                                  | 登録するもの                |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | モデルプロバイダー（LLM）   |
| `registerChannel`                       | チャットチャネル            |
| `registerTool`                          | エージェントツール          |
| `registerHook` / `on(...)`              | ライフサイクルフック        |
| `registerSpeechProvider`                | text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | ストリーミング STT          |
| `registerRealtimeVoiceProvider`         | 双方向 realtime voice       |
| `registerMediaUnderstandingProvider`    | 画像/音声解析               |
| `registerImageGenerationProvider`       | 画像生成                    |
| `registerVideoGenerationProvider`       | 動画生成                    |
| `registerWebFetchProvider`              | web fetch / scrape プロバイダー |
| `registerWebSearchProvider`             | Web 検索                    |
| `registerHttpRoute`                     | HTTP エンドポイント         |
| `registerCommand` / `registerCli`       | CLI コマンド                |
| `registerContextEngine`                 | コンテキストエンジン        |
| `registerService`                       | バックグラウンドサービス    |

型付きライフサイクルフックのフックガード動作:

- `before_tool_call`: `{ block: true }` は終端です。より低優先度のハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` は no-op であり、以前の block を解除しません。
- `before_install`: `{ block: true }` は終端です。より低優先度のハンドラーはスキップされます。
- `before_install`: `{ block: false }` は no-op であり、以前の block を解除しません。
- `message_sending`: `{ cancel: true }` は終端です。より低優先度のハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` は no-op であり、以前の cancel を解除しません。

型付きフックの完全な動作については、[SDK Overview](/ja-JP/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## 関連

- [Building Plugins](/ja-JP/plugins/building-plugins) — 独自のプラグインを作成する
- [Plugin Bundles](/ja-JP/plugins/bundles) — Codex/Claude/Cursor バンドル互換性
- [Plugin Manifest](/ja-JP/plugins/manifest) — マニフェストスキーマ
- [Registering Tools](/ja-JP/plugins/building-plugins#registering-agent-tools) — プラグインにエージェントツールを追加する
- [Plugin Internals](/plugins/architecture) — 機能モデルと読み込みパイプライン
- [Community Plugins](/ja-JP/plugins/community) — サードパーティ一覧
