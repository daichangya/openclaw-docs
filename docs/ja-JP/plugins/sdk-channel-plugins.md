---
read_when:
    - 新しいメッセージングchannel pluginを構築している場合
    - OpenClawをメッセージングプラットフォームに接続したい場合
    - ChannelPluginアダプターサーフェスを理解する必要がある場合
sidebarTitle: Channel Plugins
summary: OpenClaw向けメッセージングchannel pluginを構築するためのステップごとのガイド
title: Channel Pluginsの構築
x-i18n:
    generated_at: "2026-04-05T12:52:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a6ad2c75549db8ce54f7e22ca9850d7ed68c5cd651c9bb41c9f73769f48aba
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Channel Pluginsの構築

このガイドでは、OpenClawをメッセージングプラットフォームに接続するchannel pluginの構築手順を説明します。最終的には、DMセキュリティ、ペアリング、応答スレッド化、送信メッセージングを備えた動作するchannelを作成できます。

<Info>
  OpenClaw pluginをまだ一度も構築したことがない場合は、まず
  [はじめに](/plugins/building-plugins)を読んで、基本的なパッケージ
  構造とマニフェスト設定を確認してください。
</Info>

## channel pluginsの仕組み

channel pluginsには独自のsend/edit/react toolsは不要です。OpenClawは
共有の`message` toolをcoreに1つだけ保持します。pluginが担当するのは次です:

- **設定** — アカウント解決とセットアップウィザード
- **セキュリティ** — DMポリシーとallowlist
- **ペアリング** — DM承認フロー
- **セッショングラマー** — プロバイダー固有の会話idを、ベースチャット、thread id、親フォールバックへどう対応付けるか
- **送信** — プラットフォームへのテキスト、メディア、polls送信
- **スレッド化** — 応答をどうスレッド化するか

coreは共有message tool、プロンプト配線、外側のsession-key形状、
汎用的な`:thread:`管理、およびディスパッチを担当します。

プラットフォームが会話id内に追加スコープを保存する場合、その解析は
plugin内で`messaging.resolveSessionConversation(...)`に保持してください。これは
`rawId`をベース会話id、任意のthread
id、明示的な`baseConversationId`、および任意の`parentConversationCandidates`へ対応付けるための
正規フックです。
`parentConversationCandidates`を返す場合は、最も狭い親から最も広い/ベース会話へ向けて順序を保ってください。

bundled pluginsで、channel registryが起動する前に同じ解析が必要な場合は、
一致する`resolveSessionConversation(...)`エクスポートを持つトップレベルの
`session-key-api.ts`ファイルを公開することもできます。coreは、ランタイムplugin registryがまだ利用できない場合にのみ、この起動時安全なサーフェスを使用します。

`messaging.resolveParentConversationCandidates(...)`は、pluginが汎用/raw idの上に
親フォールバックだけを必要とする場合の、古い互換フォールバックとして引き続き利用可能です。両方のフックが存在する場合、coreはまず
`resolveSessionConversation(...).parentConversationCandidates`を使用し、正規フックが
それらを省略した場合にのみ`resolveParentConversationCandidates(...)`へフォールバックします。

## 承認とchannel機能

ほとんどのchannel pluginsでは、承認専用コードは不要です。

- coreは、同一チャット内の`/approve`、共有承認ボタンのペイロード、および汎用フォールバック配信を担当します。
- channelが承認固有の動作を必要とする場合は、channel plugin上の1つの`approvalCapability`オブジェクトを優先してください。
- `approvalCapability.authorizeActorAction`と`approvalCapability.getActionAvailabilityState`が、正規の承認認可シームです。
- 重複するローカル承認プロンプトの非表示や、配信前のtyping indicator送信など、channel固有のペイロードライフサイクル動作には`outbound.shouldSuppressLocalPayloadPrompt`または`outbound.beforeDeliverPayload`を使用してください。
- ネイティブ承認ルーティングまたはフォールバック抑制には`approvalCapability.delivery`のみを使用してください。
- 共有レンダラーではなく、本当にchannelにカスタム承認ペイロードが必要な場合にのみ`approvalCapability.render`を使用してください。
- 既存設定から安定したowner類似のDM identityを推測できるchannelでは、承認固有のcoreロジックを追加せずに、同一チャット内の`/approve`を制限するため`openclaw/plugin-sdk/approval-runtime`の`createResolvedApproverActionAuthAdapter`を使用してください。
- channelにネイティブ承認配信が必要な場合、channelコードはターゲット正規化と転送フックに集中させてください。`openclaw/plugin-sdk/approval-runtime`の`createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver`、`createApproverRestrictedNativeApprovalCapability`、`createChannelNativeApprovalRuntime`を使用し、coreがリクエストフィルタリング、ルーティング、重複排除、有効期限、およびGatewayサブスクリプションを担当するようにしてください。
- ネイティブ承認channelでは、`accountId`と`approvalKind`の両方をそれらのヘルパー経由でルーティングする必要があります。`accountId`はマルチアカウント承認ポリシーを正しいbotアカウントに限定し、`approvalKind`はexecとplugin承認の動作をcore内のハードコード分岐なしでchannelに利用可能にします。
- 配信された承認idの種別はエンドツーエンドで保持してください。ネイティブクライアントは、channelローカル状態からexec対plugin承認ルーティングを推測または書き換えてはいけません。
- 異なる承認種別では、意図的に異なるネイティブサーフェスを公開できます。
  現在のbundled examples:
  - Slackは、exec idとplugin idの両方でネイティブ承認ルーティングを利用可能にしています。
  - Matrixは、exec承認に対してのみネイティブDM/channelルーティングを維持し、
    plugin承認は共有の同一チャット`/approve`パスに残します。
- `createApproverRestrictedNativeApprovalAdapter`は互換ラッパーとしてまだ存在しますが、新しいコードではcapability builderを優先し、plugin上で`approvalCapability`を公開してください。

ホットなchannelエントリポイントでは、そのファミリーの一部だけが必要なら、より狭いランタイムsubpathを優先してください:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

同様に、より広いumbrella
surfaceが不要な場合は、`openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-adapter-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference`、および
`openclaw/plugin-sdk/reply-chunking`を優先してください。

セットアップ固有では:

- `openclaw/plugin-sdk/setup-runtime`は、ランタイム安全なセットアップヘルパーを扱います:
  import安全なセットアップパッチアダプター（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、lookup-note出力、
  `promptResolvedAllowFrom`、`splitSetupEntries`、および委譲された
  setup-proxy builder
- `openclaw/plugin-sdk/setup-adapter-runtime`は、`createEnvPatchedAccountSetupAdapter`向けの狭いenv対応アダプター
  シームです
- `openclaw/plugin-sdk/channel-setup`は、任意インストールのセットアップ
  builderと、いくつかのセットアップ安全な基本要素を扱います:
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、
  `createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
  `createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、および
  `splitSetupEntries`
- より重い共有セットアップ/設定ヘルパー、たとえば
  `moveSingleAccountChannelSectionToDefaultAccount(...)`も必要な場合にのみ、
  より広い`openclaw/plugin-sdk/setup`シームを使用してください

セットアップサーフェスで「先にこのpluginをインストールしてください」とだけ案内したいchannelでは、`createOptionalChannelSetupSurface(...)`を優先してください。生成されるadapter/wizardは設定書き込みと最終化でフェイルクローズし、検証、最終化、ドキュメントリンク文言全体で同じインストール必須メッセージを再利用します。

その他のホットなchannelパスでも、広い古いsurfaceより狭いヘルパーを優先してください:

- マルチアカウント設定と
  デフォルトアカウントフォールバックには
  `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution`、および
  `openclaw/plugin-sdk/account-helpers`
- 受信ルート/エンベロープと
  record-and-dispatch配線には
  `openclaw/plugin-sdk/inbound-envelope`と
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- ターゲット解析/マッチングには
  `openclaw/plugin-sdk/messaging-targets`
- メディア読み込みと送信
  identity/send delegateには
  `openclaw/plugin-sdk/outbound-media`と
  `openclaw/plugin-sdk/outbound-runtime`
- thread-bindingライフサイクル
  とadapter登録には
  `openclaw/plugin-sdk/thread-bindings-runtime`
- 古いagent/media
  ペイロードフィールドレイアウトがまだ必要な場合のみ
  `openclaw/plugin-sdk/agent-media-payload`
- Telegramカスタムコマンド
  正規化、重複/競合検証、およびフォールバック安定なコマンド
  設定契約には
  `openclaw/plugin-sdk/telegram-command-config`

認証専用channelでは、通常はデフォルトパスで十分です: coreが承認を処理し、pluginは送信/認証機能を公開するだけです。Matrix、Slack、Telegram、カスタムチャット転送のようなネイティブ承認channelでは、独自の承認ライフサイクルを実装せず、共有のネイティブヘルパーを使用してください。

## ウォークスルー

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="パッケージとマニフェスト">
    標準的なpluginファイルを作成します。`package.json`の`channel`フィールドが、
    これをchannel pluginにします。完全なpackage-metadataサーフェスについては、
    [Plugin Setup and Config](/plugins/sdk-setup#openclawchannel)を参照してください:

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="channel pluginオブジェクトを構築する">
    `ChannelPlugin`インターフェースには多くの任意adapter surfaceがあります。まず
    最小構成である`id`と`setup`から始め、必要に応じてadapterを追加してください。

    `src/channel.ts`を作成します:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    <Accordion title="createChatChannelPluginが代わりに行ってくれること">
      低レベルadapter interfaceを手動実装する代わりに、
      宣言的オプションを渡すと、builderがそれらを合成します:

      | Option | 配線されるもの |
      | --- | --- |
      | `security.dm` | 設定フィールドからのスコープ付きDM security resolver |
      | `pairing.text` | コード交換によるテキストベースDM pairingフロー |
      | `threading` | reply-to-mode resolver（固定、アカウントスコープ、またはカスタム） |
      | `outbound.attachedResults` | 結果メタデータ（message ID）を返すsend関数 |

      完全制御が必要な場合は、宣言的オプションの代わりに生のadapterオブジェクトを渡すこともできます。
    </Accordion>

  </Step>

  <Step title="エントリポイントを配線する">
    `index.ts`を作成します:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    channel所有のCLI descriptorは`registerCliMetadata(...)`に置いてください。これによりOpenClawは、完全なchannel runtimeを有効化せずに
    root helpへそれらを表示でき、通常の完全ロードでも実際のコマンド登録のために同じdescriptorを取得できます。`registerFull(...)`はruntime専用作業のために保持してください。
    `registerFull(...)`がgateway RPC methodを登録する場合は、
    plugin固有プレフィックスを使用してください。core管理namespace（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）は予約されており、常に
    `operator.admin`へ解決されます。
    `defineChannelPluginEntry`は、登録モードの分割を自動処理します。すべての
    オプションについては[Entry Points](/plugins/sdk-entrypoints#definechannelpluginentry)を参照してください。

  </Step>

  <Step title="setup entryを追加する">
    オンボーディング中の軽量ロードのために`setup-entry.ts`を作成します:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClawは、channelが無効または未設定のとき、完全entryの代わりにこれをロードします。
    これにより、セットアップフロー中に重いruntimeコードを引き込まずに済みます。
    詳細は[Setup and Config](/plugins/sdk-setup#setup-entry)を参照してください。

  </Step>

  <Step title="受信メッセージを処理する">
    pluginは、プラットフォームからメッセージを受信し、それを
    OpenClawへ転送する必要があります。典型的なパターンは、リクエストを検証し、
    そのchannelのinbound handler経由でディスパッチするWebhookです:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      inboundメッセージ処理はchannel固有です。各channel pluginは
      独自のinboundパイプラインを所有します。実際のパターンについては、bundled channel plugins
      （たとえばMicrosoft TeamsまたはGoogle Chat plugin package）を確認してください。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="テスト">
`src/channel.test.ts`に同居テストを書きます:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    共有テストヘルパーについては、[Testing](/plugins/sdk-testing)を参照してください。

  </Step>
</Steps>

## ファイル構造

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # 設定スキーマ付きマニフェスト
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 公開エクスポート（任意）
├── runtime-api.ts            # 内部runtimeエクスポート（任意）
└── src/
    ├── channel.ts            # createChatChannelPlugin経由のChannelPlugin
    ├── channel.test.ts       # テスト
    ├── client.ts             # プラットフォームAPIクライアント
    └── runtime.ts            # runtimeストア（必要なら）
```

## 高度なトピック

<CardGroup cols={2}>
  <Card title="スレッド化オプション" icon="git-branch" href="/plugins/sdk-entrypoints#registration-mode">
    固定、アカウントスコープ、またはカスタムのreply mode
  </Card>
  <Card title="Message tool統合" icon="puzzle" href="/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageToolとactionディスカバリー
  </Card>
  <Card title="ターゲット解決" icon="crosshair" href="/plugins/architecture#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="runtimeヘルパー" icon="settings" href="/plugins/sdk-runtime">
    api.runtime経由のTTS、STT、media、subagent
  </Card>
</CardGroup>

<Note>
一部のbundled helper seamは、bundled-pluginの保守と
互換性のために依然存在します。これらは新しいchannel pluginsに推奨されるパターンではありません。
そのbundled pluginファミリーを直接保守しているのでない限り、
共通SDKサーフェスの汎用的なchannel/setup/reply/runtime subpathを優先してください。
</Note>

## 次のステップ

- [Provider Plugins](/plugins/sdk-provider-plugins) — pluginがモデルも提供する場合
- [SDK Overview](/plugins/sdk-overview) — 完全なsubpath importリファレンス
- [SDK Testing](/plugins/sdk-testing) — テストユーティリティと契約テスト
- [Plugin Manifest](/plugins/manifest) — 完全なマニフェストスキーマ
