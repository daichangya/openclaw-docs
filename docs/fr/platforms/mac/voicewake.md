---
read_when:
    - Travailler sur les chemins de réveil vocal ou push-to-talk
summary: Modes de réveil vocal et push-to-talk, plus détails de routage dans l’application Mac
title: Réveil vocal (macOS)
x-i18n:
    generated_at: "2026-04-24T07:21:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0273c24764f0baf440a19f31435d6ee62ab040c1ec5a97d7733d3ec8b81b0641
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# Réveil vocal et Push-to-Talk

## Modes

- **Mode mot de réveil** (par défaut) : le reconnaisseur vocal toujours actif attend des jetons déclencheurs (`swabbleTriggerWords`). En cas de correspondance, il démarre la capture, affiche la superposition avec le texte partiel, puis envoie automatiquement après un silence.
- **Push-to-talk (maintien de la touche Option droite)** : maintenez la touche Option droite pour capturer immédiatement — aucun déclencheur n’est nécessaire. La superposition apparaît pendant l’appui ; le relâchement finalise puis transmet après un court délai pour vous permettre d’ajuster le texte.

## Comportement d’exécution (réveil vocal)

- Le reconnaisseur vocal vit dans `VoiceWakeRuntime`.
- Le déclencheur ne s’active que lorsqu’il existe une **pause significative** entre le mot de réveil et le mot suivant (écart d’environ 0,55s). La superposition/le carillon peut démarrer pendant la pause avant même que la commande ne commence.
- Fenêtres de silence : 2,0s lorsque la parole est fluide, 5,0s si seul le déclencheur a été entendu.
- Arrêt strict : 120s pour éviter les sessions incontrôlées.
- Antirebond entre sessions : 350ms.
- La superposition est pilotée via `VoiceWakeOverlayController` avec coloration validée/volatile.
- Après l’envoi, le reconnaisseur redémarre proprement pour écouter le déclencheur suivant.

## Invariants de cycle de vie

- Si Voice Wake est activé et que les autorisations sont accordées, le reconnaisseur du mot de réveil doit écouter (sauf pendant une capture push-to-talk explicite).
- La visibilité de la superposition (y compris la fermeture manuelle via le bouton X) ne doit jamais empêcher la reprise du reconnaisseur.

## Mode d’échec de superposition bloquée (ancien)

Auparavant, si la superposition restait bloquée visible et que vous la fermiez manuellement, Voice Wake pouvait sembler « mort » car la tentative de redémarrage de l’exécution pouvait être bloquée par la visibilité de la superposition et aucun redémarrage ultérieur n’était planifié.

Renforcement :

- Le redémarrage de l’exécution wake n’est plus bloqué par la visibilité de la superposition.
- La fin de fermeture de la superposition déclenche un `VoiceWakeRuntime.refresh(...)` via `VoiceSessionCoordinator`, de sorte qu’une fermeture manuelle via X reprend toujours l’écoute.

## Détails du push-to-talk

- La détection de raccourci clavier utilise un moniteur global `.flagsChanged` pour **Option droite** (`keyCode 61` + `.option`). Nous observons uniquement les événements (sans les consommer).
- Le pipeline de capture vit dans `VoicePushToTalk` : démarre Speech immédiatement, diffuse les partiels vers la superposition et appelle `VoiceWakeForwarder` au relâchement.
- Lorsque le push-to-talk démarre, nous mettons en pause l’exécution du mot de réveil afin d’éviter des taps audio concurrents ; elle redémarre automatiquement après le relâchement.
- Autorisations : nécessite Microphone + Speech ; la visualisation des événements nécessite l’approbation Accessibilité/Input Monitoring.
- Claviers externes : certains peuvent ne pas exposer Option droite comme prévu — proposez un raccourci de secours si des utilisateurs signalent des ratés.

## Paramètres côté utilisateur

- Bascule **Voice Wake** : active l’exécution du mot de réveil.
- **Hold Cmd+Fn to talk** : active le moniteur push-to-talk. Désactivé sur macOS < 26.
- Sélecteurs de langue et de micro, indicateur de niveau en direct, tableau des mots déclencheurs, testeur (local uniquement ; ne transmet pas).
- Le sélecteur de micro conserve la dernière sélection si un appareil se déconnecte, affiche une indication de déconnexion et revient temporairement au périphérique système par défaut jusqu’à son retour.
- **Sons** : carillons à la détection du déclencheur et à l’envoi ; par défaut, le son système macOS « Glass ». Vous pouvez choisir n’importe quel fichier chargeable par `NSSound` (par ex. MP3/WAV/AIFF) pour chaque événement ou choisir **No Sound**.

## Comportement de transmission

- Lorsque Voice Wake est activé, les transcriptions sont transmises au gateway/agent actif (le même mode local vs distant que celui utilisé par le reste de l’application Mac).
- Les réponses sont livrées au **dernier fournisseur principal utilisé** (WhatsApp/Telegram/Discord/WebChat). Si la livraison échoue, l’erreur est journalisée et l’exécution reste visible via WebChat/les journaux de session.

## Charge utile de transmission

- `VoiceWakeForwarder.prefixedTranscript(_:)` ajoute l’indice machine au début avant l’envoi. Partagé entre les chemins mot de réveil et push-to-talk.

## Vérification rapide

- Activez le push-to-talk, maintenez Cmd+Fn, parlez, relâchez : la superposition doit afficher les partiels puis envoyer.
- Pendant l’appui, les oreilles de la barre de menus doivent rester agrandies (utilise `triggerVoiceEars(ttl:nil)`) ; elles redescendent après le relâchement.

## Voir aussi

- [Réveil vocal](/fr/nodes/voicewake)
- [Superposition vocale](/fr/platforms/mac/voice-overlay)
- [Application macOS](/fr/platforms/macos)
