---
read_when:
    - Sie möchten Standardmodelle ändern oder den Authentifizierungsstatus des Providers anzeigen.
    - Sie möchten verfügbare Modelle/Provider scannen und Auth-Profile debuggen.
summary: CLI-Referenz für `openclaw models` (status/list/set/scan, Aliasse, Fallbacks, Authentifizierung)
title: Modelle
x-i18n:
    generated_at: "2026-04-24T06:32:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08e04342ef240bf7a1f60c4d4e2667d17c9a97e985c1b170db8538c890dc8119
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Modellerkennung, Scannen und Konfiguration (Standardmodell, Fallbacks, Auth-Profile).

Verwandt:

- Provider + Modelle: [Modelle](/de/providers/models)
- Konzepte zur Modellauswahl + Slash-Command `/models`: [Modellkonzept](/de/concepts/models)
- Einrichtung der Provider-Authentifizierung: [Erste Schritte](/de/start/getting-started)

## Häufige Befehle

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` zeigt den aufgelösten Standard/Fallbacks sowie eine Authentifizierungsübersicht an.
Wenn Snapshots zur Providernutzung verfügbar sind, enthält der Abschnitt zum OAuth/API-Key-Status
Nutzungsfenster und Kontingent-Snapshots der Provider.
Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi und z.ai. Die Nutzungsauthentifizierung stammt aus providerspezifischen Hooks,
wenn verfügbar; andernfalls greift OpenClaw auf passende OAuth-/API-Key-
Zugangsdaten aus Auth-Profilen, der Umgebung oder der Konfiguration zurück.
In der Ausgabe mit `--json` ist `auth.providers` die an Umgebung/Konfiguration/Store angepasste
Providerübersicht, während `auth.oauth` nur den Zustand der Auth-Store-Profile zeigt.
Fügen Sie `--probe` hinzu, um Live-Authentifizierungsprüfungen gegen jedes konfigurierte Provider-Profil auszuführen.
Prüfungen sind echte Anfragen (können Token verbrauchen und Rate Limits auslösen).
Verwenden Sie `--agent <id>`, um den Modell-/Authentifizierungsstatus eines konfigurierten Agenten zu prüfen. Wenn weggelassen,
verwendet der Befehl `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, falls gesetzt, andernfalls den
konfigurierten Standardagenten.
Prüfzeilen können aus Auth-Profilen, Umgebungszugangsdaten oder `models.json` stammen.

Hinweise:

- `models set <model-or-alias>` akzeptiert `provider/model` oder einen Alias.
- `models list` ist schreibgeschützt: Es liest Konfiguration, Auth-Profile, den vorhandenen Katalogstatus
  und providerseitige Katalogzeilen, schreibt aber `models.json`
  nicht neu.
- `models list --all` enthält gebündelte statische Katalogzeilen im Besitz des Providers auch dann,
  wenn Sie sich bei diesem Provider noch nicht authentifiziert haben. Diese Zeilen werden weiterhin
  als nicht verfügbar angezeigt, bis passende Authentifizierung konfiguriert ist.
- `models list --provider <id>` filtert nach der Provider-ID, etwa `moonshot` oder
  `openai-codex`. Interaktive Anzeigenamen aus der Providerauswahl wie
  `Moonshot AI` werden nicht akzeptiert.
- Modellreferenzen werden durch Aufteilen am **ersten** `/` geparst. Wenn die Modell-ID `/` enthält (im Stil von OpenRouter), fügen Sie das Providerpräfix hinzu (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, löst OpenClaw die Eingabe zuerst als Alias auf, dann
  als eindeutige konfigurierte-Provider-Übereinstimmung für genau diese Modell-ID, und greift erst dann
  mit einer Veraltungswarnung auf den konfigurierten Standardprovider zurück.
  Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, greift OpenClaw
  auf das erste konfigurierte Provider-/Modellpaar zurück, anstatt einen
  veralteten Standard eines entfernten Providers anzuzeigen.
- `models status` kann in der Auth-Ausgabe `marker(<value>)` für nicht geheime Platzhalter anzeigen (zum Beispiel `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`), anstatt sie als Geheimnisse zu maskieren.

### `models status`

Optionen:

- `--json`
- `--plain`
- `--check` (Exit-Code 1=abgelaufen/fehlt, 2=läuft bald ab)
- `--probe` (Live-Prüfung konfigurierter Auth-Profile)
- `--probe-provider <name>` (einen Provider prüfen)
- `--probe-profile <id>` (wiederholte oder kommaseparierte Profil-IDs)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (konfigurierte Agent-ID; überschreibt `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Statusklassen für Prüfungen:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Zu erwartende Fälle für Prüfdetails/Reason Codes:

- `excluded_by_auth_order`: Es existiert ein gespeichertes Profil, aber explizites
  `auth.order.<provider>` hat es ausgelassen, daher meldet die Prüfung den Ausschluss, statt
  es zu versuchen.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  Profil ist vorhanden, aber nicht geeignet/auflösbar.
- `no_model`: Provider-Authentifizierung ist vorhanden, aber OpenClaw konnte für diesen Provider
  kein prüfbares Modellkandidat auflösen.

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

`models auth add` ist die interaktive Authentifizierungshilfe. Sie kann einen Provider-Authentifizierungsablauf
(OAuth/API-Key) starten oder Sie je nach gewähltem
Provider zur manuellen Token-Eingabe führen.

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
  methode des Providers aus (standardmäßig dessen Methode `setup-token`, wenn er
  eine bereitstellt).
- `paste-token` akzeptiert eine an anderer Stelle oder durch Automatisierung erzeugte Token-Zeichenfolge.
- `paste-token` erfordert `--provider`, fragt nach dem Tokenwert und schreibt
  ihn in die Standard-Profil-ID `<provider>:manual`, sofern Sie nicht
  `--profile-id` übergeben.
- `paste-token --expires-in <duration>` speichert einen absoluten Tokenablauf aus einer
  relativen Dauer wie `365d` oder `12h`.
- Hinweis zu Anthropic: Mitarbeitende von Anthropic haben uns mitgeteilt, dass die Nutzung im Stil von OpenClaw Claude CLI wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` für diese Integration als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic `setup-token` / `paste-token` bleiben als unterstützter OpenClaw-Tokenpfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Modellauswahl](/de/concepts/model-providers)
- [Modell-Failover](/de/concepts/model-failover)
