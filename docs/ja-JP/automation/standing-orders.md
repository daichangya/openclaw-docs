---
read_when:
    - タスクごとのプロンプトなしで実行される自律エージェントワークフローの設定
    - エージェントが独立して実行できることと、人間の承認が必要なことを定義する
    - 明確な境界とエスカレーションルールを備えたマルチプログラムエージェントを構築する
summary: 自律エージェントプログラムに対する恒久的な運用権限を定義する
title: 恒久命令
x-i18n:
    generated_at: "2026-04-25T13:40:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a18777284a12e99b2e9f1ce660a0dc4d18ba5782d6a6a6673b495ab32b2d8cf
    source_path: automation/standing-orders.md
    workflow: 15
---

恒久命令は、定義されたプログラムに対してエージェントに**恒久的な運用権限**を付与します。毎回個別のタスク指示を出す代わりに、明確なスコープ、トリガー、エスカレーションルールを持つプログラムを定義し、エージェントはその境界内で自律的に実行します。

これは、毎週金曜日にアシスタントへ「週次レポートを送って」と伝えるのと、恒久的な権限を与えることの違いです。「週次レポートはあなたの担当です。毎週金曜日にまとめて送信し、何かおかしな点がある場合だけエスカレーションしてください。」

## なぜ恒久命令なのか？

**恒久命令がない場合:**

- すべてのタスクについてエージェントにプロンプトを送る必要がある
- エージェントはリクエストの合間に待機したままになる
- 定型業務が忘れられたり遅れたりする
- あなたがボトルネックになる

**恒久命令がある場合:**

- エージェントは定義された境界内で自律的に実行する
- 定型業務がプロンプトなしでスケジュールどおりに実行される
- あなたが関与するのは例外対応と承認のみ
- エージェントが空き時間を生産的に埋める

## 仕組み

恒久命令は、[agent workspace](/ja-JP/concepts/agent-workspace) のファイル内で定義します。推奨される方法は、`AGENTS.md` に直接含めることです（これは毎セッション自動注入されるため、エージェントは常にその内容をコンテキストに持ちます）。より大きな構成では、`standing-orders.md` のような専用ファイルに配置し、それを `AGENTS.md` から参照することもできます。

各プログラムでは、以下を指定します。

1. **スコープ** — エージェントが実行を許可されていること
2. **トリガー** — 実行するタイミング（スケジュール、イベント、または条件）
3. **承認ゲート** — 実行前に人間の承認が必要なこと
4. **エスカレーションルール** — 停止して支援を求めるタイミング

エージェントは、ワークスペースのブートストラップファイルを通じて毎セッションこれらの指示を読み込み（自動注入されるファイルの完全な一覧は [Agent Workspace](/ja-JP/concepts/agent-workspace) を参照）、時間ベースの強制実行には [cron jobs](/ja-JP/automation/cron-jobs) と組み合わせて実行します。

<Tip>
恒久命令は `AGENTS.md` に入れて、毎セッション確実に読み込まれるようにしてください。ワークスペースのブートストラップでは、`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md` が自動注入されますが、サブディレクトリ内の任意のファイルは自動注入されません。
</Tip>

## 恒久命令の構成

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution Steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to Do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad — report accurately
```

## 恒久命令 + Cron Jobs

恒久命令は、エージェントに何を実行する権限があるかという**何を**定義します。[Cron jobs](/ja-JP/automation/cron-jobs) は、それが**いつ**起こるかを定義します。両者は連携して機能します。

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Cronジョブのプロンプトでは、内容を重複させるのではなく、恒久命令を参照するようにしてください。

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## 例

### 例 1: コンテンツとソーシャルメディア（週次サイクル）

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly Cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday–Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content Rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### 例 2: 財務オペレーション（イベントトリガー型）

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When New Data Arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation Rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### 例 3: 監視とアラート（継続実行型）

```markdown
## Program: System Monitoring

**Authority:** Check system health, restart services, send alerts
**Approval gate:** Restart services automatically. Escalate if restart fails twice.
**Trigger:** Every heartbeat cycle

### Checks

- Service health endpoints responding
- Disk space above threshold
- Pending tasks not stale (>24 hours)
- Delivery channels operational

### Response Matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## Execute-Verify-Report パターン

恒久命令は、厳格な実行規律と組み合わせると最も効果を発揮します。恒久命令内のすべてのタスクは、次のループに従う必要があります。

1. **実行する** — 実際の作業を行う（指示を確認するだけではない）
2. **検証する** — 結果が正しいことを確認する（ファイルが存在する、メッセージが配信された、データが解析された）
3. **報告する** — 何を実行し、何を検証したかを所有者に伝える

```markdown
### Execution Rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

このパターンにより、エージェントで最も一般的な失敗モード、つまりタスクを完了せずに了承だけしてしまうことを防げます。

## マルチプログラムアーキテクチャ

複数の関心領域を管理するエージェントでは、明確な境界を持つ個別のプログラムとして恒久命令を整理してください。

```markdown
## Program 1: [Domain A] (Weekly)

...

## Program 2: [Domain B] (Monthly + On-Demand)

...

## Program 3: [Domain C] (As-Needed)

...

## Escalation Rules (All Programs)

- [Common escalation criteria]
- [Approval gates that apply across programs]
```

各プログラムには、次の要素が必要です。

- 独自の**トリガー頻度**（週次、月次、イベント駆動、継続実行）
- 独自の**承認ゲート**（他のプログラムより監督を必要とするものもある）
- 明確な**境界**（どこで1つのプログラムが終わり、別のプログラムが始まるかをエージェントが理解できること）

## ベストプラクティス

### 推奨事項

- 権限は狭く始め、信頼の構築に応じて拡大する
- 高リスクなアクションには明示的な承認ゲートを定義する
- 「してはいけないこと」のセクションを含める — 境界は権限と同じくらい重要
- 時間ベースの確実な実行のためにCronジョブと組み合わせる
- 恒久命令が守られていることを確認するため、エージェントログを毎週確認する
- ニーズの変化に応じて恒久命令を更新する — これらは生きたドキュメント

### 避けるべきこと

- 初日から広範な権限を与えること（「最善だと思うことを何でもやって」）
- エスカレーションルールを省くこと — すべてのプログラムには「いつ止まって確認するか」の条項が必要
- エージェントが口頭指示を覚えていると想定すること — すべてをファイルに書く
- 単一のプログラムに複数の関心事を混在させること — 別々の領域には別々のプログラム
- Cronジョブによる強制実行を忘れること — トリガーのない恒久命令は提案にしかならない

## 関連情報

- [Automation & Tasks](/ja-JP/automation) — すべての自動化メカニズムの概要
- [Cron Jobs](/ja-JP/automation/cron-jobs) — 恒久命令のスケジュール強制実行
- [Hooks](/ja-JP/automation/hooks) — エージェントのライフサイクルイベントに対するイベント駆動スクリプト
- [Webhooks](/ja-JP/automation/cron-jobs#webhooks) — 受信HTTPイベントトリガー
- [Agent Workspace](/ja-JP/concepts/agent-workspace) — 恒久命令の保存場所。`AGENTS.md`、`SOUL.md` など、自動注入されるブートストラップファイルの完全な一覧も含む
