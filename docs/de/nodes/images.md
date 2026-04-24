---
read_when:
    - Medienpipeline oder Anhänge ändern
summary: Regeln zur Bild- und Medienverarbeitung für Send, Gateway und Agent-Antworten
title: Bild- und Medienunterstützung
x-i18n:
    generated_at: "2026-04-24T06:46:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26fa460f7dcdac9f15c9d79c3c3370adbce526da5cfa9a6825a8ed20b41e0a29
    source_path: nodes/images.md
    workflow: 15
---

# Bild- & Medienunterstützung (2025-12-05)

Der WhatsApp-Kanal läuft über **Baileys Web**. Dieses Dokument erfasst die aktuellen Regeln zur Medienverarbeitung für Send, Gateway und Agent-Antworten.

## Ziele

- Medien mit optionalen Bildunterschriften über `openclaw message send --media` senden.
- Automatische Antworten aus dem Web-Posteingang sollen Medien zusammen mit Text enthalten können.
- Grenzen pro Typ sinnvoll und vorhersehbar halten.

## CLI-Oberfläche

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` optional; die Bildunterschrift kann für reine Mediennachrichten leer sein.
  - `--dry-run` gibt die aufgelöste Nutzlast aus; `--json` gibt `{ channel, to, messageId, mediaUrl, caption }` aus.

## Verhalten des WhatsApp-Web-Kanals

- Eingabe: lokaler Dateipfad **oder** HTTP(S)-URL.
- Ablauf: in einen Buffer laden, Medientyp erkennen und die korrekte Nutzlast erstellen:
  - **Bilder:** auf JPEG verkleinern und neu komprimieren (längste Seite max. 2048 px), ausgerichtet auf `channels.whatsapp.mediaMaxMb` (Standard: 50 MB).
  - **Audio/Voice/Video:** unverändert bis 16 MB durchreichen; Audio wird als Sprachnachricht gesendet (`ptt: true`).
  - **Dokumente:** alles andere, bis 100 MB, wobei der Dateiname erhalten bleibt, wenn verfügbar.
- GIF-artige Wiedergabe in WhatsApp: Senden Sie ein MP4 mit `gifPlayback: true` (CLI: `--gif-playback`), damit mobile Clients es inline in Schleife abspielen.
- MIME-Erkennung bevorzugt Magic Bytes, dann Header, dann Dateiendung.
- Die Bildunterschrift stammt aus `--message` oder `reply.text`; eine leere Bildunterschrift ist zulässig.
- Logging: ohne verbose werden `↩️`/`✅` angezeigt; mit verbose zusätzlich Größe und Quellpfad/-URL.

## Auto-Reply-Pipeline

- `getReplyFromConfig` gibt `{ text?, mediaUrl?, mediaUrls? }` zurück.
- Wenn Medien vorhanden sind, löst der Web-Sender lokale Pfade oder URLs über dieselbe Pipeline auf wie `openclaw message send`.
- Mehrere Medieneinträge werden nacheinander gesendet, falls angegeben.

## Eingehende Medien für Befehle (Pi)

- Wenn eingehende Web-Nachrichten Medien enthalten, lädt OpenClaw sie in eine temporäre Datei herunter und stellt Templating-Variablen bereit:
  - `{{MediaUrl}}` Pseudo-URL für das eingehende Medium.
  - `{{MediaPath}}` lokaler temporärer Pfad, der vor dem Ausführen des Befehls geschrieben wird.
- Wenn eine Docker-Sandbox pro Sitzung aktiviert ist, werden eingehende Medien in den Workspace der Sandbox kopiert und `MediaPath`/`MediaUrl` in einen relativen Pfad wie `media/inbound/<filename>` umgeschrieben.
- Medienverständnis (wenn über `tools.media.*` oder gemeinsame `tools.media.models` konfiguriert) läuft vor dem Templating und kann Blöcke `[Image]`, `[Audio]` und `[Video]` in `Body` einfügen.
  - Audio setzt `{{Transcript}}` und verwendet das Transkript für das Parsen von Befehlen, sodass Slash-Commands weiterhin funktionieren.
  - Beschreibungen von Videos und Bildern behalten vorhandenen Caption-Text für das Parsen von Befehlen bei.
  - Wenn das aktive primäre Bildmodell Vision bereits nativ unterstützt, überspringt OpenClaw den Zusammenfassungsblock `[Image]` und übergibt stattdessen das Originalbild an das Modell.
- Standardmäßig wird nur der erste passende Anhang vom Typ Bild/Audio/Video verarbeitet; setzen Sie `tools.media.<cap>.attachments`, um mehrere Anhänge zu verarbeiten.

## Limits & Fehler

**Grenzen für ausgehendes Senden (WhatsApp-Web-Send)**

- Bilder: bis zu `channels.whatsapp.mediaMaxMb` (Standard: 50 MB) nach der Neukomprimierung.
- Audio/Sprachnachrichten/Video: Grenze 16 MB; Dokumente: 100 MB.
- Zu große oder nicht lesbare Medien → klarer Fehler in den Logs und die Antwort wird übersprungen.

**Grenzen für Medienverständnis (Transkription/Beschreibung)**

- Bild standardmäßig: 10 MB (`tools.media.image.maxBytes`).
- Audio standardmäßig: 20 MB (`tools.media.audio.maxBytes`).
- Video standardmäßig: 50 MB (`tools.media.video.maxBytes`).
- Zu große Medien überspringen das Verständnis, aber Antworten werden weiterhin mit dem ursprünglichen Body verarbeitet.

## Hinweise für Tests

- Send- + Reply-Flows für Bild-/Audio-/Dokumentfälle abdecken.
- Neukomprimierung für Bilder (Größenlimit) und Voice-Note-Flag für Audio validieren.
- Sicherstellen, dass Antworten mit mehreren Medien als aufeinanderfolgende Sends verteilt werden.

## Verwandt

- [Kameraaufnahme](/de/nodes/camera)
- [Medienverständnis](/de/nodes/media-understanding)
- [Audio und Sprachnachrichten](/de/nodes/audio)
