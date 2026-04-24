---
read_when:
    - Sie stellen OpenClaw auf einer Cloud-VM mit Docker bereit.
    - Sie benötigen den gemeinsamen Ablauf für Binärdatei-Bake, Persistenz und Updates.
summary: Gemeinsame Docker-VM-Runtime-Schritte für langlebige OpenClaw-Gateway-Hosts
title: Docker-VM-Runtime
x-i18n:
    generated_at: "2026-04-24T06:43:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54e99e6186a3c13783922e4d1e4a55e9872514be23fa77ca869562dcd436ad2b
    source_path: install/docker-vm-runtime.md
    workflow: 15
---

Gemeinsame Runtime-Schritte für Docker-Installationen auf VMs wie GCP, Hetzner und ähnlichen VPS-Providern.

## Erforderliche Binärdateien in das Image backen

Binärdateien in einem laufenden Container zu installieren, ist eine Falle.
Alles, was zur Laufzeit installiert wird, geht bei einem Neustart verloren.

Alle externen Binärdateien, die von Skills benötigt werden, müssen zur Build-Zeit des Images installiert werden.

Die folgenden Beispiele zeigen nur drei häufige Binärdateien:

- `gog` für Gmail-Zugriff
- `goplaces` für Google Places
- `wacli` für WhatsApp

Das sind Beispiele, keine vollständige Liste.
Sie können mit demselben Muster beliebig viele Binärdateien installieren.

Wenn Sie später neue Skills hinzufügen, die weitere Binärdateien benötigen, müssen Sie:

1. Das Dockerfile aktualisieren
2. Das Image neu bauen
3. Die Container neu starten

**Beispiel-Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Beispiel-Binärdatei 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Beispiel-Binärdatei 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Beispiel-Binärdatei 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# Weitere Binärdateien unten mit demselben Muster hinzufügen

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
Die Download-URLs oben sind für x86_64 (amd64). Für ARM-basierte VMs (z. B. Hetzner ARM, GCP Tau T2A) ersetzen Sie die Download-URLs durch die passenden ARM64-Varianten von der jeweiligen Release-Seite des Tools.
</Note>

## Bauen und starten

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Wenn der Build während `pnpm install --frozen-lockfile` mit `Killed` oder `exit code 137` fehlschlägt, hat die VM nicht genug Speicher.
Verwenden Sie eine größere Maschinenklasse, bevor Sie es erneut versuchen.

Binärdateien verifizieren:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Erwartete Ausgabe:

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Gateway verifizieren:

```bash
docker compose logs -f openclaw-gateway
```

Erwartete Ausgabe:

```text
[gateway] listening on ws://0.0.0.0:18789
```

## Was wo persistent bleibt

OpenClaw läuft in Docker, aber Docker ist nicht die Quelle der Wahrheit.
Jeder langlebige Zustand muss Neustarts, Rebuilds und Reboots überstehen.

| Komponente           | Speicherort                       | Persistenzmechanismus  | Hinweise                                                      |
| -------------------- | --------------------------------- | ---------------------- | ------------------------------------------------------------- |
| Gateway-Konfiguration | `/home/node/.openclaw/`          | Host-Volume-Mount      | Enthält `openclaw.json`, `.env`                               |
| Modell-Auth-Profile  | `/home/node/.openclaw/agents/`    | Host-Volume-Mount      | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API keys) |
| Skill-Konfigurationen | `/home/node/.openclaw/skills/`   | Host-Volume-Mount      | Status auf Skill-Ebene                                        |
| Agent-Workspace      | `/home/node/.openclaw/workspace/` | Host-Volume-Mount      | Code und Agent-Artefakte                                      |
| WhatsApp-Sitzung     | `/home/node/.openclaw/`           | Host-Volume-Mount      | Bewahrt QR-Login                                              |
| Gmail-Keyring        | `/home/node/.openclaw/`           | Host-Volume + Passwort | Erfordert `GOG_KEYRING_PASSWORD`                              |
| Externe Binärdateien | `/usr/local/bin/`                 | Docker-Image           | Müssen zur Build-Zeit eingebackt werden                       |
| Node-Runtime         | Container-Dateisystem             | Docker-Image           | Wird bei jedem Image-Build neu gebaut                         |
| OS-Pakete            | Container-Dateisystem             | Docker-Image           | Nicht zur Laufzeit installieren                               |
| Docker-Container     | Ephemer                           | Neustartbar            | Kann gefahrlos zerstört werden                                |

## Updates

So aktualisieren Sie OpenClaw auf der VM:

```bash
git pull
docker compose build
docker compose up -d
```

## Verwandt

- [Docker](/de/install/docker)
- [Podman](/de/install/podman)
- [ClawDock](/de/install/clawdock)
