---
read_when:
    - Sie stellen OpenClaw auf einer Cloud-VM mit Docker bereit
    - Sie benötigen den gemeinsamen Ablauf für das Einbacken von Binärdateien, Persistenz und Updates
summary: Gemeinsame Docker-VM-Laufzeitschritte für langlebige OpenClaw-Gateway-Hosts
title: Docker-VM-Laufzeit
x-i18n:
    generated_at: "2026-04-05T12:45:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 854403a48fe15a88cc9befb9bebe657f1a7c83f1df2ebe2346fac9a6e4b16992
    source_path: install/docker-vm-runtime.md
    workflow: 15
---

# Docker-VM-Laufzeit

Gemeinsame Laufzeitschritte für VM-basierte Docker-Installationen wie GCP, Hetzner und ähnliche VPS-Anbieter.

## Erforderliche Binärdateien in das Image einbacken

Das Installieren von Binärdateien in einem laufenden Container ist eine Falle.
Alles, was zur Laufzeit installiert wird, geht beim Neustart verloren.

Alle externen Binärdateien, die von Skills benötigt werden, müssen beim Build des Images installiert werden.

Die folgenden Beispiele zeigen nur drei häufige Binärdateien:

- `gog` für Gmail-Zugriff
- `goplaces` für Google Places
- `wacli` für WhatsApp

Dies sind Beispiele, keine vollständige Liste.
Sie können nach demselben Muster beliebig viele Binärdateien installieren.

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

# Fügen Sie unten nach demselben Muster weitere Binärdateien hinzu

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
Die obigen Download-URLs sind für x86_64 (amd64). Bei ARM-basierten VMs (z. B. Hetzner ARM, GCP Tau T2A) ersetzen Sie die Download-URLs durch die passenden ARM64-Varianten aus der Release-Seite des jeweiligen Tools.
</Note>

## Bauen und starten

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Wenn der Build während `pnpm install --frozen-lockfile` mit `Killed` oder `exit code 137` fehlschlägt, hat die VM nicht genug Arbeitsspeicher.
Verwenden Sie eine größere Maschinenklasse, bevor Sie es erneut versuchen.

Binärdateien prüfen:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Erwartete Ausgabe:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Gateway prüfen:

```bash
docker compose logs -f openclaw-gateway
```

Erwartete Ausgabe:

```
[gateway] listening on ws://0.0.0.0:18789
```

## Was wo persistiert

OpenClaw läuft in Docker, aber Docker ist nicht die Quelle der Wahrheit.
Jeder langlebige Zustand muss Neustarts, Rebuilds und Reboots überstehen.

| Komponente          | Speicherort                      | Persistenzmechanismus | Hinweise                                                      |
| ------------------- | -------------------------------- | --------------------- | ------------------------------------------------------------- |
| Gateway-Konfiguration | `/home/node/.openclaw/`        | Host-Volume-Mount     | Enthält `openclaw.json`, `.env`                               |
| Modell-Auth-Profile | `/home/node/.openclaw/agents/`   | Host-Volume-Mount     | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API-Schlüssel) |
| Skill-Konfigurationen | `/home/node/.openclaw/skills/` | Host-Volume-Mount     | Zustand auf Skill-Ebene                                       |
| Agent-Workspace     | `/home/node/.openclaw/workspace/` | Host-Volume-Mount   | Code und Agent-Artefakte                                      |
| WhatsApp-Sitzung    | `/home/node/.openclaw/`          | Host-Volume-Mount     | Behält QR-Anmeldung bei                                       |
| Gmail-Keyring       | `/home/node/.openclaw/`          | Host-Volume + Passwort | Erfordert `GOG_KEYRING_PASSWORD`                            |
| Externe Binärdateien | `/usr/local/bin/`               | Docker-Image          | Müssen beim Build eingebacken werden                          |
| Node-Laufzeit       | Container-Dateisystem            | Docker-Image          | Wird bei jedem Image-Build neu erstellt                       |
| OS-Pakete           | Container-Dateisystem            | Docker-Image          | Nicht zur Laufzeit installieren                               |
| Docker-Container    | Flüchtig                         | Neustartbar           | Kann sicher zerstört werden                                   |

## Updates

So aktualisieren Sie OpenClaw auf der VM:

```bash
git pull
docker compose build
docker compose up -d
```
