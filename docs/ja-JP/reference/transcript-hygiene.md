---
read_when:
    - transcript の形状に起因する provider リクエスト拒否をデバッグしている場合
    - transcript サニタイズまたは tool-call 修復ロジックを変更している場合
    - provider 間での tool-call id 不一致を調査している場合
summary: 'リファレンス: provider 固有の transcript サニタイズおよび修復ルール'
title: Transcript の衛生管理
x-i18n:
    generated_at: "2026-04-25T13:59:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00cac47fb9a238e3cb8b6ea69b47210685ca6769a31973b4aeef1d18e75d78e6
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

このドキュメントでは、実行前（モデルコンテキスト構築時）に transcript に適用される **provider 固有の修正** を説明します。これらは、厳格な
provider 要件を満たすために使われる **メモリ内** の調整です。これらの衛生管理ステップは、ディスク上に保存された JSONL transcript を**書き換えません**。ただし、別のセッションファイル修復パスでは、セッション読み込み前に不正な行を削除して、壊れた JSONL ファイルを書き換える場合があります。修復が発生した場合、元の
ファイルはセッションファイルと並べてバックアップされます。

対象範囲は次のとおりです。

- ランタイム専用プロンプトコンテキストをユーザー可視の transcript ターンから除外すること
- Tool call id のサニタイズ
- Tool call 入力の検証
- Tool result の対応付け修復
- ターン検証 / 順序
- thought signature のクリーンアップ
- 画像 payload のサニタイズ
- ユーザー入力の provenance タグ付け（セッション間でルーティングされるプロンプト用）

transcript ストレージの詳細が必要な場合は、以下を参照してください。

- [Session management deep dive](/ja-JP/reference/session-management-compaction)

---

## グローバルルール: ランタイムコンテキストはユーザー transcript ではない

ランタイム/システムコンテキストはターンのモデルプロンプトに追加できますが、
エンドユーザーが作成したコンテンツではありません。OpenClaw は、Gateway の返信、
キューされたフォローアップ、ACP、CLI、および埋め込み Pi 実行向けに、
transcript 向けの別個のプロンプト本文を保持します。保存された可視のユーザーターンでは、
ランタイムで拡張されたプロンプトではなく、その transcript 本文を使用します。

すでにランタイムラッパーを永続化していたレガシーセッションについては、
Gateway 履歴サーフェスが、WebChat、
TUI、REST、または SSE クライアントにメッセージを返す前に表示用投影を適用します。

---

## これが実行される場所

すべての transcript 衛生管理は埋め込み runner に集約されています。

- ポリシー選択: `src/agents/transcript-policy.ts`
- サニタイズ/修復の適用: `src/agents/pi-embedded-runner/replay-history.ts` の `sanitizeSessionHistory`

このポリシーは、`provider`、`modelApi`、`modelId` を使って適用内容を決定します。

transcript 衛生管理とは別に、必要であればセッションファイルは読み込み前に修復されます。

- `src/agents/session-file-repair.ts` の `repairSessionFileIfNeeded`
- `run/attempt.ts` と `compact.ts`（埋め込み runner）から呼び出される

---

## グローバルルール: 画像サニタイズ

画像 payload は、サイズ制限による provider 側の拒否を防ぐため、常にサニタイズされます
（大きすぎる base64 画像の縮小/再圧縮）。

これは、vision 対応モデルにおける画像由来のトークン圧力の制御にも役立ちます。
最大画像寸法を小さくすると一般にトークン使用量は減り、大きくすると詳細は保持されます。

実装:

- `src/agents/pi-embedded-helpers/images.ts` の `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` の `sanitizeContentBlocksImages`
- 最大画像辺長は `agents.defaults.imageMaxDimensionPx` で設定可能（デフォルト: `1200`）。

---

## グローバルルール: 不正な tool call

`input` と `arguments` の両方が欠けている assistant の tool-call block は、
モデルコンテキスト構築前に削除されます。これにより、部分的に永続化された
tool call（たとえば rate limit 失敗後）による provider 拒否を防ぎます。

実装:

- `src/agents/session-transcript-repair.ts` の `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts` の `sanitizeSessionHistory` で適用

---

## グローバルルール: セッション間入力の provenance

エージェントが `sessions_send` を介して別セッションにプロンプトを送るとき
（agent-to-agent の reply/announce ステップを含む）、OpenClaw は作成された
ユーザーターンを以下の情報付きで永続化します。

- `message.provenance.kind = "inter_session"`

このメタデータは transcript 追記時に書き込まれ、role は変更されません
（provider 互換性のため、`role: "user"` のままです）。transcript リーダーは
これを使って、ルーティングされた内部プロンプトをエンドユーザー作成の指示として
扱わないようにできます。

コンテキスト再構築時には、OpenClaw はそれらのユーザーターンの先頭にも
短い `[Inter-session message]` マーカーをメモリ内で付加し、モデルがそれらを
外部のエンドユーザー指示と区別できるようにします。

---

## provider マトリクス（現在の挙動）

**OpenAI / OpenAI Codex**

- 画像サニタイズのみ。
- OpenAI Responses/Codex transcript では、孤立した reasoning signature
  （後続の content block を伴わない単独の reasoning item）を削除し、
  モデルルート切り替え後の再生可能な OpenAI reasoning も削除する。
- Tool call id のサニタイズは行わない。
- Tool result の対応付け修復では、実際に一致した出力を移動し、
  欠落した tool call に対して Codex スタイルの `aborted` 出力を合成することがある。
- ターン検証や並べ替えは行わない。
- 不足している OpenAI Responses 系の tool 出力は、Codex の再生正規化に合わせて
  `aborted` として合成される。
- thought signature の除去は行わない。

**Google (Generative AI / Gemini CLI / Antigravity)**

- Tool call id のサニタイズ: 厳密な英数字。
- Tool result の対応付け修復と合成 tool result。
- ターン検証（Gemini スタイルのターン交互性）。
- Google のターン順序修正
  （履歴が assistant で始まる場合、小さな user bootstrap を先頭に追加）。
- Antigravity Claude: thinking signature を正規化し、署名のない thinking block を削除。

**Anthropic / Minimax (Anthropic-compatible)**

- Tool result の対応付け修復と合成 tool results。
- ターン検証（厳密な交互性を満たすため、連続する user ターンをマージ）。

**Mistral（model-id ベースの検出を含む）**

- Tool call id のサニタイズ: strict9（長さ 9 の英数字）。

**OpenRouter Gemini**

- thought signature のクリーンアップ: base64 でない `thought_signature` 値を除去
  （base64 は維持）。

**その他すべて**

- 画像サニタイズのみ。

---

## 過去の挙動（2026.1.22 より前）

2026.1.22 リリース以前、OpenClaw は複数層の transcript 衛生管理を適用していました。

- **transcript-sanitize extension** がコンテキスト構築ごとに実行され、次のことができた:
  - Tool use/result の対応付けを修復する。
  - Tool call id をサニタイズする（`_`/`-` を保持する非厳密モードを含む）。
- runner も provider 固有のサニタイズを実行しており、処理が重複していた。
- provider ポリシーの外側でも追加の変更が行われていた。たとえば:
  - 永続化前に assistant テキストから `<final>` タグを削除する。
  - 空の assistant error ターンを削除する。
  - tool call 後の assistant コンテンツをトリムする。

この複雑さにより、provider 間の回帰（特に `openai-responses`
`call_id|fc_id` の対応付け）が発生しました。2026.1.22 のクリーンアップでは extension を削除し、
ロジックを runner に集約し、画像サニタイズ以外では OpenAI を **no-touch** にしました。

## 関連

- [Session management](/ja-JP/concepts/session)
- [Session pruning](/ja-JP/concepts/session-pruning)
