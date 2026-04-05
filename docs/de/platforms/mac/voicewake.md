---
read_when:
    - Arbeiten an Pfaden für Sprachaktivierung oder PTT
summary: Sprachaktivierung und Push-to-Talk-Modi plus Routing-Details in der Mac-App
title: Sprachaktivierung (macOS)
x-i18n:
    generated_at: "2026-04-05T12:50:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: fed6524a2e1fad5373d34821c920b955a2b5a3fcd9c51cdb97cf4050536602a7
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# Sprachaktivierung & Push-to-Talk

## Modi

- **Wake-Word-Modus** (Standard): Der ständig aktive Speech-Recognizer wartet auf Auslösetoken (`swabbleTriggerWords`). Bei einer Übereinstimmung startet er die Erfassung, zeigt das Overlay mit Teiltext an und sendet nach Stille automatisch.
- **Push-to-Talk (rechte Wahltaste halten)**: Halte die rechte Wahltaste gedrückt, um die Erfassung sofort zu starten – kein Auslöser erforderlich. Das Overlay erscheint, solange die Taste gehalten wird; beim Loslassen wird finalisiert und nach einer kurzen Verzögerung weitergeleitet, damit du den Text noch anpassen kannst.

## Laufzeitverhalten (Wake-Word)

- Der Speech-Recognizer befindet sich in `VoiceWakeRuntime`.
- Der Auslöser wird nur aktiviert, wenn zwischen dem Wake-Word und dem nächsten Wort eine **deutliche Pause** liegt (Abstand von etwa 0,55 s). Das Overlay/Signal kann bei der Pause schon starten, noch bevor der Befehl beginnt.
- Stillefenster: 2,0 s, wenn Sprache fließt, 5,0 s, wenn nur der Auslöser gehört wurde.
- Harte Begrenzung: 120 s, um außer Kontrolle geratene Sitzungen zu verhindern.
- Entprellung zwischen Sitzungen: 350 ms.
- Das Overlay wird über `VoiceWakeOverlayController` mit committed/volatile-Färbung gesteuert.
- Nach dem Senden startet der Recognizer sauber neu, um auf den nächsten Auslöser zu warten.

## Invarianten im Lebenszyklus

- Wenn Sprachaktivierung aktiviert ist und Berechtigungen erteilt wurden, sollte der Wake-Word-Recognizer lauschen (außer während einer expliziten Push-to-Talk-Erfassung).
- Die Sichtbarkeit des Overlays, einschließlich des manuellen Schließens über die X-Schaltfläche, darf niemals verhindern, dass der Recognizer das Lauschen wieder aufnimmt.

## Fehlermodus bei festhängendem Overlay (früher)

Früher konnte Sprachaktivierung „tot“ wirken, wenn das Overlay sichtbar hängen blieb und du es manuell geschlossen hast, weil der Neustartversuch der Runtime durch die Sichtbarkeit des Overlays blockiert werden konnte und kein weiterer Neustart geplant wurde.

Härtung:

- Der Neustart der Wake-Runtime wird nicht mehr durch die Sichtbarkeit des Overlays blockiert.
- Das Abschließen des Schließens des Overlays löst über `VoiceSessionCoordinator` ein `VoiceWakeRuntime.refresh(...)` aus, sodass ein manuelles Schließen per X das Lauschen immer wieder aufnimmt.

## Push-to-Talk-spezifische Details

- Die Hotkey-Erkennung verwendet einen globalen `.flagsChanged`-Monitor für **rechte Wahltaste** (`keyCode 61` + `.option`). Wir beobachten Ereignisse nur (ohne sie zu unterdrücken).
- Die Erfassungspipeline befindet sich in `VoicePushToTalk`: startet Speech sofort, streamt Teiltexte an das Overlay und ruft bei Freigabe `VoiceWakeForwarder` auf.
- Wenn Push-to-Talk startet, pausieren wir die Wake-Word-Runtime, um konkurrierende Audio-Taps zu vermeiden; nach dem Loslassen startet sie automatisch neu.
- Berechtigungen: erfordert Mikrofon + Speech; zum Erkennen von Ereignissen ist die Freigabe für Bedienungshilfen/Input Monitoring erforderlich.
- Externe Tastaturen: Manche stellen rechte Wahltaste möglicherweise nicht wie erwartet bereit – biete einen Fallback-Kurzbefehl an, wenn Benutzer über Aussetzer berichten.

## Benutzersichtbare Einstellungen

- Umschalter **Sprachaktivierung**: aktiviert die Wake-Word-Runtime.
- **Cmd+Fn halten, um zu sprechen**: aktiviert den Push-to-Talk-Monitor. Deaktiviert unter macOS < 26.
- Sprach- und Mikrofon-Auswahl, Live-Pegelmesser, Triggerwort-Tabelle, Tester (nur lokal; leitet nicht weiter).
- Die Mikrofon-Auswahl behält die letzte Auswahl bei, wenn ein Gerät getrennt wird, zeigt einen Hinweis auf die Trennung an und fällt vorübergehend auf den Systemstandard zurück, bis das Gerät wieder verfügbar ist.
- **Sounds**: Signaltöne bei Trigger-Erkennung und beim Senden; standardmäßig der macOS-Systemton „Glass“. Du kannst für jedes Ereignis jede mit `NSSound` ladbare Datei auswählen (z. B. MP3/WAV/AIFF) oder **No Sound** wählen.

## Weiterleitungsverhalten

- Wenn Sprachaktivierung aktiviert ist, werden Transkripte an das aktive Gateway/den aktiven Agenten weitergeleitet (derselbe lokale bzw. entfernte Modus, den auch der Rest der Mac-App verwendet).
- Antworten werden an den **zuletzt verwendeten Hauptanbieter** zugestellt (WhatsApp/Telegram/Discord/WebChat). Wenn die Zustellung fehlschlägt, wird der Fehler protokolliert und der Lauf ist weiterhin über WebChat/Sitzungsprotokolle sichtbar.

## Weiterleitungs-Payload

- `VoiceWakeForwarder.prefixedTranscript(_:)` stellt vor dem Senden den Maschinenhinweis voran. Wird gemeinsam von den Pfaden für Wake-Word und Push-to-Talk verwendet.

## Schnelle Überprüfung

- Aktiviere Push-to-Talk, halte Cmd+Fn, sprich, lass los: Das Overlay sollte Teiltexte anzeigen und dann senden.
- Während des Haltens sollten die Ohren in der Menüleiste vergrößert bleiben (verwendet `triggerVoiceEars(ttl:nil)`); nach dem Loslassen werden sie wieder kleiner.
