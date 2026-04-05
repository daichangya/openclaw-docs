---
read_when:
    - スクリプトから 1 回のエージェントターンを実行したいとき（必要に応じて返信も配信）
summary: '`openclaw agent` の CLI リファレンス（Gateway 経由で 1 回のエージェントターンを送信）'
title: agent
x-i18n:
    generated_at: "2026-04-05T12:37:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0627f943bc7f3556318008f76dc6150788cf06927dccdc7d2681acb98f257d56
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Gateway 経由でエージェントターンを実行します（埋め込み実行には `--local` を使用）。
設定済みエージェントを直接対象にするには `--agent <id>` を使用します。

少なくとも 1 つのセッションセレクターを指定してください。

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

関連:

- Agent send tool: [Agent send](/tools/agent-send)

## オプション

- `-m, --message <text>`: 必須のメッセージ本文
- `-t, --to <dest>`: セッションキーの導出に使われる受信者
- `--session-id <id>`: 明示的な session id
- `--agent <id>`: agent id。ルーティングバインディングを上書きします
- `--thinking <off|minimal|low|medium|high|xhigh>`: エージェントの thinking レベル
- `--verbose <on|off>`: セッションの verbose レベルを永続化します
- `--channel <channel>`: 配信チャネル。省略時はメインセッションチャネルを使用
- `--reply-to <target>`: 配信先ターゲットの上書き
- `--reply-channel <channel>`: 配信チャネルの上書き
- `--reply-account <id>`: 配信アカウントの上書き
- `--local`: 埋め込みエージェントを直接実行します（plugin registry の事前読み込み後）
- `--deliver`: 選択したチャネル/ターゲットに返信を送り返します
- `--timeout <seconds>`: エージェントタイムアウトを上書きします（デフォルトは 600 または config 値）
- `--json`: JSON を出力します

## 例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 注記

- Gateway モードでは、Gateway リクエストが失敗すると埋め込みエージェントにフォールバックします。最初から埋め込み実行を強制するには `--local` を使用してください。
- `--local` でも最初に plugin registry を事前読み込みするため、埋め込み実行中もプラグイン提供の provider、tool、channel を利用できます。
- `--channel`、`--reply-channel`、`--reply-account` はセッションルーティングではなく返信配信に影響します。
- このコマンドが `models.json` の再生成を引き起こした場合、SecretRef 管理の provider 認証情報は、解決済みのシークレット平文ではなく、非シークレットのマーカー（たとえば env var 名、`secretref-env:ENV_VAR_NAME`、または `secretref-managed`）として永続化されます。
- マーカーの書き込みはソース権威です。OpenClaw は、解決済みランタイムシークレット値からではなく、アクティブなソース config スナップショットからマーカーを永続化します。
