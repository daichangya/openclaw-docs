---
read_when:
    - Plugin のインストールまたは設定
    - Plugin の検出と読み込みルールを理解すること
    - Codex/Claude 互換 Plugin バンドルを扱うこと
sidebarTitle: Install and Configure
summary: OpenClaw Plugin のインストール、設定、および管理
title: Plugin
x-i18n:
    generated_at: "2026-04-23T04:52:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 120c96e5b80b6dc9f6c842f9d04ada595f32e21a311128ae053828747a793033
    source_path: tools/plugin.md
    workflow: 15
---

# Plugin

Plugin は OpenClaw を新しい capability で拡張します。たとえば Channel、モデル provider、
ツール、Skills、音声、リアルタイム文字起こし、リアルタイム音声、
メディア理解、画像生成、動画生成、Web fetch、Web
検索などです。一部の Plugin は **core**（OpenClaw に同梱）で、他は
**external**（コミュニティによって npm で公開）です。

## クイックスタート

<Steps>
  <Step title="読み込まれているものを確認する">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Plugin をインストールする">
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

    その後、設定ファイルの `plugins.entries.\<id\>.config` で設定してください。

  </Step>
</Steps>

チャットネイティブな操作を使いたい場合は、`commands.plugins: true` を有効にして次を使います。

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

インストールパスは CLI と同じリゾルバーを使います。ローカルパス/アーカイブ、明示的な
`clawhub:<pkg>`、または bare package spec（最初に ClawHub、その後 npm fallback）です。

設定が無効な場合、通常インストールはフェイルクローズし、
`openclaw doctor --fix` を案内します。唯一の回復例外は、狭いバンドル済み Plugin の
再インストールパスで、これは
`openclaw.install.allowInvalidConfigRecovery` にオプトインしている Plugin 向けです。

パッケージ化された OpenClaw インストールは、すべてのバンドル済み Plugin の
ランタイム依存ツリーを eager にインストールしません。
バンドル済みの OpenClaw 所有 Plugin が、Plugin 設定、
レガシー Channel 設定、またはデフォルト有効 manifest からアクティブである場合、
起動時修復は、その Plugin を import する前に、
その Plugin が宣言したランタイム依存だけを修復します。
external Plugin とカスタム読み込みパスは、引き続き
`openclaw plugins install` でインストールする必要があります。

## Plugin の種類

OpenClaw は 2 つの Plugin 形式を認識します。

| 形式     | 仕組み                                                       | 例                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイムモジュール。プロセス内で実行される       | 公式 Plugin、コミュニティ npm パッケージ               |
| **Bundle** | Codex/Claude/Cursor 互換レイアウト。OpenClaw の機能にマッピングされる | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

どちらも `openclaw plugins list` に表示されます。Bundle の詳細は [Plugin Bundles](/ja-JP/plugins/bundles) を参照してください。

Native Plugin を作成する場合は、[Building Plugins](/ja-JP/plugins/building-plugins)
と [Plugin SDK 概要](/ja-JP/plugins/sdk-overview) から始めてください。

## 公式 Plugin

### インストール可能（npm）

| Plugin          | パッケージ                | ドキュメント                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ja-JP/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ja-JP/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ja-JP/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ja-JP/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ja-JP/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ja-JP/plugins/zalouser)   |

### Core（OpenClaw に同梱）

<AccordionGroup>
  <Accordion title="モデル provider（デフォルトで有効）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="メモリ Plugin">
    - `memory-core` — バンドル済みメモリ検索（デフォルトは `plugins.slots.memory` 経由）
    - `memory-lancedb` — 必要時インストールの長期メモリ。自動想起/記録付き（`plugins.slots.memory = "memory-lancedb"` を設定）
  </Accordion>

  <Accordion title="音声 provider（デフォルトで有効）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` — browser ツール、`openclaw browser` CLI、`browser.request` gateway method、browser ランタイム、およびデフォルト browser control service 用のバンドル済み browser Plugin（デフォルトで有効。置き換える前に無効化してください）
    - `copilot-proxy` — VS Code Copilot Proxy ブリッジ（デフォルトでは無効）
  </Accordion>
</AccordionGroup>

サードパーティ Plugin を探していますか？ [Community Plugins](/ja-JP/plugins/community) を参照してください。

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

| フィールド            | 説明                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | マスタートグル（デフォルト: `true`）                           |
| `allow`          | Plugin allowlist（任意）                               |
| `deny`           | Plugin denylist（任意。deny が優先）                     |
| `load.paths`     | 追加の Plugin ファイル/ディレクトリ                            |
| `slots`          | 排他的スロットセレクター（例: `memory`, `contextEngine`） |
| `entries.\<id\>` | Plugin ごとのトグル + 設定                               |

設定変更には **gateway の再起動が必要** です。Gateway が設定
watch + in-process restart 有効で実行されている場合（デフォルトの `openclaw gateway` パス）、
通常その再起動は設定書き込みの直後に自動で実行されます。

<Accordion title="Plugin の状態: disabled vs missing vs invalid">
  - **Disabled**: Plugin は存在するが、有効化ルールによって無効化されています。設定は保持されます。
  - **Missing**: 設定が Plugin id を参照しているが、検出で見つかりませんでした。
  - **Invalid**: Plugin は存在するが、その設定が宣言されたスキーマと一致しません。
</Accordion>

## 検出と優先順位

OpenClaw は次の順で Plugin を走査します（最初に一致したものが優先されます）。

<Steps>
  <Step title="設定パス">
    `plugins.load.paths` — 明示的なファイルまたはディレクトリパス。
  </Step>

  <Step title="ワークスペース拡張">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` および `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバル拡張">
    `~/.openclaw/<plugin-root>/*.ts` および `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="バンドル済み Plugin">
    OpenClaw に同梱されています。多くはデフォルトで有効です（モデル provider、音声など）。
    それ以外は明示的な有効化が必要です。
  </Step>
</Steps>

### 有効化ルール

- `plugins.enabled: false` はすべての Plugin を無効にします
- `plugins.deny` は常に allow より優先されます
- `plugins.entries.\<id\>.enabled: false` はその Plugin を無効にします
- ワークスペース由来の Plugin は **デフォルトで無効** です（明示的な有効化が必要）
- バンドル済み Plugin は、上書きされない限り組み込みのデフォルト有効セットに従います
- 排他的スロットは、そのスロット用に選択された Plugin を強制的に有効にできます

## Plugin スロット（排他的カテゴリ）

一部のカテゴリは排他的です（一度に 1 つだけアクティブ）。

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // または "none" で無効化
      contextEngine: "legacy", // または plugin id
    },
  },
}
```

| スロット            | 制御対象      | デフォルト             |
| --------------- | --------------------- | ------------------- |
| `memory`        | アクティブなメモリ Plugin  | `memory-core`       |
| `contextEngine` | アクティブなコンテキストエンジン | `legacy`（組み込み） |

## CLI リファレンス

```bash
openclaw plugins list                       # 簡潔な一覧
openclaw plugins list --enabled            # 読み込まれた Plugin のみ
openclaw plugins list --verbose            # Plugin ごとの詳細行
openclaw plugins list --json               # 機械可読な一覧
openclaw plugins inspect <id>              # 詳細情報
openclaw plugins inspect <id> --json       # 機械可読
openclaw plugins inspect --all             # 全体テーブル
openclaw plugins info <id>                 # inspect の別名
openclaw plugins doctor                    # 診断

openclaw plugins install <package>         # インストール（最初に ClawHub、その後 npm）
openclaw plugins install clawhub:<pkg>     # ClawHub のみからインストール
openclaw plugins install <spec> --force    # 既存インストールを上書き
openclaw plugins install <path>            # ローカルパスからインストール
openclaw plugins install -l <path>         # 開発用にリンク（コピーしない）
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 正確な解決済み npm spec を記録
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 1 つの Plugin を更新
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # すべて更新
openclaw plugins uninstall <id>          # 設定/インストール記録を削除
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

バンドル済み Plugin は OpenClaw に同梱されています。多くはデフォルトで有効です（たとえば
バンドル済みモデル provider、バンドル済み音声 provider、バンドル済み browser
Plugin）。それ以外のバンドル済み Plugin では、引き続き `openclaw plugins enable <id>` が必要です。

`--force` は、既存インストール済み Plugin または hook pack をその場で上書きします。追跡されている npm
Plugin の通常アップグレードには `openclaw plugins update <id-or-npm-spec>` を使ってください。これは `--link` ではサポートされません。`--link` は、管理対象インストール先にコピーする代わりにソースパスを再利用するためです。

`openclaw plugins update <id-or-npm-spec>` は追跡中インストールに適用されます。
dist-tag または正確なバージョン付きの npm package spec を渡すと、パッケージ名は
追跡中の Plugin レコードへ解決し直され、今後の更新用に新しい spec が記録されます。
バージョンなしのパッケージ名を渡すと、正確に pin されたインストールはレジストリのデフォルトリリースラインへ戻されます。インストール済み npm Plugin がすでに
解決済みバージョンと記録されたアーティファクト識別子に一致している場合、OpenClaw は
ダウンロード、再インストール、設定書き換えを行わずに更新をスキップします。

`--pin` は npm 専用です。`--marketplace` とは併用できません。
marketplace インストールは npm spec の代わりに marketplace source metadata を永続化するためです。

`--dangerously-force-unsafe-install` は、組み込み dangerous-code scanner の誤検知に対する
非常用オーバーライドです。これにより、組み込みの `critical` 検出結果を超えて
Plugin のインストールと更新を続行できますが、それでも Plugin の `before_install` ポリシーブロックや scan-failure blocking は回避しません。

この CLI フラグは、Plugin の install/update フローにのみ適用されます。Gateway バックの
Skill 依存インストールでは、代わりに対応する `dangerouslyForceUnsafeInstall` リクエストオーバーライドを使用します。一方で `openclaw skills install` は、別個の ClawHub
Skill ダウンロード/インストールフローのままです。

互換 Bundle は、同じ Plugin list/inspect/enable/disable フローに参加します。
現在のランタイムサポートには、bundle Skills、Claude command-skills、
Claude `settings.json` デフォルト、Claude `.lsp.json` および manifest 宣言の
`lspServers` デフォルト、Cursor command-skills、および互換 Codex hook
ディレクトリが含まれます。

`openclaw plugins inspect <id>` は、bundle バックの Plugin に対して、検出された bundle capability と、サポート済み/未サポートの MCP および LSP server エントリも報告します。

Marketplace source には、`~/.claude/plugins/known_marketplaces.json` の
Claude 既知 marketplace 名、ローカル marketplace ルートまたは
`marketplace.json` パス、`owner/repo` のような GitHub 短縮記法、GitHub リポジトリ
URL、または git URL を使用できます。リモート marketplace では、Plugin エントリは
クローンされた marketplace リポジトリ内にとどまり、source には相対パスのみを使用する必要があります。

完全な詳細は [`openclaw plugins` CLI リファレンス](/cli/plugins) を参照してください。

## Plugin API 概要

Native Plugin は、`register(api)` を公開するエントリオブジェクトを export します。古い
Plugin では引き続き `activate(api)` をレガシーな別名として使っている場合がありますが、新しい Plugin は
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

OpenClaw はエントリオブジェクトを読み込み、Plugin
有効化中に `register(api)` を呼び出します。ローダーは古い Plugin に対しては引き続き `activate(api)` にフォールバックしますが、バンドル済み Plugin と新しい external Plugin は
`register` を公開コントラクトとして扱うべきです。

一般的な登録メソッド:

| メソッド                                  | 登録するもの           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | モデル provider（LLM）        |
| `registerChannel`                       | チャット Channel                |
| `registerTool`                          | エージェントツール                  |
| `registerHook` / `on(...)`              | ライフサイクル hook             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | ストリーミング STT               |
| `registerRealtimeVoiceProvider`         | 双方向 realtime 音声       |
| `registerMediaUnderstandingProvider`    | 画像/音声解析        |
| `registerImageGenerationProvider`       | 画像生成            |
| `registerMusicGenerationProvider`       | 音楽生成            |
| `registerVideoGenerationProvider`       | 動画生成            |
| `registerWebFetchProvider`              | Web fetch / scrape provider |
| `registerWebSearchProvider`             | Web 検索                  |
| `registerHttpRoute`                     | HTTP エンドポイント               |
| `registerCommand` / `registerCli`       | CLI コマンド                |
| `registerContextEngine`                 | コンテキストエンジン              |
| `registerService`                       | バックグラウンドサービス          |

型付きライフサイクル hook のガード動作:

- `before_tool_call`: `{ block: true }` は終端です。より低い優先度の handler はスキップされます。
- `before_tool_call`: `{ block: false }` は no-op であり、以前の block を解除しません。
- `before_install`: `{ block: true }` は終端です。より低い優先度の handler はスキップされます。
- `before_install`: `{ block: false }` は no-op であり、以前の block を解除しません。
- `message_sending`: `{ cancel: true }` は終端です。より低い優先度の handler はスキップされます。
- `message_sending`: `{ cancel: false }` は no-op であり、以前の cancel を解除しません。

型付き hook の完全な動作については、[SDK 概要](/ja-JP/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## 関連

- [Building Plugins](/ja-JP/plugins/building-plugins) — 独自の Plugin を作成する
- [Plugin Bundles](/ja-JP/plugins/bundles) — Codex/Claude/Cursor bundle 互換性
- [Plugin Manifest](/ja-JP/plugins/manifest) — manifest スキーマ
- [Registering Tools](/ja-JP/plugins/building-plugins#registering-agent-tools) — Plugin にエージェントツールを追加する
- [Plugin Internals](/ja-JP/plugins/architecture) — capability モデルと読み込みパイプライン
- [Community Plugins](/ja-JP/plugins/community) — サードパーティ一覧
