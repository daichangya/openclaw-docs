---
read_when:
    - 新しいOpenClaw pluginを作成したい場合
    - plugin 開発のクイックスタートが必要な場合
    - OpenClaw に新しいチャネル、provider、ツール、またはその他の機能を追加している場合
sidebarTitle: Getting Started
summary: 数分で最初のOpenClaw pluginを作成する
title: Plugin の構築
x-i18n:
    generated_at: "2026-04-23T04:47:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35faa4e2722a58aa12330103b42d2dd6e14e56ee46720883d0945a984d991f79
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Plugin の構築

Plugin は OpenClaw を新しい機能で拡張します。チャネル、モデル provider、
音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像
生成、動画生成、Web fetch、Web search、エージェントツール、またはそれらの任意の
組み合わせを追加できます。

plugin を OpenClaw リポジトリに追加する必要はありません。
[ClawHub](/ja-JP/tools/clawhub) または npm に公開し、ユーザーは
`openclaw plugins install <package-name>` でインストールします。OpenClaw はまず ClawHub を試し、
自動的に npm にフォールバックします。

## 前提条件

- Node >= 22 とパッケージマネージャー（npm または pnpm）
- TypeScript（ESM）に慣れていること
- リポジトリ内 plugin の場合: リポジトリを clone 済みで `pnpm install` 済みであること

## どの種類の plugin ですか？

<CardGroup cols={3}>
  <Card title="チャネル plugin" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    OpenClaw をメッセージングプラットフォーム（Discord、IRC など）に接続します
  </Card>
  <Card title="provider plugin" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデル provider（LLM、プロキシ、またはカスタムエンドポイント）を追加します
  </Card>
  <Card title="ツール / フック plugin" icon="wrench">
    エージェントツール、イベントフック、またはサービスを登録します — 以下へ進んでください
  </Card>
</CardGroup>

チャネル plugin が任意であり、オンボーディング/セットアップ実行時にインストールされていない可能性がある場合は、
`openclaw/plugin-sdk/channel-setup` の
`createOptionalChannelSetupSurface(...)` を使用してください。これにより、
インストール要件を通知し、plugin がインストールされるまで実際の設定書き込みを closed-fail させる
セットアップアダプター + ウィザードのペアが生成されます。

## クイックスタート: ツール plugin

このウォークスルーでは、エージェントツールを登録する最小の plugin を作成します。チャネル
plugin と provider plugin には、上でリンクした専用ガイドがあります。

<Steps>
  <Step title="パッケージとマニフェストを作成する">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "OpenClaw にカスタムツールを追加します",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    設定がなくても、すべての plugin にはマニフェストが必要です。完全なスキーマについては
    [Manifest](/ja-JP/plugins/manifest) を参照してください。正規の ClawHub
    公開スニペットは `docs/snippets/plugin-publish/` にあります。

  </Step>

  <Step title="エントリーポイントを書く">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` は非チャネル plugin 用です。チャネルには
    `defineChannelPluginEntry` を使用してください。詳しくは [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) を参照してください。
    エントリーポイントの完全なオプションについては、[Entry Points](/ja-JP/plugins/sdk-entrypoints) を参照してください。

  </Step>

  <Step title="テストして公開する">

    **外部 plugin:** ClawHub で検証して公開し、その後インストールします。

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw は、`@myorg/openclaw-my-plugin` のような
    パッケージ指定では、npm より前に ClawHub も確認します。

    **リポジトリ内 plugin:** バンドルされた plugin ワークスペースツリー配下に配置します。自動的に検出されます。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin の機能

1つの plugin は、`api` オブジェクトを通じて任意の数の機能を登録できます。

| 機能 | 登録メソッド | 詳細ガイド |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| テキスト推論（LLM） | `api.registerProvider(...)` | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) |
| CLI 推論バックエンド | `api.registerCliBackend(...)` | [CLI Backends](/ja-JP/gateway/cli-backends) |
| チャネル / メッセージング | `api.registerChannel(...)` | [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) |
| 音声（TTS/STT） | `api.registerSpeechProvider(...)` | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| リアルタイム音声 | `api.registerRealtimeVoiceProvider(...)` | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| メディア理解 | `api.registerMediaUnderstandingProvider(...)` | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 画像生成 | `api.registerImageGenerationProvider(...)` | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 音楽生成 | `api.registerMusicGenerationProvider(...)` | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 動画生成 | `api.registerVideoGenerationProvider(...)` | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch | `api.registerWebFetchProvider(...)` | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search | `api.registerWebSearchProvider(...)` | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Embedded Pi 拡張 | `api.registerEmbeddedExtensionFactory(...)` | [SDK Overview](/ja-JP/plugins/sdk-overview#registration-api) |
| エージェントツール | `api.registerTool(...)` | 以下 |
| カスタムコマンド | `api.registerCommand(...)` | [Entry Points](/ja-JP/plugins/sdk-entrypoints) |
| イベントフック | `api.registerHook(...)` | [Entry Points](/ja-JP/plugins/sdk-entrypoints) |
| HTTP ルート | `api.registerHttpRoute(...)` | [Internals](/ja-JP/plugins/architecture#gateway-http-routes) |
| CLI サブコマンド | `api.registerCli(...)` | [Entry Points](/ja-JP/plugins/sdk-entrypoints) |

完全な登録 API については、[SDK Overview](/ja-JP/plugins/sdk-overview#registration-api) を参照してください。

plugin が、最終
ツール結果メッセージが発行される前の非同期 `tool_result` 書き換えのような、Pi ネイティブの embedded-runner フックを必要とする場合は、
`api.registerEmbeddedExtensionFactory(...)` を使用してください。処理に Pi 拡張タイミングが不要な場合は、
通常の OpenClaw plugin フックを優先してください。

plugin がカスタムの gateway RPC メソッドを登録する場合は、
plugin 固有のプレフィックスにしてください。コアの管理名前空間（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）は予約されたままであり、たとえ
plugin がより狭いスコープを要求しても、常に `operator.admin` に解決されます。

覚えておくべきフックガードのセマンティクス:

- `before_tool_call`: `{ block: true }` は終端であり、優先度の低いハンドラーを停止します。
- `before_tool_call`: `{ block: false }` は判断なしとして扱われます。
- `before_tool_call`: `{ requireApproval: true }` はエージェント実行を一時停止し、exec approval overlay、Telegram ボタン、Discord interaction、または任意のチャネル上の `/approve` コマンドを通じてユーザーに承認を求めます。
- `before_install`: `{ block: true }` は終端であり、優先度の低いハンドラーを停止します。
- `before_install`: `{ block: false }` は判断なしとして扱われます。
- `message_sending`: `{ cancel: true }` は終端であり、優先度の低いハンドラーを停止します。
- `message_sending`: `{ cancel: false }` は判断なしとして扱われます。
- `message_received`: 受信スレッド/トピックルーティングが必要な場合は、型付きの `threadId` フィールドを優先してください。`metadata` はチャネル固有の追加情報用に残してください。
- `message_sending`: チャネル固有の metadata キーよりも、型付きの `replyToId` / `threadId` ルーティングフィールドを優先してください。

`/approve` コマンドは、境界付きフォールバックで exec 承認と plugin 承認の両方を扱います。exec 承認 ID が見つからない場合、OpenClaw は同じ ID を plugin 承認でも再試行します。plugin 承認の転送は、設定の `approvals.plugin` で個別に構成できます。

カスタム承認の配線でその同じ境界付きフォールバックケースを検出する必要がある場合は、
承認期限切れ文字列を手動で照合する代わりに、`openclaw/plugin-sdk/error-runtime` の
`isApprovalNotFoundError` を優先してください。

詳細については、[SDK Overview hook decision semantics](/ja-JP/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## エージェントツールの登録

ツールは、LLM が呼び出せる型付き関数です。必須（常に
利用可能）または任意（ユーザーによるオプトイン）にできます。

```typescript
register(api) {
  // 必須ツール — 常に利用可能
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // 任意ツール — ユーザーが allowlist に追加する必要がある
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

ユーザーは設定で任意ツールを有効にします。

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ツール名はコアツールと競合してはいけません（競合はスキップされます）
- 副作用や追加バイナリ要件があるツールには `optional: true` を使用してください
- ユーザーは、`tools.allow` に plugin ID を追加することで、その plugin のすべてのツールを有効にできます

## import 規約

常に、対象を絞った `openclaw/plugin-sdk/<subpath>` パスから import してください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// 誤り: モノリシックなルート（非推奨、将来削除予定）
import { ... } from "openclaw/plugin-sdk";
```

完全な subpath リファレンスについては、[SDK Overview](/ja-JP/plugins/sdk-overview) を参照してください。

plugin 内では、内部 import にはローカルの barrel ファイル（`api.ts`、`runtime-api.ts`）を使用してください。
自分の plugin をその SDK パス経由で import してはいけません。

provider plugin では、その seam が本当に汎用的でない限り、
provider 固有のヘルパーはそれらの package-root
barrel に置いてください。現在のバンドル例:

- Anthropic: Claude ストリームラッパーと `service_tier` / beta ヘルパー
- OpenAI: provider ビルダー、default-model ヘルパー、リアルタイム provider
- OpenRouter: provider ビルダーに加えてオンボーディング/設定ヘルパー

あるヘルパーが1つのバンドル provider パッケージ内でしか有用でない場合は、
`openclaw/plugin-sdk/*` に昇格させるのではなく、その package-root seam に置いてください。

一部の生成済み `openclaw/plugin-sdk/<bundled-id>` ヘルパー seam は、
バンドル plugin のメンテナンスと互換性のために今も存在しています。たとえば
`plugin-sdk/feishu-setup` や `plugin-sdk/zalo-setup` です。これらは、新しいサードパーティ plugin の
デフォルトパターンではなく、予約された surface として扱ってください。

## 提出前チェックリスト

<Check>**package.json** に正しい `openclaw` メタデータがある</Check>
<Check>**openclaw.plugin.json** マニフェストが存在し、有効である</Check>
<Check>エントリーポイントが `defineChannelPluginEntry` または `definePluginEntry` を使っている</Check>
<Check>すべての import が対象を絞った `plugin-sdk/<subpath>` パスを使っている</Check>
<Check>内部 import が SDK の自己 import ではなくローカルモジュールを使っている</Check>
<Check>テストが通る（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` が通る（リポジトリ内 plugin）</Check>

## ベータリリーステスト

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) の GitHub リリースタグを監視し、`Watch` > `Releases` で購読してください。ベータタグは `v2026.3.N-beta.1` のような形式です。リリース告知については、公式 OpenClaw X アカウント [@openclaw](https://x.com/openclaw) の通知を有効にすることもできます。
2. ベータタグが表示されたら、できるだけ早くそのベータタグに対して plugin をテストしてください。安定版までの猶予は通常数時間しかありません。
3. テスト後、`plugin-forum` Discord チャネル内のあなたの plugin スレッドに、`all good` または壊れた内容を投稿してください。まだスレッドがない場合は作成してください。
4. 何か壊れている場合は、`Beta blocker: <plugin-name> - <summary>` というタイトルの issue を作成または更新し、`beta-blocker` ラベルを付けてください。その issue リンクをスレッドに貼ってください。
5. `main` に対して、`fix(<plugin-id>): beta blocker - <summary>` というタイトルの PR を作成し、その issue を PR と Discord スレッドの両方にリンクしてください。コントリビューターは PR にラベルを付けられないため、このタイトルがメンテナーと自動化に対する PR 側のシグナルになります。PR のある blocker はマージされます。PR のない blocker は、そのまま出荷される可能性があります。メンテナーはベータテスト中にこれらのスレッドを監視しています。
6. 反応がなければ問題なしです。期間を逃した場合、修正は次のサイクルで反映される可能性が高いです。

## 次のステップ

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングチャネル plugin を構築する
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデル provider plugin を構築する
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/ja-JP/plugins/sdk-overview">
    import マップと登録 API リファレンス
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    `api.runtime` を介した TTS、search、subagent
  </Card>
  <Card title="Testing" icon="test-tubes" href="/ja-JP/plugins/sdk-testing">
    テストユーティリティとパターン
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/ja-JP/plugins/manifest">
    完全なマニフェストスキーマリファレンス
  </Card>
</CardGroup>

## 関連

- [Plugin Architecture](/ja-JP/plugins/architecture) — 内部アーキテクチャの詳細解説
- [SDK Overview](/ja-JP/plugins/sdk-overview) — Plugin SDK リファレンス
- [Manifest](/ja-JP/plugins/manifest) — plugin マニフェスト形式
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — チャネル plugin の構築
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — provider plugin の構築
