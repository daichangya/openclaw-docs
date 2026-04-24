---
read_when:
    - Vous souhaitez ajouter/supprimer des comptes de canal (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Vous souhaitez vérifier l’état du canal ou suivre les journaux du canal en temps réel
summary: Référence CLI pour `openclaw channels` (accounts, status, login/logout, logs)
title: Canaux
x-i18n:
    generated_at: "2026-04-24T07:03:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31c0f3b830f12e8561ba52f70a599d8b572fcb0a9f9c25e5608860bb7e8661de
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Gérer les comptes de canaux de chat et leur état d’exécution sur le Gateway.

Documentation associée :

- Guides des canaux : [Canaux](/fr/channels/index)
- Configuration du Gateway : [Configuration](/fr/gateway/configuration)

## Commandes courantes

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Status / capabilities / resolve / logs

- `channels status` : `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities` : `--channel <name>`, `--account <id>` (uniquement avec `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve` : `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs` : `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` est le chemin en direct : sur un gateway joignable, il exécute par compte
les vérifications `probeAccount` et facultativement `auditAccount`, de sorte que la sortie peut inclure l’état
du transport ainsi que des résultats de sonde tels que `works`, `probe failed`, `audit ok` ou `audit failed`.
Si le Gateway est inaccessible, `channels status` revient à des résumés basés uniquement sur la configuration
au lieu d’une sortie de sonde en direct.

## Ajouter / supprimer des comptes

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Conseil : `openclaw channels add --help` affiche les indicateurs propres à chaque canal (jeton, clé privée, jeton d’application, chemins signal-cli, etc.).

Les surfaces d’ajout non interactives courantes incluent :

- canaux à jeton de bot : `--token`, `--bot-token`, `--app-token`, `--token-file`
- champs de transport Signal/iMessage : `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- champs Google Chat : `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- champs Matrix : `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- champs Nostr : `--private-key`, `--relay-urls`
- champs Tlon : `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` pour l’authentification du compte par défaut adossée aux variables d’environnement lorsque cela est pris en charge

Lorsque vous exécutez `openclaw channels add` sans indicateurs, l’assistant interactif peut demander :

- les ID de compte pour chaque canal sélectionné
- des noms d’affichage facultatifs pour ces comptes
- `Bind configured channel accounts to agents now?`

Si vous confirmez la liaison immédiate, l’assistant demande quel agent doit posséder chaque compte de canal configuré et écrit des liaisons de routage limitées au compte.

Vous pouvez aussi gérer ces mêmes règles de routage plus tard avec `openclaw agents bindings`, `openclaw agents bind` et `openclaw agents unbind` (voir [agents](/fr/cli/agents)).

Lorsque vous ajoutez un compte non par défaut à un canal qui utilise encore des paramètres de niveau supérieur à compte unique, OpenClaw promeut les valeurs de niveau supérieur limitées au compte dans la table des comptes du canal avant d’écrire le nouveau compte. La plupart des canaux placent ces valeurs dans `channels.<channel>.accounts.default`, mais les canaux intégrés peuvent à la place conserver un compte promu existant correspondant. Matrix est l’exemple actuel : si un compte nommé existe déjà, ou si `defaultAccount` pointe vers une clé de compte nommé existante, la promotion conserve ce compte au lieu de créer un nouveau `accounts.default`.

Le comportement de routage reste cohérent :

- Les liaisons existantes limitées au canal (sans `accountId`) continuent de correspondre au compte par défaut.
- `channels add` ne crée ni ne réécrit automatiquement les liaisons en mode non interactif.
- La configuration interactive peut ajouter facultativement des liaisons limitées au compte.

Si votre configuration est déjà dans un état mixte (comptes nommés présents et valeurs de niveau supérieur à compte unique encore définies), exécutez `openclaw doctor --fix` pour déplacer les valeurs limitées au compte dans le compte promu choisi pour ce canal. La plupart des canaux promeuvent vers `accounts.default` ; Matrix peut conserver une cible nommée/par défaut existante à la place.

## Login / logout (interactif)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Remarques :

- `channels login` prend en charge `--verbose`.
- `channels login` / `logout` peuvent déduire le canal lorsqu’une seule cible de connexion prise en charge est configurée.

## Dépannage

- Exécutez `openclaw status --deep` pour une sonde large.
- Utilisez `openclaw doctor` pour des correctifs guidés.
- `openclaw channels list` affiche `Claude: HTTP 403 ... user:profile` → le snapshot d’utilisation a besoin du périmètre `user:profile`. Utilisez `--no-usage`, ou fournissez une clé de session claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), ou réauthentifiez-vous via la CLI Claude.
- `openclaw channels status` revient à des résumés basés uniquement sur la configuration lorsque le Gateway est inaccessible. Si un identifiant de canal pris en charge est configuré via SecretRef mais indisponible dans le chemin de commande actuel, il signale ce compte comme configuré avec des notes dégradées au lieu de l’afficher comme non configuré.

## Sonde des capacités

Récupérer les indications de capacité du fournisseur (intentions/périmètres lorsque disponibles) ainsi que la prise en charge statique des fonctionnalités :

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Remarques :

- `--channel` est facultatif ; omettez-le pour lister tous les canaux (y compris les extensions).
- `--account` n’est valide qu’avec `--channel`.
- `--target` accepte `channel:<id>` ou un ID de canal numérique brut et ne s’applique qu’à Discord.
- Les sondes sont spécifiques au fournisseur : intentions Discord + permissions de canal facultatives ; périmètres bot + utilisateur Slack ; indicateurs de bot Telegram + Webhook ; version du démon Signal ; jeton d’application Microsoft Teams + rôles/périmètres Graph (annotés lorsqu’ils sont connus). Les canaux sans sonde affichent `Probe: unavailable`.

## Résoudre des noms en ID

Résoudre des noms de canal/utilisateur en ID en utilisant l’annuaire du fournisseur :

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Remarques :

- Utilisez `--kind user|group|auto` pour forcer le type de cible.
- La résolution privilégie les correspondances actives lorsque plusieurs entrées partagent le même nom.
- `channels resolve` est en lecture seule. Si un compte sélectionné est configuré via SecretRef mais que cet identifiant est indisponible dans le chemin de commande actuel, la commande renvoie des résultats non résolus dégradés avec des notes au lieu d’abandonner toute l’exécution.

## Associé

- [Référence CLI](/fr/cli)
- [Vue d’ensemble des canaux](/fr/channels)
