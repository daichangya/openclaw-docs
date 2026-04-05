---
read_when:
    - 新しい OpenClaw plugin を作成したい場合
    - plugin 開発のクイックスタートが必要な場合
    - 新しい channel、provider、tool、またはその他の機能を OpenClaw に追加する場合
sidebarTitle: Getting Started
summary: 数分で最初の OpenClaw plugin を作成する
title: Building Plugins
x-i18n:
    generated_at: "2026-04-05T12:51:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26e780d3f04270b79d1d8f8076d6c3c5031915043e78fb8174be921c6bdd60c9
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Building Plugins

Plugins は、OpenClaw に新しい機能を追加します: channels、model providers、
speech、realtime transcription、realtime voice、media understanding、image
generation、video generation、web fetch、web search、agent tools、または
それらの任意の組み合わせです。

plugin を OpenClaw repository に追加する必要はありません。
[ClawHub](/tools/clawhub) または npm に公開し、ユーザーは
`openclaw plugins install <package-name>` でインストールします。OpenClaw は最初に ClawHub を試し、
自動的に npm にフォールバックします。

## 前提条件

- Node >= 22 とパッケージマネージャー（npm または pnpm）
- TypeScript（ESM）への習熟
- repo 内 plugin の場合: repository を clone 済みで、`pnpm install` を実行済みであること

## どの種類の plugin か?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/plugins/sdk-channel-plugins">
    OpenClaw をメッセージングプラットフォーム（Discord、IRC など）に接続する
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/plugins/sdk-provider-plugins">
    model provider（LLM、proxy、またはカスタム endpoint）を追加する
  </Card>
  <Card title="Tool / hook plugin" icon="wrench">
    agent tools、event hooks、または services を登録する — 以下に進んでください
  </Card>
</CardGroup>

channel plugin が optional で、onboarding / setup の実行時に
インストールされていない可能性がある場合は、
`openclaw/plugin-sdk/channel-setup` の
`createOptionalChannelSetupSurface(...)` を使用してください。これは、
インストール要件を提示し、plugin がインストールされるまで実際の config 書き込みでは
安全側に倒して失敗する setup adapter + wizard の組を生成します。

## クイックスタート: tool plugin

このチュートリアルでは、agent tool を登録する最小の plugin を作成します。channel
plugin と provider plugin には、上にリンクされた専用ガイドがあります。

<Steps>
  <Step title="package と manifest を作成する">
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
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    config がなくても、すべての plugin には manifest が必要です。完全な schema については
    [Manifest](/plugins/manifest) を参照してください。正式な ClawHub
    公開用スニペットは `docs/snippets/plugin-publish/` にあります。

  </Step>

  <Step title="entry point を書く">

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

    `definePluginEntry` は非 channel plugin 用です。channels には
    `defineChannelPluginEntry` を使用してください — [Channel Plugins](/plugins/sdk-channel-plugins) を参照してください。
    entry point の完全なオプションについては、[Entry Points](/plugins/sdk-entrypoints) を参照してください。

  </Step>

  <Step title="テストして公開する">

    **外部 plugin:** ClawHub で検証して公開し、その後インストールします:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw は、`@myorg/openclaw-my-plugin` のような bare package spec についても、
    npm より前に ClawHub を確認します。

    **repo 内 plugin:** bundled plugin workspace tree 配下に配置します — 自動的に検出されます。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## plugin の機能

1 つの plugin は、`api` オブジェクト経由で任意の数の機能を登録できます:

| Capability             | Registration method                              | Detailed guide                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Text inference (LLM)   | `api.registerProvider(...)`                      | [Provider Plugins](/plugins/sdk-provider-plugins)                               |
| CLI inference backend  | `api.registerCliBackend(...)`                    | [CLI Backends](/gateway/cli-backends)                                           |
| Channel / messaging    | `api.registerChannel(...)`                       | [Channel Plugins](/plugins/sdk-channel-plugins)                                 |
| Speech (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime transcription | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime voice         | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Media understanding    | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Image generation       | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Video generation       | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Agent tools            | `api.registerTool(...)`                          | Below                                                                           |
| Custom commands        | `api.registerCommand(...)`                       | [Entry Points](/plugins/sdk-entrypoints)                                        |
| Event hooks            | `api.registerHook(...)`                          | [Entry Points](/plugins/sdk-entrypoints)                                        |
| HTTP routes            | `api.registerHttpRoute(...)`                     | [Internals](/plugins/architecture#gateway-http-routes)                          |
| CLI subcommands        | `api.registerCli(...)`                           | [Entry Points](/plugins/sdk-entrypoints)                                        |

完全な登録 API については、[SDK Overview](/plugins/sdk-overview#registration-api) を参照してください。

plugin がカスタム Gateway RPC メソッドを登録する場合は、
plugin 固有の prefix に保ってください。core admin namespace（`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`）は予約済みであり、たとえ plugin が
より狭い scope を要求しても、常に `operator.admin` に解決されます。

覚えておくべき hook ガードのセマンティクス:

- `before_tool_call`: `{ block: true }` は終端であり、より低優先度の handler を停止します。
- `before_tool_call`: `{ block: false }` は判断なしとして扱われます。
- `before_tool_call`: `{ requireApproval: true }` は agent 実行を一時停止し、exec 承認オーバーレイ、Telegram ボタン、Discord interaction、または任意の channel 上の `/approve` コマンドを通じてユーザーに承認を求めます。
- `before_install`: `{ block: true }` は終端であり、より低優先度の handler を停止します。
- `before_install`: `{ block: false }` は判断なしとして扱われます。
- `message_sending`: `{ cancel: true }` は終端であり、より低優先度の handler を停止します。
- `message_sending`: `{ cancel: false }` は判断なしとして扱われます。

`/approve` コマンドは、制限付きフォールバックによって exec 承認と plugin 承認の両方を扱います:
exec 承認 id が見つからない場合、OpenClaw は同じ id を plugin 承認経由で再試行します。plugin 承認転送は、
config 内の `approvals.plugin` を通じて個別に設定できます。

カスタム承認の配線で同じ制限付きフォールバックケースを検出する必要がある場合は、
承認期限切れ文字列を手動で照合する代わりに、
`openclaw/plugin-sdk/error-runtime` の `isApprovalNotFoundError` を使ってください。

詳細は [SDK Overview hook decision semantics](/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## agent tools を登録する

tools は、LLM が呼び出せる型付き関数です。required（常に利用可能）または
optional（ユーザーのオプトイン）にできます:

```typescript
register(api) {
  // Required tool — 常に利用可能
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — ユーザーが allowlist に追加する必要がある
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

ユーザーは config で optional tools を有効にします:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- tool 名は core tools と衝突してはいけません（衝突したものはスキップされます）
- 副作用がある tools や追加バイナリ要件がある tools には `optional: true` を使用してください
- ユーザーは `tools.allow` に plugin id を追加することで、その plugin のすべての tools を有効にできます

## import 規約

常に、焦点を絞った `openclaw/plugin-sdk/<subpath>` パスから import してください:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// 間違い: 単一のルート（非推奨、将来削除予定）
import { ... } from "openclaw/plugin-sdk";
```

完全な subpath リファレンスについては、[SDK Overview](/plugins/sdk-overview) を参照してください。

plugin 内部では、内部 import にローカルの barrel file（`api.ts`, `runtime-api.ts`）を使用してください。
自分自身の plugin をその SDK path 経由で import してはいけません。

provider plugins では、その seam が本当に汎用的でない限り、
provider 固有の helper はそれらの package-root
barrel に置いてください。現在の bundled 例:

- Anthropic: Claude stream wrapper と `service_tier` / beta helper
- OpenAI: provider builder、default-model helper、realtime providers
- OpenRouter: provider builder と onboarding / config helper

ある helper が 1 つの bundled provider package 内でしか役に立たない場合は、
それを `openclaw/plugin-sdk/*` に昇格させるのではなく、その
package-root seam に置いてください。

生成済みの `openclaw/plugin-sdk/<bundled-id>` helper seam の一部は、
bundled-plugin の保守と互換性のために依然として存在しています。たとえば
`plugin-sdk/feishu-setup` や `plugin-sdk/zalo-setup` です。これらは
新しいサードパーティ plugin のデフォルトパターンではなく、予約済みサーフェスとして扱ってください。

## 送信前チェックリスト

<Check>**package.json** に正しい `openclaw` メタデータがある</Check>
<Check>**openclaw.plugin.json** manifest が存在し、有効である</Check>
<Check>entry point が `defineChannelPluginEntry` または `definePluginEntry` を使っている</Check>
<Check>すべての import が焦点を絞った `plugin-sdk/<subpath>` パスを使っている</Check>
<Check>内部 import が SDK の自己 import ではなくローカルモジュールを使っている</Check>
<Check>テストが通る（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` が通る（repo 内 plugin）</Check>

## ベータリリーステスト

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) の GitHub release tag を監視し、`Watch` > `Releases` で購読してください。beta tag は `v2026.3.N-beta.1` のような形式です。リリース告知のために、公式 OpenClaw X アカウント [@openclaw](https://x.com/openclaw) の通知を有効にすることもできます。
2. beta tag が出たら、できるだけ早くその tag に対して plugin をテストしてください。stable までの猶予は通常数時間しかありません。
3. テスト後、Discord の `plugin-forum` channel にある自分の plugin スレッドに、`all good` または何が壊れたかを投稿してください。まだスレッドがない場合は作成してください。
4. 何か壊れている場合は、`Beta blocker: <plugin-name> - <summary>` というタイトルで issue を作成または更新し、`beta-blocker` ラベルを付けてください。その issue リンクをスレッドに貼ってください。
5. `main` 向けに、`fix(<plugin-id>): beta blocker - <summary>` というタイトルで PR を開き、issue を PR と Discord スレッドの両方にリンクしてください。contributor は PR にラベルを付けられないため、タイトルが maintainers と automation に対する PR 側のシグナルになります。PR がある blocker はマージされますが、ない blocker はそのまま出荷されることがあります。maintainers は beta テスト中にこれらのスレッドを監視しています。
6. 反応がなければ問題なしという意味です。期間を逃した場合、その修正はおそらく次のサイクルに入ります。

## 次のステップ

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/plugins/sdk-channel-plugins">
    メッセージング channel plugin を作成する
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/plugins/sdk-provider-plugins">
    model provider plugin を作成する
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/plugins/sdk-overview">
    import map と登録 API リファレンス
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/plugins/sdk-runtime">
    `api.runtime` 経由の TTS、search、subagent
  </Card>
  <Card title="Testing" icon="test-tubes" href="/plugins/sdk-testing">
    テストユーティリティとパターン
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/plugins/manifest">
    完全な manifest schema リファレンス
  </Card>
</CardGroup>

## 関連

- [Plugin Architecture](/plugins/architecture) — 内部アーキテクチャーの詳細
- [SDK Overview](/plugins/sdk-overview) — Plugin SDK リファレンス
- [Manifest](/plugins/manifest) — plugin manifest 形式
- [Channel Plugins](/plugins/sdk-channel-plugins) — channel plugins の作成
- [Provider Plugins](/plugins/sdk-provider-plugins) — provider plugins の作成
