---
read_when:
    - Ajustement du comportement de la superposition vocale
summary: Cycle de vie de la superposition vocale lorsque le mot d’activation et le push-to-talk se chevauchent
title: Superposition vocale
x-i18n:
    generated_at: "2026-04-05T12:48:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1efcc26ec05d2f421cb2cf462077d002381995b338d00db77d5fdba9b8d938b6
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# Cycle de vie de la superposition vocale (macOS)

Public : contributeurs de l’application macOS. Objectif : garder la superposition vocale prévisible lorsque le mot d’activation et le push-to-talk se chevauchent.

## Intention actuelle

- Si la superposition est déjà visible à cause du mot d’activation et que l’utilisateur appuie sur le raccourci, la session du raccourci _adopte_ le texte existant au lieu de le réinitialiser. La superposition reste affichée tant que le raccourci est maintenu. Lorsque l’utilisateur relâche : envoyer s’il y a du texte une fois nettoyé, sinon fermer.
- Le mot d’activation seul continue à envoyer automatiquement au silence ; le push-to-talk envoie immédiatement au relâchement.

## Implémenté (9 déc. 2025)

- Les sessions de superposition transportent maintenant un jeton par capture (mot d’activation ou push-to-talk). Les mises à jour partial/final/send/dismiss/level sont ignorées lorsque le jeton ne correspond pas, ce qui évite les callbacks obsolètes.
- Le push-to-talk adopte tout texte visible de la superposition comme préfixe (ainsi, appuyer sur le raccourci pendant que la superposition de réveil est active conserve le texte et ajoute la nouvelle parole). Il attend jusqu’à 1,5 s pour une transcription finale avant de revenir au texte actuel.
- Les journaux de carillon/superposition sont émis en `info` dans les catégories `voicewake.overlay`, `voicewake.ptt` et `voicewake.chime` (début de session, partiel, final, envoi, fermeture, raison du carillon).

## Étapes suivantes

1. **VoiceSessionCoordinator (actor)**
   - Possède exactement une `VoiceSession` à la fois.
   - API (basée sur jeton) : `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Ignore les callbacks qui transportent des jetons obsolètes (empêche les anciens recognizers de rouvrir la superposition).
2. **VoiceSession (modèle)**
   - Champs : `token`, `source` (wakeWord|pushToTalk), texte validé/volatile, drapeaux de carillon, timers (auto-send, idle), `overlayMode` (display|editing|sending), échéance de cooldown.
3. **Liaison de superposition**
   - `VoiceSessionPublisher` (`ObservableObject`) reflète la session active dans SwiftUI.
   - `VoiceWakeOverlayView` s’affiche uniquement via le publisher ; il ne modifie jamais directement des singletons globaux.
   - Les actions utilisateur de la superposition (`sendNow`, `dismiss`, `edit`) rappellent le coordinator avec le jeton de session.
4. **Chemin d’envoi unifié**
   - À `endCapture` : si le texte nettoyé est vide → fermer ; sinon `performSend(session:)` (joue une seule fois le carillon d’envoi, transfère, ferme).
   - Push-to-talk : pas de délai ; mot d’activation : délai facultatif pour l’envoi automatique.
   - Appliquer un court cooldown au runtime de réveil après la fin du push-to-talk afin que le mot d’activation ne se redéclenche pas immédiatement.
5. **Journalisation**
   - Le coordinator émet des journaux `.info` dans le sous-système `ai.openclaw`, catégories `voicewake.overlay` et `voicewake.chime`.
   - Événements clés : `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Liste de contrôle de débogage

- Diffusez les journaux pendant la reproduction d’une superposition bloquée :

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Vérifiez qu’un seul jeton de session est actif ; les callbacks obsolètes doivent être ignorés par le coordinator.
- Assurez-vous que le relâchement du push-to-talk appelle toujours `endCapture` avec le jeton actif ; si le texte est vide, attendez-vous à `dismiss` sans carillon ni envoi.

## Étapes de migration (suggestion)

1. Ajouter `VoiceSessionCoordinator`, `VoiceSession` et `VoiceSessionPublisher`.
2. Refactoriser `VoiceWakeRuntime` pour créer/mettre à jour/terminer les sessions au lieu de toucher directement `VoiceWakeOverlayController`.
3. Refactoriser `VoicePushToTalk` pour adopter les sessions existantes et appeler `endCapture` au relâchement ; appliquer le cooldown runtime.
4. Connecter `VoiceWakeOverlayController` au publisher ; supprimer les appels directs depuis runtime/PTT.
5. Ajouter des tests d’intégration pour l’adoption de session, le cooldown et la fermeture sur texte vide.
