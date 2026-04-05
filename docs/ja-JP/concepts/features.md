---
read_when:
    - OpenClawがサポートしている内容の完全な一覧を知りたい場合
summary: チャネル、ルーティング、メディア、UXにわたるOpenClawの機能。
title: 機能
x-i18n:
    generated_at: "2026-04-05T12:40:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43eae89d9af44ea786dd0221d8d602ebcea15da9d5064396ac9920c0345e2ad3
    source_path: concepts/features.md
    workflow: 15
---

# 機能

## ハイライト

<Columns>
  <Card title="チャネル" icon="message-square">
    単一のGatewayで、Discord、iMessage、Signal、Slack、Telegram、WhatsApp、WebChatなどに対応します。
  </Card>
  <Card title="プラグイン" icon="plug">
    バンドルされたプラグインにより、通常の現行リリースでは個別インストールなしでMatrix、Nextcloud Talk、Nostr、Twitch、Zaloなどを追加できます。
  </Card>
  <Card title="ルーティング" icon="route">
    分離されたセッションによるマルチエージェントルーティング。
  </Card>
  <Card title="メディア" icon="image">
    画像、音声、動画、ドキュメント、および画像/動画生成。
  </Card>
  <Card title="アプリとUI" icon="monitor">
    WebコントロールUIとmacOSコンパニオンアプリ。
  </Card>
  <Card title="モバイルノード" icon="smartphone">
    ペアリング、音声/チャット、豊富なデバイスコマンドを備えたiOSおよびAndroidノード。
  </Card>
</Columns>

## 完全な一覧

**チャネル:**

- 組み込みチャネルには、Discord、Google Chat、iMessage（レガシー）、IRC、Signal、Slack、Telegram、WebChat、WhatsApp が含まれます
- バンドルされたプラグインチャネルには、iMessage向けBlueBubbles、Feishu、LINE、Matrix、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Tlon、Twitch、Zalo、Zalo Personal が含まれます
- オプションで個別にインストールするチャネルプラグインには、Voice Call や WeChat などのサードパーティーパッケージがあります
- WeChat などのサードパーティーチャネルプラグインにより、Gatewayをさらに拡張できます
- メンションベースの有効化によるグループチャット対応
- allowlistとペアリングによるDMの安全性

**エージェント:**

- ツールストリーミングを備えた組み込みエージェントランタイム
- ワークスペースまたは送信者ごとに分離されたセッションによるマルチエージェントルーティング
- セッション: ダイレクトチャットは共有の`main`に集約され、グループは分離されます
- 長い応答のためのストリーミングとチャンク分割

**認証とプロバイダー:**

- 35以上のモデルプロバイダー（Anthropic、OpenAI、Googleなど）
- OAuthによるサブスクリプション認証（例: OpenAI Codex）
- カスタムおよびセルフホスト型プロバイダーのサポート（vLLM、SGLang、Ollama、および任意のOpenAI互換またはAnthropic互換エンドポイント）

**メディア:**

- 画像、音声、動画、ドキュメントの入出力
- 共通の画像生成および動画生成の機能インターフェース
- ボイスノートの文字起こし
- 複数プロバイダーによるテキスト読み上げ

**アプリとインターフェース:**

- WebChatとブラウザーのコントロールUI
- macOSメニューバーのコンパニオンアプリ
- ペアリング、Canvas、カメラ、画面録画、位置情報、音声を備えたiOSノード
- ペアリング、チャット、音声、Canvas、カメラ、デバイスコマンドを備えたAndroidノード

**ツールと自動化:**

- ブラウザー自動化、exec、サンドボックス化
- Web検索（Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily）
- Cronジョブとheartbeatスケジューリング
- Skills、プラグイン、ワークフローパイプライン（Lobster）
