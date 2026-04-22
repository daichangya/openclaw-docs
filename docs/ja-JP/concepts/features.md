---
read_when:
    - OpenClawがサポートしている機能の完全な一覧が必要です
summary: チャンネル、ルーティング、メディア、UX全体にわたるOpenClawの機能
title: 機能
x-i18n:
    generated_at: "2026-04-22T04:21:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af9955b65030fe02e35d3056d284271fa9700f3ed094c6f8323eb10e4064e22
    source_path: concepts/features.md
    workflow: 15
---

# 機能

## ハイライト

<Columns>
  <Card title="チャンネル" icon="message-square" href="/ja-JP/channels">
    単一のGatewayでDiscord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChatなどを利用できます。
  </Card>
  <Card title="Plugins" icon="plug" href="/ja-JP/tools/plugin">
    バンドル済みPluginにより、通常の現行リリースでは別途インストールせずにMatrix、Nextcloud Talk、Nostr、Twitch、Zaloなどを追加できます。
  </Card>
  <Card title="ルーティング" icon="route" href="/ja-JP/concepts/multi-agent">
    分離されたセッションによるマルチエージェントルーティング。
  </Card>
  <Card title="メディア" icon="image" href="/ja-JP/nodes/images">
    画像、音声、動画、ドキュメント、および画像/動画生成。
  </Card>
  <Card title="アプリとUI" icon="monitor" href="/web/control-ui">
    Web Control UIとmacOSコンパニオンアプリ。
  </Card>
  <Card title="モバイルノード" icon="smartphone" href="/ja-JP/nodes">
    ペアリング、音声/チャット、リッチなデバイスコマンドを備えたiOSおよびAndroidノード。
  </Card>
</Columns>

## 完全な一覧

**チャンネル:**

- 組み込みチャンネルには、Discord、Google Chat、iMessage（legacy）、IRC、Signal、Slack、Telegram、WebChat、WhatsAppが含まれます
- バンドル済みPluginチャンネルには、iMessage向けBlueBubbles、Feishu、LINE、Matrix、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Tlon、Twitch、Zalo、Zalo Personalが含まれます
- 任意で別途インストールするチャンネルPluginには、Voice CallやWeChatなどのサードパーティパッケージが含まれます
- WeChatなどのサードパーティチャンネルPluginにより、Gatewayをさらに拡張できます
- メンションベースのアクティベーションによるグループチャットサポート
- 許可リストとペアリングによるDMの安全性

**エージェント:**

- ツールストリーミングを備えた組み込みエージェントランタイム
- ワークスペースまたは送信者ごとに分離されたセッションによるマルチエージェントルーティング
- セッション: ダイレクトチャットは共有の`main`に集約され、グループは分離されます
- 長い応答に対応するストリーミングとチャンク化

**認証とprovider:**

- 35以上のモデルprovider（Anthropic、OpenAI、Googleなど）
- OAuthによるサブスクリプション認証（例: OpenAI Codex）
- カスタムおよびセルフホストproviderのサポート（vLLM、SGLang、Ollama、および任意のOpenAI互換またはAnthropic互換エンドポイント）

**メディア:**

- 画像、音声、動画、ドキュメントの送受信
- 共通の画像生成および動画生成の機能サーフェス
- 音声メモの文字起こし
- 複数providerによるtext-to-speech

**アプリとインターフェース:**

- WebChatとブラウザ版Control UI
- macOSメニューバーコンパニオンアプリ
- ペアリング、Canvas、カメラ、画面録画、位置情報、音声を備えたiOSノード
- ペアリング、チャット、音声、Canvas、カメラ、デバイスコマンドを備えたAndroidノード

**ツールと自動化:**

- ブラウザ自動化、exec、サンドボックス化
- Web検索（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily）
- CronジョブとHeartbeatスケジューリング
- Skills、Plugins、ワークフローパイプライン（Lobster）
