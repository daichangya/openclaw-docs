---
read_when:
    - Einen neuen Rechner einrichten
    - Sie möchten „das Neueste und Beste“, ohne Ihre persönliche Einrichtung zu beschädigen
summary: Erweiterte Einrichtungs- und Entwicklungs-Workflows für OpenClaw
title: Einrichtung
x-i18n:
    generated_at: "2026-04-05T12:56:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: be4e280dde7f3a224345ca557ef2fb35a9c9db8520454ff63794ac6f8d4e71e7
    source_path: start/setup.md
    workflow: 15
---

# Einrichtung

<Note>
Wenn Sie OpenClaw zum ersten Mal einrichten, beginnen Sie mit [Erste Schritte](/de/start/getting-started).
Details zum Onboarding finden Sie unter [Onboarding (CLI)](/de/start/wizard).
</Note>

## Kurzfassung

- **Anpassungen leben außerhalb des Repos:** `~/.openclaw/workspace` (Arbeitsbereich) + `~/.openclaw/openclaw.json` (Konfiguration).
- **Stabiler Workflow:** Installieren Sie die macOS-App und lassen Sie sie das gebündelte Gateway ausführen.
- **Workflow mit neuester Entwicklung:** Führen Sie das Gateway selbst über `pnpm gateway:watch` aus und lassen Sie dann die macOS-App im lokalen Modus eine Verbindung herstellen.

## Voraussetzungen (aus dem Quellcode)

- Node 24 empfohlen (Node 22 LTS, derzeit `22.14+`, wird weiterhin unterstützt)
- `pnpm` bevorzugt (oder Bun, wenn Sie bewusst den [Bun-Workflow](/de/install/bun) verwenden)
- Docker (optional; nur für containerisierte Einrichtung/E2E — siehe [Docker](/de/install/docker))

## Anpassungsstrategie (damit Updates nicht schaden)

Wenn Sie „zu 100 % auf mich zugeschnitten“ _und_ einfache Updates möchten, halten Sie Ihre Anpassungen hier:

- **Konfiguration:** `~/.openclaw/openclaw.json` (JSON/JSON5-artig)
- **Arbeitsbereich:** `~/.openclaw/workspace` (Skills, Prompts, Memories; machen Sie ihn zu einem privaten Git-Repo)

Einmalig bootstrapen:

```bash
openclaw setup
```

Verwenden Sie innerhalb dieses Repos den lokalen CLI-Einstiegspunkt:

```bash
openclaw setup
```

Wenn Sie noch keine globale Installation haben, führen Sie es über `pnpm openclaw setup` aus (oder `bun run openclaw setup`, wenn Sie den Bun-Workflow verwenden).

## Das Gateway aus diesem Repo ausführen

Nach `pnpm build` können Sie die paketierte CLI direkt ausführen:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabiler Workflow (macOS-App zuerst)

1. Installieren und starten Sie **OpenClaw.app** (Menüleiste).
2. Schließen Sie die Checkliste für Onboarding/Berechtigungen ab (TCC-Abfragen).
3. Stellen Sie sicher, dass das Gateway auf **Lokal** steht und läuft (die App verwaltet es).
4. Verbinden Sie Oberflächen (Beispiel: WhatsApp):

```bash
openclaw channels login
```

5. Schnelltest:

```bash
openclaw health
```

Wenn Onboarding in Ihrem Build nicht verfügbar ist:

- Führen Sie `openclaw setup` aus, dann `openclaw channels login`, und starten Sie anschließend das Gateway manuell (`openclaw gateway`).

## Workflow mit neuester Entwicklung (Gateway in einem Terminal)

Ziel: Am TypeScript-Gateway arbeiten, Hot Reload bekommen und die UI der macOS-App verbunden halten.

### 0) (Optional) Die macOS-App ebenfalls aus dem Quellcode ausführen

Wenn Sie auch die macOS-App auf dem neuesten Entwicklungsstand haben möchten:

```bash
./scripts/restart-mac.sh
```

### 1) Das Entwicklungs-Gateway starten

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch` führt das Gateway im Watch-Modus aus und lädt es bei relevanten Änderungen an Quellcode,
Konfiguration und Metadaten gebündelter Plugins neu.

Wenn Sie bewusst den Bun-Workflow verwenden, lauten die entsprechenden Befehle:

```bash
bun install
bun run gateway:watch
```

### 2) Die macOS-App auf Ihr laufendes Gateway zeigen lassen

In **OpenClaw.app**:

- Verbindungsmodus: **Lokal**
  Die App verbindet sich mit dem laufenden Gateway auf dem konfigurierten Port.

### 3) Verifizieren

- Der Gateway-Status in der App sollte **„Using existing gateway …“** anzeigen
- Oder per CLI:

```bash
openclaw health
```

### Häufige Stolperfallen

- **Falscher Port:** Gateway WS verwendet standardmäßig `ws://127.0.0.1:18789`; App + CLI müssen denselben Port verwenden.
- **Wo der Status gespeichert wird:**
  - Kanal-/Provider-Status: `~/.openclaw/credentials/`
  - Modell-Authentifizierungsprofile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sitzungen: `~/.openclaw/agents/<agentId>/sessions/`
  - Protokolle: `/tmp/openclaw/`

## Übersicht zur Speicherung von Anmeldedaten

Verwenden Sie dies, wenn Sie Authentifizierung debuggen oder entscheiden möchten, was gesichert werden soll:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-Bot-Token**: Konfiguration/Umgebung oder `channels.telegram.tokenFile` (nur reguläre Datei; Symlinks werden abgelehnt)
- **Discord-Bot-Token**: Konfiguration/Umgebung oder SecretRef (env/file/exec-Provider)
- **Slack-Tokens**: Konfiguration/Umgebung (`channels.slack.*`)
- **Pairing-Allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (Standardkonto)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (Nicht-Standardkonten)
- **Modell-Authentifizierungsprofile**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dateigestützte Secret-Nutzlast (optional)**: `~/.openclaw/secrets.json`
- **Import veralteter OAuth-Daten**: `~/.openclaw/credentials/oauth.json`
  Mehr Details: [Sicherheit](/de/gateway/security#credential-storage-map).

## Aktualisieren (ohne Ihre Einrichtung zu zerstören)

- Behalten Sie `~/.openclaw/workspace` und `~/.openclaw/` als „Ihre Sachen“ bei; legen Sie keine persönlichen Prompts/Konfigurationen in das `openclaw`-Repo.
- Quellcode aktualisieren: `git pull` + der Installationsschritt Ihres gewählten Paketmanagers (`pnpm install` standardmäßig; `bun install` für den Bun-Workflow) + weiterhin den passenden `gateway:watch`-Befehl verwenden.

## Linux (systemd-Benutzerdienst)

Linux-Installationen verwenden einen systemd-**Benutzerdienst**. Standardmäßig stoppt systemd Benutzerdienste
bei Abmeldung/Inaktivität, wodurch das Gateway beendet wird. Das Onboarding versucht,
Lingering für Sie zu aktivieren (möglicherweise mit sudo-Abfrage). Wenn es immer noch deaktiviert ist, führen Sie aus:

```bash
sudo loginctl enable-linger $USER
```

Für Always-on- oder Multi-User-Server sollten Sie statt eines
Benutzerdienstes einen **Systemdienst** in Betracht ziehen (kein Lingering erforderlich). Siehe [Gateway-Runbook](/de/gateway) für die systemd-Hinweise.

## Verwandte Dokumentation

- [Gateway-Runbook](/de/gateway) (Flags, Supervision, Ports)
- [Gateway-Konfiguration](/de/gateway/configuration) (Konfigurationsschema + Beispiele)
- [Discord](/de/channels/discord) und [Telegram](/de/channels/telegram) (Antwort-Tags + `replyToMode`-Einstellungen)
- [Einrichtung des OpenClaw-Assistenten](/start/openclaw)
- [macOS-App](/platforms/macos) (Gateway-Lebenszyklus)
