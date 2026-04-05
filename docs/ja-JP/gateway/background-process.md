---
read_when:
    - バックグラウンド exec の動作を追加または変更する場合
    - 長時間実行される exec タスクをデバッグする場合
summary: バックグラウンド exec 実行と process ツールによる管理
title: Background Exec and Process Tool
x-i18n:
    generated_at: "2026-04-05T12:43:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4398e2850f6f050944f103ad637cd9f578e9cc7fb478bc5cd5d972c92289b831
    source_path: gateway/background-process.md
    workflow: 15
---

# Background Exec + Process Tool

OpenClaw は `exec` ツールを通じてシェルコマンドを実行し、長時間実行されるタスクをメモリ内に保持します。`process` ツールは、それらのバックグラウンドセッションを管理します。

## exec ツール

主なパラメーター:

- `command`（必須）
- `yieldMs`（デフォルト 10000）: この遅延後に自動でバックグラウンド化
- `background`（bool）: すぐにバックグラウンド化
- `timeout`（秒、デフォルト 1800）: このタイムアウト後にプロセスを kill する
- `elevated`（bool）: 昇格モードが有効 / 許可されている場合、sandbox の外で実行する（デフォルトでは `gateway`、exec ターゲットが `node` の場合は `node`）
- 実際の TTY が必要ですか? `pty: true` を設定します。
- `workdir`、`env`

動作:

- フォアグラウンド実行は出力を直接返します。
- バックグラウンド化された場合（明示的、またはタイムアウトによる）、ツールは `status: "running"`、`sessionId`、および短い末尾出力を返します。
- 出力は、そのセッションがポーリングまたはクリアされるまでメモリ内に保持されます。
- `process` ツールが許可されていない場合、`exec` は同期的に実行され、`yieldMs` / `background` を無視します。
- 生成された exec コマンドは、コンテキスト認識のシェル / profile ルールのために `OPENCLAW_SHELL=exec` を受け取ります。
- 今すぐ始まる長時間作業では、コマンドを一度だけ開始し、自動完了 wake が有効で、コマンドが出力を出すか失敗したときには、それに依存してください。
- 自動完了 wake が利用できない場合、または出力なしで正常終了したコマンドについて静かな成功確認が必要な場合は、`process` を使用して完了を確認してください。
- `sleep` ループや繰り返しのポーリングでリマインダーや遅延フォローアップを模倣しないでください。将来の作業には cron を使ってください。

## 子プロセスのブリッジ

exec / process ツールの外で長時間実行される子プロセスを生成する場合（たとえば CLI の再起動や Gateway ヘルパー）、子プロセスブリッジヘルパーを接続して、終了シグナルが転送され、リスナーが exit / error 時に切り離されるようにしてください。これにより、systemd 上で孤立したプロセスが発生するのを防ぎ、プラットフォーム間でシャットダウン動作の一貫性を保てます。

環境変数による上書き:

- `PI_BASH_YIELD_MS`: デフォルトの yield（ms）
- `PI_BASH_MAX_OUTPUT_CHARS`: メモリ内出力上限（文字数）
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: stream ごとの保留中 stdout / stderr 上限（文字数）
- `PI_BASH_JOB_TTL_MS`: 終了済みセッションの TTL（ms、1 分〜3 時間に制限）

config（推奨）:

- `tools.exec.backgroundMs`（デフォルト 10000）
- `tools.exec.timeoutSec`（デフォルト 1800）
- `tools.exec.cleanupMs`（デフォルト 1800000）
- `tools.exec.notifyOnExit`（デフォルト true）: バックグラウンド化された exec が終了したときに、システムイベントをキューに入れ、heartbeat を要求します。
- `tools.exec.notifyOnExitEmptySuccess`（デフォルト false）: true の場合、出力を生成しなかった正常終了のバックグラウンド実行についても完了イベントをキューに入れます。

## process ツール

アクション:

- `list`: 実行中 + 終了済みセッション
- `poll`: セッションの新しい出力をドレインする（終了ステータスも報告）
- `log`: 集約された出力を読む（`offset` + `limit` をサポート）
- `write`: stdin を送信する（`data`、任意の `eof`）
- `send-keys`: PTY 対応セッションに明示的なキー token またはバイトを送信する
- `submit`: PTY 対応セッションに Enter / carriage return を送信する
- `paste`: bracketed paste mode でのラップを任意で行いつつ、リテラルテキストを送信する
- `kill`: バックグラウンドセッションを終了する
- `clear`: 終了済みセッションをメモリから削除する
- `remove`: 実行中なら kill、終了済みなら clear

注意:

- メモリ内に一覧表示 / 保持されるのは、バックグラウンド化されたセッションのみです。
- セッションはプロセス再起動時に失われます（ディスク永続化はありません）。
- セッションログは、`process poll/log` を実行してツール結果が記録された場合にのみ、チャット履歴に保存されます。
- `process` はエージェント単位でスコープされます。そのエージェントが開始したセッションだけを参照できます。
- 自動完了 wake が利用できない場合の状態確認、ログ、静かな成功確認、または完了確認には `poll` / `log` を使ってください。
- 入力または介入が必要な場合は `write` / `send-keys` / `submit` / `paste` / `kill` を使ってください。
- `process list` には、素早く確認できるよう導出された `name`（コマンド動詞 + 対象）が含まれます。
- `process log` は行ベースの `offset` / `limit` を使用します。
- `offset` と `limit` の両方が省略された場合、最後の 200 行を返し、ページングのヒントを含みます。
- `offset` が指定されていて `limit` が省略された場合、`offset` から末尾までを返します（200 行には制限されません）。
- ポーリングはオンデマンドの状態確認用であり、待機ループのスケジューリング用ではありません。作業を後で行うべきなら、代わりに cron を使ってください。

## 例

長時間タスクを実行し、後でポーリングする:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

すぐにバックグラウンドで開始する:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

stdin を送信する:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

PTY キーを送信する:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

現在の行を送信する:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

リテラルテキストを貼り付ける:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```
