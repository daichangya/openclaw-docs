---
read_when:
    - Kameraaufnahme auf iOS-/Android-Nodes oder macOS hinzufügen oder ändern
    - Agentenzugängliche MEDIA-Workflows mit temporären Dateien erweitern
summary: 'Kameraaufnahme (iOS-/Android-Nodes + macOS-App) zur Nutzung durch Agenten: Fotos (jpg) und kurze Videoclips (mp4)'
title: Kameraaufnahme
x-i18n:
    generated_at: "2026-04-24T06:46:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33e23a382cdcea57e20ab1466bf32e54dd17e3b7918841dbd6d3ebf59547ad93
    source_path: nodes/camera.md
    workflow: 15
---

OpenClaw unterstützt **Kameraaufnahme** für Agenten-Workflows:

- **iOS-Node** (über Gateway gepaart): Aufnahme eines **Fotos** (`jpg`) oder **kurzen Videoclips** (`mp4`, optional mit Audio) über `node.invoke`.
- **Android-Node** (über Gateway gepaart): Aufnahme eines **Fotos** (`jpg`) oder **kurzen Videoclips** (`mp4`, optional mit Audio) über `node.invoke`.
- **macOS-App** (Node über Gateway): Aufnahme eines **Fotos** (`jpg`) oder **kurzen Videoclips** (`mp4`, optional mit Audio) über `node.invoke`.

Jeder Kamerazugriff ist durch **benutzergesteuerte Einstellungen** geschützt.

## iOS-Node

### Benutzereinstellung (standardmäßig aktiviert)

- Reiter „Settings“ in iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - Standard: **ein** (fehlender Schlüssel wird als aktiviert behandelt).
  - Wenn ausgeschaltet: `camera.*`-Befehle geben `CAMERA_DISABLED` zurück.

### Befehle (über Gateway `node.invoke`)

- `camera.list`
  - Antwort-Payload:
    - `devices`: Array von `{ id, name, position, deviceType }`

- `camera.snap`
  - Parameter:
    - `facing`: `front|back` (Standard: `front`)
    - `maxWidth`: Zahl (optional; Standard `1600` auf dem iOS-Node)
    - `quality`: `0..1` (optional; Standard `0.9`)
    - `format`: derzeit `jpg`
    - `delayMs`: Zahl (optional; Standard `0`)
    - `deviceId`: Zeichenfolge (optional; aus `camera.list`)
  - Antwort-Payload:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Payload-Schutz: Fotos werden neu komprimiert, damit die Base64-Payload unter 5 MB bleibt.

- `camera.clip`
  - Parameter:
    - `facing`: `front|back` (Standard: `front`)
    - `durationMs`: Zahl (Standard `3000`, begrenzt auf maximal `60000`)
    - `includeAudio`: Boolean (Standard `true`)
    - `format`: derzeit `mp4`
    - `deviceId`: Zeichenfolge (optional; aus `camera.list`)
  - Antwort-Payload:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Vordergrund-Anforderung

Wie `canvas.*` erlaubt der iOS-Node `camera.*`-Befehle nur im **Vordergrund**. Aufrufe im Hintergrund geben `NODE_BACKGROUND_UNAVAILABLE` zurück.

### CLI-Helfer (temporäre Dateien + MEDIA)

Der einfachste Weg, Anhänge zu erhalten, ist der CLI-Helfer, der dekodierte Medien in eine temporäre Datei schreibt und `MEDIA:<path>` ausgibt.

Beispiele:

```bash
openclaw nodes camera snap --node <id>               # Standard: sowohl front als auch back (2 MEDIA-Zeilen)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Hinweise:

- `nodes camera snap` verwendet standardmäßig **beide** Richtungen, damit der Agent beide Ansichten erhält.
- Ausgabedateien sind temporär (im temporären Verzeichnis des Betriebssystems), sofern Sie keinen eigenen Wrapper erstellen.

## Android-Node

### Android-Benutzereinstellung (standardmäßig aktiviert)

- Android-Einstellungsblatt → **Camera** → **Allow Camera** (`camera.enabled`)
  - Standard: **ein** (fehlender Schlüssel wird als aktiviert behandelt).
  - Wenn ausgeschaltet: `camera.*`-Befehle geben `CAMERA_DISABLED` zurück.

### Berechtigungen

- Android erfordert Laufzeitberechtigungen:
  - `CAMERA` sowohl für `camera.snap` als auch für `camera.clip`.
  - `RECORD_AUDIO` für `camera.clip`, wenn `includeAudio=true`.

Wenn Berechtigungen fehlen, fordert die App sie nach Möglichkeit an; wenn sie verweigert werden, schlagen `camera.*`-Anfragen mit einem
Fehler `*_PERMISSION_REQUIRED` fehl.

### Android-Anforderung für den Vordergrund

Wie `canvas.*` erlaubt der Android-Node `camera.*`-Befehle nur im **Vordergrund**. Aufrufe im Hintergrund geben `NODE_BACKGROUND_UNAVAILABLE` zurück.

### Android-Befehle (über Gateway `node.invoke`)

- `camera.list`
  - Antwort-Payload:
    - `devices`: Array von `{ id, name, position, deviceType }`

### Payload-Schutz

Fotos werden neu komprimiert, damit die Base64-Payload unter 5 MB bleibt.

## macOS-App

### Benutzereinstellung (standardmäßig deaktiviert)

Die macOS-Begleit-App stellt ein Kontrollkästchen bereit:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Standard: **aus**
  - Wenn ausgeschaltet: Kameraanfragen geben „Camera disabled by user“ zurück.

### CLI-Helfer (node invoke)

Verwenden Sie die Haupt-CLI `openclaw`, um Kamera-Befehle auf dem macOS-Node aufzurufen.

Beispiele:

```bash
openclaw nodes camera list --node <id>            # Kamera-IDs auflisten
openclaw nodes camera snap --node <id>            # gibt MEDIA:<path> aus
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # gibt MEDIA:<path> aus
openclaw nodes camera clip --node <id> --duration-ms 3000      # gibt MEDIA:<path> aus (Legacy-Flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Hinweise:

- `openclaw nodes camera snap` verwendet standardmäßig `maxWidth=1600`, sofern nicht überschrieben.
- Unter macOS wartet `camera.snap` nach dem Aufwärmen/Einpendeln der Belichtung `delayMs` (Standard 2000ms), bevor aufgenommen wird.
- Foto-Payloads werden neu komprimiert, damit Base64 unter 5 MB bleibt.

## Sicherheit + praktische Grenzen

- Kamera- und Mikrofonzugriff lösen die üblichen Berechtigungsdialoge des Betriebssystems aus (und erfordern Usage-Strings in Info.plist).
- Videoclips sind begrenzt (derzeit `<= 60s`), um übergroße Node-Payloads zu vermeiden (Base64-Overhead + Nachrichtenlimits).

## macOS-Bildschirmvideo (auf OS-Ebene)

Für Bildschirmvideo (nicht Kamera) verwenden Sie die macOS-Begleit-App:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # gibt MEDIA:<path> aus
```

Hinweise:

- Erfordert unter macOS die Berechtigung **Screen Recording** (TCC).

## Verwandt

- [Bild- und Medienunterstützung](/de/nodes/images)
- [Medienverständnis](/de/nodes/media-understanding)
- [Standortbefehl](/de/nodes/location-command)
