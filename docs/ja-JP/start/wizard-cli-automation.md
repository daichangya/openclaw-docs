---
read_when:
    - スクリプトまたは CI でオンボーディングを自動化している場合
    - 特定の provider 向けの非対話例が必要な場合
sidebarTitle: CLI automation
summary: OpenClaw CLI のスクリプト化されたオンボーディングとエージェント設定
title: CLI 自動化
x-i18n:
    generated_at: "2026-04-25T13:59:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d36801439b9243ea5cc0ab93757dde23d1ecd86c8f5b991541ee14f41bf05ac
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

`openclaw onboard` を自動化するには `--non-interactive` を使用します。

<Note>
`--json` は non-interactive モードを意味しません。スクリプトでは `--non-interactive`（および `--workspace`）を使ってください。
</Note>

## ベースラインの non-interactive 例

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
  --skip-bootstrap \
  --skip-skills
```

機械可読なサマリーが必要なら `--json` を追加してください。

自動化側ですでに workspace file を事前配置しており、オンボーディングにデフォルトの bootstrap file を作らせたくない場合は `--skip-bootstrap` を使ってください。

平文値の代わりに env ベースの ref を auth profile に保存したい場合は `--secret-input-mode ref` を使用します。  
env ref と設定済み provider ref（`file` または `exec`）の対話選択はオンボーディングフローで利用できます。

non-interactive の `ref` モードでは、provider env var は process environment に設定されている必要があります。  
対応する env var なしでインライン key flag を渡すと、現在は即座に失敗します。

例:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Provider ごとの例

<AccordionGroup>
  <Accordion title="Anthropic API key の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
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
    Go catalog を使う場合は、`--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` に切り替えてください。
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
  <Accordion title="Custom provider の例">
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

Anthropic setup-token は、引き続きサポートされたオンボーディング token 経路として利用可能ですが、OpenClaw は現在、利用可能であれば Claude CLI の再利用を優先します。  
本番では Anthropic API key を優先してください。

## 別のエージェントを追加する

独自の workspace、
session、および auth profile を持つ別エージェントを作成するには `openclaw agents add <name>` を使用します。`--workspace` なしで実行するとウィザードが起動します。

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

設定されるもの:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意:

- デフォルトの workspace は `~/.openclaw/workspace-<agentId>` 形式です。
- 受信メッセージをルーティングするには `bindings` を追加します（ウィザードでも設定できます）。
- non-interactive フラグ: `--model`, `--agent-dir`, `--bind`, `--non-interactive`。

## 関連ドキュメント

- オンボーディングハブ: [Onboarding (CLI)](/ja-JP/start/wizard)
- 完全リファレンス: [CLI Setup Reference](/ja-JP/start/wizard-cli-reference)
- コマンドリファレンス: [`openclaw onboard`](/ja-JP/cli/onboard)
