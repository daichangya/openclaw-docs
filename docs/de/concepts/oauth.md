---
read_when:
    - Sie möchten OAuth in OpenClaw Ende-zu-Ende verstehen.
    - Sie sind auf Probleme mit Token-Invalidierung oder Logout gestoßen.
    - Sie möchten Authentifizierungsabläufe für Claude CLI oder OAuth.
    - Sie möchten mehrere Konten oder Profil-Routing.
summary: 'OAuth in OpenClaw: Token-Austausch, Speicherung und Muster für mehrere Konten'
title: OAuth
x-i18n:
    generated_at: "2026-04-24T06:34:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81b8891850123c32a066dbfb855feb132bc1f2bbc694f10ee2797b694bd5d848
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw unterstützt per OAuth „subscription auth“ für Provider, die dies anbieten
(insbesondere **OpenAI Codex (ChatGPT OAuth)**). Für Anthropic gilt praktisch
nun folgende Aufteilung:

- **Anthropic API key**: normale Abrechnung über die Anthropic API
- **Anthropic Claude CLI / subscription auth innerhalb von OpenClaw**: Anthropic-Mitarbeiter
  haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist

OpenAI Codex OAuth wird ausdrücklich für die Nutzung in externen Tools wie
OpenClaw unterstützt. Diese Seite erklärt:

Für Anthropic ist in Produktion die Authentifizierung per API key der sicherere empfohlene Pfad.

- wie der OAuth-**Token-Austausch** funktioniert (PKCE)
- wo Tokens **gespeichert** werden (und warum)
- wie mehrere **Konten** behandelt werden (Profile + Überschreibungen pro Sitzung)

OpenClaw unterstützt außerdem **Provider-Plugins**, die eigene OAuth- oder API‑Key-
Abläufe mitbringen. Führen Sie sie aus mit:

```bash
openclaw models auth login --provider <id>
```

## Der Token-Sink (warum er existiert)

OAuth-Provider geben häufig während Login-/Refresh-Abläufen ein **neues Refresh-Token** aus. Manche Provider (oder OAuth-Clients) können ältere Refresh-Tokens ungültig machen, wenn ein neues für denselben Benutzer/dieselbe App ausgegeben wird.

Praktisches Symptom:

- Sie melden sich über OpenClaw _und_ über Claude Code / Codex CLI an → eines von beiden wird später zufällig „abgemeldet“

Um das zu reduzieren, behandelt OpenClaw `auth-profiles.json` als **Token-Sink**:

- die Runtime liest Zugangsdaten aus **einem Ort**
- wir können mehrere Profile behalten und sie deterministisch routen
- wenn Zugangsdaten aus einer externen CLI wie Codex CLI wiederverwendet werden, spiegelt OpenClaw
  sie mit Provenienz und liest diese externe Quelle erneut ein, statt
  das Refresh-Token selbst zu rotieren

## Speicherung (wo Tokens liegen)

Secrets werden **pro Agent** gespeichert:

- Auth-Profile (OAuth + API keys + optionale Refs auf Wertebene): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy-Kompatibilitätsdatei: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statische `api_key`-Einträge werden bei Auffinden bereinigt)

Legacy-Datei nur für Import (weiterhin unterstützt, aber nicht der Hauptspeicher):

- `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in `auth-profiles.json` importiert)

Alle oben genannten Pfade berücksichtigen außerdem `$OPENCLAW_STATE_DIR` (Überschreibung des Statusverzeichnisses). Vollständige Referenz: [/gateway/configuration](/de/gateway/configuration-reference#auth-storage)

Für statische SecretRefs und das Aktivierungsverhalten des Runtime-Snapshots siehe [Secrets Management](/de/gateway/secrets).

## Kompatibilität mit alten Anthropic-Tokens

<Warning>
In der öffentlichen Claude-Code-Dokumentation von Anthropic heißt es, dass die direkte Nutzung von Claude Code innerhalb
der Abo-Grenzen von Claude bleibt, und Anthropic-Mitarbeiter haben uns mitgeteilt, dass die Nutzung von Claude
CLI im Stil von OpenClaw wieder erlaubt ist. OpenClaw behandelt daher die Wiederverwendung von Claude CLI und
die Nutzung von `claude -p` als für diese Integration genehmigt, solange Anthropic
keine neue Richtlinie veröffentlicht.

Die aktuellen Dokumente von Anthropic zu direkten Claude-Code-Plänen finden Sie unter [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
und [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Wenn Sie andere Abo-ähnliche Optionen in OpenClaw möchten, siehe [OpenAI
Codex](/de/providers/openai), [Qwen Cloud Coding
Plan](/de/providers/qwen), [MiniMax Coding Plan](/de/providers/minimax),
und [Z.AI / GLM Coding Plan](/de/providers/glm).
</Warning>

OpenClaw bietet außerdem Anthropic-Setup-Token als unterstützten Pfad für Token-Authentifizierung an, bevorzugt jetzt jedoch die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.

## Migration für Anthropic Claude CLI

OpenClaw unterstützt wieder die Wiederverwendung von Anthropic Claude CLI. Wenn Sie bereits ein lokales
Claude-Login auf dem Host haben, kann Onboarding/Configure es direkt wiederverwenden.

## OAuth-Austausch (wie Login funktioniert)

Die interaktiven Login-Abläufe von OpenClaw sind in `@mariozechner/pi-ai` implementiert und in die Assistenten/Befehle eingebunden.

### Anthropic-Setup-Token

Ablauf:

1. Anthropic-Setup-Token oder Paste-Token aus OpenClaw starten
2. OpenClaw speichert die resultierenden Anthropic-Zugangsdaten in einem Auth-Profil
3. die Modellauswahl bleibt bei `anthropic/...`
4. vorhandene Anthropic-Auth-Profile bleiben für Rollback/Reihenfolgensteuerung verfügbar

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth wird ausdrücklich für die Nutzung außerhalb der Codex CLI unterstützt, auch in OpenClaw-Workflows.

Ablauf (PKCE):

1. PKCE-Verifier/Challenge + zufälligen `state` generieren
2. `https://auth.openai.com/oauth/authorize?...` öffnen
3. versuchen, den Callback unter `http://127.0.0.1:1455/auth/callback` zu erfassen
4. wenn der Callback nicht gebunden werden kann (oder Sie remote/headless sind), die Redirect-URL/den Code einfügen
5. Austausch unter `https://auth.openai.com/oauth/token`
6. `accountId` aus dem Access-Token extrahieren und `{ access, refresh, expires, accountId }` speichern

Der Assistentenpfad ist `openclaw onboard` → Auth-Auswahl `openai-codex`.

## Refresh + Ablauf

Profile speichern einen Zeitstempel `expires`.

Zur Laufzeit:

- wenn `expires` in der Zukunft liegt → das gespeicherte Access-Token verwenden
- wenn abgelaufen → refreshen (unter einer Dateisperre) und die gespeicherten Zugangsdaten überschreiben
- Ausnahme: wiederverwendete Zugangsdaten externer CLI bleiben extern verwaltet; OpenClaw
  liest den CLI-Auth-Store erneut ein und verbraucht das kopierte Refresh-Token niemals selbst

Der Refresh-Ablauf erfolgt automatisch; Sie müssen Tokens normalerweise nicht manuell verwalten.

## Mehrere Konten (Profile) + Routing

Zwei Muster:

### 1) Bevorzugt: separate Agenten

Wenn „persönlich“ und „Arbeit“ niemals miteinander interagieren sollen, verwenden Sie isolierte Agenten (separate Sitzungen + Zugangsdaten + Workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

Konfigurieren Sie dann die Authentifizierung pro Agent (Assistent) und routen Sie Chats an den richtigen Agenten.

### 2) Fortgeschritten: mehrere Profile in einem Agenten

`auth-profiles.json` unterstützt mehrere Profil-IDs für denselben Provider.

So wählen Sie aus, welches Profil verwendet wird:

- global über die Konfigurationsreihenfolge (`auth.order`)
- pro Sitzung über `/model ...@<profileId>`

Beispiel (Sitzungsüberschreibung):

- `/model Opus@anthropic:work`

So sehen Sie, welche Profil-IDs vorhanden sind:

- `openclaw channels list --json` (zeigt `auth[]`)

Verwandte Dokumentation:

- [/concepts/model-failover](/de/concepts/model-failover) (Regeln für Rotation + Cooldown)
- [/tools/slash-commands](/de/tools/slash-commands) (Befehlsoberfläche)

## Verwandt

- [Authentication](/de/gateway/authentication) — Überblick über die Authentifizierung von Modell-Providern
- [Secrets](/de/gateway/secrets) — Speicherung von Zugangsdaten und SecretRef
- [Configuration Reference](/de/gateway/configuration-reference#auth-storage) — Auth-Konfigurationsschlüssel
