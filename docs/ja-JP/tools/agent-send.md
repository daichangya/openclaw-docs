---
read_when:
    - スクリプトまたはコマンドラインからエージェント実行をトリガーしたい
    - エージェントの返信をチャットチャンネルにプログラムで配信する必要がある
summary: CLI からエージェントターンを実行し、必要に応じて返信をチャンネルに配信する
title: エージェント送信
x-i18n:
    generated_at: "2026-04-05T12:57:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42ea2977e89fb28d2afd07e5f6b1560ad627aea8b72fde36d8e324215c710afc
    source_path: tools/agent-send.md
    workflow: 15
---

# エージェント送信

`openclaw agent` は、受信チャットメッセージを必要とせずに、コマンドラインから単一のエージェントターンを実行します。スクリプト化されたワークフロー、テスト、プログラムによる配信に使用してください。

## クイックスタート

<Steps>
  <Step title="シンプルなエージェントターンを実行する">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    これにより、メッセージが Gateway 経由で送信され、返信が表示されます。

  </Step>

  <Step title="特定のエージェントまたはセッションを対象にする">
    ```bash
    # 特定のエージェントを対象にする
    openclaw agent --agent ops --message "Summarize logs"

    # 電話番号を対象にする（session key を導出）
    openclaw agent --to +15555550123 --message "Status update"

    # 既存のセッションを再利用する
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="返信をチャンネルに配信する">
    ```bash
    # WhatsApp に配信する（デフォルトチャンネル）
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Slack に配信する
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## フラグ

| Flag                          | 説明                                                         |
| ----------------------------- | ------------------------------------------------------------ |
| `--message \<text\>`          | 送信するメッセージ（必須）                                   |
| `--to \<dest\>`               | 対象から session key を導出する（電話番号、チャット id）     |
| `--agent \<id\>`              | 設定済みエージェントを対象にする（その `main` セッションを使用） |
| `--session-id \<id\>`         | id で既存のセッションを再利用する                            |
| `--local`                     | ローカルの組み込みランタイムを強制する（Gateway をスキップ） |
| `--deliver`                   | 返信をチャットチャンネルに送信する                           |
| `--channel \<name\>`          | 配信チャンネル（whatsapp、telegram、discord、slack など）    |
| `--reply-to \<target\>`       | 配信先の上書き                                               |
| `--reply-channel \<name\>`    | 配信チャンネルの上書き                                       |
| `--reply-account \<id\>`      | 配信アカウント id の上書き                                   |
| `--thinking \<level\>`        | thinking level を設定する（off、minimal、low、medium、high、xhigh） |
| `--verbose \<on\|full\|off\>` | verbose level を設定する                                     |
| `--timeout \<seconds\>`       | エージェントタイムアウトを上書きする                         |
| `--json`                      | 構造化 JSON を出力する                                       |

## 動作

- デフォルトでは、CLI は **Gateway 経由** で動作します。現在のマシンで組み込みランタイムを強制するには `--local` を追加してください。
- Gateway に到達できない場合、CLI はローカルの組み込み実行に **フォールバック** します。
- セッション選択: `--to` は session key を導出します（グループ/チャンネル対象は分離を維持し、ダイレクトチャットは `main` に集約されます）。
- thinking フラグと verbose フラグはセッションストアに永続化されます。
- 出力: デフォルトではプレーンテキスト、または `--json` で構造化ペイロード + メタデータ。

## 例

```bash
# JSON 出力付きのシンプルなターン
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# thinking level 付きのターン
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# セッションとは異なるチャンネルに配信する
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## 関連

- [Agent CLI リファレンス](/cli/agent)
- [Sub-agents](/tools/subagents) — バックグラウンドの sub-agent 起動
- [セッション](/ja-JP/concepts/session) — session key の仕組み
