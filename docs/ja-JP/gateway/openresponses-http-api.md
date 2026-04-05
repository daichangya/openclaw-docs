---
read_when:
    - OpenResponses APIを話すクライアントを統合している場合
    - アイテムベースの入力、クライアントツール呼び出し、またはSSEイベントを使いたい場合
summary: GatewayからOpenResponses互換の `/v1/responses` HTTPエンドポイントを公開する
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-05T12:44:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3f2905fe45accf2699de8a561d15311720f249f9229d26550c16577428ea8a9
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

# OpenResponses API（HTTP）

OpenClawのGatewayは、OpenResponses互換の `POST /v1/responses` エンドポイントを提供できます。

このエンドポイントは**デフォルトで無効**です。まず設定で有効にしてください。

- `POST /v1/responses`
- Gatewayと同じポート（WS + HTTP多重化）: `http://<gateway-host>:<port>/v1/responses`

内部的には、リクエストは通常のGateway agent実行として処理されます（
`openclaw agent` と同じコードパス）。そのため、ルーティング/権限/設定はGatewayと一致します。

## 認証、セキュリティ、ルーティング

運用上の挙動は [OpenAI Chat Completions](/gateway/openai-http-api) と一致します。

- 一致するGateway HTTP認証パスを使用します:
  - shared-secret認証（`gateway.auth.mode="token"` または `"password"`）: `Authorization: Bearer <token-or-password>`
  - trusted-proxy認証（`gateway.auth.mode="trusted-proxy"`）: 設定済みの非loopback trusted proxyソースからのidentity-aware proxyヘッダー
  - private-ingress open auth（`gateway.auth.mode="none"`）: 認証ヘッダーなし
- このエンドポイントを、そのgatewayインスタンスに対する完全なoperatorアクセスとして扱います
- shared-secret認証モード（`token` と `password`）では、より狭いbearer宣言の `x-openclaw-scopes` 値を無視し、通常の完全なoperatorデフォルトに戻します
- trusted identity-bearing HTTPモード（たとえばtrusted proxy認証や `gateway.auth.mode="none"`）では、`x-openclaw-scopes` が存在する場合はそれを尊重し、存在しない場合は通常のoperatorデフォルトのスコープセットにフォールバックします
- `model: "openclaw"`、`model: "openclaw/default"`、`model: "openclaw/<agentId>"`、または `x-openclaw-agent-id` でagentを選択します
- 選択されたagentのバックエンドモデルを上書きしたい場合は `x-openclaw-model` を使用します
- 明示的なセッションルーティングには `x-openclaw-session-key` を使用します
- デフォルト以外のsynthetic ingress channelコンテキストが必要な場合は `x-openclaw-message-channel` を使用します

認証マトリクス:

- `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`
  - 共有gateway operator secretの所持を証明します
  - より狭い `x-openclaw-scopes` を無視します
  - 完全なデフォルトoperatorスコープセットを復元します:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - このエンドポイント上のチャットターンをowner-senderターンとして扱います
- trusted identity-bearing HTTPモード（たとえばtrusted proxy認証、またはprivate ingress上の `gateway.auth.mode="none"`）
  - ヘッダーが存在する場合は `x-openclaw-scopes` を尊重します
  - ヘッダーが存在しない場合は通常のoperatorデフォルトスコープセットにフォールバックします
  - 呼び出し元が明示的にスコープを狭め、かつ `operator.admin` を省略した場合にのみownerセマンティクスを失います

このエンドポイントは `gateway.http.endpoints.responses.enabled` で有効または無効にできます。

同じ互換サーフェスには、次も含まれます。

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

agent対象モデル、`openclaw/default`、embeddingsパススルー、バックエンドモデル上書きがどのように組み合わさるかについての正式な説明は、
[OpenAI Chat Completions](/gateway/openai-http-api#agent-first-model-contract) と [Model list and agent routing](/gateway/openai-http-api#model-list-and-agent-routing) を参照してください。

## セッションの挙動

デフォルトでは、このエンドポイントは**リクエストごとにステートレス**です（呼び出しごとに新しいセッションキーが生成されます）。

リクエストにOpenResponsesの `user` 文字列が含まれている場合、Gatewayは
それから安定したセッションキーを導出するため、繰り返し呼び出しでagentセッションを共有できます。

## リクエスト形式（サポート対象）

リクエストは、アイテムベース入力のOpenResponses APIに従います。現在のサポート内容:

- `input`: 文字列またはアイテムオブジェクトの配列。
- `instructions`: システムプロンプトにマージされます。
- `tools`: クライアントツール定義（function tools）。
- `tool_choice`: クライアントツールを絞り込む、または必須化します。
- `stream`: SSEストリーミングを有効にします。
- `max_output_tokens`: ベストエフォートの出力上限（プロバイダー依存）。
- `user`: 安定したセッションルーティング。

受け付けますが、**現在は無視される**もの:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

サポート対象:

- `previous_response_id`: リクエストが同じagent/user/要求されたセッションスコープ内にとどまる場合、OpenClawは以前のresponseセッションを再利用します。

## アイテム（入力）

### `message`

ロール: `system`, `developer`, `user`, `assistant`。

- `system` と `developer` はシステムプロンプトに追加されます。
- 最新の `user` または `function_call_output` アイテムが「現在のメッセージ」になります。
- それ以前のuser/assistantメッセージは、コンテキスト用の履歴として含まれます。

### `function_call_output`（ターンベースツール）

ツール結果をモデルに送り返します:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` と `item_reference`

スキーマ互換性のために受け付けますが、プロンプト構築時には無視されます。

## ツール（クライアント側function tools）

`tools: [{ type: "function", function: { name, description?, parameters? } }]` でツールを指定します。

agentがツール呼び出しを行うと判断した場合、レスポンスは `function_call` 出力アイテムを返します。
その後、ターンを継続するには `function_call_output` を含むフォローアップリクエストを送信します。

## 画像（`input_image`）

base64またはURLソースをサポートします:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

許可されるMIMEタイプ（現時点）: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`。
最大サイズ（現時点）: 10MB。

## ファイル（`input_file`）

base64またはURLソースをサポートします:

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

許可されるMIMEタイプ（現時点）: `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`。

最大サイズ（現時点）: 5MB。

現在の挙動:

- ファイル内容はデコードされて**システムプロンプト**に追加され、ユーザーメッセージには追加されません。
  そのため、一時的なものとして扱われます（セッション履歴には保存されません）。
- デコードされたファイルテキストは、追加前に**信頼されていない外部コンテンツ**としてラップされるため、
  ファイル内容は信頼された命令ではなくデータとして扱われます。
- 注入されるブロックは、
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` のような明示的な境界マーカーを使い、
  `Source: External` メタデータ行を含みます。
- このファイル入力パスでは、プロンプト予算を維持するために長い `SECURITY NOTICE:` バナーを意図的に省略しています。
  それでも境界マーカーとメタデータは維持されます。
- PDFはまずテキストとして解析されます。ほとんどテキストが見つからない場合、
  最初のページ群が画像へラスタライズされてモデルに渡され、注入されるファイルブロックでは
  `[PDF content rendered to images]` というプレースホルダーが使われます。

PDF解析には、Nodeで使いやすい `pdfjs-dist` legacy build（workerなし）を使用します。
モダンなPDF.js buildはブラウザーworker/DOMグローバルを前提とするため、Gatewayでは使いません。

URLフェッチのデフォルト:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8`（1リクエストあたりのURLベース `input_file` + `input_image` パート合計）
- リクエストは保護されます（DNS解決、private IPブロック、リダイレクト上限、タイムアウト）。
- オプションで、入力タイプごとのhostname allowlistをサポートします（`files.urlAllowlist`, `images.urlAllowlist`）。
  - 完全一致ホスト: `"cdn.example.com"`
  - ワイルドカードサブドメイン: `"*.assets.example.com"`（apexには一致しません）
  - allowlistが空、または省略された場合は、hostname allowlist制限はありません。
- URLベースのフェッチを完全に無効にするには、`files.allowUrl: false` および/または `images.allowUrl: false` を設定してください。

## ファイル + 画像の上限（設定）

デフォルトは `gateway.http.endpoints.responses` 配下で調整できます:

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
- HEIC/HEIF の `input_image` ソースは受け付けられ、プロバイダーへの送信前にJPEGへ正規化されます。

セキュリティ上の注意:

- URL allowlistは、フェッチ前とリダイレクト先の各ホップで強制されます。
- hostnameをallowlistに追加しても、private/internal IPブロックは回避されません。
- インターネット公開されたgatewayでは、アプリレベルの保護に加えてネットワークegress制御も適用してください。
  [Security](/gateway/security) を参照してください。

## ストリーミング（SSE）

`stream: true` を設定すると、Server-Sent Events（SSE）を受け取れます:

- `Content-Type: text/event-stream`
- 各イベント行は `event: <type>` と `data: <json>` です
- ストリームは `data: [DONE]` で終了します

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

## Usage

基盤となるプロバイダーがトークン数を返す場合、`usage` が設定されます。
OpenClawは、これらのカウンターが下流のstatus/sessionサーフェスに到達する前に、
一般的なOpenAI形式のエイリアスを正規化します。これには `input_tokens` / `output_tokens`
および `prompt_tokens` / `completion_tokens` が含まれます。

## エラー

エラーは次のようなJSONオブジェクトを使用します:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

一般的なケース:

- `401` 認証なし/認証不正
- `400` リクエストボディ不正
- `405` メソッド不正

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
