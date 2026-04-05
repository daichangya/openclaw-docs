---
read_when:
    - モデルプロバイダーとしてGitHub Copilotを使いたい場合
    - '`openclaw models auth login-github-copilot` フローが必要な場合'
summary: デバイスフローを使ってOpenClawからGitHub Copilotにサインインする
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-05T12:53:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92857c119c314e698f922dbdbbc15d21b64d33a25979a2ec0ac1e82e586db6d6
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

## GitHub Copilotとは？

GitHub Copilotは、GitHubのAIコーディングアシスタントです。GitHubアカウントとプランに応じて、Copilot
モデルへアクセスできます。OpenClawでは、Copilotをモデル
プロバイダーとして2通りの方法で使用できます。

## OpenClawでCopilotを使う2つの方法

### 1) 組み込みGitHub Copilotプロバイダー（`github-copilot`）

ネイティブのデバイスログインフローを使ってGitHubトークンを取得し、その後OpenClaw実行時に
Copilot APIトークンへ交換します。これは**デフォルト**かつ最も簡単な経路で、
VS Codeを必要としません。

### 2) Copilot Proxyプラグイン（`copilot-proxy`）

**Copilot Proxy** VS Code拡張機能をローカルブリッジとして使用します。OpenClawは
そのプロキシの `/v1` エンドポイントと通信し、そこで設定したモデル一覧を使用します。すでにVS CodeでCopilot Proxyを動かしている場合や、それ経由でルーティングする必要がある場合はこちらを選んでください。
プラグインを有効にし、VS Code拡張機能を動かし続ける必要があります。

GitHub Copilotをモデルプロバイダー（`github-copilot`）として使用します。ログインコマンドは
GitHubデバイスフローを実行し、auth profileを保存し、その
profileを使うよう設定を更新します。

## CLIセットアップ

```bash
openclaw models auth login-github-copilot
```

URLにアクセスして1回限りのコードを入力するよう求められます。完了するまでターミナルを
開いたままにしてください。

### 任意のフラグ

```bash
openclaw models auth login-github-copilot --yes
```

プロバイダー推奨のデフォルトモデルも1回で適用するには、
代わりに汎用認証コマンドを使用します:

```bash
openclaw models auth login --provider github-copilot --method device --set-default
```

## デフォルトモデルを設定する

```bash
openclaw models set github-copilot/gpt-4o
```

### 設定スニペット

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

## 注記

- 対話型TTYが必要です。ターミナルで直接実行してください。
- Copilotモデルの利用可否はプランに依存します。モデルが拒否された場合は、
  別のID（たとえば `github-copilot/gpt-4.1`）を試してください。
- ClaudeモデルIDは自動的にAnthropic Messagesトランスポートを使用し、GPT、o-series、
  およびGeminiモデルはOpenAI Responsesトランスポートを維持します。
- ログインでは、auth profile storeにGitHubトークンを保存し、OpenClaw実行時にそれを
  Copilot APIトークンへ交換します。
