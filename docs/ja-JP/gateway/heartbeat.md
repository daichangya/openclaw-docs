---
read_when:
    - Heartbeatの頻度やメッセージ内容を調整する場合
    - スケジュールされたタスクにHeartbeatとCronのどちらを使うか決める場合
summary: Heartbeatのポーリングメッセージと通知ルール
title: Heartbeat
x-i18n:
    generated_at: "2026-04-25T13:47:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17353a03bbae7ad564548e767099f8596764e2cf9bc3d457ec9fc3482ba7d71c
    source_path: gateway/heartbeat.md
    workflow: 15
---

> **HeartbeatとCronの違いは？** どちらを使うべきかの指針は[Automation & Tasks](/ja-JP/automation)を参照してください。

Heartbeatは、**定期的なエージェントターン**をメインセッションで実行し、
スパムにならない形で、注意が必要なことをモデルが知らせられるようにします。

Heartbeatはスケジュールされたメインセッションターンであり、[background task](/ja-JP/automation/tasks)レコードは**作成しません**。
タスクレコードは、切り離された作業（ACP実行、subagent、分離されたCronジョブ）のためのものです。

トラブルシューティング: [Scheduled Tasks](/ja-JP/automation/cron-jobs#troubleshooting)

## クイックスタート（初心者向け）

1. Heartbeatを有効のままにしておきます（デフォルトは`30m`、Anthropic OAuth/トークン認証検出時は`1h`。Claude CLIの再利用を含む）か、独自の頻度を設定します。
2. エージェントワークスペースに小さな`HEARTBEAT.md`チェックリストまたは`tasks:`ブロックを作成します（任意ですが推奨）。
3. Heartbeatメッセージの送信先を決めます（デフォルトは`target: "none"`です。最後の連絡先へルーティングするには`target: "last"`を設定します）。
4. 任意で、透明性のためにHeartbeatのreasoning配信を有効にします。
5. 任意で、Heartbeat実行が`HEARTBEAT.md`だけを必要とする場合は軽量なブートストラップコンテキストを使います。
6. 任意で、各Heartbeatで会話履歴全体を送らないように分離セッションを有効にします。
7. 任意で、Heartbeatをアクティブ時間帯（ローカル時刻）に制限します。

設定例:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 最後の連絡先へ明示的に配信（デフォルトは"none"）
        directPolicy: "allow", // デフォルト: direct/DM宛先を許可。抑制するには"block"
        lightContext: true, // 任意: ブートストラップファイルからHEARTBEAT.mdのみを注入
        isolatedSession: true, // 任意: 毎回新しいセッションで実行（会話履歴なし）
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 任意: 別個の`Reasoning:`メッセージも送信
      },
    },
  },
}
```

## デフォルト

- 間隔: `30m`（またはAnthropic OAuth/トークン認証が検出された認証モードの場合は`1h`。Claude CLI再利用を含む）。`agents.defaults.heartbeat.every`またはエージェントごとの`agents.list[].heartbeat.every`を設定してください。無効化には`0m`を使います。
- プロンプト本文（`agents.defaults.heartbeat.prompt`で設定可能）:
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Heartbeatプロンプトはユーザーメッセージとして**そのまま**送信されます。システム
  プロンプトには、デフォルトエージェントでHeartbeatが有効な場合にのみ、
  かつ実行が内部的にフラグ付けされている場合にのみ「Heartbeat」セクションが含まれます。
- Heartbeatが`0m`で無効化されている場合、通常実行でもブートストラップコンテキストから
  `HEARTBEAT.md`が省略されるため、モデルはHeartbeat専用の指示を見ません。
- アクティブ時間帯（`heartbeat.activeHours`）は設定されたタイムゾーンで判定されます。
  時間帯の外では、次に時間帯内に入るティックまでHeartbeatはスキップされます。

## Heartbeatプロンプトの目的

デフォルトのプロンプトは、意図的に広いものになっています。

- **バックグラウンドタスク**: 「未処理のタスクを考慮する」は、エージェントに
  フォローアップ（受信箱、カレンダー、リマインダー、キュー済み作業）を確認し、
  緊急のものがあれば知らせるよう促します。
- **人間へのチェックイン**: 「日中にときどき人間を気にかける」は、
  ときどき軽く「何か必要？」と送ることを促しますが、設定したローカルタイムゾーンを使って
  夜間のスパムを避けます（[/concepts/timezone](/ja-JP/concepts/timezone)を参照）。

Heartbeatは完了した[background tasks](/ja-JP/automation/tasks)に反応できますが、Heartbeat実行自体はタスクレコードを作成しません。

Heartbeatに非常に具体的なこと（たとえば「Gmail PubSub統計を確認する」
や「gatewayの健全性を確認する」）をさせたい場合は、`agents.defaults.heartbeat.prompt`（または
`agents.list[].heartbeat.prompt`）にカスタム本文を設定してください（そのまま送信されます）。

## 応答契約

- 注意が必要なことがない場合は、**`HEARTBEAT_OK`**で返信します。
- Heartbeat実行中、OpenClawは返信の**先頭または末尾**に`HEARTBEAT_OK`がある場合、
  それをackとして扱います。このトークンは取り除かれ、残りの内容が
  **≤ `ackMaxChars`**（デフォルト: 300）の場合、返信は破棄されます。
- `HEARTBEAT_OK`が返信の**途中**にある場合、特別扱いされません。
- アラートの場合、**`HEARTBEAT_OK`を含めないでください**。アラート本文だけを返してください。

Heartbeat以外では、メッセージの先頭/末尾にある stray な`HEARTBEAT_OK`は削除されて
ログ記録されます。メッセージが`HEARTBEAT_OK`だけの場合は破棄されます。

## 設定

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // デフォルト: 30m（0mで無効化）
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // デフォルト: false（利用可能な場合は別個のReasoning:メッセージを配信）
        lightContext: false, // デフォルト: false。trueにするとワークスペースブートストラップファイルからHEARTBEAT.mdのみ保持
        isolatedSession: false, // デフォルト: false。trueにすると各Heartbeatを新しいセッションで実行（会話履歴なし）
        target: "last", // デフォルト: none | 選択肢: last | none | <channel id>（コアまたはplugin。例: "bluebubbles"）
        to: "+15551234567", // 任意のチャネル固有の上書き
        accountId: "ops-bot", // 任意のマルチアカウントチャネルid
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OKの後に許容される最大文字数
      },
    },
  },
}
```

### スコープと優先順位

- `agents.defaults.heartbeat`はグローバルなHeartbeat挙動を設定します。
- `agents.list[].heartbeat`はその上にマージされます。いずれかのエージェントに`heartbeat`ブロックがある場合、**それらのエージェントだけ**がHeartbeatを実行します。
- `channels.defaults.heartbeat`はすべてのチャネルの表示デフォルトを設定します。
- `channels.<channel>.heartbeat`はチャネルデフォルトを上書きします。
- `channels.<channel>.accounts.<id>.heartbeat`（マルチアカウントチャネル）はチャネルごとの設定を上書きします。

### エージェントごとのHeartbeat

いずれかの`agents.list[]`エントリに`heartbeat`ブロックが含まれる場合、**そのエージェントだけ**が
Heartbeatを実行します。エージェントごとのブロックは`agents.defaults.heartbeat`
の上にマージされます（共有デフォルトを一度だけ設定し、エージェントごとに上書きできます）。

例: 2つのエージェントがあり、2つ目のエージェントだけがHeartbeatを実行します。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 最後の連絡先へ明示的に配信（デフォルトは"none"）
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

特定のタイムゾーンでHeartbeatを営業時間内に制限します。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 最後の連絡先へ明示的に配信（デフォルトは"none"）
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // 任意。userTimezoneがあればそれを使い、なければホストのタイムゾーン
        },
      },
    },
  },
}
```

この時間帯の外（Easternで午前9時前または午後10時以降）では、Heartbeatはスキップされます。次に時間帯内で予定されたティックは通常どおり実行されます。

### 24時間365日の設定

Heartbeatを終日実行したい場合は、次のいずれかのパターンを使います。

- `activeHours`自体を省略する（時間帯制限なし。これがデフォルトの挙動です）。
- 終日ウィンドウを設定する: `activeHours: { start: "00:00", end: "24:00" }`。

同じ`start`と`end`時刻（たとえば`08:00`から`08:00`）を設定しないでください。
これは幅ゼロのウィンドウとして扱われるため、Heartbeatは常にスキップされます。

### マルチアカウントの例

Telegramのようなマルチアカウントチャネルで特定のアカウントを対象にするには`accountId`を使います。

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // 任意: 特定のtopic/threadへルーティング
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

### フィールド注記

- `every`: Heartbeat間隔（duration文字列。デフォルト単位 = 分）。
- `model`: Heartbeat実行用の任意のモデル上書き（`provider/model`）。
- `includeReasoning`: 有効にすると、利用可能な場合に別個の`Reasoning:`メッセージも配信します（`/reasoning on`と同じ形）。
- `lightContext`: trueの場合、Heartbeat実行は軽量なブートストラップコンテキストを使い、ワークスペースブートストラップファイルから`HEARTBEAT.md`のみ保持します。
- `isolatedSession`: trueの場合、各Heartbeatは以前の会話履歴のない新しいセッションで実行されます。Cronの`sessionTarget: "isolated"`と同じ分離パターンを使用します。Heartbeatごとのトークンコストを大幅に削減します。最大限節約するには`lightContext: true`と組み合わせてください。配信ルーティングでは引き続きメインセッションコンテキストを使います。
- `session`: Heartbeat実行用の任意のセッションキー。
  - `main`（デフォルト）: エージェントのメインセッション。
  - 明示的なセッションキー（`openclaw sessions --json`または[sessions CLI](/ja-JP/cli/sessions)からコピー）。
  - セッションキー形式: [Sessions](/ja-JP/concepts/session)と[Groups](/ja-JP/channels/groups)を参照。
- `target`:
  - `last`: 最後に使われた外部チャネルへ配信。
  - 明示的なチャネル: 設定済みの任意のチャネルまたはplugin id。例: `discord`、`matrix`、`telegram`、`whatsapp`。
  - `none`（デフォルト）: Heartbeatは実行しますが、外部には**配信しません**。
- `directPolicy`: direct/DM配信の挙動を制御します。
  - `allow`（デフォルト）: direct/DMのHeartbeat配信を許可します。
  - `block`: direct/DM配信を抑制します（`reason=dm-blocked`）。
- `to`: 任意の受信者上書き（チャネル固有id。例: WhatsAppのE.164やTelegram chat id）。Telegramのtopic/threadでは`<chatId>:topic:<messageThreadId>`を使います。
- `accountId`: マルチアカウントチャネル用の任意のアカウントid。`target: "last"`の場合、その最終チャネルがアカウント対応ならそのチャネルに適用され、そうでなければ無視されます。アカウントidが解決されたチャネルの設定済みアカウントと一致しない場合、配信はスキップされます。
- `prompt`: デフォルトのプロンプト本文を上書きします（マージはされません）。
- `ackMaxChars`: 配信前に`HEARTBEAT_OK`の後に許容される最大文字数。
- `suppressToolErrorWarnings`: trueの場合、Heartbeat実行中のツールエラー警告ペイロードを抑制します。
- `activeHours`: Heartbeat実行を時間帯に制限します。`start`（HH:MM、含む。1日の開始には`00:00`を使用）、`end`（HH:MM、含まない。1日の終わりには`24:00`可）、および任意の`timezone`を持つオブジェクト。
  - 省略または`"user"`: `agents.defaults.userTimezone`が設定されていればそれを使い、そうでなければホストシステムのタイムゾーンへフォールバックします。
  - `"local"`: 常にホストシステムのタイムゾーンを使います。
  - 任意のIANA識別子（例: `America/New_York`）: それを直接使います。無効な場合は上記の`"user"`挙動へフォールバックします。
  - アクティブウィンドウにするには`start`と`end`が同じであってはなりません。同値は幅ゼロ（常にウィンドウ外）として扱われます。
  - アクティブウィンドウ外では、次にウィンドウ内に入るティックまでHeartbeatはスキップされます。

## 配信の挙動

- Heartbeatはデフォルトでエージェントのメインセッション（`agent:<id>:<mainKey>`）で実行され、
  `session.scope = "global"`の場合は`global`で実行されます。特定の
  チャネルセッション（Discord/WhatsAppなど）へ上書きするには`session`を設定します。
- `session`は実行コンテキストにのみ影響します。配信は`target`と`to`で制御されます。
- 特定のチャネル/受信者へ配信するには、`target` + `to`を設定します。
  `target: "last"`では、配信はそのセッションの最後の外部チャネルを使います。
- Heartbeat配信では、デフォルトでdirect/DM宛先が許可されます。Heartbeatターン自体は実行したままdirect宛先への送信を抑制するには`directPolicy: "block"`を設定します。
- メインキューがビジーの場合、Heartbeatはスキップされ、あとで再試行されます。
- `target`が外部宛先に解決されない場合でも、実行自体は行われますが、
  外向きメッセージは送信されません。
- `showOk`、`showAlerts`、`useIndicator`がすべて無効な場合、実行は事前に`reason=alerts-disabled`としてスキップされます。
- アラート配信だけが無効な場合、OpenClawはHeartbeatを実行し、期限付きタスクのタイムスタンプを更新し、セッションのアイドルタイムスタンプを復元し、外向きアラートペイロードを抑制できます。
- 解決されたHeartbeat宛先がtypingに対応している場合、OpenClawは
  Heartbeat実行中にtypingを表示します。これはHeartbeatが
  チャット出力を送るのと同じ宛先を使い、`typingMode: "never"`で無効化されます。
- Heartbeat専用の返信は**セッションを生かし続けません**。最後の`updatedAt`
  は復元されるため、アイドル期限切れは通常どおり動作します。
- Control UIとWebChatの履歴では、HeartbeatプロンプトとOKのみの
  ackが非表示になります。監査/リプレイ用に、基盤となるセッショントランスクリプトにはそれらの
  ターンが含まれる場合があります。
- 切り離された[background tasks](/ja-JP/automation/tasks)は、システムイベントをキューに入れ、
  メインセッションが何かにすぐ気づくべきときにHeartbeatを起こすことができます。そのwakeによってHeartbeat実行がbackground taskになることはありません。

## 表示制御

デフォルトでは、`HEARTBEAT_OK`のackは抑制され、アラート内容は
配信されます。これはチャネルごと、またはアカウントごとに調整できます。

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OKを非表示（デフォルト）
      showAlerts: true # アラートメッセージを表示（デフォルト）
      useIndicator: true # インジケーターイベントを発行（デフォルト）
  telegram:
    heartbeat:
      showOk: true # TelegramではOK ackを表示
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # このアカウントではアラート配信を抑制
```

優先順位: アカウントごと → チャネルごと → チャネルデフォルト → 組み込みデフォルト。

### 各フラグの役割

- `showOk`: モデルがOKのみの返信を返したときに`HEARTBEAT_OK` ackを送信します。
- `showAlerts`: モデルが非OKの返信を返したときにアラート内容を送信します。
- `useIndicator`: UIのステータスサーフェス用にインジケーターイベントを発行します。

**3つすべて**がfalseの場合、OpenClawはHeartbeat実行自体をスキップします（モデル呼び出しなし）。

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
      showOk: true # すべてのSlackアカウント
    accounts:
      ops:
        heartbeat:
          showAlerts: false # opsアカウントのみアラートを抑制
  telegram:
    heartbeat:
      showOk: true
```

### よくあるパターン

| 目的 | 設定 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| デフォルトの挙動（OKは無音、アラートは有効） | _(設定不要)_                                                                     |
| 完全に無音（メッセージなし、インジケーターなし） | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| インジケーターのみ（メッセージなし）             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 1つのチャネルでのみOKを表示                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md（任意）

ワークスペースに`HEARTBEAT.md`ファイルが存在する場合、デフォルトプロンプトは
エージェントにそれを読むよう指示します。これは「Heartbeatチェックリスト」と考えてください。小さく、安定していて、
30分ごとに含めても安全なものです。

通常実行では、`HEARTBEAT.md`はデフォルトエージェントでHeartbeatガイダンスが
有効なときにのみ注入されます。Heartbeat頻度を`0m`で無効化するか、
`includeSystemPromptSection: false`を設定すると、通常のブートストラップ
コンテキストからは省略されます。

`HEARTBEAT.md`が存在しても実質的に空（空行と`# Heading`のようなMarkdown
見出しだけ）の場合、OpenClawはAPI呼び出しを節約するためHeartbeat実行をスキップします。
このスキップは`reason=empty-heartbeat-file`として報告されます。
ファイルが存在しない場合でも、Heartbeatは実行され、何をするかはモデルが決めます。

プロンプトが肥大化しないよう、小さく保ってください（短いチェックリストやリマインダー）。

`HEARTBEAT.md`の例:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:`ブロック

`HEARTBEAT.md`は、Heartbeat自体の中で間隔ベースの
チェックを行うための小さな構造化`tasks:`ブロックにも対応しています。

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

挙動:

- OpenClawは`tasks:`ブロックをパースし、各タスクをそれぞれの`interval`に照らして確認します。
- そのティックで**期限到来済み**のタスクだけがHeartbeatプロンプトに含まれます。
- 期限到来済みタスクが1つもない場合、無駄なモデル呼び出しを避けるためHeartbeatは完全にスキップされます（`reason=no-tasks-due`）。
- `HEARTBEAT.md`内のタスク以外の内容は保持され、期限到来済みタスクリストの後に追加コンテキストとして付加されます。
- タスクの最終実行タイムスタンプはセッション状態（`heartbeatTaskState`）に保存されるため、通常の再起動をまたいでも間隔が維持されます。
- タスクタイムスタンプは、Heartbeat実行が通常の返信経路を完了したあとにのみ進められます。`empty-heartbeat-file` / `no-tasks-due`でスキップされた実行は、タスク完了として記録されません。

タスクモードは、複数の定期チェックを1つのHeartbeatファイルに持たせつつ、
毎ティックそのすべてにコストを払いたくない場合に便利です。

### エージェントはHEARTBEAT.mdを更新できますか？

はい。そうするよう指示すればできます。

`HEARTBEAT.md`はエージェントワークスペース内の普通のファイルなので、通常のチャットで
エージェントに次のように伝えられます。

- 「`HEARTBEAT.md`を更新して、毎日のカレンダーチェックを追加して」
- 「`HEARTBEAT.md`を書き直して、もっと短くして受信箱のフォローアップに集中させて」

これを能動的に行わせたい場合は、Heartbeatプロンプトに
「チェックリストが古くなったら、より良いものに`HEARTBEAT.md`
を更新すること」のような明示的な一文を入れることもできます。

安全上の注意: `HEARTBEAT.md`にはシークレット（APIキー、電話番号、プライベートトークン）を
入れないでください。プロンプトコンテキストの一部になります。

## 手動wake（オンデマンド）

システムイベントをキューに入れ、即座にHeartbeatをトリガーするには次を実行します。

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

複数のエージェントに`heartbeat`が設定されている場合、手動wakeはそれら
各エージェントのHeartbeatを即座に実行します。

次の予定ティックまで待つには`--mode next-heartbeat`を使います。

## reasoning配信（任意）

デフォルトでは、Heartbeatは最終的な「answer」ペイロードのみ配信します。

透明性が必要な場合は、次を有効にしてください。

- `agents.defaults.heartbeat.includeReasoning: true`

有効にすると、Heartbeatは`Reasoning:`プレフィックス付きの別メッセージも
配信します（`/reasoning on`と同じ形）。これは、エージェントが複数の
セッション/Codexを管理していて、なぜあなたに通知することにしたのかを見たい場合に便利ですが、
望まないほど多くの内部詳細が漏れることもあります。グループチャットでは
無効のままにしておくことを推奨します。

## コスト意識

Heartbeatは完全なエージェントターンを実行します。間隔を短くすると消費トークンは増えます。コストを下げるには:

- `isolatedSession: true`を使い、会話履歴全体を送らないようにする（約100Kトークンから実行ごと約2〜5Kへ削減）。
- `lightContext: true`を使い、ブートストラップファイルを`HEARTBEAT.md`だけに制限する。
- より安価な`model`を設定する（例: `ollama/llama3.2:1b`）。
- `HEARTBEAT.md`を小さく保つ。
- 内部状態更新だけが必要なら`target: "none"`を使う。

## 関連

- [Automation & Tasks](/ja-JP/automation) — すべての自動化メカニズムの概要
- [Background Tasks](/ja-JP/automation/tasks) — 切り離された作業の追跡方法
- [Timezone](/ja-JP/concepts/timezone) — タイムゾーンがHeartbeatスケジューリングにどう影響するか
- [Troubleshooting](/ja-JP/automation/cron-jobs#troubleshooting) — 自動化の問題のデバッグ
