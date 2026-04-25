---
read_when:
    - セッション ID、transcript JSONL、または `sessions.json` フィールドをデバッグする必要があります
    - 自動 Compaction の動作を変更している、または「pre-compaction」のハウスキーピングを追加しています
    - メモリフラッシュまたはサイレントシステムターンを実装したいです
summary: '詳細解説: セッションストア + transcript、ライフサイクル、および（自動）Compaction の内部構造'
title: セッション管理の詳細解説
x-i18n:
    generated_at: "2026-04-25T13:58:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: f15b8cf4b1deb947b292c6931257218d7147c11c963e7bf2689b6d1f77ea8159
    source_path: reference/session-management-compaction.md
    workflow: 15
---

このページでは、OpenClaw がセッションをエンドツーエンドでどのように管理するかを説明します。

- **セッションルーティング**（受信メッセージがどのように `sessionKey` に対応付けられるか）
- **セッションストア**（`sessions.json`）と、そこで追跡される内容
- **transcript 永続化**（`*.jsonl`）とその構造
- **transcript hygiene**（実行前の provider 固有の補正）
- **コンテキスト制限**（コンテキストウィンドウ vs 追跡トークン）
- **Compaction**（手動 + 自動 Compaction）と、pre-compaction 作業をフックする場所
- **サイレントなハウスキーピング**（例: ユーザーに見える出力を生成すべきでないメモリ書き込み）

まず高レベルの概要を見たい場合は、次から始めてください。

- [Session management](/ja-JP/concepts/session)
- [Compaction](/ja-JP/concepts/compaction)
- [Memory overview](/ja-JP/concepts/memory)
- [Memory search](/ja-JP/concepts/memory-search)
- [Session pruning](/ja-JP/concepts/session-pruning)
- [Transcript hygiene](/ja-JP/reference/transcript-hygiene)

---

## 信頼できる単一の情報源: Gateway

OpenClaw は、セッション状態を所有する単一の **Gateway プロセス** を中心に設計されています。

- UI（macOS アプリ、Web Control UI、TUI）は、セッション一覧とトークン数について Gateway に問い合わせるべきです。
- リモートモードでは、セッションファイルはリモートホスト上にあります。「ローカル Mac のファイルを確認する」だけでは、Gateway が使用している内容は反映されません。

---

## 2 つの永続化レイヤー

OpenClaw はセッションを 2 つのレイヤーで永続化します。

1. **セッションストア（`sessions.json`）**
   - キー/値マップ: `sessionKey -> SessionEntry`
   - 小さく、変更可能で、編集（またはエントリ削除）しても安全
   - セッションメタデータ（現在のセッション ID、最終アクティビティ、トグル、トークンカウンターなど）を追跡

2. **transcript（`<sessionId>.jsonl`）**
   - ツリー構造を持つ追記専用 transcript（エントリは `id` + `parentId` を持つ）
   - 実際の会話 + ツール呼び出し + Compaction 要約を保存
   - 将来のターンのためにモデルコンテキストを再構築するために使用される

---

## ディスク上の場所

Gateway ホスト上で、エージェントごとに:

- ストア: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- transcript: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram トピックセッション: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw は `src/config/sessions.ts` を通じてこれらを解決します。

---

## ストア保守とディスク制御

セッション永続化には、`sessions.json` と transcript アーティファクト用の自動保守制御（`session.maintenance`）があります。

- `mode`: `warn`（デフォルト）または `enforce`
- `pruneAfter`: 古いエントリの経過期間しきい値（デフォルト `30d`）
- `maxEntries`: `sessions.json` 内のエントリ上限（デフォルト `500`）
- `rotateBytes`: サイズ超過時に `sessions.json` をローテーション（デフォルト `10mb`）
- `resetArchiveRetention`: `*.reset.<timestamp>` transcript アーカイブの保持期間（デフォルト: `pruneAfter` と同じ。`false` でクリーンアップ無効）
- `maxDiskBytes`: 任意の sessions ディレクトリ予算
- `highWaterBytes`: クリーンアップ後の任意の目標値（デフォルトは `maxDiskBytes` の `80%`）

ディスク予算クリーンアップ（`mode: "enforce"`）の強制順序:

1. 最初に最も古いアーカイブ済みまたは孤立した transcript アーティファクトを削除する。
2. それでも目標を超える場合、最も古いセッションエントリとその transcript ファイルを退避する。
3. 使用量が `highWaterBytes` 以下になるまで続ける。

`mode: "warn"` では、OpenClaw は潜在的な退避を報告しますが、ストア/ファイルは変更しません。

必要に応じて保守を実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron セッションと実行ログ

分離された Cron 実行もセッションエントリ/transcript を作成し、専用の保持制御があります。

- `cron.sessionRetention`（デフォルト `24h`）は、古い分離 Cron 実行セッションをセッションストアから削除します（`false` で無効）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` は `~/.openclaw/cron/runs/<jobId>.jsonl` ファイルを削減します（デフォルト: `2_000_000` バイトおよび `2000` 行）。

Cron が新しい分離実行セッションを強制作成するときは、新しい行を書き込む前に以前の `cron:<jobId>` セッションエントリをサニタイズします。思考/fast/verbose 設定、ラベル、明示的にユーザーが選択した model/auth オーバーライドなどの安全な設定は引き継ぎます。チャネル/グループルーティング、送信またはキューポリシー、昇格、origin、ACP ランタイムバインディングなどの周辺会話コンテキストは削除し、新しい分離実行が古い実行から古い配信権限やランタイム権限を引き継がないようにします。

---

## セッションキー（`sessionKey`）

`sessionKey` は、どの _会話バケット_ にいるか（ルーティング + 分離）を識別します。

一般的なパターン:

- メイン/ダイレクトチャット（エージェントごと）: `agent:<agentId>:<mainKey>`（デフォルト `main`）
- グループ: `agent:<agentId>:<channel>:group:<id>`
- ルーム/チャネル（Discord/Slack）: `agent:<agentId>:<channel>:channel:<id>` または `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>`（上書きされない限り）

正規ルールは [/concepts/session](/ja-JP/concepts/session) に記載されています。

---

## セッション ID（`sessionId`）

各 `sessionKey` は現在の `sessionId`（会話を継続する transcript ファイル）を指します。

経験則:

- **リセット**（`/new`、`/reset`）は、その `sessionKey` に対して新しい `sessionId` を作成します。
- **日次リセット**（デフォルトでは Gateway ホストのローカル時刻で午前 4:00）は、リセット境界後の次のメッセージで新しい `sessionId` を作成します。
- **アイドル期限切れ**（`session.reset.idleMinutes` またはレガシーな `session.idleMinutes`）は、アイドルウィンドウ経過後にメッセージが到着すると新しい `sessionId` を作成します。日次 + アイドルの両方が設定されている場合、先に期限切れになる方が優先されます。
- **スレッド親フォークガード**（`session.parentForkMaxTokens`、デフォルト `100000`）は、親セッションがすでに大きすぎる場合に親 transcript のフォークをスキップします。新しいスレッドは新規開始されます。無効にするには `0` を設定します。

実装の詳細: 判定は `src/auto-reply/reply/session.ts` の `initSessionState()` で行われます。

---

## セッションストアスキーマ（`sessions.json`）

ストアの値型は `src/config/sessions.ts` の `SessionEntry` です。

主なフィールド（網羅的ではありません）:

- `sessionId`: 現在の transcript ID（`sessionFile` が設定されていない限り、ファイル名はこれから導出される）
- `updatedAt`: 最終アクティビティのタイムスタンプ
- `sessionFile`: 任意の明示的な transcript パス上書き
- `chatType`: `direct | group | room`（UI と送信ポリシーに役立つ）
- `provider`, `subject`, `room`, `space`, `displayName`: グループ/チャネルラベル用メタデータ
- トグル:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy`（セッションごとの上書き）
- モデル選択:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- トークンカウンター（ベストエフォート / provider 依存）:
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: このセッションキーに対して自動 Compaction が完了した回数
- `memoryFlushAt`: 最後の pre-compaction メモリフラッシュのタイムスタンプ
- `memoryFlushCompactionCount`: 最後のフラッシュ実行時の Compaction 回数

ストアは編集しても安全ですが、権威を持つのは Gateway です。セッション実行中にエントリを書き換えたり再水和したりすることがあります。

---

## transcript 構造（`*.jsonl`）

transcript は `@mariozechner/pi-coding-agent` の `SessionManager` によって管理されます。

ファイルは JSONL です。

- 1 行目: セッションヘッダー（`type: "session"`、`id`、`cwd`、`timestamp`、任意の `parentSession` を含む）
- その後: `id` + `parentId` を持つセッションエントリ（ツリー）

注目すべきエントリ型:

- `message`: user/assistant/toolResult メッセージ
- `custom_message`: モデルコンテキストに _入る_ 拡張注入メッセージ（UI では非表示にできる）
- `custom`: モデルコンテキストに _入らない_ 拡張状態
- `compaction`: `firstKeptEntryId` と `tokensBefore` を持つ永続化された Compaction 要約
- `branch_summary`: ツリーブランチ移動時の永続化された要約

OpenClaw は意図的に transcript を「修正」しません。Gateway は `SessionManager` を使ってそれらを読み書きします。

---

## コンテキストウィンドウ vs 追跡トークン

重要なのは 2 つの異なる概念です。

1. **モデルコンテキストウィンドウ**: モデルごとのハード上限（モデルに見えるトークン）
2. **セッションストアカウンター**: `sessions.json` に書き込まれるローリング統計（`/status` やダッシュボードに使用）

制限を調整している場合:

- コンテキストウィンドウはモデルカタログから取得されます（config で上書き可能）。
- ストア内の `contextTokens` はランタイムの推定/レポート値です。厳密な保証として扱わないでください。

詳細は [/token-use](/ja-JP/reference/token-use) を参照してください。

---

## Compaction: それが何か

Compaction は、古い会話を transcript 内の永続化された `compaction` エントリに要約し、最近のメッセージはそのまま保つ処理です。

Compaction 後、将来のターンに見えるもの:

- Compaction 要約
- `firstKeptEntryId` 以降のメッセージ

Compaction は**永続的**です（session pruning とは異なります）。[/concepts/session-pruning](/ja-JP/concepts/session-pruning) を参照してください。

## Compaction のチャンク境界とツールのペアリング

OpenClaw が長い transcript を Compaction チャンクに分割するとき、assistant のツール呼び出しを対応する `toolResult` エントリとペアのまま保ちます。

- トークン比率による分割位置がツール呼び出しとその結果の間に来る場合、OpenClaw はペアを分離する代わりに境界を assistant のツール呼び出しメッセージまで移動します。
- 末尾のツール結果ブロックによってチャンクが目標サイズを超える場合でも、OpenClaw はその保留中ツールブロックを保持し、未要約の末尾をそのまま保ちます。
- 中断/エラーのツール呼び出しブロックは、保留中分割を維持しません。

---

## 自動 Compaction が発生するタイミング（Pi ランタイム）

埋め込み Pi エージェントでは、自動 Compaction は 2 つの場合に発生します。

1. **オーバーフロー回復**: モデルがコンテキストオーバーフローエラー
   （`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`、および同様の provider 形式のバリエーション）を返した場合 → compact → retry。
2. **しきい値保守**: ターン成功後、次の条件のとき:

`contextTokens > contextWindow - reserveTokens`

ここで:

- `contextWindow` はモデルのコンテキストウィンドウ
- `reserveTokens` はプロンプト + 次のモデル出力のために確保されるヘッドルーム

これらは Pi ランタイムの意味論です（OpenClaw はイベントを消費しますが、Compaction のタイミングを決めるのは Pi です）。

---

## Compaction 設定（`reserveTokens`、`keepRecentTokens`）

Pi の Compaction 設定は Pi settings にあります。

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw は、埋め込み実行に対して安全下限も強制します。

- `compaction.reserveTokens < reserveTokensFloor` の場合、OpenClaw はそれを引き上げます。
- デフォルトの下限は `20000` トークンです。
- 下限を無効にするには `agents.defaults.compaction.reserveTokensFloor: 0` を設定します。
- すでにそれより高い場合、OpenClaw はそのままにします。
- 手動 `/compact` は、明示的な `agents.defaults.compaction.keepRecentTokens` を尊重し、Pi の recent-tail カットポイントを維持します。明示的な keep 予算がない場合、手動 Compaction はハードチェックポイントのままとなり、再構築されたコンテキストは新しい要約から開始します。

理由: Compaction が避けられなくなる前に、メモリ書き込みのような複数ターンの「ハウスキーピング」のための十分なヘッドルームを残すためです。

実装: `src/agents/pi-settings.ts` の `ensurePiCompactionReserveTokens()`
（`src/agents/pi-embedded-runner.ts` から呼び出されます）。

---

## 差し替え可能な Compaction provider

Plugin は plugin API の `registerCompactionProvider()` を介して Compaction provider を登録できます。`agents.defaults.compaction.provider` が登録済み provider ID に設定されている場合、safeguard 拡張は組み込みの `summarizeInStages` パイプラインの代わりに、その provider に要約を委譲します。

- `provider`: 登録済み Compaction provider Plugin の ID。デフォルトの LLM 要約を使う場合は未設定のままにします。
- `provider` を設定すると `mode: "safeguard"` が強制されます。
- provider は、組み込みパスと同じ Compaction 指示および識別子保持ポリシーを受け取ります。
- safeguard は、provider 出力後も recent-turn と split-turn のサフィックスコンテキストを保持します。
- 組み込みの safeguard 要約は、以前の要約全体をそのまま保持するのではなく、新しいメッセージとともに以前の要約を再蒸留します。
- safeguard モードはデフォルトで要約品質監査を有効にします。出力不正時の再試行動作をスキップするには `qualityGuard.enabled: false` を設定してください。
- provider が失敗したり空の結果を返したりした場合、OpenClaw は自動的に組み込みの LLM 要約にフォールバックします。
- 中断/タイムアウトシグナルは、呼び出し元のキャンセルを尊重するために再スローされます（握りつぶされません）。

ソース: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## ユーザーに見えるサーフェス

Compaction とセッション状態は次で確認できます。

- `/status`（任意のチャットセッション）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- 詳細モード: `🧹 Auto-compaction complete` + Compaction 回数

---

## サイレントなハウスキーピング（`NO_REPLY`）

OpenClaw は、ユーザーに中間出力を見せるべきでないバックグラウンドタスク向けに「サイレント」ターンをサポートしています。

慣例:

- アシスタントは、出力の先頭に厳密なサイレントトークン `NO_REPLY` /
  `no_reply` を付けて、「ユーザーに返信を配信しない」ことを示します。
- OpenClaw は配信レイヤーでこれを取り除く/抑制します。
- 厳密なサイレントトークン抑制は大文字小文字を区別しないため、ペイロード全体がサイレントトークンだけであれば `NO_REPLY` と `no_reply` の両方が有効です。
- これは真のバックグラウンド/非配信ターン専用であり、通常の実行可能なユーザー要求の近道ではありません。

`2026.1.10` 時点で、OpenClaw は部分チャンクが `NO_REPLY` で始まる場合、**draft/typing streaming** も抑制するため、サイレント操作がターン途中で部分出力を漏らしません。

---

## pre-compaction の「メモリフラッシュ」（実装済み）

目的: 自動 Compaction が起きる前に、永続状態をディスクに書き込むサイレントなエージェントターンを実行することです（例: エージェントワークスペース内の `memory/YYYY-MM-DD.md`）。これにより、Compaction が重要なコンテキストを消せなくなります。

OpenClaw は **pre-threshold flush** アプローチを使用します。

1. セッションのコンテキスト使用量を監視する。
2. 「ソフトしきい値」（Pi の Compaction しきい値より下）を超えたら、サイレントな
   「今すぐメモリを書き込む」指示をエージェントに実行させる。
3. ユーザーに何も見せないよう、厳密なサイレントトークン `NO_REPLY` / `no_reply` を使う。

config（`agents.defaults.compaction.memoryFlush`）:

- `enabled`（デフォルト: `true`）
- `softThresholdTokens`（デフォルト: `4000`）
- `prompt`（フラッシュターン用のユーザーメッセージ）
- `systemPrompt`（フラッシュターン用に追加される追加システムプロンプト）

注意:

- デフォルトの prompt/system prompt には、配信を抑制するための `NO_REPLY` ヒントが含まれます。
- フラッシュは Compaction サイクルごとに 1 回実行されます（`sessions.json` で追跡）。
- フラッシュは埋め込み Pi セッションでのみ実行されます（CLI バックエンドではスキップ）。
- セッションワークスペースが読み取り専用（`workspaceAccess: "ro"` または `"none"`）の場合、フラッシュはスキップされます。
- ワークスペースのファイルレイアウトと書き込みパターンについては [Memory](/ja-JP/concepts/memory) を参照してください。

Pi も拡張 API で `session_before_compact` フックを公開していますが、OpenClaw のフラッシュロジックは現時点では Gateway 側にあります。

---

## トラブルシューティングチェックリスト

- セッションキーが間違っている？ [/concepts/session](/ja-JP/concepts/session) から始めて、`/status` の `sessionKey` を確認してください。
- ストアと transcript が一致しない？ Gateway ホストと `openclaw status` から得られるストアパスを確認してください。
- Compaction が多すぎる？ 次を確認してください:
  - モデルコンテキストウィンドウ（小さすぎる）
  - Compaction 設定（モデルウィンドウに対して `reserveTokens` が高すぎると、Compaction が早まることがあります）
  - tool-result の肥大化: session pruning を有効化/調整する
- サイレントターンが漏れる？ 返信が `NO_REPLY`（大文字小文字を区別しない厳密トークン）で始まっていることと、streaming 抑制修正を含むビルドであることを確認してください。

## 関連

- [Session management](/ja-JP/concepts/session)
- [Session pruning](/ja-JP/concepts/session-pruning)
- [Context engine](/ja-JP/concepts/context-engine)
