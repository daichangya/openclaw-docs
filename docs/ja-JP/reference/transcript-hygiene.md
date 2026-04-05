---
read_when:
    - トランスクリプトの形状に起因するプロバイダーのリクエスト拒否をデバッグしているとき
    - トランスクリプトのサニタイズまたはツール呼び出し修復ロジックを変更しているとき
    - プロバイダー間でのツール呼び出しIDの不一致を調査しているとき
summary: 'リファレンス: プロバイダー固有のトランスクリプトサニタイズおよび修復ルール'
title: トランスクリプトの衛生管理
x-i18n:
    generated_at: "2026-04-05T12:56:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 217afafb693cf89651e8fa361252f7b5c197feb98d20be4697a83e6dedc0ec3f
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# トランスクリプトの衛生管理（プロバイダー修正）

このドキュメントでは、実行前（モデルコンテキストの構築時）にトランスクリプトへ適用される**プロバイダー固有の修正**について説明します。これらは、厳格なプロバイダー要件を満たすために使用される**インメモリ**の調整です。これらの衛生管理ステップは、ディスク上に保存されたJSONLトランスクリプトを書き換えることは**ありません**。ただし、別個のセッションファイル修復パスにより、セッション読み込み前に不正な行を削除して不正形式のJSONLファイルを書き換える場合があります。修復が行われた場合、元のファイルはセッションファイルと並べてバックアップされます。

対象範囲は次のとおりです。

- ツール呼び出しIDのサニタイズ
- ツール呼び出し入力の検証
- ツール結果ペアリングの修復
- ターンの検証 / 順序付け
- 思考シグネチャのクリーンアップ
- 画像ペイロードのサニタイズ
- ユーザー入力の来歴タグ付け（セッション間でルーティングされるプロンプト用）

トランスクリプトの保存に関する詳細が必要な場合は、以下を参照してください。

- [/reference/session-management-compaction](/reference/session-management-compaction)

---

## 実行箇所

すべてのトランスクリプト衛生管理は、組み込みランナーに集約されています。

- ポリシー選択: `src/agents/transcript-policy.ts`
- サニタイズ/修復の適用: `src/agents/pi-embedded-runner/google.ts` 内の `sanitizeSessionHistory`

このポリシーは、`provider`、`modelApi`、`modelId` を使用して適用内容を決定します。

トランスクリプト衛生管理とは別に、セッションファイルは読み込み前に（必要に応じて）修復されます。

- `src/agents/session-file-repair.ts` 内の `repairSessionFileIfNeeded`
- `run/attempt.ts` と `compact.ts`（組み込みランナー）から呼び出されます

---

## グローバルルール: 画像のサニタイズ

画像ペイロードは、サイズ制限によるプロバイダー側の拒否を防ぐため、常にサニタイズされます
（大きすぎるbase64画像を縮小/再圧縮）。

これは、ビジョン対応モデルにおける画像由来のトークン負荷の抑制にも役立ちます。
一般に最大寸法が小さいほどトークン使用量は減り、大きいほど詳細が保持されます。

実装:

- `src/agents/pi-embedded-helpers/images.ts` 内の `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 内の `sanitizeContentBlocksImages`
- 最大画像辺長は `agents.defaults.imageMaxDimensionPx`（デフォルト: `1200`）で設定可能です。

---

## グローバルルール: 不正なツール呼び出し

`input` と `arguments` の両方が欠けているアシスタントのツール呼び出しブロックは、
モデルコンテキスト構築前に削除されます。これにより、部分的に永続化された
ツール呼び出し（たとえば、レート制限失敗後のもの）によるプロバイダー拒否を防ぎます。

実装:

- `src/agents/session-transcript-repair.ts` 内の `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/google.ts` 内の `sanitizeSessionHistory` で適用

---

## グローバルルール: セッション間入力の来歴

エージェントが `sessions_send` を通じて別のセッションにプロンプトを送信するとき
（エージェント間の reply/announce ステップを含む）、OpenClaw は作成されたユーザーターンを次の情報付きで保存します。

- `message.provenance.kind = "inter_session"`

このメタデータはトランスクリプト追記時に書き込まれ、ロールは変更されません
（プロバイダー互換性のため `role: "user"` のままです）。トランスクリプトの読み取り側は、
これを使ってルーティングされた内部プロンプトをエンドユーザー作成の指示として扱わないようにできます。

コンテキスト再構築時には、OpenClaw はそれらのユーザーターンの先頭に短い `[Inter-session message]`
マーカーもインメモリで付加し、モデルがそれらを外部のエンドユーザー指示と区別できるようにします。

---

## プロバイダーマトリクス（現在の動作）

**OpenAI / OpenAI Codex**

- 画像のサニタイズのみ。
- OpenAI Responses/Codex のトランスクリプトでは、孤立した reasoning signature（後続の content ブロックを持たない単独の reasoning 項目）を削除。
- ツール呼び出しIDのサニタイズなし。
- ツール結果ペアリング修復なし。
- ターンの検証や並べ替えなし。
- 合成ツール結果なし。
- thought signature の除去なし。

**Google（Generative AI / Gemini CLI / Antigravity）**

- ツール呼び出しIDのサニタイズ: 厳格な英数字のみ。
- ツール結果ペアリング修復および合成ツール結果。
- ターンの検証（Geminiスタイルのターン交互化）。
- Googleのターン順序修正（履歴が assistant で始まる場合、非常に小さな user bootstrap を先頭に追加）。
- Antigravity Claude: thinking signature を正規化し、署名のない thinking ブロックを削除。

**Anthropic / Minimax（Anthropic互換）**

- ツール結果ペアリング修復および合成ツール結果。
- ターンの検証（厳格な交互性を満たすため、連続する user ターンをマージ）。

**Mistral（modelId ベースの検出を含む）**

- ツール呼び出しIDのサニタイズ: strict9（長さ9の英数字）。

**OpenRouter Gemini**

- 思考シグネチャのクリーンアップ: base64 でない `thought_signature` 値を除去（base64 は保持）。

**それ以外すべて**

- 画像のサニタイズのみ。

---

## 過去の動作（2026.1.22以前）

2026.1.22 リリース以前、OpenClaw は複数層のトランスクリプト衛生管理を適用していました。

- **transcript-sanitize extension** がコンテキスト構築ごとに実行され、次のことが可能でした。
  - ツール使用/結果ペアリングの修復。
  - ツール呼び出しIDのサニタイズ（`_`/`-` を保持する非厳格モードを含む）。
- ランナーもプロバイダー固有のサニタイズを実行しており、処理が重複していました。
- さらに、プロバイダーポリシーの外側でも追加の変更が行われていました。たとえば:
  - 永続化前に assistant テキストから `<final>` タグを除去する。
  - 空の assistant error ターンを削除する。
  - ツール呼び出し後の assistant content を切り詰める。

この複雑さにより、プロバイダー間のリグレッション（特に `openai-responses`
の `call_id|fc_id` ペアリング）が発生しました。2026.1.22 のクリーンアップで extension は削除され、
ロジックはランナーに集約され、OpenAI は画像サニタイズ以外では**無変更**になりました。
