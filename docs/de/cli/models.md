---
read_when:
    - Sie möchten Standardmodelle ändern oder den Provider-Auth-Status anzeigen
    - Sie möchten verfügbare Modelle/Provider scannen und Auth-Profile debuggen
summary: CLI-Referenz für `openclaw models` (status/list/set/scan, Aliasse, Fallbacks, Auth)
title: models
x-i18n:
    generated_at: "2026-04-05T12:38:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ba33181d49b6bbf3b5d5fa413aa6b388c9f29fb9d4952055d68c79f7bcfea0
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Modellerkennung, Scannen und Konfiguration (Standardmodell, Fallbacks, Auth-Profile).

Verwandt:

- Provider + Modelle: [Models](/providers/models)
- Einrichtung der Provider-Authentifizierung: [Getting started](/de/start/getting-started)

## Häufige Befehle

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` zeigt die aufgelösten Standardwerte/Fallbacks plus eine Auth-Übersicht.
Wenn Snapshots zur Providernutzung verfügbar sind, enthält der Abschnitt zum OAuth-/API-Key-Status
Nutzungsfenster und Quota-Snapshots der Provider.
Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi und z.ai. Nutzungs-Auth stammt aus providerspezifischen Hooks,
wenn verfügbar; andernfalls greift OpenClaw auf passende OAuth-/API-Key-
Anmeldedaten aus Auth-Profilen, env oder der Konfiguration zurück.
Fügen Sie `--probe` hinzu, um Live-Auth-Probes für jedes konfigurierte Provider-Profil auszuführen.
Probes sind echte Anfragen (können Tokens verbrauchen und Rate Limits auslösen).
Verwenden Sie `--agent <id>`, um den Modell-/Auth-Status eines konfigurierten Agents zu prüfen. Wenn dies weggelassen wird,
verwendet der Befehl `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, falls gesetzt, andernfalls den
konfigurierten Standard-Agent.
Probe-Zeilen können aus Auth-Profilen, env-Anmeldedaten oder `models.json` stammen.

Hinweise:

- `models set <model-or-alias>` akzeptiert `provider/model` oder einen Alias.
- Modellreferenzen werden durch Aufteilen am **ersten** `/` geparst. Wenn die Modell-ID `/` enthält (im Stil von OpenRouter), geben Sie das Provider-Präfix an (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, löst OpenClaw die Eingabe zuerst als Alias auf, dann
  als eindeutige Übereinstimmung mit einem konfigurierten Provider für genau diese Modell-ID und greift erst danach
  mit einer Veraltungswarnung auf den konfigurierten Standardprovider zurück.
  Wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, fällt OpenClaw
  stattdessen auf das erste konfigurierte Provider-/Modellpaar zurück, anstatt einen
  veralteten Standardwert eines entfernten Providers anzuzeigen.
- `models status` kann in der Auth-Ausgabe `marker(<value>)` für nicht geheime Platzhalter anzeigen (zum Beispiel `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`), anstatt sie als Geheimnisse zu maskieren.

### `models status`

Optionen:

- `--json`
- `--plain`
- `--check` (Exit 1=abgelaufen/fehlend, 2=läuft bald ab)
- `--probe` (Live-Probe der konfigurierten Auth-Profile)
- `--probe-provider <name>` (einen Provider prüfen)
- `--probe-profile <id>` (wiederholbar oder kommagetrennte Profil-IDs)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (konfigurierte Agent-ID; überschreibt `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Buckets für den Probe-Status:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Zu erwartende Fälle für Probe-Details/Reason-Codes:

- `excluded_by_auth_order`: Ein gespeichertes Profil existiert, aber explizites
  `auth.order.<provider>` hat es ausgelassen, daher meldet die Probe den Ausschluss, anstatt
  es zu versuchen.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  Das Profil ist vorhanden, aber nicht geeignet/auflösbar.
- `no_model`: Provider-Auth ist vorhanden, aber OpenClaw konnte für diesen Provider
  keinen probe-fähigen Modellkandidaten auflösen.

## Aliasse + Fallbacks

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Auth-Profile

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` ist der interaktive Auth-Helfer. Er kann einen Provider-Auth-
Ablauf (OAuth/API-Key) starten oder Sie je nach ausgewähltem
Provider durch das manuelle Einfügen eines Tokens führen.

`models auth login` führt den Auth-Ablauf eines Provider-Plugins aus (OAuth/API-Key). Verwenden Sie
`openclaw plugins list`, um zu sehen, welche Provider installiert sind.

Beispiele:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
openclaw models auth login --provider openai-codex --set-default
```

Hinweise:

- `login --provider anthropic --method cli --set-default` verwendet einen lokalen Claude-
  CLI-Login erneut und schreibt den Hauptpfad für das Anthropic-Standardmodell auf eine kanonische
  `claude-cli/claude-*`-Referenz um.
- `setup-token` und `paste-token` bleiben generische Token-Befehle für Provider,
  die Token-Auth-Methoden bereitstellen.
- `setup-token` erfordert ein interaktives TTY und führt die Token-Auth-
  Methode des Providers aus (standardmäßig die `setup-token`-Methode dieses Providers, wenn er
  eine bereitstellt).
- `paste-token` akzeptiert eine andernorts oder durch Automatisierung erzeugte Token-Zeichenfolge.
- `paste-token` erfordert `--provider`, fragt nach dem Token-Wert und schreibt
  ihn in die Standard-Profil-ID `<provider>:manual`, sofern Sie nicht
  `--profile-id` übergeben.
- `paste-token --expires-in <duration>` speichert ein absolutes Ablaufdatum des Tokens aus einer
  relativen Dauer wie `365d` oder `12h`.
- Hinweis zur Anthropic-Abrechnung: Wir glauben, dass der Claude Code CLI-Fallback laut den öffentlichen CLI-Dokumenten von Anthropic wahrscheinlich für lokale, benutzerverwaltete Automatisierung erlaubt ist. Allerdings schafft die Richtlinie von Anthropic zu Harnesses von Drittanbietern genug Unklarheit in Bezug auf abonnementsbasierte Nutzung in externen Produkten, dass wir ihn für die Produktion nicht empfehlen. Anthropic informierte OpenClaw-Benutzer außerdem am **4. April 2026 um 12:00 Uhr PT / 20:00 Uhr BST**, dass der **OpenClaw**-Claude-Login-Pfad als Nutzung eines Harnesses von Drittanbietern zählt und **Extra Usage** erfordert, die getrennt vom Abonnement abgerechnet wird.
- Anthropic `setup-token` / `paste-token` sind als Legacy-/manueller OpenClaw-Pfad wieder verfügbar. Verwenden Sie sie in der Erwartung, dass Anthropic OpenClaw-Benutzern mitgeteilt hat, dass dieser Pfad **Extra Usage** erfordert.
