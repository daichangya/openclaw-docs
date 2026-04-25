---
read_when:
    - '`definePluginEntry` または `defineChannelPluginEntry` の正確な型シグネチャが必要です'
    - 登録モード（full、setup、CLI メタデータ）を理解したいです
    - エントリポイントのオプションを調べています
sidebarTitle: Entry Points
summary: '`definePluginEntry`、`defineChannelPluginEntry`、および `defineSetupPluginEntry` のリファレンス'
title: Plugin エントリポイント
x-i18n:
    generated_at: "2026-04-25T13:54:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8253cf0ac43ca11b42c0032027bba6e926c961b54901caaa63da70bd5ff5aab5
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

すべての Plugin はデフォルトのエントリオブジェクトをエクスポートします。SDK は、それらを作成するための 3 つのヘルパーを提供します。

インストール済み Plugin では、`package.json` は、利用可能な場合にビルド済み JavaScript を実行時ロード先として指定する必要があります。

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` と `setupEntry` は、ワークスペースおよび git チェックアウト開発用の有効なソースエントリのままです。`runtimeExtensions` と `runtimeSetupEntry` は、OpenClaw がインストール済みパッケージを読み込む際に優先され、npm パッケージが実行時 TypeScript コンパイルを回避できるようにします。インストール済みパッケージが TypeScript ソースエントリのみを宣言している場合、OpenClaw は対応するビルド済み `dist/*.js` ピアが存在すればそれを使用し、その後 TypeScript ソースにフォールバックします。

すべてのエントリパスは、Plugin パッケージディレクトリ内にとどまる必要があります。ランタイムエントリや推論されたビルド済み JavaScript ピアがあっても、パッケージ外に出る `extensions` や `setupEntry` のソースパスが有効になるわけではありません。

<Tip>
  **手順付きガイドを探していますか？** ステップごとのガイドについては、[Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) または [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) を参照してください。
</Tip>

## `definePluginEntry`

**インポート:** `openclaw/plugin-sdk/plugin-entry`

プロバイダー Plugin、ツール Plugin、フック Plugin、およびメッセージングチャネルでは**ない**あらゆるものに使用します。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| フィールド | 型 | 必須 | デフォルト |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | はい      | —                   |
| `name`         | `string`                                                         | はい      | —                   |
| `description`  | `string`                                                         | はい      | —                   |
| `kind`         | `string`                                                         | いいえ       | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ       | 空のオブジェクトスキーマ |
| `register`     | `(api: OpenClawPluginApi) => void`                               | はい      | —                   |

- `id` は `openclaw.plugin.json` マニフェストと一致している必要があります。
- `kind` は排他的スロット用です: `"memory"` または `"context-engine"`。
- `configSchema` は遅延評価のために関数にできます。
- OpenClaw はそのスキーマを初回アクセス時に解決してメモ化するため、高コストなスキーマビルダーは 1 回しか実行されません。

## `defineChannelPluginEntry`

**インポート:** `openclaw/plugin-sdk/channel-core`

チャネル固有の配線を伴って `definePluginEntry` をラップします。`api.registerChannel({ plugin })` を自動的に呼び出し、オプションのルートヘルプ CLI メタデータ用の継ぎ目を公開し、登録モードに応じて `registerFull` を制御します。

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| フィールド | 型 | 必須 | デフォルト |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | はい      | —                   |
| `name`                | `string`                                                         | はい      | —                   |
| `description`         | `string`                                                         | はい      | —                   |
| `plugin`              | `ChannelPlugin`                                                  | はい      | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ       | 空のオブジェクトスキーマ |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | いいえ       | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | いいえ       | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | いいえ       | —                   |

- `setRuntime` は登録時に呼び出されるため、ランタイム参照を保存できます（通常は `createPluginRuntimeStore` を使用します）。CLI メタデータ取得中はスキップされます。
- `registerCliMetadata` は `api.registrationMode === "cli-metadata"`、`api.registrationMode === "discovery"`、および `api.registrationMode === "full"` のときに実行されます。
  これを、チャネル所有の CLI 記述子の正規の場所として使用してください。これにより、ルートヘルプはアクティベーションなしのままとなり、discovery スナップショットには静的コマンドメタデータが含まれ、通常の CLI コマンド登録は完全な Plugin ロードとの互換性を保ちます。
- discovery 登録は非アクティベーティングですが、インポートなしではありません。OpenClaw はスナップショットを構築するために信頼済み Plugin エントリとチャネル Plugin モジュールを評価する場合があるため、トップレベルインポートは副作用なしに保ち、ソケット、クライアント、ワーカー、サービスは `"full"` 専用のパスの背後に置いてください。
- `registerFull` は `api.registrationMode === "full"` の場合にのみ実行されます。setup-only ロード中はスキップされます。
- `definePluginEntry` と同様に、`configSchema` は遅延ファクトリーにでき、OpenClaw は初回アクセス時に解決済みスキーマをメモ化します。
- Plugin 所有のルート CLI コマンドについては、コマンドをルート CLI パースツリーから消さずに遅延ロードのままにしたい場合、`api.registerCli(..., { descriptors: [...] })` を優先してください。チャネル Plugin では、それらの記述子を `registerCliMetadata(...)` から登録し、`registerFull(...)` はランタイム専用の作業に集中させることを推奨します。
- `registerFull(...)` が Gateway RPC メソッドも登録する場合は、それらを Plugin 固有のプレフィックスに保ってください。予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は常に `operator.admin` に強制されます。

## `defineSetupPluginEntry`

**インポート:** `openclaw/plugin-sdk/channel-core`

軽量な `setup-entry.ts` ファイル用です。ランタイムや CLI の配線なしで、単に `{ plugin }` を返します。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw は、チャネルが無効化されている場合、未設定の場合、または遅延ロードが有効な場合に、完全なエントリの代わりにこれを読み込みます。これが重要になるタイミングについては、[Setup and Config](/ja-JP/plugins/sdk-setup#setup-entry) を参照してください。

実際には、`defineSetupPluginEntry(...)` は次の狭い setup ヘルパーファミリーと組み合わせて使用してください。

- インポートセーフな setup パッチアダプター、lookup-note 出力、`promptResolvedAllowFrom`、`splitSetupEntries`、委譲された setup プロキシなど、ランタイムセーフな setup ヘルパーには `openclaw/plugin-sdk/setup-runtime`
- オプションインストールの setup サーフェスには `openclaw/plugin-sdk/channel-setup`
- setup/install CLI/archive/docs ヘルパーには `openclaw/plugin-sdk/setup-tools`

重い SDK、CLI 登録、長寿命のランタイムサービスは完全なエントリに置いてください。

setup とランタイムのサーフェスを分離するバンドル済みワークスペースチャネルでは、代わりに `openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。このコントラクトにより、setup エントリは setup セーフな plugin/secrets エクスポートを維持しつつ、ランタイム setter も公開できます。

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
});
```

このバンドル済みコントラクトは、完全なチャネルエントリがロードされる前に setup フローで本当に軽量なランタイム setter が必要な場合にのみ使用してください。

## 登録モード

`api.registrationMode` は、Plugin がどのようにロードされたかを示します。

| モード | タイミング | 登録するもの |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | 通常の Gateway 起動            | すべて                                                                                                              |
| `"discovery"`     | 読み取り専用の機能 discovery    | チャネル登録と静的 CLI 記述子。エントリコードはロードされる場合がありますが、ソケット、ワーカー、クライアント、サービスはスキップします |
| `"setup-only"`    | 無効化または未設定のチャネル     | チャネル登録のみ                                                                                               |
| `"setup-runtime"` | ランタイムが利用可能な setup フロー | 完全なエントリがロードされる前に必要な軽量ランタイムのみを含むチャネル登録                               |
| `"cli-metadata"`  | ルートヘルプ / CLI メタデータ取得  | CLI 記述子のみ                                                                                                    |

`defineChannelPluginEntry` はこの分岐を自動的に処理します。チャネルに対して `definePluginEntry` を直接使う場合は、自分でモードを確認してください。

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

discovery モードは非アクティベーティングなレジストリスナップショットを構築します。それでも、OpenClaw がチャネル機能と静的 CLI 記述子を登録できるようにするため、Plugin エントリとチャネル Plugin オブジェクトを評価する場合があります。discovery におけるモジュール評価は、信頼されているが軽量なものとして扱ってください。トップレベルでネットワーククライアント、サブプロセス、リスナー、データベース接続、バックグラウンドワーカー、認証情報の読み取り、その他のライブランタイム副作用を行わないでください。

`"setup-runtime"` は、完全なバンドル済みチャネルランタイムに再突入せずに setup 専用の起動サーフェスが存在しなければならない期間として扱ってください。適しているのは、チャネル登録、setup セーフな HTTP ルート、setup セーフな Gateway メソッド、委譲された setup ヘルパーです。重いバックグラウンドサービス、CLI レジストラー、プロバイダー/クライアント SDK のブートストラップは引き続き `"full"` に属します。

特に CLI レジストラーについては:

- レジストラーが 1 つ以上のルートコマンドを所有し、初回呼び出し時に OpenClaw が実際の CLI モジュールを遅延ロードできるようにしたい場合は、`descriptors` を使用します
- それらの記述子が、レジストラーによって公開されるすべてのトップレベルコマンドルートをカバーしていることを確認してください
- 記述子のコマンド名は、文字、数字、ハイフン、アンダースコアのみを使い、文字または数字で始めてください。OpenClaw はこの形式に合わない記述子名を拒否し、ヘルプ表示前に説明から端末制御シーケンスを取り除きます
- 即時互換パスにのみ `commands` 単独を使用してください

## Plugin の形状

OpenClaw は、ロードされた Plugin をその登録動作によって分類します。

| 形状 | 説明 |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 1 種類の機能タイプのみ（例: provider のみ）           |
| **hybrid-capability** | 複数の機能タイプ（例: provider + speech） |
| **hook-only**         | フックのみで、機能はなし                        |
| **non-capability**    | ツール/コマンド/サービスはあるが機能はなし        |

Plugin の形状を確認するには `openclaw plugins inspect <id>` を使用してください。

## 関連

- [SDK Overview](/ja-JP/plugins/sdk-overview) — 登録 API とサブパスのリファレンス
- [Runtime Helpers](/ja-JP/plugins/sdk-runtime) — `api.runtime` と `createPluginRuntimeStore`
- [Setup and Config](/ja-JP/plugins/sdk-setup) — マニフェスト、setup エントリ、遅延ロード
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — `ChannelPlugin` オブジェクトの構築
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — provider の登録とフック
