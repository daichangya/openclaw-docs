---
read_when:
    - OpenAI Chat Completionsを想定するツールを統合するとき
summary: GatewayからOpenAI互換の `/v1/chat/completions` HTTPエンドポイントを公開する
title: OpenAI Chat Completions
x-i18n:
    generated_at: "2026-04-05T12:44:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: c374b2f32ce693a8c752e2b0a2532c5f0299ed280f9a0e97b1a9d73bcec37b95
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# OpenAI Chat Completions（HTTP）

OpenClawのGatewayは、小規模なOpenAI互換のChat Completionsエンドポイントを提供できます。

このエンドポイントは**デフォルトで無効**です。まず設定で有効化してください。

- `POST /v1/chat/completions`
- Gatewayと同じポート（WS + HTTP多重化）: `http://<gateway-host>:<port>/v1/chat/completions`

GatewayのOpenAI互換HTTPサーフェスを有効にすると、次も提供されます。

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

内部的には、リクエストは通常のGateway agent実行として処理されます（`openclaw agent` と同じコードパス）ので、ルーティング、権限、設定はGatewayと一致します。

## 認証

Gatewayの認証設定を使用します。

一般的なHTTP認証パス:

- 共有シークレット認証（`gateway.auth.mode="token"` または `"password"`）:
  `Authorization: Bearer <token-or-password>`
- 信頼されたID保持HTTP認証（`gateway.auth.mode="trusted-proxy"`）:
  設定されたID対応プロキシを経由し、必要なIDヘッダーを
  挿入させます
- プライベートイングレスのオープン認証（`gateway.auth.mode="none"`）:
  認証ヘッダーは不要です

注:

- `gateway.auth.mode="token"` の場合は、`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）を使用します。
- `gateway.auth.mode="password"` の場合は、`gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を使用します。
- `gateway.auth.mode="trusted-proxy"` の場合、HTTPリクエストは
  設定済みの非loopback trusted proxyソースから来る必要があります。同一ホストのloopback proxyでは
  このモードを満たしません。
- `gateway.auth.rateLimit` が設定されており、認証失敗が多すぎる場合、エンドポイントは `Retry-After` 付きで `429` を返します。

## セキュリティ境界（重要）

このエンドポイントは、このGatewayインスタンスに対する**完全なオペレーターアクセス**のサーフェスとして扱ってください。

- ここでのHTTP bearer認証は、狭いユーザー単位スコープモデルではありません。
- このエンドポイント用の有効なGateway token/passwordは、owner/operator認証情報として扱う必要があります。
- リクエストは、信頼されたオペレーター操作と同じコントロールプレーンagentパスを通ります。
- このエンドポイントには、別個の非owner/ユーザー単位ツール境界はありません。呼び出し元がここでGateway認証を通過した時点で、OpenClawはその呼び出し元をこのGatewayの信頼されたoperatorとして扱います。
- 共有シークレット認証モード（`token` と `password`）では、呼び出し元がより狭い `x-openclaw-scopes` ヘッダーを送っても、エンドポイントは通常の完全なoperatorデフォルトを復元します。
- 信頼されたID保持HTTPモード（たとえばtrusted proxy authや `gateway.auth.mode="none"`）では、`x-openclaw-scopes` が存在すればそれを尊重し、存在しない場合は通常のoperatorデフォルトスコープセットにフォールバックします。
- 対象agentポリシーが機密ツールを許可している場合、このエンドポイントはそれらを使用できます。
- このエンドポイントはloopback/tailnet/private ingressのみに保持してください。公開インターネットへ直接公開しないでください。

認証マトリクス:

- `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`
  - 共有gateway operatorシークレットの所持を証明します
  - より狭い `x-openclaw-scopes` を無視します
  - 完全なデフォルトoperatorスコープセットを復元します:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - このエンドポイント上のチャットターンをowner-senderターンとして扱います
- 信頼されたID保持HTTPモード（たとえばtrusted proxy auth、またはprivate ingress上の `gateway.auth.mode="none"`）
  - 何らかの外側の信頼されたIDまたはデプロイ境界を認証します
  - ヘッダーが存在する場合は `x-openclaw-scopes` を尊重します
  - ヘッダーがない場合は通常のoperatorデフォルトスコープセットにフォールバックします
  - 呼び出し元が明示的にスコープを狭めて `operator.admin` を省略した場合にのみownerセマンティクスを失います

[Security](/gateway/security) と [Remote access](/gateway/remote) を参照してください。

## agent優先のモデル契約

OpenClawはOpenAIの `model` フィールドを、生のプロバイダーモデルIDではなく**agentターゲット**として扱います。

- `model: "openclaw"` は設定済みのデフォルトagentにルーティングされます。
- `model: "openclaw/default"` も設定済みのデフォルトagentにルーティングされます。
- `model: "openclaw/<agentId>"` は特定のagentにルーティングされます。

任意のリクエストヘッダー:

- `x-openclaw-model: <provider/model-or-bare-id>` は、選択されたagentのバックエンドモデルを上書きします。
- `x-openclaw-agent-id: <agentId>` も互換性上の上書きとして引き続きサポートされます。
- `x-openclaw-session-key: <sessionKey>` はセッションルーティングを完全に制御します。
- `x-openclaw-message-channel: <channel>` は、チャネル認識プロンプトとポリシーのためにsynthetic ingress channelコンテキストを設定します。

引き続き受け付ける互換エイリアス:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## エンドポイントの有効化

`gateway.http.endpoints.chatCompletions.enabled` を `true` に設定します。

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

## エンドポイントの無効化

`gateway.http.endpoints.chatCompletions.enabled` を `false` に設定します。

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

デフォルトでは、このエンドポイントは**リクエストごとにステートレス**です（呼び出しごとに新しいセッションキーが生成されます）。

リクエストにOpenAIの `user` 文字列が含まれている場合、Gatewayはそこから安定したセッションキーを導出するため、繰り返しの呼び出しでagentセッションを共有できます。

## このサーフェスが重要な理由

これは、セルフホスト型フロントエンドやツール群にとって、最も効果の高い互換性セットです。

- ほとんどのOpen WebUI、LobeChat、LibreChat構成は `/v1/models` を想定します。
- 多くのRAGシステムは `/v1/embeddings` を想定します。
- 既存のOpenAIチャットクライアントは通常、`/v1/chat/completions` から開始できます。
- よりagentネイティブなクライアントは、ますます `/v1/responses` を好むようになっています。

## モデル一覧とagentルーティング

<AccordionGroup>
  <Accordion title="`/v1/models` は何を返しますか？">
    OpenClawのagentターゲット一覧です。

    返されるidは `openclaw`、`openclaw/default`、および `openclaw/<agentId>` の各項目です。
    それらをOpenAIの `model` 値として直接使用してください。

  </Accordion>
  <Accordion title="`/v1/models` はagentを一覧表示しますか、それともsub-agentですか？">
    一覧表示するのはトップレベルのagentターゲットであり、バックエンドのprovider modelでもsub-agentでもありません。

    sub-agentは内部実行トポロジーのままです。擬似モデルとしては表示されません。

  </Accordion>
  <Accordion title="なぜ `openclaw/default` が含まれているのですか？">
    `openclaw/default` は、設定済みデフォルトagentの安定したエイリアスです。

    つまり、環境ごとに実際のデフォルトagent idが変わっても、クライアントは予測可能な1つのidを使い続けられます。

  </Accordion>
  <Accordion title="バックエンドモデルはどうやって上書きしますか？">
    `x-openclaw-model` を使用してください。

    例:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.4`

    これを省略した場合、選択されたagentは通常の設定済みモデル選択で実行されます。

  </Accordion>
  <Accordion title="embeddingsはこの契約にどう適合しますか？">
    `/v1/embeddings` は同じagentターゲット `model` idを使用します。

    `model: "openclaw/default"` または `model: "openclaw/<agentId>"` を使用してください。
    特定の埋め込みモデルが必要な場合は、それを `x-openclaw-model` で送信します。
    このヘッダーがない場合、リクエストは選択されたagentの通常の埋め込み設定に渡されます。

  </Accordion>
</AccordionGroup>

## ストリーミング（SSE）

Server-Sent Events（SSE）を受け取るには `stream: true` を設定します。

- `Content-Type: text/event-stream`
- 各イベント行は `data: <json>` です
- ストリームは `data: [DONE]` で終了します

## Open WebUI クイックセットアップ

基本的なOpen WebUI接続では次を使用します。

- Base URL: `http://127.0.0.1:18789/v1`
- macOS上のDocker用Base URL: `http://host.docker.internal:18789/v1`
- API key: Gateway bearer token
- Model: `openclaw/default`

期待される動作:

- `GET /v1/models` は `openclaw/default` を一覧表示するはずです
- Open WebUIはチャットモデルIDとして `openclaw/default` を使用するはずです
- そのagentに対して特定のバックエンドprovider/modelが必要な場合は、agentの通常のデフォルトモデルを設定するか、`x-openclaw-model` を送信してください

クイックスモーク:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

それで `openclaw/default` が返るなら、ほとんどのOpen WebUI構成は同じBase URLとtokenで接続できます。

## 例

非ストリーミング:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

ストリーミング:

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

モデル一覧:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

1つのモデルを取得:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

埋め込みを作成:

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

注:

- `/v1/models` は生のprovider catalogではなく、OpenClawのagentターゲットを返します。
- `openclaw/default` は常に存在するため、1つの安定したidを環境をまたいで使えます。
- バックエンドprovider/modelの上書きは、OpenAIの `model` フィールドではなく `x-openclaw-model` に属します。
- `/v1/embeddings` は、文字列または文字列配列としての `input` をサポートします。
