---
read_when:
    - Sie möchten OpenClaw mit QQ verbinden
    - Sie benötigen die Einrichtung der QQ-Bot-Anmeldedaten
    - Sie möchten Unterstützung für QQ Bot in Gruppen- oder privaten Chats
summary: QQ-Bot-Einrichtung, Konfiguration und Verwendung
title: QQ Bot
x-i18n:
    generated_at: "2026-04-05T12:35:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e58fb7b07c59ecbf80a1276368c4a007b45d84e296ed40cffe9845e0953696c
    source_path: channels/qqbot.md
    workflow: 15
---

# QQ Bot

QQ Bot verbindet sich über die offizielle QQ-Bot-API (WebSocket-Gateway) mit OpenClaw. Das
Plugin unterstützt private C2C-Chats, Gruppen-@messages und Guild-Kanalnachrichten mit
Rich Media (Bilder, Sprache, Videos, Dateien).

Status: gebündeltes Plugin. Direktnachrichten, Gruppenchats, Guild-Kanäle und
Medien werden unterstützt. Reaktionen und Threads werden nicht unterstützt.

## Gebündeltes Plugin

Aktuelle OpenClaw-Versionen bündeln QQ Bot, daher benötigen normale paketierte Builds
keinen separaten Schritt `openclaw plugins install`.

## Einrichtung

1. Gehen Sie zur [QQ Open Platform](https://q.qq.com/) und scannen Sie den QR-Code mit Ihrem
   QQ auf dem Telefon, um sich zu registrieren bzw. anzumelden.
2. Klicken Sie auf **Create Bot**, um einen neuen QQ-Bot zu erstellen.
3. Suchen Sie **AppID** und **AppSecret** auf der Einstellungsseite des Bots und kopieren Sie sie.

> AppSecret wird nicht im Klartext gespeichert — wenn Sie die Seite verlassen, ohne es zu speichern,
> müssen Sie ein neues generieren.

4. Fügen Sie den Kanal hinzu:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Starten Sie das Gateway neu.

Interaktive Einrichtungswege:

```bash
openclaw channels add
openclaw configure --section channels
```

## Konfigurieren

Minimale Konfiguration:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Umgebungsvariablen für das Standardkonto:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

Dateigestütztes AppSecret:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

Hinweise:

- Der Env-Fallback gilt nur für das Standardkonto von QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` stellt nur das
  AppSecret bereit; die AppID muss bereits in der Konfiguration oder in `QQBOT_APP_ID` gesetzt sein.
- `clientSecret` akzeptiert auch SecretRef-Eingaben, nicht nur eine Klartextzeichenfolge.

### Einrichtung mit mehreren Konten

Führen Sie mehrere QQ-Bots unter einer einzigen OpenClaw-Instanz aus:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Jedes Konto startet seine eigene WebSocket-Verbindung und verwaltet einen unabhängigen
Token-Cache (isoliert nach `appId`).

Fügen Sie per CLI einen zweiten Bot hinzu:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Sprache (STT / TTS)

STT- und TTS-Unterstützung verwenden eine Konfiguration auf zwei Ebenen mit Prioritäts-Fallback:

| Einstellung | Pluginspezifisch     | Framework-Fallback          |
| ----------- | -------------------- | --------------------------- |
| STT         | `channels.qqbot.stt` | `tools.media.audio.models[0]` |
| TTS         | `channels.qqbot.tts` | `messages.tts`              |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
    },
  },
}
```

Setzen Sie `enabled: false` bei einer der beiden Optionen, um sie zu deaktivieren.

Das Verhalten beim Hochladen/Transkodieren ausgehender Audiodateien kann außerdem mit
`channels.qqbot.audioFormatPolicy` angepasst werden:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Zielformate

| Format                     | Beschreibung      |
| -------------------------- | ----------------- |
| `qqbot:c2c:OPENID`         | Privater Chat (C2C) |
| `qqbot:group:GROUP_OPENID` | Gruppenchat       |
| `qqbot:channel:CHANNEL_ID` | Guild-Kanal       |

> Jeder Bot hat seinen eigenen Satz von Benutzer-OpenIDs. Eine von Bot A empfangene OpenID **kann nicht**
> verwendet werden, um Nachrichten über Bot B zu senden.

## Slash-Befehle

Integrierte Befehle, die vor der KI-Warteschlange abgefangen werden:

| Befehl         | Beschreibung                              |
| -------------- | ----------------------------------------- |
| `/bot-ping`    | Latenztest                                |
| `/bot-version` | Die Version des OpenClaw-Frameworks anzeigen |
| `/bot-help`    | Alle Befehle auflisten                    |
| `/bot-upgrade` | Den Link zum QQBot-Upgrade-Leitfaden anzeigen |
| `/bot-logs`    | Aktuelle Gateway-Protokolle als Datei exportieren |

Hängen Sie `?` an einen beliebigen Befehl an, um Hilfe zur Verwendung zu erhalten (zum Beispiel `/bot-upgrade ?`).

## Fehlerbehebung

- **Bot antwortet mit "gone to Mars":** Anmeldedaten sind nicht konfiguriert oder das Gateway wurde nicht gestartet.
- **Keine eingehenden Nachrichten:** Prüfen Sie, ob `appId` und `clientSecret` korrekt sind und der
  Bot auf der QQ Open Platform aktiviert ist.
- **Einrichtung mit `--token-file` zeigt weiterhin "unconfigured":** `--token-file` setzt nur
  das AppSecret. Sie benötigen weiterhin `appId` in der Konfiguration oder `QQBOT_APP_ID`.
- **Proaktive Nachrichten kommen nicht an:** QQ kann vom Bot initiierte Nachrichten abfangen, wenn
  der Benutzer in letzter Zeit nicht interagiert hat.
- **Sprache wird nicht transkribiert:** Stellen Sie sicher, dass STT konfiguriert ist und der Provider erreichbar ist.
