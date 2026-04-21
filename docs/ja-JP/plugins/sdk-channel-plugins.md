---
read_when:
    - 新しいメッセージングチャネルPluginを構築しています
    - OpenClawをメッセージングプラットフォームに接続したいと考えています
    - ChannelPluginアダプターのインターフェースを理解する必要があります
sidebarTitle: Channel Plugins
summary: OpenClaw向けメッセージングチャネルPluginを構築するためのステップバイステップガイド
title: チャネルPluginの構築
x-i18n:
    generated_at: "2026-04-21T19:20:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35cae55c13b69f2219bd2f9bd3ee2f7d8c4075bd87f0be11c35a0fddb070fe1e
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# チャネルPluginの構築

このガイドでは、OpenClawをメッセージングプラットフォームに接続するチャネルpluginの構築手順を説明します。完了する頃には、DMセキュリティ、ペアリング、返信スレッド化、送信メッセージングを備えた動作するチャネルが完成しています。

<Info>
  まだOpenClaw pluginを一度も作成したことがない場合は、基本的なパッケージ構造とマニフェスト設定について先に
  [はじめに](/ja-JP/plugins/building-plugins)
  を読んでください。
</Info>

## チャネルpluginの仕組み

チャネルpluginには、独自の送信・編集・リアクション用ツールは必要ありません。OpenClawは、コア内で共有の `message` ツールを1つ維持します。pluginが担うのは次の要素です。

- **設定** — アカウント解決とセットアップウィザード
- **セキュリティ** — DMポリシーと許可リスト
- **ペアリング** — DM承認フロー
- **セッショングラマー** — プロバイダー固有の会話IDを、ベースチャット、スレッドID、親フォールバックへどのようにマッピングするか
- **送信** — テキスト、メディア、投票をプラットフォームへ送信する処理
- **スレッド化** — 返信をどのようにスレッド化するか

コアは、共有メッセージツール、プロンプト配線、外側のセッションキー形状、汎用的な `:thread:` の管理、およびディスパッチを担います。

チャネルが、メディアソースを運ぶメッセージツールのパラメータを追加する場合は、それらのパラメータ名を `describeMessageTool(...).mediaSourceParams` を通じて公開してください。コアは、その明示的な一覧をサンドボックスのパス正規化および送信メディアアクセスポリシーに使用するため、plugin側でプロバイダー固有のアバター、添付ファイル、またはカバー画像パラメータのために共有コアの特別扱いを追加する必要はありません。
`{ "set-profile": ["avatarUrl", "avatarPath"] }` のようなアクションキー付きマップを返すことを推奨します。これにより、無関係なアクションが別のアクションのメディア引数を継承しません。意図的に公開されるすべてのアクション間で共有されるパラメータについては、フラットな配列でも機能します。

プラットフォームが会話ID内に追加のスコープを保存する場合は、その解析をplugin内の `messaging.resolveSessionConversation(...)` に保持してください。これは、`rawId` をベース会話ID、任意のスレッドID、明示的な `baseConversationId`、および任意の `parentConversationCandidates` にマッピングするための正規フックです。
`parentConversationCandidates` を返す場合は、最も狭い親から最も広い親／ベース会話の順に並べてください。

チャネルレジストリの起動前に同じ解析が必要な同梱pluginは、一致する `resolveSessionConversation(...)` エクスポートを持つトップレベルの `session-key-api.ts` ファイルを公開することもできます。コアは、このブートストラップ安全なインターフェースを、ランタイムpluginレジストリがまだ利用できない場合にのみ使用します。

`messaging.resolveParentConversationCandidates(...)` は、pluginが汎用／生のIDの上に親フォールバックだけを必要とする場合の、レガシー互換フォールバックとして引き続き利用できます。両方のフックが存在する場合、コアはまず `resolveSessionConversation(...).parentConversationCandidates` を使い、その正規フックがそれらを省略した場合にのみ `resolveParentConversationCandidates(...)` にフォールバックします。

## 承認とチャネル機能

ほとんどのチャネルpluginでは、承認専用のコードは必要ありません。

- コアは、同一チャット内の `/approve`、共有承認ボタンペイロード、および汎用フォールバック配信を担います。
- チャネルが承認固有の動作を必要とする場合は、チャネルplugin上に1つの `approvalCapability` オブジェクトを置くことを推奨します。
- `ChannelPlugin.approvals` は削除されました。承認配信、ネイティブ、レンダリング、認可に関する情報は `approvalCapability` に置いてください。
- `plugin.auth` はログイン／ログアウト専用です。コアは、そのオブジェクトから承認認可フックをもう読み取りません。
- `approvalCapability.authorizeActorAction` と `approvalCapability.getActionAvailabilityState` が、正規の承認認可インターフェースです。
- 同一チャット承認の認可可用性には `approvalCapability.getActionAvailabilityState` を使用してください。
- チャネルがネイティブexec承認を公開する場合は、開始サーフェス／ネイティブクライアント状態が同一チャット承認認可と異なるときに `approvalCapability.getExecInitiatingSurfaceState` を使用してください。コアはこのexec専用フックを使って `enabled` と `disabled` を区別し、開始チャネルがネイティブexec承認をサポートしているか判断し、ネイティブクライアントのフォールバック案内にそのチャネルを含めます。`createApproverRestrictedNativeApprovalCapability(...)` は一般的なケースでこれを補います。
- 重複するローカル承認プロンプトの非表示や、配信前の入力中インジケーター送信など、チャネル固有のペイロードライフサイクル動作には `outbound.shouldSuppressLocalPayloadPrompt` または `outbound.beforeDeliverPayload` を使用してください。
- `approvalCapability.delivery` は、ネイティブ承認ルーティングまたはフォールバック抑止にのみ使用してください。
- チャネル所有のネイティブ承認情報には `approvalCapability.nativeRuntime` を使用してください。ホットなチャネルエントリーポイントでは、`createLazyChannelApprovalNativeRuntimeAdapter(...)` を使ってこれを遅延化してください。これにより、コアが承認ライフサイクルを組み立てられる状態を維持しつつ、必要時にランタイムモジュールをインポートできます。
- チャネルが共有レンダラーではなく、本当にカスタム承認ペイロードを必要とする場合にのみ `approvalCapability.render` を使用してください。
- チャネルが、無効化パスの返信でネイティブexec承認を有効化するために必要な正確な設定項目を説明したい場合は、`approvalCapability.describeExecApprovalSetup` を使用してください。このフックは `{ channel, channelLabel, accountId }` を受け取ります。名前付きアカウントチャネルでは、トップレベルのデフォルトではなく `channels.<channel>.accounts.<id>.execApprovals.*` のようなアカウントスコープ付きパスを表示する必要があります。
- 既存設定から安定したオーナー類似DMアイデンティティを推測できるチャネルでは、承認専用のコアロジックを追加せずに同一チャット `/approve` を制限するために、`openclaw/plugin-sdk/approval-runtime` の `createResolvedApproverActionAuthAdapter` を使用してください。
- チャネルがネイティブ承認配信を必要とする場合、チャネルコードはターゲット正規化と転送／表示情報に集中させてください。`openclaw/plugin-sdk/approval-runtime` の `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver`、および `createApproverRestrictedNativeApprovalCapability` を使用してください。チャネル固有の情報は `approvalCapability.nativeRuntime` の背後に置き、理想的には `createChannelApprovalNativeRuntimeAdapter(...)` または `createLazyChannelApprovalNativeRuntimeAdapter(...)` を通してください。これによりコアがハンドラーを組み立て、リクエストフィルタリング、ルーティング、重複排除、有効期限、Gateway購読、および「別の場所へルーティングされた」通知を担えます。`nativeRuntime` はいくつかの小さなインターフェースに分割されています。
- `availability` — アカウントが設定済みか、およびリクエストを処理すべきか
- `presentation` — 共有承認ビューモデルを、保留中／解決済み／期限切れのネイティブペイロードまたは最終アクションへマッピングする
- `transport` — ターゲットを準備し、ネイティブ承認メッセージを送信／更新／削除する
- `interactions` — ネイティブボタンやリアクションのための任意のバインド／アンバインド／アクションクリアフック
- `observe` — 任意の配信診断フック
- チャネルがクライアント、トークン、Boltアプリ、またはWebhookレシーバーのようなランタイム所有オブジェクトを必要とする場合は、`openclaw/plugin-sdk/channel-runtime-context` を通じて登録してください。汎用ランタイムコンテキストレジストリにより、コアは承認専用のラッパー接着コードを追加せずに、チャネル起動状態から機能駆動ハンドラーをブートストラップできます。
- より低レベルの `createChannelApprovalHandler` または `createChannelNativeApprovalRuntime` を使うのは、機能駆動インターフェースでまだ十分に表現できない場合だけにしてください。
- ネイティブ承認チャネルでは、これらのヘルパーを通じて `accountId` と `approvalKind` の両方をルーティングする必要があります。`accountId` は複数アカウントの承認ポリシーを正しいボットアカウントにスコープし、`approvalKind` はコア内のハードコード分岐なしで、execとplugin承認の動作をチャネルで利用可能に保ちます。
- コアは現在、承認の再ルーティング通知も担います。チャネルpluginは、`createChannelNativeApprovalRuntime` から「承認はDM／別のチャネルに送られました」という独自のフォローアップメッセージを送信すべきではありません。代わりに、共有承認機能ヘルパーを通じて正確な送信元 + 承認者DMルーティングを公開し、開始チャットへ通知を返す前に、コアが実際の配信を集約できるようにしてください。
- 配信された承認ID種別をエンドツーエンドで保持してください。ネイティブクライアントは、チャネルローカル状態からexecとplugin承認のルーティングを推測したり書き換えたりしてはいけません。
- 異なる承認種別が、意図的に異なるネイティブサーフェスを公開することがあります。
  現在の同梱例:
  - Slack は、exec IDとplugin IDの両方に対してネイティブ承認ルーティングを利用可能に保ちます。
  - Matrix は、execとplugin承認の両方で同じネイティブDM／チャネルルーティングとリアクションUXを維持しつつ、承認種別ごとに認可を分けられるようにしています。
- `createApproverRestrictedNativeApprovalAdapter` は互換ラッパーとして引き続き存在しますが、新しいコードでは機能ビルダーを優先し、plugin上で `approvalCapability` を公開してください。

ホットなチャネルエントリーポイントでは、このファミリーの一部だけが必要な場合、より狭いランタイムサブパスを優先してください。

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同様に、より広い包括インターフェースが不要な場合は、
`openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-adapter-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference`、
`openclaw/plugin-sdk/reply-chunking`
を優先してください。

セットアップに関しては特に次のとおりです。

- `openclaw/plugin-sdk/setup-runtime` は、ランタイム安全なセットアップヘルパーを扱います:
  import-safeなセットアップパッチアダプター（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、lookup-note出力、
  `promptResolvedAllowFrom`、`splitSetupEntries`、および委譲セットアッププロキシビルダー
- `openclaw/plugin-sdk/setup-adapter-runtime` は、`createEnvPatchedAccountSetupAdapter` のための、より狭いenv対応アダプターインターフェースです
- `openclaw/plugin-sdk/channel-setup` は、任意インストール用セットアップビルダーと、いくつかのセットアップ安全な基本要素を扱います:
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

チャネルがenv駆動のセットアップまたは認証をサポートし、汎用の起動／設定フローがランタイム読み込み前にそれらのenv名を知る必要がある場合は、pluginマニフェストで `channelEnvVars` として宣言してください。チャネルランタイムの `envVars` やローカル定数は、運用者向けコピー専用にしてください。

チャネルが、pluginランタイムの開始前に `status`、`channels list`、`channels status`、またはSecretRefスキャンに現れる可能性がある場合は、`package.json` に `openclaw.setupEntry` を追加してください。そのエントリーポイントは、読み取り専用コマンドパスで安全にimportできる必要があり、それらの要約に必要なチャネルメタデータ、セットアップ安全な設定アダプター、ステータスアダプター、およびチャネルシークレットターゲットメタデータを返す必要があります。セットアップエントリーからクライアント、リスナー、または転送ランタイムを起動してはいけません。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、および
`splitSetupEntries`

- より重い共有セットアップ／設定ヘルパー、たとえば
  `moveSingleAccountChannelSectionToDefaultAccount(...)`
  も必要な場合にのみ、より広い `openclaw/plugin-sdk/setup` インターフェースを使用してください

チャネルがセットアップ画面で「まずこのpluginをインストールしてください」と案内したいだけであれば、`createOptionalChannelSetupSurface(...)` を優先してください。生成されるアダプター／ウィザードは設定書き込みと最終確定で安全側に失敗し、検証、最終確定、ドキュメントリンク文言で同じ「インストールが必要」メッセージを再利用します。

その他のホットなチャネルパスでも、より広いレガシーインターフェースより、狭いヘルパーを優先してください:

- 複数アカウント設定とデフォルトアカウントフォールバックには
  `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution`、
  `openclaw/plugin-sdk/account-helpers`
- 受信ルート／エンベロープおよび記録・ディスパッチ配線には
  `openclaw/plugin-sdk/inbound-envelope` と
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- ターゲット解析／一致判定には `openclaw/plugin-sdk/messaging-targets`
- メディア読み込みと送信アイデンティティ／送信デリゲートおよびペイロード計画には
  `openclaw/plugin-sdk/outbound-media` と
  `openclaw/plugin-sdk/outbound-runtime`
- スレッドバインディングのライフサイクルとアダプター登録には
  `openclaw/plugin-sdk/thread-bindings-runtime`
- レガシーなエージェント／メディアペイロードのフィールドレイアウトが依然として必要な場合にのみ
  `openclaw/plugin-sdk/agent-media-payload`
- Telegramカスタムコマンドの正規化、重複／競合検証、およびフォールバック時にも安定したコマンド設定契約には
  `openclaw/plugin-sdk/telegram-command-config`

認証のみのチャネルは通常、デフォルトパスで十分です。コアが承認を処理し、pluginは送信／認証機能を公開するだけです。Matrix、Slack、Telegram、およびカスタムチャット転送のようなネイティブ承認チャネルは、独自に承認ライフサイクルを実装するのではなく、共有ネイティブヘルパーを使用してください。

## 受信メンションポリシー

受信メンション処理は、次の2層に分けて維持してください。

- pluginが担う証拠収集
- 共有ポリシー評価

メンションポリシーの判定には `openclaw/plugin-sdk/channel-mention-gating` を使用してください。
より広い受信ヘルパーバレルが必要な場合にのみ
`openclaw/plugin-sdk/channel-inbound` を使用してください。

pluginローカルロジックに適しているもの:

- botへの返信の検出
- botを引用したメッセージの検出
- スレッド参加の確認
- サービス／システムメッセージの除外
- bot参加を証明するために必要なプラットフォームネイティブキャッシュ

共有ヘルパーに適しているもの:

- `requireMention`
- 明示的メンション結果
- 暗黙的メンション許可リスト
- コマンドバイパス
- 最終的なスキップ判定

推奨フロー:

1. ローカルのメンション情報を計算します。
2. その情報を `resolveInboundMentionDecision({ facts, policy })` に渡します。
3. 受信ゲートでは `decision.effectiveWasMentioned`、`decision.shouldBypassMention`、`decision.shouldSkip` を使用します。

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

`api.runtime.channel.mentions` は、すでにランタイム注入に依存している同梱チャネルplugin向けに、同じ共有メンションヘルパーを公開します。

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`implicitMentionKindWhen` と
`resolveInboundMentionDecision` だけが必要な場合は、
無関係な受信ランタイムヘルパーの読み込みを避けるため、
`openclaw/plugin-sdk/channel-mention-gating` からimportしてください。

古い `resolveMentionGating*` ヘルパーは、
互換エクスポートとしてのみ
`openclaw/plugin-sdk/channel-inbound` に残されています。新しいコードでは
`resolveInboundMentionDecision({ facts, policy })` を使用してください。

## ウォークスルー

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="パッケージとマニフェスト">
    標準的なpluginファイルを作成します。`package.json` の `channel` フィールドが、
    これをチャネルpluginとして成立させます。完全なパッケージメタデータのインターフェースについては、
    [Plugin Setup and Config](/ja-JP/plugins/sdk-setup#openclaw-channel)
    を参照してください。

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

  <Step title="チャネルpluginオブジェクトを構築する">
    `ChannelPlugin` インターフェースには、多数の任意アダプターインターフェースがあります。まず
    最小構成である `id` と `setup` から始め、必要に応じてアダプターを追加してください。

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

    <Accordion title="createChatChannelPluginが行うこと">
      低レベルのアダプターインターフェースを手作業で実装する代わりに、
      宣言的なオプションを渡すと、ビルダーがそれらを組み合わせます。

      | オプション | 配線される内容 |
      | --- | --- |
      | `security.dm` | 設定フィールドからのスコープ付きDMセキュリティリゾルバー |
      | `pairing.text` | コード交換を伴うテキストベースのDMペアリングフロー |
      | `threading` | reply-toモードリゾルバー（固定、アカウントスコープ、またはカスタム） |
      | `outbound.attachedResults` | 結果メタデータ（メッセージID）を返す送信関数 |

      完全に制御する必要がある場合は、宣言的オプションの代わりに
      生のアダプターオブジェクトを渡すこともできます。
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

    チャネルが所有するCLIディスクリプターは `registerCliMetadata(...)` に置いてください。これにより、OpenClawは
    完全なチャネルランタイムを有効化せずにルートヘルプでそれらを表示でき、
    通常の完全ロードでは実際のコマンド登録のために同じディスクリプターが引き続き使われます。
    `registerFull(...)` はランタイム専用の処理に使用してください。
    `registerFull(...)` がGateway RPCメソッドを登録する場合は、
    plugin固有のプレフィックスを使用してください。コア管理名前空間（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）は引き続き予約されており、常に
    `operator.admin` に解決されます。
    `defineChannelPluginEntry` は登録モードの分岐を自動的に処理します。すべての
    オプションについては
    [Entry Points](/ja-JP/plugins/sdk-entrypoints#definechannelpluginentry)
    を参照してください。

  </Step>

  <Step title="セットアップエントリーを追加する">
    オンボーディング中の軽量ロードのために `setup-entry.ts` を作成します:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClawは、チャネルが無効または未設定の場合、完全なエントリーの代わりにこれを読み込みます。
    これにより、セットアップフロー中に重いランタイムコードを引き込まずに済みます。
    詳細は [Setup and Config](/ja-JP/plugins/sdk-setup#setup-entry) を参照してください。

    セットアップ安全なエクスポートをサイドカーモジュールに分割する同梱ワークスペースチャネルでは、
    明示的なセットアップ時ランタイムセッターも必要な場合に
    `openclaw/plugin-sdk/channel-entry-contract` の
    `defineBundledChannelSetupEntry(...)`
    を使用できます。

  </Step>

  <Step title="受信メッセージを処理する">
    pluginは、プラットフォームからメッセージを受信し、それを
    OpenClawへ転送する必要があります。典型的なパターンは、リクエストを検証し、
    チャネルの受信ハンドラーを通じてディスパッチするWebhookです:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin管理の認証（署名検証は自分で行います）
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // 受信ハンドラーがメッセージをOpenClawにディスパッチします。
          // 正確な配線はプラットフォームSDKによって異なります —
          // 実例は同梱のMicrosoft TeamsまたはGoogle Chat pluginパッケージを参照してください。
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      受信メッセージ処理はチャネル固有です。各チャネルpluginが
      独自の受信パイプラインを担います。実際のパターンについては、
      同梱チャネルplugin
      （たとえばMicrosoft TeamsまたはGoogle Chat pluginパッケージ）
      を確認してください。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="テスト">
`src/channel.test.ts` にコロケートされたテストを書きます:

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

    共有テストヘルパーについては、[Testing](/ja-JP/plugins/sdk-testing) を参照してください。

  </Step>
</Steps>

## ファイル構成

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # 設定スキーマを含むマニフェスト
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 公開エクスポート（任意）
├── runtime-api.ts            # 内部ランタイムエクスポート（任意）
└── src/
    ├── channel.ts            # createChatChannelPluginによるChannelPlugin
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
    describeMessageToolとアクションディスカバリー
  </Card>
  <Card title="ターゲット解決" icon="crosshair" href="/ja-JP/plugins/architecture#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="ランタイムヘルパー" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    api.runtime経由のTTS、STT、メディア、subagent
  </Card>
</CardGroup>

<Note>
一部の同梱ヘルパーインターフェースは、同梱pluginの保守と
互換性のために引き続き存在します。これらは新しいチャネルpluginに推奨される
パターンではありません。bundled pluginファミリーを直接保守しているのでなければ、
共通SDKインターフェースの汎用的なチャネル／セットアップ／返信／ランタイムの
サブパスを優先してください。
</Note>

## 次のステップ

- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — pluginがモデルも提供する場合
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全なサブパスimportリファレンス
- [SDK Testing](/ja-JP/plugins/sdk-testing) — テストユーティリティと契約テスト
- [Plugin Manifest](/ja-JP/plugins/manifest) — 完全なマニフェストスキーマ
