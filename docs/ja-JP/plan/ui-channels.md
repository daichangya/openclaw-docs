---
read_when:
    - チャンネルメッセージUI、インタラクティブペイロード、またはネイティブチャンネルレンダラーのリファクタリング
    - メッセージツール機能、配信ヒント、またはコンテキスト横断マーカーの変更
    - Discord CarbonインポートのファンアウトやチャンネルPluginランタイムの遅延読み込みのデバッグ
summary: 意味的なメッセージ表現をチャンネル固有のUIレンダラーから切り離す。
title: チャンネル表示リファクタリング計画
x-i18n:
    generated_at: "2026-04-22T04:24:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed3c49f3cc55151992315599a05451fe499f2983d53d69dc58784e846f9f32ad
    source_path: plan/ui-channels.md
    workflow: 15
---

# チャンネル表示リファクタリング計画

## ステータス

共有エージェント、CLI、Plugin capability、送信配信サーフェス向けに実装済み:

- `ReplyPayload.presentation` が意味的なメッセージUIを保持します。
- `ReplyPayload.delivery.pin` が送信メッセージのピン留め要求を保持します。
- 共有メッセージアクションは、プロバイダー固有の `components`, `blocks`, `buttons`, `card` ではなく、`presentation`, `delivery`, `pin` を公開します。
- Coreは、Pluginが宣言した送信capabilityを通じてpresentationをレンダリングするか、自動で段階的劣化させます。
- Discord、Slack、Telegram、Mattermost、MS Teams、Feishuのレンダラーは汎用契約を消費します。
- Discordチャンネルのcontrol-planeコードは、CarbonベースのUIコンテナをもはやimportしません。

正規ドキュメントは現在 [Message Presentation](/ja-JP/plugins/message-presentation) にあります。
この計画は履歴的な実装コンテキストとして残してください。契約、レンダラー、またはフォールバック動作が変わる場合は、正規ガイドを更新してください。

## 問題

チャンネルUIは現在、互換性のない複数のサーフェスに分かれています:

- Coreは `buildCrossContextComponents` を通じてDiscord形状のクロスコンテキストレンダラーフックを所有しています。
- Discordの `channel.ts` は `DiscordUiContainer` を通じてネイティブCarbon UIをimportできるため、ランタイムUI依存関係をチャンネルPluginのcontrol planeに引き込みます。
- エージェントとCLIは、Discordの `components`、Slackの `blocks`、TelegramまたはMattermostの `buttons`、TeamsまたはFeishuの `card` のようなネイティブペイロードのエスケープハッチを公開しています。
- `ReplyPayload.channelData` は、転送ヒントとネイティブUIエンベロープの両方を保持しています。
- 汎用の `interactive` モデルは存在しますが、Discord、Slack、Teams、Feishu、LINE、Telegram、Mattermostですでに使われているより豊かなレイアウトより狭いです。

これにより、CoreがネイティブUI形状を認識することになり、Pluginランタイムの遅延読み込みが弱まり、エージェントに同じメッセージ意図を表現するためのプロバイダー固有の方法を与えすぎています。

## 目標

- Coreが、宣言されたcapabilityからメッセージに最適な意味的presentationを決定する。
- Extensionsがcapabilityを宣言し、意味的presentationをネイティブ転送ペイロードへレンダリングする。
- Web Control UIは、チャットのネイティブUIとは分離されたままにする。
- ネイティブチャンネルペイロードを共有エージェントやCLIのメッセージサーフェス経由で公開しない。
- 未対応のpresentation機能は、自動で最適なテキスト表現へ段階的劣化する。
- 送信済みメッセージのピン留めのような配信動作は、presentationではなく汎用のdeliveryメタデータにする。

## 非目標

- `buildCrossContextComponents` の後方互換shimは作らない。
- `components`, `blocks`, `buttons`, `card` の公開ネイティブエスケープハッチは作らない。
- チャンネルネイティブUIライブラリをCoreからimportしない。
- バンドル済みチャンネル向けのプロバイダー固有SDK seamは作らない。

## ターゲットモデル

Core所有の `presentation` フィールドを `ReplyPayload` に追加します。

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};
```

移行中、`interactive` は `presentation` のサブセットになります:

- `interactive` のtext blockは `presentation.blocks[].type = "text"` にマップされます。
- `interactive` のbuttons blockは `presentation.blocks[].type = "buttons"` にマップされます。
- `interactive` のselect blockは `presentation.blocks[].type = "select"` にマップされます。

外部エージェントとCLIのスキーマは現在 `presentation` を使用します。`interactive` は、既存の返信生成元向けの内部レガシーパーサー/レンダリングヘルパーとして残ります。

## Deliveryメタデータ

UIではない送信動作のために、Core所有の `delivery` フィールドを追加します。

```ts
type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

意味論:

- `delivery.pin = true` は、最初に正常配信されたメッセージをピン留めすることを意味します。
- `notify` のデフォルトは `false` です。
- `required` のデフォルトは `false` です。未対応チャンネルやピン留め失敗時は、配信を継続することで自動的に段階的劣化します。
- 手動の `pin`, `unpin`, `list-pins` メッセージアクションは、既存メッセージ向けに維持されます。

現在のTelegram ACPトピックバインディングは、`channelData.telegram.pin = true` から `delivery.pin = true` へ移すべきです。

## ランタイムcapability契約

presentationおよびdeliveryのレンダーフックを、control-planeチャンネルPluginではなく、ランタイム送信adapterに追加します。

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

Coreの動作:

- 対象チャンネルとランタイムadapterを解決する。
- presentation capabilityを問い合わせる。
- 未対応ブロックをレンダリング前に段階的劣化させる。
- `renderPresentation` を呼び出す。
- レンダラーが存在しない場合は、presentationをテキストフォールバックへ変換する。
- 送信成功後、`delivery.pin` が要求されていて対応している場合は `pinDeliveredMessage` を呼び出す。

## チャンネルマッピング

Discord:

- `presentation` をcomponents v2およびCarbonコンテナへ、ランタイム専用モジュール内でレンダリングする。
- アクセントカラーのヘルパーは軽量モジュールに残す。
- チャンネルPluginのcontrol-planeコードから `DiscordUiContainer` のimportを削除する。

Slack:

- `presentation` をBlock Kitへレンダリングする。
- エージェントとCLIの `blocks` 入力を削除する。

Telegram:

- text、context、dividerをテキストとしてレンダリングする。
- actionsとselectは、設定されていて対象サーフェスで許可されている場合、inline keyboardとしてレンダリングする。
- inline buttonが無効な場合はテキストフォールバックを使う。
- ACPトピックのピン留めを `delivery.pin` へ移す。

Mattermost:

- actionsを、設定されている場合にインタラクティブbuttonとしてレンダリングする。
- その他のブロックはテキストフォールバックとしてレンダリングする。

MS Teams:

- `presentation` をAdaptive Cardsへレンダリングする。
- 手動のpin/unpin/list-pinsアクションを維持する。
- 対象会話に対してGraphサポートが信頼できる場合は、必要に応じて `pinDeliveredMessage` を実装する。

Feishu:

- `presentation` をinteractive cardへレンダリングする。
- 手動のpin/unpin/list-pinsアクションを維持する。
- API動作が信頼できる場合は、送信メッセージのピン留め用に必要に応じて `pinDeliveredMessage` を実装する。

LINE:

- `presentation` を可能な限りFlexまたはtemplate messageへレンダリングする。
- 未対応ブロックはテキストへフォールバックする。
- LINE UIペイロードを `channelData` から削除する。

プレーンまたは制限のあるチャンネル:

- 保守的な書式でpresentationをテキストへ変換する。

## リファクタリング手順

1. `ui-colors.ts` をCarbonベースUIから分離し、`extensions/discord/src/channel.ts` から `DiscordUiContainer` を削除するDiscordリリース修正を再適用する。
2. `presentation` と `delivery` を `ReplyPayload`、送信ペイロード正規化、delivery summary、hookペイロードへ追加する。
3. `MessagePresentation` スキーマとパーサーヘルパーを、狭いSDK/ランタイムsubpathに追加する。
4. メッセージcapabilityの `buttons`, `cards`, `components`, `blocks` を、意味的presentation capabilityに置き換える。
5. presentationレンダーとdelivery pinning用のランタイム送信adapterフックを追加する。
6. クロスコンテキストcomponent構築を `buildCrossContextPresentation` に置き換える。
7. `src/infra/outbound/channel-adapters.ts` を削除し、チャンネルPlugin型から `buildCrossContextComponents` を削除する。
8. `maybeApplyCrossContextMarker` を変更し、ネイティブパラメータではなく `presentation` を付与するようにする。
9. Plugin-dispatch送信パスを更新し、意味的presentationとdeliveryメタデータだけを消費するようにする。
10. エージェントとCLIのネイティブペイロードパラメータ `components`, `blocks`, `buttons`, `card` を削除する。
11. ネイティブのメッセージツールスキーマを作るSDKヘルパーを削除し、presentationスキーマヘルパーに置き換える。
12. `channelData` からUI/ネイティブエンベロープを削除する。各残存フィールドをレビューするまでは、転送メタデータのみ残す。
13. Discord、Slack、Telegram、Mattermost、MS Teams、Feishu、LINEのレンダラーを移行する。
14. メッセージCLI、チャンネルページ、Plugin SDK、capability cookbookのドキュメントを更新する。
15. Discordおよび影響を受けるチャンネルentrypointのimport fanout profilingを実行する。

手順1-11および13-14は、このリファクタで共有エージェント、CLI、Plugin capability、送信adapter契約向けに実装済みです。手順12は、プロバイダーprivateな `channelData` 転送エンベロープに対する、より深い内部クリーンアップの段階として残っています。手順15は、型/テストゲートを超えて定量的なimport-fanout数値が必要であれば、後続の検証として残っています。

## テスト

追加または更新するもの:

- Presentation正規化テスト。
- 未対応ブロックに対するpresentation自動劣化テスト。
- Plugin dispatchおよびCore delivery path向けのクロスコンテキストマーカーテスト。
- Discord、Slack、Telegram、Mattermost、MS Teams、Feishu、LINE、およびテキストフォールバック向けのチャンネルレンダーマトリクステスト。
- ネイティブフィールドが消えたことを証明するメッセージツールスキーマテスト。
- ネイティブflagが消えたことを証明するCLIテスト。
- Carbonを対象とするDiscord entrypointのimport laziness回帰テスト。
- Telegramおよび汎用フォールバックを対象とするdelivery pinテスト。

## 未解決の質問

- `delivery.pin` は初回パスでDiscord、Slack、MS Teams、Feishu向けにも実装すべきですか。それともまずTelegramだけにすべきですか。
- `delivery` は最終的に `replyToId`, `replyToCurrent`, `silent`, `audioAsVoice` のような既存フィールドも吸収すべきですか。それとも送信後動作に集中したままにすべきですか。
- presentationは画像やファイル参照を直接サポートすべきですか。それとも今のところメディアはUIレイアウトから分離したままにすべきですか。
