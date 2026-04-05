---
read_when:
    - Hinzufügen oder Ändern der Kameraaufnahme auf iOS-/Android-Nodes oder macOS
    - Erweitern agentenzugänglicher MEDIA-Workflows mit temporären Dateien
summary: 'Kameraaufnahme (iOS-/Android-Nodes + macOS-App) zur Verwendung durch Agents: Fotos (jpg) und kurze Videoclips (mp4)'
title: Kameraaufnahme
x-i18n:
    generated_at: "2026-04-05T12:48:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30b1beaac9602ff29733f72b953065f271928743c8fff03191a007e8b965c88d
    source_path: nodes/camera.md
    workflow: 15
---

# Kameraaufnahme (Agent)

OpenClaw unterstützt **Kameraaufnahme** für Agent-Workflows:

- **iOS-Node** (über Gateway gekoppelt): Aufnahme eines **Fotos** (`jpg`) oder **kurzen Videoclips** (`mp4`, optional mit Audio) über `node.invoke`.
- **Android-Node** (über Gateway gekoppelt): Aufnahme eines **Fotos** (`jpg`) oder **kurzen Videoclips** (`mp4`, optional mit Audio) über `node.invoke`.
- **macOS-App** (Node über Gateway): Aufnahme eines **Fotos** (`jpg`) oder **kurzen Videoclips** (`mp4`, optional mit Audio) über `node.invoke`.

Jeder Kamerazugriff ist durch **benutzergesteuerte Einstellungen** abgesichert.

## iOS-Node

### Benutzereinstellung (standardmäßig an)

- iOS-Tab „Settings“ → **Camera** → **Allow Camera** (`camera.enabled`)
  - Standard: **an** (ein fehlender Schlüssel wird als aktiviert behandelt).
  - Wenn aus: `camera.*`-Befehle geben `CAMERA_DISABLED` zurück.

### Befehle (über Gateway `node.invoke`)

- `camera.list`
  - Antwort-Nutzlast:
    - `devices`: Array aus `{ id, name, position, deviceType }`

- `camera.snap`
  - Parameter:
    - `facing`: `front|back` (Standard: `front`)
    - `maxWidth`: Zahl (optional; Standard `1600` auf dem iOS-Node)
    - `quality`: `0..1` (optional; Standard `0.9`)
    - `format`: derzeit `jpg`
    - `delayMs`: Zahl (optional; Standard `0`)
    - `deviceId`: String (optional; aus `camera.list`)
  - Antwort-Nutzlast:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Nutzlast-Schutz: Fotos werden erneut komprimiert, damit die base64-Nutzlast unter 5 MB bleibt.

- `camera.clip`
  - Parameter:
    - `facing`: `front|back` (Standard: `front`)
    - `durationMs`: Zahl (Standard `3000`, auf maximal `60000` begrenzt)
    - `includeAudio`: Boolean (Standard `true`)
    - `format`: derzeit `mp4`
    - `deviceId`: String (optional; aus `camera.list`)
  - Antwort-Nutzlast:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Anforderung an den Vordergrund

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

- `nodes camera snap` verwendet standardmäßig **beide** Blickrichtungen, damit der Agent beide Ansichten erhält.
- Ausgabedateien sind temporär (im Temp-Verzeichnis des Betriebssystems), sofern Sie keinen eigenen Wrapper erstellen.

## Android-Node

### Android-Benutzereinstellung (standardmäßig an)

- Android-Einstellungsblatt → **Camera** → **Allow Camera** (`camera.enabled`)
  - Standard: **an** (ein fehlender Schlüssel wird als aktiviert behandelt).
  - Wenn aus: `camera.*`-Befehle geben `CAMERA_DISABLED` zurück.

### Berechtigungen

- Android erfordert Laufzeitberechtigungen:
  - `CAMERA` sowohl für `camera.snap` als auch für `camera.clip`.
  - `RECORD_AUDIO` für `camera.clip`, wenn `includeAudio=true`.

Wenn Berechtigungen fehlen, fordert die App nach Möglichkeit zur Genehmigung auf; wenn sie verweigert werden, schlagen `camera.*`-Anfragen mit einem Fehler `*_PERMISSION_REQUIRED` fehl.

### Android-Anforderung an den Vordergrund

Wie `canvas.*` erlaubt der Android-Node `camera.*`-Befehle nur im **Vordergrund**. Aufrufe im Hintergrund geben `NODE_BACKGROUND_UNAVAILABLE` zurück.

### Android-Befehle (über Gateway `node.invoke`)

- `camera.list`
  - Antwort-Nutzlast:
    - `devices`: Array aus `{ id, name, position, deviceType }`

### Nutzlast-Schutz

Fotos werden erneut komprimiert, damit die base64-Nutzlast unter 5 MB bleibt.

## macOS-App

### Benutzereinstellung (standardmäßig aus)

Die macOS-Begleit-App stellt ein Kontrollkästchen bereit:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Standard: **aus**
  - Wenn aus: Kameraanfragen geben „Camera disabled by user“ zurück.

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
openclaw nodes camera clip --node <id> --duration-ms 3000      # gibt MEDIA:<path> aus (veraltetes Flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Hinweise:

- `openclaw nodes camera snap` verwendet standardmäßig `maxWidth=1600`, sofern nicht überschrieben.
- Unter macOS wartet `camera.snap` nach dem Warm-up/der Stabilisierung der Belichtung `delayMs` (Standard 2000ms), bevor aufgenommen wird.
- Foto-Nutzlasten werden erneut komprimiert, damit base64 unter 5 MB bleibt.

## Sicherheit + praktische Grenzen

- Kamera- und Mikrofonzugriff lösen die üblichen Betriebssystem-Berechtigungsabfragen aus (und erfordern Usage-Strings in `Info.plist`).
- Videoclips sind begrenzt (derzeit `<= 60s`), um übergroße Node-Nutzlasten zu vermeiden (base64-Overhead + Nachrichtenlimits).

## macOS-Bildschirmvideo (auf Betriebssystemebene)

Für _Bildschirm_-Video (nicht Kamera) verwenden Sie die macOS-Begleit-App:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # gibt MEDIA:<path> aus
```

Hinweise:

- Erfordert die macOS-Berechtigung **Screen Recording** (TCC).
