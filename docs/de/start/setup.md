---
read_when:
    - Einen neuen Rechner einrichten
    - Du möchtest „latest + greatest“, ohne dein persönliches Setup zu beschädigen.
summary: Erweiterte Einrichtung und Entwicklungsabläufe für OpenClaw
title: Einrichtung
x-i18n:
    generated_at: "2026-04-20T06:30:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 773cdbef5f38b069303b5e13fca5fcdc28f082746869f17b8b92aab1610b95a8
    source_path: start/setup.md
    workflow: 15
---

# Einrichtung

<Note>
Wenn du OpenClaw zum ersten Mal einrichtest, beginne mit [Getting Started](/de/start/getting-started).
Details zum Onboarding findest du unter [Onboarding (CLI)](/de/start/wizard).
</Note>

## Kurzfassung

- **Anpassungen liegen außerhalb des Repositorys:** `~/.openclaw/workspace` (Workspace) + `~/.openclaw/openclaw.json` (Konfiguration).
- **Stabiler Workflow:** Installiere die macOS-App und lass sie das gebündelte Gateway ausführen.
- **Bleeding-Edge-Workflow:** Führe das Gateway selbst über `pnpm gateway:watch` aus und lasse dann die macOS-App im lokalen Modus eine Verbindung herstellen.

## Voraussetzungen (aus dem Quellcode)

- Node 24 empfohlen (Node 22 LTS, derzeit `22.14+`, wird weiterhin unterstützt)
- `pnpm` bevorzugt (oder Bun, wenn du bewusst den [Bun-Workflow](/de/install/bun) verwendest)
- Docker (optional; nur für containerisierte Einrichtung/E2E — siehe [Docker](/de/install/docker))

## Strategie für Anpassungen (damit Updates nicht schaden)

Wenn du „100 % auf mich zugeschnitten“ _und_ einfache Updates möchtest, behalte deine Anpassungen in:

- **Konfiguration:** `~/.openclaw/openclaw.json` (JSON/JSON5-ähnlich)
- **Workspace:** `~/.openclaw/workspace` (Skills, Prompts, Memories; richte ihn als privates Git-Repository ein)

Einmalig initialisieren:

```bash
openclaw setup
```

Verwende innerhalb dieses Repositorys den lokalen CLI-Einstiegspunkt:

```bash
openclaw setup
```

Wenn du noch keine globale Installation hast, führe es über `pnpm openclaw setup` aus (oder `bun run openclaw setup`, wenn du den Bun-Workflow verwendest).

## Das Gateway aus diesem Repository ausführen

Nach `pnpm build` kannst du die paketierte CLI direkt ausführen:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabiler Workflow (macOS-App zuerst)

1. Installiere und starte **OpenClaw.app** (Menüleiste).
2. Schließe die Checkliste für Onboarding/Berechtigungen ab (TCC-Aufforderungen).
3. Stelle sicher, dass Gateway auf **Local** gesetzt ist und läuft (die App verwaltet es).
4. Verknüpfe Oberflächen/Kanäle (Beispiel: WhatsApp):

```bash
openclaw channels login
```

5. Kurz prüfen:

```bash
openclaw health
```

Wenn Onboarding in deinem Build nicht verfügbar ist:

- Führe `openclaw setup` aus, dann `openclaw channels login`, und starte anschließend das Gateway manuell (`openclaw gateway`).

## Bleeding-Edge-Workflow (Gateway in einem Terminal)

Ziel: am TypeScript-Gateway arbeiten, Hot-Reload erhalten und die UI der macOS-App verbunden lassen.

### 0) (Optional) Auch die macOS-App aus dem Quellcode ausführen

Wenn du auch bei der macOS-App auf dem neuesten Stand sein möchtest:

```bash
./scripts/restart-mac.sh
```

### 1) Das Entwicklungs-Gateway starten

```bash
pnpm install
# Nur beim ersten Ausführen (oder nach dem Zurücksetzen der lokalen OpenClaw-Konfiguration/des Workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` führt das Gateway im Watch-Modus aus und lädt es bei relevanten Änderungen am Quellcode,
an der Konfiguration und an Metadaten gebündelter Plugins neu.
`pnpm openclaw setup` ist der einmalige Schritt zur Initialisierung der lokalen Konfiguration/des Workspace für einen frischen Checkout.
`pnpm gateway:watch` baut `dist/control-ui` nicht neu, also führe nach Änderungen an `ui/` erneut `pnpm ui:build` aus oder verwende `pnpm ui:dev`, während du an der Control UI arbeitest.

Wenn du bewusst den Bun-Workflow verwendest, sind die entsprechenden Befehle:

```bash
bun install
# Nur beim ersten Ausführen (oder nach dem Zurücksetzen der lokalen OpenClaw-Konfiguration/des Workspace)
bun run openclaw setup
bun run gateway:watch
```

### 2) Die macOS-App auf dein laufendes Gateway verweisen

In **OpenClaw.app**:

- Verbindungsmodus: **Local**
  Die App verbindet sich mit dem laufenden Gateway auf dem konfigurierten Port.

### 3) Überprüfen

- Der Gateway-Status in der App sollte **„Using existing gateway …“** anzeigen
- Oder per CLI:

```bash
openclaw health
```

### Häufige Stolperfallen

- **Falscher Port:** Gateway-WS verwendet standardmäßig `ws://127.0.0.1:18789`; App und CLI müssen denselben Port verwenden.
- **Wo der Status gespeichert wird:**
  - Kanal-/Provider-Status: `~/.openclaw/credentials/`
  - Modell-Authentifizierungsprofile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sitzungen: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Übersicht der Anmeldedatenspeicherung

Nutze dies beim Debuggen der Authentifizierung oder wenn du entscheidest, was gesichert werden soll:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-Bot-Token**: Konfiguration/Umgebungsvariable oder `channels.telegram.tokenFile` (nur reguläre Datei; Symlinks werden abgelehnt)
- **Discord-Bot-Token**: Konfiguration/Umgebungsvariable oder SecretRef (Provider für env/file/exec)
- **Slack-Tokens**: Konfiguration/Umgebungsvariable (`channels.slack.*`)
- **Kopplungs-Positivlisten**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (Standardkonto)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (nicht standardmäßige Konten)
- **Modell-Authentifizierungsprofile**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dateibasierte Secret-Nutzlast (optional)**: `~/.openclaw/secrets.json`
- **Import von Legacy-OAuth**: `~/.openclaw/credentials/oauth.json`
  Weitere Details: [Security](/de/gateway/security#credential-storage-map).

## Aktualisieren (ohne dein Setup zu ruinieren)

- Behalte `~/.openclaw/workspace` und `~/.openclaw/` als „deine Sachen“ bei; speichere persönliche Prompts/Konfigurationen nicht im `openclaw`-Repository.
- Quellcode aktualisieren: `git pull` + der von dir gewählte Installationsschritt des Paketmanagers (`pnpm install` standardmäßig; `bun install` für den Bun-Workflow) + verwende weiterhin den passenden `gateway:watch`-Befehl.

## Linux (systemd-Benutzerdienst)

Linux-Installationen verwenden einen systemd-**Benutzerdienst**. Standardmäßig beendet systemd Benutzerdienste bei
Abmeldung/Inaktivität, wodurch das Gateway beendet wird. Das Onboarding versucht,
Lingering für dich zu aktivieren (möglicherweise mit sudo-Aufforderung). Wenn es weiterhin deaktiviert ist, führe aus:

```bash
sudo loginctl enable-linger $USER
```

Für immer aktive oder Mehrbenutzer-Server solltest du statt eines
Benutzerdiensts einen **Systemdienst** in Betracht ziehen (kein Lingering erforderlich). Siehe [Gateway runbook](/de/gateway) für Hinweise zu systemd.

## Verwandte Dokumentation

- [Gateway runbook](/de/gateway) (Flags, Überwachung, Ports)
- [Gateway configuration](/de/gateway/configuration) (Konfigurationsschema + Beispiele)
- [Discord](/de/channels/discord) und [Telegram](/de/channels/telegram) (Antwort-Tags + `replyToMode`-Einstellungen)
- [OpenClaw assistant setup](/de/start/openclaw)
- [macOS app](/de/platforms/macos) (Gateway-Lebenszyklus)
