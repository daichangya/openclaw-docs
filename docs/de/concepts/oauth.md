---
read_when:
    - Sie möchten OpenClaw OAuth Ende zu Ende verstehen
    - Sie stoßen auf Probleme mit Token-Invalidierung oder Logout
    - Sie möchten Claude CLI- oder OAuth-Authentifizierungsabläufe
    - Sie möchten mehrere Konten oder Profil-Routing
summary: 'OAuth in OpenClaw: Tokenaustausch, Speicherung und Muster für mehrere Konten'
title: OAuth
x-i18n:
    generated_at: "2026-04-07T06:13:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4117fee70e3e64fd3a762403454ac2b78de695d2b85a7146750c6de615921e02
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw unterstützt „Subscription-Authentifizierung“ per OAuth für Anbieter, die dies anbieten
(insbesondere **OpenAI Codex (ChatGPT OAuth)**). Für Anthropic ist die praktische Aufteilung
jetzt:

- **Anthropic API key**: normale Anthropic-API-Abrechnung
- **Anthropic Claude CLI / Subscription-Authentifizierung innerhalb von OpenClaw**: Anthropic-Mitarbeiter
  haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist

OpenAI Codex OAuth wird ausdrücklich für die Nutzung in externen Tools wie
OpenClaw unterstützt. Diese Seite erklärt:

Für Anthropic in der Produktion ist die Authentifizierung per API key der sicherere empfohlene Weg.

- wie der OAuth-**Tokenaustausch** funktioniert (PKCE)
- wo Tokens **gespeichert** werden (und warum)
- wie mit **mehreren Konten** umgegangen wird (Profile + sitzungsbezogene Überschreibungen)

OpenClaw unterstützt außerdem **Provider-Plugins**, die ihre eigenen OAuth- oder API‑key-
Abläufe mitbringen. Führen Sie sie aus mit:

```bash
openclaw models auth login --provider <id>
```

## Die Token-Senke (warum sie existiert)

OAuth-Anbieter stellen bei Login-/Refresh-Abläufen häufig einen **neuen Refresh-Token** aus. Einige Anbieter (oder OAuth-Clients) können ältere Refresh-Tokens ungültig machen, wenn für denselben Benutzer/dieselbe App ein neuer ausgestellt wird.

Praktisches Symptom:

- Sie melden sich über OpenClaw _und_ über Claude Code / Codex CLI an → eines von beiden wird später zufällig „abgemeldet“

Um das zu reduzieren, behandelt OpenClaw `auth-profiles.json` als **Token-Senke**:

- die Laufzeit liest Anmeldedaten aus **einem Ort**
- wir können mehrere Profile beibehalten und sie deterministisch routen
- wenn Anmeldedaten aus einer externen CLI wie Codex CLI wiederverwendet werden, spiegelt OpenClaw
  sie mit Herkunftsinformationen und liest diese externe Quelle erneut, statt
  den Refresh-Token selbst zu rotieren

## Speicherung (wo Tokens gespeichert werden)

Secrets werden **pro Agent** gespeichert:

- Auth-Profile (OAuth + API keys + optionale Referenzen auf Wertebene): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy-Kompatibilitätsdatei: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statische `api_key`-Einträge werden beim Auffinden bereinigt)

Legacy-Datei nur für den Import (weiterhin unterstützt, aber nicht der Hauptspeicher):

- `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in `auth-profiles.json` importiert)

Alle oben genannten Pfade berücksichtigen auch `$OPENCLAW_STATE_DIR` (Überschreibung des Zustandsverzeichnisses). Vollständige Referenz: [/gateway/configuration](/de/gateway/configuration-reference#auth-storage)

Für statische Secret-Referenzen und das Aktivierungsverhalten von Laufzeit-Snapshots siehe [Secrets Management](/de/gateway/secrets).

## Anthropic-Legacy-Token-Kompatibilität

<Warning>
Anthropics öffentliche Claude-Code-Dokumentation besagt, dass die direkte Nutzung von Claude Code innerhalb
der Claude-Subscription-Limits bleibt, und Anthropic-Mitarbeiter haben uns mitgeteilt, dass die Nutzung
von Claude CLI im Stil von OpenClaw wieder erlaubt ist. OpenClaw behandelt daher die Wiederverwendung von Claude CLI und
die Nutzung von `claude -p` für diese Integration als sanktioniert, sofern Anthropic
keine neue Richtlinie veröffentlicht.

Für Anthropics aktuelle Dokumentation zu Direct-Claude-Code-Plänen siehe [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
und [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Wenn Sie andere Subscription-ähnliche Optionen in OpenClaw möchten, siehe [OpenAI
Codex](/de/providers/openai), [Qwen Cloud Coding
Plan](/de/providers/qwen), [MiniMax Coding Plan](/de/providers/minimax),
und [Z.AI / GLM Coding Plan](/de/providers/glm).
</Warning>

OpenClaw stellt außerdem das Anthropic-Setup-Token als unterstützten Token-Authentifizierungspfad bereit, bevorzugt jetzt aber die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.

## Migration der Anthropic Claude CLI

OpenClaw unterstützt die Wiederverwendung der Anthropic Claude CLI wieder. Wenn Sie bereits einen lokalen
Claude-Login auf dem Host haben, kann das Onboarding bzw. die Konfiguration diesen direkt wiederverwenden.

## OAuth-Austausch (wie der Login funktioniert)

OpenClaws interaktive Login-Abläufe sind in `@mariozechner/pi-ai` implementiert und in die Assistenten/Befehle eingebunden.

### Anthropic-Setup-Token

Ablauf:

1. Anthropic-Setup-Token oder Paste-Token aus OpenClaw starten
2. OpenClaw speichert die resultierende Anthropic-Anmeldeinformation in einem Auth-Profil
3. die Modellauswahl bleibt bei `anthropic/...`
4. vorhandene Anthropic-Auth-Profile bleiben für Rollback/Reihenfolgenkontrolle verfügbar

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth wird ausdrücklich für die Nutzung außerhalb der Codex CLI unterstützt, einschließlich OpenClaw-Workflows.

Ablauf (PKCE):

1. PKCE-Verifier/Challenge + zufälligen `state` generieren
2. `https://auth.openai.com/oauth/authorize?...` öffnen
3. versuchen, den Callback auf `http://127.0.0.1:1455/auth/callback` zu erfassen
4. wenn der Callback nicht gebunden werden kann (oder Sie remote/headless sind), die Redirect-URL bzw. den Code einfügen
5. Austausch bei `https://auth.openai.com/oauth/token`
6. `accountId` aus dem Access-Token extrahieren und `{ access, refresh, expires, accountId }` speichern

Der Assistentenpfad ist `openclaw onboard` → Auth-Auswahl `openai-codex`.

## Refresh + Ablauf

Profile speichern einen `expires`-Zeitstempel.

Zur Laufzeit:

- wenn `expires` in der Zukunft liegt → den gespeicherten Access-Token verwenden
- wenn abgelaufen → aktualisieren (unter einer Dateisperre) und die gespeicherten Anmeldedaten überschreiben
- Ausnahme: wiederverwendete Anmeldedaten externer CLI bleiben extern verwaltet; OpenClaw
  liest den CLI-Auth-Speicher erneut und verwendet den kopierten Refresh-Token nie selbst

Der Refresh-Ablauf erfolgt automatisch; normalerweise müssen Sie Tokens nicht manuell verwalten.

## Mehrere Konten (Profile) + Routing

Zwei Muster:

### 1) Bevorzugt: separate Agents

Wenn „privat“ und „beruflich“ nie miteinander interagieren sollen, verwenden Sie isolierte Agents (separate Sitzungen + Anmeldedaten + Workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

Konfigurieren Sie dann die Authentifizierung pro Agent (Assistent) und leiten Sie Chats an den richtigen Agent weiter.

### 2) Fortgeschritten: mehrere Profile in einem Agent

`auth-profiles.json` unterstützt mehrere Profil-IDs für denselben Anbieter.

Wählen Sie aus, welches Profil verwendet wird:

- global über die Konfigurationsreihenfolge (`auth.order`)
- pro Sitzung über `/model ...@<profileId>`

Beispiel (Sitzungsüberschreibung):

- `/model Opus@anthropic:work`

So sehen Sie, welche Profil-IDs vorhanden sind:

- `openclaw channels list --json` (zeigt `auth[]`)

Zugehörige Dokumentation:

- [/concepts/model-failover](/de/concepts/model-failover) (Rotations- + Cooldown-Regeln)
- [/tools/slash-commands](/de/tools/slash-commands) (Befehlsoberfläche)

## Verwandt

- [Authentication](/de/gateway/authentication) — Überblick über die Authentifizierung von Modellanbietern
- [Secrets](/de/gateway/secrets) — Speicherung von Anmeldedaten und SecretRef
- [Configuration Reference](/de/gateway/configuration-reference#auth-storage) — Auth-Konfigurationsschlüssel
