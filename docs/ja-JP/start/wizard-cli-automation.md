---
read_when:
    - スクリプトや CI でオンボーディングを自動化している
    - 特定のプロバイダー向けの非対話型の例が必要
sidebarTitle: CLI automation
summary: OpenClaw CLI のスクリプト化されたオンボーディングとエージェント設定
title: CLI 自動化
x-i18n:
    generated_at: "2026-04-05T12:57:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: a757d58df443e5e71f97417aed20e6a80a63b84f69f7dbf0e093319827d37836
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

# CLI 自動化

`openclaw onboard` を自動化するには `--non-interactive` を使います。

<Note>
`--json` は非対話モードを意味しません。スクリプトでは `--non-interactive`（および `--workspace`）を使用してください。
</Note>

## 基本の非対話型の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

機械可読なサマリーが必要な場合は `--json` を追加します。

認証プロファイルに平文の値ではなく env ベースの参照を保存するには、`--secret-input-mode ref` を使います。
env 参照と設定済みプロバイダー参照（`file` または `exec`）の対話型選択は、オンボーディングフローで利用できます。

非対話の `ref` モードでは、プロバイダーの環境変数がプロセス環境に設定されている必要があります。
対応する環境変数なしでインラインのキーフラグを渡すと、即座に失敗するようになっています。

例:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## プロバイダー固有の例

<AccordionGroup>
  <Accordion title="Anthropic Claude CLI の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice anthropic-cli \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    Claude CLI が同じ Gateway
    ホストにすでにインストール済みでサインイン済みである必要があります。

  </Accordion>
  <Accordion title="Gemini の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AI の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Vercel AI Gateway の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Cloudflare AI Gateway の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Moonshot の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistral の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Synthetic の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Go カタログを使う場合は、`--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` に切り替えてください。
  </Accordion>
  <Accordion title="Ollama の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="カスタムプロバイダーの例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    `--custom-api-key` は任意です。省略した場合、オンボーディングは `CUSTOM_API_KEY` を確認します。

    ref モードのバリアント:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    このモードでは、オンボーディングは `apiKey` を `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` として保存します。

  </Accordion>
</AccordionGroup>

Anthropic setup-token は、legacy/manual なオンボーディング経路として再び利用可能です。
Anthropic が OpenClaw ユーザーに対して、OpenClaw の
Claude-login 経路には **Extra Usage** が必要だと伝えていることを前提に使用してください。本番環境では、
Anthropic API キーを優先してください。

## 別のエージェントを追加する

独自のワークスペース、
セッション、認証プロファイルを持つ別のエージェントを作成するには、`openclaw agents add <name>` を使用します。`--workspace` なしで実行するとウィザードが起動します。

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

設定される内容:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

補足:

- デフォルトのワークスペースは `~/.openclaw/workspace-<agentId>` に従います。
- 受信メッセージをルーティングするには `bindings` を追加します（ウィザードでも可能です）。
- 非対話型フラグ: `--model`, `--agent-dir`, `--bind`, `--non-interactive`。

## 関連ドキュメント

- オンボーディングハブ: [オンボーディング（CLI）](/ja-JP/start/wizard)
- 完全なリファレンス: [CLI セットアップリファレンス](/start/wizard-cli-reference)
- コマンドリファレンス: [`openclaw onboard`](/cli/onboard)
