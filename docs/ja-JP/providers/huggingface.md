---
read_when:
    - OpenClawでHugging Face Inferenceを使いたい場合
    - HF tokenのenv varまたはCLI auth choiceが必要な場合
summary: Hugging Face Inferenceのセットアップ（認証 + モデル選択）
title: Hugging Face（Inference）
x-i18n:
    generated_at: "2026-04-05T12:54:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 692d2caffbaf991670260da393c67ae7e6349b9e1e3ed5cb9a514f8a77192e86
    source_path: providers/huggingface.md
    workflow: 15
---

# Hugging Face（Inference）

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) は、単一のrouter APIを通じてOpenAI互換のchat completionsを提供します。1つのtokenで多くのモデル（DeepSeek、Llamaなど）にアクセスできます。OpenClawは**OpenAI互換endpoint**を使用します（chat completionsのみ）。text-to-image、embeddings、speechには、直接 [HF inference clients](https://huggingface.co/docs/api-inference/quicktour) を使用してください。

- Provider: `huggingface`
- Auth: `HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN`（**Make calls to Inference Providers** 権限を持つfine-grained token）
- API: OpenAI互換（`https://router.huggingface.co/v1`）
- Billing: 単一のHF token。[pricing](https://huggingface.co/docs/inference-providers/pricing) はprovider料金に従い、free tierがあります。

## クイックスタート

1. [Hugging Face → Settings → Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) で、**Make calls to Inference Providers** 権限を持つfine-grained tokenを作成します。
2. オンボーディングを実行し、providerドロップダウンで **Hugging Face** を選び、プロンプトが表示されたらAPI keyを入力します:

```bash
openclaw onboard --auth-choice huggingface-api-key
```

3. **Default Hugging Face model** ドロップダウンで、使いたいモデルを選びます（有効なtokenがある場合はInference APIからリストが読み込まれ、ない場合は組み込みリストが表示されます）。選択内容はデフォルトモデルとして保存されます。
4. 後からconfigでデフォルトモデルを設定または変更することもできます:

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
    },
  },
}
```

## 非対話の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

これにより、`huggingface/deepseek-ai/DeepSeek-R1` がデフォルトモデルとして設定されます。

## 環境に関する注意

Gatewayがdaemon（launchd/systemd）として動作している場合は、`HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN` がそのprocessから利用可能であることを確認してください（たとえば `~/.openclaw/.env` または `env.shellEnv` 経由）。

## モデルdiscoveryとオンボーディングのドロップダウン

OpenClawは、**Inference endpointを直接呼び出して**モデルを検出します:

```bash
GET https://router.huggingface.co/v1/models
```

（任意: 完全なリストを得るには `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` または `$HF_TOKEN` を送信してください。authなしでは一部だけ返すendpointもあります。）レスポンスはOpenAI形式の `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }` です。

Hugging Face API key（オンボーディング、`HUGGINGFACE_HUB_TOKEN`、または `HF_TOKEN` 経由）を設定すると、OpenClawはこのGETを使って利用可能なchat-completionモデルを検出します。**対話型セットアップ**では、tokenを入力した後に、このリスト（またはリクエストが失敗した場合は組み込みcatalog）から内容が入った **Default Hugging Face model** ドロップダウンが表示されます。ランタイム時（たとえばGateway起動時）にも、keyがある場合、OpenClawは再び **GET** `https://router.huggingface.co/v1/models` を呼び出してcatalogを更新します。このリストは、組み込みcatalog（context windowやcostのようなmetadata用）とマージされます。リクエストが失敗した場合、またはkeyが設定されていない場合は、組み込みcatalogのみが使用されます。

## モデル名と編集可能なオプション

- **API由来の名前:** APIが `name`、`title`、または `display_name` を返す場合、モデル表示名は **GET /v1/models からhydrated** されます。そうでない場合は、model idから導出されます（例: `deepseek-ai/DeepSeek-R1` → 「DeepSeek R1」）。
- **表示名の上書き:** configでモデルごとにカスタムラベルを設定すると、CLIやUIで好きな表示名にできます:

```json5
{
  agents: {
    defaults: {
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
        "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
      },
    },
  },
}
```

- **ポリシー接尾辞:** OpenClawの組み込みHugging Faceドキュメントとヘルパーは、現在これら2つの接尾辞を組み込みポリシーバリアントとして扱います:
  - **`:fastest`** — 最高スループット
  - **`:cheapest`** — 出力tokenあたりの最低コスト

  これらは `models.providers.huggingface.models` に別エントリとして追加するか、接尾辞付きで `model.primary` を設定できます。デフォルトprovider順序は [Inference Provider settings](https://hf.co/settings/inference-providers) でも設定できます（接尾辞なし = その順序を使用）。

- **Config merge:** `models.providers.huggingface.models` 内の既存エントリ（たとえば `models.json` 内）は、configがマージされても保持されます。そのため、そこに設定したカスタム `name`、`alias`、またはmodel optionsは保持されます。

## モデルIDと設定例

モデルrefは `huggingface/<org>/<model>` 形式を使用します（Hub形式のID）。以下のリストは **GET** `https://router.huggingface.co/v1/models` に基づいています。あなたのcatalogにはさらに多く含まれている可能性があります。

**ID例（inference endpointより）:**

| Model                  | Ref（先頭に `huggingface/` を付ける） |
| ---------------------- | ------------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`             |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`           |
| Qwen3 8B               | `Qwen/Qwen3-8B`                       |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`            |
| Qwen3 32B              | `Qwen/Qwen3-32B`                      |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct`   |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`    |
| GPT-OSS 120B           | `openai/gpt-oss-120b`                 |
| GLM 4.7                | `zai-org/GLM-4.7`                     |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`                |

model idには `:fastest` または `:cheapest` を付けられます。デフォルト順序は [Inference Provider settings](https://hf.co/settings/inference-providers) で設定してください。完全な一覧は [Inference Providers](https://huggingface.co/docs/inference-providers) と **GET** `https://router.huggingface.co/v1/models` を参照してください。

### 完全な設定例

**PrimaryをDeepSeek R1にして、Qwenをfallbackにする:**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-R1",
        fallbacks: ["huggingface/Qwen/Qwen3-8B"],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
      },
    },
  },
}
```

**Qwenをデフォルトにし、`:cheapest` と `:fastest` バリアントを持たせる:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen3-8B" },
      models: {
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
        "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (cheapest)" },
        "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (fastest)" },
      },
    },
  },
}
```

**DeepSeek + Llama + GPT-OSS をalias付きで使う:**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
        fallbacks: [
          "huggingface/meta-llama/Llama-3.3-70B-Instruct",
          "huggingface/openai/gpt-oss-120b",
        ],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
        "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
        "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
      },
    },
  },
}
```

**複数のQwenとDeepSeekモデルをポリシー接尾辞付きで使う:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
      models: {
        "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
        "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (cheap)" },
        "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fast)" },
        "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
      },
    },
  },
}
```
