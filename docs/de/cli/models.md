---
read_when:
    - Sie möchten Standard-models ändern oder den Authentifizierungsstatus des Providers anzeigen
    - Sie möchten verfügbare models/Provider scannen und Authentifizierungsprofile debuggen
summary: CLI-Referenz für `openclaw models` (`status`/`list`/`set`/`scan`, Aliasse, Fallbacks, Authentifizierung)
title: models
x-i18n:
    generated_at: "2026-04-23T14:00:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4ba72ca8acb7cc31796c119fce3816e6a919eb28a4ed4b03664d3b222498f5a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Model-Erkennung, Scannen und Konfiguration (Standardmodell, Fallbacks, Authentifizierungsprofile).

Verwandt:

- Provider + models: [Models](/de/providers/models)
- Konzepte zur Modellauswahl + Slash-Command `/models`: [Models-Konzept](/de/concepts/models)
- Einrichtung der Provider-Authentifizierung: [Erste Schritte](/de/start/getting-started)

## Häufige Befehle

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` zeigt die aufgelösten Standardwerte/Fallbacks plus eine Authentifizierungsübersicht.
Wenn Snapshots zur Providernutzung verfügbar sind, enthält der Statusabschnitt für OAuth/API-Key
Nutzungsfenster und Kontingent-Snapshots der Provider.
Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi und z.ai. Nutzungsauthentifizierung kommt nach Möglichkeit aus
providerspezifischen Hooks; andernfalls greift OpenClaw auf passende OAuth/API-Key-
Anmeldedaten aus Authentifizierungsprofilen, der Umgebung oder der Konfiguration zurück.
In der Ausgabe mit `--json` ist `auth.providers` die
umgebungs-/konfigurations-/store-bewusste Providerübersicht,
während `auth.oauth` nur den Zustand der Profile im Authentifizierungs-Store zeigt.
Fügen Sie `--probe` hinzu, um Live-Authentifizierungsprüfungen für jedes konfigurierte Providerprofil auszuführen.
Prüfungen sind echte Anfragen (sie können Tokens verbrauchen und Rate Limits auslösen).
Verwenden Sie `--agent <id>`, um den Model-/Authentifizierungsstatus eines konfigurierten Agents zu prüfen. Wenn dies weggelassen wird,
verwendet der Befehl `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, falls gesetzt, andernfalls den
konfigurierten Standard-Agent.
Prüfzeilen können aus Authentifizierungsprofilen, Umgebungs-Anmeldedaten oder `models.json` stammen.

Hinweise:

- `models set <model-or-alias>` akzeptiert `provider/model` oder einen Alias.
- `models list --all` enthält auch gebündelte statische Katalogzeilen von Providern,
  selbst wenn Sie sich bei diesem Provider noch nicht authentifiziert haben. Diese Zeilen werden weiterhin
  als nicht verfügbar angezeigt, bis eine passende Authentifizierung konfiguriert ist.
- `models list --provider <id>` filtert nach Provider-ID, z. B. `moonshot` oder
  `openai-codex`. Es akzeptiert keine angezeigten Bezeichnungen aus interaktiven Provider-
  Auswahllisten, etwa `Moonshot AI`.
- Model-Referenzen werden durch Trennen am **ersten** `/` geparst. Wenn die Modell-ID `/` enthält (im Stil von OpenRouter), geben Sie das Provider-Präfix an (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, löst OpenClaw die Eingabe zuerst als Alias auf, dann
  als eindeutige configured-provider-Übereinstimmung für genau diese Modell-ID und greift erst danach
  mit einer Deprecation-Warnung auf den konfigurierten Standardprovider zurück.
  Wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, greift OpenClaw
  auf das erste konfigurierte Provider-/Modellpaar zurück, anstatt einen
  veralteten entfernten Provider-Standardwert anzuzeigen.
- `models status` kann in der Auth-Ausgabe `marker(<value>)` für nicht geheime Platzhalter anzeigen (zum Beispiel `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`), anstatt sie als Secrets zu maskieren.

### `models status`

Optionen:

- `--json`
- `--plain`
- `--check` (Exit-Code 1=abgelaufen/fehlend, 2=läuft bald ab)
- `--probe` (Live-Prüfung konfigurierter Authentifizierungsprofile)
- `--probe-provider <name>` (einen Provider prüfen)
- `--probe-profile <id>` (wiederholt oder durch Kommas getrennte Profil-IDs)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (konfigurierte Agent-ID; überschreibt `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Statuskategorien für Prüfungen:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Zu erwartende Prüfdetail-/Reason-Code-Fälle:

- `excluded_by_auth_order`: Ein gespeichertes Profil existiert, aber explizites
  `auth.order.<provider>` hat es ausgelassen, daher meldet die Prüfung den Ausschluss, statt
  es zu versuchen.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  Das Profil ist vorhanden, aber nicht zulässig/auflösbar.
- `no_model`: Provider-Authentifizierung existiert, aber OpenClaw konnte kein prüfbares
  Modellkandidat für diesen Provider auflösen.

## Aliasse + Fallbacks

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Authentifizierungsprofile

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` ist der interaktive Authentifizierungshelfer. Er kann einen Provider-Authentifizierungsablauf
(OAuth/API-Key) starten oder Sie abhängig vom gewählten Provider
durch das manuelle Einfügen eines Tokens führen.

`models auth login` führt den Authentifizierungsablauf eines Provider-Plugins aus (OAuth/API-Key). Verwenden Sie
`openclaw plugins list`, um zu sehen, welche Provider installiert sind.

Beispiele:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Hinweise:

- `setup-token` und `paste-token` bleiben generische Token-Befehle für Provider,
  die Token-Authentifizierungsmethoden bereitstellen.
- `setup-token` erfordert ein interaktives TTY und führt die Token-Authentifizierungs-
  methode des Providers aus (standardmäßig die Methode `setup-token` dieses Providers, wenn er
  eine solche bereitstellt).
- `paste-token` akzeptiert eine Token-Zeichenfolge, die andernorts oder per Automatisierung generiert wurde.
- `paste-token` erfordert `--provider`, fragt nach dem Token-Wert und schreibt
  ihn in die Standardprofil-ID `<provider>:manual`, sofern Sie nicht
  `--profile-id` angeben.
- `paste-token --expires-in <duration>` speichert ein absolutes Token-Ablaufdatum aus einer
  relativen Dauer wie `365d` oder `12h`.
- Anthropic-Hinweis: Mitarbeiter von Anthropic haben uns mitgeteilt, dass die Nutzung im Stil der Claude CLI von OpenClaw wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` für diese Integration als zulässig, solange Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic `setup-token` / `paste-token` bleiben als unterstützter OpenClaw-Tokenpfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.
