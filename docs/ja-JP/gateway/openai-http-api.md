---
read_when:
    - OpenAI Chat Completions を想定するツールを統合する
summary: Gateway から OpenAI 互換の `/v1/chat/completions` HTTP エンドポイントを公開する
title: OpenAI chat completions
x-i18n:
    generated_at: "2026-04-25T13:48:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a2f45abfc0aef8f73ab909bc3007de4078177214e5e0e5cf27a4c6ad0918172
    source_path: gateway/openai-http-api.md
    workflow: 15
---

OpenClaw の Gateway は、小規模な OpenAI 互換 Chat Completions エンドポイントを提供できます。

このエンドポイントは**デフォルトで無効**です。まず config で有効にしてください。

- `POST /v1/chat/completions`
- Gateway と同じポート（WS + HTTP 多重化）: `http://<gateway-host>:<port>/v1/chat/completions`

Gateway の OpenAI 互換 HTTP 画面を有効にすると、次も提供されます。

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

内部では、リクエストは通常の Gateway agent 実行として処理されます（`openclaw agent` と同じコードパス）ので、ルーティング/権限/config は Gateway と一致します。

## 認証

Gateway auth config を使います。

一般的な HTTP auth 経路:

- 共有 secret auth（`gateway.auth.mode="token"` または `"password"`）:
  `Authorization: Bearer <token-or-password>`
- 信頼された identity 付き HTTP auth（`gateway.auth.mode="trusted-proxy"`）:
  設定済みの identity-aware proxy を経由し、それが必要な identity ヘッダーを注入するようにします
- プライベート ingress の open auth（`gateway.auth.mode="none"`）:
  auth ヘッダーは不要です

注意:

- `gateway.auth.mode="token"` の場合は、`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）を使ってください。
- `gateway.auth.mode="password"` の場合は、`gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を使ってください。
- `gateway.auth.mode="trusted-proxy"` の場合、HTTP リクエストは
  設定済みの非 loopback trusted proxy ソースから来る必要があります。同一ホスト上の loopback proxy は
  このモードを満たしません。
- `gateway.auth.rateLimit` が設定され、auth 失敗が多すぎる場合、このエンドポイントは `Retry-After` 付きで `429` を返します。

## セキュリティ境界（重要）

このエンドポイントは、その gateway インスタンスに対する**完全な operator-access** 画面として扱ってください。

- ここでの HTTP bearer auth は、狭いユーザー単位スコープモデルではありません。
- このエンドポイント用の有効な Gateway token/password は、owner/operator 資格情報として扱うべきです。
- リクエストは、信頼された operator アクションと同じ control-plane agent パスを通ります。
- このエンドポイントには、別個の非 owner/ユーザー単位ツール境界はありません。ここで呼び出し元が Gateway auth を通過すると、OpenClaw はその呼び出し元をこの gateway の信頼された operator として扱います。
- 共有 secret auth モード（`token` と `password`）では、呼び出し元がより狭い `x-openclaw-scopes` ヘッダーを送っても、このエンドポイントは通常の完全な operator デフォルトを復元します。
- 信頼された identity 付き HTTP モード（たとえば trusted proxy auth や `gateway.auth.mode="none"`）では、`x-openclaw-scopes` がある場合はそれを尊重し、なければ通常の operator デフォルトスコープセットにフォールバックします。
- 対象 agent ポリシーが機密ツールを許可している場合、このエンドポイントはそれらを使えます。
- このエンドポイントは loopback/tailnet/private ingress のみに置いてください。公開インターネットへ直接公開しないでください。

auth マトリクス:

- `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`
  - 共有 gateway operator secret の所持を証明します
  - より狭い `x-openclaw-scopes` を無視します
  - 完全なデフォルト operator スコープセットを復元します:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - このエンドポイント上の chat turn を owner-sender turn として扱います
- 信頼された identity 付き HTTP モード（たとえば trusted proxy auth、または private ingress 上の `gateway.auth.mode="none"`）
  - 外側の信頼された identity またはデプロイ境界を認証します
  - ヘッダーが存在する場合は `x-openclaw-scopes` を尊重します
  - ヘッダーがない場合は通常の operator デフォルトスコープセットにフォールバックします
  - 呼び出し元が明示的にスコープを狭め、かつ `operator.admin` を省略した場合にのみ owner セマンティクスを失います

[Security](/ja-JP/gateway/security) と [Remote access](/ja-JP/gateway/remote) を参照してください。

## agent-first model コントラクト

OpenClaw は OpenAI の `model` フィールドを、生の provider model id ではなく**agent ターゲット**として扱います。

- `model: "openclaw"` は設定済みのデフォルト agent にルーティングされます。
- `model: "openclaw/default"` も設定済みのデフォルト agent にルーティングされます。
- `model: "openclaw/<agentId>"` は特定の agent にルーティングされます。

任意のリクエストヘッダー:

- `x-openclaw-model: <provider/model-or-bare-id>` は、選択された agent のバックエンド model を上書きします。
- `x-openclaw-agent-id: <agentId>` は、互換性のための上書きとして引き続きサポートされます。
- `x-openclaw-session-key: <sessionKey>` は、セッションルーティングを完全に制御します。
- `x-openclaw-message-channel: <channel>` は、チャネル対応プロンプトおよびポリシー用の合成 ingress channel コンテキストを設定します。

互換性エイリアスとして引き続き受け付けられます。

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## エンドポイントを有効にする

`gateway.http.endpoints.chatCompletions.enabled` を `true` に設定してください。

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## エンドポイントを無効にする

`gateway.http.endpoints.chatCompletions.enabled` を `false` に設定してください。

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## セッション動作

デフォルトでは、このエンドポイントは**リクエストごとにステートレス**です（呼び出しごとに新しい session key が生成されます）。

リクエストに OpenAI の `user` 文字列が含まれている場合、Gateway はそこから安定した session key を導出するため、繰り返し呼び出しで agent セッションを共有できます。

## この画面が重要な理由

これは、セルフホスト型フロントエンドやツール群にとって最も効果の高い互換性セットです。

- 多くの Open WebUI、LobeChat、LibreChat 構成は `/v1/models` を想定します。
- 多くの RAG システムは `/v1/embeddings` を想定します。
- 既存の OpenAI chat client は、通常 `/v1/chat/completions` から始められます。
- より agent ネイティブな client は、次第に `/v1/responses` を好むようになっています。

## model 一覧と agent ルーティング

<AccordionGroup>
  <Accordion title="`/v1/models` は何を返しますか？">
    OpenClaw の agent ターゲット一覧です。

    返される id は `openclaw`、`openclaw/default`、および `openclaw/<agentId>` エントリです。
    それらを OpenAI の `model` 値としてそのまま使ってください。

  </Accordion>
  <Accordion title="`/v1/models` は agent と sub-agent のどちらを一覧表示しますか？">
    一覧表示されるのはトップレベルの agent ターゲットであり、バックエンド provider model でも sub-agent でもありません。

    sub-agent は内部実行トポロジーのままです。疑似 model としては表示されません。

  </Accordion>
  <Accordion title="なぜ `openclaw/default` が含まれているのですか？">
    `openclaw/default` は、設定済みデフォルト agent の安定したエイリアスです。

    つまり、環境間で実際のデフォルト agent id が変わっても、client は 1 つの予測可能な id を使い続けられます。

  </Accordion>
  <Accordion title="バックエンド model を上書きするにはどうすればよいですか？">
    `x-openclaw-model` を使ってください。

    例:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    これを省略した場合、選択された agent は通常の設定済み model 選択で実行されます。

  </Accordion>
  <Accordion title="embeddings はこのコントラクトにどう当てはまりますか？">
    `/v1/embeddings` は同じ agent ターゲット `model` id を使います。

    `model: "openclaw/default"` または `model: "openclaw/<agentId>"` を使ってください。
    特定の embedding model が必要な場合は、それを `x-openclaw-model` で送ってください。
    そのヘッダーがない場合、リクエストは選択された agent の通常の embedding 設定へ渡されます。

  </Accordion>
</AccordionGroup>

## ストリーミング（SSE）

Server-Sent Events（SSE）を受け取るには `stream: true` を設定してください。

- `Content-Type: text/event-stream`
- 各イベント行は `data: <json>`
- ストリームは `data: [DONE]` で終了します

## Open WebUI クイックセットアップ

基本的な Open WebUI 接続では:

- Base URL: `http://127.0.0.1:18789/v1`
- macOS 上の Docker での Base URL: `http://host.docker.internal:18789/v1`
- API key: Gateway の bearer token
- Model: `openclaw/default`

期待される動作:

- `GET /v1/models` は `openclaw/default` を一覧表示するはずです
- Open WebUI は `openclaw/default` を chat model id として使うはずです
- その agent に特定のバックエンド provider/model を使いたい場合は、agent の通常のデフォルト model を設定するか、`x-openclaw-model` を送ってください

簡易スモークテスト:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

これが `openclaw/default` を返すなら、ほとんどの Open WebUI 構成は同じ base URL と token で接続できます。

## 例

ストリーミングなし:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

ストリーミングあり:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

model 一覧:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

1 つの model を取得:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

embeddings を作成:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

注意:

- `/v1/models` は生の provider catalog ではなく、OpenClaw の agent ターゲットを返します。
- `openclaw/default` は常に存在するため、1 つの安定した id が環境をまたいで使えます。
- バックエンド provider/model の上書きは OpenAI の `model` フィールドではなく、`x-openclaw-model` に指定します。
- `/v1/embeddings` は `input` として文字列または文字列配列をサポートします。

## 関連

- [Configuration reference](/ja-JP/gateway/configuration-reference)
- [OpenAI](/ja-JP/providers/openai)
