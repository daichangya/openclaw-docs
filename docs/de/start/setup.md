---
read_when:
    - Einen neuen Rechner einrichten
    - Sie möchten „das Neueste und Beste“, ohne Ihr persönliches Setup zu zerstören
summary: Erweiterte Einrichtungs- und Entwicklungs-Workflows für OpenClaw
title: Einrichtung
x-i18n:
    generated_at: "2026-04-24T07:00:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4a965f39a14697a677c89ccadeb2b11b10c8e704e81e00619fffd5abe2ebc83
    source_path: start/setup.md
    workflow: 15
---

<Note>
Wenn Sie OpenClaw zum ersten Mal einrichten, beginnen Sie mit [Getting Started](/de/start/getting-started).
Details zum Onboarding finden Sie unter [Onboarding (CLI)](/de/start/wizard).
</Note>

## TL;DR

Wählen Sie einen Einrichtungs-Workflow danach aus, wie oft Sie Updates möchten und ob Sie das Gateway selbst ausführen wollen:

- **Anpassungen leben außerhalb des Repos:** Behalten Sie Ihre Konfiguration und Ihren Workspace in `~/.openclaw/openclaw.json` und `~/.openclaw/workspace/`, damit Repo-Updates sie nicht berühren.
- **Stabiler Workflow (für die meisten empfohlen):** Installieren Sie die macOS-App und lassen Sie sie das gebündelte Gateway ausführen.
- **Bleeding-Edge-Workflow (Dev):** Führen Sie das Gateway selbst über `pnpm gateway:watch` aus und lassen Sie dann die macOS-App im Local-Modus andocken.

## Voraussetzungen (aus dem Quellcode)

- Node 24 empfohlen (Node 22 LTS, derzeit `22.14+`, wird weiterhin unterstützt)
- `pnpm` bevorzugt (oder Bun, wenn Sie bewusst den [Bun-Workflow](/de/install/bun) verwenden)
- Docker (optional; nur für containerisierte Setups/E2E — siehe [Docker](/de/install/docker))

## Strategie für Anpassungen (damit Updates nicht schaden)

Wenn Sie „100 % auf mich zugeschnitten“ _und_ einfache Updates möchten, behalten Sie Ihre Anpassungen in:

- **Konfiguration:** `~/.openclaw/openclaw.json` (JSON/JSON5-artig)
- **Workspace:** `~/.openclaw/workspace` (Skills, Prompts, Memory; machen Sie daraus ein privates Git-Repo)

Einmalig bootstrappen:

```bash
openclaw setup
```

Verwenden Sie innerhalb dieses Repos den lokalen CLI-Einstieg:

```bash
openclaw setup
```

Wenn Sie noch keine globale Installation haben, führen Sie es über `pnpm openclaw setup` aus (oder `bun run openclaw setup`, wenn Sie den Bun-Workflow verwenden).

## Gateway aus diesem Repo ausführen

Nach `pnpm build` können Sie die paketierte CLI direkt ausführen:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Stabiler Workflow (zuerst macOS-App)

1. **OpenClaw.app** installieren und starten (Menüleiste).
2. Die Checkliste für Onboarding/Berechtigungen abschließen (TCC-Prompts).
3. Sicherstellen, dass das Gateway **Local** ist und läuft (die App verwaltet es).
4. Oberflächen verknüpfen (Beispiel: WhatsApp):

```bash
openclaw channels login
```

5. Plausibilitätsprüfung:

```bash
openclaw health
```

Wenn Onboarding in Ihrem Build nicht verfügbar ist:

- Führen Sie `openclaw setup` aus, dann `openclaw channels login`, und starten Sie anschließend das Gateway manuell (`openclaw gateway`).

## Bleeding-Edge-Workflow (Gateway in einem Terminal)

Ziel: am TypeScript-Gateway arbeiten, Hot Reload erhalten und die UI der macOS-App weiter angedockt halten.

### 0) (Optional) Auch die macOS-App aus dem Quellcode ausführen

Wenn Sie auch die macOS-App auf dem neuesten Stand haben möchten:

```bash
./scripts/restart-mac.sh
```

### 1) Das Dev-Gateway starten

```bash
pnpm install
# Nur beim ersten Lauf (oder nach dem Zurücksetzen lokaler OpenClaw-Konfiguration/Workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` führt das Gateway im Watch-Modus aus und lädt bei relevanten Änderungen an Quellcode,
Konfiguration und Metadaten gebündelter Plugins neu.
`pnpm openclaw setup` ist der einmalige lokale Initialisierungsschritt für Konfiguration/Workspace bei einem frischen Checkout.
`pnpm gateway:watch` baut `dist/control-ui` nicht neu, daher führen Sie nach Änderungen an `ui/` erneut `pnpm ui:build` aus oder verwenden Sie `pnpm ui:dev`, während Sie an der Control UI entwickeln.

Wenn Sie bewusst den Bun-Workflow verwenden, lauten die entsprechenden Befehle:

```bash
bun install
# Nur beim ersten Lauf (oder nach dem Zurücksetzen lokaler OpenClaw-Konfiguration/Workspace)
bun run openclaw setup
bun run gateway:watch
```

### 2) Die macOS-App auf Ihr laufendes Gateway zeigen lassen

In **OpenClaw.app**:

- Verbindungsmodus: **Local**
  Die App dockt an das auf dem konfigurierten Port laufende Gateway an.

### 3) Verifizieren

- Der Gateway-Status in der App sollte **„Using existing gateway …“** anzeigen
- Oder per CLI:

```bash
openclaw health
```

### Häufige Stolperfallen

- **Falscher Port:** Gateway-WS ist standardmäßig `ws://127.0.0.1:18789`; halten Sie App + CLI auf demselben Port.
- **Wo der Zustand liegt:**
  - Kanal-/Provider-Zustand: `~/.openclaw/credentials/`
  - Modell-Auth-Profile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sitzungen: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Speicherkarte für Anmeldedaten

Verwenden Sie dies, wenn Sie Auth debuggen oder entscheiden, was gesichert werden soll:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram-Bot-Token**: Konfiguration/Umgebung oder `channels.telegram.tokenFile` (nur reguläre Datei; Symlinks werden abgewiesen)
- **Discord-Bot-Token**: Konfiguration/Umgebung oder SecretRef (Provider env/file/exec)
- **Slack-Tokens**: Konfiguration/Umgebung (`channels.slack.*`)
- **Pairing-Allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (Standardkonto)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (Nicht-Standardkonten)
- **Modell-Auth-Profile**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Dateigestützte Secret-Payload (optional)**: `~/.openclaw/secrets.json`
- **Legacy-OAuth-Import**: `~/.openclaw/credentials/oauth.json`
  Mehr Details: [Security](/de/gateway/security#credential-storage-map).

## Aktualisieren (ohne Ihr Setup zu zerstören)

- Behalten Sie `~/.openclaw/workspace` und `~/.openclaw/` als „Ihre Sachen“; legen Sie keine persönlichen Prompts/Konfigurationen in das Repo `openclaw`.
- Quellcode aktualisieren: `git pull` + der von Ihnen gewählte Paketmanager-Installationsschritt (`pnpm install` standardmäßig; `bun install` für den Bun-Workflow) + weiterhin den passenden Befehl `gateway:watch` verwenden.

## Linux (systemd-User-Service)

Linux-Installationen verwenden einen systemd-**User**-Service. Standardmäßig stoppt systemd User-
Services bei Logout/Inaktivität, was das Gateway beendet. Das Onboarding versucht, Linger für Sie zu aktivieren (kann sudo erfordern). Falls es weiterhin deaktiviert ist, führen Sie aus:

```bash
sudo loginctl enable-linger $USER
```

Für ständig aktive oder Mehrbenutzer-Server sollten Sie einen **System**-Service statt eines
User-Service in Betracht ziehen (kein Linger nötig). Siehe [Gateway runbook](/de/gateway) für Hinweise zu systemd.

## Verwandte Dokumente

- [Gateway runbook](/de/gateway) (Flags, Supervision, Ports)
- [Gateway configuration](/de/gateway/configuration) (Konfigurationsschema + Beispiele)
- [Discord](/de/channels/discord) und [Telegram](/de/channels/telegram) (Reply-Tags + `replyToMode`-Einstellungen)
- [OpenClaw assistant setup](/de/start/openclaw)
- [macOS app](/de/platforms/macos) (Gateway-Lebenszyklus)
