---
read_when:
    - 新しいメッセージングチャンネルPluginを作成する場合
    - OpenClawをメッセージングプラットフォームに接続したい場合
    - ChannelPlugin adapter surfaceを理解する必要がある場合
sidebarTitle: Channel Plugins
summary: OpenClaw向けメッセージングチャンネルPluginの作り方ステップバイステップガイド
title: チャンネルPluginの作成
x-i18n:
    generated_at: "2026-04-22T04:24:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: f08bf785cd2e16ed6ce0317f4fd55c9eccecf7476d84148ad47e7be516dd71fb
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# チャンネルPluginの作成

このガイドでは、OpenClawをメッセージングプラットフォームに接続するチャンネルPluginの作成手順を説明します。最後には、DMセキュリティ、ペアリング、返信スレッド化、送信メッセージングを備えた動作するチャンネルが完成します。

<Info>
  まだOpenClaw Pluginを一度も作成したことがない場合は、まず
  基本的なパッケージ構造とmanifest設定について
  [はじめに](/ja-JP/plugins/building-plugins) を読んでください。
</Info>

## チャンネルPluginの仕組み

チャンネルPluginは独自のsend/edit/reactツールを必要としません。OpenClawはcore内に1つの共有 `message` ツールを保持しています。Pluginが担当するのは次の部分です:

- **設定** — アカウント解決とセットアップウィザード
- **セキュリティ** — DMポリシーと許可リスト
- **ペアリング** — DM承認フロー
- **セッション文法** — プロバイダー固有の会話IDを、基本チャット、スレッドID、親フォールバックへどうマップするか
- **送信** — テキスト、メディア、投票をプラットフォームへ送ること
- **スレッド化** — 返信をどうスレッド化するか

coreは、共有messageツール、プロンプト配線、外側のセッションキー形状、汎用 `:thread:` 管理、およびdispatchを担当します。

チャンネルがメディアソースを運ぶmessage-toolパラメータを追加する場合は、それらのパラメータ名を `describeMessageTool(...).mediaSourceParams` を通じて公開してください。coreは、その明示的リストをsandboxパス正規化と送信メディアアクセスポリシーに使うため、Plugin側ではプロバイダー固有のavatar、attachment、cover-imageパラメータに対する共有coreの特別扱いは不要です。
アクションごとのマップ、たとえば
`{ "set-profile": ["avatarUrl", "avatarPath"] }`
のような形で返すことを推奨します。そうすれば、無関係なアクションが別のアクションのメディア引数を継承しません。意図的にすべての公開アクションで共有されるパラメータであれば、フラットな配列でも動作します。

プラットフォームが会話IDの中に追加スコープを格納する場合、その解析はPlugin内で `messaging.resolveSessionConversation(...)` に保持してください。これは、`rawId` を基本会話ID、任意のスレッドID、明示的な `baseConversationId`、および任意の `parentConversationCandidates` にマップするための正規フックです。
`parentConversationCandidates` を返す場合は、最も狭い親から最も広い/基本会話までの順に並べてください。

チャンネルレジストリが起動する前に同じ解析が必要なバンドル済みPluginは、一致する `resolveSessionConversation(...)` exportを持つトップレベルの `session-key-api.ts` ファイルも公開できます。coreは、ランタイムPluginレジストリがまだ利用できないときだけ、このブートストラップ安全なサーフェスを使います。

`messaging.resolveParentConversationCandidates(...)` は、Pluginが汎用/raw IDの上に親フォールバックだけ必要とする場合の、レガシー互換フォールバックとして引き続き利用できます。両方のフックが存在する場合、coreはまず `resolveSessionConversation(...).parentConversationCandidates` を使い、正規フックがそれらを省略した場合にのみ `resolveParentConversationCandidates(...)` へフォールバックします。

## 承認とチャンネルcapability

ほとんどのチャンネルPluginでは、承認専用コードは不要です。

- coreは、同一チャット内 `/approve`、共有承認ボタンペイロード、および汎用フォールバック配信を担当します。
- チャンネルが承認固有の動作を必要とする場合は、チャンネルPlugin上で1つの `approvalCapability` オブジェクトを優先してください。
- `ChannelPlugin.approvals` は削除されました。承認配信/ネイティブ/レンダー/authに関する情報は `approvalCapability` に置いてください。
- `plugin.auth` はlogin/logout専用です。coreはもはやそのオブジェクトから承認authフックを読み取りません。
- `approvalCapability.authorizeActorAction` と `approvalCapability.getActionAvailabilityState` が、正規の承認auth seamです。
- 同一チャット承認authの可用性には `approvalCapability.getActionAvailabilityState` を使ってください。
- チャンネルがネイティブexec承認を公開する場合、開始サーフェス/ネイティブクライアント状態が同一チャット承認authと異なるときは `approvalCapability.getExecInitiatingSurfaceState` を使ってください。coreはこのexec専用フックを使って `enabled` と `disabled` を区別し、開始チャンネルがネイティブexec承認をサポートしているかを判断し、ネイティブクライアントのフォールバックガイダンスにそのチャンネルを含めます。一般的なケースでは `createApproverRestrictedNativeApprovalCapability(...)` がこれを埋めます。
- 重複するローカル承認プロンプトの非表示や、配信前の入力中表示送信のような、チャンネル固有のペイロードライフサイクル動作には `outbound.shouldSuppressLocalPayloadPrompt` または `outbound.beforeDeliverPayload` を使ってください。
- `approvalCapability.delivery` は、ネイティブ承認ルーティングまたはフォールバック抑制にのみ使ってください。
- チャンネル所有のネイティブ承認情報には `approvalCapability.nativeRuntime` を使ってください。ホットなチャンネルentrypointでは、`createLazyChannelApprovalNativeRuntimeAdapter(...)` を使ってこれを遅延化してください。これにより、必要時にランタイムモジュールをimportしつつ、承認ライフサイクルは引き続きcoreが組み立てられます。
- `approvalCapability.render` は、チャンネルが共有レンダラーの代わりに本当に独自の承認ペイロードを必要とする場合にのみ使ってください。
- チャンネルが、ネイティブexec承認を有効化するために必要な正確な設定ノブを、disabled-path返信で説明したい場合は `approvalCapability.describeExecApprovalSetup` を使ってください。このフックは `{ channel, channelLabel, accountId }` を受け取ります。名前付きアカウントのチャンネルは、トップレベルデフォルトではなく `channels.<channel>.accounts.<id>.execApprovals.*` のようなアカウントスコープ付きパスを描画すべきです。
- チャンネルが既存設定から安定したowner相当のDM IDを推測できる場合、承認固有のcoreロジックを追加せずに同一チャット `/approve` を制限するために、`openclaw/plugin-sdk/approval-runtime` の `createResolvedApproverActionAuthAdapter` を使ってください。
- チャンネルがネイティブ承認配信を必要とする場合、チャンネルコードはターゲット正規化と転送/presentation情報に集中させてください。`openclaw/plugin-sdk/approval-runtime` の `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability` を使ってください。チャンネル固有の情報は `approvalCapability.nativeRuntime` の背後に置き、できれば `createChannelApprovalNativeRuntimeAdapter(...)` または `createLazyChannelApprovalNativeRuntimeAdapter(...)` 経由にしてください。そうすると、coreがハンドラーを組み立て、リクエストフィルタリング、ルーティング、重複排除、期限切れ、Gateway購読、別経路通知を担当できます。`nativeRuntime` は、いくつかの小さなseamに分割されています:
- `availability` — アカウントが設定済みか、およびリクエストを処理すべきか
- `presentation` — 共有承認view modelをpending/resolved/expiredネイティブペイロードまたは最終アクションへマップする
- `transport` — ターゲットを準備し、ネイティブ承認メッセージを送信/更新/削除する
- `interactions` — ネイティブbuttonまたはリアクション向けの任意のbind/unbind/clear-actionフック
- `observe` — 任意の配信診断フック
- チャンネルがclient、token、Bolt app、Webhook receiverのようなランタイム所有オブジェクトを必要とする場合は、`openclaw/plugin-sdk/channel-runtime-context` を通じて登録してください。汎用runtime-contextレジストリにより、coreはチャンネル起動状態からcapability駆動ハンドラーをブートストラップでき、承認固有のラッパー接着コードを追加せずに済みます。
- capability駆動seamではまだ表現力が足りない場合にのみ、低レベルの `createChannelApprovalHandler` または `createChannelNativeApprovalRuntime` を使用してください。
- ネイティブ承認チャンネルでは、これらのヘルパーを通じて `accountId` と `approvalKind` の両方をルーティングする必要があります。`accountId` は複数アカウントの承認ポリシーを正しいbotアカウントにスコープし、`approvalKind` はcore内のハードコード分岐なしに、exec対plugin承認の動作をチャンネル側で利用可能にします。
- coreは現在、承認の迂回通知も担当します。チャンネルPluginは、`createChannelNativeApprovalRuntime` から「承認はDM / 別チャンネルへ送られました」という独自フォローアップメッセージを送るべきではありません。代わりに、共有承認capabilityヘルパーを通じて正確なorigin + approver-DMルーティングを公開し、開始チャットへ通知を投稿する前に、実際の配信結果をcoreに集約させてください。
- 配信された承認ID種別はエンドツーエンドで保持してください。ネイティブクライアントは、チャンネルローカル状態からexec対plugin承認ルーティングを推測または書き換えるべきではありません。
- 異なる承認種別が、意図的に異なるネイティブサーフェスを公開する場合があります。
  現在のバンドル済み例:
  - Slackは、exec IDとplugin IDの両方でネイティブ承認ルーティングを利用可能に保ちます。
  - Matrixは、exec承認とplugin承認でauthを変えつつも、同じネイティブDM/チャンネルルーティングとreaction UXを維持します。
- `createApproverRestrictedNativeApprovalAdapter` は互換ラッパーとしてまだ存在しますが、新しいコードではcapability builderを優先し、Plugin上に `approvalCapability` を公開してください。

ホットなチャンネルentrypointでは、そのファミリーの一部だけが必要な場合は、より狭いruntime subpathを優先してください:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同様に、より広いumbrellaサーフェスが不要な場合は、
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`,
`openclaw/plugin-sdk/reply-chunking`
を優先してください。

セットアップについては特に次の通りです:

- `openclaw/plugin-sdk/setup-runtime` は、ランタイム安全なセットアップヘルパーをカバーします:
  import-safeなセットアップpatch adapter（`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`）、lookup-note出力、
  `promptResolvedAllowFrom`, `splitSetupEntries`、および委譲された
  setup-proxy builder
- `openclaw/plugin-sdk/setup-adapter-runtime` は、
  `createEnvPatchedAccountSetupAdapter` 向けの、狭いenv対応adapter seamです
- `openclaw/plugin-sdk/channel-setup` は、オプションインストールのセットアップbuilderと、いくつかのセットアップ安全な基本要素をカバーします:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

チャンネルがenv駆動のセットアップまたはauthをサポートし、一般的な起動/設定フローがランタイム読み込み前にそれらのenv名を知る必要がある場合は、Plugin manifestで `channelEnvVars` を宣言してください。チャンネルランタイムの `envVars` やローカル定数は、オペレーター向け説明文のためだけに保持してください。

チャンネルがPluginランタイム開始前に `status`, `channels list`, `channels status`, またはSecretRefスキャンに現れる可能性がある場合は、`package.json` に `openclaw.setupEntry` を追加してください。そのentrypointは、読み取り専用コマンドパスで安全にimportできる必要があり、チャンネルメタデータ、セットアップ安全なconfig adapter、status adapter、およびそれらのサマリーに必要なチャンネルsecret targetメタデータを返すべきです。setup entryからclient、listener、またはtransport runtimeを開始してはいけません。

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, および
`splitSetupEntries`

- `moveSingleAccountChannelSectionToDefaultAccount(...)`
  のような、より重い共有セットアップ/設定ヘルパーも必要な場合にのみ、
  より広い `openclaw/plugin-sdk/setup` seamを使ってください

チャンネルがセットアップサーフェスで「まずこのPluginをインストールしてください」と告知したいだけなら、`createOptionalChannelSetupSurface(...)` を優先してください。生成されるadapter/ウィザードは設定書き込みと最終化でfail closedし、検証、finalize、docs-link説明文で同じインストール必須メッセージを再利用します。

その他のホットなチャンネルパスでも、より広いレガシーサーフェスより狭いヘルパーを優先してください:

- 複数アカウント設定とデフォルトアカウントフォールバックには
  `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`,
  `openclaw/plugin-sdk/account-helpers`
- 受信route/envelopeおよびrecord-and-dispatch配線には
  `openclaw/plugin-sdk/inbound-envelope` と
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- ターゲット解析/照合には `openclaw/plugin-sdk/messaging-targets`
- メディア読み込みと送信ID/send delegateおよびペイロード計画には
  `openclaw/plugin-sdk/outbound-media` と
  `openclaw/plugin-sdk/outbound-runtime`
- 送信routeが明示的な `replyToId`/`threadId` を保持する必要がある場合、または基本セッションキーがまだ一致した後に現在の `:thread:` セッションを復元する必要がある場合は、`openclaw/plugin-sdk/channel-core` の `buildThreadAwareOutboundSessionRoute(...)`
  を使ってください。プロバイダーPluginは、プラットフォームにネイティブなスレッド配信意味論がある場合、優先順位、suffix動作、thread ID正規化を上書きできます。
- スレッドバインディングのライフサイクルとadapter登録には
  `openclaw/plugin-sdk/thread-bindings-runtime`
- レガシーなエージェント/メディアペイロードのフィールドレイアウトがまだ必要な場合にのみ
  `openclaw/plugin-sdk/agent-media-payload`
- Telegramのカスタムコマンド正規化、重複/競合検証、およびフォールバック安定なコマンド設定契約には
  `openclaw/plugin-sdk/telegram-command-config`

authのみのチャンネルは、通常デフォルトパスで十分です。coreが承認を処理し、Pluginは送信/auth capabilityを公開するだけです。Matrix、Slack、Telegram、カスタムチャット転送のようなネイティブ承認チャンネルは、独自の承認ライフサイクルを作るのではなく、共有ネイティブヘルパーを使うべきです。

## 受信メンションポリシー

受信メンション処理は、2つの層に分けたままにしてください:

- Plugin所有の証拠収集
- 共有ポリシー評価

メンションポリシー判定には `openclaw/plugin-sdk/channel-mention-gating` を使ってください。より広い受信ヘルパーbarrelが必要な場合にのみ `openclaw/plugin-sdk/channel-inbound` を使ってください。

Pluginローカルロジックに適しているもの:

- botへの返信検出
- bot引用の検出
- スレッド参加チェック
- サービス/システムメッセージ除外
- bot参加を証明するために必要なプラットフォームネイティブキャッシュ

共有ヘルパーに適しているもの:

- `requireMention`
- 明示的メンション結果
- 暗黙的メンション許可リスト
- コマンドバイパス
- 最終的なスキップ判定

推奨フロー:

1. ローカルのメンション情報を計算する。
2. その情報を `resolveInboundMentionDecision({ facts, policy })` に渡す。
3. 受信ゲートで `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, `decision.shouldSkip` を使う。

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

`api.runtime.channel.mentions` は、すでにランタイム注入に依存しているバンドル済みチャンネルPlugin向けに、同じ共有メンションヘルパーを公開します:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`implicitMentionKindWhen` と
`resolveInboundMentionDecision` だけが必要な場合は、
無関係な受信ランタイムヘルパーを読み込まないように
`openclaw/plugin-sdk/channel-mention-gating` からimportしてください。

古い `resolveMentionGating*` ヘルパーは、
互換exportとしてのみ `openclaw/plugin-sdk/channel-inbound` に残っています。新しいコードでは `resolveInboundMentionDecision({ facts, policy })` を使ってください。

## ウォークスルー

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="パッケージとmanifest">
    標準的なPluginファイルを作成します。`package.json` の `channel` フィールドが、これをチャンネルPluginにします。完全なパッケージメタデータサーフェスについては、
    [Plugin Setup and Config](/ja-JP/plugins/sdk-setup#openclaw-channel) を参照してください:

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

  <Step title="チャンネルPluginオブジェクトを作る">
    `ChannelPlugin` インターフェースには、多くの任意adapterサーフェスがあります。最小構成、つまり `id` と `setup` から始めて、必要に応じてadapterを追加してください。

    `src/channel.ts` を作成します:

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

    <Accordion title="createChatChannelPlugin がやってくれること">
      低レベルadapterインターフェースを手動実装する代わりに、
      宣言的オプションを渡すと、builderがそれらを合成します:

      | Option | 配線されるもの |
      | --- | --- |
      | `security.dm` | 設定フィールドからのスコープ付きDMセキュリティリゾルバー |
      | `pairing.text` | コード交換付きテキストベースDMペアリングフロー |
      | `threading` | reply-to-modeリゾルバー（固定、アカウントスコープ、またはカスタム） |
      | `outbound.attachedResults` | 結果メタデータ（メッセージID）を返すsend関数 |

      完全な制御が必要なら、宣言的オプションの代わりに生のadapterオブジェクトを渡すこともできます。
    </Accordion>

  </Step>

  <Step title="エントリーポイントを配線する">
    `index.ts` を作成します:

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

    チャンネル所有のCLI descriptorは `registerCliMetadata(...)` に置いてください。そうするとOpenClawは、完全なチャンネルランタイムを有効化せずにそれらをルートヘルプへ表示でき、通常の完全読み込みでも、実際のコマンド登録用に同じdescriptorを取り込めます。`registerFull(...)` はランタイム専用の作業のために残してください。
    `registerFull(...)` がGateway RPCメソッドを登録する場合は、
    Plugin固有のprefixを使ってください。Core管理namespaces（`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`）は予約済みで、常に
    `operator.admin` に解決されます。
    `defineChannelPluginEntry` は登録モード分岐を自動処理します。すべての
    オプションについては [Entry Points](/ja-JP/plugins/sdk-entrypoints#definechannelpluginentry) を参照してください。

  </Step>

  <Step title="setup entryを追加する">
    オンボーディング中の軽量読み込み用に `setup-entry.ts` を作成します:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClawは、チャンネルが無効または未設定のとき、完全entryの代わりにこれを読み込みます。これにより、セットアップフロー中に重いランタイムコードを引き込まずに済みます。詳細は [Setup and Config](/ja-JP/plugins/sdk-setup#setup-entry) を参照してください。

    セットアップ安全なexportをsidecarモジュールへ分離するバンドル済みworkspaceチャンネルでは、
    明示的なセットアップ時ランタイムsetterも必要な場合、
    `openclaw/plugin-sdk/channel-entry-contract` の
    `defineBundledChannelSetupEntry(...)` を使えます。

  </Step>

  <Step title="受信メッセージを処理する">
    Pluginはプラットフォームからメッセージを受信し、それをOpenClawへ転送する必要があります。典型的なパターンは、リクエストを検証し、それをチャンネルの受信ハンドラー経由でdispatchするWebhookです:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin管理のauth（署名検証は自分で行う）
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // あなたの受信ハンドラーがメッセージをOpenClawへdispatchします。
          // 正確な配線はプラットフォームSDKに依存します —
          // 実例は、バンドル済みのMicrosoft TeamsまたはGoogle Chat Pluginパッケージを参照してください。
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      受信メッセージ処理はチャンネル固有です。各チャンネルPluginが
      自身の受信パイプラインを所有します。実際のパターンについては、
      バンドル済みチャンネルPlugin
      （たとえばMicrosoft TeamsまたはGoogle Chat Pluginパッケージ）を参照してください。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="テスト">
`src/channel.test.ts` に同居テストを書きます:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("設定からアカウントを解決する", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("シークレットを実体化せずにアカウントを検査する", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("設定不足を報告する", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    共有テストヘルパーについては、[Testing](/ja-JP/plugins/sdk-testing) を参照してください。

  </Step>
</Steps>

## ファイル構成

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # 設定スキーマ付きManifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 公開export（任意）
├── runtime-api.ts            # 内部ランタイムexport（任意）
└── src/
    ├── channel.ts            # createChatChannelPlugin経由のChannelPlugin
    ├── channel.test.ts       # テスト
    ├── client.ts             # プラットフォームAPIクライアント
    └── runtime.ts            # ランタイムストア（必要な場合）
```

## 高度なトピック

<CardGroup cols={2}>
  <Card title="スレッド化オプション" icon="git-branch" href="/ja-JP/plugins/sdk-entrypoints#registration-mode">
    固定、アカウントスコープ、またはカスタムの返信モード
  </Card>
  <Card title="メッセージツール統合" icon="puzzle" href="/ja-JP/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool とアクション検出
  </Card>
  <Card title="ターゲット解決" icon="crosshair" href="/ja-JP/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="ランタイムヘルパー" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    api.runtime経由のTTS、STT、メディア、サブエージェント
  </Card>
</CardGroup>

<Note>
一部のバンドル済みヘルパーseamは、バンドル済みPluginの保守と
互換性のためにまだ存在します。これらは新しいチャンネルPlugin向けの
推奨パターンではありません。直接そのバンドル済みPluginファミリーを
保守しているのでない限り、共通SDKサーフェスの汎用
channel/setup/reply/runtime subpathを優先してください。
</Note>

## 次のステップ

- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — Pluginがモデルも提供する場合
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全なsubpath importリファレンス
- [SDK Testing](/ja-JP/plugins/sdk-testing) — テストユーティリティと契約テスト
- [Plugin Manifest](/ja-JP/plugins/manifest) — 完全なmanifestスキーマ
