---
read_when:
    - Verhalten des Voice-Overlays anpassen.
summary: Lifecycle des Voice-Overlays, wenn Wake-Word und Push-to-Talk sich überlappen
title: Voice-Overlay
x-i18n:
    generated_at: "2026-04-24T06:48:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ae98afad57dffe73e2c878eef4f3253e4464d68cadf531e9239b017cc160f28
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# Lifecycle des Voice-Overlays (macOS)

Zielgruppe: Mitwirkende an der macOS-App. Ziel: das Voice-Overlay vorhersehbar halten, wenn Wake-Word und Push-to-Talk sich überlappen.

## Aktuelle Absicht

- Wenn das Overlay durch das Wake-Word bereits sichtbar ist und der Benutzer den Hotkey drückt, _übernimmt_ die Hotkey-Sitzung den bestehenden Text, statt ihn zurückzusetzen. Das Overlay bleibt sichtbar, solange der Hotkey gehalten wird. Wenn der Benutzer loslässt: senden, wenn getrimmter Text vorhanden ist, andernfalls ausblenden.
- Wake-Word allein sendet weiterhin automatisch bei Stille; Push-to-Talk sendet sofort beim Loslassen.

## Implementiert (9. Dezember 2025)

- Overlay-Sitzungen tragen jetzt pro Capture (Wake-Word oder Push-to-Talk) ein Token. Partial-/Final-/Send-/Dismiss-/Level-Updates werden verworfen, wenn das Token nicht passt, wodurch veraltete Callbacks vermieden werden.
- Push-to-Talk übernimmt jeden sichtbaren Overlay-Text als Präfix (sodass das Drücken des Hotkeys bei sichtbarem Wake-Overlay den Text beibehält und neue Sprache anhängt). Es wartet bis zu 1,5 s auf ein finales Transkript, bevor es auf den aktuellen Text zurückfällt.
- Logging für Chime/Overlay wird auf `info` in den Kategorien `voicewake.overlay`, `voicewake.ptt` und `voicewake.chime` ausgegeben (Sitzungsstart, Partial, Final, Send, Dismiss, Grund für Chime).

## Nächste Schritte

1. **VoiceSessionCoordinator (Actor)**
   - Besitzt immer genau eine `VoiceSession`.
   - API (tokenbasiert): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Verwirft Callbacks mit veralteten Tokens (verhindert, dass alte Recognizer das Overlay erneut öffnen).
2. **VoiceSession (Modell)**
   - Felder: `token`, `source` (wakeWord|pushToTalk), bestätigter/flüchtiger Text, Chime-Flags, Timer (Auto-Send, Idle), `overlayMode` (display|editing|sending), Cooldown-Deadline.
3. **Overlay-Binding**
   - `VoiceSessionPublisher` (`ObservableObject`) spiegelt die aktive Sitzung in SwiftUI.
   - `VoiceWakeOverlayView` rendert nur über den Publisher; es verändert niemals direkt globale Singletons.
   - Benutzeraktionen im Overlay (`sendNow`, `dismiss`, `edit`) rufen den Coordinator mit dem Sitzungs-Token zurück.
4. **Vereinheitlichter Send-Pfad**
   - Bei `endCapture`: wenn getrimmter Text leer ist → ausblenden; andernfalls `performSend(session:)` (spielt den Send-Chime einmal, leitet weiter, blendet aus).
   - Push-to-Talk: keine Verzögerung; Wake-Word: optionale Verzögerung für Auto-Send.
   - Nach Abschluss von Push-to-Talk einen kurzen Cooldown auf die Wake-Runtime anwenden, damit das Wake-Word nicht sofort erneut auslöst.
5. **Logging**
   - Der Coordinator gibt `.info`-Logs im Subsystem `ai.openclaw`, in den Kategorien `voicewake.overlay` und `voicewake.chime` aus.
   - Wichtige Ereignisse: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Debugging-Checkliste

- Logs beim Reproduzieren eines festhängenden Overlays streamen:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Verifizieren, dass nur ein aktives Sitzungs-Token existiert; veraltete Callbacks sollten vom Coordinator verworfen werden.
- Sicherstellen, dass das Loslassen von Push-to-Talk immer `endCapture` mit dem aktiven Token aufruft; wenn der Text leer ist, erwarten Sie `dismiss` ohne Chime oder Send.

## Migrationsschritte (empfohlen)

1. `VoiceSessionCoordinator`, `VoiceSession` und `VoiceSessionPublisher` hinzufügen.
2. `VoiceWakeRuntime` so umgestalten, dass Sitzungen erstellt/aktualisiert/beendet werden, statt `VoiceWakeOverlayController` direkt anzufassen.
3. `VoicePushToTalk` so umgestalten, dass bestehende Sitzungen übernommen und bei Loslassen `endCapture` aufgerufen wird; Runtime-Cooldown anwenden.
4. `VoiceWakeOverlayController` an den Publisher anbinden; direkte Aufrufe aus Runtime/PTT entfernen.
5. Integrationstests für Sitzungsübernahme, Cooldown und Dismiss bei leerem Text hinzufügen.

## Verwandt

- [macOS app](/de/platforms/macos)
- [Voice wake (macOS)](/de/platforms/mac/voicewake)
- [Talk mode](/de/nodes/talk)
