---
read_when:
    - Anpassen des Verhaltens des Sprach-Overlays
summary: Lebenszyklus des Sprach-Overlays, wenn Wake-Word und Push-to-Talk sich überschneiden
title: Voice Overlay
x-i18n:
    generated_at: "2026-04-05T12:49:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1efcc26ec05d2f421cb2cf462077d002381995b338d00db77d5fdba9b8d938b6
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# Lebenszyklus des Voice Overlay (macOS)

Zielgruppe: Mitwirkende an der macOS-App. Ziel: das Sprach-Overlay vorhersehbar halten, wenn Wake-Word und Push-to-Talk sich überschneiden.

## Aktuelle Absicht

- Wenn das Overlay bereits durch das Wake-Word sichtbar ist und der Benutzer den Hotkey drückt, übernimmt die Hotkey-Sitzung den vorhandenen Text, anstatt ihn zurückzusetzen. Das Overlay bleibt sichtbar, solange der Hotkey gedrückt gehalten wird. Wenn der Benutzer loslässt: senden, wenn getrimmter Text vorhanden ist, andernfalls schließen.
- Nur das Wake-Word sendet weiterhin bei Stille automatisch; Push-to-Talk sendet sofort beim Loslassen.

## Implementiert (9. Dez. 2025)

- Overlay-Sitzungen tragen jetzt für jede Erfassung ein Token (Wake-Word oder Push-to-Talk). Teil-/End-/Sende-/Schließen-/Pegel-Updates werden verworfen, wenn das Token nicht übereinstimmt, um veraltete Callbacks zu vermeiden.
- Push-to-Talk übernimmt sichtbaren Overlay-Text als Präfix (sodass beim Drücken des Hotkeys, während das Wake-Overlay sichtbar ist, der Text erhalten bleibt und neue Sprache angehängt wird). Es wartet bis zu 1,5 s auf ein endgültiges Transkript, bevor es auf den aktuellen Text zurückfällt.
- Chime-/Overlay-Logging wird auf `info` in den Kategorien `voicewake.overlay`, `voicewake.ptt` und `voicewake.chime` ausgegeben (Sitzungsstart, Teil, Ende, Senden, Schließen, Chime-Grund).

## Nächste Schritte

1. **VoiceSessionCoordinator (actor)**
   - Verwaltet genau eine `VoiceSession` gleichzeitig.
   - API (tokenbasiert): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Verwirft Callbacks, die veraltete Token enthalten (verhindert, dass alte Recognizer das Overlay erneut öffnen).
2. **VoiceSession (model)**
   - Felder: `token`, `source` (wakeWord|pushToTalk), bestätigter/temporärer Text, Chime-Flags, Timer (automatisches Senden, Inaktivität), `overlayMode` (display|editing|sending), Cooldown-Deadline.
3. **Overlay-Bindung**
   - `VoiceSessionPublisher` (`ObservableObject`) spiegelt die aktive Sitzung in SwiftUI.
   - `VoiceWakeOverlayView` rendert nur über den Publisher; es verändert niemals direkt globale Singletons.
   - Benutzeraktionen im Overlay (`sendNow`, `dismiss`, `edit`) rufen über das Sitzungs-Token den Coordinator zurück.
4. **Vereinheitlichter Sendepfad**
   - Bei `endCapture`: wenn getrimmter Text leer ist → schließen; andernfalls `performSend(session:)` (spielt einmal den Sende-Chime ab, leitet weiter, schließt).
   - Push-to-Talk: keine Verzögerung; Wake-Word: optionale Verzögerung für automatisches Senden.
   - Nach Abschluss von Push-to-Talk einen kurzen Cooldown auf die Wake-Runtime anwenden, damit das Wake-Word nicht sofort erneut auslöst.
5. **Logging**
   - Der Coordinator gibt `.info`-Logs im Subsystem `ai.openclaw` und in den Kategorien `voicewake.overlay` und `voicewake.chime` aus.
   - Zentrale Ereignisse: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Checkliste zur Fehlerbehebung

- Logs streamen, während ein hängendes Overlay reproduziert wird:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Prüfen, dass nur ein aktives Sitzungs-Token vorhanden ist; veraltete Callbacks sollten vom Coordinator verworfen werden.
- Sicherstellen, dass das Loslassen von Push-to-Talk immer `endCapture` mit dem aktiven Token aufruft; wenn der Text leer ist, `dismiss` ohne Chime oder Senden erwarten.

## Migrationsschritte (empfohlen)

1. `VoiceSessionCoordinator`, `VoiceSession` und `VoiceSessionPublisher` hinzufügen.
2. `VoiceWakeRuntime` so refaktorieren, dass Sitzungen erstellt/aktualisiert/beendet werden, anstatt `VoiceWakeOverlayController` direkt zu verändern.
3. `VoicePushToTalk` so refaktorieren, dass bestehende Sitzungen übernommen werden und beim Loslassen `endCapture` aufgerufen wird; Runtime-Cooldown anwenden.
4. `VoiceWakeOverlayController` mit dem Publisher verbinden; direkte Aufrufe aus Runtime/PTT entfernen.
5. Integrationstests für Sitzungsübernahme, Cooldown und Schließen bei leerem Text hinzufügen.
