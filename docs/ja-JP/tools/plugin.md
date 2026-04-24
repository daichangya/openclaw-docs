---
read_when:
    - プラグインのインストールまたは設定
    - プラグインの検出と読み込みルールを理解する
    - Codex/Claude互換のプラグインバンドルを扱う
sidebarTitle: Install and Configure
summary: OpenClawのプラグインをインストール、設定、管理する
title: プラグイン
x-i18n:
    generated_at: "2026-04-24T15:21:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 947bb7ffc13280fd63f79bb68cb18a37c6614144b91a83afd38e5ac3c5187aed
    source_path: tools/plugin.md
    workflow: 15
---

プラグインは新しい機能でOpenClawを拡張します。たとえば、チャネル、モデルプロバイダー、
エージェントハーネス、ツール、Skills、音声、リアルタイム文字起こし、リアルタイム
音声、メディア理解、画像生成、動画生成、Web取得、Web
検索などです。一部のプラグインは**コア**（OpenClawに同梱）で、その他は
**外部**（コミュニティによってnpmで公開）です。

## クイックスタート

<Steps>
  <Step title="読み込まれているものを確認する">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="プラグインをインストールする">
    ```bash
    # npmから
    openclaw plugins install @openclaw/voice-call

    # ローカルディレクトリまたはアーカイブから
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gatewayを再起動する">
    ```bash
    openclaw gateway restart
    ```

    その後、設定ファイルの `plugins.entries.\<id\>.config` で設定します。

  </Step>
</Steps>

チャットネイティブな操作を使いたい場合は、`commands.plugins: true` を有効にして、次を使用します。

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

インストールパスはCLIと同じリゾルバーを使用します。ローカルパス/アーカイブ、明示的な
`clawhub:<pkg>`、または素のパッケージ指定（最初にClawHub、次にnpmへフォールバック）です。

設定が無効な場合、通常はインストールは安全側で失敗し、
`openclaw doctor --fix` を案内します。唯一の回復例外は、オプトインしているプラグイン向けの、
同梱プラグインの限定的な再インストール経路です。
`openclaw.install.allowInvalidConfigRecovery`。

パッケージ化されたOpenClawインストールでは、同梱されたすべてのプラグインの
ランタイム依存ツリーを事前にすべてインストールしません。
OpenClaw所有の同梱プラグインが、プラグイン設定、レガシーチャネル設定、
またはデフォルトで有効なマニフェストからアクティブな場合、起動時の
修復では、そのプラグインをインポートする前に、そのプラグインが宣言した
ランタイム依存関係だけを修復します。
外部プラグインおよびカスタム読み込みパスは、引き続き
`openclaw plugins install` でインストールする必要があります。

## プラグインの種類

OpenClawは2つのプラグイン形式を認識します。

| 形式 | 仕組み | 例 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ランタイムモジュール。インプロセスで実行される | 公式プラグイン、コミュニティのnpmパッケージ |
| **Bundle** | Codex/Claude/Cursor互換レイアウト。OpenClawの機能にマッピングされる | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

どちらも `openclaw plugins list` に表示されます。バンドルの詳細は [プラグインバンドル](/ja-JP/plugins/bundles) を参照してください。

Nativeプラグインを作成する場合は、[プラグインの構築](/ja-JP/plugins/building-plugins)
と [Plugin SDK Overview](/ja-JP/plugins/sdk-overview) から始めてください。

## 公式プラグイン

### インストール可能（npm）

| プラグイン | パッケージ | ドキュメント |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/ja-JP/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/ja-JP/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/ja-JP/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/ja-JP/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/ja-JP/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/ja-JP/plugins/zalouser)   |

### コア（OpenClawに同梱）

<AccordionGroup>
  <Accordion title="モデルプロバイダー（デフォルトで有効）">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="メモリプラグイン">
    - `memory-core` — 同梱のメモリ検索（`plugins.slots.memory` によるデフォルト）
    - `memory-lancedb` — 自動リコール/キャプチャ付きのオンデマンドインストール長期メモリ（`plugins.slots.memory = "memory-lancedb"` を設定）
  </Accordion>

  <Accordion title="音声プロバイダー（デフォルトで有効）">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="その他">
    - `browser` — ブラウザツール、`openclaw browser` CLI、`browser.request` Gatewayメソッド、ブラウザランタイム、およびデフォルトのブラウザ制御サービス向けの同梱ブラウザプラグイン（デフォルトで有効。置き換える前に無効化してください）
    - `copilot-proxy` — VS Code Copilot Proxyブリッジ（デフォルトでは無効）
  </Accordion>
</AccordionGroup>

サードパーティ製プラグインを探していますか？ [コミュニティプラグイン](/ja-JP/plugins/community) を参照してください。

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
| `enabled`        | マスタートグル（デフォルト: `true`） |
| `allow`          | プラグインの許可リスト（任意） |
| `deny`           | プラグインの拒否リスト（任意。拒否が優先） |
| `load.paths`     | 追加のプラグインファイル/ディレクトリ |
| `slots`          | 排他的スロットのセレクター（例: `memory`, `contextEngine`） |
| `entries.\<id\>` | プラグインごとのトグル + 設定 |

設定の変更は**Gatewayの再起動が必要**です。Gatewayが設定監視と
インプロセス再起動を有効にして実行されている場合（デフォルトの `openclaw gateway` 経路）、
通常、その再起動は設定の書き込みが反映された少し後に自動で実行されます。
Nativeプラグインのランタイムコードやライフサイクル
フックに対する、サポートされたホットリロード経路はありません。更新された
`register(api)` コード、`api.on(...)` フック、ツール、サービス、または
プロバイダー/ランタイムフックが実行されることを期待する前に、
ライブチャネルを提供しているGatewayプロセスを再起動してください。

`openclaw plugins list` はローカルのCLI/設定スナップショットです。そこにある `loaded` プラグインは、
そのCLI呼び出しで見えている設定/ファイルから、そのプラグインが検出可能かつ読み込み可能であることを意味します。
しかし、それは、すでに実行中のリモートGateway子プロセスが
同じプラグインコードに再起動されたことの証明にはなりません。
ラッパープロセスを使うVPS/コンテナ構成では、実際の
`openclaw gateway run` プロセスに再起動を送るか、
実行中のGatewayに対して `openclaw gateway restart` を使用してください。

<Accordion title="プラグイン状態: 無効、欠落、無効設定">
  - **無効**: プラグインは存在するが、有効化ルールによってオフになっている状態。設定は保持されます。
  - **欠落**: 設定がプラグインidを参照しているが、検出で見つからなかった状態。
  - **無効設定**: プラグインは存在するが、その設定が宣言されたスキーマに一致しない状態。
</Accordion>

## 検出と優先順位

OpenClawは次の順序でプラグインをスキャンします（最初に一致したものが優先）:

<Steps>
  <Step title="設定パス">
    `plugins.load.paths` — 明示的なファイルまたはディレクトリのパス。
  </Step>

  <Step title="ワークスペースプラグイン">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` および `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="グローバルプラグイン">
    `~/.openclaw/<plugin-root>/*.ts` および `~/.openclaw/<plugin-root>/*/index.ts`。
  </Step>

  <Step title="同梱プラグイン">
    OpenClawに同梱されています。多くはデフォルトで有効です（モデルプロバイダー、音声）。
    その他は明示的な有効化が必要です。
  </Step>
</Steps>

### 有効化ルール

- `plugins.enabled: false` はすべてのプラグインを無効化します
- `plugins.deny` は常に allow より優先されます
- `plugins.entries.\<id\>.enabled: false` はそのプラグインを無効化します
- ワークスペース由来のプラグインは**デフォルトで無効**です（明示的に有効化する必要があります）
- 同梱プラグインは、上書きされない限り、組み込みのデフォルト有効セットに従います
- 排他的スロットは、そのスロット用に選択されたプラグインを強制的に有効化できます
- 一部のオプトイン型同梱プラグインは、設定で
  プラグイン所有サーフェス（プロバイダーモデル参照、チャネル設定、またはハーネス
  ランタイムなど）が指定されると自動的に有効化されます
- OpenAIファミリーのCodexルートは、プラグイン境界を別々に保ちます:
  `openai-codex/*` はOpenAIプラグインに属し、一方で同梱のCodex
  app-serverプラグインは `embeddedHarness.runtime: "codex"` またはレガシーの
  `codex/*` モデル参照で選択されます

## ランタイムフックのトラブルシューティング

プラグインが `plugins list` には表示されるのに、`register(api)` の副作用やフックが
ライブチャットトラフィックで実行されない場合は、まず次を確認してください。

- `openclaw gateway status --deep --require-rpc` を実行し、アクティブな
  Gateway URL、プロファイル、設定パス、プロセスが、いま編集しているものと一致していることを確認します。
- プラグインのインストール/設定/コード変更後に、ライブGatewayを再起動します。ラッパー
  コンテナでは、PID 1 は単なるスーパーバイザーである場合があります。その場合は子の
  `openclaw gateway run` プロセスを再起動またはシグナル送信してください。
- `openclaw plugins inspect <id> --json` を使って、フック登録と
  診断を確認します。`llm_input`、
  `llm_output`、`agent_end` のような同梱以外の会話フックには、
  `plugins.entries.<id>.hooks.allowConversationAccess=true` が必要です。
- モデル切り替えには、`before_model_resolve` を推奨します。これはエージェントターンの
  モデル解決前に実行されます。`llm_output` は、モデル試行が
  アシスタント出力を生成した後にしか実行されません。
- 実際に有効なセッションモデルの証明には、`openclaw sessions` または
  Gatewayのセッション/ステータスサーフェスを使用し、プロバイダーペイロードをデバッグする場合は、
  Gatewayを `--raw-stream --raw-stream-path <path>` 付きで起動してください。

## プラグインスロット（排他的カテゴリ）

一部のカテゴリは排他的です（一度に1つだけアクティブ）:

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // または無効化するには "none"
      contextEngine: "legacy", // またはプラグインid
    },
  },
}
```

| スロット | 制御対象 | デフォルト |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active Memoryプラグイン | `memory-core` |
| `contextEngine` | アクティブなコンテキストエンジン | `legacy`（組み込み） |

## CLIリファレンス

```bash
openclaw plugins list                       # コンパクトな一覧
openclaw plugins list --enabled            # 読み込まれたプラグインのみ
openclaw plugins list --verbose            # プラグインごとの詳細行
openclaw plugins list --json               # 機械可読な一覧
openclaw plugins inspect <id>              # 詳細情報
openclaw plugins inspect <id> --json       # 機械可読
openclaw plugins inspect --all             # フリート全体のテーブル
openclaw plugins info <id>                 # inspectのエイリアス
openclaw plugins doctor                    # 診断

openclaw plugins install <package>         # インストール（最初にClawHub、次にnpm）
openclaw plugins install clawhub:<pkg>     # ClawHubのみからインストール
openclaw plugins install <spec> --force    # 既存のインストールを上書き
openclaw plugins install <path>            # ローカルパスからインストール
openclaw plugins install -l <path>         # 開発用にリンク（コピーなし）
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # 解決された正確なnpm指定を記録
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # 1つのプラグインを更新
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # すべて更新
openclaw plugins uninstall <id>          # 設定/インストール記録を削除
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

同梱プラグインはOpenClawに同梱されています。多くはデフォルトで有効です（たとえば、
同梱モデルプロバイダー、同梱音声プロバイダー、同梱browser
プラグインなど）。一方で、その他の同梱プラグインは依然として `openclaw plugins enable <id>` が必要です。

`--force` は、既存のインストール済みプラグインまたはフックパックをその場で上書きします。追跡対象のnpm
プラグインの日常的なアップグレードには
`openclaw plugins update <id-or-npm-spec>` を使用してください。これは
`--link` とは併用できません。`--link` は、管理対象のインストール先にコピーする代わりに、
ソースパスを再利用するためです。

`plugins.allow` がすでに設定されている場合、`openclaw plugins install` は
有効化する前に、インストールされたプラグインidをその許可リストに追加するため、
再起動後すぐにインストールしたプラグインを読み込めます。

`openclaw plugins update <id-or-npm-spec>` は追跡対象のインストールに適用されます。
dist-tagまたは厳密なバージョン付きのnpmパッケージ指定を渡すと、パッケージ名が
追跡対象のプラグインレコードに解決し直され、今後の更新用に新しい指定が記録されます。
バージョンなしでパッケージ名を渡すと、厳密にpinされたインストールは
レジストリのデフォルトのリリースラインに戻ります。インストール済みのnpmプラグインが
すでに解決済みバージョンと記録済みアーティファクトIDに一致している場合、
OpenClawはダウンロード、再インストール、設定の書き換えを行わずに更新をスキップします。

`--pin` はnpm専用です。`--marketplace` とは併用できません。これは
マーケットプレイス経由のインストールでは、npm指定の代わりに
マーケットプレイスのソースメタデータが保持されるためです。

`--dangerously-force-unsafe-install` は、組み込みの危険コードスキャナーによる
誤検知に対する非常用の上書きオプションです。これにより、組み込みの `critical`
検出結果があってもプラグインのインストールと更新を続行できますが、それでも
プラグインの `before_install` ポリシーブロックやスキャン失敗によるブロックは回避しません。

このCLIフラグは、プラグインのインストール/更新フローにのみ適用されます。Gatewayを使うSkillの
依存関係インストールでは、代わりに対応する
`dangerouslyForceUnsafeInstall` リクエストオーバーライドを使用します。一方、
`openclaw skills install` は引き続き別個のClawHub
Skillダウンロード/インストールフローです。

互換バンドルは、同じプラグインのlist/inspect/enable/disableフローに参加します。
現在のランタイムサポートには、バンドルSkill、Claude command-skills、
Claude `settings.json` のデフォルト、Claude `.lsp.json` および
manifestで宣言された `lspServers` のデフォルト、Cursor command-skills、
互換性のあるCodexフックディレクトリが含まれます。

`openclaw plugins inspect <id>` は、検出されたバンドル機能に加えて、
バンドルベースのプラグインに対してサポートされる、またはサポートされないMCPおよびLSPサーバー項目も報告します。

マーケットプレイスのソースには、
`~/.claude/plugins/known_marketplaces.json` にあるClaude既知マーケットプレイス名、
ローカルのマーケットプレイスルートまたは `marketplace.json` パス、
`owner/repo` のようなGitHub省略記法、GitHubリポジトリURL、またはgit URLを指定できます。
リモートマーケットプレイスでは、プラグインエントリはクローンされた
マーケットプレイスリポジトリ内にとどまり、相対パスのソースのみを使用する必要があります。

詳細は [`openclaw plugins` CLIリファレンス](/ja-JP/cli/plugins) を参照してください。

## プラグインAPI概要

Nativeプラグインは、`register(api)` を公開するエントリオブジェクトをエクスポートします。古い
プラグインでは、レガシーエイリアスとして `activate(api)` をまだ使用している場合がありますが、
新しいプラグインは `register` を使用するべきです。

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

OpenClawはエントリオブジェクトを読み込み、プラグインの
アクティベーション中に `register(api)` を呼び出します。ローダーは古いプラグイン向けに
引き続き `activate(api)` にフォールバックしますが、
同梱プラグインと新しい外部プラグインでは `register` を
公開契約として扱うべきです。

一般的な登録メソッド:

| メソッド | 登録するもの |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | モデルプロバイダー（LLM） |
| `registerChannel`                       | チャットチャネル |
| `registerTool`                          | エージェントツール |
| `registerHook` / `on(...)`              | ライフサイクルフック |
| `registerSpeechProvider`                | Text-to-speech / STT |
| `registerRealtimeTranscriptionProvider` | ストリーミングSTT |
| `registerRealtimeVoiceProvider`         | 双方向リアルタイム音声 |
| `registerMediaUnderstandingProvider`    | 画像/音声解析 |
| `registerImageGenerationProvider`       | 画像生成 |
| `registerMusicGenerationProvider`       | 音楽生成 |
| `registerVideoGenerationProvider`       | 動画生成 |
| `registerWebFetchProvider`              | Web取得 / スクレイププロバイダー |
| `registerWebSearchProvider`             | Web検索 |
| `registerHttpRoute`                     | HTTPエンドポイント |
| `registerCommand` / `registerCli`       | CLIコマンド |
| `registerContextEngine`                 | コンテキストエンジン |
| `registerService`                       | バックグラウンドサービス |

型付きライフサイクルフックに対するフックガードの動作:

- `before_tool_call`: `{ block: true }` は終端です。より低い優先度のハンドラーはスキップされます。
- `before_tool_call`: `{ block: false }` は何もしない動作で、以前の block を解除しません。
- `before_install`: `{ block: true }` は終端です。より低い優先度のハンドラーはスキップされます。
- `before_install`: `{ block: false }` は何もしない動作で、以前の block を解除しません。
- `message_sending`: `{ cancel: true }` は終端です。より低い優先度のハンドラーはスキップされます。
- `message_sending`: `{ cancel: false }` は何もしない動作で、以前の cancel を解除しません。

型付きフックの完全な動作については、[SDK Overview](/ja-JP/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## 関連

- [プラグインの構築](/ja-JP/plugins/building-plugins) — 独自のプラグインを作成する
- [プラグインバンドル](/ja-JP/plugins/bundles) — Codex/Claude/Cursorバンドル互換性
- [プラグインマニフェスト](/ja-JP/plugins/manifest) — マニフェストスキーマ
- [ツールの登録](/ja-JP/plugins/building-plugins#registering-agent-tools) — プラグインにエージェントツールを追加する
- [Plugin Internals](/ja-JP/plugins/architecture) — 機能モデルと読み込みパイプライン
- [コミュニティプラグイン](/ja-JP/plugins/community) — サードパーティの一覧
