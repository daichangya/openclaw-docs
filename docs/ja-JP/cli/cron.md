---
read_when:
    - スケジュールされたジョブとウェイクアップが必要です
    - Cronの実行とログをデバッグしています
summary: '`openclaw cron` のCLIリファレンス（バックグラウンドジョブのスケジュールと実行）'
title: Cron
x-i18n:
    generated_at: "2026-04-26T11:26:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55cadcf73550367d399b7ca78e842f12a8113f2ec8749f59dadf2bbb5f8417ae
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gateway schedulerのCronジョブを管理します。

関連:

- Cronジョブ: [Cron jobs](/ja-JP/automation/cron-jobs)

ヒント: 完全なコマンド一覧は `openclaw cron --help` を実行してください。

注: `openclaw cron list` と `openclaw cron show <job-id>` は、解決済みの配信ルートをプレビューします。`channel: "last"` の場合、プレビューには、ルートがmain/current sessionから解決されたか、fail closedになるかが表示されます。

注: 分離された `cron add` ジョブはデフォルトで `--announce` 配信になります。出力を内部だけに保持するには `--no-deliver` を使ってください。`--deliver` は引き続き `--announce` の非推奨エイリアスとして残っています。

注: 分離されたcronチャット配信は共有です。`--announce` は最終返信に対するrunner fallback配信で、`--no-deliver` はそのfallbackを無効化しますが、チャットルートが利用可能な場合でもエージェントの `message` tool を削除するわけではありません。

注: one-shot（`--at`）ジョブは、デフォルトで成功後に削除されます。保持するには `--keep-after-run` を使ってください。

注: `--session` は `main`、`isolated`、`current`、`session:<id>` をサポートします。作成時点でアクティブなsessionに紐付けるには `current` を、明示的な永続sessionキーには `session:<id>` を使ってください。

注: `--session isolated` は実行ごとに新しいtranscript/session idを作成します。安全な設定や明示的にユーザーが選択したmodel/auth overrideは引き継がれることがありますが、周辺の会話コンテキストは引き継がれません。channel/group routing、send/queue policy、elevation、origin、ACP runtime bindingは新しい分離実行のためにリセットされます。

注: one-shotのCLIジョブでは、offsetなしの `--at` datetimeは、`--tz <iana>` も一緒に渡さない限りUTCとして扱われます。`--tz <iana>` を指定すると、そのtimezoneでのローカル壁時計時刻として解釈されます。

注: 定期実行ジョブは、連続エラー後に指数バックオフによる再試行を行うようになりました（30s → 1m → 5m → 15m → 60m）。次に成功した実行後は通常スケジュールに戻ります。

注: `openclaw cron run` は、手動実行がキューに入った時点ですぐに戻るようになりました。成功時のレスポンスには `{ ok: true, enqueued: true, runId }` が含まれます。最終結果は `openclaw cron runs --id <job-id>` で追跡してください。

注: `openclaw cron run <job-id>` はデフォルトで強制実行します。以前の「期限が来ているときだけ実行する」動作を維持するには `--due` を使ってください。

注: 分離されたcronターンでは、古くなった確認専用の返信が抑制されます。最初の結果が単なる中間ステータス更新で、最終回答に対して子孫subagent実行が責任を持たない場合、cronは配信前に実際の結果を得るため再度1回だけ再プロンプトします。

注: 分離されたcron実行がサイレントトークン（`NO_REPLY` / `no_reply`）だけを返した場合、cronは直接の送信配信とfallbackのキュー済み要約パスの両方を抑制するため、チャットには何も投稿されません。

注: `cron add|edit --model ...` は、そのジョブに対して選択された許可済みmodelを使用します。modelが許可されていない場合、cronは警告を出し、代わりにジョブのagent/default model選択へフォールバックします。設定済みのfallback chainは引き続き適用されますが、明示的なジョブごとのfallback listがない単純なmodel overrideでは、agent primaryはもはや隠れた追加再試行先として付加されません。

注: 分離cronのmodel優先順位は、まずGmail-hook override、その次にジョブごとの `--model`、その次にユーザー選択済みで保存されたcron-session model override、最後に通常のagent/default選択です。

注: 分離cronのfast modeは、解決されたlive model選択に従います。model configの `params.fastMode` はデフォルトで適用されますが、保存されたsessionの `fastMode` overrideがある場合は、それがconfigより優先されます。

注: 分離実行が `LiveSessionModelSwitchError` を投げた場合、cronは再試行前に、切り替え後のprovider/model（存在する場合は切り替え後のauth profile overrideも）をアクティブな実行用に永続化します。外側の再試行ループは、初回試行後に最大2回のswitch retryに制限され、それを超えると無限ループせず中止します。

注: 失敗通知は、まず `delivery.failureDestination`、次にグローバルの `cron.failureDestination` を使い、明示的な失敗通知先が設定されていない場合は、最後にジョブのprimary announce targetへフォールバックします。

注: 保持/削除は設定で制御します:

- `cron.sessionRetention`（デフォルト `24h`）は、完了した分離実行sessionを削除します。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` は `~/.openclaw/cron/runs/<jobId>.jsonl` を削除します。

アップグレード注記: 現在の配信/保存形式より前の古いcronジョブがある場合は、`openclaw doctor --fix` を実行してください。doctorは現在、古いcronフィールド（`jobId`、`schedule.cron`、古い `threadId` を含むトップレベル配信フィールド、payloadの `provider` 配信エイリアス）を正規化し、`cron.webhook` が設定されている場合は単純な `notify: true` のWebhook fallbackジョブを明示的なWebhook配信へ移行します。

## よくある編集

メッセージを変えずに配信設定を更新します:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

分離ジョブの配信を無効にします:

```bash
openclaw cron edit <job-id> --no-deliver
```

分離ジョブで軽量bootstrap contextを有効にします:

```bash
openclaw cron edit <job-id> --light-context
```

特定のチャンネルにannounceします:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

軽量bootstrap context付きの分離ジョブを作成します:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` は分離されたagent-turnジョブにのみ適用されます。cron実行では、lightweight modeは完全なworkspace bootstrapセットを注入する代わりに、bootstrap contextを空に保ちます。

配信オーナーシップに関する注記:

- 分離されたcronチャット配信は共有です。チャットルートが利用可能な場合、エージェントは `message` tool で直接送信できます。
- `announce` は、エージェントが解決済みターゲットへ直接送信しなかった場合にのみ、最終返信をfallback配信します。`webhook` は完了したpayloadをURLへPOSTします。`none` はrunner fallback配信を無効にします。
- アクティブなチャットから作成されたreminderは、fallback announce配信のためにlive chat配信ターゲットを保持します。内部sessionキーは小文字になる場合がありますが、Matrix room IDのような大文字小文字を区別するprovider IDの信頼できる情報源として使わないでください。

## よく使う管理コマンド

手動実行:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` のエントリーには、意図されたcronターゲット、解決済みターゲット、message-tool送信、fallback使用、配信済み状態を含む配信診断が含まれます。

agent/sessionの再ターゲット:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

配信調整:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

失敗時配信に関する注記:

- `delivery.failureDestination` は分離ジョブでサポートされています。
- main-sessionジョブでは、primary配信モードが `webhook` の場合にのみ `delivery.failureDestination` を使えます。
- 失敗通知先を何も設定しておらず、かつジョブがすでにチャンネルへannounceする場合、失敗通知は同じannounceターゲットを再利用します。

## 関連

- [CLI reference](/ja-JP/cli)
- [Scheduled tasks](/ja-JP/automation/cron-jobs)
