---
read_when:
    - Heartbeat の間隔やメッセージ内容の調整
    - スケジュールされたタスクに Heartbeat と Cron のどちらを使うかを判断すること
summary: Heartbeat ポーリングメッセージと通知ルール
title: Heartbeat
x-i18n:
    generated_at: "2026-04-23T04:45:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13004e4e20b02b08aaf16f22cdf664d0b59da69446ecb30453db51ffdfd1d267
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat（Gateway）

> **Heartbeat と Cron のどちらを使うべきですか？** 使い分けの指針については[自動化とタスク](/ja-JP/automation)を参照してください。

Heartbeat は、**定期的なエージェントターン**をメインセッションで実行し、
必要な注意事項をモデルが表面化できるようにしつつ、過剰な通知を防ぎます。

Heartbeat はスケジュールされたメインセッションターンであり、[バックグラウンドタスク](/ja-JP/automation/tasks)のレコードは**作成しません**。
タスクレコードは、分離された作業（ACP 実行、サブエージェント、分離された Cron ジョブ）用です。

トラブルシューティング: [スケジュールされたタスク](/ja-JP/automation/cron-jobs#troubleshooting)

## クイックスタート（初級者向け）

1. Heartbeat を有効のままにしておく（デフォルトは `30m`、または Anthropic OAuth/トークン認証時は `1h`。Claude CLI 再利用を含む）か、独自の間隔を設定します。
2. エージェントワークスペースに小さな `HEARTBEAT.md` チェックリストまたは `tasks:` ブロックを作成します（任意ですが推奨）。
3. Heartbeat メッセージの送信先を決めます（デフォルトは `target: "none"` です。最後の連絡先に送るには `target: "last"` を設定します）。
4. 任意で、透明性のために Heartbeat の推論配信を有効にします。
5. 任意で、Heartbeat 実行に `HEARTBEAT.md` しか不要であれば軽量なブートストラップコンテキストを使います。
6. 任意で、Heartbeat ごとに会話履歴全体を送らないように分離セッションを有効にします。
7. 任意で、Heartbeat をアクティブ時間帯（ローカル時刻）に制限します。

設定例:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 最後の連絡先への明示的な配信（デフォルトは "none"）
        directPolicy: "allow", // デフォルト: direct/DM 宛先を許可。抑止するには "block" を設定
        lightContext: true, // 任意: ブートストラップファイルから HEARTBEAT.md のみを注入
        isolatedSession: true, // 任意: 毎回新しいセッションで実行（会話履歴なし）
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 任意: 別個の `Reasoning:` メッセージも送信
      },
    },
  },
}
```

## デフォルト

- 間隔: `30m`（または Anthropic OAuth/トークン認証が検出された認証モードのときは `1h`。Claude CLI 再利用を含む）。`agents.defaults.heartbeat.every` またはエージェントごとの `agents.list[].heartbeat.every` を設定します。無効化するには `0m` を使います。
- プロンプト本文（`agents.defaults.heartbeat.prompt` で設定可能）:
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat プロンプトは、ユーザーメッセージとして**そのまま**送信されます。システム
  プロンプトには、デフォルトエージェントで Heartbeat が有効であり、
  かつ実行が内部的にフラグ付けされている場合にのみ「Heartbeat」セクションが含まれます。
- Heartbeat を `0m` で無効にすると、通常の実行でもブートストラップコンテキストから
  `HEARTBEAT.md` が除外されるため、モデルは Heartbeat 専用の指示を参照しません。
- アクティブ時間帯（`heartbeat.activeHours`）は設定されたタイムゾーンで判定されます。
  ウィンドウ外では、次にウィンドウ内に入るティックまで Heartbeat はスキップされます。

## Heartbeat プロンプトの目的

デフォルトのプロンプトは、意図的に広い内容になっています。

- **バックグラウンドタスク**: 「未処理タスクを検討する」という意図により、エージェントが
  フォローアップ（受信箱、カレンダー、リマインダー、キューされた作業）を見直し、
  緊急のものを表面化するよう促します。
- **人間へのチェックイン**: 「昼間にときどき人間の様子を確認する」という意図により、
  軽い「何か必要ですか？」メッセージを時折送るよう促しますが、
  設定済みのローカルタイムゾーンを使うことで夜間の通知過多を避けます
  （[/concepts/timezone](/ja-JP/concepts/timezone) を参照）。

Heartbeat は完了した[バックグラウンドタスク](/ja-JP/automation/tasks)に反応できますが、
Heartbeat 実行そのものはタスクレコードを作成しません。

Heartbeat に非常に具体的な処理（たとえば「Gmail PubSub 統計を確認する」や
「Gateway の健全性を検証する」）をさせたい場合は、
`agents.defaults.heartbeat.prompt`（または
`agents.list[].heartbeat.prompt`）にカスタム本文を設定してください
（そのまま送信されます）。

## 応答契約

- 注意を要することが何もなければ、**`HEARTBEAT_OK`** で返信します。
- Heartbeat 実行中、OpenClaw は返信の**先頭または末尾**に `HEARTBEAT_OK` がある場合、
  それを ack として扱います。このトークンは取り除かれ、残りの内容が
  **≤ `ackMaxChars`**（デフォルト: 300）であれば返信は破棄されます。
- `HEARTBEAT_OK` が返信の**途中**に現れた場合、特別扱いはされません。
- アラートでは **`HEARTBEAT_OK` を含めず**、アラートテキストのみを返してください。

Heartbeat 以外では、メッセージの先頭または末尾にある紛れ込んだ `HEARTBEAT_OK` は削除されて
ログ記録されます。メッセージが `HEARTBEAT_OK` のみである場合は破棄されます。

## 設定

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // デフォルト: 30m（0m で無効）
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // デフォルト: false（利用可能な場合は別個の Reasoning: メッセージを配信）
        lightContext: false, // デフォルト: false。true の場合、ワークスペースのブートストラップファイルから HEARTBEAT.md のみを保持
        isolatedSession: false, // デフォルト: false。true の場合、各 Heartbeat を新しいセッションで実行（会話履歴なし）
        target: "last", // デフォルト: none | options: last | none | <channel id>（core または Plugin。例: "bluebubbles"）
        to: "+15551234567", // 任意のチャンネル固有オーバーライド
        accountId: "ops-bot", // 任意のマルチアカウントチャンネル id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK の後に許容される最大文字数
      },
    },
  },
}
```

### スコープと優先順位

- `agents.defaults.heartbeat` はグローバルな Heartbeat 動作を設定します。
- `agents.list[].heartbeat` はその上にマージされます。いずれかのエージェントに `heartbeat` ブロックがある場合、**そのエージェントだけ**が Heartbeat を実行します。
- `channels.defaults.heartbeat` はすべてのチャンネルの可視性デフォルトを設定します。
- `channels.<channel>.heartbeat` はチャンネルデフォルトを上書きします。
- `channels.<channel>.accounts.<id>.heartbeat`（マルチアカウントチャンネル）はチャンネルごとの設定を上書きします。

### エージェントごとの Heartbeat

いずれかの `agents.list[]` エントリに `heartbeat` ブロックが含まれている場合、**そのエージェントだけ**が
Heartbeat を実行します。エージェントごとのブロックは `agents.defaults.heartbeat` の上にマージされるため、
共通デフォルトを一度設定し、エージェントごとに上書きできます。

例: 2 つのエージェントがあり、2 番目のエージェントだけが Heartbeat を実行します。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 最後の連絡先への明示的な配信（デフォルトは "none"）
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### アクティブ時間帯の例

特定のタイムゾーンの営業時間内に Heartbeat を制限します。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 最後の連絡先への明示的な配信（デフォルトは "none"）
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // 任意。設定されていれば userTimezone、なければホストのタイムゾーンを使用
        },
      },
    },
  },
}
```

このウィンドウ外（米国東部時間の午前 9 時前または午後 10 時後）では、Heartbeat はスキップされます。次にスケジュールされたウィンドウ内のティックは通常どおり実行されます。

### 24 時間 365 日の設定

Heartbeat を終日実行したい場合は、次のいずれかのパターンを使います。

- `activeHours` を完全に省略する（時間ウィンドウの制限なし。これがデフォルト動作です）。
- 終日ウィンドウを設定する: `activeHours: { start: "00:00", end: "24:00" }`。

同じ `start` と `end` の時刻（たとえば `08:00` から `08:00`）は設定しないでください。
これは幅 0 のウィンドウとして扱われるため、Heartbeat は常にスキップされます。

### マルチアカウントの例

Telegram のようなマルチアカウントチャンネルで特定のアカウントを対象にするには `accountId` を使います。

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // 任意: 特定のトピック/スレッドにルーティング
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### フィールドメモ

- `every`: Heartbeat の間隔（duration 文字列。デフォルト単位 = 分）。
- `model`: Heartbeat 実行用の任意のモデルオーバーライド（`provider/model`）。
- `includeReasoning`: 有効にすると、利用可能な場合に別個の `Reasoning:` メッセージも配信します（`/reasoning on` と同じ形式）。
- `lightContext`: true の場合、Heartbeat 実行では軽量なブートストラップコンテキストを使い、ワークスペースのブートストラップファイルから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各 Heartbeat は過去の会話履歴なしの新しいセッションで実行されます。Cron の `sessionTarget: "isolated"` と同じ分離パターンを使います。Heartbeat ごとのトークンコストを大幅に削減します。最大限の節約のために `lightContext: true` と組み合わせてください。配信ルーティングには引き続きメインセッションのコンテキストが使われます。
- `session`: Heartbeat 実行用の任意のセッションキー。
  - `main`（デフォルト）: エージェントのメインセッション。
  - 明示的なセッションキー（`openclaw sessions --json` または [sessions CLI](/cli/sessions) からコピー）。
  - セッションキー形式については [Sessions](/ja-JP/concepts/session) と [Groups](/ja-JP/channels/groups) を参照してください。
- `target`:
  - `last`: 最後に使われた外部チャンネルに配信します。
  - 明示的なチャンネル: 設定済みの任意のチャンネルまたは Plugin id。たとえば `discord`、`matrix`、`telegram`、`whatsapp`。
  - `none`（デフォルト）: Heartbeat は実行しますが、外部には**配信しません**。
- `directPolicy`: direct/DM 配信動作を制御します。
  - `allow`（デフォルト）: direct/DM への Heartbeat 配信を許可します。
  - `block`: direct/DM 配信を抑止します（`reason=dm-blocked`）。
- `to`: 任意の受信者オーバーライド（チャンネル固有 id。例: WhatsApp の E.164 や Telegram のチャット id）。Telegram のトピック/スレッドでは `<chatId>:topic:<messageThreadId>` を使います。
- `accountId`: マルチアカウントチャンネル用の任意のアカウント id。`target: "last"` の場合、解決された最後のチャンネルがアカウントをサポートしていればそのチャンネルに適用され、そうでなければ無視されます。アカウント id が解決されたチャンネルの設定済みアカウントに一致しない場合、配信はスキップされます。
- `prompt`: デフォルトのプロンプト本文を上書きします（マージされません）。
- `ackMaxChars`: 配信前に `HEARTBEAT_OK` の後に許容される最大文字数。
- `suppressToolErrorWarnings`: true の場合、Heartbeat 実行中のツールエラー警告ペイロードを抑止します。
- `activeHours`: Heartbeat 実行を時間ウィンドウに制限します。`start`（HH:MM、含む。1 日の開始には `00:00` を使用）、`end`（HH:MM、含まない。1 日の終端には `24:00` 可）、および任意の `timezone` を持つオブジェクト。
  - 省略または `"user"`: 設定されていれば `agents.defaults.userTimezone` を使い、なければホストシステムのタイムゾーンにフォールバックします。
  - `"local"`: 常にホストシステムのタイムゾーンを使います。
  - 任意の IANA 識別子（例: `America/New_York`）: 直接使われます。無効な場合は上記の `"user"` 動作にフォールバックします。
  - アクティブウィンドウでは `start` と `end` は同じであってはなりません。同じ値は幅 0 として扱われます（常にウィンドウ外）。
  - アクティブウィンドウ外では、次にウィンドウ内に入るティックまで Heartbeat はスキップされます。

## 配信動作

- Heartbeat はデフォルトでエージェントのメインセッション（`agent:<id>:<mainKey>`）で実行され、
  `session.scope = "global"` の場合は `global` になります。特定のチャンネルセッション
  （Discord/WhatsApp など）に上書きするには `session` を設定します。
- `session` は実行コンテキストにのみ影響し、配信は `target` と `to` によって制御されます。
- 特定のチャンネル/受信者に配信するには、`target` + `to` を設定します。
  `target: "last"` の場合、配信にはそのセッションで最後に使われた外部チャンネルが使用されます。
- Heartbeat の配信では、デフォルトで direct/DM 宛先が許可されます。Heartbeat ターン自体は実行しつつ direct 宛先への送信を抑止するには `directPolicy: "block"` を設定します。
- メインキューがビジーの場合、Heartbeat はスキップされ、後で再試行されます。
- `target` が外部宛先に解決されない場合でも、実行自体は行われますが、
  送信メッセージは送られません。
- `showOk`、`showAlerts`、`useIndicator` がすべて無効な場合、実行は事前に `reason=alerts-disabled` としてスキップされます。
- アラート配信のみが無効な場合、OpenClaw は引き続き Heartbeat を実行し、期限付きタスクのタイムスタンプを更新し、セッションのアイドルタイムスタンプを復元し、外向きのアラートペイロードを抑止できます。
- 解決された Heartbeat 宛先が typing をサポートしている場合、OpenClaw は
  Heartbeat 実行中に typing を表示します。これは Heartbeat がチャット出力の送信先として
  使うのと同じ宛先を使用し、`typingMode: "never"` で無効化されます。
- Heartbeat 専用の返信はセッションを生かし続けません。最後の `updatedAt`
  は復元されるため、アイドル期限切れは通常どおり動作します。
- 分離された[バックグラウンドタスク](/ja-JP/automation/tasks)は、メインセッションが何かにすぐ気付くべき場合にシステムイベントをキューに入れ、Heartbeat を起こすことができます。その起床によって Heartbeat 実行がバックグラウンドタスクになることはありません。

## 可視性の制御

デフォルトでは、`HEARTBEAT_OK` の確認応答は抑止され、アラート内容のみが
配信されます。これはチャンネルごと、またはアカウントごとに調整できます。

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK を非表示（デフォルト）
      showAlerts: true # アラートメッセージを表示（デフォルト）
      useIndicator: true # indicator イベントを発行（デフォルト）
  telegram:
    heartbeat:
      showOk: true # Telegram では OK 確認応答を表示
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # このアカウントではアラート配信を抑止
```

優先順位: アカウントごと → チャンネルごと → チャンネルデフォルト → 組み込みデフォルト。

### 各フラグの意味

- `showOk`: モデルが OK のみの返信を返したときに `HEARTBEAT_OK` 確認応答を送信します。
- `showAlerts`: モデルが非 OK の返信を返したときにアラート内容を送信します。
- `useIndicator`: UI ステータスサーフェス用の indicator イベントを発行します。

**3 つすべて**が false の場合、OpenClaw は Heartbeat 実行全体をスキップします（モデル呼び出しなし）。

### チャンネルごととアカウントごとの例

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # すべての Slack アカウント
    accounts:
      ops:
        heartbeat:
          showAlerts: false # ops アカウントのみアラートを抑止
  telegram:
    heartbeat:
      showOk: true
```

### 一般的なパターン

| 目的                                     | 設定                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| デフォルト動作（OK は無音、アラートは有効） | _(設定不要)_                                                                     |
| 完全に無音（メッセージなし、indicator なし） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| indicator のみ（メッセージなし）             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 1 つのチャンネルでのみ OK を表示                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（任意）

ワークスペースに `HEARTBEAT.md` ファイルが存在する場合、デフォルトプロンプトは
エージェントにそれを読むよう指示します。これは「Heartbeat チェックリスト」と考えてください。
小さく、安定していて、30 分ごとに含めても安全なものです。

通常実行では、`HEARTBEAT.md` はデフォルトエージェントで Heartbeat ガイダンスが
有効な場合にのみ注入されます。`0m` で Heartbeat 間隔を無効にするか、
`includeSystemPromptSection: false` を設定すると、通常のブートストラップ
コンテキストからは除外されます。

`HEARTBEAT.md` が存在しても、実質的に空（空行と `# Heading` のような Markdown
見出しだけ）である場合、OpenClaw は API 呼び出しを節約するため Heartbeat 実行をスキップします。
そのスキップは `reason=empty-heartbeat-file` として報告されます。
ファイルが存在しない場合でも Heartbeat は実行され、モデルが何をするかを判断します。

プロンプト肥大化を避けるため、小さく保ってください（短いチェックリストやリマインダー）。

`HEARTBEAT.md` の例:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` ブロック

`HEARTBEAT.md` は、Heartbeat 自体の中で間隔ベースの確認を行うための
小さな構造化 `tasks:` ブロックもサポートしています。

例:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

動作:

- OpenClaw は `tasks:` ブロックを解析し、各タスクをそれぞれの `interval` に照らして確認します。
- そのティックで**期限到来済み**のタスクだけが Heartbeat プロンプトに含まれます。
- 期限到来済みのタスクがない場合、Heartbeat は無駄なモデル呼び出しを避けるため完全にスキップされます（`reason=no-tasks-due`）。
- `HEARTBEAT.md` のタスク以外の内容は保持され、期限到来済みタスクリストの後に追加コンテキストとして付加されます。
- タスクの最終実行タイムスタンプはセッション状態（`heartbeatTaskState`）に保存されるため、通常の再起動をまたいでも間隔は維持されます。
- タスクのタイムスタンプが進められるのは、Heartbeat 実行が通常の返信経路を完了した後だけです。`empty-heartbeat-file` / `no-tasks-due` によってスキップされた実行はタスク完了として記録されません。

タスクモードは、複数の定期チェックを 1 つの Heartbeat ファイルに保持しつつ、
毎ティックそのすべてのコストを払いたくない場合に便利です。

### エージェントは HEARTBEAT.md を更新できますか？

はい。そう依頼すれば可能です。

`HEARTBEAT.md` はエージェントワークスペース内の通常のファイルにすぎないため、
通常のチャットでエージェントに次のように指示できます。

- 「毎日のカレンダーチェックを追加するように `HEARTBEAT.md` を更新して」
- 「`HEARTBEAT.md` をもっと短くして、受信箱のフォローアップに集中するように書き直して」

これを能動的に行いたい場合は、Heartbeat プロンプトに
「チェックリストが古くなったら、より良いものに `HEARTBEAT.md` を更新すること」
のような明示的な 1 行を含めることもできます。

安全上の注意: `HEARTBEAT.md` には秘密情報（API キー、電話番号、プライベートトークン）を入れないでください。プロンプトコンテキストの一部になります。

## 手動起床（オンデマンド）

システムイベントをキューに入れて即時 Heartbeat をトリガーするには、次を実行します。

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

複数のエージェントに `heartbeat` が設定されている場合、手動起床はそれら
各エージェントの Heartbeat を即時実行します。

次回スケジュールされたティックまで待つには `--mode next-heartbeat` を使います。

## 推論配信（任意）

デフォルトでは、Heartbeat は最終的な「回答」ペイロードだけを配信します。

透明性が必要な場合は、次を有効にしてください。

- `agents.defaults.heartbeat.includeReasoning: true`

有効にすると、Heartbeat は接頭辞
`Reasoning:` の付いた別個のメッセージも配信します
（`/reasoning on` と同じ形式）。これは、エージェントが複数のセッション/Codex を管理していて、
なぜ通知することにしたのかを確認したい場合に便利ですが、
望まない内部詳細まで漏れる可能性もあります。グループチャットでは
無効のままにしておくことを推奨します。

## コスト意識

Heartbeat は完全なエージェントターンを実行します。間隔を短くするほどトークン消費は増えます。コスト削減のためには次を行ってください。

- `isolatedSession: true` を使って会話履歴全体の送信を避ける（実行ごと約 100K トークンから約 2〜5K に削減）。
- `lightContext: true` を使ってブートストラップファイルを `HEARTBEAT.md` のみに制限する。
- より安価な `model` を設定する（例: `ollama/llama3.2:1b`）。
- `HEARTBEAT.md` を小さく保つ。
- 内部状態更新だけが必要なら `target: "none"` を使う。

## 関連

- [自動化とタスク](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — 分離された作業がどのように追跡されるか
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーンが Heartbeat スケジューリングに与える影響
- [トラブルシューティング](/ja-JP/automation/cron-jobs#troubleshooting) — 自動化の問題をデバッグする方法
