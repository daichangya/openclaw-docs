---
read_when:
    - Heartbeat の頻度やメッセージングを調整する場合
    - スケジュールされたタスクに heartbeat と cron のどちらを使うか決める場合
summary: Heartbeat のポーリングメッセージと通知ルール
title: Heartbeat
x-i18n:
    generated_at: "2026-04-05T12:44:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: f417b0d4453bed9022144d364521a59dec919d44cca8f00f0def005cd38b146f
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat と Cron のどちらを使うべきか?** 使い分けの指針については [Automation & Tasks](/ja-JP/automation) を参照してください。

Heartbeat は、モデルが
あなたにスパムせずに注意が必要なことを表面化できるよう、メインセッションで**定期的なエージェントターン**を実行します。

Heartbeat は、メインセッションでのスケジュール済みターンであり、[background task](/ja-JP/automation/tasks) レコードは**作成しません**。
タスクレコードは、切り離された作業（ACP 実行、subagent、分離された cron ジョブ）用です。

トラブルシューティング: [Scheduled Tasks](/ja-JP/automation/cron-jobs#troubleshooting)

## クイックスタート

1. Heartbeat を有効のままにする（デフォルトは `30m`、または Anthropic OAuth/token 認証では `1h`。Claude CLI の再利用を含む）か、独自の頻度を設定します。
2. エージェントワークスペースに小さな `HEARTBEAT.md` チェックリストまたは `tasks:` ブロックを作成します（任意ですが推奨）。
3. Heartbeat メッセージの送信先を決めます（デフォルトは `target: "none"` です。最後の連絡先へ送るには `target: "last"` を設定します）。
4. 任意: 透明性のために heartbeat の reasoning 配信を有効にします。
5. 任意: Heartbeat 実行で `HEARTBEAT.md` だけが必要な場合は、軽量な bootstrap context を使います。
6. 任意: 毎回の heartbeat で会話履歴全体を送らないよう、分離セッションを有効にします。
7. 任意: Heartbeat をアクティブ時間帯（ローカル時刻）に限定します。

設定例:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 最後の連絡先へ明示的に配信（デフォルトは "none"）
        directPolicy: "allow", // デフォルト: 直接/DM の送信先を許可。抑制するには "block" を設定
        lightContext: true, // 任意: bootstrap ファイルから HEARTBEAT.md のみを注入
        isolatedSession: true, // 任意: 毎回新しいセッションで実行（会話履歴なし）
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 任意: 別個の `Reasoning:` メッセージも送信
      },
    },
  },
}
```

## デフォルト

- 間隔: `30m`（または Anthropic OAuth/token 認証が検出された認証モードである場合は `1h`。Claude CLI の再利用を含む）。`agents.defaults.heartbeat.every` またはエージェントごとの `agents.list[].heartbeat.every` を設定します。無効にするには `0m` を使います。
- プロンプト本文（`agents.defaults.heartbeat.prompt` で設定可能）:
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeat プロンプトは、ユーザーメッセージとして**そのまま**送信されます。システム
  プロンプトには「Heartbeat」セクションが含まれ、実行は内部的にフラグ付けされます。
- アクティブ時間（`heartbeat.activeHours`）は、設定されたタイムゾーンでチェックされます。
  ウィンドウ外では、Heartbeat はウィンドウ内の次のティックまでスキップされます。

## heartbeat プロンプトの目的

デフォルトプロンプトは意図的に広めに作られています:

- **バックグラウンドタスク**: 「未処理タスクを考慮する」は、エージェントに
  フォローアップ（受信箱、カレンダー、リマインダー、キュー済み作業）を見直し、緊急なものを表面化するよう促します。
- **人間へのチェックイン**: 「日中は時々 human を軽くチェックする」は、
  時折の軽い「何か必要ですか?」メッセージを促しますが、
  設定されたローカルタイムゾーンを使うことで夜間のスパムは避けます（[/concepts/timezone](/concepts/timezone) を参照）。

Heartbeat は完了済みの [background tasks](/ja-JP/automation/tasks) に反応できますが、heartbeat 実行自体はタスクレコードを作成しません。

Heartbeat に非常に具体的なこと（たとえば「Gmail PubSub
統計を確認する」や「Gateway の健全性を確認する」）をさせたい場合は、`agents.defaults.heartbeat.prompt`（または
`agents.list[].heartbeat.prompt`）をカスタム本文（そのまま送信されます）に設定してください。

## 応答契約

- 注意が必要なことが何もなければ、**`HEARTBEAT_OK`** で返信します。
- Heartbeat 実行中、OpenClaw は、返信の**先頭または末尾**に
  `HEARTBEAT_OK` が現れた場合、それを ack として扱います。残りの内容が
  **≤ `ackMaxChars`**（デフォルト: 300）であれば、そのトークンは取り除かれ、返信は
  破棄されます。
- `HEARTBEAT_OK` が返信の**途中**に現れた場合は、特別扱いされません。
- アラートの場合は、**`HEARTBEAT_OK` を含めないでください**。アラート本文だけを返します。

Heartbeat 外では、メッセージの先頭/末尾にある stray な `HEARTBEAT_OK` は除去され、
ログに記録されます。メッセージが `HEARTBEAT_OK` だけの場合は破棄されます。

## 設定

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // デフォルト: 30m（0m で無効化）
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // デフォルト: false（利用可能な場合は別個の Reasoning: メッセージを配信）
        lightContext: false, // デフォルト: false。true の場合、ワークスペース bootstrap ファイルから HEARTBEAT.md のみを保持
        isolatedSession: false, // デフォルト: false。true の場合、毎回新しいセッションで実行（会話履歴なし）
        target: "last", // デフォルト: none | 選択肢: last | none | <channel id>（コアまたはプラグイン。例: "bluebubbles"）
        to: "+15551234567", // 任意のチャネル固有オーバーライド
        accountId: "ops-bot", // 任意のマルチアカウントチャネル id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK の後に許可される最大文字数
      },
    },
  },
}
```

### スコープと優先順位

- `agents.defaults.heartbeat` はグローバルな heartbeat 動作を設定します。
- `agents.list[].heartbeat` はその上にマージされます。いずれかのエージェントに `heartbeat` ブロックがある場合、**そのエージェントだけ** が heartbeat を実行します。
- `channels.defaults.heartbeat` はすべてのチャネルの可視性デフォルトを設定します。
- `channels.<channel>.heartbeat` はチャネルデフォルトを上書きします。
- `channels.<channel>.accounts.<id>.heartbeat`（マルチアカウントチャネル）はチャネルごとの設定を上書きします。

### エージェントごとの heartbeat

いずれかの `agents.list[]` エントリに `heartbeat` ブロックが含まれている場合、**そのエージェントだけ**
が heartbeat を実行します。エージェントごとのブロックは `agents.defaults.heartbeat`
の上にマージされます（そのため、共通デフォルトを一度設定し、エージェントごとに上書きできます）。

例: 2 つのエージェントがあり、heartbeat を実行するのは 2 つ目だけです。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 最後の連絡先へ明示的に配信（デフォルトは "none"）
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
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### アクティブ時間の例

特定のタイムゾーンの業務時間に heartbeat を制限します:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 最後の連絡先へ明示的に配信（デフォルトは "none"）
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // 任意。設定されていれば userTimezone を使い、なければホストの tz を使う
        },
      },
    },
  },
}
```

このウィンドウ外（東部時間で午前 9 時前または午後 10 時以降）では、Heartbeat はスキップされます。ウィンドウ内の次のスケジュールティックで通常どおり実行されます。

### 24/7 セットアップ

Heartbeat を終日実行したい場合は、次のいずれかのパターンを使います:

- `activeHours` 自体を省略する（時間ウィンドウ制限なし。これがデフォルト動作です）。
- 1 日全体のウィンドウを設定する: `activeHours: { start: "00:00", end: "24:00" }`。

`start` と `end` を同じ時刻にしないでください（たとえば `08:00` から `08:00`）。
これは幅 0 のウィンドウとして扱われるため、Heartbeat は常にスキップされます。

### マルチアカウントの例

Telegram のようなマルチアカウントチャネルで特定のアカウントを対象にするには `accountId` を使います:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // 任意: 特定のトピック/スレッドへルーティング
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

- `every`: heartbeat 間隔（期間文字列。デフォルト単位 = 分）。
- `model`: heartbeat 実行用の任意のモデル上書き（`provider/model`）。
- `includeReasoning`: 有効時、利用可能であれば別個の `Reasoning:` メッセージも配信します（`/reasoning on` と同じ形式）。
- `lightContext`: true の場合、heartbeat 実行では軽量な bootstrap context を使い、ワークスペース bootstrap ファイルから `HEARTBEAT.md` のみを保持します。
- `isolatedSession`: true の場合、各 heartbeat は以前の会話履歴がない新しいセッションで実行されます。cron の `sessionTarget: "isolated"` と同じ分離パターンを使います。heartbeat ごとのトークンコストを大幅に削減します。最大限に節約するには `lightContext: true` と組み合わせてください。配信ルーティングでは引き続きメインセッションコンテキストを使います。
- `session`: heartbeat 実行用の任意のセッションキー。
  - `main`（デフォルト）: エージェントのメインセッション。
  - 明示的なセッションキー（`openclaw sessions --json` または [sessions CLI](/cli/sessions) からコピー）。
  - セッションキー形式: [Sessions](/concepts/session) と [Groups](/ja-JP/channels/groups) を参照してください。
- `target`:
  - `last`: 最後に使われた外部チャネルへ配信します。
  - 明示的なチャネル: 設定済みの任意のチャネルまたはプラグイン id。例: `discord`、`matrix`、`telegram`、`whatsapp`。
  - `none`（デフォルト）: heartbeat は実行しますが、外部には**配信しません**。
- `directPolicy`: 直接/DM 配信動作を制御します:
  - `allow`（デフォルト）: 直接/DM への heartbeat 配信を許可します。
  - `block`: 直接/DM 配信を抑制します（`reason=dm-blocked`）。
- `to`: 任意の受信者上書き（チャネル固有 id。たとえば WhatsApp の E.164 や Telegram の chat id）。Telegram の topic/thread では `<chatId>:topic:<messageThreadId>` を使います。
- `accountId`: マルチアカウントチャネル用の任意のアカウント id。`target: "last"` の場合、解決された最後のチャネルがアカウント対応ならそのチャネルに適用され、そうでなければ無視されます。アカウント id が解決されたチャネルの設定済みアカウントと一致しない場合、配信はスキップされます。
- `prompt`: デフォルトのプロンプト本文を上書きします（マージはされません）。
- `ackMaxChars`: 配信前に `HEARTBEAT_OK` の後に許可される最大文字数。
- `suppressToolErrorWarnings`: true の場合、heartbeat 実行中のツールエラー警告ペイロードを抑制します。
- `activeHours`: heartbeat 実行を時間ウィンドウに制限します。`start`（HH:MM、含む。1 日の開始には `00:00` を使用）、`end`（HH:MM、含まない。1 日の終わりには `24:00` を使用可能）、および任意の `timezone` を持つオブジェクト。
  - 省略または `"user"`: `agents.defaults.userTimezone` が設定されていればそれを使い、そうでなければホストシステムのタイムゾーンにフォールバックします。
  - `"local"`: 常にホストシステムのタイムゾーンを使います。
  - 任意の IANA 識別子（例: `America/New_York`）: それを直接使います。無効な場合は上記の `"user"` 動作にフォールバックします。
  - アクティブウィンドウでは `start` と `end` は等しくしてはいけません。等しい値は幅 0 として扱われます（常にウィンドウ外）。
  - アクティブウィンドウ外では、Heartbeat はウィンドウ内の次のティックまでスキップされます。

## 配信動作

- Heartbeat はデフォルトでエージェントのメインセッション（`agent:<id>:<mainKey>`）で実行され、
  `session.scope = "global"` の場合は `global` になります。特定のチャネルセッション（Discord/WhatsApp など）に上書きするには `session` を設定します。
- `session` は実行コンテキストにのみ影響します。配信は `target` と `to` によって制御されます。
- 特定のチャネル/受信者へ配信するには、`target` + `to` を設定します。`target: "last"` の場合、
  配信にはそのセッションの最後の外部チャネルが使われます。
- Heartbeat 配信では、デフォルトで直接/DM の送信先が許可されます。heartbeat ターン自体は実行しつつ直接送信先への送信を抑制するには `directPolicy: "block"` を設定します。
- メインキューがビジーの場合、Heartbeat はスキップされ、後で再試行されます。
- `target` が外部の送信先に解決されない場合でも、実行自体は行われますが、
  送信メッセージは送られません。
- `showOk`、`showAlerts`、`useIndicator` がすべて無効な場合、実行は `reason=alerts-disabled` として事前にスキップされます。
- アラート配信のみが無効な場合でも、OpenClaw は heartbeat を実行し、期限タスクのタイムスタンプを更新し、セッションのアイドルタイムスタンプを復元し、外向きのアラートペイロードを抑制できます。
- Heartbeat 専用の返信はセッションを生かし続けません。最後の `updatedAt`
  は復元されるため、アイドル期限切れは通常どおり動作します。
- 切り離された [background tasks](/ja-JP/automation/tasks) は、メインセッションがすばやく何かに気づくべきときにシステムイベントをエンキューし、heartbeat を起こすことができます。その wake によって heartbeat 実行が background task になることはありません。

## 可視性の制御

デフォルトでは、`HEARTBEAT_OK` の確認応答は抑制され、アラート内容のみが
配信されます。これをチャネルごとまたはアカウントごとに調整できます:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK を非表示（デフォルト）
      showAlerts: true # アラートメッセージを表示（デフォルト）
      useIndicator: true # インジケーターイベントを発行（デフォルト）
  telegram:
    heartbeat:
      showOk: true # Telegram では OK 確認応答を表示
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # このアカウントではアラート配信を抑制
```

優先順位: アカウントごと → チャネルごと → チャネルデフォルト → 組み込みデフォルト。

### 各フラグの意味

- `showOk`: モデルが OK のみの返信を返した場合に `HEARTBEAT_OK` の確認応答を送信します。
- `showAlerts`: モデルが非 OK の返信を返した場合にアラート内容を送信します。
- `useIndicator`: UI のステータス表示向けにインジケーターイベントを発行します。

**3 つすべて** が false の場合、OpenClaw は heartbeat 実行全体をスキップします（モデル呼び出しなし）。

### チャネルごととアカウントごとの例

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
          showAlerts: false # ops アカウントだけでアラートを抑制
  telegram:
    heartbeat:
      showOk: true
```

### よくあるパターン

| Goal                                     | Config                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| デフォルト動作（OK は無音、アラートは送信） | _(設定不要)_                                                                     |
| 完全に無音（メッセージなし、インジケーターなし） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| インジケーターのみ（メッセージなし）             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 1 つのチャネルでのみ OK を表示                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## `HEARTBEAT.md`（任意）

ワークスペースに `HEARTBEAT.md` ファイルが存在する場合、デフォルトプロンプトは
エージェントにそれを読むよう指示します。これは「heartbeat チェックリスト」と考えてください。小さく、安定していて、
30 分ごとに含めても安全なものです。

`HEARTBEAT.md` が存在しても実質的に空（空行と `# Heading` のような markdown
見出しだけ）の場合、OpenClaw は API 呼び出しを節約するため heartbeat 実行をスキップします。
そのスキップは `reason=empty-heartbeat-file` として報告されます。
ファイルがない場合でも heartbeat は実行され、モデルが何をすべきか判断します。

プロンプト肥大化を避けるため、小さく保ってください（短いチェックリストやリマインダー）。

`HEARTBEAT.md` の例:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` ブロック

`HEARTBEAT.md` は、heartbeat 自体の中で間隔ベースの
チェックを行うための、小さな構造化 `tasks:` ブロックもサポートしています。

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

- OpenClaw は `tasks:` ブロックを解析し、各タスクをそれぞれの `interval` に照らしてチェックします。
- そのティックで期限が来ているタスクだけが heartbeat プロンプトに含まれます。
- 期限が来ているタスクがなければ、無駄なモデル呼び出しを避けるため heartbeat 全体がスキップされます（`reason=no-tasks-due`）。
- `HEARTBEAT.md` 内のタスク以外の内容は保持され、期限が来ているタスクリストの後に追加コンテキストとして追記されます。
- タスクの最終実行タイムスタンプはセッション状態（`heartbeatTaskState`）に保存されるため、通常の再起動後も間隔は維持されます。
- タスクタイムスタンプが進むのは、heartbeat 実行が通常の返信経路を完了した後だけです。`empty-heartbeat-file` / `no-tasks-due` によりスキップされた実行では、タスクは完了済みとして記録されません。

タスクモードは、複数の定期チェックを 1 つの heartbeat ファイルに保持しつつ、毎ティックそれらすべてのコストを払いたくない場合に便利です。

### エージェントは `HEARTBEAT.md` を更新できますか?

はい。そう依頼すれば可能です。

`HEARTBEAT.md` はエージェントワークスペース内の通常のファイルなので、
通常のチャットで次のようにエージェントへ指示できます:

- 「毎日のカレンダーチェックを追加するよう `HEARTBEAT.md` を更新して。」
- 「より短く、受信箱のフォローアップに集中するよう `HEARTBEAT.md` を書き直して。」

これをプロアクティブに行いたい場合は、
heartbeat プロンプトに次のような明示的な 1 行を含めることもできます: 「If the checklist becomes stale, update HEARTBEAT.md
with a better one.」

安全上の注意: 秘密情報（API キー、電話番号、プライベートトークン）を
`HEARTBEAT.md` に入れないでください。プロンプトコンテキストの一部になります。

## 手動 wake（オンデマンド）

次のコマンドで、システムイベントをエンキューし、即座に heartbeat をトリガーできます:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

複数のエージェントに `heartbeat` が設定されている場合、手動 wake はそれら
各エージェントの heartbeat を即座に実行します。

次のスケジュールティックまで待つには `--mode next-heartbeat` を使います。

## reasoning 配信（任意）

デフォルトでは、Heartbeat は最終的な「answer」ペイロードのみを配信します。

透明性がほしい場合は、次を有効にします:

- `agents.defaults.heartbeat.includeReasoning: true`

有効にすると、Heartbeat は接頭辞
`Reasoning:` の付いた別個のメッセージも配信します（`/reasoning on` と同じ形式）。これは、エージェントが複数のセッション/codex を管理していて、なぜ
通知する判断をしたのかを見たい場合に便利ですが、望まないほど多くの内部詳細を漏らす可能性もあります。グループチャットでは無効のままにしておくことを推奨します。

## コスト意識

Heartbeat は完全なエージェントターンを実行します。間隔を短くするとトークン消費が増えます。コストを減らすには:

- `isolatedSession: true` を使って会話履歴全体を送らないようにする（1 実行あたり約 100K トークンから約 2-5K へ削減）。
- `lightContext: true` を使って bootstrap ファイルを `HEARTBEAT.md` だけに制限する。
- より安価な `model` を設定する（例: `ollama/llama3.2:1b`）。
- `HEARTBEAT.md` を小さく保つ。
- 内部状態更新だけが必要なら `target: "none"` を使う。

## 関連

- [Automation & Tasks](/ja-JP/automation) — すべての自動化メカニズムの概要
- [Background Tasks](/ja-JP/automation/tasks) — 切り離された作業がどのように追跡されるか
- [Timezone](/concepts/timezone) — タイムゾーンが heartbeat スケジューリングに与える影響
- [Troubleshooting](/ja-JP/automation/cron-jobs#troubleshooting) — 自動化の問題をデバッグする方法
