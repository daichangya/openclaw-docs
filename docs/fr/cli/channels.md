---
read_when:
    - Vous souhaitez ajouter/supprimer des comptes de canaux (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)
    - Vous souhaitez vérifier le statut des canaux ou suivre les journaux des canaux
summary: Référence CLI pour `openclaw channels` (comptes, statut, connexion/déconnexion, journaux)
title: channels
x-i18n:
    generated_at: "2026-04-05T12:37:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0f558fdb5f6ec54e7fdb7a88e5c24c9d2567174341bd3ea87848bce4cba5d29
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Gérez les comptes de canaux de chat et leur état d’exécution sur la passerelle.

Documentation associée :

- Guides des canaux : [Channels](/channels/index)
- Configuration de la passerelle : [Configuration](/gateway/configuration)

## Commandes courantes

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Statut / capacités / résolution / journaux

- `channels status` : `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities` : `--channel <name>`, `--account <id>` (uniquement avec `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve` : `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs` : `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` est le chemin en direct : sur une passerelle joignable, il exécute les vérifications `probeAccount` et éventuellement `auditAccount` par compte ; la sortie peut donc inclure l’état du transport ainsi que des résultats de probe tels que `works`, `probe failed`, `audit ok` ou `audit failed`.
Si la passerelle est injoignable, `channels status` retombe sur des résumés basés uniquement sur la configuration au lieu d’une sortie de probe en direct.

## Ajouter / supprimer des comptes

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Astuce : `openclaw channels add --help` affiche les indicateurs propres à chaque canal (jeton, clé privée, jeton d’application, chemins signal-cli, etc.).

Les surfaces d’ajout non interactives courantes incluent :

- canaux à jeton de bot : `--token`, `--bot-token`, `--app-token`, `--token-file`
- champs de transport Signal/iMessage : `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- champs Google Chat : `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- champs Matrix : `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- champs Nostr : `--private-key`, `--relay-urls`
- champs Tlon : `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` pour l’authentification adossée à l’environnement du compte par défaut, lorsque prise en charge

Lorsque vous exécutez `openclaw channels add` sans indicateurs, l’assistant interactif peut demander :

- les identifiants de compte par canal sélectionné
- des noms d’affichage facultatifs pour ces comptes
- `Bind configured channel accounts to agents now?`

Si vous confirmez l’association immédiate, l’assistant demande quel agent doit posséder chaque compte de canal configuré et écrit des liaisons de routage limitées au compte.

Vous pouvez aussi gérer les mêmes règles de routage plus tard avec `openclaw agents bindings`, `openclaw agents bind` et `openclaw agents unbind` (voir [agents](/cli/agents)).

Lorsque vous ajoutez un compte non par défaut à un canal qui utilise encore des paramètres de niveau supérieur à compte unique, OpenClaw promeut les valeurs de niveau supérieur limitées au compte dans la map des comptes du canal avant d’écrire le nouveau compte. La plupart des canaux placent ces valeurs dans `channels.<channel>.accounts.default`, mais les canaux intégrés peuvent conserver à la place un compte promu existant correspondant. Matrix est l’exemple actuel : si un compte nommé existe déjà, ou si `defaultAccount` pointe vers un compte nommé existant, la promotion conserve ce compte au lieu de créer un nouveau `accounts.default`.

Le comportement de routage reste cohérent :

- Les liaisons existantes limitées au canal (sans `accountId`) continuent de correspondre au compte par défaut.
- `channels add` ne crée ni ne réécrit automatiquement les liaisons en mode non interactif.
- La configuration interactive peut éventuellement ajouter des liaisons limitées au compte.

Si votre configuration était déjà dans un état mixte (comptes nommés présents et valeurs de niveau supérieur à compte unique toujours définies), exécutez `openclaw doctor --fix` pour déplacer les valeurs limitées au compte dans le compte promu choisi pour ce canal. La plupart des canaux sont promus dans `accounts.default` ; Matrix peut conserver une cible nommée/par défaut existante à la place.

## Connexion / déconnexion (interactif)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Remarques :

- `channels login` prend en charge `--verbose`.
- `channels login` / `logout` peuvent déduire le canal lorsqu’une seule cible de connexion prise en charge est configurée.

## Dépannage

- Exécutez `openclaw status --deep` pour un probe large.
- Utilisez `openclaw doctor` pour des corrections guidées.
- `openclaw channels list` affiche `Claude: HTTP 403 ... user:profile` → l’instantané d’usage nécessite la portée `user:profile`. Utilisez `--no-usage`, ou fournissez une clé de session claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), ou réauthentifiez-vous via la CLI Claude.
- `openclaw channels status` retombe sur des résumés basés uniquement sur la configuration lorsque la passerelle est injoignable. Si un identifiant de canal pris en charge est configuré via SecretRef mais indisponible dans le chemin de commande actuel, il signale ce compte comme configuré avec des remarques dégradées au lieu de l’afficher comme non configuré.

## Probe de capacités

Récupérez des indications de capacité du fournisseur (intentions/portées lorsque disponibles) ainsi que la prise en charge statique des fonctionnalités :

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Remarques :

- `--channel` est facultatif ; omettez-le pour lister tous les canaux (y compris les extensions).
- `--account` n’est valide qu’avec `--channel`.
- `--target` accepte `channel:<id>` ou un identifiant de canal numérique brut et ne s’applique qu’à Discord.
- Les probes sont propres au fournisseur : intentions Discord + permissions de canal facultatives ; portées bot + utilisateur Slack ; indicateurs de bot Telegram + webhook ; version du daemon Signal ; jeton d’application Microsoft Teams + rôles/portées Graph (annotés lorsque connus). Les canaux sans probes signalent `Probe: unavailable`.

## Résoudre les noms en identifiants

Résolvez les noms de canal/utilisateur en identifiants à l’aide de l’annuaire du fournisseur :

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Remarques :

- Utilisez `--kind user|group|auto` pour forcer le type de cible.
- La résolution privilégie les correspondances actives lorsque plusieurs entrées partagent le même nom.
- `channels resolve` est en lecture seule. Si un compte sélectionné est configuré via SecretRef mais que cet identifiant est indisponible dans le chemin de commande actuel, la commande renvoie des résultats dégradés non résolus avec des remarques au lieu d’abandonner toute l’exécution.
