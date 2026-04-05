---
read_when:
    - Travail sur les chemins Voice Wake ou PTT
summary: Modes de réveil vocal et push-to-talk ainsi que détails de routage dans l’app Mac
title: Voice Wake (macOS)
x-i18n:
    generated_at: "2026-04-05T12:48:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: fed6524a2e1fad5373d34821c920b955a2b5a3fcd9c51cdb97cf4050536602a7
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# Voice Wake & Push-to-Talk

## Modes

- **Mode mot de réveil** (par défaut) : le reconnaisseur Speech toujours actif attend des jetons déclencheurs (`swabbleTriggerWords`). Lorsqu’il y a correspondance, il démarre la capture, affiche la surcouche avec le texte partiel, puis envoie automatiquement après un silence.
- **Push-to-talk (maintien de Right Option)** : maintenez la touche Right Option pour capturer immédiatement — aucun déclencheur n’est nécessaire. La surcouche apparaît tant que la touche est maintenue ; le relâchement finalise et transfère après un court délai afin que vous puissiez ajuster le texte.

## Comportement à l’exécution (mot de réveil)

- Le reconnaisseur Speech vit dans `VoiceWakeRuntime`.
- Le déclencheur ne s’active que lorsqu’il y a une **pause significative** entre le mot de réveil et le mot suivant (écart d’environ 0,55 s). La surcouche/le carillon peut démarrer sur la pause même avant le début de la commande.
- Fenêtres de silence : 2,0 s lorsque la parole est en cours, 5,0 s si seul le déclencheur a été entendu.
- Arrêt forcé : 120 s pour empêcher les sessions qui s’emballent.
- Antirebond entre les sessions : 350 ms.
- La surcouche est pilotée via `VoiceWakeOverlayController` avec coloration committed/volatile.
- Après l’envoi, le reconnaisseur redémarre proprement pour écouter le prochain déclencheur.

## Invariants de cycle de vie

- Si Voice Wake est activé et que les autorisations sont accordées, le reconnaisseur de mot de réveil doit être en écoute (sauf pendant une capture push-to-talk explicite).
- La visibilité de la surcouche (y compris le masquage manuel via le bouton X) ne doit jamais empêcher le reconnaisseur de reprendre.

## Mode d’échec de surcouche bloquée (précédent)

Auparavant, si la surcouche restait bloquée visible et que vous la fermiez manuellement, Voice Wake pouvait sembler « mort » parce que la tentative de redémarrage du runtime pouvait être bloquée par la visibilité de la surcouche et qu’aucun redémarrage ultérieur n’était programmé.

Durcissement :

- Le redémarrage du runtime de réveil n’est plus bloqué par la visibilité de la surcouche.
- La fin du masquage de la surcouche déclenche un `VoiceWakeRuntime.refresh(...)` via `VoiceSessionCoordinator`, de sorte qu’un masquage manuel via X reprend toujours l’écoute.

## Spécificités du push-to-talk

- La détection de raccourci clavier utilise un moniteur global `.flagsChanged` pour **Right Option** (`keyCode 61` + `.option`). Nous observons uniquement les événements (sans les intercepter).
- Le pipeline de capture vit dans `VoicePushToTalk` : démarre immédiatement Speech, diffuse les partiels vers la surcouche, puis appelle `VoiceWakeForwarder` au relâchement.
- Lorsque le push-to-talk démarre, nous mettons en pause le runtime de mot de réveil pour éviter des taps audio concurrents ; il redémarre automatiquement après le relâchement.
- Autorisations : nécessite Microphone + Speech ; voir les événements requiert l’approbation Accessibility/Input Monitoring.
- Claviers externes : certains peuvent ne pas exposer Right Option comme prévu — proposez un raccourci de secours si les utilisateurs signalent des ratés.

## Paramètres visibles par l’utilisateur

- Interrupteur **Voice Wake** : active le runtime de mot de réveil.
- **Hold Cmd+Fn to talk** : active le moniteur push-to-talk. Désactivé sur macOS < 26.
- Sélecteurs de langue et de micro, indicateur de niveau en direct, tableau des mots déclencheurs, testeur (local uniquement ; ne transfère pas).
- Le sélecteur de micro conserve la dernière sélection si un appareil se déconnecte, affiche un indice de déconnexion et revient temporairement au périphérique système par défaut jusqu’à son retour.
- **Sons** : carillons à la détection du déclencheur et à l’envoi ; par défaut, le son système macOS « Glass ». Vous pouvez choisir n’importe quel fichier chargeable par `NSSound` (par ex. MP3/WAV/AIFF) pour chaque événement ou choisir **No Sound**.

## Comportement de transfert

- Lorsque Voice Wake est activé, les transcriptions sont transférées vers la passerelle/l’agent actif (même mode local ou distant que celui utilisé par le reste de l’app Mac).
- Les réponses sont distribuées au **dernier fournisseur principal utilisé** (WhatsApp/Telegram/Discord/WebChat). Si la distribution échoue, l’erreur est consignée et l’exécution reste visible via WebChat/journaux de session.

## Charge utile de transfert

- `VoiceWakeForwarder.prefixedTranscript(_:)` préfixe la transcription avec l’indication de machine avant l’envoi. Partagé entre les chemins mot de réveil et push-to-talk.

## Vérification rapide

- Activez le push-to-talk, maintenez Cmd+Fn, parlez, relâchez : la surcouche doit afficher les partiels puis envoyer.
- Pendant le maintien, les oreilles de la barre de menus doivent rester agrandies (utilise `triggerVoiceEars(ttl:nil)`) ; elles reviennent à la normale après le relâchement.
