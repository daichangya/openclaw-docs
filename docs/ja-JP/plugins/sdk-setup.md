---
read_when:
    - プラグインにセットアップウィザードを追加している
    - setup-entry.ts と index.ts の違いを理解したい
    - プラグインの config schema や package.json の openclaw metadata を定義している
sidebarTitle: Setup and Config
summary: セットアップウィザード、setup-entry.ts、config schema、package.json metadata
title: プラグインのセットアップと設定
x-i18n:
    generated_at: "2026-04-05T12:53:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68fda27be1c89ea6ba906833113e9190ddd0ab358eb024262fb806746d54f7bf
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# プラグインのセットアップと設定

プラグインのパッケージング（`package.json` metadata）、マニフェスト
（`openclaw.plugin.json`）、setup entry、および config schema のリファレンスです。

<Tip>
  **手順ガイドを探していますか？** how-to ガイドでは、パッケージングを文脈の中で扱っています:
  [Channel Plugins](/plugins/sdk-channel-plugins#step-1-package-and-manifest) と
  [Provider Plugins](/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## パッケージ metadata

`package.json` には、プラグインシステムに
そのプラグインが何を提供するかを伝える `openclaw` フィールドが必要です。

**Channel plugin:**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**Provider plugin / ClawHub 公開のベースライン:**

```json openclaw-clawhub-package.json
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

ClawHub でプラグインを外部公開する場合、これらの `compat` と `build`
フィールドは必須です。正規の公開スニペットは
`docs/snippets/plugin-publish/` にあります。

### `openclaw` フィールド

| Field        | Type       | 説明 |
| ------------ | ---------- | ---- |
| `extensions` | `string[]` | エントリーポイントファイル（package root からの相対） |
| `setupEntry` | `string`   | 軽量な setup 専用 entry（任意） |
| `channel`    | `object`   | setup、picker、クイックスタート、status サーフェス用の channel catalog metadata |
| `providers`  | `string[]` | このプラグインが登録する provider id |
| `install`    | `object`   | インストールヒント: `npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`allowInvalidConfigRecovery` |
| `startup`    | `object`   | 起動動作フラグ |

### `openclaw.channel`

`openclaw.channel` は、ランタイムが読み込まれる前の channel discovery と setup
surface 用の軽量な package metadata です。

| Field                                  | Type       | 意味 |
| -------------------------------------- | ---------- | ---- |
| `id`                                   | `string`   | 正規の channel id。 |
| `label`                                | `string`   | 主要な channel label。 |
| `selectionLabel`                       | `string`   | `label` と異なるべき場合の picker / setup label。 |
| `detailLabel`                          | `string`   | より豊かな channel catalog と status surface 用の二次ラベル。 |
| `docsPath`                             | `string`   | setup および selection リンク用の docs path。 |
| `docsLabel`                            | `string`   | docs リンクで channel id と異なるラベルを使いたい場合の上書きラベル。 |
| `blurb`                                | `string`   | 短い onboarding / catalog 説明。 |
| `order`                                | `number`   | channel catalog 内の並び順。 |
| `aliases`                              | `string[]` | channel selection 用の追加 lookup alias。 |
| `preferOver`                           | `string[]` | この channel が優先すべき、より低優先度の plugin / channel id。 |
| `systemImage`                          | `string`   | channel UI catalog 用の任意の icon / system-image 名。 |
| `selectionDocsPrefix`                  | `string`   | selection surface における docs リンク前のプレフィックス文言。 |
| `selectionDocsOmitLabel`               | `boolean`  | selection copy でラベル付き docs リンクではなく docs path を直接表示する。 |
| `selectionExtras`                      | `string[]` | selection copy に追加される短い文字列。 |
| `markdownCapable`                      | `boolean`  | outbound formatting 判定のため、この channel が markdown 対応であることを示す。 |
| `showConfigured`                       | `boolean`  | configured-channel listing surface でこの channel を表示するかどうかを制御する。 |
| `quickstartAllowFrom`                  | `boolean`  | この channel を標準のクイックスタート `allowFrom` setup フローに参加させる。 |
| `forceAccountBinding`                  | `boolean`  | account が 1 つしかなくても明示的な account binding を必須にする。 |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | この channel の announce target 解決で session lookup を優先する。 |

例:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "quickstartAllowFrom": true
    }
  }
}
```

### `openclaw.install`

`openclaw.install` は manifest metadata ではなく package metadata です。

| Field                        | Type                 | 意味 |
| ---------------------------- | -------------------- | ---- |
| `npmSpec`                    | `string`             | install / update フロー用の正規 npm spec。 |
| `localPath`                  | `string`             | ローカル開発または bundled install パス。 |
| `defaultChoice`              | `"npm"` \| `"local"` | 両方利用可能な場合の優先 install ソース。 |
| `minHostVersion`             | `string`             | `>=x.y.z` 形式の、サポートされる最小 OpenClaw バージョン。 |
| `allowInvalidConfigRecovery` | `boolean`            | 特定の stale-config failure から bundled-plugin reinstall フローによる回復を許可する。 |

`minHostVersion` が設定されている場合、install と manifest-registry 読み込みの両方で
それが強制されます。古い host はその plugin を skip し、無効な version 文字列は拒否されます。

`allowInvalidConfigRecovery` は、壊れた config に対する一般的なバイパスではありません。
これは限定された bundled-plugin 回復専用で、reinstall / setup が、bundled plugin path の欠落や、
その同じ plugin に対する stale な `channels.<id>` エントリーのような既知の upgrade 残骸を修復できるようにするものです。無関係な理由で config が壊れている場合、
install は依然としてフェイルクローズし、オペレーターに `openclaw doctor --fix` を実行するよう伝えます。

### 遅延 full load

Channel plugin は、次の設定で遅延読み込みに参加できます。

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

これを有効にすると、OpenClaw は pre-listen 起動
フェーズ中、すでに設定済みのチャンネルに対しても `setupEntry` だけを読み込みます。full entry は
gateway が listen を開始した後に読み込まれます。

<Warning>
  遅延読み込みを有効にするのは、`setupEntry` が
  gateway が listen を開始する前に必要なもの（channel 登録、HTTP route、
  gateway method）をすべて登録している場合だけにしてください。full entry が必須の起動 capability を所有している場合は、
  デフォルト動作のままにしてください。
</Warning>

setup / full entry が gateway RPC method も登録する場合は、それらを
plugin 固有の prefix に保ってください。予約済みの core admin namespace（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）は core 所有のままであり、常に
`operator.admin` に解決されます。

## プラグインマニフェスト

すべての native plugin は、package root に `openclaw.plugin.json` を同梱する必要があります。
OpenClaw はこれを使って、プラグインコードを実行せずに config を検証します。

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

Channel plugin では、`kind` と `channels` を追加してください。

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

config を持たない plugin でも schema を同梱する必要があります。空の schema でも有効です。

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完全な schema リファレンスについては [Plugin Manifest](/plugins/manifest) を参照してください。

## ClawHub 公開

プラグイン package では、package 専用の ClawHub コマンドを使ってください。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

レガシーな skill 専用の publish alias は skills 用です。plugin package では
常に `clawhub package publish` を使ってください。

## Setup entry

`setup-entry.ts` ファイルは、`index.ts` の軽量な代替であり、
OpenClaw が setup surface（onboarding、config repair、
無効な channel の検査）だけを必要とするときに読み込みます。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

これにより、setup フロー中に重いランタイムコード（crypto library、CLI 登録、
background service）を読み込まずに済みます。

**OpenClaw が full entry ではなく `setupEntry` を使う場面:**

- channel が無効だが setup / onboarding surface が必要
- channel が有効だが未設定
- 遅延読み込みが有効（`deferConfiguredChannelFullLoadUntilAfterListen`）

**`setupEntry` が登録しなければならないもの:**

- channel plugin オブジェクト（`defineSetupPluginEntry` 経由）
- gateway listen 前に必要な HTTP route
- 起動中に必要な gateway method

これらの起動用 gateway method でも、`config.*` や `update.*` のような予約済み core admin
namespace は避けるべきです。

**`setupEntry` に含めるべきでないもの:**

- CLI 登録
- background service
- 重いランタイム import（crypto、SDK）
- 起動後にのみ必要な gateway method

### 狭い setup helper import

hot setup-only パスでは、setup surface の一部しか必要ない場合は、より広い
`plugin-sdk/setup` アンブレラではなく、狭い setup helper seam を優先してください。

| Import path                        | 用途 | 主な export |
| ---------------------------------- | ---- | ----------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / 遅延チャンネル起動で利用可能なままの setup 時ランタイム helper | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 環境依存の account setup adapter | `createEnvPatchedAccountSetupAdapter` |
| `plugin-sdk/setup-tools`           | setup / install CLI / archive / docs helper | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |

より広い `plugin-sdk/setup` seam は、
`moveSingleAccountChannelSectionToDefaultAccount(...)` のような config-patch helper を含む、
共有 setup toolbox 全体が必要なときに使ってください。

setup patch adapter は import 上でも hot-path-safe のままです。それらの bundled
single-account promotion contract-surface lookup は lazy なので、`plugin-sdk/setup-runtime` を import しても、
adapter が実際に使われる前に bundled contract-surface
discovery を eager に読み込むことはありません。

### Channel 所有の single-account promotion

channel が単一 account のトップレベル config から
`channels.<id>.accounts.*` に upgrade するとき、デフォルトの共有動作では、promote された
account-scoped 値を `accounts.default` に移します。

Bundled channel は、その setup
contract surface を通じてこの promotion を狭めたり上書きしたりできます。

- `singleAccountKeysToMove`: promote された
  account に移すべき追加のトップレベルキー
- `namedAccountPromotionKeys`: named account がすでに存在する場合、promote された account に移るのはこれらの
  キーだけで、共有 policy / delivery キーは channel root に残る
- `resolveSingleAccountPromotionTarget(...)`: promote された値を受け取る既存 account を選ぶ

現在の bundled 例は Matrix です。named Matrix account がちょうど 1 つだけすでに存在する場合、
または `defaultAccount` が `Ops` のような既存の非 canonical key を指している場合、promotion は新しい
`accounts.default` エントリーを作るのではなく、その account を保持します。

## Config schema

プラグイン config は、マニフェスト内の JSON Schema に対して検証されます。ユーザーはプラグインを次のように設定します。

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

プラグインは登録中にこの config を `api.pluginConfig` として受け取ります。

channel 固有の config では、代わりに channel config セクションを使ってください。

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Channel config schema の構築

`openclaw/plugin-sdk/core` の `buildChannelConfigSchema` を使うと、
Zod schema を、OpenClaw が検証する `ChannelConfigSchema` ラッパーに変換できます。

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## セットアップウィザード

Channel plugin は、`openclaw onboard` 用の対話型セットアップウィザードを提供できます。
ウィザードは `ChannelPlugin` 上の `ChannelSetupWizard` オブジェクトです。

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

`ChannelSetupWizard` 型は `credentials`、`textInputs`、
`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` などをサポートします。
完全な例については、bundled plugin package（たとえば Discord plugin の `src/channel.setup.ts`）を参照してください。

標準的な
`note -> prompt -> parse -> merge -> patch` フローだけが必要な DM allowlist prompt では、
`openclaw/plugin-sdk/setup` の共有 setup
helper を優先してください: `createPromptParsedAllowFromForAccount(...)`、
`createTopLevelChannelParsedAllowFromPrompt(...)`、および
`createNestedChannelParsedAllowFromPrompt(...)`。

label、score、任意の追加行だけが異なる channel setup status block には、
各 plugin で同じ `status` オブジェクトを手書きするのではなく、
`openclaw/plugin-sdk/setup` の `createStandardChannelSetupStatus(...)` を優先してください。

特定の文脈でのみ表示されるべき任意の setup surface には、
`openclaw/plugin-sdk/channel-setup` の `createOptionalChannelSetupSurface` を使ってください。

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` は、任意インストール surface の片側だけが必要な場合の、より低レベルな
`createOptionalChannelSetupAdapter(...)` と
`createOptionalChannelSetupWizard(...)` ビルダーも公開しています。

生成される optional adapter / wizard は、実際の config 書き込みではフェイルクローズします。
`validateInput`、
`applyAccountConfig`、`finalize` 全体で 1 つの install-required メッセージを再利用し、`docsPath` が設定されている場合は docs リンクを追加します。

バイナリに支えられた setup UI では、同じ binary / status の接着コードを各 channel にコピーする代わりに、共有の delegated helper を優先してください。

- label、
  hint、score、binary detection だけが異なる status block 用の `createDetectedBinaryStatus(...)`
- path ベース text input 用の `createCliPathTextInput(...)`
- `setupEntry` が重い full wizard に lazy に転送する必要がある場合の
  `createDelegatedSetupWizardStatusResolvers(...)`、
  `createDelegatedPrepare(...)`、`createDelegatedFinalize(...)`、および
  `createDelegatedResolveConfigured(...)`
- `setupEntry` が `textInputs[*].shouldPrompt` の判断だけを委譲すればよい場合の `createDelegatedTextInputShouldPrompt(...)`

## 公開とインストール

**外部プラグイン:** [ClawHub](/tools/clawhub) または npm に公開し、その後インストールします。

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw はまず ClawHub を試し、自動的に npm にフォールバックします。ClawHub を明示的に強制することもできます。

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub のみ
```

対応する `npm:` 上書きはありません。ClawHub フォールバック後に npm パスを使いたい場合は、
通常の npm package spec を使ってください。

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**リポジトリ内プラグイン:** bundled plugin workspace tree 配下に置くと、ビルド時に自動的に
検出されます。

**ユーザーがインストールするには:**

```bash
openclaw plugins install <package-name>
```

<Info>
  npm ソースのインストールでは、`openclaw plugins install` は
  `npm install --ignore-scripts`（lifecycle script なし）を実行します。plugin の dependency
  tree は pure JS / TS に保ち、`postinstall` ビルドを必要とする package は避けてください。
</Info>

## 関連

- [SDK Entry Points](/plugins/sdk-entrypoints) -- `definePluginEntry` と `defineChannelPluginEntry`
- [Plugin Manifest](/plugins/manifest) -- 完全なマニフェスト schema リファレンス
- [Building Plugins](/plugins/building-plugins) -- ステップごとの はじめに ガイド
