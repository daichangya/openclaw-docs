---
read_when:
    - Sie OpenClaw OAuth von Anfang bis Ende verstehen möchten
    - Sie auf Probleme mit Token-Invalidierung / Logout stoßen
    - Sie Auth-Flows für Claude CLI oder OAuth möchten
    - Sie mehrere Konten oder Profil-Routing möchten
summary: 'OAuth in OpenClaw: Token-Austausch, Speicherung und Muster für mehrere Konten'
title: OAuth
x-i18n:
    generated_at: "2026-04-05T12:40:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b364be2182fcf9082834450f39aecc0913c85fb03237eec1228a589d4851dcd
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw unterstützt „Subscription Auth“ über OAuth für Provider, die dies anbieten
(insbesondere **OpenAI Codex (ChatGPT OAuth)**). Für Anthropic-Abonnements sollte die neue
Einrichtung in Produktion den lokalen Login-Pfad über **Claude CLI** auf dem Gateway-Host verwenden,
aber Anthropic unterscheidet zwischen direkter Claude-Code-Nutzung und dem Wiederverwendungspfad von OpenClaw.
In der öffentlichen Claude-Code-Dokumentation von Anthropic steht, dass die direkte Nutzung von Claude Code
innerhalb der Grenzen des Claude-Abonnements bleibt. Separat informierte Anthropic OpenClaw-
Benutzer am **4. April 2026 um 12:00 PM PT / 8:00 PM BST**, dass OpenClaw als
Harness eines Drittanbieters zählt und für diesen Datenverkehr jetzt **Extra Usage**
erfordert. OpenAI Codex OAuth wird ausdrücklich für die Nutzung in externen Tools wie
OpenClaw unterstützt. Diese Seite erklärt:

Für Anthropic in Produktion ist die Authentifizierung per API-Schlüssel der sicherere empfohlene Pfad.

- wie der OAuth-**Token-Austausch** funktioniert (PKCE)
- wo Tokens **gespeichert** werden (und warum)
- wie man mit **mehreren Konten** umgeht (Profile + Überschreibungen pro Sitzung)

OpenClaw unterstützt auch **Provider-Plugins**, die ihre eigenen OAuth- oder API-Key-
Flows mitliefern. Führen Sie diese aus mit:

```bash
openclaw models auth login --provider <id>
```

## Die Token-Senke (warum es sie gibt)

OAuth-Provider geben bei Login-/Refresh-Flows häufig ein **neues Refresh-Token** aus. Einige Provider (oder OAuth-Clients) können ältere Refresh-Tokens ungültig machen, wenn ein neues für denselben Benutzer bzw. dieselbe App ausgegeben wird.

Praktisches Symptom:

- Sie melden sich bei OpenClaw _und_ bei Claude Code / Codex CLI an → eines von beiden wird später zufällig „abgemeldet“

Um das zu verringern, behandelt OpenClaw `auth-profiles.json` als **Token-Senke**:

- die Laufzeit liest Anmeldedaten aus **einem Ort**
- wir können mehrere Profile behalten und sie deterministisch routen
- wenn Anmeldedaten aus einer externen CLI wie Codex CLI wiederverwendet werden, spiegelt OpenClaw
  sie mit Herkunftsinformationen und liest diese externe Quelle erneut, anstatt
  das Refresh-Token selbst zu rotieren

## Speicherung (wo Tokens liegen)

Geheimnisse werden **pro Agent** gespeichert:

- Auth-Profile (OAuth + API-Schlüssel + optionale Referenzen auf Wertebene): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Datei für ältere Kompatibilität: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statische `api_key`-Einträge werden beim Auffinden bereinigt)

Veraltete Datei nur für den Import (weiterhin unterstützt, aber nicht der Hauptspeicher):

- `~/.openclaw/credentials/oauth.json` (wird bei der ersten Verwendung in `auth-profiles.json` importiert)

Alles oben Genannte berücksichtigt auch `$OPENCLAW_STATE_DIR` (Überschreibung des Statusverzeichnisses). Vollständige Referenz: [/gateway/configuration](/gateway/configuration-reference#auth-storage)

Für statische SecretRefs und das Aktivierungsverhalten von Laufzeit-Snapshots siehe [Secrets Management](/gateway/secrets).

## Kompatibilität mit veralteten Anthropic-Tokens

<Warning>
In der öffentlichen Claude-Code-Dokumentation von Anthropic steht, dass die direkte Nutzung
von Claude Code innerhalb der Grenzen des Claude-Abonnements bleibt. Separat teilte Anthropic OpenClaw-Benutzern am
**4. April 2026 um 12:00 PM PT / 8:00 PM BST** mit, dass **OpenClaw als
Harness eines Drittanbieters zählt**. Bestehende Anthropic-Token-Profile bleiben in OpenClaw technisch
weiterhin nutzbar, aber laut Anthropic erfordert der OpenClaw-Pfad jetzt **Extra
Usage** (nutzungsabhängige Abrechnung, getrennt vom Abonnement) für diesen Datenverkehr.

Informationen zu den aktuellen Tarifdokumenten von Anthropic für die direkte Claude-Code-Nutzung finden Sie unter [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
und [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Wenn Sie andere abonnementähnliche Optionen in OpenClaw möchten, siehe [OpenAI
Codex](/providers/openai), [Qwen Cloud Coding
Plan](/providers/qwen), [MiniMax Coding Plan](/providers/minimax),
und [Z.AI / GLM Coding Plan](/providers/glm).
</Warning>

OpenClaw stellt die Anthropic-Setup-Token-Einrichtung jetzt wieder als veralteten/manuellen Pfad bereit.
Der Anthropic-spezifische Hinweis zur Abrechnung für OpenClaw gilt weiterhin für diesen Pfad, daher
verwenden Sie ihn in der Erwartung, dass Anthropic für
Claude-Login-Datenverkehr, der durch OpenClaw gesteuert wird, **Extra Usage** verlangt.

## Migration zu Anthropic Claude CLI

Wenn Claude CLI bereits auf dem Gateway-Host installiert und angemeldet ist, können Sie
die Modellauswahl für Anthropic auf das lokale CLI-Backend umstellen. Dies ist ein
unterstützter OpenClaw-Pfad, wenn Sie einen lokalen Claude-CLI-Login auf demselben
Host wiederverwenden möchten.

Voraussetzungen:

- die Binärdatei `claude` ist auf dem Gateway-Host installiert
- Claude CLI ist dort bereits über `claude auth login` authentifiziert

Migrationsbefehl:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Onboarding-Abkürzung:

```bash
openclaw onboard --auth-choice anthropic-cli
```

Dadurch bleiben bestehende Anthropic-Auth-Profile für ein Rollback erhalten, aber der wichtigste
Standardmodellpfad wird von `anthropic/...` auf `claude-cli/...` umgeschrieben, passende
Anthropic-Claude-Fallbacks werden umgeschrieben, und passende `claude-cli/...`-Allowlist-
Einträge unter `agents.defaults.models` werden hinzugefügt.

Prüfen:

```bash
openclaw models status
```

## OAuth-Austausch (wie der Login funktioniert)

Die interaktiven Login-Flows von OpenClaw sind in `@mariozechner/pi-ai` implementiert und in die Assistenten/Befehle eingebunden.

### Anthropic Claude CLI

Form des Ablaufs:

Claude-CLI-Pfad:

1. mit `claude auth login` auf dem Gateway-Host anmelden
2. `openclaw models auth login --provider anthropic --method cli --set-default` ausführen
3. kein neues Auth-Profil speichern; stattdessen die Modellauswahl auf `claude-cli/...` umstellen
4. bestehende Anthropic-Auth-Profile für ein Rollback beibehalten

Die öffentliche Claude-Code-Dokumentation von Anthropic beschreibt diesen direkten Claude-Subscription-
Login-Flow für `claude` selbst. OpenClaw kann diesen lokalen Login wiederverwenden, aber
Anthropic stuft den von OpenClaw gesteuerten Pfad für Abrechnungszwecke separat als Drittanbieter-Harness ein.

Pfad über den interaktiven Assistenten:

- `openclaw onboard` / `openclaw configure` → Auth-Auswahl `anthropic-cli`

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth wird ausdrücklich für die Nutzung außerhalb der Codex CLI unterstützt, einschließlich OpenClaw-Workflows.

Form des Ablaufs (PKCE):

1. PKCE-Verifier/-Challenge + zufälligen `state` generieren
2. `https://auth.openai.com/oauth/authorize?...` öffnen
3. versuchen, den Callback auf `http://127.0.0.1:1455/auth/callback` zu erfassen
4. wenn der Callback nicht gebunden werden kann (oder Sie remote/headless arbeiten), die Weiterleitungs-URL bzw. den Code einfügen
5. den Austausch bei `https://auth.openai.com/oauth/token` durchführen
6. `accountId` aus dem Access-Token extrahieren und `{ access, refresh, expires, accountId }` speichern

Der Pfad im Assistenten ist `openclaw onboard` → Auth-Auswahl `openai-codex`.

## Refresh + Ablauf

Profile speichern einen Zeitstempel `expires`.

Zur Laufzeit:

- wenn `expires` in der Zukunft liegt → gespeichertes Access-Token verwenden
- wenn abgelaufen → aktualisieren (unter einer Dateisperre) und die gespeicherten Anmeldedaten überschreiben
- Ausnahme: wiederverwendete Anmeldedaten externer CLIs bleiben extern verwaltet; OpenClaw
  liest den Auth-Speicher der CLI erneut und verwendet das kopierte Refresh-Token niemals selbst

Der Refresh-Flow ist automatisch; normalerweise müssen Sie Tokens nicht manuell verwalten.

## Mehrere Konten (Profile) + Routing

Zwei Muster:

### 1) Bevorzugt: separate Agenten

Wenn „persönlich“ und „Arbeit“ niemals miteinander interagieren sollen, verwenden Sie isolierte Agenten (separate Sitzungen + Anmeldedaten + Workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

Konfigurieren Sie dann die Authentifizierung pro Agent (Assistent) und routen Sie Chats an den richtigen Agenten.

### 2) Fortgeschritten: mehrere Profile in einem Agenten

`auth-profiles.json` unterstützt mehrere Profil-IDs für denselben Provider.

So wählen Sie aus, welches Profil verwendet wird:

- global über die Reihenfolge in der Konfiguration (`auth.order`)
- pro Sitzung über `/model ...@<profileId>`

Beispiel (Überschreibung pro Sitzung):

- `/model Opus@anthropic:work`

So sehen Sie, welche Profil-IDs vorhanden sind:

- `openclaw channels list --json` (zeigt `auth[]`)

Verwandte Dokumentation:

- [/concepts/model-failover](/concepts/model-failover) (Rotation + Cooldown-Regeln)
- [/tools/slash-commands](/tools/slash-commands) (Befehlsoberfläche)

## Verwandt

- [Authentifizierung](/gateway/authentication) — Überblick über die Authentifizierung von Modell-Providern
- [Secrets](/gateway/secrets) — Speicherung von Anmeldedaten und SecretRef
- [Konfigurationsreferenz](/gateway/configuration-reference#auth-storage) — Auth-Konfigurationsschlüssel
