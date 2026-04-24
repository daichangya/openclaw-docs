---
read_when:
    - Ajustement du comportement de la superposition vocale
summary: Cycle de vie de la superposition vocale lorsque le mot d’activation et le push-to-talk se chevauchent
title: Superposition vocale
x-i18n:
    generated_at: "2026-04-24T07:21:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ae98afad57dffe73e2c878eef4f3253e4464d68cadf531e9239b017cc160f28
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# Cycle de vie de la superposition vocale (macOS)

Public : contributeurs de l’app macOS. Objectif : garder la superposition vocale prévisible lorsque le mot d’activation et le push-to-talk se chevauchent.

## Intention actuelle

- Si la superposition est déjà visible à cause du mot d’activation et que l’utilisateur appuie sur la touche de raccourci, la session de raccourci _adopte_ le texte existant au lieu de le réinitialiser. La superposition reste affichée tant que la touche de raccourci est maintenue. Lorsque l’utilisateur relâche : envoyer s’il y a du texte non vide après trim, sinon fermer.
- Le mot d’activation seul continue d’envoyer automatiquement après silence ; le push-to-talk envoie immédiatement au relâchement.

## Implémenté (9 décembre 2025)

- Les sessions de superposition transportent désormais un jeton par capture (mot d’activation ou push-to-talk). Les mises à jour partielles/finales/envoi/fermeture/niveau sont ignorées lorsque le jeton ne correspond pas, évitant ainsi les rappels obsolètes.
- Le push-to-talk adopte tout texte de superposition visible comme préfixe (ainsi, appuyer sur la touche de raccourci pendant que la superposition de réveil est affichée conserve le texte et ajoute la nouvelle parole). Il attend jusqu’à 1,5 s une transcription finale avant de revenir au texte courant.
- La journalisation des signaux sonores/superpositions est émise au niveau `info` dans les catégories `voicewake.overlay`, `voicewake.ptt` et `voicewake.chime` (démarrage de session, partiel, final, envoi, fermeture, raison du signal sonore).

## Étapes suivantes

1. **VoiceSessionCoordinator (actor)**
   - Possède exactement une `VoiceSession` à la fois.
   - API (basée sur jeton) : `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Ignore les rappels qui transportent des jetons obsolètes (empêche les anciens reconnaisseurs de rouvrir la superposition).
2. **VoiceSession (modèle)**
   - Champs : `token`, `source` (`wakeWord|pushToTalk`), texte validé/volatile, indicateurs de signal sonore, minuteries (auto-send, inactivité), `overlayMode` (`display|editing|sending`), échéance de cooldown.
3. **Liaison de la superposition**
   - `VoiceSessionPublisher` (`ObservableObject`) reflète la session active dans SwiftUI.
   - `VoiceWakeOverlayView` effectue le rendu uniquement via le publisher ; elle ne modifie jamais directement les singletons globaux.
   - Les actions utilisateur de la superposition (`sendNow`, `dismiss`, `edit`) rappellent le coordinator avec le jeton de session.
4. **Chemin d’envoi unifié**
   - Sur `endCapture` : si le texte après trim est vide → fermer ; sinon `performSend(session:)` (joue le signal d’envoi une seule fois, transfère, ferme).
   - Push-to-talk : pas de délai ; mot d’activation : délai facultatif pour l’auto-envoi.
   - Appliquer un court cooldown au runtime de réveil après la fin du push-to-talk afin que le mot d’activation ne se redéclenche pas immédiatement.
5. **Journalisation**
   - Le coordinator émet des journaux `.info` dans le sous-système `ai.openclaw`, catégories `voicewake.overlay` et `voicewake.chime`.
   - Événements clés : `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Liste de vérification de débogage

- Suivre les journaux pendant la reproduction d’une superposition persistante :

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Vérifier qu’il n’y a qu’un seul jeton de session actif ; les rappels obsolètes doivent être ignorés par le coordinator.
- S’assurer que le relâchement du push-to-talk appelle toujours `endCapture` avec le jeton actif ; si le texte est vide, attendez-vous à `dismiss` sans signal sonore ni envoi.

## Étapes de migration (suggérées)

1. Ajouter `VoiceSessionCoordinator`, `VoiceSession` et `VoiceSessionPublisher`.
2. Refactoriser `VoiceWakeRuntime` pour créer/mettre à jour/terminer des sessions au lieu de toucher directement `VoiceWakeOverlayController`.
3. Refactoriser `VoicePushToTalk` pour adopter les sessions existantes et appeler `endCapture` au relâchement ; appliquer un cooldown runtime.
4. Relier `VoiceWakeOverlayController` au publisher ; supprimer les appels directs depuis le runtime/PTT.
5. Ajouter des tests d’intégration pour l’adoption de session, le cooldown et la fermeture lorsque le texte est vide.

## Lié

- [App macOS](/fr/platforms/macos)
- [Réveil vocal (macOS)](/fr/platforms/mac/voicewake)
- [Mode Talk](/fr/nodes/talk)
