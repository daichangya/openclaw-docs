---
read_when:
    - session id、transcript JSONL、または sessions.json のフィールドをデバッグする必要がある
    - 自動圧縮の動作を変更する、または「圧縮前」のハウスキーピングを追加する
    - メモリフラッシュまたはサイレントな system turn を実装したい
summary: '詳細解説: セッションストア + transcript、ライフサイクル、および（自動）圧縮の内部'
title: セッション管理の詳細解説
x-i18n:
    generated_at: "2026-04-05T12:56:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: e379d624dd7808d3af25ed011079268ce6a9da64bb3f301598884ad4c46ab091
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# セッション管理と圧縮（詳細解説）

このドキュメントでは、OpenClaw がセッションをエンドツーエンドでどのように管理するかを説明します。

- **セッションルーティング**（受信メッセージがどのように `sessionKey` にマッピングされるか）
- **セッションストア**（`sessions.json`）と、その追跡内容
- **transcript の永続化**（`*.jsonl`）とその構造
- **transcript の衛生管理**（実行前のプロバイダー固有の修正）
- **コンテキスト制限**（コンテキストウィンドウと追跡トークンの違い）
- **圧縮**（手動 + 自動圧縮）と、圧縮前処理をどこにフックするか
- **サイレントなハウスキーピング**（例: ユーザーに見える出力を生成すべきでないメモリ書き込み）

まずはより高レベルな概要を見たい場合は、以下から始めてください。

- [/concepts/session](/ja-JP/concepts/session)
- [/concepts/compaction](/ja-JP/concepts/compaction)
- [/concepts/memory](/ja-JP/concepts/memory)
- [/concepts/memory-search](/ja-JP/concepts/memory-search)
- [/concepts/session-pruning](/ja-JP/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

---

## 真実のソース: Gateway

OpenClaw は、セッション状態を所有する単一の **Gateway プロセス** を中心に設計されています。

- UI（macOS アプリ、web Control UI、TUI）は、セッション一覧とトークン数を Gateway に問い合わせるべきです。
- リモートモードでは、セッションファイルはリモートホスト上にあります。「ローカル Mac のファイルを確認する」だけでは、Gateway が実際に使っている内容は反映されません。

---

## 2つの永続化レイヤー

OpenClaw はセッションを 2 つのレイヤーで永続化します。

1. **セッションストア（`sessions.json`）**
   - キー/値マップ: `sessionKey -> SessionEntry`
   - 小さく、可変で、編集しやすい（またはエントリを削除しても安全）
   - セッションメタデータ（現在の session id、最終アクティビティ、トグル、トークンカウンターなど）を追跡します

2. **transcript（`<sessionId>.jsonl`）**
   - ツリー構造を持つ追記専用 transcript（エントリは `id` + `parentId` を持つ）
   - 実際の会話 + ツール呼び出し + 圧縮サマリーを保存します
   - 将来のターンで model context を再構築するために使用されます

---

## ディスク上の場所

エージェントごとに、Gateway ホスト上では以下です。

- ストア: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- transcript: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram トピックセッション: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw はこれらを `src/config/sessions.ts` 経由で解決します。

---

## ストアのメンテナンスとディスク制御

セッション永続化には、`sessions.json` と transcript アーティファクトに対する自動メンテナンス制御（`session.maintenance`）があります。

- `mode`: `warn`（デフォルト）または `enforce`
- `pruneAfter`: 古いエントリの経過時間しきい値（デフォルト `30d`）
- `maxEntries`: `sessions.json` 内のエントリ上限（デフォルト `500`）
- `rotateBytes`: `sessions.json` が大きくなりすぎた場合にローテーションするサイズ（デフォルト `10mb`）
- `resetArchiveRetention`: `*.reset.<timestamp>` transcript アーカイブの保持期間（デフォルト: `pruneAfter` と同じ。`false` でクリーンアップ無効）
- `maxDiskBytes`: セッションディレクトリの任意の容量予算
- `highWaterBytes`: クリーンアップ後の任意の目標値（デフォルトは `maxDiskBytes` の `80%`）

ディスク容量予算クリーンアップの適用順序（`mode: "enforce"`）:

1. まず、最も古いアーカイブ済みまたは孤立した transcript アーティファクトを削除します。
2. それでも目標値を上回る場合は、最も古いセッションエントリとその transcript ファイルを削除します。
3. 使用量が `highWaterBytes` 以下になるまで続けます。

`mode: "warn"` では、OpenClaw は削除候補を報告しますが、ストア/ファイルは変更しません。

必要に応じてメンテナンスを実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron セッションと実行ログ

分離された cron 実行もセッションエントリ/transcript を作成し、それらには専用の保持制御があります。

- `cron.sessionRetention`（デフォルト `24h`）は、古い分離 cron 実行セッションをセッションストアから削除します（`false` で無効）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` は、`~/.openclaw/cron/runs/<jobId>.jsonl` ファイルを剪定します（デフォルト: `2_000_000` バイトと `2000` 行）。

---

## セッションキー（`sessionKey`）

`sessionKey` は、_どの会話バケットにいるか_ を識別します（ルーティング + 分離）。

よくあるパターン:

- メイン/ダイレクトチャット（エージェントごと）: `agent:<agentId>:<mainKey>`（デフォルト `main`）
- グループ: `agent:<agentId>:<channel>:group:<id>`
- ルーム/チャンネル（Discord/Slack）: `agent:<agentId>:<channel>:channel:<id>` または `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>`（上書きされていない場合）

正規のルールは [/concepts/session](/ja-JP/concepts/session) に記載されています。

---

## セッション id（`sessionId`）

各 `sessionKey` は現在の `sessionId`（会話を継続する transcript ファイル）を指します。

経験則:

- **リセット**（`/new`、`/reset`）は、その `sessionKey` に対して新しい `sessionId` を作成します。
- **日次リセット**（デフォルトでは Gateway ホストのローカル時刻で午前 4:00）は、リセット境界を超えた次のメッセージで新しい `sessionId` を作成します。
- **アイドル期限切れ**（`session.reset.idleMinutes` または旧 `session.idleMinutes`）は、アイドル時間枠の後にメッセージが到着すると新しい `sessionId` を作成します。日次 + アイドルの両方が設定されている場合は、先に期限切れになる方が優先されます。
- **スレッド親フォークガード**（`session.parentForkMaxTokens`、デフォルト `100000`）は、親セッションがすでに大きすぎる場合に親 transcript のフォークをスキップします。新しいスレッドは新規に開始されます。無効にするには `0` を設定します。

実装の詳細: 判定は `src/auto-reply/reply/session.ts` の `initSessionState()` で行われます。

---

## セッションストアのスキーマ（`sessions.json`）

ストアの値型は `src/config/sessions.ts` の `SessionEntry` です。

主なフィールド（網羅ではありません）:

- `sessionId`: 現在の transcript id（`sessionFile` が設定されていない限り、ファイル名はこれから導出されます）
- `updatedAt`: 最終アクティビティのタイムスタンプ
- `sessionFile`: 任意の明示的な transcript パス上書き
- `chatType`: `direct | group | room`（UI と送信ポリシーに役立ちます）
- `provider`, `subject`, `room`, `space`, `displayName`: グループ/チャンネル表示用のメタデータ
- トグル:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy`（セッションごとの上書き）
- モデル選択:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- トークンカウンター（ベストエフォート / プロバイダー依存）:
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: この session key に対して自動圧縮が完了した回数
- `memoryFlushAt`: 直近の圧縮前メモリフラッシュのタイムスタンプ
- `memoryFlushCompactionCount`: 直近のフラッシュ実行時の圧縮回数

ストアは安全に編集できますが、権威を持つのは Gateway です。セッション実行中にエントリを書き換えたり再水和したりすることがあります。

---

## transcript の構造（`*.jsonl`）

transcript は `@mariozechner/pi-coding-agent` の `SessionManager` によって管理されます。

ファイルは JSONL です。

- 1 行目: セッションヘッダー（`type: "session"`、`id`、`cwd`、`timestamp`、任意の `parentSession` を含む）
- 以降: `id` + `parentId` を持つセッションエントリ（ツリー）

主なエントリ型:

- `message`: user/assistant/toolResult メッセージ
- `custom_message`: model context に _入る_ 拡張注入メッセージ（UI では非表示にできる）
- `custom`: model context に _入らない_ 拡張状態
- `compaction`: `firstKeptEntryId` と `tokensBefore` を持つ永続化された圧縮サマリー
- `branch_summary`: ツリーブランチ移動時の永続化されたサマリー

OpenClaw は意図的に transcript を「修正」しません。Gateway は `SessionManager` を使ってそれらを読み書きします。

---

## コンテキストウィンドウと追跡トークンの違い

重要なのは 2 つの異なる概念です。

1. **モデルのコンテキストウィンドウ**: モデルごとのハード上限（モデルに見えるトークン数）
2. **セッションストアのカウンター**: `sessions.json` に書き込まれるローリング統計（`/status` とダッシュボードで使用）

制限を調整する場合:

- コンテキストウィンドウはモデルカタログから取得されます（設定で上書きすることもできます）。
- ストア内の `contextTokens` はランタイム時の推定値/報告値です。厳密な保証として扱わないでください。

詳しくは [/token-use](/reference/token-use) を参照してください。

---

## 圧縮: それが何か

圧縮は、古い会話を transcript 内の永続化された `compaction` エントリに要約し、最近のメッセージはそのまま保持します。

圧縮後、将来のターンでは以下が見えるようになります。

- 圧縮サマリー
- `firstKeptEntryId` 以降のメッセージ

圧縮は **永続的** です（セッション剪定とは異なります）。[/concepts/session-pruning](/ja-JP/concepts/session-pruning) を参照してください。

## 圧縮チャンク境界とツールのペアリング

OpenClaw が長い transcript を圧縮チャンクに分割するとき、assistant のツール呼び出しと対応する `toolResult` エントリのペアが保たれます。

- トークン比率ベースの分割位置がツール呼び出しとその結果の間に来る場合、OpenClaw はペアを分離する代わりに、境界を assistant のツール呼び出しメッセージ側へ移動します。
- 末尾の tool-result ブロックがそのままだとチャンクを目標サイズ超過にしてしまう場合、OpenClaw はその保留中ツールブロックを保持し、未要約の末尾をそのまま維持します。
- 中断/エラーになったツール呼び出しブロックは、保留中の分割を維持しません。

---

## 自動圧縮がいつ発生するか（Pi ランタイム）

組み込み Pi エージェントでは、自動圧縮は 2 つのケースで発動します。

1. **オーバーフロー回復**: モデルがコンテキストオーバーフローエラーを返した場合
   （`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`、および同様のプロバイダー固有バリアント）→ 圧縮 → 再試行。
2. **しきい値メンテナンス**: 正常なターンの後で、以下のとき

`contextTokens > contextWindow - reserveTokens`

ここで:

- `contextWindow` はモデルのコンテキストウィンドウ
- `reserveTokens` はプロンプト + 次のモデル出力のために予約されたヘッドルーム

これらは Pi ランタイムのセマンティクスです（OpenClaw はイベントを消費しますが、圧縮のタイミングを決めるのは Pi です）。

---

## 圧縮設定（`reserveTokens`, `keepRecentTokens`）

Pi の圧縮設定は Pi settings にあります。

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw は組み込み実行に対して安全下限も適用します。

- `compaction.reserveTokens < reserveTokensFloor` の場合、OpenClaw はその値を引き上げます。
- デフォルトの下限は `20000` トークンです。
- 下限を無効にするには `agents.defaults.compaction.reserveTokensFloor: 0` を設定します。
- すでにそれより高い場合、OpenClaw はそのままにします。

理由: 圧縮が避けられなくなる前に、複数ターンにわたる「ハウスキーピング」（メモリ書き込みなど）のために十分なヘッドルームを残すためです。

実装: `src/agents/pi-settings.ts` の `ensurePiCompactionReserveTokens()`
（`src/agents/pi-embedded-runner.ts` から呼び出されます）。

---

## ユーザーに見えるサーフェス

圧縮とセッション状態は以下から確認できます。

- `/status`（任意のチャットセッション内）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- Verbose モード: `🧹 Auto-compaction complete` + 圧縮回数

---

## サイレントなハウスキーピング（`NO_REPLY`）

OpenClaw は、ユーザーが中間出力を見るべきでないバックグラウンドタスク向けに「サイレント」ターンをサポートしています。

慣例:

- assistant は、正確なサイレントトークン `NO_REPLY` /
  `no_reply` で出力を始めることで、「ユーザーに返信を配信しない」ことを示します。
- OpenClaw は配信レイヤーでこれを取り除くか抑制します。
- 正確なサイレントトークン抑制は大文字小文字を区別しないため、ペイロード全体がそのサイレントトークンだけである場合、`NO_REPLY` と
  `no_reply` の両方が該当します。
- これは真のバックグラウンド/非配信ターン専用であり、
  通常の実行可能なユーザー要求の近道ではありません。

`2026.1.10` 時点で、OpenClaw は partial chunk が `NO_REPLY` で始まると **draft/typing streaming** も抑制するため、サイレント操作でターン途中の部分出力が漏れません。

---

## 圧縮前の「メモリフラッシュ」（実装済み）

目的: 自動圧縮が起きる前に、永続的な状態をディスクに書き込むサイレントな agentic turn を実行することです（例: エージェントワークスペース内の `memory/YYYY-MM-DD.md`）。これにより、圧縮で重要なコンテキストが失われるのを防ぎます。

OpenClaw は **しきい値前フラッシュ** アプローチを使用します。

1. セッションのコンテキスト使用量を監視します。
2. それが「ソフトしきい値」（Pi の圧縮しきい値より下）を超えたら、サイレントな
   「今すぐメモリを書き込む」指示をエージェントに実行させます。
3. ユーザーに何も見せないよう、正確なサイレントトークン `NO_REPLY` / `no_reply` を使用します。

設定（`agents.defaults.compaction.memoryFlush`）:

- `enabled`（デフォルト: `true`）
- `softThresholdTokens`（デフォルト: `4000`）
- `prompt`（フラッシュターン用の user message）
- `systemPrompt`（フラッシュターン用に追加される extra system prompt）

補足:

- デフォルトの prompt/system prompt には、配信を抑制するための `NO_REPLY` ヒントが含まれています。
- フラッシュは圧縮サイクルごとに 1 回実行されます（`sessions.json` で追跡）。
- フラッシュは組み込み Pi セッションでのみ実行されます（CLI バックエンドではスキップされます）。
- セッションワークスペースが読み取り専用（`workspaceAccess: "ro"` または `"none"`）の場合、フラッシュはスキップされます。
- ワークスペースのファイル配置と書き込みパターンについては [Memory](/ja-JP/concepts/memory) を参照してください。

Pi は拡張 API で `session_before_compact` フックも公開していますが、OpenClaw のフラッシュロジックは現在 Gateway 側にあります。

---

## トラブルシューティングチェックリスト

- session key が間違っている？ まず [/concepts/session](/ja-JP/concepts/session) を確認し、`/status` の `sessionKey` を確認してください。
- ストアと transcript が一致しない？ Gateway ホストと、`openclaw status` から得られるストアパスを確認してください。
- 圧縮が多すぎる？ 以下を確認してください:
  - モデルのコンテキストウィンドウ（小さすぎないか）
  - 圧縮設定（モデルウィンドウに対して `reserveTokens` が高すぎると、早めに圧縮が起きることがあります）
  - tool-result の肥大化: セッション剪定を有効化/調整する
- サイレントターンが漏れる？ 返信が `NO_REPLY`（大文字小文字を区別しない正確なトークン）で始まっていること、および streaming 抑制修正を含むビルドを使用していることを確認してください。
