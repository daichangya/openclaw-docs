---
read_when:
    - LM Studio を使ってオープンソースモデルで OpenClaw を実行したい場合
    - LM Studio をセットアップして設定したい場合
summary: LM Studio で OpenClaw を実行する
title: LM Studio
x-i18n:
    generated_at: "2026-04-13T08:50:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11264584e8277260d4215feb7c751329ce04f59e9228da1c58e147c21cd9ac2c
    source_path: providers/lmstudio.md
    workflow: 15
---

# LM Studio

LM Studio は、自分のハードウェア上でオープンウェイトモデルを実行するための、使いやすく強力なアプリです。llama.cpp（GGUF）または MLX モデル（Apple Silicon）を実行できます。GUI パッケージまたはヘッドレスデーモン（`llmster`）として利用できます。製品とセットアップのドキュメントについては、[lmstudio.ai](https://lmstudio.ai/) を参照してください。

## クイックスタート

1. LM Studio（デスクトップ）または `llmster`（ヘッドレス）をインストールし、ローカルサーバーを起動します。

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. サーバーを起動します

デスクトップアプリを起動するか、次のコマンドを使ってデーモンを実行してください。

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

アプリを使う場合は、快適に利用するために JIT を有効にしてください。詳しくは、[LM Studio JIT and TTL guide](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict) を参照してください。

3. OpenClaw では LM Studio のトークン値が必要です。`LM_API_TOKEN` を設定します。

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

LM Studio の認証が無効な場合は、空でない任意のトークン値を使ってください。

```bash
export LM_API_TOKEN="placeholder-key"
```

LM Studio の認証設定の詳細については、[LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) を参照してください。

4. オンボーディングを実行し、`LM Studio` を選択します。

```bash
openclaw onboard
```

5. オンボーディングで、`Default model` のプロンプトを使って LM Studio モデルを選択します。

後から設定または変更することもできます。

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio のモデルキーは `author/model-name` 形式（例: `qwen/qwen3.5-9b`）に従います。OpenClaw のモデル参照では、プロバイダー名が先頭に付きます: `lmstudio/qwen/qwen3.5-9b`。モデルの正確なキーは、`curl http://localhost:1234/api/v1/models` を実行して `key` フィールドを確認することで見つけられます。

## 非対話型オンボーディング

セットアップをスクリプト化したい場合（CI、プロビジョニング、リモートブートストラップ）は、非対話型オンボーディングを使用します。

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

または、API キーとともにベース URL やモデルを指定します。

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` は、LM Studio が返すモデルキー（例: `qwen/qwen3.5-9b`）を受け取り、`lmstudio/` のプロバイダープレフィックスは含めません。

非対話型オンボーディングには `--lmstudio-api-key`（または環境変数内の `LM_API_TOKEN`）が必要です。
認証されていない LM Studio サーバーでは、空でない任意のトークン値で動作します。

`--custom-api-key` も互換性のため引き続きサポートされていますが、LM Studio では `--lmstudio-api-key` の使用を推奨します。

これにより `models.providers.lmstudio` が書き込まれ、デフォルトモデルが
`lmstudio/<custom-model-id>` に設定され、`lmstudio:default` 認証プロファイルが書き込まれます。

対話型セットアップでは、任意の推奨ロードコンテキスト長を尋ねることができ、保存する検出済み LM Studio モデル全体にその設定を適用します。

## 設定

### 明示的な設定

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## トラブルシューティング

### LM Studio が検出されない

LM Studio が実行中であり、`LM_API_TOKEN` を設定していることを確認してください（認証なしサーバーでは、空でない任意のトークン値で動作します）。

```bash
# デスクトップアプリから起動するか、ヘッドレスで起動:
lms server start --port 1234
```

API にアクセスできることを確認します。

```bash
curl http://localhost:1234/api/v1/models
```

### 認証エラー（HTTP 401）

セットアップで HTTP 401 が報告される場合は、API キーを確認してください。

- `LM_API_TOKEN` が LM Studio で設定したキーと一致していることを確認してください。
- LM Studio の認証設定の詳細については、[LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) を参照してください。
- サーバーで認証が不要な場合は、`LM_API_TOKEN` に空でない任意のトークン値を使用してください。

### Just-in-time モデル読み込み

LM Studio は just-in-time（JIT）モデル読み込みをサポートしており、モデルは最初のリクエスト時に読み込まれます。`Model not loaded` エラーを避けるため、これを有効にしていることを確認してください。
