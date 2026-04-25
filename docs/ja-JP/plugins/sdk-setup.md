---
read_when:
    - Pluginにセットアップウィザードを追加する場合
    - setup-entry.tsとindex.tsの違いを理解する必要がある場合
    - Plugin設定スキーマまたはpackage.jsonのopenclawメタデータを定義する場合
sidebarTitle: Setup and Config
summary: セットアップウィザード、setup-entry.ts、設定スキーマ、package.jsonメタデータ
title: Pluginのセットアップと設定
x-i18n:
    generated_at: "2026-04-25T13:56:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 487cff34e0f9ae307a7c920dfc3cb0a8bbf2cac5e137abd8be4d1fbed19200ca
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Pluginのパッケージング（`package.json` metadata）、manifest
（`openclaw.plugin.json`）、setup entry、設定schemaのリファレンスです。

<Tip>
  **手順付きガイドを探していますか？** how-toガイドでは、パッケージングを文脈の中で扱っています:
  [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins#step-1-package-and-manifest) と
  [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## package metadata

`package.json`には、plugin systemへ
そのpluginが何を提供するかを伝える`openclaw`フィールドが必要です。

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
      "blurb": "チャネルの短い説明。"
    }
  }
}
```

**Provider plugin / ClawHub publish baseline:**

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

pluginをClawHubで外部公開する場合、それらの`compat`と`build`
フィールドは必須です。正規のpublish snippetは
`docs/snippets/plugin-publish/`にあります。

### `openclaw`フィールド

| フィールド | 型 | 説明 |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | entry pointファイル（package root相対）                                                                                |
| `setupEntry` | `string`   | 軽量なsetup専用entry（任意）                                                                                     |
| `channel`    | `object`   | setup、picker、クイックスタート、statusサーフェス向けのchannel catalog metadata                                                 |
| `providers`  | `string[]` | このpluginが登録するprovider id                                                                                      |
| `install`    | `object`   | install hint: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | 起動挙動フラグ                                                                                                      |

### `openclaw.channel`

`openclaw.channel`は、ランタイム読み込み前のchannel discoveryとsetup
サーフェス向けの軽量なpackage metadataです。

| フィールド | 型 | 意味 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 正規channel id。                                                         |
| `label`                                | `string`   | 主要channelラベル。                                                        |
| `selectionLabel`                       | `string`   | `label`と異なるべき場合のpicker/setupラベル。                        |
| `detailLabel`                          | `string`   | より豊かなchannel catalogとstatusサーフェス向けの二次詳細ラベル。       |
| `docsPath`                             | `string`   | setupおよびselectionリンク用のdocsパス。                                      |
| `docsLabel`                            | `string`   | channel idと異なるべき場合にdocsリンクで使うラベルを上書きします。 |
| `blurb`                                | `string`   | 短いオンボーディング/catalog説明。                                         |
| `order`                                | `number`   | channel catalogでの並び順。                                               |
| `aliases`                              | `string[]` | channel選択用の追加lookup alias。                                   |
| `preferOver`                           | `string[]` | このchannelが上位に来るべき低優先度plugin/channel id。                |
| `systemImage`                          | `string`   | channel UI catalog用の任意のicon/system-image名。                      |
| `selectionDocsPrefix`                  | `string`   | selectionサーフェスでdocsリンクの前に付ける接頭辞テキスト。                          |
| `selectionDocsOmitLabel`               | `boolean`  | selection文言でラベル付きdocsリンクの代わりにdocsパスを直接表示します。 |
| `selectionExtras`                      | `string[]` | selection文言に付加される短い追加文字列。                               |
| `markdownCapable`                      | `boolean`  | 送信フォーマット判断のためにこのchannelをmarkdown対応としてマークします。      |
| `exposure`                             | `object`   | setup、設定済み一覧、docsサーフェス向けのchannel可視性制御。   |
| `quickstartAllowFrom`                  | `boolean`  | このchannelを標準クイックスタート`allowFrom`セットアップフローへオプトインさせます。         |
| `forceAccountBinding`                  | `boolean`  | accountが1つしか存在しなくても明示的なaccount bindingを要求します。           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | このchannelのannounce target解決時にsession lookupを優先します。       |

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
      "blurb": "Webhookベースのセルフホスト型チャット統合。",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "ガイド:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure`がサポートするもの:

- `configured`: 設定済み/status形式の一覧サーフェスにそのchannelを含める
- `setup`: 対話型setup/configure pickerにそのchannelを含める
- `docs`: docs/ナビゲーションサーフェスでそのchannelを公開向けとしてマークする

`showConfigured`と`showInSetup`は、引き続きレガシー別名としてサポートされます。`exposure`を推奨します。

### `openclaw.install`

`openclaw.install`はmanifest metadataではなく、package metadataです。

| フィールド | 型 | 意味 |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | install/updateフロー用の正規npm spec。                                     |
| `localPath`                  | `string`             | ローカル開発またはバンドル済みinstall path。                                       |
| `defaultChoice`              | `"npm"` \| `"local"` | 両方利用可能な場合の推奨install source。                                |
| `minHostVersion`             | `string`             | `>=x.y.z`形式の、対応する最小OpenClawバージョン。                        |
| `expectedIntegrity`          | `string`             | pinされたinstall用に期待されるnpm dist integrity文字列。通常は`sha512-...`。   |
| `allowInvalidConfigRecovery` | `boolean`            | バンドル済みplugin再インストールフローで、特定の古いconfig failureからの復旧を許可します。 |

対話型オンボーディングも、install-on-demand
サーフェスに`openclaw.install`を使います。pluginがランタイム読み込み前にprovider auth choiceやchannel setup/catalog
metadataを公開する場合、オンボーディングはそのchoiceを表示し、npm vs local installを尋ね、
pluginをinstallまたは有効化してから、選択したフローを続行できます。npmオンボーディングchoiceには、registry
`npmSpec`を持つ信頼済みcatalog metadataが必要です。厳密なバージョンと`expectedIntegrity`は任意のpinです。`expectedIntegrity`が存在する場合、install/updateフローはそれを強制します。「何を表示するか」のmetadataは`openclaw.plugin.json`に、「どうinstallするか」の
metadataは`package.json`に保ってください。

`minHostVersion`が設定されている場合、installとmanifest-registry読み込みの両方で
それが強制されます。古いhostはそのpluginをスキップし、無効なバージョン文字列は拒否されます。

pinされたnpm installでは、`npmSpec`に厳密バージョンを保持し、
期待されるartifact integrityを追加してください。

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery`は、壊れたconfigに対する一般的なバイパスではありません。これは
狭いバンドル済みplugin復旧専用であり、再インストール/setupが、欠けたバンドルplugin pathや、その同じpluginに対する古い`channels.<id>`
entryのような、既知のアップグレード残骸を修復できるようにするものです。無関係な理由でconfigが壊れている場合、installは引き続きフェイルクローズドで失敗し、operatorへ`openclaw doctor --fix`を実行するよう伝えます。

### 遅延full load

Channel Pluginは次のようにして遅延読み込みへオプトインできます。

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

有効にすると、OpenClawはpre-listen起動
フェーズ中、すでに設定済みのchannelに対しても`setupEntry`のみを読み込みます。
full entryはgatewayがlistenを開始した後に読み込まれます。

<Warning>
  遅延読み込みを有効にするのは、`setupEntry`が
  gatewayがlisten開始前に必要とするすべてを登録している場合だけにしてください
  （channel登録、HTTPルート、
  gateway method）。full entryが必要な起動capabilityを所有している場合は、
  デフォルト挙動のままにしてください。
</Warning>

setup/full entryがgateway RPC methodを登録する場合は、それらを
plugin固有prefixに保ってください。予約済みのコアadmin namespace（`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`）は引き続きコア所有であり、常に
`operator.admin`へ解決されます。

## Plugin manifest

すべてのnative pluginは、package rootに`openclaw.plugin.json`を同梱する必要があります。
OpenClawはこれを使って、pluginコードを実行せずにconfigを検証します。

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "OpenClawにMy Pluginのcapabilityを追加します",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook検証用シークレット"
      }
    }
  }
}
```

channel pluginでは、`kind`と`channels`を追加します。

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

configを持たないpluginでもschemaを同梱する必要があります。空schemaでも有効です。

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完全なschemaリファレンスは[Plugin Manifest](/ja-JP/plugins/manifest)を参照してください。

## ClawHub公開

plugin packageでは、package固有のClawHubコマンドを使います。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

レガシーなskill専用publish aliasはSkills用です。plugin packageでは
常に`clawhub package publish`を使ってください。

## setup entry

`setup-entry.ts`ファイルは、`index.ts`の軽量な代替であり、
OpenClawがsetupサーフェス（オンボーディング、config repair、
無効なchannel inspection）だけを必要とする場合に読み込まれます。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

これにより、setupフロー中に重いランタイムコード（cryptoライブラリ、CLI登録、
background service）を読み込まずに済みます。

setup安全なexportをsidecar moduleに保持しているバンドル済みworkspace channelは、
`defineSetupPluginEntry(...)`の代わりに
`openclaw/plugin-sdk/channel-entry-contract`の
`defineBundledChannelSetupEntry(...)`を使えます。そのバンドル済み契約は、任意の
`runtime` exportもサポートしているため、setup時のランタイム配線を軽量かつ明示的に保てます。

**OpenClawがfull entryの代わりに`setupEntry`を使う場面:**

- channelは無効だが、setup/オンボーディングサーフェスが必要
- channelは有効だが未設定
- 遅延読み込みが有効（`deferConfiguredChannelFullLoadUntilAfterListen`）

**`setupEntry`が登録しなければならないもの:**

- channel plugin object（`defineSetupPluginEntry`経由）
- gateway listen前に必要な任意のHTTPルート
- 起動中に必要な任意のgateway method

それらの起動時gateway methodでも、`config.*`や`update.*`のような
予約済みコアadmin namespaceは避けるべきです。

**`setupEntry`に含めるべきでないもの:**

- CLI登録
- background service
- 重いランタイムimport（crypto、SDK）
- 起動後にのみ必要なgateway method

### 狭いsetup helper import

高速なsetup専用経路では、setupサーフェスの一部しか必要ないなら、
より広い`plugin-sdk/setup` umbrellaより狭いsetup helper seamを優先してください。

| Import path                        | 用途                                                                                | 主なexport                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / 遅延channel起動でも利用可能なsetup時ランタイムhelper | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 環境認識型account setup adapter                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | setup/install CLI/archive/docs helper                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

共有setup
toolbox全体が必要な場合は、より広い`plugin-sdk/setup` seamを使ってください。
`moveSingleAccountChannelSectionToDefaultAccount(...)`のような
config-patch helperも含まれます。

setup patch adapterは、import時にhot-path安全なままです。それらのバンドル済み
single-account promotion contract-surface lookupは遅延されるため、
`plugin-sdk/setup-runtime`をimportしても、adapterが実際に使われる前に
バンドル済みcontract-surface discoveryを即座に読み込むことはありません。

### channel所有のsingle-account promotion

channelが単一accountのトップレベルconfigから
`channels.<id>.accounts.*`へ移行する場合、デフォルトの共有挙動は、昇格された
accountスコープ値を`accounts.default`へ移動することです。

バンドル済みchannelは、自身のsetup
contract surfaceを通じてこのpromotionを絞り込んだり上書きしたりできます。

- `singleAccountKeysToMove`: 昇格された
  accountへ移動すべき追加のトップレベルkey
- `namedAccountPromotionKeys`: すでに名前付きaccountが存在する場合、
  昇格されたaccountへ移動するのはこれらのkeyだけで、共有policy/delivery keyは
  channel rootに残ります
- `resolveSingleAccountPromotionTarget(...)`: 昇格値を受け取る既存accountを選ぶ

現在のバンドル済み例はMatrixです。名前付きMatrix accountがちょうど1つだけ
すでに存在する場合、または`defaultAccount`が`Ops`のような既存の非canonical keyを指している場合、
promotionは新しい`accounts.default` entryを作る代わりに、そのaccountを保持します。

## 設定schema

plugin configは、manifest内のJSON Schemaに対して検証されます。ユーザーは
pluginを次のように設定します。

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

pluginは、このconfigを登録時に`api.pluginConfig`として受け取ります。

channel固有configについては、代わりにchannel configセクションを使います。

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

### channel config schemaの構築

Zod schemaを、plugin所有config artifactで使われる
`ChannelConfigSchema` wrapperへ変換するには`buildChannelConfigSchema`を使います。

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

サードパーティPluginでは、cold-path契約は依然としてplugin manifestです:
生成されたJSON Schemaを`openclaw.plugin.json#channelConfigs`へ反映し、
config schema、setup、UIサーフェスがランタイムコードを読み込まずに
`channels.<id>`を検査できるようにしてください。

## セットアップウィザード

Channel Pluginは`openclaw onboard`向けの対話型セットアップウィザードを提供できます。
ウィザードは`ChannelPlugin`上の`ChannelSetupWizard`オブジェクトです。

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
      envPrompt: "環境変数のMY_CHANNEL_BOT_TOKENを使いますか？",
      keepPrompt: "現在のtokenを保持しますか？",
      inputPrompt: "Bot tokenを入力してください:",
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

`ChannelSetupWizard`型は、`credentials`、`textInputs`,
`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize`などをサポートします。
完全な例は、バンドル済みplugin package（たとえばDiscord pluginの`src/channel.setup.ts`）を参照してください。

標準の
`note -> prompt -> parse -> merge -> patch`フローだけが必要なDM allowlist promptでは、
`openclaw/plugin-sdk/setup`の共有setup
helperを優先してください: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`、および
`createNestedChannelParsedAllowFromPrompt(...)`。

ラベル、スコア、任意の追加行だけが異なるchannel setup status blockでは、
各pluginで同じ`status`オブジェクトを手作業で書く代わりに、
`openclaw/plugin-sdk/setup`の`createStandardChannelSetupStatus(...)`を優先してください。

特定の文脈でのみ表示すべき任意のsetupサーフェスには、
`openclaw/plugin-sdk/channel-setup`の`createOptionalChannelSetupSurface`を使います。

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

`plugin-sdk/channel-setup`は、より低レベルな
`createOptionalChannelSetupAdapter(...)`と
`createOptionalChannelSetupWizard(...)` builderも公開しており、
その任意installサーフェスの半分だけが必要な場合に使えます。

生成されたoptional adapter/wizardは、実際のconfig書き込み時にはフェイルクローズドです。`validateInput`、
`applyAccountConfig`、`finalize`の間で1つのinstall-requiredメッセージを再利用し、`docsPath`が
設定されている場合はdocsリンクを追加します。

バイナリバックエンドのsetup UIでは、各channelへ同じbinary/status glueを複製する代わりに、
共有の委譲helperを優先してください。

- `createDetectedBinaryStatus(...)`: ラベル、
  ヒント、スコア、binary検出だけが異なるstatus block向け
- `createCliPathTextInput(...)`: pathバックendのtext input向け
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, および
  `createDelegatedResolveConfigured(...)`: `setupEntry`が
  より重いfull wizardへ遅延委譲する必要がある場合
- `createDelegatedTextInputShouldPrompt(...)`: `setupEntry`が
  `textInputs[*].shouldPrompt`の判定だけを委譲すればよい場合

## 公開とインストール

**外部Plugin:** [ClawHub](/ja-JP/tools/clawhub)またはnpmへ公開し、その後インストールします。

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClawは最初にClawHubを試し、自動的にnpmへフォールバックします。ClawHubを明示的に
強制することもできます。

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

対応する`npm:`上書きはありません。ClawHubフォールバック後にnpm経路を使いたい場合は、
通常のnpm package specを使ってください。

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**リポジトリ内Plugin:** バンドル済みplugin workspace tree配下へ置くと、ビルド中に自動検出されます。

**ユーザーがインストールできるもの:**

```bash
openclaw plugins install <package-name>
```

<Info>
  npmソースのインストールでは、`openclaw plugins install`は
  `npm install --ignore-scripts`を実行します
  （ライフサイクルスクリプトなし）。plugin dependency
  treeはpure JS/TSに保ち、`postinstall`ビルドを必要とするpackageは避けてください。
</Info>

バンドル済みのOpenClaw所有Pluginだけが起動修復の例外です: パッケージ版installで、
plugin config、レガシーchannel config、またはそのバンドル済みデフォルト有効manifestによってそれが有効だと判断された場合、起動時にそのpluginの欠けている
ランタイム依存関係がimport前にインストールされます。サードパーティPluginは起動時installに依存すべきではありません。引き続き明示的なplugin installerを使ってください。

## 関連

- [SDK entry points](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry`と`defineChannelPluginEntry`
- [Plugin manifest](/ja-JP/plugins/manifest) — 完全なmanifest schemaリファレンス
- [Building plugins](/ja-JP/plugins/building-plugins) — 手順付きの入門ガイド
