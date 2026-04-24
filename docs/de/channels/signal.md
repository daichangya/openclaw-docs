---
read_when:
    - Einrichten der Signal-Unterstützung
    - Fehlerbehebung beim Senden/Empfangen mit Signal
summary: Signal-Unterstützung über signal-cli (JSON-RPC + SSE), Einrichtungswege und Nummernmodell
title: Signal
x-i18n:
    generated_at: "2026-04-24T06:28:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8fb4f08f8607dbe923fdc24d9599623165e1f1268c7fc48ecb457ce3d61172d2
    source_path: channels/signal.md
    workflow: 15
---

# Signal (signal-cli)

Status: externe CLI-Integration. Das Gateway kommuniziert mit `signal-cli` über HTTP-JSON-RPC + SSE.

## Voraussetzungen

- OpenClaw ist auf Ihrem Server installiert (der unten beschriebene Linux-Ablauf wurde unter Ubuntu 24 getestet).
- `signal-cli` ist auf dem Host verfügbar, auf dem das Gateway läuft.
- Eine Telefonnummer, die eine einmalige Verifizierungs-SMS empfangen kann (für den SMS-Registrierungspfad).
- Browserzugriff für das Signal-Captcha (`signalcaptchas.org`) während der Registrierung.

## Schnelleinrichtung (für Einsteiger)

1. Verwenden Sie eine **separate Signal-Nummer** für den Bot (empfohlen).
2. Installieren Sie `signal-cli` (Java ist erforderlich, wenn Sie die JVM-Build verwenden).
3. Wählen Sie einen Einrichtungsweg:
   - **Pfad A (QR-Verknüpfung):** `signal-cli link -n "OpenClaw"` und mit Signal scannen.
   - **Pfad B (SMS-Registrierung):** Registrieren Sie eine dedizierte Nummer mit Captcha + SMS-Verifizierung.
4. Konfigurieren Sie OpenClaw und starten Sie das Gateway neu.
5. Senden Sie eine erste DM und genehmigen Sie das Pairing (`openclaw pairing approve signal <CODE>`).

Minimale Konfiguration:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Feldreferenz:

| Feld        | Beschreibung                                          |
| ----------- | ----------------------------------------------------- |
| `account`   | Bot-Telefonnummer im E.164-Format (`+15551234567`)    |
| `cliPath`   | Pfad zu `signal-cli` (`signal-cli`, wenn auf `PATH`)  |
| `dmPolicy`  | DM-Zugriffsrichtlinie (`pairing` empfohlen)           |
| `allowFrom` | Telefonnummern oder `uuid:<id>`-Werte, die DMs senden dürfen |

## Was es ist

- Signal-Kanal über `signal-cli` (nicht eingebettetes libsignal).
- Deterministisches Routing: Antworten gehen immer an Signal zurück.
- DMs teilen sich die Hauptsitzung des Agenten; Gruppen sind isoliert (`agent:<agentId>:signal:group:<groupId>`).

## Konfigurationsschreibvorgänge

Standardmäßig darf Signal Konfigurationsaktualisierungen schreiben, die durch `/config set|unset` ausgelöst werden (erfordert `commands.config: true`).

Deaktivieren mit:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Das Nummernmodell (wichtig)

- Das Gateway verbindet sich mit einem **Signal-Gerät** (dem `signal-cli`-Konto).
- Wenn Sie den Bot auf **Ihrem persönlichen Signal-Konto** ausführen, ignoriert er Ihre eigenen Nachrichten (Schleifenschutz).
- Für „Ich schreibe dem Bot und er antwortet“ verwenden Sie eine **separate Bot-Nummer**.

## Einrichtungsweg A: Bestehendes Signal-Konto verknüpfen (QR)

1. Installieren Sie `signal-cli` (JVM- oder native Build).
2. Verknüpfen Sie ein Bot-Konto:
   - `signal-cli link -n "OpenClaw"` und scannen Sie dann den QR-Code in Signal.
3. Konfigurieren Sie Signal und starten Sie das Gateway.

Beispiel:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Unterstützung für mehrere Konten: Verwenden Sie `channels.signal.accounts` mit kontospezifischer Konfiguration und optionalem `name`. Das gemeinsame Muster finden Sie unter [`gateway/configuration`](/de/gateway/config-channels#multi-account-all-channels).

## Einrichtungsweg B: Dedizierte Bot-Nummer registrieren (SMS, Linux)

Verwenden Sie dies, wenn Sie eine dedizierte Bot-Nummer möchten, anstatt ein bestehendes Signal-App-Konto zu verknüpfen.

1. Besorgen Sie sich eine Nummer, die SMS empfangen kann (oder Sprachverifizierung bei Festnetzanschlüssen).
   - Verwenden Sie eine dedizierte Bot-Nummer, um Konto-/Sitzungskonflikte zu vermeiden.
2. Installieren Sie `signal-cli` auf dem Gateway-Host:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Wenn Sie die JVM-Build verwenden (`signal-cli-${VERSION}.tar.gz`), installieren Sie zuerst JRE 25+.
Halten Sie `signal-cli` aktuell; Upstream weist darauf hin, dass alte Releases brechen können, wenn sich die Signal-Server-APIs ändern.

3. Registrieren und verifizieren Sie die Nummer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Wenn ein Captcha erforderlich ist:

1. Öffnen Sie `https://signalcaptchas.org/registration/generate.html`.
2. Schließen Sie das Captcha ab und kopieren Sie das Linkziel `signalcaptcha://...` aus „Open Signal“.
3. Führen Sie dies nach Möglichkeit mit derselben externen IP aus wie die Browsersitzung.
4. Führen Sie die Registrierung sofort erneut aus (Captcha-Tokens laufen schnell ab):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Konfigurieren Sie OpenClaw, starten Sie das Gateway neu und prüfen Sie den Kanal:

```bash
# Wenn Sie das Gateway als systemd-Benutzerdienst ausführen:
systemctl --user restart openclaw-gateway.service

# Dann prüfen:
openclaw doctor
openclaw channels status --probe
```

5. Pairen Sie Ihren DM-Absender:
   - Senden Sie eine beliebige Nachricht an die Bot-Nummer.
   - Genehmigen Sie den Code auf dem Server: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Speichern Sie die Bot-Nummer als Kontakt auf Ihrem Telefon, um „Unknown contact“ zu vermeiden.

Wichtig: Die Registrierung eines Telefonkontos mit `signal-cli` kann die Haupt-App-Sitzung von Signal für diese Nummer deauthentifizieren. Bevorzugen Sie eine dedizierte Bot-Nummer oder verwenden Sie den QR-Verknüpfungsmodus, wenn Sie Ihre bestehende Telefon-App-Einrichtung beibehalten müssen.

Upstream-Referenzen:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha-Ablauf: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Verknüpfungsablauf: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Externer Daemon-Modus (httpUrl)

Wenn Sie `signal-cli` selbst verwalten möchten (langsame JVM-Kaltstarts, Container-Initialisierung oder geteilte CPUs), führen Sie den Daemon separat aus und verweisen Sie OpenClaw darauf:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

Dadurch werden automatisches Starten und die Startwartezeit innerhalb von OpenClaw übersprungen. Bei langsamen Starts mit automatischem Starten setzen Sie `channels.signal.startupTimeoutMs`.

## Zugriffskontrolle (DMs + Gruppen)

DMs:

- Standard: `channels.signal.dmPolicy = "pairing"`.
- Unbekannte Absender erhalten einen Pairing-Code; Nachrichten werden ignoriert, bis sie genehmigt werden (Codes verfallen nach 1 Stunde).
- Freigabe über:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pairing ist der standardmäßige Token-Austausch für Signal-DMs. Details: [Pairing](/de/channels/pairing)
- Absender nur mit UUID (aus `sourceUuid`) werden als `uuid:<id>` in `channels.signal.allowFrom` gespeichert.

Gruppen:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` steuert, wer in Gruppen auslösen darf, wenn `allowlist` gesetzt ist.
- `channels.signal.groups["<group-id>" | "*"]` kann das Gruppenverhalten mit `requireMention`, `tools` und `toolsBySender` überschreiben.
- Verwenden Sie `channels.signal.accounts.<id>.groups` für kontospezifische Überschreibungen in Mehrkonto-Setups.
- Laufzeithinweis: Wenn `channels.signal` vollständig fehlt, greift die Laufzeit für Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

## Wie es funktioniert (Verhalten)

- `signal-cli` läuft als Daemon; das Gateway liest Ereignisse über SSE.
- Eingehende Nachrichten werden in den gemeinsamen Kanalumschlag normalisiert.
- Antworten werden immer an dieselbe Nummer oder Gruppe zurückgeleitet.

## Medien + Limits

- Ausgehender Text wird auf `channels.signal.textChunkLimit` aufgeteilt (Standard 4000).
- Optionales Newline-Chunking: Setzen Sie `channels.signal.chunkMode="newline"`, um vor dem längenbasierten Chunking an Leerzeilen (Absatzgrenzen) zu trennen.
- Anhänge werden unterstützt (base64 von `signal-cli` abgerufen).
- Standardgrenze für Medien: `channels.signal.mediaMaxMb` (Standard 8).
- Verwenden Sie `channels.signal.ignoreAttachments`, um das Herunterladen von Medien zu überspringen.
- Der Gruppenverlaufs-Kontext verwendet `channels.signal.historyLimit` (oder `channels.signal.accounts.*.historyLimit`) und greift andernfalls auf `messages.groupChat.historyLimit` zurück. Setzen Sie `0`, um dies zu deaktivieren (Standard 50).

## Tippindikatoren + Lesebestätigungen

- **Tippindikatoren**: OpenClaw sendet Tipp-Signale über `signal-cli sendTyping` und aktualisiert sie, während eine Antwort läuft.
- **Lesebestätigungen**: Wenn `channels.signal.sendReadReceipts` auf true gesetzt ist, leitet OpenClaw Lesebestätigungen für erlaubte DMs weiter.
- Signal-cli stellt keine Lesebestätigungen für Gruppen bereit.

## Reaktionen (message-Tool)

- Verwenden Sie `message action=react` mit `channel=signal`.
- Ziele: Absender-E.164 oder UUID (verwenden Sie `uuid:<id>` aus der Pairing-Ausgabe; eine UUID ohne Präfix funktioniert ebenfalls).
- `messageId` ist der Signal-Zeitstempel der Nachricht, auf die Sie reagieren.
- Gruppenreaktionen erfordern `targetAuthor` oder `targetAuthorUuid`.

Beispiele:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Konfiguration:

- `channels.signal.actions.reactions`: Reaktionsaktionen aktivieren/deaktivieren (Standard true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` deaktiviert Agent-Reaktionen (das `react`-message-Tool gibt einen Fehler zurück).
  - `minimal`/`extensive` aktiviert Agent-Reaktionen und legt die Guidance-Stufe fest.
- Kontospezifische Überschreibungen: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Zustellungsziele (CLI/Cron)

- DMs: `signal:+15551234567` (oder schlicht E.164).
- UUID-DMs: `uuid:<id>` (oder UUID ohne Präfix).
- Gruppen: `signal:group:<groupId>`.
- Benutzernamen: `username:<name>` (wenn von Ihrem Signal-Konto unterstützt).

## Fehlerbehebung

Führen Sie zuerst diese Stufen aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Prüfen Sie dann bei Bedarf den DM-Pairing-Status:

```bash
openclaw pairing list signal
```

Häufige Fehler:

- Daemon erreichbar, aber keine Antworten: Prüfen Sie Konto-/Daemon-Einstellungen (`httpUrl`, `account`) und den Empfangsmodus.
- DMs werden ignoriert: Der Absender wartet noch auf die Genehmigung des Pairing.
- Gruppennachrichten werden ignoriert: Gruppen-Absender-/Mention-Gating blockiert die Zustellung.
- Fehler bei der Konfigurationsvalidierung nach Bearbeitungen: Führen Sie `openclaw doctor --fix` aus.
- Signal fehlt in der Diagnose: Stellen Sie sicher, dass `channels.signal.enabled: true` gesetzt ist.

Zusätzliche Prüfungen:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Für den Triage-Ablauf: [/channels/troubleshooting](/de/channels/troubleshooting).

## Sicherheitshinweise

- `signal-cli` speichert Kontoschlüssel lokal (typischerweise `~/.local/share/signal-cli/data/`).
- Sichern Sie den Zustand des Signal-Kontos vor einer Servermigration oder einem Neuaufbau.
- Behalten Sie `channels.signal.dmPolicy: "pairing"` bei, sofern Sie nicht ausdrücklich breiteren DM-Zugriff wünschen.
- Eine SMS-Verifizierung ist nur für Registrierungs- oder Wiederherstellungsabläufe erforderlich, aber der Verlust der Kontrolle über die Nummer/das Konto kann die erneute Registrierung erschweren.

## Konfigurationsreferenz (Signal)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

Provider-Optionen:

- `channels.signal.enabled`: Kanalstart aktivieren/deaktivieren.
- `channels.signal.account`: E.164 für das Bot-Konto.
- `channels.signal.cliPath`: Pfad zu `signal-cli`.
- `channels.signal.httpUrl`: vollständige Daemon-URL (überschreibt Host/Port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: Daemon-Bindung (Standard 127.0.0.1:8080).
- `channels.signal.autoStart`: Daemon automatisch starten (Standard true, wenn `httpUrl` nicht gesetzt ist).
- `channels.signal.startupTimeoutMs`: Timeout für die Startwartezeit in ms (Obergrenze 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: Herunterladen von Anhängen überspringen.
- `channels.signal.ignoreStories`: Stories vom Daemon ignorieren.
- `channels.signal.sendReadReceipts`: Lesebestätigungen weiterleiten.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing).
- `channels.signal.allowFrom`: DM-Allowlist (E.164 oder `uuid:<id>`). `open` erfordert `"*"`. Signal hat keine Benutzernamen; verwenden Sie Telefon-/UUID-IDs.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (Standard: allowlist).
- `channels.signal.groupAllowFrom`: Gruppen-Absender-Allowlist.
- `channels.signal.groups`: Überschreibungen pro Gruppe, indiziert nach Signal-Gruppen-ID (oder `"*"`). Unterstützte Felder: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: kontospezifische Version von `channels.signal.groups` für Mehrkonto-Setups.
- `channels.signal.historyLimit`: maximale Anzahl von Gruppennachrichten, die als Kontext aufgenommen werden (0 deaktiviert).
- `channels.signal.dmHistoryLimit`: DM-Verlaufslimit in Benutzerdurchläufen. Überschreibungen pro Benutzer: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: Größe ausgehender Chunks (Zeichen).
- `channels.signal.chunkMode`: `length` (Standard) oder `newline`, um vor dem längenbasierten Chunking an Leerzeilen (Absatzgrenzen) zu trennen.
- `channels.signal.mediaMaxMb`: Obergrenze für ein-/ausgehende Medien (MB).

Verwandte globale Optionen:

- `agents.list[].groupChat.mentionPatterns` (Signal unterstützt keine nativen Mentions).
- `messages.groupChat.mentionPatterns` (globaler Fallback).
- `messages.responsePrefix`.

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Kanalweiterleitung](/de/channels/channel-routing) — Sitzungsweiterleitung für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
