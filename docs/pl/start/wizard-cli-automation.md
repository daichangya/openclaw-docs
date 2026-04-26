---
read_when:
    - Automatyzujesz onboarding w skryptach lub CI.
    - Potrzebujesz nieinteraktywnych przykładów dla konkretnych dostawców.
sidebarTitle: CLI automation
summary: Skryptowy onboarding i konfiguracja agenta dla CLI OpenClaw
title: Automatyzacja CLI
x-i18n:
    generated_at: "2026-04-26T11:41:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 50b6ef35554ec085012a84b8abb8d52013934ada5293d941babea56eaacf4a9f
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

Użyj `--non-interactive`, aby zautomatyzować `openclaw onboard`.

<Note>
`--json` nie implikuje trybu nieinteraktywnego. W skryptach używaj `--non-interactive` (oraz `--workspace`).
</Note>

## Podstawowy przykład nieinteraktywny

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

Dodaj `--json`, aby uzyskać podsumowanie w formacie czytelnym maszynowo.

Użyj `--skip-bootstrap`, gdy Twoja automatyzacja wstępnie przygotowuje pliki obszaru roboczego i nie chce, aby onboarding tworzył domyślne pliki bootstrap.

Użyj `--secret-input-mode ref`, aby przechowywać odwołania oparte na zmiennych środowiskowych w profilach uwierzytelniania zamiast wartości plaintext.
Interaktywny wybór między odwołaniami env a skonfigurowanymi odwołaniami dostawcy (`file` lub `exec`) jest dostępny w przepływie onboardingu.

W nieinteraktywnym trybie `ref` zmienne środowiskowe dostawcy muszą być ustawione w środowisku procesu.
Przekazanie flag kluczy inline bez pasującej zmiennej środowiskowej powoduje teraz natychmiastowy błąd.

Przykład:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Przykłady dla konkretnych dostawców

<AccordionGroup>
  <Accordion title="Przykład klucza API Anthropic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Gemini">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Z.AI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Cloudflare AI Gateway">
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
  <Accordion title="Przykład Moonshot">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Mistral">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Synthetic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład OpenCode">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Zmień na `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"`, aby użyć katalogu Go.
  </Accordion>
  <Accordion title="Przykład Ollama">
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
  <Accordion title="Przykład niestandardowego dostawcy">
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

    `--custom-api-key` jest opcjonalne. Jeśli go nie podasz, onboarding sprawdza `CUSTOM_API_KEY`.

    Wariant trybu ref:

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

    W tym trybie onboarding zapisuje `apiKey` jako `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

Token konfiguracji Anthropic setup-token nadal jest dostępny jako obsługiwana ścieżka tokenu onboardingowego, ale OpenClaw preferuje teraz ponowne użycie Claude CLI, gdy jest dostępne.
W środowisku produkcyjnym preferuj klucz API Anthropic.

## Dodaj kolejnego agenta

Użyj `openclaw agents add <name>`, aby utworzyć osobnego agenta z własnym obszarem roboczym,
sesjami i profilami uwierzytelniania. Uruchomienie bez `--workspace` otwiera kreator.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Co to ustawia:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Uwagi:

- Domyślne obszary robocze mają postać `~/.openclaw/workspace-<agentId>`.
- Dodaj `bindings`, aby kierować wiadomości przychodzące (kreator może to zrobić).
- Flagi nieinteraktywne: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Powiązane dokumenty

- Centrum onboardingu: [Onboarding (CLI)](/pl/start/wizard)
- Pełna dokumentacja referencyjna: [Dokumentacja referencyjna konfiguracji CLI](/pl/start/wizard-cli-reference)
- Dokumentacja referencyjna polecenia: [`openclaw onboard`](/pl/cli/onboard)
