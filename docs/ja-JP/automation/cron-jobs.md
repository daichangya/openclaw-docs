---
read_when:
    - バックグラウンドジョブまたはウェイクアップのスケジュール設定
    - 外部トリガー（Webhook、Gmail）をOpenClawに接続する
    - スケジュールされたタスクでHeartbeatとCronのどちらを使うかを決める
summary: Gateway スケジューラのスケジュールされたジョブ、Webhook、Gmail PubSub トリガー
title: スケジュールされたタスク
x-i18n:
    generated_at: "2026-04-25T13:40:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed4dc7222b601b37d98cf1575ced7fd865987882a8c5b28245c5d2423b4cc56
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron は Gateway に組み込まれたスケジューラです。ジョブを永続化し、適切な時間にエージェントを起動し、出力をチャットチャネルや Webhook エンドポイントに返すことができます。

## クイックスタート

```bash
# 1 回限りのリマインダーを追加
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# ジョブを確認
openclaw cron list
openclaw cron show <job-id>

# 実行履歴を表示
openclaw cron runs --id <job-id>
```

## Cron の仕組み

- Cron は**Gateway プロセス内**で実行されます（モデル内ではありません）。
- ジョブ定義は `~/.openclaw/cron/jobs.json` に永続化されるため、再起動してもスケジュールは失われません。
- 実行時の実行状態は、その隣の `~/.openclaw/cron/jobs-state.json` に永続化されます。cron 定義を git で管理する場合は、`jobs.json` を追跡し、`jobs-state.json` は gitignore に追加してください。
- 分離後、古い OpenClaw バージョンでも `jobs.json` は読み取れますが、実行時フィールドが `jobs-state.json` に移ったため、ジョブを新規として扱うことがあります。
- すべての cron 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) レコードを作成します。
- 1 回限りのジョブ（`--at`）は、デフォルトで成功後に自動削除されます。
- 分離 cron 実行では、完了時にその `cron:<jobId>` セッション用の追跡対象ブラウザタブ/プロセスをベストエフォートで閉じるため、分離されたブラウザ自動化で孤立プロセスが残りません。
- 分離 cron 実行では、古い確認応答リプライに対する保護も行います。最初の結果が単なる中間ステータス更新（`on it`、`pulling everything together`、および同様のヒント）であり、最終回答を担当する子孫サブエージェント実行が残っていない場合、OpenClaw は配信前に実際の結果を得るために 1 回だけ再プロンプトします。

<a id="maintenance"></a>

cron のタスク整合はランタイム所有です。古い子セッション行が残っていても、cron ランタイムがそのジョブを実行中として追跡している間は、アクティブな cron タスクは生存状態を保ちます。
ランタイムがそのジョブの所有をやめ、5 分間の猶予期間が過ぎると、メンテナンスによってタスクは `lost` とマークされることがあります。

## スケジュールの種類

| 種類    | CLI フラグ | 説明                                                    |
| ------- | ---------- | ------------------------------------------------------- |
| `at`    | `--at`     | 1 回限りのタイムスタンプ（ISO 8601 または `20m` のような相対指定） |
| `every` | `--every`  | 固定間隔                                                |
| `cron`  | `--cron`   | 5 フィールドまたは 6 フィールドの cron 式（任意の `--tz` 付き） |

タイムゾーンのないタイムスタンプは UTC として扱われます。ローカルの壁時計時刻でのスケジュールには `--tz America/New_York` を追加してください。

毎時ちょうどの繰り返し式は、負荷の急増を減らすために自動的に最大 5 分までずらされます。正確な時刻を強制するには `--exact` を使うか、明示的なウィンドウとして `--stagger 30s` を使ってください。

### 日付と曜日は OR ロジックを使います

Cron 式は [croner](https://github.com/Hexagon/croner) によって解析されます。日付フィールドと曜日フィールドの両方がワイルドカード以外の場合、croner は**どちらか一方**が一致したときに一致とみなします。両方一致ではありません。これは標準的な Vixie cron の動作です。

```
# 意図: 「15 日の午前 9 時、かつ月曜日の場合のみ」
# 実際: 「毎月 15 日の午前 9 時」と「毎週月曜日の午前 9 時」
0 9 15 * 1
```

この式は、月 0〜1 回ではなく、月に約 5〜6 回実行されます。OpenClaw はここで Croner のデフォルト OR 動作を使います。両方の条件を必須にするには、Croner の `+` 曜日修飾子（`0 9 15 * +1`）を使うか、片方のフィールドだけでスケジュールし、もう片方はジョブのプロンプトやコマンド内でガードしてください。

## 実行スタイル

| スタイル        | `--session` の値    | 実行場所                 | 最適な用途                      |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| メインセッション | `main`              | 次の Heartbeat ターン     | リマインダー、システムイベント   |
| 分離            | `isolated`          | 専用の `cron:<jobId>`    | レポート、バックグラウンド作業   |
| 現在のセッション | `current`           | 作成時にバインド         | コンテキスト依存の定期作業       |
| カスタムセッション | `session:custom-id` | 永続的な名前付きセッション | 履歴を積み上げるワークフロー     |

**メインセッション**のジョブはシステムイベントをキューに入れ、必要に応じて Heartbeat を起動します（`--wake now` または `--wake next-heartbeat`）。**分離**ジョブは、新しいセッションで専用のエージェントターンを実行します。**カスタムセッション**（`session:xxx`）は実行間でコンテキストを維持するため、以前の要約を積み重ねる日次スタンドアップのようなワークフローが可能です。

分離ジョブにおける「新しいセッション」とは、各実行ごとに新しい transcript/session id を意味します。OpenClaw は thinking/fast/verbose 設定、ラベル、明示的にユーザーが選択した model/auth のオーバーライドなどの安全な設定を引き継ぐことがありますが、古い cron 行から周辺の会話コンテキストは引き継ぎません。つまり、チャネル/グループのルーティング、送信またはキューポリシー、昇格、起点、ACP ランタイムバインディングは継承されません。定期ジョブで同じ会話コンテキストを意図的に積み上げたい場合は、`current` または `session:<id>` を使ってください。

分離ジョブでは、ランタイム終了処理にその cron セッションのブラウザクリーンアップのベストエフォートも含まれます。クリーンアップの失敗は無視されるため、実際の cron 結果が優先されます。

分離 cron 実行では、そのジョブ用に作成されたバンドル済み MCP ランタイムインスタンスも、共有ランタイムクリーンアップ経路を通じて破棄されます。これはメインセッションおよびカスタムセッションの MCP クライアントが終了処理される方法と一致するため、分離 cron ジョブで stdio 子プロセスや長寿命の MCP 接続が実行間でリークしません。

分離 cron 実行でサブエージェントをオーケストレーションする場合、配信では古い親の中間テキストよりも最終的な子孫出力が優先されます。子孫がまだ実行中であれば、OpenClaw はその部分的な親更新を通知せずに抑制します。

テキストのみの Discord announce ターゲットでは、OpenClaw はストリーム/中間テキストのペイロードと最終回答の両方を再送するのではなく、正規の最終 assistant テキストを 1 回だけ送信します。メディアおよび構造化された Discord ペイロードは、添付ファイルやコンポーネントが失われないよう引き続き別個のペイロードとして配信されます。

### 分離ジョブのペイロードオプション

- `--message`: プロンプトテキスト（分離では必須）
- `--model` / `--thinking`: model と thinking レベルのオーバーライド
- `--light-context`: ワークスペースのブートストラップファイル注入をスキップ
- `--tools exec,read`: ジョブが使えるツールを制限

`--model` は、そのジョブで選択された許可済み model を使います。要求された model が許可されていない場合、cron は警告を記録し、そのジョブの agent/default model 選択にフォールバックします。設定済みのフォールバックチェーンは引き続き適用されますが、ジョブごとの明示的なフォールバックリストがない単純な model オーバーライドでは、agent primary が隠れた追加リトライ先として付加されることはなくなりました。

分離ジョブの model 選択の優先順位は次のとおりです。

1. Gmail フックの model オーバーライド（実行が Gmail 由来で、そのオーバーライドが許可されている場合）
2. ジョブごとのペイロード `model`
3. ユーザーが選択した保存済み cron セッションの model オーバーライド
4. Agent/default model 選択

Fast mode も、解決されたライブ選択に従います。選択された model 設定に `params.fastMode` がある場合、分離 cron はそれをデフォルトで使います。保存済みセッションの `fastMode` オーバーライドは、どちらの方向でも設定より優先されます。

分離実行でライブ model-switch ハンドオフが発生した場合、cron は切り替えられた provider/model でリトライし、リトライ前にそのライブ選択をアクティブな実行用として永続化します。切り替えで新しい auth profile も伴う場合、cron はその auth profile オーバーライドもアクティブな実行用として永続化します。リトライには上限があり、初回試行に加えて 2 回の switch リトライの後、cron は無限ループする代わりに中止します。

## 配信と出力

| モード     | 動作内容                                                          |
| ---------- | ----------------------------------------------------------------- |
| `announce` | エージェントが送信しなかった場合、ターゲットへ最終テキストをフォールバック配信 |
| `webhook`  | 完了イベントのペイロードを URL へ POST                            |
| `none`     | ランナーによるフォールバック配信なし                              |

チャネル配信には `--announce --channel telegram --to "-1001234567890"` を使います。Telegram フォーラムトピックでは `-1001234567890:topic:123` を使ってください。Slack/Discord/Mattermost のターゲットでは、明示的な接頭辞（`channel:<id>`、`user:<id>`）を使う必要があります。

分離ジョブでは、チャット配信は共有されます。チャットルートが利用可能なら、ジョブが `--no-deliver` を使っていても、エージェントは `message` ツールを使えます。エージェントが設定済み/現在のターゲットに送信した場合、OpenClaw はフォールバック announce をスキップします。そうでなければ、`announce`、`webhook`、`none` は、エージェントターン後の最終リプライをランナーがどう扱うかだけを制御します。

失敗通知は別の宛先経路に従います。

- `cron.failureDestination` は失敗通知のグローバルデフォルトを設定します。
- `job.delivery.failureDestination` はジョブごとにそれを上書きします。
- どちらも設定されておらず、ジョブがすでに `announce` で配信している場合、失敗通知はそのプライマリな announce ターゲットにフォールバックするようになりました。
- `delivery.failureDestination` は、プライマリ配信モードが `webhook` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。

## CLI の例

1 回限りのリマインダー（メインセッション）:

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

model と thinking のオーバーライド付き分離ジョブ:

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

Gateway は外部トリガー用の HTTP Webhook エンドポイントを公開できます。config で有効にします。

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

クエリ文字列のトークンは拒否されます。

### POST /hooks/wake

メインセッション用のシステムイベントをキューに入れます。

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text`（必須）: イベントの説明
- `mode`（任意）: `now`（デフォルト）または `next-heartbeat`

### POST /hooks/agent

分離されたエージェントターンを実行します。

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

フィールド: `message`（必須）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

### マップ済みフック（POST /hooks/\<name\>）

カスタムフック名は、config の `hooks.mappings` を通じて解決されます。マッピングでは、テンプレートまたはコード変換を使って任意のペイロードを `wake` または `agent` アクションへ変換できます。

### セキュリティ

- フックエンドポイントは loopback、tailnet、または信頼できるリバースプロキシの背後に置いてください。
- 専用のフックトークンを使ってください。gateway の auth トークンを再利用しないでください。
- `hooks.path` は専用のサブパスにしてください。`/` は拒否されます。
- 明示的な `agentId` ルーティングを制限するには `hooks.allowedAgentIds` を設定してください。
- 呼び出し元が選択したセッションが必要でない限り、`hooks.allowRequestSessionKey=false` のままにしてください。
- `hooks.allowRequestSessionKey` を有効にする場合は、許可される session key の形を制約するために `hooks.allowedSessionKeyPrefixes` も設定してください。
- フックのペイロードは、デフォルトで安全境界に包まれます。

## Gmail PubSub 連携

Google PubSub を介して Gmail の受信トリガーを OpenClaw に接続します。

**前提条件**: `gcloud` CLI、`gog`（gogcli）、OpenClaw hooks が有効であること、公開 HTTPS エンドポイント用の Tailscale。

### ウィザード設定（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

これにより `hooks.gmail` config が書き込まれ、Gmail プリセットが有効になり、プッシュエンドポイントに Tailscale Funnel が使われます。

### Gateway の自動起動

`hooks.enabled=true` かつ `hooks.gmail.account` が設定されている場合、Gateway は起動時に `gog gmail watch serve` を開始し、watch を自動更新します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。

### 手動による 1 回限りのセットアップ

1. `gog` が使う OAuth クライアントを所有している GCP プロジェクトを選択します。

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. トピックを作成し、Gmail に push アクセス権を付与します。

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. watch を開始します。

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Gmail model オーバーライド

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

# 1 つのジョブを表示（解決済みの配信ルートを含む）
openclaw cron show <jobId>

# ジョブを編集
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# ジョブを今すぐ強制実行
openclaw cron run <jobId>

# 期限が来ている場合のみ実行
openclaw cron run <jobId> --due

# 実行履歴を表示
openclaw cron runs --id <jobId> --limit 50

# ジョブを削除
openclaw cron remove <jobId>

# agent の選択（マルチエージェント構成）
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

model オーバーライドに関する注意:

- `openclaw cron add|edit --model ...` は、ジョブの選択済み model を変更します。
- model が許可されている場合、その正確な provider/model が分離 agent 実行に渡されます。
- 許可されていない場合、cron は警告を出し、そのジョブの agent/default model 選択にフォールバックします。
- 設定済みのフォールバックチェーンは引き続き適用されますが、明示的なジョブごとのフォールバックリストがない単純な `--model` オーバーライドは、暗黙の追加リトライ先として agent primary へサイレントにフォールスルーしなくなりました。

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

ランタイム状態の sidecar は `cron.store` から導出されます。たとえば `~/clawd/cron/jobs.json` のような `.json` ストアは `~/clawd/cron/jobs-state.json` を使い、`.json` 接尾辞のないストアパスでは `-state.json` が追加されます。

cron を無効にするには、`cron.enabled: false` または `OPENCLAW_SKIP_CRON=1` を使います。

**1 回限りのリトライ**: 一時的なエラー（rate limit、overload、network、server error）は指数バックオフ付きで最大 3 回までリトライされます。恒久的なエラーは即座に無効化されます。

**定期ジョブのリトライ**: リトライ間では指数バックオフ（30 秒〜60 分）が使われます。バックオフは次回の成功実行後にリセットされます。

**メンテナンス**: `cron.sessionRetention`（デフォルト `24h`）は分離された実行セッションエントリを削除します。`cron.runLog.maxBytes` / `cron.runLog.keepLines` は実行ログファイルを自動的に削除します。

## トラブルシューティング

### コマンドの手順

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

### Cron が実行されない

- `cron.enabled` と `OPENCLAW_SKIP_CRON` 環境変数を確認してください。
- Gateway が継続的に実行されていることを確認してください。
- `cron` スケジュールでは、タイムゾーン（`--tz`）とホストのタイムゾーンの違いを確認してください。
- 実行出力の `reason: not-due` は、手動実行が `openclaw cron run <jobId> --due` で確認され、そのジョブの期限がまだ来ていなかったことを意味します。

### Cron は実行されたが配信されない

- 配信モード `none` は、ランナーによるフォールバック送信が想定されないことを意味します。チャットルートが利用可能なら、エージェントは引き続き `message` ツールで直接送信できます。
- 配信先が欠落または無効（`channel`/`to`）な場合、送信はスキップされます。
- チャネル認証エラー（`unauthorized`、`Forbidden`）は、資格情報によって配信がブロックされたことを意味します。
- 分離実行がサイレントトークン（`NO_REPLY` / `no_reply`）のみを返した場合、OpenClaw は直接の送信配信を抑制し、フォールバックのキュー済み要約経路も抑制するため、チャットには何も投稿されません。
- エージェント自身がユーザーにメッセージを送るべき場合は、そのジョブに利用可能なルート（以前のチャットがある `channel: "last"`、または明示的なチャネル/ターゲット）があることを確認してください。

### タイムゾーンの注意点

- `--tz` なしの Cron は gateway ホストのタイムゾーンを使います。
- タイムゾーンなしの `at` スケジュールは UTC として扱われます。
- Heartbeat `activeHours` は設定済みタイムゾーン解決を使います。

## 関連

- [Automation & Tasks](/ja-JP/automation) — すべての自動化の仕組みをひと目で確認
- [Background Tasks](/ja-JP/automation/tasks) — cron 実行のタスク台帳
- [Heartbeat](/ja-JP/gateway/heartbeat) — 定期的なメインセッションターン
- [Timezone](/ja-JP/concepts/timezone) — タイムゾーン設定
