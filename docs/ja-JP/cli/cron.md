---
read_when:
    - スケジュールされたジョブとウェイクアップを使いたい場合
    - Cron の実行とログをデバッグしている場合
summary: '`openclaw cron` の CLI リファレンス（バックグラウンドジョブのスケジュールと実行）'
title: Cron
x-i18n:
    generated_at: "2026-04-25T13:43:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 281c0e0e5a3139d2b9cb7cc02afe3b9a9d4a20228a7891eb45c55b7e22c5e1c4
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gateway スケジューラー用の Cron ジョブを管理します。

関連:

- Cron ジョブ: [Cron jobs](/ja-JP/automation/cron-jobs)

ヒント: 完全なコマンド一覧は `openclaw cron --help` を実行してください。

注: `openclaw cron list` と `openclaw cron show <job-id>` は、解決された配信ルートをプレビューします。`channel: "last"` の場合、プレビューにはメイン/現在のセッションからルートが解決されたか、または fail closed になるかが表示されます。

注: 分離された `cron add` ジョブは、デフォルトで `--announce` 配信になります。出力を内部のみに保つには `--no-deliver` を使用してください。`--deliver` は引き続き `--announce` の非推奨エイリアスとして残っています。

注: 分離された cron のチャット配信は共有されます。`--announce` は最終返信のランナーフォールバック配信であり、`--no-deliver` はそのフォールバックを無効にしますが、チャットルートが利用可能な場合にエージェントの `message` Tool を削除することはありません。

注: ワンショット（`--at`）ジョブは、デフォルトで成功後に削除されます。保持するには `--keep-after-run` を使用してください。

注: `--session` は `main`、`isolated`、`current`、`session:<id>` をサポートします。作成時点のアクティブセッションにバインドするには `current` を、明示的な永続セッションキーには `session:<id>` を使用してください。

注: `--session isolated` は、実行ごとに新しい transcript/session id を作成します。安全な設定や明示的にユーザーが選択したモデル/認証上書きは引き継がれることがありますが、周囲の会話コンテキストは引き継がれません。チャネル/グループルーティング、送信/キューポリシー、権限昇格、オリジン、ACP ランタイムバインディングは、新しい分離実行用にリセットされます。

注: ワンショット CLI ジョブでは、オフセットなしの `--at` 日時は、`--tz <iana>` も渡さない限り UTC として扱われます。`--tz <iana>` を指定した場合、そのローカル壁時計時刻は指定されたタイムゾーンで解釈されます。

注: 定期ジョブでは、連続エラー後に指数バックオフによるリトライが行われるようになりました（30秒 → 1分 → 5分 → 15分 → 60分）。次回成功後は通常スケジュールに戻ります。

注: `openclaw cron run` は、手動実行が実行キューに入った時点で返るようになりました。成功レスポンスには `{ ok: true, enqueued: true, runId }` が含まれます。最終結果の追跡には `openclaw cron runs --id <job-id>` を使用してください。

注: `openclaw cron run <job-id>` は、デフォルトで強制実行します。以前の「期限到来時のみ実行」動作を維持するには `--due` を使用してください。

注: 分離された cron ターンでは、古い確認専用の返信が抑制されます。最初の結果が単なる中間ステータス更新で、最終回答を担当する子孫サブエージェント実行が存在しない場合、cron は配信前に実際の結果を得るために1回だけ再プロンプトします。

注: 分離された cron 実行が silent token（`NO_REPLY` / `no_reply`）のみを返した場合、cron は直接の送信配信とフォールバックのキュー済みサマリーパスの両方を抑制するため、チャットには何も投稿されません。

注: `cron add|edit --model ...` は、そのジョブに対して選択された許可済みモデルを使用します。モデルが許可されていない場合、cron は警告を出し、代わりにジョブのエージェント/デフォルトモデル選択にフォールバックします。設定されたフォールバックチェーンは引き続き適用されますが、明示的なジョブごとのフォールバックリストがない単なるモデル上書きでは、エージェント primary は隠れた追加リトライ先としては追加されなくなりました。

注: 分離された cron のモデル優先順位は、最初に Gmail-hook 上書き、その次にジョブごとの `--model`、その次にユーザーが選択した保存済み cron-session モデル上書き、その後に通常のエージェント/デフォルト選択です。

注: 分離された cron の fast mode は、解決された live モデル選択に従います。モデル設定 `params.fastMode` がデフォルトで適用されますが、保存済みセッションの `fastMode` 上書きは引き続き設定より優先されます。

注: 分離実行が `LiveSessionModelSwitchError` を投げた場合、cron は再試行前に、アクティブ実行用の切り替え後 provider/model（および存在する場合は切り替え後 auth profile 上書き）を永続化します。外側のリトライループは、初回試行後2回の切り替えリトライに制限され、それ以上は無限ループせず中止します。

注: 失敗通知では、最初に `delivery.failureDestination`、次にグローバル `cron.failureDestination` が使用され、明示的な失敗宛先が設定されていない場合は最後にジョブの primary announce ターゲットにフォールバックします。

注: 保持/削除は設定で制御されます:

- `cron.sessionRetention`（デフォルト `24h`）は、完了した分離実行セッションを削除します。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` は、`~/.openclaw/cron/runs/<jobId>.jsonl` を削除します。

アップグレード注記: 現在の配信/保存形式より前の古い cron ジョブがある場合は、`openclaw doctor --fix` を実行してください。doctor は現在、レガシー cron フィールド（`jobId`、`schedule.cron`、レガシー `threadId` を含むトップレベル配信フィールド、payload の `provider` 配信エイリアス）を正規化し、`cron.webhook` が設定されている場合は、単純な `notify: true` Webhook フォールバックジョブを明示的な Webhook 配信へ移行します。

## よくある編集

メッセージを変更せずに配信設定を更新する:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

分離ジョブの配信を無効にする:

```bash
openclaw cron edit <job-id> --no-deliver
```

分離ジョブで軽量ブートストラップコンテキストを有効にする:

```bash
openclaw cron edit <job-id> --light-context
```

特定のチャネルに announce する:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

軽量ブートストラップコンテキストを持つ分離ジョブを作成する:

```bash
openclaw cron add \
  --name "軽量な朝のブリーフ" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "夜間の更新を要約してください。" \
  --light-context \
  --no-deliver
```

`--light-context` は、分離された agent-turn ジョブにのみ適用されます。cron 実行では、軽量モードは完全なワークスペースブートストラップセットを注入する代わりに、ブートストラップコンテキストを空のままにします。

配信の所有権に関する注記:

- 分離された cron のチャット配信は共有されます。チャットルートが利用可能な場合、エージェントは `message` Tool で直接送信できます。
- `announce` は、エージェントが解決されたターゲットに直接送信しなかった場合にのみ、最終返信をフォールバック配信します。`webhook` は完了したペイロードを URL に投稿します。
  `none` はランナーのフォールバック配信を無効にします。

## よく使う管理コマンド

手動実行:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` のエントリには、意図された cron ターゲット、解決されたターゲット、message-Tool による送信、フォールバック利用、配信済み状態といった配信診断が含まれます。

エージェント/セッションの再ターゲット:

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

失敗配信に関する注記:

- `delivery.failureDestination` は分離ジョブでサポートされます。
- メインセッションジョブは、primary
  配信モードが `webhook` の場合にのみ `delivery.failureDestination` を使用できます。
- 失敗宛先を何も設定しておらず、そのジョブがすでにチャネルに announce している場合、失敗通知は同じ announce ターゲットを再利用します。

## 関連

- [CLI reference](/ja-JP/cli)
- [Scheduled tasks](/ja-JP/automation/cron-jobs)
