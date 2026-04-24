---
read_when:
    - Sie möchten eine geführte Einrichtung für Gateway, Workspace, Auth, Kanäle und Skills
summary: CLI-Referenz für `openclaw onboard` (interaktives Onboarding)
title: Onboard
x-i18n:
    generated_at: "2026-04-24T06:32:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab92ff5651b7db18850558cbb47527bf0486f278c8aed0929eaeff0017b6c280
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Interaktives Onboarding für die lokale oder Remote-Gateway-Einrichtung.

## Verwandte Leitfäden

- CLI-Onboarding-Hub: [Onboarding (CLI)](/de/start/wizard)
- Onboarding-Übersicht: [Onboarding Overview](/de/start/onboarding-overview)
- CLI-Onboarding-Referenz: [CLI Setup Reference](/de/start/wizard-cli-reference)
- CLI-Automatisierung: [CLI Automation](/de/start/wizard-cli-automation)
- macOS-Onboarding: [Onboarding (macOS App)](/de/start/onboarding)

## Beispiele

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Für unverschlüsselte `ws://`-Ziele in privaten Netzwerken (nur vertrauenswürdige Netzwerke) setzen Sie
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in der Prozessumgebung des Onboardings.

Nicht-interaktiver benutzerdefinierter Provider:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` ist im nicht-interaktiven Modus optional. Wenn es weggelassen wird, prüft das Onboarding `CUSTOM_API_KEY`.

LM Studio unterstützt im nicht-interaktiven Modus auch ein providerspezifisches Schlüssel-Flag:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Nicht-interaktives Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` hat standardmäßig den Wert `http://127.0.0.1:11434`. `--custom-model-id` ist optional; wenn es weggelassen wird, verwendet das Onboarding die vorgeschlagenen Standardwerte von Ollama. Cloud-Modell-IDs wie `kimi-k2.5:cloud` funktionieren hier ebenfalls.

Providerschlüssel statt als Klartext als Referenzen speichern:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Mit `--secret-input-mode ref` schreibt das Onboarding env-gestützte Referenzen statt Klartext-Schlüsselwerten.
Bei Providern mit Auth-Profil-Unterstützung werden dadurch `keyRef`-Einträge geschrieben; bei benutzerdefinierten Providern schreibt dies `models.providers.<id>.apiKey` als env-Referenz (zum Beispiel `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Vertrag für den nicht-interaktiven Modus `ref`:

- Setzen Sie die Provider-Umgebungsvariable in der Prozessumgebung des Onboardings (zum Beispiel `OPENAI_API_KEY`).
- Übergeben Sie keine Inline-Schlüssel-Flags (zum Beispiel `--openai-api-key`), es sei denn, diese Umgebungsvariable ist ebenfalls gesetzt.
- Wenn ein Inline-Schlüssel-Flag ohne die erforderliche Umgebungsvariable übergeben wird, schlägt das Onboarding sofort mit Hinweisen fehl.

Optionen für Gateway-Token im nicht-interaktiven Modus:

- `--gateway-auth token --gateway-token <token>` speichert ein Klartext-Token.
- `--gateway-auth token --gateway-token-ref-env <name>` speichert `gateway.auth.token` als env-SecretRef.
- `--gateway-token` und `--gateway-token-ref-env` schließen sich gegenseitig aus.
- `--gateway-token-ref-env` erfordert eine nicht leere Umgebungsvariable in der Prozessumgebung des Onboardings.
- Mit `--install-daemon` werden SecretRef-verwaltete Gateway-Tokens validiert, wenn die Token-Authentifizierung ein Token erfordert, aber nicht als aufgelöster Klartext in den Umgebungsmetadaten des Supervisor-Dienstes gespeichert.
- Mit `--install-daemon` schlägt das Onboarding geschlossen fehl und gibt Hinweise zur Behebung, wenn der Token-Modus ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist.
- Mit `--install-daemon` blockiert das Onboarding die Installation, bis der Modus explizit gesetzt ist, wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist.
- Lokales Onboarding schreibt `gateway.mode="local"` in die Konfiguration. Wenn in einer späteren Konfigurationsdatei `gateway.mode` fehlt, behandeln Sie das als Konfigurationsschaden oder unvollständige manuelle Bearbeitung, nicht als gültige Abkürzung für den lokalen Modus.
- `--allow-unconfigured` ist ein separater Laufzeit-Escape-Hatch für Gateway. Es bedeutet nicht, dass das Onboarding `gateway.mode` weglassen darf.

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

Nicht-interaktive Prüfung des lokalen Gateway-Zustands:

- Wenn Sie nicht `--skip-health` übergeben, wartet das Onboarding vor erfolgreichem Beenden auf ein erreichbares lokales Gateway.
- `--install-daemon` startet zuerst den verwalteten Gateway-Installationspfad. Ohne diese Option muss bereits ein lokales Gateway laufen, zum Beispiel `openclaw gateway run`.
- Wenn Sie in der Automatisierung nur Konfigurations-/Workspace-/Bootstrap-Schreibvorgänge möchten, verwenden Sie `--skip-health`.
- Unter nativem Windows versucht `--install-daemon` zuerst Geplante Aufgaben und greift auf ein Anmeldeelement im benutzerspezifischen Startup-Ordner zurück, wenn das Erstellen der Aufgabe verweigert wird.

Verhalten des interaktiven Onboardings mit Referenzmodus:

- Wählen Sie **Use secret reference**, wenn Sie dazu aufgefordert werden.
- Wählen Sie dann entweder:
  - Umgebungsvariable
  - Konfigurierter Secret-Provider (`file` oder `exec`)
- Das Onboarding führt vor dem Speichern der Referenz eine schnelle Vorabprüfung durch.
  - Wenn die Validierung fehlschlägt, zeigt das Onboarding den Fehler an und lässt Sie es erneut versuchen.

Nicht-interaktive Z.AI-Endpunktauswahl:

Hinweis: `--auth-choice zai-api-key` erkennt jetzt automatisch den besten Z.AI-Endpunkt für Ihren Schlüssel (bevorzugt die allgemeine API mit `zai/glm-5.1`).
Wenn Sie speziell die Endpunkte des GLM Coding Plan möchten, wählen Sie `zai-coding-global` oder `zai-coding-cn`.

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

Nicht-interaktives Mistral-Beispiel:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Hinweise zu den Abläufen:

- `quickstart`: minimale Abfragen, erzeugt automatisch ein Gateway-Token.
- `manual`: vollständige Abfragen für Port/Bind/Auth (Alias von `advanced`).
- Wenn eine Auth-Auswahl einen bevorzugten Provider impliziert, filtert das Onboarding die Auswahlen für Standardmodell und Allowlist vorab auf diesen Provider. Für Volcengine und BytePlus schließt dies auch die Coding-Plan-Varianten ein (`volcengine-plan/*`, `byteplus-plan/*`).
- Wenn der Filter für bevorzugte Provider noch keine geladenen Modelle ergibt, greift das Onboarding auf den ungefilterten Katalog zurück, statt die Auswahl leer zu lassen.
- Im Schritt zur Websuche können einige Provider providerspezifische Folgeabfragen auslösen:
  - **Grok** kann optionales `x_search`-Setup mit demselben `XAI_API_KEY` und einer Modellauswahl für `x_search` anbieten.
  - **Kimi** kann nach der Moonshot-API-Region (`api.moonshot.ai` vs. `api.moonshot.cn`) und dem Standard-Websuchmodell von Kimi fragen.
- Verhalten des lokalen Onboardings für den DM-Bereich: [CLI Setup Reference](/de/start/wizard-cli-reference#outputs-and-internals).
- Schnellster erster Chat: `openclaw dashboard` (Control UI, keine Kanaleinrichtung).
- Benutzerdefinierter Provider: Verbinden Sie jeden mit OpenAI oder Anthropic kompatiblen Endpunkt, einschließlich gehosteter Provider, die nicht aufgelistet sind. Verwenden Sie Unknown zur automatischen Erkennung.

## Häufige Folge-Befehle

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` impliziert keinen nicht-interaktiven Modus. Verwenden Sie `--non-interactive` für Skripte.
</Note>
