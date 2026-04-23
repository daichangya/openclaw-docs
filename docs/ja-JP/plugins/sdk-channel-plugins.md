---
read_when:
    - 新しいメッセージングchannel Pluginを構築している場合
    - OpenClawをメッセージングプラットフォームに接続したい場合
    - ChannelPluginアダプターのサーフェスを理解する必要がある場合
sidebarTitle: Channel Plugins
summary: OpenClaw向けメッセージングchannel Pluginを構築するためのステップバイステップガイド
title: channel Pluginの構築
x-i18n:
    generated_at: "2026-04-23T04:48:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: e67d8c4be8cc4a312e5480545497b139c27bed828304de251e6258a3630dd9b5
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# channel Pluginの構築

このガイドでは、OpenClawをメッセージングプラットフォームに接続するchannel Pluginの構築手順を説明します。最後には、DMセキュリティ、ペアリング、返信スレッド化、アウトバウンドメッセージングを備えた動作するchannelが完成します。

<Info>
  まだOpenClaw Pluginを一度も作成したことがない場合は、基本的なパッケージ構造とmanifest設定について、先に[はじめに](/ja-JP/plugins/building-plugins)を読んでください。
</Info>

## channel Pluginの仕組み

channel Pluginには、独自の送信/編集/リアクションtoolは不要です。OpenClawは、core内に共有の`message` toolを1つ保持します。あなたのPluginが担うのは次の部分です。

- **設定** — account解決とセットアップウィザード
- **セキュリティ** — DMポリシーとallowlist
- **ペアリング** — DM承認フロー
- **セッショングラマー** — provider固有の会話IDを、ベースチャット、thread ID、親フォールバックにどのようにマッピングするか
- **アウトバウンド** — テキスト、メディア、pollをプラットフォームへ送信すること
- **スレッド化** — 返信をどのようにスレッド化するか
- **Heartbeat typing** — Heartbeat配信ターゲット向けの任意のtyping/busyシグナル

coreは、共有message tool、prompt配線、外側のsession-key形状、汎用的な`:thread:`管理、ディスパッチを担います。

あなたのchannelが受信返信以外でもtyping indicatorをサポートしている場合は、channel Pluginで`heartbeat.sendTyping(...)`を公開してください。coreは、Heartbeatモデル実行が始まる前に、解決済みのHeartbeat配信ターゲットを使ってこれを呼び出し、共有のtyping keepalive/cleanupライフサイクルを使用します。プラットフォームで明示的な停止シグナルが必要な場合は、`heartbeat.clearTyping(...)`も追加してください。

あなたのchannelが、メディアソースを運ぶmessage-tool paramを追加する場合は、それらのparam名を`describeMessageTool(...).mediaSourceParams`を通じて公開してください。coreは、その明示的なリストをsandboxパス正規化とアウトバウンドのメディアアクセスポリシーに使用するため、plugin側でprovider固有のavatar、attachment、cover-image param向けの共有core特例は不要です。
できれば、`{ "set-profile": ["avatarUrl", "avatarPath"] }`のようなactionキー付きmapを返してください。そうすることで、無関係なactionが別のactionのメディア引数を引き継がずに済みます。意図的にすべての公開action間で共有されるparamであれば、フラットな配列でも引き続き機能します。

あなたのプラットフォームが会話ID内に追加のscopeを保存する場合、その解析はplugin内で`messaging.resolveSessionConversation(...)`に保持してください。これは、`rawId`をベース会話ID、任意のthread ID、明示的な`baseConversationId`、および`parentConversationCandidates`へマッピングするための正規のhookです。
`parentConversationCandidates`を返す場合は、最も狭い親から最も広い/ベース会話の順に並べてください。

channelレジストリの起動前に同じ解析が必要なバンドルpluginは、一致する`resolveSessionConversation(...)`エクスポートを持つトップレベルの`session-key-api.ts`ファイルも公開できます。coreは、ランタイムpluginレジストリがまだ利用できない場合にのみ、このbootstrap-safeなサーフェスを使用します。

`messaging.resolveParentConversationCandidates(...)`は、pluginが汎用/raw idの上に親フォールバックだけを必要とする場合の、レガシー互換フォールバックとして引き続き利用できます。両方のhookが存在する場合、coreはまず`resolveSessionConversation(...).parentConversationCandidates`を使い、それが省略されている場合にのみ`resolveParentConversationCandidates(...)`へフォールバックします。

## 承認とchannel機能

ほとんどのchannel Pluginでは、承認専用コードは不要です。

- coreは、同一チャット内の`/approve`、共有承認ボタンペイロード、汎用フォールバック配信を担います。
- channelが承認固有の動作を必要とする場合は、channel Plugin上に1つの`approvalCapability` objectを置く形を優先してください。
- `ChannelPlugin.approvals`は削除されました。承認配信/ネイティブ/レンダリング/認証の情報は`approvalCapability`に置いてください。
- `plugin.auth`はlogin/logout専用です。coreはそのobjectから承認auth hookを読み取りません。
- `approvalCapability.authorizeActorAction`と`approvalCapability.getActionAvailabilityState`が、正規の承認authシームです。
- 同一チャット内の承認auth可用性には`approvalCapability.getActionAvailabilityState`を使ってください。
- channelがネイティブexec承認を公開する場合、開始サーフェス/ネイティブクライアントの状態が同一チャットの承認authと異なるときは、`approvalCapability.getExecInitiatingSurfaceState`を使ってください。coreは、このexec専用hookを使って`enabled`と`disabled`を区別し、開始channelがネイティブexec承認をサポートしているかを判断し、ネイティブクライアントのフォールバックガイダンスにそのchannelを含めます。`createApproverRestrictedNativeApprovalCapability(...)`は、一般的なケースでこれを埋めます。
- 重複するローカル承認promptの非表示や、配信前のtyping indicator送信のようなchannel固有のペイロードライフサイクル動作には、`outbound.shouldSuppressLocalPayloadPrompt`または`outbound.beforeDeliverPayload`を使ってください。
- `approvalCapability.delivery`は、ネイティブ承認ルーティングまたはフォールバック抑制にのみ使用してください。
- `approvalCapability.nativeRuntime`は、channelが所有するネイティブ承認情報に使ってください。ホットなchannelエントリポイントでは、`createLazyChannelApprovalNativeRuntimeAdapter(...)`を使って遅延化し、必要時にランタイムモジュールをimportしつつ、coreが承認ライフサイクルを組み立てられるようにしてください。
- `approvalCapability.render`は、channelが共有レンダラーではなく本当に独自の承認ペイロードを必要とする場合にのみ使ってください。
- `approvalCapability.describeExecApprovalSetup`は、channelが無効時の返信に、ネイティブexec承認を有効にするために必要な正確な設定ノブを説明したい場合に使ってください。このhookは`{ channel, channelLabel, accountId }`を受け取ります。名前付きaccountのchannelでは、トップレベルのデフォルトではなく、`channels.<channel>.accounts.<id>.execApprovals.*`のようなaccountスコープのパスをレンダリングする必要があります。
- channelが既存設定から安定したowner相当のDM identityを推定できる場合、同一チャット内の`/approve`を制限するために`openclaw/plugin-sdk/approval-runtime`の`createResolvedApproverActionAuthAdapter`を使ってください。承認固有のcoreロジックを追加する必要はありません。
- channelがネイティブ承認配信を必要とする場合、channelコードはターゲット正規化とトランスポート/プレゼンテーション情報に集中させてください。`openclaw/plugin-sdk/approval-runtime`の`createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver`、`createApproverRestrictedNativeApprovalCapability`を使ってください。channel固有の情報は`approvalCapability.nativeRuntime`の裏側に置き、理想的には`createChannelApprovalNativeRuntimeAdapter(...)`または`createLazyChannelApprovalNativeRuntimeAdapter(...)`経由にしてください。そうすることで、coreがハンドラーを組み立て、リクエストフィルタリング、ルーティング、重複排除、期限切れ、Gateway購読、別経路配信通知を担えます。`nativeRuntime`はいくつかの小さなシームに分かれています:
- `availability` — accountが設定済みかどうか、またリクエストを処理すべきかどうか
- `presentation` — 共有承認view modelを、保留中/解決済み/期限切れのネイティブペイロードまたは最終actionへマッピングすること
- `transport` — ターゲットを準備し、ネイティブ承認メッセージを送信/更新/削除すること
- `interactions` — ネイティブボタンまたはリアクション向けの任意のbind/unbind/clear-action hook
- `observe` — 任意の配信診断hook
- channelがclient、token、Bolt app、Webhook receiverのようなランタイム所有objectを必要とする場合、それらを`openclaw/plugin-sdk/channel-runtime-context`を通じて登録してください。汎用ランタイムコンテキストレジストリにより、coreは承認固有のラッパーグルーを追加せずに、channel起動状態から機能駆動ハンドラーをbootstrapできます。
- 機能駆動シームではまだ表現力が足りない場合にのみ、より低レベルの`createChannelApprovalHandler`または`createChannelNativeApprovalRuntime`に頼ってください。
- ネイティブ承認channelは、`accountId`と`approvalKind`の両方をそれらのヘルパー経由でルーティングする必要があります。`accountId`は複数accountの承認ポリシーを正しいbot accountにスコープし、`approvalKind`はcore内のハードコード分岐なしでexec対plugin承認の動作をchannelで利用可能にします。
- coreは現在、承認の再ルーティング通知も担います。channel Pluginは、`createChannelNativeApprovalRuntime`から独自の「承認はDM/別channelに送られました」追跡メッセージを送るべきではありません。代わりに、共有承認機能ヘルパーを通じて正確なorigin + approver-DMルーティングを公開し、開始チャットへの通知投稿前に実際の配信をcoreが集約するようにしてください。
- 配信された承認id種別を端から端まで保持してください。ネイティブクライアントは、channelローカル状態からexec対plugin承認ルーティングを推測したり書き換えたりしてはいけません。
- 異なる承認種別は、意図的に異なるネイティブサーフェスを公開できます。
  現在の同梱例:
  - Slackは、exec idとplugin idの両方でネイティブ承認ルーティングを利用可能にしています。
  - Matrixは、exec承認とplugin承認で同じネイティブDM/channelルーティングとreaction UXを維持しつつ、承認種別ごとにauthを変えられるようにしています。
- `createApproverRestrictedNativeApprovalAdapter`は互換ラッパーとしてまだ存在しますが、新しいコードでは機能ビルダーを優先し、plugin上で`approvalCapability`を公開してください。

ホットなchannelエントリポイントでは、そのファミリー全体ではなく一部だけが必要な場合、より狭いランタイムサブパスを優先してください。

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同様に、より広い包括サーフェスが不要な場合は、`openclaw/plugin-sdk/setup-runtime`、`openclaw/plugin-sdk/setup-adapter-runtime`、`openclaw/plugin-sdk/reply-runtime`、`openclaw/plugin-sdk/reply-dispatch-runtime`、`openclaw/plugin-sdk/reply-reference`、`openclaw/plugin-sdk/reply-chunking`を優先してください。

セットアップについては特に:

- `openclaw/plugin-sdk/setup-runtime`は、ランタイムセーフなセットアップヘルパーを扱います:
  import-safeなセットアップpatchアダプター（`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`）、lookup-note出力、`promptResolvedAllowFrom`、`splitSetupEntries`、委譲されたsetup-proxyビルダー
- `openclaw/plugin-sdk/setup-adapter-runtime`は、`createEnvPatchedAccountSetupAdapter`向けの狭いenv対応アダプターシームです
- `openclaw/plugin-sdk/channel-setup`は、任意インストールのセットアップビルダーと、いくつかのセットアップセーフな基本要素を扱います:
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

あなたのchannelがenv駆動のセットアップまたはauthをサポートし、汎用起動/設定フローがランタイム読み込み前にそれらのenv名を知る必要がある場合は、plugin manifest内で`channelEnvVars`として宣言してください。channelランタイム`envVars`またはローカル定数は、operator向け文言専用にしてください。

あなたのchannelが、pluginランタイム開始前に`status`、`channels list`、`channels status`、またはSecretRefスキャンに現れる可能性がある場合は、`package.json`に`openclaw.setupEntry`を追加してください。そのエントリポイントは、読み取り専用コマンドパスで安全にimportできる必要があり、それらのサマリーに必要なchannelメタデータ、セットアップセーフな設定アダプター、statusアダプター、channel secret targetメタデータを返す必要があります。セットアップエントリからclient、listener、トランスポートランタイムを起動してはいけません。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries`

- より重い共有セットアップ/設定ヘルパー、たとえば`moveSingleAccountChannelSectionToDefaultAccount(...)`も必要な場合にのみ、より広い`openclaw/plugin-sdk/setup`シームを使ってください

あなたのchannelが、セットアップサーフェスで単に「まずこのpluginをインストールしてください」と案内したいだけなら、`createOptionalChannelSetupSurface(...)`を優先してください。生成されるadapter/wizardは設定書き込みと最終化でfail closedし、検証、finalize、docs-link文言の各所で同じinstall-requiredメッセージを再利用します。

その他のホットなchannelパスでも、より広いレガシーサーフェスより狭いヘルパーを優先してください:

- 複数account設定とデフォルトaccountフォールバックには、`openclaw/plugin-sdk/account-core`、`openclaw/plugin-sdk/account-id`、`openclaw/plugin-sdk/account-resolution`、`openclaw/plugin-sdk/account-helpers`
- inboundのroute/envelopeとrecord-and-dispatch配線には、`openclaw/plugin-sdk/inbound-envelope`と`openclaw/plugin-sdk/inbound-reply-dispatch`
- ターゲットの解析/マッチングには、`openclaw/plugin-sdk/messaging-targets`
- メディア読み込みとアウトバウンドidentity/send delegate、ペイロード計画には、`openclaw/plugin-sdk/outbound-media`と`openclaw/plugin-sdk/outbound-runtime`
- 明示的な`replyToId`/`threadId`を保持するか、ベースsession keyがまだ一致している後で現在の`:thread:` sessionを復元する必要があるアウトバウンドrouteには、`openclaw/plugin-sdk/channel-core`の`buildThreadAwareOutboundSessionRoute(...)`
  provider Pluginは、自分のプラットフォームにネイティブなスレッド配信セマンティクスがある場合、優先順位、サフィックス動作、thread id正規化をオーバーライドできます。
- thread-bindingライフサイクルとadapter登録には、`openclaw/plugin-sdk/thread-bindings-runtime`
- レガシーなagent/mediaペイロードのフィールドレイアウトがまだ必要な場合にのみ、`openclaw/plugin-sdk/agent-media-payload`
- Telegramのカスタムコマンド正規化、重複/競合検証、フォールバック安定なコマンド設定契約には、`openclaw/plugin-sdk/telegram-command-config`

認証専用channelは通常、デフォルトパスで十分です。coreが承認を処理し、pluginはアウトバウンド/認証機能を公開するだけで済みます。Matrix、Slack、Telegram、カスタムチャットトランスポートのようなネイティブ承認channelは、独自の承認ライフサイクルを作り込むのではなく、共有ネイティブヘルパーを使用する必要があります。

## inboundメンションポリシー

inboundメンション処理は、次の2層に分けたままにしてください。

- pluginが所有する証拠収集
- 共有ポリシー評価

メンションポリシーの判定には`openclaw/plugin-sdk/channel-mention-gating`を使ってください。より広いinboundヘルパーbarrelが必要な場合にのみ、`openclaw/plugin-sdk/channel-inbound`を使ってください。

pluginローカルロジックに適しているもの:

- botへの返信検出
- botの引用検出
- スレッド参加チェック
- service/systemメッセージ除外
- bot参加を証明するために必要なプラットフォームネイティブキャッシュ

共有ヘルパーに適しているもの:

- `requireMention`
- 明示的なメンション結果
- 暗黙のメンションallowlist
- コマンドバイパス
- 最終的なスキップ判定

推奨フロー:

1. ローカルのメンション情報を計算する。
2. その情報を`resolveInboundMentionDecision({ facts, policy })`に渡す。
3. inboundゲートでは`decision.effectiveWasMentioned`、`decision.shouldBypassMention`、`decision.shouldSkip`を使う。

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`api.runtime.channel.mentions`は、すでにランタイム注入に依存しているバンドルchannel Plugin向けにも、同じ共有メンションヘルパーを公開します。

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`implicitMentionKindWhen`と`resolveInboundMentionDecision`だけが必要な場合は、無関係なinboundランタイムヘルパーを読み込まないよう、`openclaw/plugin-sdk/channel-mention-gating`からimportしてください。

古い`resolveMentionGating*`ヘルパーは、互換エクスポートとしてのみ`openclaw/plugin-sdk/channel-inbound`に残っています。新しいコードでは`resolveInboundMentionDecision({ facts, policy })`を使うべきです。

## ウォークスルー

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="パッケージとmanifest">
    標準的なpluginファイルを作成してください。`package.json`内の`channel`フィールドが、これをchannel Pluginにします。完全なパッケージメタデータのサーフェスについては、[Plugin Setup and Config](/ja-JP/plugins/sdk-setup#openclaw-channel)を参照してください。

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

  <Step title="channel Plugin objectを構築する">
    `ChannelPlugin`インターフェースには、多数の任意adapterサーフェスがあります。最小構成である`id`と`setup`から始め、必要に応じてadapterを追加してください。

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

    <Accordion title="createChatChannelPluginがやってくれること">
      低レベルadapterインターフェースを手作業で実装する代わりに、宣言的なオプションを渡すと、builderがそれらを組み合わせます。

      | オプション | 配線されるもの |
      | --- | --- |
      | `security.dm` | 設定フィールドからのスコープ付きDMセキュリティリゾルバー |
      | `pairing.text` | コード交換を伴うテキストベースのDMペアリングフロー |
      | `threading` | reply-toモードリゾルバー（固定、accountスコープ、またはカスタム） |
      | `outbound.attachedResults` | 結果メタデータ（message ID）を返す送信関数 |

      完全な制御が必要な場合は、宣言的オプションの代わりに生のadapter objectを渡すこともできます。
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

    channelが所有するCLI descriptorは`registerCliMetadata(...)`に置いてください。そうすることで、OpenClawは完全なchannelランタイムを有効化せずにそれらをルートヘルプへ表示でき、通常の完全ロードでも実際のコマンド登録のために同じdescriptorを取得できます。`registerFull(...)`はランタイム専用の処理に使ってください。
    `registerFull(...)`がGateway RPCメソッドを登録する場合は、plugin固有の接頭辞を使用してください。コアadmin名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は予約済みで、常に`operator.admin`に解決されます。
    `defineChannelPluginEntry`は、登録モードの分岐を自動的に処理します。すべてのオプションについては[Entry Points](/ja-JP/plugins/sdk-entrypoints#definechannelpluginentry)を参照してください。

  </Step>

  <Step title="setup entryを追加する">
    オンボーディング時の軽量ロード用に`setup-entry.ts`を作成します:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClawは、channelが無効または未設定のとき、完全なエントリの代わりにこれを読み込みます。これにより、セットアップフロー中に重いランタイムコードを引き込まずに済みます。詳細は[Setup and Config](/ja-JP/plugins/sdk-setup#setup-entry)を参照してください。

    setup-safeなエクスポートをsidecar moduleへ分割する同梱workspace channelは、明示的なセットアップ時ランタイムsetterも必要な場合、`openclaw/plugin-sdk/channel-entry-contract`の`defineBundledChannelSetupEntry(...)`を使えます。

  </Step>

  <Step title="inboundメッセージを処理する">
    あなたのpluginは、プラットフォームからメッセージを受け取り、それをOpenClawへ転送する必要があります。一般的なパターンは、リクエストを検証し、channelのinbound handlerを通じてディスパッチするWebhookです:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth（署名検証は自分で行います）
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // あなたのinbound handlerがメッセージをOpenClawへディスパッチします。
          // 正確な配線はプラットフォームSDKに依存します —
          // 実例は同梱のMicrosoft TeamsまたはGoogle Chat Pluginパッケージを参照してください。
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      inboundメッセージ処理はchannel固有です。各channel Pluginは独自のinboundパイプラインを持ちます。実際のパターンについては、同梱channel Plugin（たとえばMicrosoft TeamsまたはGoogle Chat Pluginパッケージ）を参照してください。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="テスト">
`src/channel.test.ts`に同居テストを書きます:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("設定からaccountを解決する", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("シークレットを実体化せずにaccountを検査する", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("不足している設定を報告する", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    共有テストヘルパーについては、[Testing](/ja-JP/plugins/sdk-testing)を参照してください。

  </Step>
</Steps>

## ファイル構造

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channelメタデータ
├── openclaw.plugin.json      # 設定スキーマを持つmanifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 公開エクスポート（任意）
├── runtime-api.ts            # 内部ランタイムエクスポート（任意）
└── src/
    ├── channel.ts            # createChatChannelPlugin経由のChannelPlugin
    ├── channel.test.ts       # テスト
    ├── client.ts             # プラットフォームAPIクライアント
    └── runtime.ts            # ランタイムストア（必要な場合）
```

## 高度なトピック

<CardGroup cols={2}>
  <Card title="スレッド化オプション" icon="git-branch" href="/ja-JP/plugins/sdk-entrypoints#registration-mode">
    固定、accountスコープ、またはカスタムの返信モード
  </Card>
  <Card title="message tool統合" icon="puzzle" href="/ja-JP/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageToolとactionディスカバリー
  </Card>
  <Card title="ターゲット解決" icon="crosshair" href="/ja-JP/plugins/architecture#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="ランタイムヘルパー" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    `api.runtime`経由のTTS、STT、media、subagent
  </Card>
</CardGroup>

<Note>
一部の同梱ヘルパーシームは、同梱pluginの保守と互換性のために引き続き存在します。これらは新しいchannel Plugin向けの推奨パターンではありません。その同梱pluginファミリーを直接保守しているのでない限り、共通SDKサーフェスの汎用channel/setup/reply/runtimeサブパスを優先してください。
</Note>

## 次のステップ

- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — あなたのpluginがモデルも提供する場合
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全なサブパスimportリファレンス
- [SDK Testing](/ja-JP/plugins/sdk-testing) — テストユーティリティと契約テスト
- [Plugin Manifest](/ja-JP/plugins/manifest) — 完全なmanifestスキーマ
