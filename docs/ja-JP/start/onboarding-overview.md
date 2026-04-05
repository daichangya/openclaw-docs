---
read_when:
    - オンボーディング経路を選ぶ
    - 新しい環境をセットアップする
sidebarTitle: Onboarding Overview
summary: OpenClaw のオンボーディングオプションとフローの概要
title: オンボーディング概要
x-i18n:
    generated_at: "2026-04-05T12:57:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 374697c1dbe0c3871c43164076fbed7119ef032f4a40d0f6e421051f914806e5
    source_path: start/onboarding-overview.md
    workflow: 15
---

# オンボーディング概要

OpenClaw には 2 つのオンボーディング経路があります。どちらも認証、Gateway、
オプションのチャットチャンネルを設定します。違いは、セットアップとの対話方法だけです。

## どの経路を使うべきですか？

|                | CLI オンボーディング                         | macOS アプリのオンボーディング |
| -------------- | -------------------------------------------- | ------------------------------ |
| **プラットフォーム**  | macOS、Linux、Windows（ネイティブまたは WSL2） | macOS のみ                     |
| **インターフェース**  | ターミナルのウィザード                              | アプリ内のガイド付き UI              |
| **最適な用途**   | サーバー、ヘッドレス、完全な制御                  | デスクトップ Mac、視覚的なセットアップ |
| **自動化** | スクリプト用の `--non-interactive`        | 手動のみ                       |
| **コマンド**    | `openclaw onboard`                           | アプリを起動                     |

ほとんどのユーザーは **CLI オンボーディング** から始めるべきです。これはどこでも動作し、
最も高い制御性を提供します。

## オンボーディングで設定されるもの

どの経路を選んでも、オンボーディングでは以下を設定します。

1. **モデルプロバイダーと認証** — 選択したプロバイダー用の API キー、OAuth、またはセットアップトークン
2. **ワークスペース** — エージェントファイル、bootstrap テンプレート、メモリ用のディレクトリ
3. **Gateway** — ポート、bind アドレス、認証モード
4. **チャンネル**（任意）— BlueBubbles、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、
   Telegram、WhatsApp などの組み込みおよびバンドル済みチャットチャンネル
5. **デーモン**（任意）— Gateway が自動的に起動するようにするバックグラウンドサービス

## CLI オンボーディング

任意のターミナルで実行します。

```bash
openclaw onboard
```

バックグラウンドサービスも 1 ステップでインストールするには、`--install-daemon` を追加します。

完全なリファレンス: [オンボーディング（CLI）](/ja-JP/start/wizard)
CLI コマンドドキュメント: [`openclaw onboard`](/cli/onboard)

## macOS アプリのオンボーディング

OpenClaw アプリを開きます。初回起動ウィザードが、同じ手順を視覚的なインターフェースで案内します。

完全なリファレンス: [オンボーディング（macOS アプリ）](/start/onboarding)

## カスタムまたは一覧にないプロバイダー

オンボーディングにプロバイダーが一覧表示されていない場合は、**Custom Provider** を選択して、
以下を入力します。

- API 互換モード（OpenAI-compatible、Anthropic-compatible、または auto-detect）
- Base URL と API キー
- モデル ID と任意のエイリアス

複数のカスタムエンドポイントを共存させることができ、それぞれに独自の endpoint ID が割り当てられます。
