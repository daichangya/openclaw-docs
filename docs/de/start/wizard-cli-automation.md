---
read_when:
    - Sie automatisieren Onboarding in Skripten oder CI
    - Sie benötigen nicht interaktive Beispiele für bestimmte Provider
sidebarTitle: CLI automation
summary: Skriptgesteuertes Onboarding und Agent-Setup für die OpenClaw-CLI
title: CLI-Automatisierung
x-i18n:
    generated_at: "2026-04-24T07:00:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: b114b6b4773af8f23be0e65485bdcb617848e35cfde1642776c75108d470cea3
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

Verwenden Sie `--non-interactive`, um `openclaw onboard` zu automatisieren.

<Note>
`--json` impliziert keinen nicht interaktiven Modus. Verwenden Sie für Skripte `--non-interactive` (und `--workspace`).
</Note>

## Basisbeispiel für nicht interaktive Nutzung

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

Fügen Sie `--json` für eine maschinenlesbare Zusammenfassung hinzu.

Verwenden Sie `--secret-input-mode ref`, um env-gestützte Referenzen in Auth-Profilen statt Klartextwerten zu speichern.
Die interaktive Auswahl zwischen env-Referenzen und konfigurierten Provider-Referenzen (`file` oder `exec`) ist im Onboarding-Flow verfügbar.

Im nicht interaktiven `ref`-Modus müssen Provider-Umgebungsvariablen in der Prozessumgebung gesetzt sein.
Das Übergeben von Inline-Key-Flags ohne passende Umgebungsvariable schlägt jetzt sofort fehl.

Beispiel:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Providerspezifische Beispiele

<AccordionGroup>
  <Accordion title="Beispiel für Anthropic-API-Key">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Gemini-Beispiel">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AI-Beispiel">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Beispiel für Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Beispiel für Cloudflare AI Gateway">
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
  <Accordion title="Moonshot-Beispiel">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistral-Beispiel">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Synthetic-Beispiel">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode-Beispiel">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Wechseln Sie zu `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` für den Go-Katalog.
  </Accordion>
  <Accordion title="Ollama-Beispiel">
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
  <Accordion title="Beispiel für benutzerdefinierten Provider">
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

    `--custom-api-key` ist optional. Wenn es weggelassen wird, prüft das Onboarding `CUSTOM_API_KEY`.

    Variante im Ref-Modus:

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

    In diesem Modus speichert das Onboarding `apiKey` als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

Anthropic-Setup-Token bleibt als unterstützter Onboarding-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt, wenn verfügbar, die Wiederverwendung der Claude CLI.
Für den produktiven Einsatz ist ein Anthropic-API-Key vorzuziehen.

## Weiteren Agenten hinzufügen

Verwenden Sie `openclaw agents add <name>`, um einen separaten Agenten mit eigenem Workspace,
eigenen Sitzungen und eigenen Auth-Profilen zu erstellen. Wenn Sie es ohne `--workspace` ausführen, startet der Wizard.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Was gesetzt wird:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Hinweise:

- Standard-Workspaces folgen dem Muster `~/.openclaw/workspace-<agentId>`.
- Fügen Sie `bindings` hinzu, um eingehende Nachrichten zu routen (der Wizard kann das übernehmen).
- Nicht interaktive Flags: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Verwandte Dokumentation

- Onboarding-Hub: [Onboarding (CLI)](/de/start/wizard)
- Vollständige Referenz: [CLI-Setup-Referenz](/de/start/wizard-cli-reference)
- Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
