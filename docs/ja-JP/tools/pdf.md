---
read_when:
    - エージェントから PDF を解析したい
    - pdf tool の正確なパラメーターと制限が必要である
    - ネイティブ PDF モードと抽出フォールバックをデバッグしている
summary: ネイティブプロバイダー対応と抽出フォールバックを使って 1 つ以上の PDF ドキュメントを解析する
title: PDF Tool
x-i18n:
    generated_at: "2026-04-05T13:00:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: d7aaaa7107d7920e7c31f3e38ac19411706e646186acf520bc02f2c3e49c0517
    source_path: tools/pdf.md
    workflow: 15
---

# PDF tool

`pdf` は 1 つ以上の PDF ドキュメントを解析し、テキストを返します。

概要:

- Anthropic および Google モデルプロバイダー向けのネイティブプロバイダーモード。
- その他のプロバイダー向けの抽出フォールバックモード（必要に応じてまずテキストを抽出し、その後ページ画像を使用）。
- 単一入力（`pdf`）または複数入力（`pdfs`）をサポートし、1 回の呼び出しで最大 10 個の PDF に対応します。

## 利用可能条件

この tool は、OpenClaw がエージェント向けの PDF 対応モデル設定を解決できる場合にのみ登録されます:

1. `agents.defaults.pdfModel`
2. `agents.defaults.imageModel` へのフォールバック
3. エージェントの解決済み session/default model へのフォールバック
4. ネイティブ PDF プロバイダーが認証ベースの場合、汎用の image フォールバック候補より先にそれらを優先

利用可能なモデルを解決できない場合、`pdf` tool は公開されません。

利用可能性に関する注意:

- フォールバックチェーンは認証を考慮します。設定済みの `provider/model` は、
  OpenClaw がそのプロバイダーをエージェント向けに実際に認証できる場合にのみ有効とみなされます。
- 現在のネイティブ PDF プロバイダーは **Anthropic** と **Google** です。
- 解決済みの session/default provider に、設定済みの vision/PDF
  モデルがすでにある場合、PDF tool は他の認証ベースの
  プロバイダーへフォールバックする前にそれを再利用します。

## 入力リファレンス

- `pdf`（`string`）: 1 つの PDF パスまたは URL
- `pdfs`（`string[]`）: 複数の PDF パスまたは URL、合計最大 10 件
- `prompt`（`string`）: 解析用プロンプト。既定は `Analyze this PDF document.`
- `pages`（`string`）: `1-5` や `1,3,7-9` のようなページフィルター
- `model`（`string`）: 任意のモデル上書き（`provider/model`）
- `maxBytesMb`（`number`）: PDF ごとのサイズ上限（MB）

入力に関する注意:

- `pdf` と `pdfs` は読み込み前にマージされ、重複排除されます。
- PDF 入力が指定されていない場合、この tool はエラーになります。
- `pages` は 1 始まりのページ番号として解析され、重複排除、ソート、および設定済み最大ページ数までのクランプが行われます。
- `maxBytesMb` の既定値は `agents.defaults.pdfMaxBytesMb` または `10` です。

## サポートされる PDF 参照

- ローカルファイルパス（`~` 展開を含む）
- `file://` URL
- `http://` および `https://` URL

参照に関する注意:

- その他の URI スキーム（例: `ftp://`）は `unsupported_pdf_reference` で拒否されます。
- sandbox モードでは、リモートの `http(s)` URL は拒否されます。
- workspace-only file policy が有効な場合、許可されたルート外のローカルファイルパスは拒否されます。

## 実行モード

### ネイティブプロバイダーモード

ネイティブモードは provider `anthropic` と `google` で使用されます。
この tool は生の PDF バイト列を直接プロバイダー API に送信します。

ネイティブモードの制限:

- `pages` はサポートされません。設定されている場合、この tool はエラーを返します。
- 複数 PDF 入力がサポートされます。各 PDF は、プロンプトの前にネイティブ document block /
  inline PDF part として送信されます。

### 抽出フォールバックモード

フォールバックモードは、ネイティブでないプロバイダーで使用されます。

フロー:

1. 選択したページからテキストを抽出します（`agents.defaults.pdfMaxPages` まで。既定は `20`）。
2. 抽出されたテキスト長が `200` 文字未満の場合、選択したページを PNG 画像にレンダリングして含めます。
3. 抽出された内容とプロンプトを、選択されたモデルに送信します。

フォールバックの詳細:

- ページ画像抽出では `4,000,000` のピクセル予算を使用します。
- 対象モデルが画像入力をサポートしておらず、抽出可能なテキストもない場合、この tool はエラーになります。
- テキスト抽出に成功しても、画像抽出でテキスト専用モデルに
  vision が必要になる場合、OpenClaw はレンダリング済み画像を破棄し、抽出済みテキストのみで続行します。
- 抽出フォールバックには `pdfjs-dist`（画像レンダリングには `@napi-rs/canvas` も）が必要です。

## 設定

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

完全なフィールド詳細については [Configuration Reference](/ja-JP/gateway/configuration-reference) を参照してください。

## 出力の詳細

この tool は `content[0].text` にテキストを返し、`details` に構造化メタデータを返します。

一般的な `details` フィールド:

- `model`: 解決済みモデル参照（`provider/model`）
- `native`: ネイティブプロバイダーモードでは `true`、フォールバックでは `false`
- `attempts`: 成功前に失敗したフォールバック試行

パスフィールド:

- 単一 PDF 入力: `details.pdf`
- 複数 PDF 入力: `details.pdfs[]` に `pdf` エントリー
- sandbox パス書き換えメタデータ（該当する場合）: `rewrittenFrom`

## エラー動作

- PDF 入力がない: `pdf required: provide a path or URL to a PDF document` を送出
- PDF が多すぎる: `details.error = "too_many_pdfs"` の構造化エラーを返す
- サポートされない参照スキーム: `details.error = "unsupported_pdf_reference"` を返す
- `pages` を指定したネイティブモード: 明確な `pages is not supported with native PDF providers` エラーを送出

## 例

単一 PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

複数 PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

ページフィルター付きフォールバックモデル:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## 関連

- [Tools Overview](/tools) — 利用可能なすべてのエージェント tools
- [Configuration Reference](/ja-JP/gateway/configuration-reference#agent-defaults) — pdfMaxBytesMb と pdfMaxPages の設定
