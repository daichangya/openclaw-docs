---
read_when:
    - transcript 形式に起因する provider リクエスト拒否をデバッグしている場合
    - transcript サニタイズまたは tool-call 修復ロジックを変更している場合
    - provider 間の tool-call id 不一致を調査している場合
summary: 'リファレンス: provider 固有の transcript サニタイズおよび修復ルール'
title: Transcript の衛生管理
x-i18n:
    generated_at: "2026-04-26T11:40:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: e380be2b011afca5fedf89579e702c6d221d42e777c23bd766c8df07ff05ed18
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

このドキュメントでは、実行前（model コンテキスト構築時）に transcript に適用される **provider 固有の修正** を説明します。これらの多くは、厳格な provider 要件を満たすための **インメモリ** 調整です。これとは別に、セッションファイルの修復パスが保存済み JSONL をロード前に書き換えることもあります。これは、不正な JSONL 行を削除する場合と、構文的には有効だが replay 時に provider に拒否されることが分かっている永続化済みターンを修復する場合の両方を含みます。修復が行われた場合、元のファイルはセッションファイルの横にバックアップされます。

対象範囲:

- user-visible transcript turn に入らない runtime 専用 prompt context
- tool call id のサニタイズ
- tool call input の検証
- tool result のペアリング修復
- ターン検証 / 順序
- thought signature のクリーンアップ
- thinking signature のクリーンアップ
- 画像ペイロードのサニタイズ
- ユーザー入力の provenance タグ付け（セッション間ルーティングされた prompt 用）
- Bedrock Converse replay 用の空 assistant error-turn 修復

transcript ストレージの詳細が必要な場合は、次を参照してください。

- [Session management deep dive](/ja-JP/reference/session-management-compaction)

---

## グローバルルール: runtime context は user transcript ではない

runtime/system context は、そのターンの model prompt に追加されることがありますが、エンドユーザーが作成したコンテンツではありません。OpenClaw は、Gateway reply、キューされた followup、ACP、CLI、組み込み Pi 実行のために、transcript 向けの別個の prompt body を保持します。保存される可視 user turn には、runtime で拡張された prompt ではなく、その transcript body が使用されます。

すでに runtime wrapper を永続化している旧式セッションについては、Gateway の履歴サーフェスは、WebChat、TUI、REST、SSE クライアントへメッセージを返す前に display projection を適用します。

---

## どこで実行されるか

すべての transcript 衛生管理は、組み込み runner に集約されています。

- ポリシー選択: `src/agents/transcript-policy.ts`
- サニタイズ/修復の適用: `src/agents/pi-embedded-runner/replay-history.ts` 内の `sanitizeSessionHistory`

ポリシーは `provider`、`modelApi`、`modelId` を使って適用内容を決定します。

transcript 衛生管理とは別に、必要であればロード前にセッションファイルも修復されます。

- `src/agents/session-file-repair.ts` 内の `repairSessionFileIfNeeded`
- `run/attempt.ts` と `compact.ts`（組み込み runner）から呼び出されます

---

## グローバルルール: 画像サニタイズ

画像ペイロードは、サイズ制限による provider 側拒否を防ぐため、常にサニタイズされます（大きすぎる base64 画像の縮小/再圧縮）。

これは、vision 対応 models に対する画像起因の token 圧力を制御するのにも役立ちます。最大寸法を下げると一般に token 使用量が減り、寸法を上げると詳細保持が優先されます。

実装:

- `src/agents/pi-embedded-helpers/images.ts` 内の `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 内の `sanitizeContentBlocksImages`
- 最大画像辺長は `agents.defaults.imageMaxDimensionPx`（デフォルト: `1200`）で設定可能です。

---

## グローバルルール: 不正な tool call

`input` と `arguments` の両方を欠く assistant tool-call block は、model context 構築前に削除されます。これにより、部分的に永続化された tool call（たとえばレート制限失敗後のもの）による provider 拒否を防ぎます。

実装:

- `src/agents/session-transcript-repair.ts` 内の `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts` 内の `sanitizeSessionHistory` で適用

---

## グローバルルール: セッション間入力 provenance

agent が `sessions_send` を使って別セッションへ prompt を送るとき（agent 間の reply/announce ステップを含む）、OpenClaw は作成された user turn を次の情報付きで永続化します。

- `message.provenance.kind = "inter_session"`

このメタデータは transcript 追記時に書き込まれ、role は変更しません（provider 互換性のため `role: "user"` のままです）。transcript reader はこれを使って、ルーティングされた内部 prompt をエンドユーザー作成の指示として扱わないようにできます。

context 再構築中には、OpenClaw は model が外部エンドユーザー指示と区別できるように、そうした user turn の先頭へ短い `[Inter-session message]` マーカーもインメモリで付加します。

---

## Provider マトリクス（現在の挙動）

**OpenAI / OpenAI Codex**

- 画像サニタイズのみ。
- OpenAI Responses/Codex transcript では、孤立した reasoning signature（後続 content block を持たない standalone reasoning item）を削除し、model route 切り替え後の replay 可能な OpenAI reasoning も削除します。
- tool call id サニタイズなし。
- tool result ペアリング修復では、実際に一致する output を移動し、不足している tool call には Codex 形式の `aborted` output を合成することがあります。
- ターン検証や並べ替えはなし。
- 不足している OpenAI Responses 系 tool output は、Codex replay 正規化に合わせて `aborted` として合成されます。
- thought signature の除去なし。

**Google（Generative AI / Gemini CLI / Antigravity）**

- tool call id サニタイズ: 厳密な英数字のみ。
- tool result ペアリング修復と合成 tool result。
- ターン検証（Gemini 形式のターン交互性）。
- Google のターン順序修正（履歴が assistant で始まる場合、小さな user bootstrap を先頭に追加）。
- Antigravity Claude: thinking signature を正規化し、署名のない thinking block を削除。

**Anthropic / Minimax（Anthropic 互換）**

- tool result ペアリング修復と合成 tool result。
- ターン検証（厳密な交互性を満たすため、連続する user turn をマージ）。
- 欠落、空、または空白だけの replay signature を持つ thinking block は、provider 変換前に削除されます。それによって assistant turn が空になった場合、OpenClaw は非空の omitted-reasoning text でターン形状を維持します。
- 削除が必要な古い thinking 専用 assistant turn は、provider adapter が replay ターンを落とさないよう、非空の omitted-reasoning text に置き換えられます。

**Amazon Bedrock（Converse API）**

- 空の assistant stream-error turn は、replay 前に非空のフォールバック text block へ修復されます。Bedrock Converse は `content: []` の assistant message を拒否するため、`stopReason: "error"` と空 content を持つ永続化済み assistant turn も、ロード前にディスク上で修復されます。
- 欠落、空、または空白だけの replay signature を持つ Claude thinking block は、Converse replay 前に削除されます。それによって assistant turn が空になった場合、OpenClaw は非空の omitted-reasoning text でターン形状を維持します。
- 削除が必要な古い thinking 専用 assistant turn は、Converse replay が厳密なターン形状を保てるよう、非空の omitted-reasoning text に置き換えられます。
- replay では OpenClaw の delivery-mirror と gateway 注入 assistant turn を除外します。
- 画像サニタイズはグローバルルールを通じて適用されます。

**Mistral（model-id ベース検出を含む）**

- tool call id サニタイズ: strict9（長さ 9 の英数字）。

**OpenRouter Gemini**

- thought signature のクリーンアップ: base64 でない `thought_signature` 値を削除（base64 は保持）。

**その他すべて**

- 画像サニタイズのみ。

---

## 過去の挙動（2026.1.22 より前）

2026.1.22 リリース以前、OpenClaw は複数層の transcript 衛生管理を適用していました。

- **transcript-sanitize extension** が毎回の context build で実行され、次を行うことがありました:
  - tool use/result ペアリングの修復
  - tool call id のサニタイズ（`_`/`-` を保持する非 strict mode を含む）
- runner も provider 固有のサニタイズを行っており、処理が重複していました。
- さらに provider policy の外でも追加の変更がありました:
  - 永続化前に assistant text から `<final>` タグを除去
  - 空の assistant error turn を削除
  - tool call 後の assistant content をトリム

この複雑さは provider 間リグレッション（特に `openai-responses` の `call_id|fc_id` ペアリング）を引き起こしました。2026.1.22 の整理では extension が削除され、ロジックは runner に集約され、OpenAI は画像サニタイズ以外 **no-touch** になりました。

## 関連

- [Session management](/ja-JP/concepts/session)
- [Session pruning](/ja-JP/concepts/session-pruning)
