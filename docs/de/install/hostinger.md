---
read_when:
    - Einrichten von OpenClaw auf Hostinger
    - Sie suchen nach einem verwalteten VPS für OpenClaw
    - Verwendung von Hostinger 1-Click OpenClaw
summary: OpenClaw auf Hostinger hosten
title: Hostinger
x-i18n:
    generated_at: "2026-04-23T14:02:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ee70d24fd1c3a6de503fc967d7e726d701f84cc6717fe7a3bc65a6a28e386ea
    source_path: install/hostinger.md
    workflow: 15
---

# Hostinger

Führen Sie ein dauerhaftes OpenClaw Gateway auf [Hostinger](https://www.hostinger.com/openclaw) über eine verwaltete **1-Click**-Bereitstellung oder eine **VPS**-Installation aus.

## Voraussetzungen

- Hostinger-Konto ([Registrierung](https://www.hostinger.com/openclaw))
- Etwa 5–10 Minuten

## Option A: 1-Click OpenClaw

Der schnellste Einstieg. Hostinger übernimmt Infrastruktur, Docker und automatische Updates.

<Steps>
  <Step title="Kaufen und starten">
    1. Wählen Sie auf der [Hostinger-OpenClaw-Seite](https://www.hostinger.com/openclaw) einen Managed-OpenClaw-Tarif und schließen Sie den Checkout ab.

    <Note>
    Während des Checkouts können Sie **Ready-to-Use AI**-Guthaben auswählen, die im Voraus gekauft und sofort in OpenClaw integriert werden — keine externen Konten oder API-Schlüssel anderer Provider erforderlich. Sie können sofort mit dem Chatten beginnen. Alternativ können Sie während der Einrichtung Ihren eigenen Schlüssel von Anthropic, OpenAI, Google Gemini oder xAI angeben.
    </Note>

  </Step>

  <Step title="Messaging-Channel auswählen">
    Wählen Sie einen oder mehrere Channels aus, die Sie verbinden möchten:

    - **WhatsApp** -- Scannen Sie den im Einrichtungsassistenten angezeigten QR-Code.
    - **Telegram** -- Fügen Sie den Bot-Token von [BotFather](https://t.me/BotFather) ein.

  </Step>

  <Step title="Installation abschließen">
    Klicken Sie auf **Finish**, um die Instanz bereitzustellen. Sobald sie bereit ist, greifen Sie über **OpenClaw Overview** in hPanel auf das OpenClaw-Dashboard zu.
  </Step>

</Steps>

## Option B: OpenClaw auf VPS

Mehr Kontrolle über Ihren Server. Hostinger stellt OpenClaw über Docker auf Ihrem VPS bereit, und Sie verwalten es über den **Docker Manager** in hPanel.

<Steps>
  <Step title="VPS kaufen">
    1. Wählen Sie auf der [Hostinger-OpenClaw-Seite](https://www.hostinger.com/openclaw) einen Tarif für OpenClaw auf VPS und schließen Sie den Checkout ab.

    <Note>
    Sie können während des Checkouts **Ready-to-Use AI**-Guthaben auswählen — diese werden im Voraus gekauft und sofort in OpenClaw integriert, sodass Sie ohne externe Konten oder API-Schlüssel anderer Provider mit dem Chatten beginnen können.
    </Note>

  </Step>

  <Step title="OpenClaw konfigurieren">
    Sobald der VPS bereitgestellt ist, füllen Sie die Konfigurationsfelder aus:

    - **Gateway-Token** -- automatisch generiert; speichern Sie es für die spätere Verwendung.
    - **WhatsApp-Nummer** -- Ihre Nummer mit Ländervorwahl (optional).
    - **Telegram-Bot-Token** -- von [BotFather](https://t.me/BotFather) (optional).
    - **API-Schlüssel** -- nur erforderlich, wenn Sie während des Checkouts keine Ready-to-Use AI-Guthaben ausgewählt haben.

  </Step>

  <Step title="OpenClaw starten">
    Klicken Sie auf **Deploy**. Sobald OpenClaw läuft, öffnen Sie das OpenClaw-Dashboard im hPanel mit einem Klick auf **Open**.
  </Step>

</Steps>

Logs, Neustarts und Updates werden direkt über die Docker-Manager-Oberfläche in hPanel verwaltet. Zum Aktualisieren klicken Sie im Docker Manager auf **Update**; dadurch wird das neueste Image abgerufen.

## Einrichtung verifizieren

Senden Sie „Hi“ an Ihren Assistenten auf dem verbundenen Channel. OpenClaw antwortet und führt Sie durch die ersten Einstellungen.

## Fehlerbehebung

**Dashboard lädt nicht** -- Warten Sie einige Minuten, bis die Bereitstellung des Containers abgeschlossen ist. Prüfen Sie die Docker-Manager-Logs in hPanel.

**Docker-Container startet ständig neu** -- Öffnen Sie die Docker-Manager-Logs und suchen Sie nach Konfigurationsfehlern (fehlende Tokens, ungültige API-Schlüssel).

**Telegram-Bot antwortet nicht** -- Senden Sie Ihre Pairing-Code-Nachricht direkt aus Telegram als Nachricht in Ihrem OpenClaw-Chat, um die Verbindung abzuschließen.

## Nächste Schritte

- [Channels](/de/channels) -- Telegram, WhatsApp, Discord und mehr verbinden
- [Gateway configuration](/de/gateway/configuration) -- alle Konfigurationsoptionen
