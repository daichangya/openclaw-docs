---
read_when:
    - Bereitstellen von OpenClaw auf Fly.io
    - Einrichten von Fly-Volumes, Secrets und Konfiguration beim ersten Start
summary: Schritt-für-Schritt-Bereitstellung auf Fly.io für OpenClaw mit persistentem Speicher und HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-05T12:46:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5f8c2c03295d786c0d8df98f8a5ae9335fa0346a188b81aae3e07d566a2c0ef
    source_path: install/fly.md
    workflow: 15
---

# Fly.io Deployment

**Ziel:** Ein OpenClaw-Gateway, das auf einer [Fly.io](https://fly.io)-Maschine läuft, mit persistentem Speicher, automatischem HTTPS und Discord-/Kanalzugriff.

## Was Sie brauchen

- installierte [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io-Konto (der kostenlose Tarif reicht aus)
- Modell-Authentifizierung: API-Schlüssel für Ihren gewählten Modell-Provider
- Kanal-Anmeldedaten: Discord-Bot-Token, Telegram-Token usw.

## Schneller Pfad für Einsteiger

1. Repository klonen → `fly.toml` anpassen
2. App + Volume erstellen → Secrets setzen
3. Mit `fly deploy` bereitstellen
4. Per SSH anmelden, um Konfiguration zu erstellen, oder die Control UI verwenden

<Steps>
  <Step title="Die Fly-App erstellen">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Tipp:** Wählen Sie eine Region in Ihrer Nähe. Gängige Optionen: `lhr` (London), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="fly.toml konfigurieren">
    Bearbeiten Sie `fly.toml`, damit es zu Ihrem App-Namen und Ihren Anforderungen passt.

    **Sicherheitshinweis:** Die Standardkonfiguration stellt eine öffentliche URL bereit. Für eine gehärtete Bereitstellung ohne öffentliche IP siehe [Private Bereitstellung](#private-deployment-hardened) oder verwenden Sie `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Your app name
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    **Wichtige Einstellungen:**

    | Einstellung                     | Warum                                                                       |
    | ------------------------------- | ---------------------------------------------------------------------------- |
    | `--bind lan`                    | Bindet an `0.0.0.0`, damit der Proxy von Fly das Gateway erreichen kann      |
    | `--allow-unconfigured`          | Startet ohne Konfigurationsdatei (Sie erstellen sie später)                 |
    | `internal_port = 3000`          | Muss zu `--port 3000` (oder `OPENCLAW_GATEWAY_PORT`) für Fly-Health-Checks passen |
    | `memory = "2048mb"`             | 512 MB sind zu klein; 2 GB werden empfohlen                                 |
    | `OPENCLAW_STATE_DIR = "/data"`  | Speichert den Status dauerhaft auf dem Volume                               |

  </Step>

  <Step title="Secrets setzen">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Hinweise:**

    - Nicht-Loopback-Bindings (`--bind lan`) erfordern einen gültigen Gateway-Auth-Pfad. Dieses Fly.io-Beispiel verwendet `OPENCLAW_GATEWAY_TOKEN`, aber auch `gateway.auth.password` oder eine korrekt konfigurierte Bereitstellung mit `trusted-proxy` außerhalb von Loopback erfüllen die Anforderung.
    - Behandeln Sie diese Tokens wie Passwörter.
    - **Bevorzugen Sie Umgebungsvariablen gegenüber der Konfigurationsdatei** für alle API-Schlüssel und Tokens. So bleiben Geheimnisse aus `openclaw.json` heraus, wo sie versehentlich offengelegt oder geloggt werden könnten.

  </Step>

  <Step title="Bereitstellen">
    ```bash
    fly deploy
    ```

    Die erste Bereitstellung baut das Docker-Image (~2–3 Minuten). Nachfolgende Bereitstellungen sind schneller.

    Nach der Bereitstellung prüfen Sie:

    ```bash
    fly status
    fly logs
    ```

    Sie sollten Folgendes sehen:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="Konfigurationsdatei erstellen">
    Melden Sie sich per SSH an der Maschine an, um eine echte Konfiguration zu erstellen:

    ```bash
    fly ssh console
    ```

    Erstellen Sie das Konfigurationsverzeichnis und die Datei:

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto"
      },
      "meta": {}
    }
    EOF
    ```

    **Hinweis:** Mit `OPENCLAW_STATE_DIR=/data` ist der Konfigurationspfad `/data/openclaw.json`.

    **Hinweis:** Das Discord-Token kann aus einer der folgenden Quellen kommen:

    - Umgebungsvariable: `DISCORD_BOT_TOKEN` (empfohlen für Geheimnisse)
    - Konfigurationsdatei: `channels.discord.token`

    Wenn Sie die Umgebungsvariable verwenden, müssen Sie das Token nicht zur Konfiguration hinzufügen. Das Gateway liest `DISCORD_BOT_TOKEN` automatisch.

    Zum Anwenden neu starten:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Auf das Gateway zugreifen">
    ### Control UI

    Im Browser öffnen:

    ```bash
    fly open
    ```

    Oder `https://my-openclaw.fly.dev/` besuchen

    Authentifizieren Sie sich mit dem konfigurierten gemeinsamen Geheimnis. Dieser Leitfaden verwendet das Gateway-
    Token aus `OPENCLAW_GATEWAY_TOKEN`; wenn Sie stattdessen auf Passwort-Auth umgestellt haben, verwenden Sie
    dieses Passwort.

    ### Logs

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### SSH-Konsole

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Fehlerbehebung

### "App is not listening on expected address"

Das Gateway bindet an `127.0.0.1` statt an `0.0.0.0`.

**Behebung:** Fügen Sie `--bind lan` zu Ihrem Prozessbefehl in `fly.toml` hinzu.

### Health-Checks schlagen fehl / Verbindung verweigert

Fly kann das Gateway auf dem konfigurierten Port nicht erreichen.

**Behebung:** Stellen Sie sicher, dass `internal_port` mit dem Gateway-Port übereinstimmt (setzen Sie `--port 3000` oder `OPENCLAW_GATEWAY_PORT=3000`).

### OOM- / Speicherprobleme

Der Container startet ständig neu oder wird beendet. Anzeichen: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` oder stille Neustarts.

**Behebung:** Erhöhen Sie den Speicher in `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Oder aktualisieren Sie eine bestehende Maschine:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Hinweis:** 512 MB sind zu klein. 1 GB kann funktionieren, kann aber unter Last oder bei verbose Logging zu OOM führen. **2 GB werden empfohlen.**

### Probleme mit Gateway-Locks

Das Gateway startet nicht und meldet Fehler wie „already running“.

Das passiert, wenn der Container neu startet, die PID-Lock-Datei aber auf dem Volume bestehen bleibt.

**Behebung:** Löschen Sie die Lock-Datei:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Die Lock-Datei liegt unter `/data/gateway.*.lock` (nicht in einem Unterverzeichnis).

### Konfiguration wird nicht gelesen

`--allow-unconfigured` umgeht nur die Startschutzprüfung. Es erstellt oder repariert `/data/openclaw.json` nicht. Stellen Sie daher sicher, dass Ihre echte Konfiguration vorhanden ist und `gateway.mode="local"` enthält, wenn Sie ein normales lokales Gateway starten möchten.

Prüfen Sie, ob die Konfiguration existiert:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Konfiguration per SSH schreiben

Der Befehl `fly ssh console -C` unterstützt keine Shell-Umleitung. Um eine Konfigurationsdatei zu schreiben:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Hinweis:** `fly sftp` kann fehlschlagen, wenn die Datei bereits existiert. Löschen Sie sie zuerst:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Status bleibt nicht erhalten

Wenn Sie nach einem Neustart Auth-Profile, Kanal-/Provider-Status oder Sitzungen verlieren,
schreibt das Statusverzeichnis in das Container-Dateisystem.

**Behebung:** Stellen Sie sicher, dass `OPENCLAW_STATE_DIR=/data` in `fly.toml` gesetzt ist, und stellen Sie erneut bereit.

## Updates

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### Maschinenbefehl aktualisieren

Wenn Sie den Startbefehl ohne vollständige Neu-Bereitstellung ändern müssen:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Hinweis:** Nach `fly deploy` kann der Maschinenbefehl auf den Inhalt von `fly.toml` zurückgesetzt werden. Wenn Sie manuelle Änderungen vorgenommen haben, wenden Sie diese nach der Bereitstellung erneut an.

## Private Bereitstellung (gehärtet)

Standardmäßig weist Fly öffentliche IPs zu, wodurch Ihr Gateway unter `https://your-app.fly.dev` erreichbar ist. Das ist praktisch, bedeutet aber auch, dass Ihre Bereitstellung von Internet-Scannern (Shodan, Censys usw.) entdeckt werden kann.

Für eine gehärtete Bereitstellung **ohne öffentliche Exposition** verwenden Sie die private Vorlage.

### Wann eine private Bereitstellung sinnvoll ist

- Sie führen nur **ausgehende** Aufrufe/Nachrichten aus (keine eingehenden Webhooks)
- Sie verwenden **ngrok oder Tailscale**-Tunnel für Webhook-Callbacks
- Sie greifen per **SSH, Proxy oder WireGuard** statt per Browser auf das Gateway zu
- Sie möchten die Bereitstellung **vor Internet-Scannern verbergen**

### Einrichtung

Verwenden Sie `fly.private.toml` statt der Standardkonfiguration:

```bash
# Deploy with private config
fly deploy -c fly.private.toml
```

Oder wandeln Sie eine bestehende Bereitstellung um:

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Danach sollte `fly ips list` nur noch eine IP vom Typ `private` anzeigen:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Zugriff auf eine private Bereitstellung

Da es keine öffentliche URL gibt, verwenden Sie eine dieser Methoden:

**Option 1: Lokaler Proxy (am einfachsten)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**Option 2: WireGuard-VPN**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**Option 3: Nur SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooks mit privater Bereitstellung

Wenn Sie Webhook-Callbacks (Twilio, Telnyx usw.) ohne öffentliche Exposition benötigen:

1. **ngrok-Tunnel** - Führen Sie ngrok im Container oder als Sidecar aus
2. **Tailscale Funnel** - Bestimmte Pfade über Tailscale bereitstellen
3. **Nur ausgehend** - Einige Provider (Twilio) funktionieren für ausgehende Anrufe auch ohne Webhooks

Beispielkonfiguration für Sprachanrufe mit ngrok:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

Der ngrok-Tunnel läuft im Container und stellt eine öffentliche Webhook-URL bereit, ohne die Fly-App selbst offenzulegen. Setzen Sie `webhookSecurity.allowedHosts` auf den öffentlichen Tunnel-Hostnamen, damit weitergeleitete Host-Header akzeptiert werden.

### Sicherheitsvorteile

| Aspekt             | Öffentlich   | Privat      |
| ------------------ | ------------ | ----------- |
| Internet-Scanner   | Auffindbar   | Verborgen   |
| Direkte Angriffe   | Möglich      | Blockiert   |
| Control UI-Zugriff | Browser      | Proxy/VPN   |
| Webhook-Zustellung | Direkt       | Über Tunnel |

## Hinweise

- Fly.io verwendet eine **x86-Architektur** (nicht ARM)
- Das Dockerfile ist mit beiden Architekturen kompatibel
- Für WhatsApp-/Telegram-Onboarding verwenden Sie `fly ssh console`
- Persistente Daten liegen auf dem Volume unter `/data`
- Signal erfordert Java + signal-cli; verwenden Sie ein benutzerdefiniertes Image und behalten Sie 2 GB+ Speicher bei.

## Kosten

Mit der empfohlenen Konfiguration (`shared-cpu-2x`, 2 GB RAM):

- etwa 10–15 $/Monat, abhängig von der Nutzung
- der kostenlose Tarif enthält ein gewisses Kontingent

Details finden Sie unter [Fly.io pricing](https://fly.io/docs/about/pricing/).

## Nächste Schritte

- Messaging-Kanäle einrichten: [Kanäle](/channels)
- Das Gateway konfigurieren: [Gateway-Konfiguration](/gateway/configuration)
- OpenClaw aktuell halten: [Aktualisieren](/install/updating)
