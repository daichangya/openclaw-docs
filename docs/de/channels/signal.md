---
read_when:
    - Einrichten der Signal-Unterstützung
    - Debuggen von Senden/Empfangen in Signal
summary: Signal-Unterstützung über signal-cli (JSON-RPC + SSE), Einrichtungswege und Nummernmodell
title: Signal
x-i18n:
    generated_at: "2026-04-05T12:36:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd855eb353aca6a1c2b04d14af0e3da079349297b54fa8243562c52b29118d9
    source_path: channels/signal.md
    workflow: 15
---

# Signal (signal-cli)

Status: externe CLI-Integration. Das Gateway kommuniziert mit `signal-cli` über HTTP JSON-RPC + SSE.

## Voraussetzungen

- OpenClaw ist auf Ihrem Server installiert (der Linux-Ablauf unten wurde unter Ubuntu 24 getestet).
- `signal-cli` ist auf dem Host verfügbar, auf dem das Gateway läuft.
- Eine Telefonnummer, die eine Verifizierungs-SMS empfangen kann (für den SMS-Registrierungsweg).
- Browserzugriff für das Signal-Captcha (`signalcaptchas.org`) während der Registrierung.

## Schnelle Einrichtung (für Einsteiger)

1. Verwenden Sie eine **separate Signal-Nummer** für den Bot (empfohlen).
2. Installieren Sie `signal-cli` (Java ist erforderlich, wenn Sie den JVM-Build verwenden).
3. Wählen Sie einen Einrichtungsweg:
   - **Weg A (QR-Verknüpfung):** `signal-cli link -n "OpenClaw"` und mit Signal scannen.
   - **Weg B (SMS-Registrierung):** Registrieren Sie eine dedizierte Nummer mit Captcha + SMS-Verifizierung.
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

| Feld        | Beschreibung                                      |
| ----------- | ------------------------------------------------- |
| `account`   | Bot-Telefonnummer im E.164-Format (`+15551234567`) |
| `cliPath`   | Pfad zu `signal-cli` (`signal-cli`, wenn auf `PATH`) |
| `dmPolicy`  | DM-Zugriffsrichtlinie (`pairing` empfohlen)       |
| `allowFrom` | Telefonnummern oder `uuid:<id>`-Werte, die DMs senden dürfen |

## Was es ist

- Signal-Kanal über `signal-cli` (nicht eingebettetes libsignal).
- Deterministisches Routing: Antworten gehen immer an Signal zurück.
- DMs teilen die Hauptsitzung des Agenten; Gruppen sind isoliert (`agent:<agentId>:signal:group:<groupId>`).

## Konfigurationsschreibvorgänge

Standardmäßig darf Signal durch `/config set|unset` ausgelöste Konfigurationsaktualisierungen schreiben (erfordert `commands.config: true`).

Deaktivieren mit:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Das Nummernmodell (wichtig)

- Das Gateway verbindet sich mit einem **Signal-Gerät** (dem `signal-cli`-Konto).
- Wenn Sie den Bot auf **Ihrem persönlichen Signal-Konto** ausführen, ignoriert er Ihre eigenen Nachrichten (Loop-Schutz).
- Für „Ich schreibe dem Bot und er antwortet“ verwenden Sie eine **separate Bot-Nummer**.

## Einrichtungsweg A: vorhandenes Signal-Konto verknüpfen (QR)

1. Installieren Sie `signal-cli` (JVM- oder nativer Build).
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

Unterstützung mehrerer Konten: Verwenden Sie `channels.signal.accounts` mit kontospezifischer Konfiguration und optionalem `name`. Siehe [`gateway/configuration`](/gateway/configuration-reference#multi-account-all-channels) für das gemeinsame Muster.

## Einrichtungsweg B: dedizierte Bot-Nummer registrieren (SMS, Linux)

Verwenden Sie dies, wenn Sie eine dedizierte Bot-Nummer statt der Verknüpfung eines bestehenden Signal-App-Kontos verwenden möchten.

1. Besorgen Sie sich eine Nummer, die SMS empfangen kann (oder Sprachverifizierung für Festnetzanschlüsse).
   - Verwenden Sie eine dedizierte Bot-Nummer, um Konto-/Sitzungskonflikte zu vermeiden.
2. Installieren Sie `signal-cli` auf dem Gateway-Host:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Wenn Sie den JVM-Build (`signal-cli-${VERSION}.tar.gz`) verwenden, installieren Sie zuerst JRE 25+.
Halten Sie `signal-cli` aktuell; Upstream weist darauf hin, dass ältere Releases brechen können, wenn sich die Signal-Server-APIs ändern.

3. Registrieren und verifizieren Sie die Nummer:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Wenn ein Captcha erforderlich ist:

1. Öffnen Sie `https://signalcaptchas.org/registration/generate.html`.
2. Schließen Sie das Captcha ab und kopieren Sie das Linkziel `signalcaptcha://...` aus „Open Signal“.
3. Führen Sie den Befehl möglichst von derselben externen IP wie die Browsersitzung aus.
4. Führen Sie die Registrierung sofort erneut aus (Captcha-Token laufen schnell ab):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Konfigurieren Sie OpenClaw, starten Sie das Gateway neu und überprüfen Sie den Kanal:

```bash
# Wenn Sie das Gateway als systemd-Benutzerdienst ausführen:
systemctl --user restart openclaw-gateway.service

# Dann überprüfen:
openclaw doctor
openclaw channels status --probe
```

5. Koppeln Sie Ihren DM-Absender:
   - Senden Sie eine beliebige Nachricht an die Bot-Nummer.
   - Genehmigen Sie den Code auf dem Server: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Speichern Sie die Bot-Nummer als Kontakt auf Ihrem Telefon, um „Unknown contact“ zu vermeiden.

Wichtig: Das Registrieren eines Telefonnummernkontos mit `signal-cli` kann die Authentifizierung der Haupt-Signal-App-Sitzung für diese Nummer aufheben. Bevorzugen Sie eine dedizierte Bot-Nummer oder verwenden Sie den QR-Verknüpfungsmodus, wenn Sie Ihre bestehende Telefon-App-Konfiguration beibehalten müssen.

Upstream-Referenzen:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha-Ablauf: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Verknüpfungsablauf: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Externer Daemon-Modus (httpUrl)

Wenn Sie `signal-cli` selbst verwalten möchten (langsame JVM-Kaltstarts, Container-Initialisierung oder gemeinsam genutzte CPUs), führen Sie den Daemon separat aus und verweisen Sie OpenClaw darauf:

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

Dadurch werden Auto-Start und die Startwartezeit innerhalb von OpenClaw übersprungen. Für langsame Starts bei automatischem Start setzen Sie `channels.signal.startupTimeoutMs`.

## Zugriffskontrolle (DMs + Gruppen)

DMs:

- Standard: `channels.signal.dmPolicy = "pairing"`.
- Unbekannte Absender erhalten einen Pairing-Code; Nachrichten werden ignoriert, bis sie freigegeben werden (Codes laufen nach 1 Stunde ab).
- Freigabe über:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pairing ist der Standard-Tokenaustausch für Signal-DMs. Details: [Pairing](/channels/pairing)
- Sender nur mit UUID (aus `sourceUuid`) werden als `uuid:<id>` in `channels.signal.allowFrom` gespeichert.

Gruppen:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` steuert, wer in Gruppen auslösen kann, wenn `allowlist` gesetzt ist.
- `channels.signal.groups["<group-id>" | "*"]` kann das Gruppenverhalten mit `requireMention`, `tools` und `toolsBySender` überschreiben.
- Verwenden Sie `channels.signal.accounts.<id>.groups` für kontospezifische Überschreibungen in Multi-Account-Setups.
- Laufzeithinweis: Wenn `channels.signal` vollständig fehlt, fällt die Laufzeit bei Gruppenprüfungen auf `groupPolicy="allowlist"` zurück (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

## So funktioniert es (Verhalten)

- `signal-cli` läuft als Daemon; das Gateway liest Ereignisse per SSE.
- Eingehende Nachrichten werden in den gemeinsamen Channel-Umschlag normalisiert.
- Antworten werden immer an dieselbe Nummer oder Gruppe zurückgeleitet.

## Medien + Limits

- Ausgehender Text wird auf `channels.signal.textChunkLimit` begrenzt (Standard 4000).
- Optionales Chunking nach Zeilenumbrüchen: Setzen Sie `channels.signal.chunkMode="newline"`, um vor dem Längen-Chunking an Leerzeilen (Absatzgrenzen) zu teilen.
- Anhänge werden unterstützt (base64 von `signal-cli` abgerufen).
- Standard-Medienlimit: `channels.signal.mediaMaxMb` (Standard 8).
- Verwenden Sie `channels.signal.ignoreAttachments`, um das Herunterladen von Medien zu überspringen.
- Der Gruppenverlaufskontext verwendet `channels.signal.historyLimit` (oder `channels.signal.accounts.*.historyLimit`) und fällt auf `messages.groupChat.historyLimit` zurück. Setzen Sie `0`, um ihn zu deaktivieren (Standard 50).

## Tippindikatoren + Lesebestätigungen

- **Tippindikatoren**: OpenClaw sendet Tipp-Signale über `signal-cli sendTyping` und aktualisiert sie, während eine Antwort läuft.
- **Lesebestätigungen**: Wenn `channels.signal.sendReadReceipts` auf true gesetzt ist, leitet OpenClaw Lesebestätigungen für erlaubte DMs weiter.
- Signal-cli stellt keine Lesebestätigungen für Gruppen bereit.

## Reaktionen (Nachrichtentool)

- Verwenden Sie `message action=react` mit `channel=signal`.
- Ziele: E.164 des Absenders oder UUID (verwenden Sie `uuid:<id>` aus der Pairing-Ausgabe; eine nackte UUID funktioniert ebenfalls).
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
  - `off`/`ack` deaktiviert Agentenreaktionen (das Nachrichtentool `react` gibt einen Fehler aus).
  - `minimal`/`extensive` aktiviert Agentenreaktionen und setzt die Stufe der Anleitung.
- Kontospezifische Überschreibungen: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Zustellungsziele (CLI/cron)

- DMs: `signal:+15551234567` (oder einfach E.164).
- UUID-DMs: `uuid:<id>` (oder nackte UUID).
- Gruppen: `signal:group:<groupId>`.
- Benutzernamen: `username:<name>` (falls von Ihrem Signal-Konto unterstützt).

## Fehlerbehebung

Führen Sie zuerst diese Abfolge aus:

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

- Daemon erreichbar, aber keine Antworten: Überprüfen Sie Konto-/Daemon-Einstellungen (`httpUrl`, `account`) und den Empfangsmodus.
- DMs werden ignoriert: Der Absender wartet auf Pairing-Freigabe.
- Gruppennachrichten werden ignoriert: Gruppenabsender-/Mention-Gating blockiert die Zustellung.
- Konfigurationsvalidierungsfehler nach Bearbeitungen: Führen Sie `openclaw doctor --fix` aus.
- Signal fehlt in der Diagnose: Stellen Sie sicher, dass `channels.signal.enabled: true` gesetzt ist.

Zusätzliche Prüfungen:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Für den Triage-Ablauf: [/channels/troubleshooting](/channels/troubleshooting).

## Sicherheitshinweise

- `signal-cli` speichert Kontoschlüssel lokal (typischerweise `~/.local/share/signal-cli/data/`).
- Sichern Sie den Status des Signal-Kontos vor einer Servermigration oder einem Neuaufbau.
- Behalten Sie `channels.signal.dmPolicy: "pairing"` bei, sofern Sie nicht ausdrücklich breiteren DM-Zugriff wünschen.
- Die SMS-Verifizierung wird nur für Registrierungs- oder Wiederherstellungsabläufe benötigt, aber ein Verlust der Kontrolle über Nummer/Konto kann die erneute Registrierung erschweren.

## Konfigurationsreferenz (Signal)

Vollständige Konfiguration: [Configuration](/gateway/configuration)

Provider-Optionen:

- `channels.signal.enabled`: Start des Kanals aktivieren/deaktivieren.
- `channels.signal.account`: E.164 für das Bot-Konto.
- `channels.signal.cliPath`: Pfad zu `signal-cli`.
- `channels.signal.httpUrl`: vollständige Daemon-URL (überschreibt Host/Port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: Daemon-Bindung (Standard 127.0.0.1:8080).
- `channels.signal.autoStart`: Daemon automatisch starten (Standard true, wenn `httpUrl` nicht gesetzt ist).
- `channels.signal.startupTimeoutMs`: Warte-Timeout für den Start in ms (Maximum 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: Download von Anhängen überspringen.
- `channels.signal.ignoreStories`: Stories vom Daemon ignorieren.
- `channels.signal.sendReadReceipts`: Lesebestätigungen weiterleiten.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (Standard: pairing).
- `channels.signal.allowFrom`: DM-Allowlist (E.164 oder `uuid:<id>`). `open` erfordert `"*"`. Signal hat keine Benutzernamen; verwenden Sie Telefon-/UUID-IDs.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (Standard: allowlist).
- `channels.signal.groupAllowFrom`: Absender-Allowlist für Gruppen.
- `channels.signal.groups`: Überschreibungen pro Gruppe, nach Signal-Gruppen-ID (oder `"*"`) indiziert. Unterstützte Felder: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: kontospezifische Version von `channels.signal.groups` für Multi-Account-Setups.
- `channels.signal.historyLimit`: maximale Anzahl an Gruppennachrichten, die als Kontext einbezogen werden (0 deaktiviert).
- `channels.signal.dmHistoryLimit`: DM-Verlaufslimit in Benutzerrunden. Überschreibungen pro Benutzer: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: Größe ausgehender Chunks (Zeichen).
- `channels.signal.chunkMode`: `length` (Standard) oder `newline`, um vor dem Längen-Chunking an Leerzeilen (Absatzgrenzen) zu teilen.
- `channels.signal.mediaMaxMb`: Limit für eingehende/ausgehende Medien (MB).

Verwandte globale Optionen:

- `agents.list[].groupChat.mentionPatterns` (Signal unterstützt keine nativen Erwähnungen).
- `messages.groupChat.mentionPatterns` (globaler Fallback).
- `messages.responsePrefix`.

## Verwandt

- [Channels Overview](/channels) — alle unterstützten Kanäle
- [Pairing](/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Channel Routing](/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/gateway/security) — Zugriffsmodell und Härtung
