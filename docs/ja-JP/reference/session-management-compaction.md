---
read_when:
    - session id、transcript JSONL、または sessions.json フィールドをデバッグする必要がある場合
    - 自動 Compaction の動作を変更している場合、または「pre-compaction」のハウスキーピングを追加している場合
    - メモリフラッシュやサイレントな system turn を実装したい場合
summary: '詳細解説: session store と transcript、ライフサイクル、そして（自動）Compaction の内部動作'
title: セッション管理の詳細解説
x-i18n:
    generated_at: "2026-04-26T11:39:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: f41f1c403f978c22cc2a929629e1811414d1399fa7f9e28c481fcb594d30196f
    source_path: reference/session-management-compaction.md
    workflow: 15
---

このページでは、OpenClaw がセッションをエンドツーエンドでどのように管理するかを説明します。

- **Session routing**（受信メッセージがどのように `sessionKey` にマップされるか）
- **Session store**（`sessions.json`）と、そこで追跡される内容
- **Transcript の永続化**（`*.jsonl`）とその構造
- **Transcript hygiene**（実行前のプロバイダー固有の修正）
- **コンテキスト制限**（context window と追跡トークン数の違い）
- **Compaction**（手動 + 自動 Compaction）と、pre-compaction 処理をどこにフックするか
- **サイレントなハウスキーピング**（例: ユーザーに見える出力を生成すべきでないメモリ書き込み）

まず高レベルの概要を知りたい場合は、次から始めてください。

- [Session management](/ja-JP/concepts/session)
- [Compaction](/ja-JP/concepts/compaction)
- [Memory overview](/ja-JP/concepts/memory)
- [Memory search](/ja-JP/concepts/memory-search)
- [Session pruning](/ja-JP/concepts/session-pruning)
- [Transcript hygiene](/ja-JP/reference/transcript-hygiene)

---

## 正式な情報源: Gateway

OpenClaw は、セッション状態を所有する単一の **Gateway process** を中心に設計されています。

- UI（macOS app、web Control UI、TUI）は、セッション一覧とトークン数を Gateway に問い合わせるべきです。
- リモートモードでは、セッションファイルはリモートホスト上にあります。「ローカル Mac 上のファイルを確認する」だけでは、Gateway が実際に使っているものは反映されません。

---

## 2 つの永続化レイヤー

OpenClaw はセッションを 2 つのレイヤーで永続化します。

1. **Session store (`sessions.json`)**
   - キー/値マップ: `sessionKey -> SessionEntry`
   - 小さく、可変で、編集しても安全（またはエントリーを削除しても安全）
   - セッションメタデータ（現在の session id、最終アクティビティ、トグル、トークンカウンターなど）を追跡します

2. **Transcript (`<sessionId>.jsonl`)**
   - ツリー構造を持つ追記専用 transcript（エントリーには `id` + `parentId` があります）
   - 実際の会話 + tool 呼び出し + compaction summary を保存します
   - 将来のターンに向けてモデルコンテキストを再構築するために使われます

---

## ディスク上の場所

Gateway ホスト上で、agent ごとに次の場所に保存されます。

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripts: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram topic セッション: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw はこれらを `src/config/sessions.ts` を通じて解決します。

---

## Store のメンテナンスとディスク制御

セッション永続化には、`sessions.json` と transcript アーティファクト向けの自動メンテナンス制御（`session.maintenance`）があります。

- `mode`: `warn`（デフォルト）または `enforce`
- `pruneAfter`: 古いエントリーの期限切れまでの期間（デフォルト `30d`）
- `maxEntries`: `sessions.json` 内のエントリー数上限（デフォルト `500`）
- `rotateBytes`: `sessions.json` が大きすぎる場合にローテーションするしきい値（デフォルト `10mb`）
- `resetArchiveRetention`: `*.reset.<timestamp>` transcript アーカイブの保持期間（デフォルトは `pruneAfter` と同じ。`false` でクリーンアップ無効）
- `maxDiskBytes`: 任意の sessions ディレクトリ予算
- `highWaterBytes`: クリーンアップ後の任意の目標値（デフォルトは `maxDiskBytes` の `80%`）

ディスク予算クリーンアップの適用順序（`mode: "enforce"`）:

1. まず最も古いアーカイブ済みまたは孤立した transcript アーティファクトを削除します。
2. それでも目標値を超える場合は、最も古い session エントリーとその transcript ファイルを削除します。
3. 使用量が `highWaterBytes` 以下になるまで続けます。

`mode: "warn"` では、OpenClaw は削除候補を報告しますが、store やファイルは変更しません。

必要に応じてメンテナンスを実行します。

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron セッションと実行ログ

分離された Cron 実行でも session エントリーと transcript が作成され、それらには専用の保持制御があります。

- `cron.sessionRetention`（デフォルト `24h`）は、古い分離 Cron 実行セッションを session store から削除します（`false` で無効）。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` は `~/.openclaw/cron/runs/<jobId>.jsonl` ファイルを削減します（デフォルト: `2_000_000` bytes と `2000` lines）。

Cron が新しい分離実行セッションを強制的に作成するときは、新しい行を書き込む前に以前の `cron:<jobId>` session エントリーをサニタイズします。thinking/fast/verbose 設定、ラベル、明示的にユーザーが選択した model/auth override など、安全な設定は引き継ぎます。一方で、channel/group ルーティング、送信またはキューポリシー、昇格、origin、ACP ランタイムバインディングのような周辺会話コンテキストは削除されるため、新しい分離実行が古い実行から古い配信権限やランタイム権限を引き継ぐことはありません。

---

## Session keys（`sessionKey`）

`sessionKey` は、今どの _会話バケット_ にいるか（ルーティング + 分離）を識別します。

一般的なパターン:

- メイン/ダイレクトチャット（agent ごと）: `agent:<agentId>:<mainKey>`（デフォルト `main`）
- グループ: `agent:<agentId>:<channel>:group:<id>`
- Room/channel（Discord/Slack）: `agent:<agentId>:<channel>:channel:<id>` または `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>`（上書きされていない場合）

正式なルールは [/concepts/session](/ja-JP/concepts/session) に記載されています。

---

## Session ids（`sessionId`）

各 `sessionKey` は現在の `sessionId`（会話が継続される transcript ファイル）を指します。

経験則:

- **Reset**（`/new`、`/reset`）は、その `sessionKey` に対して新しい `sessionId` を作成します。
- **Daily reset**（デフォルトでは Gateway ホストのローカル時刻で午前 4:00）は、リセット境界を越えた後の次のメッセージで新しい `sessionId` を作成します。
- **Idle expiry**（`session.reset.idleMinutes` または旧 `session.idleMinutes`）は、アイドル期間を過ぎた後にメッセージが届くと新しい `sessionId` を作成します。daily と idle の両方が設定されている場合は、先に期限切れになる方が優先されます。
- **System events**（Heartbeat、Cron wakeup、exec notification、Gateway の bookkeeping）は session 行を変更することがありますが、daily/idle reset の新しさは延長しません。reset ロールオーバーでは、新しいプロンプトが組み立てられる前に、前のセッションに対する queued system-event notice が破棄されます。
- **Thread parent fork guard**（`session.parentForkMaxTokens`、デフォルト `100000`）は、親セッションがすでに大きすぎる場合に親 transcript の fork をスキップします。新しい thread は新規に開始されます。無効化するには `0` を設定します。

実装の詳細: 判定は `src/auto-reply/reply/session.ts` の `initSessionState()` で行われます。

---

## Session store スキーマ（`sessions.json`）

store の値型は `src/config/sessions.ts` の `SessionEntry` です。

主なフィールド（すべてではありません）:

- `sessionId`: 現在の transcript id（`sessionFile` が設定されていない限り、ファイル名はこれから導出されます）
- `sessionStartedAt`: 現在の `sessionId` の開始タイムスタンプ。daily reset の新しさ判定に使われます。古い行では JSONL session header から導出されることがあります。
- `lastInteractionAt`: 実際の最後の user/channel interaction タイムスタンプ。Heartbeat、Cron、exec event がセッションを生かし続けないように、idle reset の新しさはこれを使います。このフィールドがない古い行では、idle の新しさ判定に復元された session start time がフォールバックとして使われます。
- `updatedAt`: store 行の最後の変更タイムスタンプ。一覧、pruning、bookkeeping に使われます。daily/idle reset の新しさ判定の正式な基準ではありません。
- `sessionFile`: 任意の明示的 transcript path override
- `chatType`: `direct | group | room`（UI と送信ポリシーに役立ちます）
- `provider`, `subject`, `room`, `space`, `displayName`: グループ/channel ラベル用メタデータ
- トグル:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy`（セッション単位 override）
- モデル選択:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- トークンカウンター（ベストエフォート/プロバイダー依存）:
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: この session key に対して自動 Compaction が完了した回数
- `memoryFlushAt`: 最後の pre-compaction メモリフラッシュのタイムスタンプ
- `memoryFlushCompactionCount`: 最後のフラッシュが実行された時点の compaction count

store は編集しても安全ですが、正式な権限を持つのは Gateway です。セッション実行中にエントリーを書き直したり再構築したりすることがあります。

---

## Transcript 構造（`*.jsonl`）

Transcript は `@mariozechner/pi-coding-agent` の `SessionManager` によって管理されます。

ファイルは JSONL 形式です。

- 1 行目: session header（`type: "session"`、`id`、`cwd`、`timestamp`、任意で `parentSession` を含む）
- その後: `id` + `parentId` を持つ session エントリー（ツリー）

主なエントリー型:

- `message`: user/assistant/toolResult メッセージ
- `custom_message`: 拡張が注入したメッセージで、モデルコンテキストには _入る_ もの（UI から隠すことはできます）
- `custom`: モデルコンテキストには _入らない_ 拡張状態
- `compaction`: `firstKeptEntryId` と `tokensBefore` を持つ永続化された compaction summary
- `branch_summary`: ツリーブランチを移動したときの永続化された summary

OpenClaw は意図的に transcript を**修正しません**。Gateway は `SessionManager` を使って transcript を読み書きします。

---

## Context window と追跡トークン数の違い

重要なのは次の 2 つの異なる概念です。

1. **モデルの context window**: モデルごとのハード上限（モデルに見えるトークン数）
2. **Session store カウンター**: `sessions.json` に書き込まれるローリング統計（`/status` やダッシュボードで使われる）

制限を調整している場合:

- context window はモデル catalog から取得されます（config で override することもできます）。
- store の `contextTokens` はランタイムの推定値/報告値です。厳密な保証として扱わないでください。

詳しくは [/token-use](/ja-JP/reference/token-use) を参照してください。

---

## Compaction とは何か

Compaction は、古い会話を transcript 内の永続化された `compaction` エントリーに要約し、最近のメッセージはそのまま保持します。

Compaction 後、将来のターンで見えるのは次です。

- compaction summary
- `firstKeptEntryId` 以降のメッセージ

Compaction は**永続的**です（session pruning とは異なります）。[/concepts/session-pruning](/ja-JP/concepts/session-pruning) を参照してください。

## Compaction チャンク境界と tool のペアリング

OpenClaw が長い transcript を Compaction 用チャンクに分割するとき、assistant の tool 呼び出しと、それに対応する `toolResult` エントリーをペアに保ちます。

- トークン比率による分割位置が tool 呼び出しとその結果の間に来る場合、OpenClaw はそのペアを分離する代わりに、境界を assistant の tool-call メッセージ位置まで移動します。
- 末尾の tool-result ブロックが本来チャンクを目標サイズ超過にしてしまう場合、OpenClaw はその保留中 tool ブロックを保持し、要約されていない末尾部分をそのまま維持します。
- 中断された/エラーになった tool-call ブロックは、保留中の分割を維持しません。

---

## 自動 Compaction が発生するタイミング（Pi ランタイム）

組み込み Pi agent では、自動 Compaction は次の 2 つのケースで発動します。

1. **オーバーフロー復旧**: モデルがコンテキストオーバーフローエラーを返した場合
   （`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded`、および類似のプロバイダー固有バリアント）→ compact → retry。
2. **しきい値メンテナンス**: 成功したターンの後、次の条件を満たしたとき

`contextTokens > contextWindow - reserveTokens`

ここで:

- `contextWindow` はモデルの context window
- `reserveTokens` はプロンプト + 次のモデル出力のために確保する余裕トークン数

これらは Pi ランタイムのセマンティクスです（OpenClaw はイベントを消費しますが、Compaction のタイミングを決めるのは Pi です）。

---

## Compaction 設定（`reserveTokens`, `keepRecentTokens`）

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

OpenClaw は組み込み実行に対して安全な下限も適用します。

- `compaction.reserveTokens < reserveTokensFloor` の場合、OpenClaw はその値を引き上げます。
- デフォルトの下限は `20000` トークンです。
- 下限を無効にするには `agents.defaults.compaction.reserveTokensFloor: 0` を設定します。
- すでにそれより高い場合、OpenClaw は変更しません。
- 手動の `/compact` は、明示的な `agents.defaults.compaction.keepRecentTokens` を尊重し、Pi の recent-tail cut point を維持します。明示的な keep budget がない場合、手動 Compaction はハードチェックポイントのままであり、再構築されたコンテキストは新しい summary から始まります。

理由: Compaction が避けられなくなる前に、メモリ書き込みのような複数ターンの「ハウスキーピング」に十分な余裕を残すためです。

実装: `src/agents/pi-settings.ts` の `ensurePiCompactionReserveTokens()`
（`src/agents/pi-embedded-runner.ts` から呼ばれます）。

---

## プラガブルな Compaction プロバイダー

plugin は plugin API の `registerCompactionProvider()` を通じて Compaction プロバイダーを登録できます。`agents.defaults.compaction.provider` が登録済みプロバイダー id に設定されている場合、safeguard 拡張は組み込みの `summarizeInStages` パイプラインではなく、そのプロバイダーに要約を委譲します。

- `provider`: 登録済み Compaction プロバイダー plugin の id。デフォルトの LLM 要約を使う場合は未設定のままにします。
- `provider` を設定すると `mode: "safeguard"` が強制されます。
- プロバイダーは、組み込みパスと同じ Compaction 指示および識別子保持ポリシーを受け取ります。
- safeguard は、プロバイダー出力の後でも recent-turn と split-turn の接尾コンテキストを保持します。
- 組み込み safeguard 要約は、以前の summary 全体をそのまま保持するのではなく、新しいメッセージを加えて以前の summary を再要約します。
- safeguard モードではデフォルトで summary 品質監査が有効になります。不正な出力時の retry をスキップするには、`qualityGuard.enabled: false` を設定してください。
- プロバイダーが失敗した場合、または空の結果を返した場合、OpenClaw は自動的に組み込みの LLM 要約にフォールバックします。
- abort/timeout シグナルは飲み込まれず、そのまま再スローされるため、呼び出し元のキャンセルが尊重されます。

ソース: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## ユーザーに見える画面

Compaction とセッション状態は次で確認できます。

- `/status`（任意のチャットセッション内）
- `openclaw status`（CLI）
- `openclaw sessions` / `sessions --json`
- Verbose モード: `🧹 Auto-compaction complete` + compaction count

---

## サイレントなハウスキーピング（`NO_REPLY`）

OpenClaw は、ユーザーに中間出力を見せるべきでないバックグラウンドタスク向けに「サイレント」ターンをサポートしています。

慣例:

- アシスタントは出力の先頭に、正確な silent token `NO_REPLY` /
  `no_reply` を付けて、「ユーザーに返信を配信しない」ことを示します。
- OpenClaw は配信レイヤーでこれを取り除く/抑制します。
- 正確な silent token の抑制は大文字小文字を区別しないため、ペイロード全体が silent token だけである場合、`NO_REPLY` と
  `no_reply` のどちらも有効です。
- これは本当にバックグラウンド/未配信のターン専用です。通常の実行可能なユーザー要求の近道ではありません。

`2026.1.10` 時点で、OpenClaw は部分チャンクが `NO_REPLY` で始まる場合、**下書き/typing ストリーミング** も抑制するため、サイレント操作でターン途中に部分出力が漏れることはありません。

---

## pre-compaction の「memory flush」（実装済み）

目的: 自動 Compaction が起こる前に、ディスクへ永続状態を書き込むサイレントな agentic turn を実行します（たとえば agent workspace 内の `memory/YYYY-MM-DD.md`）。これにより、Compaction で重要なコンテキストが消えるのを防ぎます。

OpenClaw は **pre-threshold flush** アプローチを使います。

1. セッションのコンテキスト使用量を監視します。
2. それが「ソフトしきい値」（Pi の Compaction しきい値より低い）を超えたら、サイレントな
   「今すぐ memory を書く」指示を agent に実行します。
3. 正確な silent token `NO_REPLY` / `no_reply` を使って、ユーザーには
   何も表示しません。

設定（`agents.defaults.compaction.memoryFlush`）:

- `enabled`（デフォルト: `true`）
- `softThresholdTokens`（デフォルト: `4000`）
- `prompt`（flush turn 用の user message）
- `systemPrompt`（flush turn に追加される追加 system prompt）

注意:

- デフォルトの prompt/system prompt には、配信を抑制するための
  `NO_REPLY` ヒントが含まれています。
- flush は Compaction サイクルごとに 1 回だけ実行されます（`sessions.json` で追跡）。
- flush は組み込み Pi セッションでのみ実行されます（CLI バックエンドではスキップされます）。
- セッション workspace が読み取り専用（`workspaceAccess: "ro"` または `"none"`）の場合、flush はスキップされます。
- workspace のファイルレイアウトと書き込みパターンについては [Memory](/ja-JP/concepts/memory) を参照してください。

Pi は拡張 API で `session_before_compact` hook も公開していますが、OpenClaw の flush ロジックは現時点では Gateway 側にあります。

---

## トラブルシューティングチェックリスト

- Session key が間違っている? まず [/concepts/session](/ja-JP/concepts/session) を確認し、`/status` 内の `sessionKey` を確認してください。
- Store と transcript が一致しない? `openclaw status` で Gateway ホストと store path を確認してください。
- Compaction が多すぎる? 次を確認してください。
  - モデルの context window（小さすぎる）
  - Compaction 設定（モデル window に対して `reserveTokens` が高すぎると、Compaction が早く起こることがあります）
  - tool-result の肥大化: session pruning を有効化/調整してください
- サイレントターンが漏れる? 返信が `NO_REPLY` で始まっていること（大文字小文字を区別しない正確な token）と、ストリーミング抑制修正を含むビルドであることを確認してください。

## 関連

- [Session management](/ja-JP/concepts/session)
- [Session pruning](/ja-JP/concepts/session-pruning)
- [Context engine](/ja-JP/concepts/context-engine)
