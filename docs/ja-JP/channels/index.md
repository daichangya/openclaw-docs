---
read_when:
    - OpenClawのチャットチャネルを選びたい場合
    - 対応しているメッセージングプラットフォームの概要をすばやく確認したい場合
summary: OpenClawが接続できるメッセージングプラットフォーム
title: チャットチャネル
x-i18n:
    generated_at: "2026-04-25T13:41:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: e97818dce89ea06a60f2cccd0cc8a78cba48d66ea39e4769f2b583690a4f75d0
    source_path: channels/index.md
    workflow: 15
---

OpenClawは、すでに使っている任意のチャットアプリであなたとやり取りできます。各チャネルはGateway経由で接続します。
テキストはすべての環境でサポートされますが、メディアとリアクションはチャネルによって異なります。

## 配信に関する注意

- `![alt](url)`のようなMarkdown画像構文を含むTelegramの返信は、可能な場合、最終的な送信経路でメディア返信に変換されます。
- Slackの複数人DMはグループチャットとして扱われるため、グループポリシー、メンションの動作、グループセッションのルールがMPIM会話に適用されます。
- WhatsAppのセットアップは必要時インストールです。オンボーディングでは、Baileysのランタイム依存関係が配置される前にセットアップフローが表示されることがあり、Gatewayはチャネルが実際に有効なときにのみWhatsAppランタイムを読み込みます。

## 対応チャネル

- [BlueBubbles](/ja-JP/channels/bluebubbles) — **iMessageに推奨**。BlueBubbles macOSサーバーREST APIを使用し、完全な機能サポートを提供します（バンドル済みPlugin。編集、送信取り消し、エフェクト、リアクション、グループ管理。編集は現在macOS 26 Tahoeで動作しません）。
- [Discord](/ja-JP/channels/discord) — Discord Bot API + Gateway。サーバー、チャネル、DMをサポートします。
- [Feishu](/ja-JP/channels/feishu) — WebSocket経由のFeishu/Larkボット（バンドル済みPlugin）。
- [Google Chat](/ja-JP/channels/googlechat) — HTTP Webhook経由のGoogle Chat APIアプリ。
- [iMessage (legacy)](/ja-JP/channels/imessage) — `imsg` CLI経由のレガシーmacOS統合（非推奨。新規セットアップではBlueBubblesを使用してください）。
- [IRC](/ja-JP/channels/irc) — クラシックなIRCサーバー。ペアリング/許可リスト制御付きのチャネル + DM。
- [LINE](/ja-JP/channels/line) — LINE Messaging APIボット（バンドル済みPlugin）。
- [Matrix](/ja-JP/channels/matrix) — Matrixプロトコル（バンドル済みPlugin）。
- [Mattermost](/ja-JP/channels/mattermost) — Bot API + WebSocket。チャネル、グループ、DM（バンドル済みPlugin）。
- [Microsoft Teams](/ja-JP/channels/msteams) — Bot Framework。エンタープライズ対応（バンドル済みPlugin）。
- [Nextcloud Talk](/ja-JP/channels/nextcloud-talk) — Nextcloud Talk経由のセルフホスト型チャット（バンドル済みPlugin）。
- [Nostr](/ja-JP/channels/nostr) — NIP-04経由の分散型DM（バンドル済みPlugin）。
- [QQ Bot](/ja-JP/channels/qqbot) — QQ Bot API。プライベートチャット、グループチャット、リッチメディア（バンドル済みPlugin）。
- [Signal](/ja-JP/channels/signal) — `signal-cli`。プライバシー重視。
- [Slack](/ja-JP/channels/slack) — Bolt SDK。ワークスペースアプリ。
- [Synology Chat](/ja-JP/channels/synology-chat) — 送信+受信Webhook経由のSynology NAS Chat（バンドル済みPlugin）。
- [Telegram](/ja-JP/channels/telegram) — grammY経由のBot API。グループをサポートします。
- [Tlon](/ja-JP/channels/tlon) — Urbitベースのメッセンジャー（バンドル済みPlugin）。
- [Twitch](/ja-JP/channels/twitch) — IRC接続経由のTwitchチャット（バンドル済みPlugin）。
- [Voice Call](/ja-JP/plugins/voice-call) — PlivoまたはTwilio経由の電話通信（Plugin、別途インストール）。
- [WebChat](/ja-JP/web/webchat) — WebSocket経由のGateway WebChat UI。
- [WeChat](/ja-JP/channels/wechat) — QRログイン経由のTencent iLink Bot plugin。プライベートチャットのみ（外部Plugin）。
- [WhatsApp](/ja-JP/channels/whatsapp) — 最も一般的。Baileysを使用し、QRペアリングが必要です。
- [Zalo](/ja-JP/channels/zalo) — Zalo Bot API。ベトナムで人気のメッセンジャー（バンドル済みPlugin）。
- [Zalo Personal](/ja-JP/channels/zalouser) — QRログイン経由のZalo個人アカウント（バンドル済みPlugin）。

## 注意事項

- チャネルは同時に実行できます。複数を設定すると、OpenClawがチャットごとにルーティングします。
- 最も簡単にセットアップできるのは通常**Telegram**です（シンプルなボットトークン）。WhatsAppはQRペアリングが必要で、より多くの状態をディスクに保存します。
- グループの挙動はチャネルによって異なります。[Groups](/ja-JP/channels/groups)を参照してください。
- 安全のため、DMのペアリングと許可リストが適用されます。[Security](/ja-JP/gateway/security)を参照してください。
- トラブルシューティング: [Channel troubleshooting](/ja-JP/channels/troubleshooting)。
- モデルプロバイダーは別途ドキュメント化されています。[Model Providers](/ja-JP/providers/models)を参照してください。
