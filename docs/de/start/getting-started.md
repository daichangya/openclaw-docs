---
read_when:
    - Ersteinrichtung von Grund auf
    - Sie möchten den schnellsten Weg zu einem funktionierenden Chat
summary: OpenClaw installieren und in wenigen Minuten Ihren ersten Chat starten.
title: Erste Schritte
x-i18n:
    generated_at: "2026-04-24T07:00:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe3f92b1464ebf0a5b631c293fa4a3e4b686fdb35c1152663428025dd3c01259
    source_path: start/getting-started.md
    workflow: 15
---

OpenClaw installieren, Onboarding ausführen und mit Ihrem KI-Assistenten chatten — alles in
etwa 5 Minuten. Am Ende haben Sie ein laufendes Gateway, konfigurierte Authentifizierung
und eine funktionierende Chat-Sitzung.

## Was Sie benötigen

- **Node.js** — Node 24 empfohlen (Node 22.14+ wird ebenfalls unterstützt)
- **Einen API-Schlüssel** von einem Modell-Provider (Anthropic, OpenAI, Google usw.) — das Onboarding fragt danach

<Tip>
Prüfen Sie Ihre Node-Version mit `node --version`.
**Windows-Nutzer:** Sowohl natives Windows als auch WSL2 werden unterstützt. WSL2 ist stabiler
und für das vollständige Erlebnis empfohlen. Siehe [Windows](/de/platforms/windows).
Node installieren? Siehe [Node setup](/de/install/node).
</Tip>

## Schnelleinrichtung

<Steps>
  <Step title="OpenClaw installieren">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Install Script Process"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Weitere Installationsmethoden (Docker, Nix, npm): [Install](/de/install).
    </Note>

  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --install-daemon
    ```

    Der Assistent führt Sie durch die Auswahl eines Modell-Providers, das Setzen eines API-Schlüssels
    und die Konfiguration des Gateway. Das dauert etwa 2 Minuten.

    Die vollständige Referenz finden Sie unter [Onboarding (CLI)](/de/start/wizard).

  </Step>
  <Step title="Prüfen, dass das Gateway läuft">
    ```bash
    openclaw gateway status
    ```

    Sie sollten sehen, dass das Gateway auf Port 18789 lauscht.

  </Step>
  <Step title="Das Dashboard öffnen">
    ```bash
    openclaw dashboard
    ```

    Dadurch wird die Control UI in Ihrem Browser geöffnet. Wenn sie lädt, funktioniert alles.

  </Step>
  <Step title="Ihre erste Nachricht senden">
    Geben Sie eine Nachricht im Chat der Control UI ein, und Sie sollten eine KI-Antwort erhalten.

    Möchten Sie stattdessen von Ihrem Telefon aus chatten? Der am schnellsten einzurichtende Kanal ist
    [Telegram](/de/channels/telegram) (nur ein Bot-Token). Unter [Channels](/de/channels)
    finden Sie alle Optionen.

  </Step>
</Steps>

<Accordion title="Erweitert: einen benutzerdefinierten Build der Control UI mounten">
  Wenn Sie einen lokalisierten oder angepassten Dashboard-Build pflegen, setzen Sie
  `gateway.controlUi.root` auf ein Verzeichnis, das Ihre gebauten statischen
  Assets und `index.html` enthält.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Kopieren Sie Ihre gebauten statischen Dateien in dieses Verzeichnis.
```

Setzen Sie dann:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Starten Sie das Gateway neu und öffnen Sie das Dashboard erneut:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Was Sie als Nächstes tun können

<Columns>
  <Card title="Einen Kanal verbinden" href="/de/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo und mehr.
  </Card>
  <Card title="Pairing und Sicherheit" href="/de/channels/pairing" icon="shield">
    Steuern Sie, wer Ihrem Agenten Nachrichten senden kann.
  </Card>
  <Card title="Das Gateway konfigurieren" href="/de/gateway/configuration" icon="settings">
    Modelle, Tools, Sandbox und erweiterte Einstellungen.
  </Card>
  <Card title="Tools durchsuchen" href="/de/tools" icon="wrench">
    Browser, Exec, Websuche, Skills und Plugins.
  </Card>
</Columns>

<Accordion title="Erweitert: Umgebungsvariablen">
  Wenn Sie OpenClaw als Dienstkonto ausführen oder benutzerdefinierte Pfade möchten:

- `OPENCLAW_HOME` — Home-Verzeichnis für interne Pfadauflösung
- `OPENCLAW_STATE_DIR` — Statusverzeichnis überschreiben
- `OPENCLAW_CONFIG_PATH` — Pfad der Konfigurationsdatei überschreiben

Vollständige Referenz: [Environment variables](/de/help/environment).
</Accordion>

## Verwandt

- [Install overview](/de/install)
- [Channels overview](/de/channels)
- [Setup](/de/start/setup)
