---
read_when:
    - OpenClawのチャットチャンネルを選択したい場合
    - サポートされているメッセージングプラットフォームの概要をすぐに確認したい場合
summary: OpenClawが接続できるメッセージングプラットフォーム
title: チャットチャンネル
x-i18n:
    generated_at: "2026-04-19T01:11:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: d41c3a37d91c07f15afd8e199a289297772331c70e38697346a373595eb2d993
    source_path: channels/index.md
    workflow: 15
---

# チャットチャンネル

OpenClawは、すでに使っている任意のチャットアプリであなたと会話できます。各チャンネルはGateway経由で接続します。
テキストはすべての場所でサポートされますが、メディアやリアクションはチャンネルによって異なります。

## サポートされているチャンネル

- [BlueBubbles](/ja-JP/channels/bluebubbles) — **iMessageに推奨**; BlueBubbles macOSサーバーのREST APIを使用し、完全な機能サポートを提供します（バンドルされたPlugin; 編集、送信取り消し、エフェクト、リアクション、グループ管理 — 編集は現在macOS 26 Tahoeで壊れています）。
- [Discord](/ja-JP/channels/discord) — Discord Bot API + Gateway; サーバー、チャンネル、DMをサポートします。
- [Feishu](/ja-JP/channels/feishu) — WebSocket経由のFeishu/Larkボット（バンドルされたPlugin）。
- [Google Chat](/ja-JP/channels/googlechat) — HTTP Webhook経由のGoogle Chat APIアプリ。
- [iMessage (legacy)](/ja-JP/channels/imessage) — `imsg` CLI経由の従来のmacOS統合（非推奨、新しいセットアップではBlueBubblesを使用してください）。
- [IRC](/ja-JP/channels/irc) — クラシックなIRCサーバー; ペアリング/許可リスト制御付きのチャンネル + DM。
- [LINE](/ja-JP/channels/line) — LINE Messaging APIボット（バンドルされたPlugin）。
- [Matrix](/ja-JP/channels/matrix) — Matrixプロトコル（バンドルされたPlugin）。
- [Mattermost](/ja-JP/channels/mattermost) — Bot API + WebSocket; チャンネル、グループ、DM（バンドルされたPlugin）。
- [Microsoft Teams](/ja-JP/channels/msteams) — Bot Framework; エンタープライズサポート（バンドルされたPlugin）。
- [Nextcloud Talk](/ja-JP/channels/nextcloud-talk) — Nextcloud Talk経由のセルフホスト型チャット（バンドルされたPlugin）。
- [Nostr](/ja-JP/channels/nostr) — NIP-04経由の分散型DM（バンドルされたPlugin）。
- [QQ Bot](/ja-JP/channels/qqbot) — QQ Bot API; プライベートチャット、グループチャット、リッチメディア（バンドルされたPlugin）。
- [Signal](/ja-JP/channels/signal) — signal-cli; プライバシー重視。
- [Slack](/ja-JP/channels/slack) — Bolt SDK; ワークスペースアプリ。
- [Synology Chat](/ja-JP/channels/synology-chat) — 送信+受信Webhook経由のSynology NAS Chat（バンドルされたPlugin）。
- [Telegram](/ja-JP/channels/telegram) — grammY経由のBot API; グループをサポートします。
- [Tlon](/ja-JP/channels/tlon) — Urbitベースのメッセンジャー（バンドルされたPlugin）。
- [Twitch](/ja-JP/channels/twitch) — IRC接続経由のTwitchチャット（バンドルされたPlugin）。
- [Voice Call](/ja-JP/plugins/voice-call) — PlivoまたはTwilio経由のテレフォニー（Plugin、別途インストールが必要）。
- [WebChat](/web/webchat) — WebSocket経由のGateway WebChat UI。
- [WeChat](/ja-JP/channels/wechat) — QRログイン経由のTencent iLink Bot plugin; プライベートチャットのみ（外部Plugin）。
- [WhatsApp](/ja-JP/channels/whatsapp) — 最も人気があります; Baileysを使用し、QRペアリングが必要です。
- [Zalo](/ja-JP/channels/zalo) — Zalo Bot API; ベトナムで人気のメッセンジャー（バンドルされたPlugin）。
- [Zalo Personal](/ja-JP/channels/zalouser) — QRログイン経由のZalo個人アカウント（バンドルされたPlugin）。

## 注意事項

- チャンネルは同時に実行できます; 複数を設定すると、OpenClawがチャットごとにルーティングします。
- 最も素早くセットアップできるのは通常**Telegram**です（シンプルなボットトークン）。WhatsAppはQRペアリングが必要で、
  より多くの状態をディスクに保存します。
- グループの動作はチャンネルによって異なります; [Groups](/ja-JP/channels/groups)を参照してください。
- DMのペアリングと許可リストは安全性のために強制されます; [Security](/ja-JP/gateway/security)を参照してください。
- トラブルシューティング: [チャンネルトラブルシューティング](/ja-JP/channels/troubleshooting)。
- モデルプロバイダーは別途ドキュメント化されています; [Model Providers](/ja-JP/providers/models)を参照してください。
