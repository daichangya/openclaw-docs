---
read_when:
    - OpenClaw 用のチャットチャネルを選びたい
    - サポートされているメッセージングプラットフォームの概要を手早く知りたい
summary: OpenClaw が接続できるメッセージングプラットフォーム
title: チャットチャネル
x-i18n:
    generated_at: "2026-04-05T12:35:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 246ee6f16aebe751241f00102bb435978ed21f6158385aff5d8e222e30567416
    source_path: channels/index.md
    workflow: 15
---

# チャットチャネル

OpenClaw は、あなたがすでに使っているどのチャットアプリでもやり取りできます。各チャネルは Gateway 経由で接続します。
テキストはどこでもサポートされますが、メディアとリアクションはチャネルごとに異なります。

## サポートされているチャネル

- [BlueBubbles](/channels/bluebubbles) — **iMessage に推奨**。BlueBubbles macOS サーバー REST API を使用し、完全な機能サポートを提供します（バンドルされたプラグイン。編集、送信取り消し、エフェクト、リアクション、グループ管理。編集は現在 macOS 26 Tahoe では壊れています）。
- [Discord](/channels/discord) — Discord Bot API + Gateway。サーバー、チャネル、DM をサポートします。
- [Feishu](/channels/feishu) — WebSocket 経由の Feishu/Lark ボット（バンドルされたプラグイン）。
- [Google Chat](/channels/googlechat) — HTTP webhook 経由の Google Chat API アプリ。
- [iMessage (legacy)](/channels/imessage) — imsg CLI 経由の従来の macOS 統合（非推奨。新しいセットアップでは BlueBubbles を使用してください）。
- [IRC](/channels/irc) — 従来型の IRC サーバー。ペアリング/許可リスト制御付きのチャネル + DM。
- [LINE](/channels/line) — LINE Messaging API ボット（バンドルされたプラグイン）。
- [Matrix](/channels/matrix) — Matrix プロトコル（バンドルされたプラグイン）。
- [Mattermost](/channels/mattermost) — Bot API + WebSocket。チャネル、グループ、DM（バンドルされたプラグイン）。
- [Microsoft Teams](/channels/msteams) — Bot Framework。エンタープライズ対応（バンドルされたプラグイン）。
- [Nextcloud Talk](/channels/nextcloud-talk) — Nextcloud Talk 経由のセルフホスト型チャット（バンドルされたプラグイン）。
- [Nostr](/channels/nostr) — NIP-04 経由の分散型 DM（バンドルされたプラグイン）。
- [QQ Bot](/channels/qqbot) — QQ Bot API。プライベートチャット、グループチャット、リッチメディア（バンドルされたプラグイン）。
- [Signal](/channels/signal) — signal-cli。プライバシー重視。
- [Slack](/channels/slack) — Bolt SDK。ワークスペースアプリ。
- [Synology Chat](/channels/synology-chat) — 送信 + 受信 webhook 経由の Synology NAS Chat（バンドルされたプラグイン）。
- [Telegram](/channels/telegram) — grammY 経由の Bot API。グループをサポートします。
- [Tlon](/channels/tlon) — Urbit ベースのメッセンジャー（バンドルされたプラグイン）。
- [Twitch](/channels/twitch) — IRC 接続経由の Twitch チャット（バンドルされたプラグイン）。
- [Voice Call](/plugins/voice-call) — Plivo または Twilio 経由の電話機能（プラグイン。別途インストールが必要）。
- [WebChat](/web/webchat) — WebSocket 経由の Gateway WebChat UI。
- [WeChat](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin) — QR ログイン経由の Tencent iLink Bot プラグイン。プライベートチャットのみ。
- [WhatsApp](/channels/whatsapp) — 最も人気があります。Baileys を使用し、QR ペアリングが必要です。
- [Zalo](/channels/zalo) — Zalo Bot API。ベトナムで人気のメッセンジャー（バンドルされたプラグイン）。
- [Zalo Personal](/channels/zalouser) — QR ログイン経由の Zalo 個人アカウント（バンドルされたプラグイン）。

## 注意事項

- チャネルは同時に実行できます。複数を設定すると、OpenClaw がチャットごとにルーティングします。
- 最も素早くセットアップできるのは通常 **Telegram** です（シンプルなボットトークン）。WhatsApp では QR ペアリングが必要で、より多くの状態がディスクに保存されます。
- グループの挙動はチャネルごとに異なります。詳しくは [Groups](/channels/groups) を参照してください。
- 安全のため、DM のペアリングと許可リストが適用されます。詳しくは [Security](/gateway/security) を参照してください。
- トラブルシューティング: [チャネルのトラブルシューティング](/channels/troubleshooting)。
- モデルプロバイダーは別途ドキュメント化されています。詳しくは [Model Providers](/providers/models) を参照してください。
