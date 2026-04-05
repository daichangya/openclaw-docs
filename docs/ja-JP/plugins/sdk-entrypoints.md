---
read_when:
    - definePluginEntry または defineChannelPluginEntry の正確な型シグネチャが必要
    - 登録モード（full / setup / CLI metadata）を理解したい
    - エントリーポイントのオプションを調べている
sidebarTitle: Entry Points
summary: definePluginEntry、defineChannelPluginEntry、defineSetupPluginEntry のリファレンス
title: プラグインのエントリーポイント
x-i18n:
    generated_at: "2026-04-05T12:52:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 799dbfe71e681dd8ba929a7a631dfe745c3c5c69530126fea2f9c137b120f51f
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# プラグインのエントリーポイント

すべてのプラグインはデフォルトのエントリーオブジェクトを export します。SDK は、
それらを作成するための 3 つのヘルパーを提供します。

<Tip>
  **手順ガイドを探していますか？** [Channel Plugins](/plugins/sdk-channel-plugins)
  または [Provider Plugins](/plugins/sdk-provider-plugins) のステップごとのガイドを参照してください。
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

provider plugin、tool plugin、hook plugin、およびメッセージングチャンネル**ではない**
ものに使用します。

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

| Field          | Type                                                             | Required | Default             |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | Yes      | —                   |
| `name`         | `string`                                                         | Yes      | —                   |
| `description`  | `string`                                                         | Yes      | —                   |
| `kind`         | `string`                                                         | No       | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No       | Empty object schema |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Yes      | —                   |

- `id` は `openclaw.plugin.json` マニフェストと一致している必要があります。
- `kind` は排他的スロット用です: `"memory"` または `"context-engine"`。
- `configSchema` は遅延評価のために関数にできます。
- OpenClaw はそのスキーマを初回アクセス時に解決してメモ化するため、高コストなスキーマ
  ビルダーは 1 回しか実行されません。

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

チャンネル固有の配線で `definePluginEntry` をラップします。自動的に
`api.registerChannel({ plugin })` を呼び出し、任意のルートヘルプ CLI metadata シームを公開し、
登録モードに応じて `registerFull` を制御します。

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

| Field                 | Type                                                             | Required | Default             |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | Yes      | —                   |
| `name`                | `string`                                                         | Yes      | —                   |
| `description`         | `string`                                                         | Yes      | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Yes      | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No       | Empty object schema |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | No       | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | No       | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | No       | —                   |

- `setRuntime` は登録中に呼び出されるため、ランタイム参照を保存できます
  （通常は `createPluginRuntimeStore` を使います）。CLI metadata の
  取得中はスキップされます。
- `registerCliMetadata` は `api.registrationMode === "cli-metadata"`
  と `api.registrationMode === "full"` の両方で実行されます。
  ルートヘルプを非アクティブのまま保ちつつ、通常の CLI コマンド登録を full plugin load と互換に保つため、
  チャンネル所有の CLI descriptor の正規の置き場所としてこれを使ってください。
- `registerFull` は `api.registrationMode === "full"` のときだけ実行されます。setup-only の読み込み中はスキップされます。
- `definePluginEntry` と同様に、`configSchema` は遅延ファクトリーにでき、
  OpenClaw は解決済みスキーマを初回アクセス時にメモ化します。
- プラグイン所有のルート CLI コマンドでは、コマンドを
  ルート CLI parse tree から消さずに lazy-load のままにしたい場合、
  `api.registerCli(..., { descriptors: [...] })` を優先してください。channel plugin では、
  それらの descriptor は `registerCliMetadata(...)` から登録し、`registerFull(...)` はランタイム専用の処理に集中させてください。
- `registerFull(...)` が gateway RPC method も登録する場合は、それらを
  plugin 固有の prefix に保ってください。予約済みの core admin namespace（`config.*`、
  `exec.approvals.*`、`wizard.*`、`update.*`）は常に
  `operator.admin` に強制されます。

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

軽量な `setup-entry.ts` ファイル用です。ランタイムや CLI の配線を持たず、
単に `{ plugin }` を返します。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw は、チャンネルが無効、未設定、または遅延読み込みが有効な場合、
full entry の代わりにこれを読み込みます。これが重要になる場面については
[Setup and Config](/plugins/sdk-setup#setup-entry) を参照してください。

実際には、`defineSetupPluginEntry(...)` は次の狭い setup helper
ファミリーと組み合わせて使ってください。

- `openclaw/plugin-sdk/setup-runtime` は、import-safe な setup patch adapter、
  lookup-note 出力、
  `promptResolvedAllowFrom`、`splitSetupEntries`、委譲 setup proxy などの
  ランタイムセーフな setup helper 用
- `openclaw/plugin-sdk/channel-setup` は任意インストールの setup surface 用
- `openclaw/plugin-sdk/setup-tools` は setup / install CLI / archive / docs helper 用

重い SDK、CLI 登録、長寿命ランタイム service は full
entry に置いてください。

## 登録モード

`api.registrationMode` は、プラグインがどのように読み込まれたかを示します。

| Mode              | When                              | 何を登録するか |
| ----------------- | --------------------------------- | ------------- |
| `"full"`          | 通常の gateway 起動時             | すべて |
| `"setup-only"`    | 無効または未設定のチャンネル      | チャンネル登録のみ |
| `"setup-runtime"` | ランタイム利用可能な setup フロー | チャンネル登録に加え、full entry が読み込まれる前に必要な軽量ランタイムのみ |
| `"cli-metadata"`  | ルートヘルプ / CLI metadata 取得  | CLI descriptor のみ |

`defineChannelPluginEntry` は、この分岐を自動的に処理します。チャンネルに
`definePluginEntry` を直接使う場合は、自分でモードを確認してください。

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // 重いランタイム専用の登録
  api.registerService(/* ... */);
}
```

`"setup-runtime"` は、setup-only の起動サーフェスが
full の bundled channel runtime に再突入せずに存在しなければならない期間として扱ってください。
適しているのは、チャンネル登録、setup-safe な HTTP route、setup-safe な gateway method、
および委譲 setup helper です。重い background service、CLI registrar、
provider / client SDK の bootstrap は、引き続き `"full"` に属します。

特に CLI registrar について:

- registrar が 1 つ以上のルートコマンドを所有し、
  最初の呼び出し時に OpenClaw に実際の CLI module を lazy-load させたい場合は `descriptors` を使ってください
- それらの descriptor が、その registrar によって公開されるすべてのトップレベルコマンド root をカバーしていることを確認してください
- `commands` 単独は eager な互換パスにのみ使ってください

## プラグイン形状

OpenClaw は、読み込まれたプラグインをその登録動作によって分類します。

| Shape                 | 説明 |
| --------------------- | ---- |
| **plain-capability**  | 1 種類の capability のみ（例: provider のみ） |
| **hybrid-capability** | 複数種類の capability（例: provider + speech） |
| **hook-only**         | hook のみで、capability はなし |
| **non-capability**    | tools / commands / services はあるが capability はなし |

プラグインの形状を確認するには `openclaw plugins inspect <id>` を使ってください。

## 関連

- [SDK Overview](/plugins/sdk-overview) — 登録 API と subpath リファレンス
- [Runtime Helpers](/plugins/sdk-runtime) — `api.runtime` と `createPluginRuntimeStore`
- [Setup and Config](/plugins/sdk-setup) — マニフェスト、setup entry、遅延読み込み
- [Channel Plugins](/plugins/sdk-channel-plugins) — `ChannelPlugin` オブジェクトの構築
- [Provider Plugins](/plugins/sdk-provider-plugins) — provider 登録と hook
