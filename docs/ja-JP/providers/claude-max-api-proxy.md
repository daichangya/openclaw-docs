---
read_when:
    - Claude Max subscriptionをOpenAI互換toolで使いたいとき
    - Claude Code CLIをラップするローカルAPI serverが欲しいとき
    - subscriptionベースとAPI keyベースのAnthropic accessを評価したいとき
summary: Claude subscription認証情報をOpenAI互換endpointとして公開するcommunity proxy
title: Claude Max API Proxy
x-i18n:
    generated_at: "2026-04-05T12:53:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e125a6a46e48371544adf1331137a1db51e93e905b8c44da482cf2fba180a09
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

# Claude Max API Proxy

**claude-max-api-proxy** は、Claude Max/Pro subscriptionをOpenAI互換API endpointとして公開するcommunity toolです。これにより、OpenAI API形式をサポートする任意のtoolでsubscriptionを使えるようになります。

<Warning>
この経路は技術的互換性のためだけのものです。Anthropicは過去に、Claude Code以外での
一部のsubscription利用をブロックしたことがあります。これを使うかどうかは自分で判断し、
依存する前にAnthropicの現行規約を確認する必要があります。
</Warning>

## これを使う理由

| アプローチ              | コスト                                              | 最適な用途                                 |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| Anthropic API           | トークン課金（Opusで入力約 $15/M、出力 $75/M）      | 本番アプリ、高ボリューム                   |
| Claude Max subscription | 月額固定 $200                                       | 個人利用、開発、無制限利用                 |

Claude Max subscriptionを持っていて、それをOpenAI互換toolで使いたい場合、このproxyは一部のworkflowでコストを下げられる可能性があります。本番利用では、API keysのほうがポリシー上より明確な経路のままです。

## 仕組み

```
Your App → claude-max-api-proxy → Claude Code CLI → Anthropic (via subscription)
     (OpenAI format)              (形式を変換)            (ログインを使用)
```

このproxyは次を行います。

1. `http://localhost:3456/v1/chat/completions` でOpenAI形式のリクエストを受け付ける
2. それらをClaude Code CLIコマンドへ変換する
3. OpenAI形式でレスポンスを返す（streaming対応）

## インストール

```bash
# Node.js 20+ と Claude Code CLI が必要
npm install -g claude-max-api-proxy

# Claude CLI が認証済みであることを確認
claude --version
```

## 使い方

### サーバーを起動する

```bash
claude-max-api
# サーバーは http://localhost:3456 で動作
```

### テストする

```bash
# ヘルスチェック
curl http://localhost:3456/health

# モデル一覧
curl http://localhost:3456/v1/models

# Chat completion
curl http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### OpenClawで使う

このproxyをcustomなOpenAI互換endpointとしてOpenClawに向けられます。

```json5
{
  env: {
    OPENAI_API_KEY: "not-needed",
    OPENAI_BASE_URL: "http://localhost:3456/v1",
  },
  agents: {
    defaults: {
      model: { primary: "openai/claude-opus-4" },
    },
  },
}
```

この経路は、他のcustom
`/v1` backendと同じproxyスタイルのOpenAI互換routeを使います。

- OpenAIネイティブ専用のrequest shapingは適用されません
- `service_tier`、Responses `store`、prompt-cache hint、OpenAI reasoning互換payload shapingはありません
- 非表示のOpenClaw attribution header（`originator`, `version`, `User-Agent`）はproxy URLへ注入されません

## 利用可能なモデル

| Model ID          | 対応先           |
| ----------------- | ---------------- |
| `claude-opus-4`   | Claude Opus 4    |
| `claude-sonnet-4` | Claude Sonnet 4  |
| `claude-haiku-4`  | Claude Haiku 4   |

## macOSでの自動起動

proxyを自動的に実行するLaunchAgentを作成します。

```bash
cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.claude-max-api</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
EOF

launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
```

## リンク

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## 注

- これは **community tool** であり、AnthropicやOpenClawに公式サポートされていません
- 認証済みのClaude Code CLIを伴う、有効なClaude Max/Pro subscriptionが必要です
- proxyはローカルで動作し、サードパーティserverへデータを送信しません
- Streaming responseは完全にサポートされています

## 関連項目

- [Anthropic provider](/providers/anthropic) - Claude CLIまたはAPI keysを使うOpenClawネイティブ統合
- [OpenAI provider](/providers/openai) - OpenAI/Codex subscription向け
