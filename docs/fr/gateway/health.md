---
read_when:
    - Diagnostiquer la connectivité des canaux ou l’état du Gateway
    - Comprendre les commandes CLI de vérification d’état et leurs options
summary: Commandes de vérification d’état et surveillance de l’état du Gateway
title: Vérifications d’état
x-i18n:
    generated_at: "2026-04-24T07:10:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08278ff0079102459c4d9141dc2e8d89e731de1fc84487f6baa620aaf7c119b4
    source_path: gateway/health.md
    workflow: 15
---

# Vérifications d’état (CLI)

Guide court pour vérifier la connectivité des canaux sans tâtonner.

## Vérifications rapides

- `openclaw status` — résumé local : accessibilité/mode du gateway, suggestion de mise à jour, âge de l’authentification des canaux liés, sessions + activité récente.
- `openclaw status --all` — diagnostic local complet (lecture seule, en couleur, sûr à coller pour le débogage).
- `openclaw status --deep` — demande au gateway en cours d’exécution une sonde d’état en direct (`health` avec `probe:true`), y compris des sondes de canal par compte lorsqu’elles sont prises en charge.
- `openclaw health` — demande au gateway en cours d’exécution son instantané d’état (WS uniquement ; aucune socket de canal directe depuis la CLI).
- `openclaw health --verbose` — force une sonde d’état en direct et affiche les détails de connexion du gateway.
- `openclaw health --json` — sortie d’instantané d’état lisible par machine.
- Envoyez `/status` comme message autonome dans WhatsApp/WebChat pour obtenir une réponse d’état sans invoquer l’agent.
- Journaux : suivez `/tmp/openclaw/openclaw-*.log` et filtrez sur `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnostics approfondis

- Identifiants sur disque : `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (la date de modification doit être récente).
- Magasin de sessions : `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (le chemin peut être surchargé dans la configuration). Le nombre et les destinataires récents apparaissent via `status`.
- Flux de reliaison : `openclaw channels logout && openclaw channels login --verbose` lorsque des codes d’état 409–515 ou `loggedOut` apparaissent dans les journaux. (Remarque : le flux de connexion par QR redémarre automatiquement une fois pour le statut 515 après pairing.)
- Les diagnostics sont activés par défaut. Le gateway enregistre des faits opérationnels sauf si `diagnostics.enabled: false` est défini. Les événements mémoire enregistrent les nombres d’octets RSS/heap, la pression de seuil et la pression de croissance. Les événements de charges utiles surdimensionnées enregistrent ce qui a été rejeté, tronqué ou segmenté, ainsi que les tailles et limites lorsque disponibles. Ils n’enregistrent pas le texte du message, le contenu des pièces jointes, le corps du webhook, le corps brut de requête ou de réponse, les jetons, les cookies ni les valeurs secrètes. Le même Heartbeat démarre l’enregistreur de stabilité borné, disponible via `openclaw gateway stability` ou la RPC Gateway `diagnostics.stability`. Les sorties fatales du Gateway, les délais d’arrêt et les échecs de démarrage au redémarrage conservent le dernier instantané de l’enregistreur sous `~/.openclaw/logs/stability/` lorsque des événements existent ; inspectez le bundle enregistré le plus récent avec `openclaw gateway stability --bundle latest`.
- Pour les rapports de bogue, exécutez `openclaw gateway diagnostics export` et joignez le zip généré. L’export combine un résumé Markdown, le bundle de stabilité le plus récent, les métadonnées de journaux assainies, les instantanés assainis d’état/santé du Gateway et la forme de la configuration. Il est conçu pour être partagé : le texte du chat, les corps de webhooks, les sorties d’outils, les identifiants, les cookies, les identifiants de compte/message et les valeurs secrètes sont omis ou masqués. Voir [Export de diagnostics](/fr/gateway/diagnostics).

## Configuration du moniteur d’état

- `gateway.channelHealthCheckMinutes` : fréquence à laquelle le gateway vérifie l’état des canaux. Par défaut : `5`. Définissez `0` pour désactiver globalement les redémarrages du moniteur d’état.
- `gateway.channelStaleEventThresholdMinutes` : durée pendant laquelle un canal connecté peut rester inactif avant que le moniteur d’état ne le considère comme obsolète et ne le redémarre. Par défaut : `30`. Gardez cette valeur supérieure ou égale à `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour` : plafond glissant d’une heure pour les redémarrages du moniteur d’état par canal/compte. Par défaut : `10`.
- `channels.<provider>.healthMonitor.enabled` : désactiver les redémarrages du moniteur d’état pour un canal spécifique tout en laissant la surveillance globale activée.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled` : surcharge multi-compte qui l’emporte sur le réglage au niveau du canal.
- Ces surcharges par canal s’appliquent aux moniteurs de canal intégrés qui les exposent aujourd’hui : Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram et WhatsApp.

## Quand quelque chose échoue

- `logged out` ou statut 409–515 → reliez à nouveau avec `openclaw channels logout` puis `openclaw channels login`.
- Gateway inaccessible → démarrez-le : `openclaw gateway --port 18789` (utilisez `--force` si le port est occupé).
- Aucun message entrant → confirmez que le téléphone lié est en ligne et que l’expéditeur est autorisé (`channels.whatsapp.allowFrom`) ; pour les discussions de groupe, assurez-vous que la liste d’autorisation + les règles de mention correspondent (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Commande dédiée « health »

`openclaw health` demande au gateway en cours d’exécution son instantané d’état (aucune socket de canal directe depuis la CLI). Par défaut, il peut renvoyer un instantané mis en cache récent du gateway ; le gateway rafraîchit ensuite ce cache en arrière-plan. `openclaw health --verbose` force à la place une sonde en direct. La commande signale l’âge des identifiants/authentifications liés lorsqu’ils sont disponibles, les résumés de sondes par canal, le résumé du magasin de sessions et une durée de sonde. Elle se termine avec un code non nul si le gateway est inaccessible ou si la sonde échoue/expire.

Options :

- `--json` : sortie JSON lisible par machine
- `--timeout <ms>` : surcharger le délai par défaut de 10 s de la sonde
- `--verbose` : forcer une sonde en direct et afficher les détails de connexion du gateway
- `--debug` : alias de `--verbose`

L’instantané d’état inclut : `ok` (booléen), `ts` (horodatage), `durationMs` (temps de sonde), état par canal, disponibilité de l’agent et résumé du magasin de sessions.

## Articles connexes

- [Guide d’exploitation du Gateway](/fr/gateway)
- [Export de diagnostics](/fr/gateway/diagnostics)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
