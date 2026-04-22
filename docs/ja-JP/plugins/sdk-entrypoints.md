---
read_when:
    - '`definePluginEntry` または `defineChannelPluginEntry` の正確な型シグネチャが必要です'
    - 登録モード（full vs setup vs CLI metadata）を理解したい場合
    - エントリポイントのオプションを調べている場合
sidebarTitle: Entry Points
summary: '`definePluginEntry`、`defineChannelPluginEntry`、`defineSetupPluginEntry` のリファレンス'
title: Pluginエントリポイント
x-i18n:
    generated_at: "2026-04-22T04:25:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: b794e1a880e4a32318236fab515f5fd395a0c8c2d1a0e6a4ea388eef447975a7
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Pluginエントリポイント

すべてのPluginはデフォルトのエントリオブジェクトをエクスポートします。SDKは、それらを作成するための3つのヘルパーを提供します。

インストール済みPluginでは、`package.json` は、利用可能な場合にランタイム読み込みをビルド済みJavaScriptへ向ける必要があります。

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

`extensions` と `setupEntry` は、workspaceおよびgit checkout開発向けのソースエントリとして引き続き有効です。`runtimeExtensions` と `runtimeSetupEntry` は、OpenClawがインストール済みパッケージを読み込む際に優先され、npmパッケージで実行時TypeScriptコンパイルを避けられます。インストール済みパッケージがTypeScriptソースエントリしか宣言していない場合、OpenClawは、対応するビルド済み `dist/*.js` の相方が存在すればそれを使い、その後TypeScriptソースへフォールバックします。

すべてのエントリパスは、Pluginパッケージディレクトリ内にとどまる必要があります。ランタイムエントリや、推論されたビルド済みJavaScriptの相方があっても、パッケージ外へ逃げる `extensions` や `setupEntry` のソースパスが有効になることはありません。

<Tip>
  **手順付きの解説を探していますか？** [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins)
  または [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) のステップバイステップガイドを参照してください。
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

プロバイダーPlugin、ツールPlugin、フックPlugin、その他**メッセージングチャネルではない**もの向けです。

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
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ       | 空オブジェクトスキーマ |
| `register`     | `(api: OpenClawPluginApi) => void`                               | はい      | —                   |

- `id` は `openclaw.plugin.json` マニフェストと一致している必要があります。
- `kind` は排他的スロット用です: `"memory"` または `"context-engine"`。
- `configSchema` は遅延評価のための関数にできます。
- OpenClawは、そのスキーマを初回アクセス時に解決してメモ化するため、高コストなスキーマビルダーは1回しか実行されません。

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

チャネル固有の配線付きで `definePluginEntry` をラップします。自動的に
`api.registerChannel({ plugin })` を呼び出し、任意のルートヘルプCLIメタデータの継ぎ目を公開し、登録モードに応じて `registerFull` を制御します。

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
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | いいえ       | 空オブジェクトスキーマ |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | いいえ       | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | いいえ       | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | いいえ       | —                   |

- `setRuntime` は登録中に呼ばれるため、ランタイム参照を保存できます
  （通常は `createPluginRuntimeStore` を使用）。CLI metadata 取得時にはスキップされます。
- `registerCliMetadata` は、`api.registrationMode === "cli-metadata"`
  と `api.registrationMode === "full"` の両方で実行されます。
  これを、チャネル所有のCLI descriptor の正式な置き場所として使ってください。これにより、ルートヘルプは活性化せず、
  通常のCLIコマンド登録はフルPlugin読み込みとの互換性を維持できます。
- `registerFull` は、`api.registrationMode === "full"` のときだけ実行されます。setup-only 読み込み中はスキップされます。
- `definePluginEntry` と同様に、`configSchema` は遅延ファクトリーにでき、OpenClaw
  は解決済みスキーマを初回アクセス時にメモ化します。
- Plugin所有のルートCLIコマンドでは、コマンドを遅延読み込みのまま
  ルートCLIパースツリーから消えないようにしたい場合、`api.registerCli(..., { descriptors: [...] })`
  を推奨します。チャネルPluginでは、それらのdescriptorを `registerCliMetadata(...)`
  から登録し、`registerFull(...)` はランタイム専用処理に集中させてください。
- `registerFull(...)` が Gateway RPC メソッドも登録する場合は、それらを
  Plugin固有の接頭辞上に置いてください。予約済みコア管理名前空間（`config.*`、
  `exec.approvals.*`、`wizard.*`、`update.*`）は常に
  `operator.admin` に強制されます。

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

軽量な `setup-entry.ts` ファイル用です。ランタイムやCLI配線なしで、
単に `{ plugin }` だけを返します。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

チャネルが無効、未設定、または遅延読み込みが有効な場合、OpenClawはフルエントリの代わりにこれを読み込みます。これが重要になる場面については
[Setup and Config](/ja-JP/plugins/sdk-setup#setup-entry) を参照してください。

実運用では、`defineSetupPluginEntry(...)` を、狭いsetupヘルパーファミリーと組み合わせてください。

- `openclaw/plugin-sdk/setup-runtime`: import-safe な setup patch アダプター、
  lookup-note 出力、`promptResolvedAllowFrom`、`splitSetupEntries`、委譲setup proxy
  などの runtime-safe setup ヘルパー向け
- `openclaw/plugin-sdk/channel-setup`: 任意インストールのsetupサーフェス向け
- `openclaw/plugin-sdk/setup-tools`: setup/install CLI/archive/docs ヘルパー向け

重いSDK、CLI登録、長寿命ランタイムサービスはフルエントリに置いてください。

setupとランタイムのサーフェスを分けるバンドルworkspaceチャネルでは、
代わりに `openclaw/plugin-sdk/channel-entry-contract` の
`defineBundledChannelSetupEntry(...)` を使えます。この契約により、
setupエントリはsetup-safeな plugin/secrets エクスポートを維持しつつ、
ランタイムセッターも公開できます。

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

このバンドル契約は、フルチャネルエントリが読み込まれる前に、
setupフローが本当に軽量なランタイムセッターを必要とする場合にのみ使ってください。

## 登録モード

`api.registrationMode` は、Pluginがどのように読み込まれたかを示します。

| モード | タイミング | 登録するもの |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| `"full"`          | 通常のGateway起動 | すべて |
| `"setup-only"`    | 無効/未設定のチャネル | チャネル登録のみ |
| `"setup-runtime"` | ランタイム利用可能なsetupフロー | チャネル登録に加え、フルエントリ読み込み前に必要な軽量ランタイムのみ |
| `"cli-metadata"`  | ルートヘルプ / CLI metadata 取得 | CLI descriptor のみ |

`defineChannelPluginEntry` は、この分岐を自動処理します。チャネルに対して
`definePluginEntry` を直接使う場合は、自分でモードを確認してください。

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

`"setup-runtime"` は、フルのバンドルチャネルランタイムに再突入せずに、
setup専用の起動サーフェスが存在しなければならない期間として扱ってください。
適しているのは、チャネル登録、setup-safe なHTTPルート、setup-safe なGatewayメソッド、
委譲setupヘルパーです。重いバックグラウンドサービス、CLI登録器、
プロバイダー/クライアントSDKのブートストラップは、引き続き `"full"` に置くべきです。

特にCLI登録器について:

- 1つ以上のルートコマンドをその登録器が所有しており、
  OpenClawに実際のCLIモジュールを初回呼び出し時まで遅延読み込みさせたい場合は
  `descriptors` を使ってください
- それらのdescriptorが、登録器が公開するすべてのトップレベルコマンドルートを
  カバーしていることを確認してください
- `commands` 単独は、eager互換パスにのみ使ってください

## Plugin形状

OpenClawは、読み込まれたPluginを登録動作によって分類します。

| 形状 | 説明 |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 1種類の capability のみ（例: provider のみ） |
| **hybrid-capability** | 複数の capability 種類（例: provider + speech） |
| **hook-only**         | フックのみで capability なし |
| **non-capability**    | ツール/コマンド/サービスはあるが capability なし |

Pluginの形状を見るには `openclaw plugins inspect <id>` を使ってください。

## 関連

- [SDK Overview](/ja-JP/plugins/sdk-overview) — 登録APIとsubpathリファレンス
- [Runtime Helpers](/ja-JP/plugins/sdk-runtime) — `api.runtime` と `createPluginRuntimeStore`
- [Setup and Config](/ja-JP/plugins/sdk-setup) — マニフェスト、setup entry、遅延読み込み
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — `ChannelPlugin` オブジェクトの構築
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — プロバイダー登録とフック
