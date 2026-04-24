---
read_when:
    - Sie möchten OpenClaw mit QQ verbinden
    - Sie benötigen die Einrichtung der QQ-Bot-Anmeldedaten
    - Sie möchten Unterstützung für QQ-Bot-Gruppen oder private Chats
summary: QQ-Bot-Einrichtung, -Konfiguration und -Verwendung
title: QQ-Bot
x-i18n:
    generated_at: "2026-04-24T06:28:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8127ec59d3a17222e7fe883e77aa1c7d384b231b7d479385421df51c995f7dc2
    source_path: channels/qqbot.md
    workflow: 15
---

QQ-Bot verbindet OpenClaw über die offizielle QQ Bot API (WebSocket-Gateway). Das
Plugin unterstützt private C2C-Chats, Gruppen-@-Nachrichten und Guild-Channel-Nachrichten mit
Rich Media (Bilder, Sprache, Video, Dateien).

Status: gebündeltes Plugin. Direktnachrichten, Gruppenchats, Guild-Channel und
Medien werden unterstützt. Reaktionen und Threads werden nicht unterstützt.

## Gebündeltes Plugin

Aktuelle OpenClaw-Releases bündeln QQ-Bot, daher benötigen normale paketierte Builds
keinen separaten Schritt mit `openclaw plugins install`.

## Einrichtung

1. Gehen Sie zur [QQ Open Platform](https://q.qq.com/) und scannen Sie den QR-Code mit Ihrem
   QQ auf dem Telefon, um sich zu registrieren bzw. anzumelden.
2. Klicken Sie auf **Create Bot**, um einen neuen QQ-Bot zu erstellen.
3. Suchen Sie **AppID** und **AppSecret** auf der Einstellungsseite des Bots und kopieren Sie sie.

> AppSecret wird nicht im Klartext gespeichert — wenn Sie die Seite verlassen, ohne ihn zu speichern,
> müssen Sie einen neuen generieren.

4. Fügen Sie den Channel hinzu:

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

- Das Env-Fallback gilt nur für das Standard-QQ-Bot-Konto.
- `openclaw channels add --channel qqbot --token-file ...` liefert nur das
  AppSecret; die AppID muss bereits in der Konfiguration oder in `QQBOT_APP_ID` gesetzt sein.
- `clientSecret` akzeptiert auch SecretRef-Eingaben, nicht nur eine Klartextzeichenfolge.

### Mehrkonten-Einrichtung

Führen Sie mehrere QQ-Bots unter einer einzelnen OpenClaw-Instanz aus:

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

STT- und TTS-Unterstützung verwenden eine zweistufige Konfiguration mit priorisiertem Fallback:

| Einstellung | Pluginspezifisch      | Framework-Fallback            |
| ----------- | --------------------- | ----------------------------- |
| STT         | `channels.qqbot.stt`  | `tools.media.audio.models[0]` |
| TTS         | `channels.qqbot.tts`  | `messages.tts`                |

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

Setzen Sie bei einem von beiden `enabled: false`, um ihn zu deaktivieren.

Das Verhalten beim Hochladen/Transkodieren ausgehender Audiodateien kann auch mit
`channels.qqbot.audioFormatPolicy` angepasst werden:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Zielformate

| Format                     | Beschreibung         |
| -------------------------- | -------------------- |
| `qqbot:c2c:OPENID`         | Privater Chat (C2C)  |
| `qqbot:group:GROUP_OPENID` | Gruppenchat          |
| `qqbot:channel:CHANNEL_ID` | Guild-Channel        |

> Jeder Bot hat seine eigene Menge an Benutzer-OpenIDs. Eine von Bot A empfangene OpenID **kann nicht**
> verwendet werden, um über Bot B Nachrichten zu senden.

## Slash-Befehle

Integrierte Befehle, die vor der AI-Warteschlange abgefangen werden:

| Befehl         | Beschreibung                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Latenztest                                                                                                            |
| `/bot-version` | Zeigt die OpenClaw-Framework-Version an                                                                               |
| `/bot-help`    | Listet alle Befehle auf                                                                                                |
| `/bot-upgrade` | Zeigt den Link zum QQBot-Upgrade-Leitfaden an                                                                         |
| `/bot-logs`    | Exportiert aktuelle Gateway-Logs als Datei                                                                            |
| `/bot-approve` | Genehmigt eine ausstehende QQ-Bot-Aktion (zum Beispiel das Bestätigen eines C2C- oder Gruppen-Uploads) im nativen Ablauf. |

Hängen Sie an jeden Befehl `?` an, um Verwendungshilfe zu erhalten (zum Beispiel `/bot-upgrade ?`).

## Engine-Architektur

QQ-Bot wird als eigenständige Engine innerhalb des Plugins ausgeliefert:

- Jedes Konto besitzt einen isolierten Ressourcen-Stack (WebSocket-Verbindung, API-Client, Token-Cache, Media-Speicherwurzel), der durch `appId` gekennzeichnet ist. Konten teilen niemals Eingangs-/Ausgangszustände.
- Der Mehrkonten-Logger versieht Logzeilen mit dem zugehörigen Konto, damit Diagnosen getrennt bleiben, wenn Sie mehrere Bots unter einem Gateway ausführen.
- Eingehende, ausgehende und Gateway-Bridge-Pfade teilen sich eine einzige Media-Payload-Wurzel unter `~/.openclaw/media`, sodass Uploads, Downloads und Transcode-Caches in einem geschützten Verzeichnis statt in einem Baum pro Subsystem landen.
- Anmeldedaten können als Teil normaler OpenClaw-Anmeldedaten-Snapshots gesichert und wiederhergestellt werden; die Engine hängt den Ressourcen-Stack jedes Kontos bei der Wiederherstellung erneut an, ohne dass ein neues QR-Code-Pairing erforderlich ist.

## QR-Code-Onboarding

Als Alternative zum manuellen Einfügen von `AppID:AppSecret` unterstützt die Engine einen QR-Code-Onboarding-Ablauf, um einen QQ-Bot mit OpenClaw zu verknüpfen:

1. Führen Sie den Einrichtungsweg für QQ-Bot aus (zum Beispiel `openclaw channels add --channel qqbot`) und wählen Sie bei Aufforderung den QR-Code-Ablauf.
2. Scannen Sie den generierten QR-Code mit der Telefon-App, die mit dem Ziel-QQ-Bot verknüpft ist.
3. Genehmigen Sie das Pairing auf dem Telefon. OpenClaw speichert die zurückgegebenen Anmeldedaten unter dem richtigen Kontobereich in `credentials/`.

Vom Bot selbst erzeugte Genehmigungsaufforderungen (zum Beispiel Abläufe vom Typ „diese Aktion zulassen?“, die von der QQ Bot API bereitgestellt werden) erscheinen als native OpenClaw-Aufforderungen, die Sie mit `/bot-approve` annehmen können, statt über den rohen QQ-Client zu antworten.

## Fehlerbehebung

- **Bot antwortet „gone to Mars“:** Anmeldedaten nicht konfiguriert oder Gateway nicht gestartet.
- **Keine eingehenden Nachrichten:** Prüfen Sie, ob `appId` und `clientSecret` korrekt sind und der
  Bot auf der QQ Open Platform aktiviert ist.
- **Einrichtung mit `--token-file` zeigt weiterhin „unconfigured“:** `--token-file` setzt nur
  das AppSecret. Sie benötigen weiterhin `appId` in der Konfiguration oder `QQBOT_APP_ID`.
- **Proaktive Nachrichten kommen nicht an:** QQ kann vom Bot initiierte Nachrichten abfangen, wenn
  der Benutzer in letzter Zeit nicht interagiert hat.
- **Sprache wird nicht transkribiert:** Stellen Sie sicher, dass STT konfiguriert ist und der Anbieter erreichbar ist.

## Verwandt

- [Pairing](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Fehlerbehebung für Channel](/de/channels/troubleshooting)
