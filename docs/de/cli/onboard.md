---
read_when:
    - Sie möchten eine geführte Einrichtung für Gateway, Workspace, Authentifizierung, Kanäle und Skills
summary: CLI-Referenz für `openclaw onboard` (interaktives Onboarding)
title: onboard
x-i18n:
    generated_at: "2026-04-05T12:38:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6db61c8002c9e82e48ff44f72e176b58ad85fad5cb8434687455ed40add8cc2a
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Interaktives Onboarding für die Einrichtung eines lokalen oder entfernten Gateway.

## Verwandte Anleitungen

- CLI-Onboarding-Hub: [Onboarding (CLI)](/de/start/wizard)
- Onboarding-Überblick: [Onboarding Overview](/start/onboarding-overview)
- CLI-Onboarding-Referenz: [CLI Setup Reference](/start/wizard-cli-reference)
- CLI-Automatisierung: [CLI Automation](/start/wizard-cli-automation)
- macOS-Onboarding: [Onboarding (macOS App)](/start/onboarding)

## Beispiele

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Für Klartext-`ws://`-Ziele in privaten Netzwerken (nur vertrauenswürdige Netzwerke) setzen Sie
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in der Prozessumgebung des Onboarding.

Nicht interaktiver benutzerdefinierter Provider:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` ist im nicht interaktiven Modus optional. Wenn nicht angegeben, prüft das Onboarding `CUSTOM_API_KEY`.

Nicht interaktives Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` verwendet standardmäßig `http://127.0.0.1:11434`. `--custom-model-id` ist optional; wenn es nicht angegeben wird, verwendet das Onboarding die von Ollama vorgeschlagenen Standardwerte. Cloud-Modell-IDs wie `kimi-k2.5:cloud` funktionieren hier ebenfalls.

Provider-Schlüssel als Refs statt als Klartext speichern:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Mit `--secret-input-mode ref` schreibt das Onboarding env-gestützte Refs statt Klartext-Schlüsselwerten.
Für auth-profile-gestützte Provider werden `keyRef`-Einträge geschrieben; für benutzerdefinierte Provider schreibt dies `models.providers.<id>.apiKey` als env-Ref (zum Beispiel `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Vertrag für den nicht interaktiven `ref`-Modus:

- Setzen Sie die env-Variable des Providers in der Prozessumgebung des Onboarding (zum Beispiel `OPENAI_API_KEY`).
- Übergeben Sie keine Inline-Schlüssel-Flags (zum Beispiel `--openai-api-key`), es sei denn, diese env-Variable ist ebenfalls gesetzt.
- Wenn ein Inline-Schlüssel-Flag ohne die erforderliche env-Variable übergeben wird, schlägt das Onboarding sofort mit Hinweisen fehl.

Optionen für Gateway-Token im nicht interaktiven Modus:

- `--gateway-auth token --gateway-token <token>` speichert ein Klartext-Token.
- `--gateway-auth token --gateway-token-ref-env <name>` speichert `gateway.auth.token` als env-SecretRef.
- `--gateway-token` und `--gateway-token-ref-env` schließen sich gegenseitig aus.
- `--gateway-token-ref-env` erfordert eine nicht leere env-Variable in der Prozessumgebung des Onboarding.
- Mit `--install-daemon` werden, wenn die Token-Authentifizierung ein Token erfordert, SecretRef-verwaltete Gateway-Token validiert, aber nicht als aufgelöster Klartext in den Umgebungsmetadaten des Supervisor-Dienstes persistiert.
- Mit `--install-daemon` schlägt das Onboarding fail-closed fehl und zeigt Abhilfemaßnahmen an, wenn der Token-Modus ein Token erfordert und die konfigurierte Gateway-Token-SecretRef nicht aufgelöst ist.
- Mit `--install-daemon` blockiert das Onboarding die Installation, wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, bis der Modus explizit gesetzt wird.
- Lokales Onboarding schreibt `gateway.mode="local"` in die Konfiguration. Wenn in einer späteren Konfigurationsdatei `gateway.mode` fehlt, behandeln Sie dies als beschädigte Konfiguration oder als unvollständige manuelle Bearbeitung, nicht als gültige Abkürzung für den lokalen Modus.
- `--allow-unconfigured` ist ein separater Escape Hatch für die Gateway-Laufzeit. Es bedeutet nicht, dass das Onboarding `gateway.mode` weglassen darf.

Beispiel:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Statusprüfung des lokalen Gateway im nicht interaktiven Modus:

- Sofern Sie nicht `--skip-health` übergeben, wartet das Onboarding auf ein erreichbares lokales Gateway, bevor es erfolgreich beendet wird.
- `--install-daemon` startet zuerst den verwalteten Gateway-Installationspfad. Ohne diese Option muss bereits ein lokales Gateway laufen, zum Beispiel `openclaw gateway run`.
- Wenn Sie in der Automatisierung nur Konfigurations-/Workspace-/Bootstrap-Schreibvorgänge möchten, verwenden Sie `--skip-health`.
- Unter nativem Windows versucht `--install-daemon` zuerst Geplante Tasks und greift auf ein Anmeldeelement im benutzerspezifischen Startup-Ordner zurück, wenn die Erstellung des Tasks verweigert wird.

Verhalten des interaktiven Onboarding mit Referenzmodus:

- Wählen Sie **Use secret reference**, wenn Sie dazu aufgefordert werden.
- Wählen Sie dann entweder:
  - Environment variable
  - Configured secret provider (`file` oder `exec`)
- Das Onboarding führt vor dem Speichern der Referenz eine schnelle Vorabprüfung durch.
  - Wenn die Validierung fehlschlägt, zeigt das Onboarding den Fehler an und lässt Sie es erneut versuchen.

Nicht interaktive Z.AI-Endpunktauswahl:

Hinweis: `--auth-choice zai-api-key` erkennt jetzt automatisch den besten Z.AI-Endpunkt für Ihren Schlüssel (bevorzugt die allgemeine API mit `zai/glm-5`).
Wenn Sie ausdrücklich die Endpunkte des GLM Coding Plan verwenden möchten, wählen Sie `zai-coding-global` oder `zai-coding-cn`.

```bash
# Endpunktauswahl ohne Prompt
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Weitere Z.AI-Endpunktoptionen:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Nicht interaktives Mistral-Beispiel:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Hinweise zum Ablauf:

- `quickstart`: minimale Prompts, generiert automatisch ein Gateway-Token.
- `manual`: vollständige Prompts für Port/Bind/Auth (Alias von `advanced`).
- Wenn eine Auth-Auswahl einen bevorzugten Provider impliziert, filtert das Onboarding die Picker für Standardmodell und Allowlist vorab auf diesen Provider. Für Volcengine und BytePlus schließt dies auch die Varianten des Coding Plan ein
  (`volcengine-plan/*`, `byteplus-plan/*`).
- Wenn der Filter für den bevorzugten Provider noch keine geladenen Modelle ergibt, greift das Onboarding auf den ungefilterten Katalog zurück, statt den Picker leer zu lassen.
- Im Schritt zur Websuche können einige Provider providerspezifische Folge-Prompts auslösen:
  - **Grok** kann ein optionales `x_search`-Setup mit demselben `XAI_API_KEY` und einer `x_search`-Modellauswahl anbieten.
  - **Kimi** kann nach der Moonshot-API-Region fragen (`api.moonshot.ai` vs. `api.moonshot.cn`) und nach dem Standardmodell für die Kimi-Websuche.
- Verhalten des DM-Scope beim lokalen Onboarding: [CLI Setup Reference](/start/wizard-cli-reference#outputs-and-internals).
- Schnellster erster Chat: `openclaw dashboard` (Control UI, keine Kanaleinrichtung).
- Benutzerdefinierter Provider: Verbinden Sie einen beliebigen mit OpenAI oder Anthropic kompatiblen Endpunkt, einschließlich gehosteter Provider, die nicht aufgeführt sind. Verwenden Sie Unknown zur automatischen Erkennung.

## Häufige Folge-Befehle

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` impliziert keinen nicht interaktiven Modus. Verwenden Sie `--non-interactive` für Skripte.
</Note>
