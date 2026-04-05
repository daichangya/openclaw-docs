---
read_when:
    - バックグラウンドジョブやウェイクアップをスケジューリングするとき
    - 外部トリガー（Webhook、Gmail）をOpenClawに接続するとき
    - スケジュール済みタスクでheartbeatとcronのどちらを使うか判断するとき
summary: Gatewayスケジューラ向けのスケジュール済みジョブ、Webhook、Gmail PubSubトリガー
title: スケジュール済みタスク
x-i18n:
    generated_at: "2026-04-05T12:34:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43b906914461aba9af327e7e8c22aa856f65802ec2da37ed0c4f872d229cfde6
    source_path: automation/cron-jobs.md
    workflow: 15
---

# スケジュール済みタスク（Cron）

CronはGatewayに組み込まれたスケジューラです。ジョブを永続化し、適切なタイミングでエージェントを起動し、出力をチャットチャンネルやWebhookエンドポイントに返送できます。

## クイックスタート

```bash
# 1回限りのリマインダーを追加
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# ジョブを確認
openclaw cron list

# 実行履歴を確認
openclaw cron runs --id <job-id>
```

## cronの仕組み

- Cronは**Gatewayプロセス内**で実行されます（モデル内ではありません）。
- ジョブは`~/.openclaw/cron/jobs.json`に永続化されるため、再起動してもスケジュールは失われません。
- すべてのcron実行では[バックグラウンドタスク](/automation/tasks)レコードが作成されます。
- 1回限りのジョブ（`--at`）は、デフォルトで成功後に自動削除されます。
- 分離されたcron実行では、実行完了時にその`cron:<jobId>`セッション用に追跡されているブラウザータブやプロセスをベストエフォートで閉じるため、切り離されたブラウザー自動化によって孤立プロセスが残ることを防ぎます。
- 分離されたcron実行では、古い確認応答の返信も防ぎます。最初の結果が単なる中間ステータス更新（`on it`、`pulling everything together`、および類似のヒント）であり、最終回答を担当する子孫subagent実行がまだ存在しない場合、OpenClawは配信前に実際の結果を得るためにもう一度プロンプトを送ります。

cronのタスク照合はランタイムが管理します。古い子セッション行がまだ存在していても、cronランタイムがそのジョブを実行中として追跡している間は、アクティブなcronタスクは有効なままです。ランタイムがそのジョブの所有を終了し、5分間の猶予時間が過ぎると、メンテナンスによってタスクは`lost`としてマークされる場合があります。

## スケジュールの種類

| 種類    | CLIフラグ | 説明                                                   |
| ------- | --------- | ------------------------------------------------------ |
| `at`    | `--at`    | 1回限りのタイムスタンプ（ISO 8601、または`20m`のような相対指定） |
| `every` | `--every` | 固定間隔                                               |
| `cron`  | `--cron`  | オプションの`--tz`付き5フィールドまたは6フィールドのcron式 |

タイムゾーンなしのタイムスタンプはUTCとして扱われます。ローカルの壁時計時刻でスケジュールするには`--tz America/New_York`を追加してください。

毎時ちょうどに実行される定期式は、負荷の急増を減らすために最大5分まで自動的にずらされます。正確なタイミングを強制するには`--exact`を、明示的なウィンドウを指定するには`--stagger 30s`を使用してください。

## 実行スタイル

| スタイル        | `--session`値       | 実行場所                 | 最適な用途                     |
| --------------- | ------------------- | ------------------------ | ------------------------------ |
| メインセッション | `main`              | 次のheartbeatターン      | リマインダー、システムイベント |
| 分離            | `isolated`          | 専用の`cron:<jobId>`     | レポート、バックグラウンド作業 |
| 現在のセッション | `current`           | 作成時にバインド         | コンテキストを意識した定期作業 |
| カスタムセッション | `session:custom-id` | 永続的な名前付きセッション | 履歴を活用するワークフロー     |

**メインセッション**ジョブはシステムイベントをキューに追加し、必要に応じてheartbeatを起動します（`--wake now`または`--wake next-heartbeat`）。**分離**ジョブは新しいセッションで専用のエージェントターンを実行します。**カスタムセッション**（`session:xxx`）は実行間でコンテキストを保持するため、以前の要約をもとに構築する日次スタンドアップのようなワークフローを実現できます。

分離ジョブでは、ランタイムのティアダウンにそのcronセッションのベストエフォートなブラウザークリーンアップが含まれるようになりました。クリーンアップ失敗は無視されるため、実際のcron結果が優先されます。

分離されたcron実行でsubagentをオーケストレーションする場合、配信では古い親の中間テキストよりも最終的な子孫出力が優先されます。子孫がまだ実行中の場合、OpenClawはその部分的な親更新を通知せず抑制します。

### 分離ジョブのペイロードオプション

- `--message`: プロンプトテキスト（分離では必須）
- `--model` / `--thinking`: モデルおよび思考レベルのオーバーライド
- `--light-context`: ワークスペースのブートストラップファイル注入をスキップ
- `--tools exec,read`: ジョブで使用できるツールを制限

`--model`は、そのジョブに対して選択された許可済みモデルを使用します。要求されたモデルが許可されていない場合、cronは警告を記録し、代わりにジョブのagent/defaultモデル選択にフォールバックします。設定済みのフォールバックチェーンは引き続き適用されますが、明示的なジョブ単位のフォールバックリストがない単純なモデルオーバーライドでは、agent primaryが隠れた追加再試行先として付加されなくなりました。

分離ジョブのモデル選択優先順位は次のとおりです。

1. Gmailフックのモデルオーバーライド（実行がGmail由来で、そのオーバーライドが許可されている場合）
2. ジョブ単位ペイロードの`model`
3. 保存済みcronセッションのモデルオーバーライド
4. Agent/defaultモデル選択

Fast modeも解決された実際の選択に従います。選択されたモデル設定に`params.fastMode`がある場合、分離cronはデフォルトでそれを使用します。保存済みセッションの`fastMode`オーバーライドは、どちらの方向でも設定より優先されます。

分離実行がライブのモデル切り替えハンドオフに遭遇した場合、cronは切り替え後のprovider/modelで再試行し、そのライブ選択を再試行前に永続化します。切り替えに新しい認証プロファイルも含まれる場合、cronはその認証プロファイルのオーバーライドも永続化します。再試行回数には上限があります。初回試行に加えて切り替え再試行を2回行った後は、無限ループを避けるためcronは中止します。

## 配信と出力

| モード      | 動作                                                     |
| ----------- | -------------------------------------------------------- |
| `announce`  | ターゲットチャンネルに要約を配信（分離のデフォルト）     |
| `webhook`   | 完了イベントのペイロードをURLにPOST                      |
| `none`      | 内部のみ、配信なし                                       |

チャンネル配信には`--announce --channel telegram --to "-1001234567890"`を使用します。Telegramフォーラムトピックでは`-1001234567890:topic:123`を使用してください。Slack/Discord/Mattermostターゲットでは明示的なプレフィックス（`channel:<id>`、`user:<id>`）を使用する必要があります。

cronが所有する分離ジョブでは、runnerが最終配信経路を管理します。agentにはプレーンテキストの要約を返すようプロンプトが与えられ、その要約が`announce`、`webhook`を通じて送信されるか、`none`の場合は内部に保持されます。`--no-deliver`は配信をagentに戻しません。実行を内部のみのままにします。

元のタスクで明示的に外部の受信者へメッセージ送信するよう指定されている場合、agentは直接送信を試みるのではなく、そのメッセージを誰に／どこへ送るべきかを出力内に記す必要があります。

失敗通知は別の宛先経路に従います。

- `cron.failureDestination`は失敗通知のグローバルデフォルトを設定します。
- `job.delivery.failureDestination`はジョブ単位でそれを上書きします。
- どちらも設定されておらず、かつジョブがすでに`announce`で配信している場合、失敗通知はそのプライマリのannounceターゲットにフォールバックするようになりました。
- `delivery.failureDestination`は、プライマリ配信モードが`webhook`でない限り、`sessionTarget="isolated"`ジョブでのみサポートされます。

## CLIの例

1回限りのリマインダー（メインセッション）:

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

配信付きの定期分離ジョブ:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

モデルおよびthinkingオーバーライド付きの分離ジョブ:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Webhook

Gatewayは外部トリガー向けにHTTP Webhookエンドポイントを公開できます。configで有効にします。

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### 認証

すべてのリクエストには、ヘッダー経由でフックトークンを含める必要があります。

- `Authorization: Bearer <token>`（推奨）
- `x-openclaw-token: <token>`

クエリ文字列トークンは拒否されます。

### POST /hooks/wake

メインセッション向けにシステムイベントをキューに追加します。

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text`（必須）: イベントの説明
- `mode`（任意）: `now`（デフォルト）または`next-heartbeat`

### POST /hooks/agent

分離されたagentターンを実行します。

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

フィールド: `message`（必須）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

### マップされたフック（POST /hooks/\<name\>）

カスタムフック名は、config内の`hooks.mappings`によって解決されます。マッピングはテンプレートやコード変換を使って、任意のペイロードを`wake`または`agent`アクションに変換できます。

### セキュリティ

- フックエンドポイントはloopback、tailnet、または信頼できるリバースプロキシの背後に置いてください。
- 専用のフックトークンを使用し、Gateway認証トークンを再利用しないでください。
- `hooks.path`は専用のサブパスにしてください。`/`は拒否されます。
- 明示的な`agentId`ルーティングを制限するには`hooks.allowedAgentIds`を設定してください。
- 呼び出し元がセッションを選択する必要がない限り、`hooks.allowRequestSessionKey=false`のままにしてください。
- `hooks.allowRequestSessionKey`を有効にする場合は、許可されるセッションキー形状を制約するために`hooks.allowedSessionKeyPrefixes`も設定してください。
- フックペイロードはデフォルトで安全境界でラップされます。

## Gmail PubSub統合

Google PubSubを通じてGmail受信トリガーをOpenClawに接続します。

**前提条件**: `gcloud` CLI、`gog`（gogcli）、OpenClaw hooksが有効、公開HTTPSエンドポイント用のTailscale。

### ウィザードセットアップ（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

これにより`hooks.gmail` configが書き込まれ、Gmailプリセットが有効化され、プッシュエンドポイントにはTailscale Funnelが使用されます。

### Gateway自動起動

`hooks.enabled=true`かつ`hooks.gmail.account`が設定されている場合、Gatewayは起動時に`gog gmail watch serve`を開始し、watchを自動更新します。無効にするには`OPENCLAW_SKIP_GMAIL_WATCHER=1`を設定してください。

### 手動による1回限りのセットアップ

1. `gog`で使用されるOAuthクライアントを所有するGCPプロジェクトを選択します。

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. トピックを作成し、Gmailのpushアクセス権を付与します。

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. watchを開始します。

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Gmailモデルオーバーライド

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## ジョブの管理

```bash
# すべてのジョブを一覧表示
openclaw cron list

# ジョブを編集
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# ジョブを今すぐ強制実行
openclaw cron run <jobId>

# 期限到来時のみ実行
openclaw cron run <jobId> --due

# 実行履歴を表示
openclaw cron runs --id <jobId> --limit 50

# ジョブを削除
openclaw cron remove <jobId>

# Agent選択（マルチagentセットアップ）
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

モデルオーバーライドに関する注意:

- `openclaw cron add|edit --model ...`はジョブの選択モデルを変更します。
- モデルが許可されている場合、その正確なprovider/modelが分離agent実行に渡されます。
- 許可されていない場合、cronは警告を出し、ジョブのagent/defaultモデル選択にフォールバックします。
- 設定済みのフォールバックチェーンは引き続き適用されますが、明示的なジョブ単位のフォールバックリストがない単純な`--model`オーバーライドでは、agent primaryに暗黙の追加再試行先としてフォールスルーしなくなりました。

## 設定

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

cronを無効化するには: `cron.enabled: false`または`OPENCLAW_SKIP_CRON=1`。

**1回限りの再試行**: 一時的なエラー（レート制限、過負荷、ネットワーク、サーバーエラー）は指数バックオフで最大3回まで再試行されます。永続的なエラーは即座に無効化されます。

**定期実行の再試行**: 再試行間には指数バックオフ（30秒〜60分）が適用されます。次に成功した実行の後でバックオフはリセットされます。

**メンテナンス**: `cron.sessionRetention`（デフォルト`24h`）は分離実行セッションエントリーを剪定します。`cron.runLog.maxBytes` / `cron.runLog.keepLines`は実行ログファイルを自動的に剪定します。

## トラブルシューティング

### コマンド一覧

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

### cronが実行されない

- `cron.enabled`と`OPENCLAW_SKIP_CRON`環境変数を確認してください。
- Gatewayが継続的に実行中であることを確認してください。
- `cron`スケジュールでは、タイムゾーン（`--tz`）とホストのタイムゾーンの違いを確認してください。
- 実行出力の`reason: not-due`は、手動実行が`openclaw cron run <jobId> --due`で確認され、そのジョブがまだ期限前だったことを意味します。

### cronは実行されたが配信されない

- 配信モードが`none`の場合、外部メッセージは送信されません。
- 配信ターゲットが欠落または無効（`channel`/`to`）な場合、送信はスキップされます。
- チャンネル認証エラー（`unauthorized`、`Forbidden`）は、認証情報によって配信がブロックされたことを意味します。
- 分離実行がサイレントトークン（`NO_REPLY` / `no_reply`）のみを返した場合、OpenClawは直接の外向き配信を抑制し、フォールバックのキュー要約経路も抑制するため、チャットには何も投稿されません。
- cronが所有する分離ジョブでは、agentがフォールバックとしてmessageツールを使うことは想定しないでください。runnerが最終配信を管理します。`--no-deliver`は直接送信を許可するのではなく、内部のまま保持します。

### タイムゾーンの注意点

- `--tz`なしのcronはGatewayホストのタイムゾーンを使用します。
- タイムゾーンなしの`at`スケジュールはUTCとして扱われます。
- Heartbeatの`activeHours`は設定済みタイムゾーン解決を使用します。

## 関連

- [Automation & Tasks](/automation) — すべての自動化メカニズムの概要
- [Background Tasks](/automation/tasks) — cron実行のタスク台帳
- [Heartbeat](/gateway/heartbeat) — 定期的なメインセッションターン
- [Timezone](/concepts/timezone) — タイムゾーン設定
