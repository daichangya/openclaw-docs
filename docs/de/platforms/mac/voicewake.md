---
read_when:
    - Arbeiten an Voice-Wake- oder PTT-Pfaden
summary: Voice-Wake- und Push-to-Talk-Modi sowie Routing-Details in der mac-App
title: Voice-Wake (macOS)
x-i18n:
    generated_at: "2026-04-24T06:48:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0273c24764f0baf440a19f31435d6ee62ab040c1ec5a97d7733d3ec8b81b0641
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# Voice-Wake & Push-to-Talk

## Modi

- **Wake-Word-Modus** (Standard): Der immer aktive Speech-Recognizer wartet auf Trigger-Tokens (`swabbleTriggerWords`). Bei einem Treffer startet er die Aufnahme, zeigt das Overlay mit partiellem Text und sendet nach Stille automatisch.
- **Push-to-Talk (rechte Wahltaste halten)**: Halten Sie die rechte Wahltaste gedrückt, um die Aufnahme sofort zu starten — kein Trigger erforderlich. Das Overlay erscheint, solange die Taste gehalten wird; beim Loslassen wird finalisiert und nach einer kurzen Verzögerung weitergeleitet, damit Sie den Text noch anpassen können.

## Runtime-Verhalten (Wake-Word)

- Der Speech-Recognizer lebt in `VoiceWakeRuntime`.
- Der Trigger wird nur ausgelöst, wenn es zwischen dem Wake-Word und dem nächsten Wort eine **sinnvolle Pause** gibt (ca. 0,55 s Abstand). Das Overlay/Signal kann bereits bei der Pause beginnen, noch bevor der Befehl anfängt.
- Stillefenster: 2,0 s, wenn Sprache fließt, 5,0 s, wenn nur der Trigger gehört wurde.
- Harter Stopp: 120 s, um ausufernde Sitzungen zu verhindern.
- Debounce zwischen Sitzungen: 350 ms.
- Das Overlay wird über `VoiceWakeOverlayController` mit committed/volatile-Färbung gesteuert.
- Nach dem Senden startet der Recognizer sauber neu, um auf den nächsten Trigger zu warten.

## Invarianten des Lebenszyklus

- Wenn Voice Wake aktiviert ist und Berechtigungen gewährt wurden, sollte der Wake-Word-Recognizer lauschen (außer während einer expliziten Push-to-Talk-Aufnahme).
- Die Sichtbarkeit des Overlays (einschließlich manuellem Schließen über die X-Schaltfläche) darf niemals verhindern, dass der Recognizer die Arbeit wieder aufnimmt.

## Fehlerbild „hängendes Overlay“ (früher)

Früher konnte es so wirken, als sei Voice Wake „tot“, wenn das Overlay sichtbar hängen blieb und Sie es manuell schlossen, weil der Neustartversuch der Runtime durch die Sichtbarkeit des Overlays blockiert werden konnte und kein weiterer Neustart geplant wurde.

Härtung:

- Der Neustart der Wake-Runtime wird nicht mehr durch die Sichtbarkeit des Overlays blockiert.
- Der Abschluss des Schließens des Overlays löst über `VoiceSessionCoordinator` ein `VoiceWakeRuntime.refresh(...)` aus, sodass ein manuelles Schließen über X das Lauschen immer wieder aufnimmt.

## Besonderheiten von Push-to-Talk

- Die Erkennung des Hotkeys verwendet einen globalen `.flagsChanged`-Monitor für **rechte Wahltaste** (`keyCode 61` + `.option`). Wir beobachten Ereignisse nur (ohne sie zu verschlucken).
- Die Aufnahme-Pipeline lebt in `VoicePushToTalk`: Sie startet Speech sofort, streamt partielle Ergebnisse an das Overlay und ruft beim Loslassen `VoiceWakeForwarder` auf.
- Wenn Push-to-Talk startet, pausieren wir die Wake-Word-Runtime, um konkurrierende Audio-Taps zu vermeiden; sie startet nach dem Loslassen automatisch neu.
- Berechtigungen: Erfordert Mikrofon + Speech; zum Erkennen von Ereignissen ist die Freigabe für Bedienungshilfen/Input Monitoring nötig.
- Externe Tastaturen: Manche stellen die rechte Wahltaste möglicherweise nicht wie erwartet bereit — bieten Sie einen Fallback-Shortcut an, wenn Benutzer Aussetzer melden.

## Benutzerseitige Einstellungen

- Schalter **Voice Wake**: aktiviert die Wake-Word-Runtime.
- **Cmd+Fn halten, um zu sprechen**: aktiviert den Push-to-Talk-Monitor. Unter macOS < 26 deaktiviert.
- Sprach- und Mikrofonauswahl, Live-Pegelanzeige, Triggerwort-Tabelle, Tester (nur lokal; leitet nicht weiter).
- Die Mikrofonauswahl behält die letzte Auswahl bei, wenn ein Gerät getrennt wird, zeigt einen Hinweis auf die Trennung und fällt vorübergehend auf das Systemstandardgerät zurück, bis es wieder verfügbar ist.
- **Sounds**: Signaltöne bei Trigger-Erkennung und beim Senden; standardmäßig der macOS-Systemton „Glass“. Sie können für jedes Ereignis jede von `NSSound` ladbare Datei wählen (z. B. MP3/WAV/AIFF) oder **No Sound** auswählen.

## Weiterleitungsverhalten

- Wenn Voice Wake aktiviert ist, werden Transkripte an das aktive Gateway/den aktiven Agenten weitergeleitet (derselbe lokale bzw. Remote-Modus, den auch der Rest der mac-App verwendet).
- Antworten werden an den **zuletzt verwendeten Haupt-Provider** zugestellt (WhatsApp/Telegram/Discord/WebChat). Wenn die Zustellung fehlschlägt, wird der Fehler protokolliert und der Lauf bleibt dennoch über WebChat/Sitzungslogs sichtbar.

## Payload der Weiterleitung

- `VoiceWakeForwarder.prefixedTranscript(_:)` stellt dem Transkript vor dem Senden den Rechnerhinweis voran. Wird gemeinsam von den Wake-Word- und Push-to-Talk-Pfaden verwendet.

## Schnelle Verifizierung

- Aktivieren Sie Push-to-Talk, halten Sie Cmd+Fn, sprechen Sie, lassen Sie los: Das Overlay sollte partielle Ergebnisse zeigen und dann senden.
- Während des Haltens sollten die Ohren in der Menüleiste vergrößert bleiben (verwendet `triggerVoiceEars(ttl:nil)`); nach dem Loslassen fallen sie wieder zurück.

## Verwandt

- [Voice wake](/de/nodes/voicewake)
- [Voice-Overlay](/de/platforms/mac/voice-overlay)
- [macOS-App](/de/platforms/macos)
