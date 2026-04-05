---
read_when:
    - Die Medienpipeline oder Anhänge ändern
summary: Regeln für Bild- und Medienverarbeitung für Send, Gateway und Agent-Antworten
title: Bild- und Medienunterstützung
x-i18n:
    generated_at: "2026-04-05T12:48:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3bb372b45a3bae51eae03b41cb22c4cde144675a54ddfd12e01a96132e48a8a
    source_path: nodes/images.md
    workflow: 15
---

# Bild- und Medienunterstützung (2025-12-05)

Der WhatsApp-Channel läuft über **Baileys Web**. Dieses Dokument beschreibt die aktuellen Regeln für die Medienverarbeitung bei Send, Gateway und Agent-Antworten.

## Ziele

- Medien mit optionalen Bildunterschriften über `openclaw message send --media` senden.
- Auto-Antworten aus dem Web-Posteingang erlauben, Medien zusammen mit Text zu enthalten.
- Grenzwerte pro Typ sinnvoll und vorhersehbar halten.

## CLI-Oberfläche

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` optional; die Bildunterschrift kann für reine Mediensendungen leer sein.
  - `--dry-run` gibt die aufgelöste Nutzlast aus; `--json` gibt `{ channel, to, messageId, mediaUrl, caption }` aus.

## Verhalten des WhatsApp-Web-Channels

- Eingabe: lokaler Dateipfad **oder** HTTP(S)-URL.
- Ablauf: In einen Buffer laden, Medientyp erkennen und die richtige Nutzlast erstellen:
  - **Bilder:** auf JPEG skalieren und neu komprimieren (maximale Seitenlänge 2048 px) mit Zielwert `channels.whatsapp.mediaMaxMb` (Standard: 50 MB).
  - **Audio/Sprachnachrichten/Videos:** unverändert durchreichen bis 16 MB; Audio wird als Sprachnachricht gesendet (`ptt: true`).
  - **Dokumente:** alles andere, bis 100 MB, wobei der Dateiname nach Möglichkeit erhalten bleibt.
- GIF-ähnliche Wiedergabe in WhatsApp: Ein MP4 mit `gifPlayback: true` senden (CLI: `--gif-playback`), damit mobile Clients es inline in Schleife abspielen.
- MIME-Erkennung bevorzugt Magic Bytes, dann Header, dann Dateiendung.
- Die Bildunterschrift stammt aus `--message` oder `reply.text`; eine leere Bildunterschrift ist erlaubt.
- Logging: Nicht-ausführlich zeigt `↩️`/`✅`; ausführlich enthält Größe und Quellpfad/-URL.

## Auto-Reply-Pipeline

- `getReplyFromConfig` gibt `{ text?, mediaUrl?, mediaUrls? }` zurück.
- Wenn Medien vorhanden sind, löst der Web-Sender lokale Pfade oder URLs mit derselben Pipeline auf wie `openclaw message send`.
- Wenn mehrere Medieneinträge angegeben sind, werden sie nacheinander gesendet.

## Eingehende Medien für Befehle (Pi)

- Wenn eingehende Web-Nachrichten Medien enthalten, lädt OpenClaw sie in eine temporäre Datei herunter und stellt Templating-Variablen bereit:
  - `{{MediaUrl}}` Pseudo-URL für das eingehende Medium.
  - `{{MediaPath}}` lokaler temporärer Pfad, der vor dem Ausführen des Befehls geschrieben wird.
- Wenn eine Docker-Sandbox pro Sitzung aktiviert ist, werden eingehende Medien in den Sandbox-Workspace kopiert und `MediaPath`/`MediaUrl` zu einem relativen Pfad wie `media/inbound/<filename>` umgeschrieben.
- Medienverständnis (wenn über `tools.media.*` oder gemeinsame `tools.media.models` konfiguriert) läuft vor dem Templating und kann `[Image]`-, `[Audio]`- und `[Video]`-Blöcke in `Body` einfügen.
  - Audio setzt `{{Transcript}}` und verwendet das Transkript für das Befehlsparsing, sodass Slash-Befehle weiterhin funktionieren.
  - Video- und Bildbeschreibungen behalten vorhandenen Bildunterschriftentext für das Befehlsparsing bei.
  - Wenn das aktive primäre Bildmodell Vision bereits nativ unterstützt, überspringt OpenClaw den Zusammenfassungsblock `[Image]` und übergibt stattdessen das Originalbild an das Modell.
- Standardmäßig wird nur der erste passende Bild-/Audio-/Video-Anhang verarbeitet; setzen Sie `tools.media.<cap>.attachments`, um mehrere Anhänge zu verarbeiten.

## Limits und Fehler

**Grenzwerte für ausgehende Sendungen (WhatsApp-Web-Sendungen)**

- Bilder: bis `channels.whatsapp.mediaMaxMb` (Standard: 50 MB) nach der Neukomprimierung.
- Audio/Sprachnachrichten/Videos: Grenze 16 MB; Dokumente: 100 MB.
- Zu große oder unlesbare Medien → klarer Fehler in den Logs und die Antwort wird übersprungen.

**Grenzwerte für Medienverständnis (Transkription/Beschreibung)**

- Bildstandard: 10 MB (`tools.media.image.maxBytes`).
- Audiostandard: 20 MB (`tools.media.audio.maxBytes`).
- Videostandard: 50 MB (`tools.media.video.maxBytes`).
- Zu große Medien überspringen das Verständnis, aber Antworten werden weiterhin mit dem ursprünglichen Body verarbeitet.

## Hinweise für Tests

- Send- und Antwort-Abläufe für Bild-/Audio-/Dokument-Fälle abdecken.
- Neukomprimierung bei Bildern validieren (Größenbegrenzung) und das Flag für Sprachnachrichten bei Audio.
- Sicherstellen, dass Antworten mit mehreren Medien als aufeinanderfolgende Sendungen aufgefächert werden.
