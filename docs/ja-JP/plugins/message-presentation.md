---
read_when:
    - メッセージカード、ボタン、またはセレクトのレンダリングの追加または変更
    - リッチな送信メッセージをサポートするチャネルPluginの構築
    - メッセージツールの表示または配信機能の変更
    - プロバイダー固有のカード/ブロック/コンポーネントのレンダリング不具合のデバッグ
summary: チャネルPlugin向けの、セマンティックメッセージカード、ボタン、セレクト、フォールバックテキスト、配信ヒント
title: メッセージ表示
x-i18n:
    generated_at: "2026-04-22T04:24:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6913b2b4331598a1396d19a572fba1fffde6cb9a6efa2192f30fe12404eb48d
    source_path: plugins/message-presentation.md
    workflow: 15
---

# メッセージ表示

メッセージ表示は、リッチな送信チャットUIのためのOpenClawの共有コントラクトです。
これにより、エージェント、CLIコマンド、承認フロー、Pluginは
メッセージの意図を一度だけ記述すればよく、各チャネルPluginは
可能な範囲で最適なネイティブ形状にレンダリングできます。

ポータブルなメッセージUIにはpresentationを使用してください。

- テキストセクション
- 小さなコンテキスト/フッターテキスト
- 区切り線
- ボタン
- セレクトメニュー
- カードのタイトルとtone

共有メッセージツールに、Discordの`components`、Slackの
`blocks`、Telegramの`buttons`、Teamsの`card`、Feishuの`card`のような新しいproviderネイティブフィールドを追加しないでください。これらはチャネルPluginが所有するレンダラー出力です。

## コントラクト

Plugin作成者は、公開コントラクトを次からインポートします。

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

形状:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
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

ボタンの意味論:

- `value`は、チャネルがクリック可能なコントロールをサポートしている場合に、そのチャネルの既存のインタラクション経路を通じて戻されるアプリケーションアクション値です。
- `url`はリンクボタンです。`value`がなくても存在できます。
- `label`は必須で、テキストフォールバックでも使用されます。
- `style`は助言的です。レンダラーは、未サポートのstyleを安全なデフォルトにマップすべきであり、送信を失敗させてはいけません。

セレクトの意味論:

- `options[].value`は選択されたアプリケーション値です。
- `placeholder`は助言的であり、ネイティブのセレクトサポートがないチャネルでは無視されることがあります。
- チャネルがセレクトをサポートしない場合、フォールバックテキストはlabelを一覧表示します。

## Producerの例

シンプルなカード:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

URLのみのリンクボタン:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

セレクトメニュー:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

CLI送信:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

ピン留め付き配信:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

明示的なJSONを使ったピン留め付き配信:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## レンダラーコントラクト

チャネルPluginは、送信アダプター上でレンダリングサポートを宣言します。

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

機能フィールドは意図的に単純なbooleanです。これらは、
レンダラーがどこまでインタラクティブにできるかを示すものであり、ネイティブプラットフォームの
すべての制限を表すものではありません。最大ボタン数、ブロック数、カードサイズなどの
プラットフォーム固有制限は、引き続きレンダラー側の責務です。

## coreのレンダーフロー

`ReplyPayload`またはメッセージアクションに`presentation`が含まれる場合、coreは次を行います。

1. presentation payloadを正規化します。
2. 対象チャネルの送信アダプターを解決します。
3. `presentationCapabilities`を読み取ります。
4. アダプターがpayloadをレンダリングできる場合、`renderPresentation`を呼び出します。
5. アダプターが存在しない、またはレンダリングできない場合は保守的なテキストにフォールバックします。
6. 得られたpayloadを通常のチャネル配信経路で送信します。
7. 最初の送信成功メッセージの後で、`delivery.pin`のような配信メタデータを適用します。

coreはフォールバック動作を所有するため、producerはチャネル非依存のままでいられます。チャネル
Pluginはネイティブレンダリングとインタラクション処理を所有します。

## 劣化ルール

presentationは、制限のあるチャネルでも安全に送信できなければなりません。

フォールバックテキストには次が含まれます。

- 先頭行としての`title`
- 通常の段落としての`text`ブロック
- コンパクトなコンテキスト行としての`context`ブロック
- 視覚的区切りとしての`divider`ブロック
- リンクボタンのURLを含むボタンlabel
- セレクトオプションlabel

未サポートのネイティブコントロールは、送信全体を失敗させるのではなく劣化すべきです。
例:

- インラインボタンが無効なTelegramでは、テキストフォールバックを送信します。
- セレクトサポートのないチャネルでは、セレクトオプションをテキストとして一覧表示します。
- URLのみのボタンは、ネイティブリンクボタンまたはフォールバックURL行になります。
- 任意のピン留め失敗は、配信済みメッセージを失敗にしません。

主な例外は`delivery.pin.required: true`です。requiredとして
ピン留めが要求され、かつチャネルが送信済みメッセージをピン留めできない場合、配信は失敗として報告されます。

## Providerマッピング

現在の組み込みレンダラー:

| Channel         | Native render target                | Notes                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components and component containers | Preserves legacy `channelData.discord.components` for existing provider-native payload producers, but new shared sends should use `presentation`. |
| Slack           | Block Kit                           | Preserves legacy `channelData.slack.blocks` for existing provider-native payload producers, but new shared sends should use `presentation`.       |
| Telegram        | Text plus inline keyboards          | Buttons/selects require inline button capability for the target surface; otherwise text fallback is used.                                         |
| Mattermost      | Text plus interactive props         | Other blocks degrade to text.                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | Plain `message` text is included with the card when both are provided.                                                                            |
| Feishu          | Interactive cards                   | Card header can use `title`; body avoids duplicating that title.                                                                                  |
| Plain channels  | Text fallback                       | Channels without a renderer still get readable output.                                                                                            |

providerネイティブpayload互換性は、既存の
reply producer向けの移行上の便宜です。これは新しい共有ネイティブフィールドを追加する理由にはなりません。

## PresentationとInteractiveReply

`InteractiveReply`は、承認およびインタラクション
ヘルパーで使われる古い内部サブセットです。次をサポートします。

- text
- buttons
- selects

`MessagePresentation`は、正規の共有送信コントラクトです。これには次が追加されます。

- title
- tone
- context
- divider
- URLのみのボタン
- `ReplyPayload.delivery`を通じた汎用配信メタデータ

古いコードを橋渡しする際は、`openclaw/plugin-sdk/interactive-runtime`のヘルパーを使用してください。

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

新しいコードは、直接`MessagePresentation`を受け入れるか生成すべきです。

## 配信ピン留め

ピン留めはpresentationではなく配信動作です。`channelData.telegram.pin`のような
providerネイティブフィールドの代わりに`delivery.pin`を使用してください。

意味論:

- `pin: true`は、最初に正常配信されたメッセージをピン留めします。
- `pin.notify`のデフォルトは`false`です。
- `pin.required`のデフォルトは`false`です。
- 任意のピン留め失敗は劣化し、送信済みメッセージはそのまま残ります。
- requiredなピン留め失敗は配信失敗になります。
- チャンク分割メッセージでは、末尾チャンクではなく最初に配信されたチャンクをピン留めします。

手動の`pin`、`unpin`、`pins`メッセージアクションは、providerがそれらの操作をサポートする既存メッセージ向けに引き続き存在します。

## Plugin作成者チェックリスト

- チャネルがセマンティックpresentationをレンダリングまたは安全に劣化できる場合、`describeMessageTool(...)`から`presentation`を宣言する。
- ランタイム送信アダプターに`presentationCapabilities`を追加する。
- `renderPresentation`は、コントロールプレーンのPluginセットアップコードではなく、ランタイムコードに実装する。
- ネイティブUIライブラリを、ホットなセットアップ/カタログ経路に持ち込まない。
- レンダラーとテストでプラットフォーム制限を保持する。
- 未サポートのボタン、セレクト、URLボタン、title/textの重複、`message`と`presentation`が混在する送信に対するフォールバックテストを追加する。
- providerが送信メッセージidをピン留めできる場合にのみ、`deliveryCapabilities.pin`と`pinDeliveredMessage`を通じて配信ピン留めサポートを追加する。
- 共有メッセージアクションスキーマを通じて、新しいproviderネイティブのcard/block/component/buttonフィールドを公開しない。

## 関連ドキュメント

- [Message CLI](/cli/message)
- [Plugin SDK Overview](/ja-JP/plugins/sdk-overview)
- [Plugin Architecture](/ja-JP/plugins/architecture#message-tool-schemas)
- [Channel Presentation Refactor Plan](/ja-JP/plan/ui-channels)
