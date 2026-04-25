---
read_when:
    - OpenResponses API を話すクライアントを統合する場合
    - アイテムベース入力、クライアント Tool 呼び出し、または SSE イベントを使いたい場合
summary: Gateway から OpenResponses 互換の `/v1/responses` HTTP エンドポイントを公開する
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-25T13:49:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: b48685ab42d6f031849990b60a57af9501c216f058dc38abce184b963b05cedb
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

OpenClaw の Gateway は、OpenResponses 互換の `POST /v1/responses` エンドポイントを提供できます。

このエンドポイントは **デフォルトで無効** です。最初に config で有効化してください。

- `POST /v1/responses`
- Gateway と同じポート（WS + HTTP 多重化）: `http://<gateway-host>:<port>/v1/responses`

内部的には、リクエストは通常の Gateway エージェント実行（
`openclaw agent` と同じコードパス）として処理されるため、
ルーティング/権限/config は Gateway と一致します。

## 認証、セキュリティ、ルーティング

運用動作は [OpenAI Chat Completions](/ja-JP/gateway/openai-http-api) と一致します:

- 一致する Gateway HTTP 認証パスを使用:
  - 共有シークレット認証（`gateway.auth.mode="token"` または `"password"`）: `Authorization: Bearer <token-or-password>`
  - trusted-proxy 認証（`gateway.auth.mode="trusted-proxy"`）: 設定済みの非 loopback trusted proxy ソースからの identity-aware proxy ヘッダー
  - private-ingress open auth（`gateway.auth.mode="none"`）: 認証ヘッダーなし
- このエンドポイントは、その Gateway インスタンスに対する完全な operator アクセスとして扱います
- 共有シークレット認証モード（`token` と `password`）では、より狭い bearer 宣言の `x-openclaw-scopes` 値を無視し、通常の完全な operator デフォルトに戻します
- trusted identity-bearing HTTP モード（たとえば trusted proxy 認証や `gateway.auth.mode="none"`）では、`x-openclaw-scopes` が存在する場合はそれを尊重し、存在しない場合は通常の operator デフォルトスコープセットにフォールバックします
- エージェント選択には `model: "openclaw"`、`model: "openclaw/default"`、`model: "openclaw/<agentId>"`、または `x-openclaw-agent-id` を使用します
- 選択されたエージェントのバックエンドモデルを上書きしたい場合は `x-openclaw-model` を使用します
- 明示的なセッションルーティングには `x-openclaw-session-key` を使用します
- デフォルト以外の合成 ingress チャネルコンテキストを使いたい場合は `x-openclaw-message-channel` を使用します

認証マトリクス:

- `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`
  - 共有 Gateway operator secret の所持を証明します
  - より狭い `x-openclaw-scopes` を無視します
  - 完全なデフォルト operator スコープセットを復元します:
    `operator.admin`、`operator.approvals`、`operator.pairing`、
    `operator.read`、`operator.talk.secrets`、`operator.write`
  - このエンドポイント上のチャットターンを owner-sender ターンとして扱います
- trusted identity-bearing HTTP モード（たとえば trusted proxy 認証、または private ingress 上の `gateway.auth.mode="none"`）
  - ヘッダーが存在する場合は `x-openclaw-scopes` を尊重します
  - ヘッダーがない場合は通常の operator デフォルトスコープセットにフォールバックします
  - 呼び出し元が明示的にスコープを狭め、かつ `operator.admin` を省略した場合にのみ owner セマンティクスを失います

このエンドポイントの有効/無効は `gateway.http.endpoints.responses.enabled` で切り替えます。

同じ互換サーフェスには次も含まれます:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

エージェント対象モデル、`openclaw/default`、embeddings パススルー、バックエンドモデル上書きの関係に関する標準的な説明は、[OpenAI Chat Completions](/ja-JP/gateway/openai-http-api#agent-first-model-contract) と [Model list and agent routing](/ja-JP/gateway/openai-http-api#model-list-and-agent-routing) を参照してください。

## セッション動作

デフォルトでは、このエンドポイントは **リクエストごとにステートレス** です（呼び出しごとに新しいセッションキーが生成されます）。

リクエストに OpenResponses の `user` 文字列が含まれる場合、Gateway はそこから安定したセッションキーを導出するため、繰り返し呼び出しで同じエージェントセッションを共有できます。

## リクエスト形式（サポート対象）

リクエストは OpenResponses API に従い、アイテムベース入力を使用します。現在サポートされているもの:

- `input`: 文字列またはアイテムオブジェクト配列。
- `instructions`: システムプロンプトにマージされます。
- `tools`: クライアント Tool 定義（function tools）。
- `tool_choice`: クライアント Tool のフィルタまたは必須化。
- `stream`: SSE ストリーミングを有効化。
- `max_output_tokens`: ベストエフォートの出力上限（プロバイダー依存）。
- `user`: 安定したセッションルーティング。

受け付けるが**現在は無視される**もの:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

サポート対象:

- `previous_response_id`: リクエストが同じ agent/user/requested-session スコープ内にとどまる場合、OpenClaw は以前のレスポンスセッションを再利用します。

## アイテム（input）

### `message`

ロール: `system`、`developer`、`user`、`assistant`。

- `system` と `developer` はシステムプロンプトに追加されます。
- 最新の `user` または `function_call_output` アイテムが「現在のメッセージ」になります。
- 以前の user/assistant メッセージは、コンテキスト用の履歴として含まれます。

### `function_call_output`（ターンベース Tool）

Tool 結果をモデルに返します:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` と `item_reference`

スキーマ互換性のため受け付けますが、プロンプト構築時には無視されます。

## Tools（クライアント側 function tools）

`tools: [{ type: "function", function: { name, description?, parameters? } }]` で Tool を提供します。

エージェントが Tool 呼び出しを決定すると、レスポンスは `function_call` 出力アイテムを返します。
その後、ターンを続行するには `function_call_output` を含むフォローアップリクエストを送信します。

## 画像（`input_image`）

base64 または URL ソースをサポートします:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

許可される MIME タイプ（現在）: `image/jpeg`、`image/png`、`image/gif`、`image/webp`、`image/heic`、`image/heif`。
最大サイズ（現在）: 10MB。

## ファイル（`input_file`）

base64 または URL ソースをサポートします:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

許可される MIME タイプ（現在）: `text/plain`、`text/markdown`、`text/html`、`text/csv`、
`application/json`、`application/pdf`。

最大サイズ（現在）: 5MB。

現在の動作:

- ファイル内容はデコードされ、ユーザーメッセージではなく **システムプロンプト** に追加されるため、
  一時的なままになります（セッション履歴には永続化されません）。
- デコードされたファイルテキストは、追加前に **信頼されていない外部コンテンツ** としてラップされるため、
  ファイルバイトは信頼された指示ではなくデータとして扱われます。
- 注入されるブロックは
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` のような明示的な境界マーカーを使用し、
  `Source: External` メタデータ行を含みます。
- このファイル入力パスでは、プロンプト予算を保つために長い `SECURITY NOTICE:` バナーを意図的に省略しています。
  境界マーカーとメタデータは引き続き保持されます。
- PDF はまずテキストとして解析されます。ほとんどテキストが見つからない場合、最初のページが
  画像としてラスタライズされてモデルに渡され、注入されるファイルブロックでは
  プレースホルダー `[PDF content rendered to images]` を使用します。

PDF 解析は同梱の `document-extract` Plugin によって提供されます。この Plugin は
Node 向けの `pdfjs-dist` レガシービルド（worker なし）を使用します。モダンな PDF.js ビルドは
ブラウザ worker/DOM globals を前提とするため、Gateway では使用されません。

URL 取得のデフォルト:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8`（1リクエストあたりの URL ベース `input_file` + `input_image` パーツ合計）
- リクエストはガードされます（DNS 解決、private IP ブロック、リダイレクト上限、タイムアウト）。
- オプションのホスト名 Allowlist を入力タイプごとにサポートします（`files.urlAllowlist`、`images.urlAllowlist`）。
  - 完全一致ホスト: `"cdn.example.com"`
  - ワイルドカードサブドメイン: `"*.assets.example.com"`（apex には一致しません）
  - 空または省略された Allowlist は、ホスト名 Allowlist 制限なしを意味します。
- URL ベース取得を完全に無効化するには、`files.allowUrl: false` および/または `images.allowUrl: false` を設定してください。

## ファイル + 画像の上限（config）

デフォルト値は `gateway.http.endpoints.responses` の下で調整できます:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

省略時のデフォルト:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- HEIC/HEIF の `input_image` ソースは受け付けられ、プロバイダー配信前に JPEG に正規化されます。

セキュリティに関する注記:

- URL Allowlist は取得前とリダイレクト先ホップごとに強制されます。
- ホスト名を Allowlist に追加しても、private/internal IP ブロックはバイパスされません。
- インターネット公開 Gateway では、アプリレベルのガードに加えてネットワーク egress 制御を適用してください。
  詳細は [Security](/ja-JP/gateway/security) を参照してください。

## ストリーミング（SSE）

`stream: true` を設定すると Server-Sent Events（SSE）を受信します:

- `Content-Type: text/event-stream`
- 各イベント行は `event: <type>` と `data: <json>`
- ストリームは `data: [DONE]` で終了

現在送出されるイベントタイプ:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed`（エラー時）

## 使用量

基盤プロバイダーがトークン数を報告する場合、`usage` が設定されます。
OpenClaw は、それらのカウンターが下流の status/session サーフェスに到達する前に、
一般的な OpenAI スタイルのエイリアス（`input_tokens` / `output_tokens`、
`prompt_tokens` / `completion_tokens` を含む）を正規化します。

## エラー

エラーは次のような JSON オブジェクトを使用します:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

一般的なケース:

- `401` 認証なし/無効
- `400` 無効なリクエストボディ
- `405` 不正なメソッド

## 例

非ストリーミング:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

ストリーミング:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## 関連

- [OpenAI chat completions](/ja-JP/gateway/openai-http-api)
- [OpenAI](/ja-JP/providers/openai)
