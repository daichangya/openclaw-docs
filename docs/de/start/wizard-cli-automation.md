---
read_when:
    - Du automatisierst Onboarding in Skripten oder CI
    - Du benötigst nicht interaktive Beispiele für bestimmte Provider
sidebarTitle: CLI automation
summary: Skriptgesteuertes Onboarding und Agent-Setup für die OpenClaw-CLI
title: CLI-Automatisierung
x-i18n:
    generated_at: "2026-04-05T12:56:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: a757d58df443e5e71f97417aed20e6a80a63b84f69f7dbf0e093319827d37836
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

# CLI-Automatisierung

Verwende `--non-interactive`, um `openclaw onboard` zu automatisieren.

<Note>
`--json` impliziert keinen nicht interaktiven Modus. Verwende `--non-interactive` (und `--workspace`) für Skripte.
</Note>

## Grundlegendes nicht interaktives Beispiel

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

Füge `--json` für eine maschinenlesbare Zusammenfassung hinzu.

Verwende `--secret-input-mode ref`, um env-gestützte Referenzen in Auth-Profilen anstelle von Klartextwerten zu speichern.
Die interaktive Auswahl zwischen env-Referenzen und konfigurierten Provider-Referenzen (`file` oder `exec`) ist im Onboarding-Ablauf verfügbar.

Im nicht interaktiven `ref`-Modus müssen Provider-env-vars in der Prozessumgebung gesetzt sein.
Das Übergeben von Inline-Key-Flags ohne die passende env var schlägt jetzt sofort fehl.

Beispiel:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Provider-spezifische Beispiele

<AccordionGroup>
  <Accordion title="Anthropic Claude CLI-Beispiel">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice anthropic-cli \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    Erfordert, dass Claude CLI bereits auf demselben Gateway-
    Host installiert und angemeldet ist.

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
  <Accordion title="Vercel AI Gateway-Beispiel">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Cloudflare AI Gateway-Beispiel">
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
    Wechsle zu `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` für den Go-Katalog.
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
  <Accordion title="Benutzerdefiniertes Provider-Beispiel">
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

    Ref-Modus-Variante:

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

Anthropic-Setup-Token ist wieder als Legacy-/manueller Onboarding-Pfad verfügbar.
Verwende ihn in der Erwartung, dass Anthropic OpenClaw-Nutzern mitgeteilt hat, dass der OpenClaw-
Claude-Login-Pfad **Extra Usage** erfordert. Für den produktiven Einsatz solltest du einen
Anthropic-API-Schlüssel bevorzugen.

## Einen weiteren Agenten hinzufügen

Verwende `openclaw agents add <name>`, um einen separaten Agenten mit eigenem Workspace,
Sessions und Auth-Profilen zu erstellen. Wenn du es ohne `--workspace` ausführst, startet der Assistent.

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

- Standard-Workspaces folgen `~/.openclaw/workspace-<agentId>`.
- Füge `bindings` hinzu, um eingehende Nachrichten zu routen (der Assistent kann das tun).
- Nicht interaktive Flags: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Zugehörige Docs

- Onboarding-Hub: [Onboarding (CLI)](/de/start/wizard)
- Vollständige Referenz: [CLI Setup Reference](/start/wizard-cli-reference)
- Befehlsreferenz: [`openclaw onboard`](/cli/onboard)
