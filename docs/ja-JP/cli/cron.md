---
read_when:
    - スケジュールされたジョブやウェイクアップを使いたいとき
    - cronの実行とログをデバッグしているとき
summary: '`openclaw cron`のCLIリファレンス（バックグラウンドジョブのスケジュールと実行）'
title: cron
x-i18n:
    generated_at: "2026-04-05T12:38:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: f74ec8847835f24b3970f1b260feeb69c7ab6c6ec7e41615cbb73f37f14a8112
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gatewayスケジューラーのcronジョブを管理します。

関連:

- Cronジョブ: [Cron jobs](/automation/cron-jobs)

ヒント: 完全なコマンド一覧については`openclaw cron --help`を実行してください。

注: 分離された`cron add`ジョブは、デフォルトで`--announce`配信を使用します。出力を内部のみに保つには`--no-deliver`を使用してください。
`--deliver`は引き続き`--announce`の非推奨エイリアスとして残っています。

注: cronが所有する分離実行はプレーンテキストの要約を想定しており、最終送信経路はランナーが管理します。
`--no-deliver`は実行を内部のみに保ちますが、配信をエージェントのメッセージツールへ戻すわけではありません。

注: one-shot（`--at`）ジョブは、デフォルトで成功後に削除されます。保持するには`--keep-after-run`を使用してください。

注: `--session`は`main`、`isolated`、`current`、`session:<id>`をサポートします。
作成時点のアクティブセッションにバインドするには`current`を使用し、
明示的な永続セッションキーには`session:<id>`を使用してください。

注: one-shot CLIジョブでは、オフセットなしの`--at`日時は、`--tz <iana>`も渡さない限りUTCとして扱われます。
`--tz <iana>`を渡すと、そのローカル壁時計時刻を指定タイムゾーンで解釈します。

注: 定期ジョブは、連続エラー後に指数バックオフによる再試行を使用するようになりました（30秒 → 1分 → 5分 → 15分 → 60分）。次に成功すると通常スケジュールに戻ります。

注: `openclaw cron run`は、手動実行がキューに入った時点ですぐに返るようになりました。成功レスポンスには`{ ok: true, enqueued: true, runId }`が含まれます。最終結果を追跡するには`openclaw cron runs --id <job-id>`を使用してください。

注: `openclaw cron run <job-id>`はデフォルトで強制実行します。
従来の「期限が来ている場合のみ実行」動作を維持するには`--due`を使用してください。

注: 分離されたcronターンでは、古くなった確認のみの返信は抑制されます。最初の結果が単なる中間ステータス更新であり、最終回答に責任を持つ子孫subagent実行がない場合、cronは配信前に実際の結果を得るため一度だけ再プロンプトします。

注: 分離実行がサイレントトークンのみ（`NO_REPLY` /
`no_reply`）を返した場合、cronは直接の送信配信とフォールバックのキュー要約経路の両方を抑制するため、チャットには何も投稿されません。

注: `cron add|edit --model ...`は、そのジョブに対して選択された許可済みモデルを使用します。
モデルが許可されていない場合、cronは警告を出し、代わりにジョブのエージェント/デフォルトの
モデル選択へフォールバックします。設定済みのフォールバックチェーンは引き続き適用されますが、明示的なジョブごとのフォールバックリストのない単純なモデル上書きでは、エージェントのプライマリが隠れた追加再試行ターゲットとして付与されなくなりました。

注: 分離cronのモデル優先順位は、Gmail-hook上書きが最優先で、その次にジョブごとの
`--model`、その次に保存されたcronセッションのモデル上書き、最後に通常の
エージェント/デフォルト選択です。

注: 分離cronのfast modeは、解決されたライブモデル選択に従います。モデル設定の
`params.fastMode`はデフォルトで適用されますが、保存されたセッションの`fastMode`
上書きは引き続き設定より優先されます。

注: 分離実行が`LiveSessionModelSwitchError`を投げた場合、cronは
再試行前に切り替え後のprovider/model（および存在する場合は切り替え後のauth profile上書き）を永続化します。外側の再試行ループは、初回試行後に最大2回の切り替え再試行に制限され、それ以降は無限ループせず中止します。

注: 失敗通知は、まず`delivery.failureDestination`、次に
グローバルの`cron.failureDestination`を使用し、明示的な失敗通知先が設定されていない場合は、最後にジョブのプライマリ
announceターゲットへフォールバックします。

注: 保持/剪定は設定で制御されます。

- `cron.sessionRetention`（デフォルト`24h`）は、完了した分離実行セッションを剪定します。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`は`~/.openclaw/cron/runs/<jobId>.jsonl`を剪定します。

アップグレード注記: 現在の配信/保存形式より前の古いcronジョブがある場合は、
`openclaw doctor --fix`を実行してください。Doctorは現在、レガシーなcronフィールド（`jobId`、`schedule.cron`、
トップレベルの配信フィールド（レガシーな`threadId`を含む）、ペイロードの`provider`配信エイリアス）を正規化し、
`cron.webhook`が設定されている場合は、単純な`notify: true` webhookフォールバックジョブを
明示的なwebhook配信へ移行します。

## よくある編集

メッセージを変更せずに配信設定を更新する:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

分離ジョブの配信を無効にする:

```bash
openclaw cron edit <job-id> --no-deliver
```

分離ジョブで軽量なブートストラップコンテキストを有効にする:

```bash
openclaw cron edit <job-id> --light-context
```

特定のチャンネルへannounceする:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

軽量なブートストラップコンテキスト付きの分離ジョブを作成する:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context`は分離されたagent-turnジョブにのみ適用されます。cron実行では、軽量モードは完全なワークスペースのブートストラップセットを注入する代わりに、ブートストラップコンテキストを空に保ちます。

配信所有権に関する注記:

- cronが所有する分離ジョブは、最終的にユーザーに見える配信を常に
  cronランナー（`announce`、`webhook`、または内部専用の`none`）経由でルーティングします。
- タスクが何らかの外部受信者へのメッセージ送信に言及している場合、エージェントは
  それを直接送信しようとせず、結果の中で意図した送信先を説明するべきです。

## よくある管理コマンド

手動実行:

```bash
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

エージェント/セッションの再ターゲット:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

配信の調整:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

失敗時配信に関する注記:

- `delivery.failureDestination`は分離ジョブでサポートされています。
- メインセッションジョブでは、プライマリ
  配信モードが`webhook`の場合にのみ`delivery.failureDestination`を使用できます。
- 失敗通知先を何も設定せず、ジョブがすでにある
  チャンネルにannounceしている場合、失敗通知は同じannounceターゲットを再利用します。
