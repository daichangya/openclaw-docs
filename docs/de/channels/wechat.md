---
read_when:
    - Sie möchten OpenClaw mit WeChat oder Weixin verbinden
    - Sie installieren das Kanal-Plugin openclaw-weixin oder beheben dort Fehler
    - Sie müssen verstehen, wie externe Kanal-Plugins neben dem Gateway ausgeführt werden
summary: Einrichtung des WeChat-Kanals über das externe openclaw-weixin-Plugin
title: WeChat
x-i18n:
    generated_at: "2026-04-24T06:29:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ea7c815a364c2ae087041bf6de5b4182334c67377e18b9bedfa0f9d949afc09c
    source_path: channels/wechat.md
    workflow: 15
---

OpenClaw verbindet sich mit WeChat über das externe
Kanal-Plugin `@tencent-weixin/openclaw-weixin`.

Status: externes Plugin. Direktchats und Medien werden unterstützt. Gruppenchats werden
von den aktuellen Fähigkeitsmetadaten des Plugins nicht beworben.

## Benennung

- **WeChat** ist der nutzerseitige Name in dieser Dokumentation.
- **Weixin** ist der Name, der vom Tencent-Paket und von der Plugin-ID verwendet wird.
- `openclaw-weixin` ist die OpenClaw-Kanal-ID.
- `@tencent-weixin/openclaw-weixin` ist das npm-Paket.

Verwenden Sie `openclaw-weixin` in CLI-Befehlen und Konfigurationspfaden.

## Wie es funktioniert

Der WeChat-Code befindet sich nicht im OpenClaw-Core-Repository. OpenClaw stellt den
allgemeinen Kanal-Plugin-Vertrag bereit, und das externe Plugin stellt die
WeChat-spezifische Laufzeit bereit:

1. `openclaw plugins install` installiert `@tencent-weixin/openclaw-weixin`.
2. Das Gateway erkennt das Plugin-Manifest und lädt den Plugin-Einstiegspunkt.
3. Das Plugin registriert die Kanal-ID `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` startet die QR-Anmeldung.
5. Das Plugin speichert Kontozugangsdaten im OpenClaw-Statusverzeichnis.
6. Beim Start des Gateway startet das Plugin seinen Weixin-Monitor für jedes
   konfigurierte Konto.
7. Eingehende WeChat-Nachrichten werden über den Kanalvertrag normalisiert, an
   den ausgewählten OpenClaw-Agenten weitergeleitet und über den ausgehenden Pfad
   des Plugins zurückgesendet.

Diese Trennung ist wichtig: Der OpenClaw-Core sollte kanalagnostisch bleiben. WeChat-Anmeldung,
Tencent-iLink-API-Aufrufe, Medien-Upload/-Download, Kontext-Token und
Kontenüberwachung liegen in der Verantwortung des externen Plugins.

## Installation

Schnellinstallation:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Manuelle Installation:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Starten Sie das Gateway nach der Installation neu:

```bash
openclaw gateway restart
```

## Anmeldung

Führen Sie die QR-Anmeldung auf demselben Rechner aus, auf dem das Gateway läuft:

```bash
openclaw channels login --channel openclaw-weixin
```

Scannen Sie den QR-Code mit WeChat auf Ihrem Telefon und bestätigen Sie die Anmeldung. Das Plugin speichert
das Konto-Token nach einem erfolgreichen Scan lokal.

Um ein weiteres WeChat-Konto hinzuzufügen, führen Sie denselben Anmeldebefehl erneut aus. Bei mehreren
Konten isolieren Sie Direktnachrichten-Sitzungen nach Konto, Kanal und Absender:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Zugriffskontrolle

Direktnachrichten verwenden das normale OpenClaw-Modell für Pairing und Allowlists bei Kanal-Plugins.

Neue Absender freigeben:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Das vollständige Zugriffskontrollmodell finden Sie unter [Pairing](/de/channels/pairing).

## Kompatibilität

Das Plugin prüft beim Start die Version des Host-OpenClaw.

| Plugin-Linie | OpenClaw-Version       | npm-Tag |
| ------------ | ---------------------- | ------- |
| `2.x`        | `>=2026.3.22`          | `latest` |
| `1.x`        | `>=2026.1.0 <2026.3.22` | `legacy` |

Wenn das Plugin meldet, dass Ihre OpenClaw-Version zu alt ist, aktualisieren Sie entweder
OpenClaw oder installieren Sie die alte Plugin-Linie:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Sidecar-Prozess

Das WeChat-Plugin kann Hilfsarbeit neben dem Gateway ausführen, während es die
Tencent-iLink-API überwacht. In Issue #68451 legte dieser Helferpfad einen Fehler in OpenClaws
allgemeiner Bereinigung veralteter Gateways offen: Ein Kindprozess konnte versuchen, den übergeordneten
Gateway-Prozess zu bereinigen, was unter Prozessmanagern wie systemd zu Neustartschleifen führte.

Die aktuelle Startbereinigung von OpenClaw schließt den aktuellen Prozess und seine Vorfahren aus,
sodass ein Kanal-Helfer nicht das Gateway beenden darf, das ihn gestartet hat. Diese Korrektur ist
allgemein; sie ist kein WeChat-spezifischer Pfad im Core.

## Fehlerbehebung

Installation und Status prüfen:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Wenn der Kanal als installiert angezeigt wird, aber keine Verbindung herstellt, stellen Sie sicher, dass das Plugin
aktiviert ist, und starten Sie neu:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Wenn das Gateway nach dem Aktivieren von WeChat wiederholt neu startet, aktualisieren Sie sowohl OpenClaw als auch
das Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Vorübergehend deaktivieren:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Verwandte Dokumentation

- Kanalübersicht: [Chat-Kanäle](/de/channels)
- Pairing: [Pairing](/de/channels/pairing)
- Kanalweiterleitung: [Kanalweiterleitung](/de/channels/channel-routing)
- Plugin-Architektur: [Plugin-Architektur](/de/plugins/architecture)
- Kanal-Plugin-SDK: [Channel Plugin SDK](/de/plugins/sdk-channel-plugins)
- Externes Paket: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
