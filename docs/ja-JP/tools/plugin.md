---
read_when:
    - プラグインのインストールまたは設定
    - プラグインの検出と読み込みルールの理解
    - Codex/Claude 互換のプラグインバンドルの操作
sidebarTitle: Install and Configure
summary: OpenClaw プラグインのインストール、設定、管理
title: プラグイン
x-i18n:
    generated_at: "2026-04-25T14:01:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54a902eabd90e54e769429770cd56e1d89a8bb50aff4b9ed8a9f68d6685b77a8
    source_path: tools/plugin.md
    workflow: 15
---

プラグインは、新しい機能で OpenClaw を拡張します。channels、model providers、
agent harnesses、tools、Skills、speech、realtime transcription、realtime
voice、media-understanding、image generation、video generation、web fetch、web
search などです。プラグインには **core**（OpenClaw に同梱）と、
**external**（コミュニティによって npm に公開）の 2 種類があります。

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

    その後、設定ファイルの `plugins.entries.\<id\>.config` で設定します。

  </Step>
</Steps>

chat ネイティブな制御を使いたい場合は、`commands.plugins: true` を有効にして、次を使用します。

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

インストールパスは CLI と同じ resolver を使用します。ローカルパス/アーカイブ、明示的な
`clawhub:<pkg>`、または素の package spec（まず ClawHub、その後 npm へフォールバック）です。

設定が不正な場合、インストールは通常 fail closed し、
`openclaw doctor --fix` を案内します。唯一の回復例外は、狭く限定された bundled-plugin
再インストールパスで、これは
`openclaw.install.allowInvalidConfigRecovery` を選択しているプラグイン向けです。

パッケージ化された OpenClaw インストールでは、すべての bundled plugin の
ランタイム依存ツリーを eager にインストールしません。
bundled の OpenClaw 所有プラグインが、plugin config、
レガシー channel config、またはデフォルト有効の manifest から有効になっている場合、
起動時にはそのプラグインが宣言したランタイム依存関係だけを修復してから import します。
明示的な無効化は引き続き優先されます。`plugins.entries.<id>.enabled: false`、
`plugins.deny`、`plugins.enabled: false`、および `channels.<id>.enabled: false` は、
そのプラグイン/チャネルに対する自動 bundled ランタイム依存修復を防ぎます。
external プラグインとカスタム load path は、引き続き
`openclaw plugins install` でインストールする必要があります。

## プラグインの種類

OpenClaw は 2 つのプラグイン形式を認識します。

| 形式 | 動作 | 例 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイムモジュール。プロセス内で実行 | 公式プラグイン、コミュニティ npm パッケージ |
| **Bundle** | Codex/Claude/Cursor 互換レイアウト。OpenClaw 機能にマッピング | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

どちらも `openclaw plugins list` に表示されます。bundle の詳細は [Plugin Bundles](/ja-JP/plugins/bundles) を参照してください。

native プラグインを書く場合は、[Building Plugins](/ja-JP/plugins/building-plugins)
および [Plugin SDK Overview](/ja-JP/plugins/sdk-overview) から始めてください。

## 公式プラグイン

### インストール可能（npm）

| プラグイン | パッケージ | ドキュメント |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix | `@openclaw/matrix` | [Matrix](/ja-JP/channels/matrix) |
| Microsoft Teams | `@openclaw/msteams` | [Microsoft Teams](/ja-JP/channels/msteams) |
| Nostr | `@openclaw/nostr` | [Nostr](/ja-JP/channels/nostr) |
| Voice Call | `@openclaw/voice-call` | [Voice Call](/ja-JP/plugins/voice-call) |
| Zalo | `@openclaw/zalo` | [Zalo](/ja-JP/channels/zalo) |
| Zalo Personal | `@openclaw/zalouser` | [Zalo Personal](/ja-JP/plugins/zalouser) |

### Core（OpenClaw に同梱）

<AccordionGroup>
  <Accordion title="Model providers（デフォルトで有効）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory プラグイン">
    - `memory-core` — bundled memory search（`plugins.slots.memory` 経由のデフォルト）
    - `memory-lancedb` — 自動 recall/capture を備えた install-on-demand の長期 memory（`plugins.slots.memory = "memory-lancedb"` を設定）
  </Accordion>

  <Accordion title="Speech providers（デフォルトで有効）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` — browser tool、`openclaw browser` CLI、`browser.request` Gateway メソッド、browser runtime、およびデフォルト browser control service 向けの bundled browser plugin（デフォルトで有効。置き換える前に無効化してください）
    - `copilot-proxy` — VS Code Copilot Proxy ブリッジ（デフォルトで無効）
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
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| フィールド | 説明 |
| ---------------- | --------------------------------------------------------- |
| `enabled` | マスタートグル（デフォルト: `true`） |
| `allow` | プラグイン allowlist（任意） |
| `deny` | プラグイン denylist（任意。deny が優先） |
| `load.paths` | 追加のプラグインファイル/ディレクトリ |
| `slots` | 排他的スロットセレクター（例: `memory`, `contextEngine`） |
| `entries.\<id\>` | プラグインごとのトグル + 設定 |

設定変更には **gateway の再起動が必要** です。Gateway が config
watch + in-process restart を有効にして実行されている場合（デフォルトの `openclaw gateway` パス）、
その再起動は通常、config 書き込み反映の少し後に自動実行されます。
native プラグインのランタイムコードや lifecycle
hooks に対して、サポートされた hot-reload パスはありません。更新した `register(api)` コード、
`api.on(...)` hooks、tools、services、または
provider/runtime hooks の実行を期待する前に、ライブ channel を提供している
Gateway プロセスを再起動してください。

`openclaw plugins list` はローカル CLI/config のスナップショットです。そこに `loaded` とある
プラグインは、その CLI 呼び出しから見えている config/files から検出可能かつ読み込み可能であることを意味します。
これは、すでに実行中のリモート Gateway child が
同じプラグインコードに再起動済みであることの証明にはなりません。wrapper
process を使う VPS/container 構成では、実際の `openclaw gateway run` プロセスに
再起動を送るか、実行中の Gateway に対して `openclaw gateway restart` を使用してください。

<Accordion title="プラグイン状態: disabled vs missing vs invalid">
  - **Disabled**: プラグインは存在するが、有効化ルールによって無効になっている。設定は保持される。
  - **Missing**: 設定がプラグイン id を参照しているが、検出で見つからなかった。
  - **Invalid**: プラグインは存在するが、その設定が宣言されたスキーマに一致しない。
</Accordion>

## 検出と優先順位

OpenClaw は次の順でプラグインをスキャンします（最初に一致したものが優先）。

<Steps>
  <Step title="設定パス">
    `plugins.load.paths` — 明示的なファイルまたはディレクトリパス。
  </Step>

  <Step title="ワークスペースプラグイン">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` および `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバルプラグイン">
    `~/.openclaw/<plugin-root>/*.ts` および `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="Bundled plugins">
    OpenClaw に同梱。多くはデフォルトで有効（model providers、speech）。
    その他は明示的な有効化が必要。
  </Step>
</Steps>

### 有効化ルール

- `plugins.enabled: false` はすべてのプラグインを無効化する
- `plugins.deny` は常に allow より優先する
- `plugins.entries.\<id\>.enabled: false` はそのプラグインを無効化する
- ワークスペース由来のプラグインは **デフォルトで無効**（明示的に有効化する必要がある）
- bundled plugins は、上書きされない限り組み込みのデフォルト有効セットに従う
- 排他的スロットは、そのスロットで選択されたプラグインを強制的に有効化できる
- 一部の bundled オプトインプラグインは、
  provider model ref、channel config、または harness
  runtime など、設定がプラグイン所有のサーフェスを指名すると自動的に有効化される
- OpenAI 系の Codex ルートは個別のプラグイン境界を維持する:
  `openai-codex/*` は OpenAI プラグインに属し、一方 bundled Codex
  app-server plugin は `embeddedHarness.runtime: "codex"` またはレガシー
  `codex/*` model refs で選択される

## ランタイム hooks のトラブルシューティング

プラグインが `plugins list` に表示されていても、`register(api)` の副作用や hooks が
ライブチャットトラフィックで動作しない場合は、まず次を確認してください。

- `openclaw gateway status --deep --require-rpc` を実行し、アクティブな
  Gateway URL、profile、config path、および process が、実際に編集しているものと一致していることを確認する。
- プラグインのインストール/設定/コード変更後に live Gateway を再起動する。wrapper
  container では、PID 1 は supervisor に過ぎないことがある。その場合は child の
  `openclaw gateway run` プロセスを再起動または signal する。
- `openclaw plugins inspect <id> --json` を使って、hook registrations と
  diagnostics を確認する。`llm_input`、
  `llm_output`、`agent_end` のような非 bundled conversation hooks には、
  `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要。
- モデル切り替えには `before_model_resolve` を優先する。これは agent ターンの
  model 解決前に実行される。`llm_output` は、model attempt が
  assistant 出力を生成した後にのみ実行される。
- 実効セッションモデルの確認には `openclaw sessions` または
  Gateway の session/status サーフェスを使い、provider payload をデバッグする場合は
  Gateway を `--raw-stream --raw-stream-path <path>` 付きで起動する。

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

| スロット | 制御対象 | デフォルト |
| --------------- | --------------------- | ------------------- |
| `memory` | Active Memory プラグイン | `memory-core` |
| `contextEngine` | アクティブな context engine | `legacy`（組み込み） |

## CLI リファレンス

```bash
openclaw plugins list                       # コンパクトな一覧
openclaw plugins list --enabled            # 読み込まれているプラグインのみ
openclaw plugins list --verbose            # プラグインごとの詳細行
openclaw plugins list --json               # 機械可読な一覧
openclaw plugins inspect <id>              # 詳細情報
openclaw plugins inspect <id> --json       # 機械可読
openclaw plugins inspect --all             # 全体テーブル
openclaw plugins info <id>                 # inspect の別名
openclaw plugins doctor                    # 診断

openclaw plugins install <package>         # インストール（まず ClawHub、その後 npm）
openclaw plugins install clawhub:<pkg>     # ClawHub からのみインストール
openclaw plugins install <spec> --force    # 既存インストールを上書き
openclaw plugins install <path>            # ローカルパスからインストール
openclaw plugins install -l <path>         # 開発用にリンク（コピーなし）
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 解決された正確な npm spec を記録
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 1 つのプラグインを更新
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # すべて更新
openclaw plugins uninstall <id>          # 設定/インストール記録を削除
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

bundled plugins は OpenClaw に同梱されています。多くはデフォルトで有効です（たとえば
bundled model providers、bundled speech providers、および bundled browser
plugin）。その他の bundled plugins では引き続き `openclaw plugins enable <id>` が必要です。

`--force` は、既存のインストール済みプラグインまたは hook pack をその場で上書きします。追跡対象 npm
プラグインの日常的なアップグレードには `openclaw plugins update <id-or-npm-spec>` を使用してください。
これは `--link` ではサポートされません。`--link` は、管理対象のインストール先へ
コピーする代わりに、ソースパスを再利用するためです。

`plugins.allow` がすでに設定されている場合、`openclaw plugins install` は、
インストールしたプラグイン id を有効化前にその allowlist に追加するため、
再起動後すぐに読み込み可能になります。

`openclaw plugins update <id-or-npm-spec>` は追跡対象のインストールに適用されます。
dist-tag または正確なバージョン付きの npm package spec を渡すと、パッケージ名は
追跡中プラグイン記録に解決し直され、今後の更新用に新しい spec が記録されます。
バージョンなしで package 名を渡すと、正確に pin されたインストールは
レジストリのデフォルトリリースラインに戻ります。インストール済み npm プラグインがすでに
解決済みバージョンおよび記録済み artifact identity に一致している場合、OpenClaw は
ダウンロード、再インストール、設定書き換えを行わずに更新をスキップします。

`--pin` は npm 専用です。`--marketplace` とはサポートされません。
marketplace インストールは npm spec ではなく、
marketplace source metadata を永続化するためです。

`--dangerously-force-unsafe-install` は、組み込み dangerous-code scanner の誤検知に対する緊急用オーバーライドです。
これにより、組み込みの `critical` findings があってもプラグインのインストール
および更新を続行できますが、プラグインの `before_install` ポリシーブロックや
スキャン失敗によるブロックは依然として回避しません。

この CLI フラグは、プラグインの install/update フローにのみ適用されます。Gateway ベースの Skill
依存インストールでは、代わりに対応する `dangerouslyForceUnsafeInstall` リクエスト
オーバーライドを使用します。一方で `openclaw skills install` は、別個の ClawHub
Skill ダウンロード/インストールフローのままです。

互換 bundle は、同じ plugin の list/inspect/enable/disable フローに参加します。
現在のランタイムサポートには、bundle Skills、Claude command-skills、
Claude `settings.json` defaults、Claude `.lsp.json` と manifest 宣言の
`lspServers` defaults、Cursor command-skills、および互換性のある Codex hook
directories が含まれます。

`openclaw plugins inspect <id>` は、bundle ベースのプラグイン向けに検出された
bundle capabilities と、サポート済みまたは未サポートの MCP および LSP server エントリも報告します。

marketplace source には、
`~/.claude/plugins/known_marketplaces.json` にある Claude の既知 marketplace 名、
ローカル marketplace root または `marketplace.json` パス、`owner/repo` のような GitHub 省略記法、
GitHub repo URL、または git URL を使用できます。リモート marketplace では、
プラグインエントリはクローンされた marketplace repo 内に留まり、
相対パス source のみを使用する必要があります。

完全な詳細は [`openclaw plugins` CLI reference](/ja-JP/cli/plugins) を参照してください。

## プラグイン API 概要

native プラグインは `register(api)` を公開する entry object をエクスポートします。古い
プラグインではレガシーな別名として `activate(api)` を引き続き使う場合がありますが、新しいプラグインは
`register` を使用してください。

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

OpenClaw は entry object を読み込み、プラグイン有効化中に `register(api)` を呼び出します。loader は古いプラグイン向けに依然として `activate(api)` へフォールバックしますが、
bundled plugins と新しい external プラグインは、`register` を公開 contract として扱うべきです。

`api.registrationMode` は、その entry がなぜ読み込まれているかをプラグインに伝えます。

| モード | 意味 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | ランタイム有効化。tools、hooks、services、commands、routes、およびその他のライブ副作用を登録する。 |
| `discovery`     | 読み取り専用の capability 検出。providers と metadata を登録する。信頼済み plugin entry code は読み込まれることがあるが、ライブ副作用はスキップする。 |
| `setup-only`    | 軽量な setup entry を通じた Channel セットアップ metadata の読み込み。 |
| `setup-runtime` | ランタイム entry も必要とする Channel セットアップの読み込み。 |
| `cli-metadata`  | CLI コマンド metadata の収集のみ。 |

ソケット、データベース、バックグラウンドワーカー、または長寿命クライアントを開くプラグイン entry は、
それらの副作用を `api.registrationMode === "full"` でガードする必要があります。
discovery 読み込みは有効化読み込みとは別にキャッシュされ、実行中 Gateway registry を
置き換えません。discovery は非有効化ですが import-free ではありません。OpenClaw は
スナップショット構築のために、信頼済み plugin entry または channel plugin module を
評価することがあります。module top level は軽量かつ副作用なしに保ち、
ネットワーククライアント、subprocess、listeners、認証情報読み取り、および service 起動は
full-runtime パスの後ろに移動してください。

一般的な登録メソッド:

| メソッド | 登録対象 |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | モデルプロバイダー (LLM) |
| `registerChannel`                       | チャットチャネル |
| `registerTool`                          | エージェントツール |
| `registerHook` / `on(...)`              | ライフサイクル hooks |
| `registerSpeechProvider`                | Text-to-speech / STT |
| `registerRealtimeTranscriptionProvider` | ストリーミング STT |
| `registerRealtimeVoiceProvider`         | 双方向 realtime voice |
| `registerMediaUnderstandingProvider`    | 画像/音声解析 |
| `registerImageGenerationProvider`       | 画像生成 |
| `registerMusicGenerationProvider`       | 音楽生成 |
| `registerVideoGenerationProvider`       | 動画生成 |
| `registerWebFetchProvider`              | Web fetch / scrape provider |
| `registerWebSearchProvider`             | Web 検索 |
| `registerHttpRoute`                     | HTTP エンドポイント |
| `registerCommand` / `registerCli`       | CLI コマンド |
| `registerContextEngine`                 | context engine |
| `registerService`                       | バックグラウンドサービス |

型付きライフサイクル hook のガード動作:

- `before_tool_call`: `{ block: true }` は終端的であり、より低優先度のハンドラーはスキップされる。
- `before_tool_call`: `{ block: false }` は no-op であり、以前の block を解除しない。
- `before_install`: `{ block: true }` は終端的であり、より低優先度のハンドラーはスキップされる。
- `before_install`: `{ block: false }` は no-op であり、以前の block を解除しない。
- `message_sending`: `{ cancel: true }` は終端的であり、より低優先度のハンドラーはスキップされる。
- `message_sending`: `{ cancel: false }` は no-op であり、以前の cancel を解除しない。

native Codex app-server 実行は、Codex ネイティブなツールイベントをこの
hook サーフェスにブリッジします。プラグインは `before_tool_call` を通じてネイティブ Codex tools をブロックし、
`after_tool_call` を通じて結果を観測し、Codex
`PermissionRequest` 承認にも参加できます。このブリッジは、まだ Codex ネイティブな tool
引数を書き換えません。正確な Codex ランタイムサポート境界は、
[Codex harness v1 support contract](/ja-JP/plugins/codex-harness#v1-support-contract) にあります。

完全な型付き hook 挙動については、[SDK overview](/ja-JP/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## 関連

- [Building plugins](/ja-JP/plugins/building-plugins) — 独自のプラグインを作成する
- [Plugin bundles](/ja-JP/plugins/bundles) — Codex/Claude/Cursor bundle 互換性
- [Plugin manifest](/ja-JP/plugins/manifest) — manifest スキーマ
- [Registering tools](/ja-JP/plugins/building-plugins#registering-agent-tools) — プラグインに agent tools を追加する
- [Plugin internals](/ja-JP/plugins/architecture) — capability モデルと load pipeline
- [Community plugins](/ja-JP/plugins/community) — サードパーティ一覧
