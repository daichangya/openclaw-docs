---
read_when:
    - Diagnostic de la connectivité des canaux ou de la santé de la passerelle
    - Compréhension des commandes CLI de vérification d’état et de leurs options
summary: Commandes de vérification d’état et surveillance de santé de la passerelle
title: Vérifications de santé
x-i18n:
    generated_at: "2026-04-05T12:42:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8824bca34c4d1139f043481c75f0a65d83e54008898c34cf69c6f98fd04e819
    source_path: gateway/health.md
    workflow: 15
---

# Vérifications de santé (CLI)

Guide court pour vérifier la connectivité des canaux sans avoir à deviner.

## Vérifications rapides

- `openclaw status` — résumé local : joignabilité/mode de la passerelle, indication de mise à jour, ancienneté de l’auth des canaux liés, sessions + activité récente.
- `openclaw status --all` — diagnostic local complet (lecture seule, couleur, sûr à coller pour le débogage).
- `openclaw status --deep` — demande à la passerelle en cours d’exécution une probe de santé en direct (`health` avec `probe:true`), y compris des probes de canal par compte lorsque pris en charge.
- `openclaw health` — demande à la passerelle en cours d’exécution son instantané de santé (WS uniquement ; pas de sockets de canal directes depuis la CLI).
- `openclaw health --verbose` — force une probe de santé en direct et affiche les détails de connexion à la passerelle.
- `openclaw health --json` — sortie d’instantané de santé lisible par machine.
- Envoyez `/status` comme message autonome dans WhatsApp/WebChat pour obtenir une réponse d’état sans invoquer l’agent.
- Journaux : suivez `/tmp/openclaw/openclaw-*.log` et filtrez sur `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnostics approfondis

- Identifiants sur le disque : `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (le `mtime` doit être récent).
- Magasin de sessions : `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (le chemin peut être remplacé dans la configuration). Le nombre et les destinataires récents sont exposés via `status`.
- Flux de reliaison : `openclaw channels logout && openclaw channels login --verbose` lorsque les codes de statut 409–515 ou `loggedOut` apparaissent dans les journaux. (Remarque : le flux de connexion par QR redémarre automatiquement une fois pour le statut 515 après appairage.)

## Configuration du moniteur de santé

- `gateway.channelHealthCheckMinutes` : fréquence à laquelle la passerelle vérifie la santé des canaux. Par défaut : `5`. Définissez `0` pour désactiver globalement les redémarrages du moniteur de santé.
- `gateway.channelStaleEventThresholdMinutes` : durée pendant laquelle un canal connecté peut rester inactif avant que le moniteur de santé ne le considère comme obsolète et ne le redémarre. Par défaut : `30`. Gardez cette valeur supérieure ou égale à `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour` : plafond glissant sur une heure pour les redémarrages du moniteur de santé par canal/compte. Par défaut : `10`.
- `channels.<provider>.healthMonitor.enabled` : désactiver les redémarrages du moniteur de santé pour un canal spécifique tout en laissant la surveillance globale activée.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled` : remplacement multi-comptes qui l’emporte sur le paramètre au niveau du canal.
- Ces remplacements par canal s’appliquent aux moniteurs de canaux intégrés qui les exposent aujourd’hui : Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram et WhatsApp.

## Lorsqu’un problème survient

- `logged out` ou statut 409–515 → reliez avec `openclaw channels logout` puis `openclaw channels login`.
- Passerelle injoignable → démarrez-la : `openclaw gateway --port 18789` (utilisez `--force` si le port est occupé).
- Aucun message entrant → confirmez que le téléphone lié est en ligne et que l’expéditeur est autorisé (`channels.whatsapp.allowFrom`) ; pour les discussions de groupe, assurez-vous que la liste d’autorisation + les règles de mention correspondent (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Commande dédiée "health"

`openclaw health` demande à la passerelle en cours d’exécution son instantané de santé (sans sockets de canal directes depuis la CLI). Par défaut, elle peut renvoyer un instantané de passerelle récemment mis en cache ; la passerelle actualise ensuite ce cache en arrière-plan. `openclaw health --verbose` force à la place une probe en direct. La commande signale l’ancienneté des identifiants/auth liés lorsqu’elle est disponible, des résumés de probe par canal, un résumé du magasin de sessions et une durée de probe. Elle quitte avec un code non nul si la passerelle est injoignable ou si la probe échoue/dépasse le délai.

Options :

- `--json` : sortie JSON lisible par machine
- `--timeout <ms>` : remplacer le délai de probe par défaut de 10 s
- `--verbose` : forcer une probe en direct et afficher les détails de connexion à la passerelle
- `--debug` : alias de `--verbose`

L’instantané de santé comprend : `ok` (booléen), `ts` (horodatage), `durationMs` (temps de probe), état par canal, disponibilité de l’agent et résumé du magasin de sessions.
