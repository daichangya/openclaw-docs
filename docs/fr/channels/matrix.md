---
read_when:
    - Configurer Matrix dans OpenClaw
    - Configurer E2EE et la vérification de Matrix
summary: Statut de prise en charge de Matrix, configuration et exemples de configuration
title: Matrix
x-i18n:
    generated_at: "2026-04-06T03:08:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e2d84c08d7d5b96db14b914e54f08d25334401cdd92eb890bc8dfb37b0ca2dc
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix est le plugin de canal Matrix intégré pour OpenClaw.
Il utilise le `matrix-js-sdk` officiel et prend en charge les DM, salons, fils, médias, réactions, sondages, localisation et E2EE.

## Plugin intégré

Matrix est livré comme plugin intégré dans les versions actuelles d'OpenClaw, donc les
builds packagés normaux n'ont pas besoin d'une installation séparée.

Si vous utilisez un build plus ancien ou une installation personnalisée qui exclut Matrix, installez-le
manuellement :

Installer depuis npm :

```bash
openclaw plugins install @openclaw/matrix
```

Installer depuis un checkout local :

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Voir [Plugins](/fr/tools/plugin) pour le comportement des plugins et les règles d'installation.

## Configuration

1. Assurez-vous que le plugin Matrix est disponible.
   - Les versions packagées actuelles d'OpenClaw l'intègrent déjà.
   - Les installations anciennes/personnalisées peuvent l'ajouter manuellement avec les commandes ci-dessus.
2. Créez un compte Matrix sur votre homeserver.
3. Configurez `channels.matrix` avec soit :
   - `homeserver` + `accessToken`, ou
   - `homeserver` + `userId` + `password`.
4. Redémarrez la passerelle.
5. Démarrez un DM avec le bot ou invitez-le dans un salon.

Chemins de configuration interactive :

```bash
openclaw channels add
openclaw configure --section channels
```

Ce que l'assistant Matrix demande réellement :

- URL du homeserver
- méthode d'authentification : jeton d'accès ou mot de passe
- ID utilisateur uniquement si vous choisissez l'authentification par mot de passe
- nom d'appareil facultatif
- si E2EE doit être activé
- si l'accès aux salons Matrix doit être configuré maintenant

Comportement de l'assistant important à connaître :

- Si des variables d'environnement d'authentification Matrix existent déjà pour le compte sélectionné, et que ce compte n'a pas déjà une authentification enregistrée dans la configuration, l'assistant propose un raccourci via variable d'environnement et n'écrit que `enabled: true` pour ce compte.
- Lorsque vous ajoutez un autre compte Matrix de manière interactive, le nom de compte saisi est normalisé en ID de compte utilisé dans la configuration et les variables d'environnement. Par exemple, `Ops Bot` devient `ops-bot`.
- Les invites d'allowlist DM acceptent immédiatement les valeurs complètes `@user:server`. Les noms d'affichage ne fonctionnent que lorsqu'une recherche en direct dans l'annuaire trouve une seule correspondance exacte ; sinon, l'assistant vous demande de réessayer avec un ID Matrix complet.
- Les invites d'allowlist de salon acceptent directement les ID de salon et les alias. Elles peuvent aussi résoudre en direct les noms des salons rejoints, mais les noms non résolus ne sont conservés tels quels que pendant la configuration et sont ensuite ignorés par la résolution d'allowlist à l'exécution. Préférez `!room:server` ou `#alias:server`.
- L'identité de salon/session à l'exécution utilise l'ID de salon Matrix stable. Les alias déclarés par le salon ne sont utilisés que comme entrées de recherche, pas comme clé de session à long terme ni comme identité de groupe stable.
- Pour résoudre les noms de salon avant de les enregistrer, utilisez `openclaw channels resolve --channel matrix "Project Room"`.

Configuration minimale basée sur un jeton :

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Configuration basée sur mot de passe (le jeton est mis en cache après connexion) :

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix stocke les identifiants mis en cache dans `~/.openclaw/credentials/matrix/`.
Le compte par défaut utilise `credentials.json` ; les comptes nommés utilisent `credentials-<account>.json`.
Lorsque des identifiants mis en cache existent à cet emplacement, OpenClaw considère Matrix comme configuré pour la configuration, doctor et la découverte de l'état du canal, même si l'authentification actuelle n'est pas définie directement dans la configuration.

Équivalents en variables d'environnement (utilisés lorsque la clé de configuration n'est pas définie) :

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Pour les comptes autres que le compte par défaut, utilisez des variables d'environnement spécifiques au compte :

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Exemple pour le compte `ops` :

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Pour l'ID de compte normalisé `ops-bot`, utilisez :

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix échappe la ponctuation dans les ID de compte pour éviter les collisions dans les variables d'environnement spécifiques.
Par exemple, `-` devient `_X2D_`, donc `ops-prod` est mappé vers `MATRIX_OPS_X2D_PROD_*`.

L'assistant interactif ne propose le raccourci via variable d'environnement que lorsque ces variables d'environnement d'authentification sont déjà présentes et que le compte sélectionné n'a pas déjà une authentification Matrix enregistrée dans la configuration.

## Exemple de configuration

Voici une configuration de base pratique avec appairage DM, allowlist de salon et E2EE activé :

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

## Aperçus en streaming

Le streaming de réponses Matrix est activé sur option.

Définissez `channels.matrix.streaming` sur `"partial"` si vous voulez qu'OpenClaw envoie une seule
réponse d'aperçu en direct, modifie cet aperçu sur place pendant que le modèle génère le texte,
puis la finalise lorsque la réponse est terminée :

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` est la valeur par défaut. OpenClaw attend la réponse finale et l'envoie une seule fois.
- `streaming: "partial"` crée un message d'aperçu modifiable pour le bloc assistant actuel en utilisant des messages texte Matrix normaux. Cela préserve le comportement historique de notification sur premier aperçu de Matrix, donc les clients standard peuvent notifier sur le premier texte d'aperçu diffusé plutôt que sur le bloc terminé.
- `streaming: "quiet"` crée un aperçu discret modifiable pour le bloc assistant actuel. Utilisez-le uniquement si vous configurez aussi des règles push côté destinataire pour les modifications d'aperçu finalisées.
- `blockStreaming: true` active des messages de progression Matrix séparés. Lorsque le streaming d'aperçu est activé, Matrix conserve le brouillon en direct pour le bloc actuel et préserve les blocs terminés comme messages séparés.
- Lorsque le streaming d'aperçu est activé et que `blockStreaming` est désactivé, Matrix modifie le brouillon en direct sur place et finalise ce même événement lorsque le bloc ou le tour se termine.
- Si l'aperçu ne tient plus dans un seul événement Matrix, OpenClaw arrête le streaming d'aperçu et revient à une livraison finale normale.
- Les réponses média continuent d'envoyer les pièces jointes normalement. Si un aperçu obsolète ne peut plus être réutilisé en toute sécurité, OpenClaw le masque avant d'envoyer la réponse média finale.
- Les modifications d'aperçu coûtent des appels API Matrix supplémentaires. Laissez le streaming désactivé si vous voulez le comportement le plus conservateur vis-à-vis des limites de débit.

`blockStreaming` n'active pas à lui seul les aperçus de brouillon.
Utilisez `streaming: "partial"` ou `streaming: "quiet"` pour les modifications d'aperçu ; ajoutez ensuite `blockStreaming: true` uniquement si vous voulez aussi que les blocs assistant terminés restent visibles comme messages de progression séparés.

Si vous avez besoin de notifications Matrix standard sans règles push personnalisées, utilisez `streaming: "partial"` pour un comportement premier aperçu, ou laissez `streaming` désactivé pour une livraison finale uniquement. Avec `streaming: "off"` :

- `blockStreaming: true` envoie chaque bloc terminé comme message Matrix normal avec notification.
- `blockStreaming: false` n'envoie que la réponse finale terminée comme message Matrix normal avec notification.

### Règles push auto-hébergées pour des aperçus finalisés discrets

Si vous exécutez votre propre infrastructure Matrix et souhaitez que les aperçus discrets ne notifient
que lorsqu'un bloc ou une réponse finale est terminé, définissez `streaming: "quiet"` et ajoutez une règle push par utilisateur pour les modifications d'aperçu finalisées.

Il s'agit généralement d'une configuration côté utilisateur destinataire, et non d'un changement de configuration global du homeserver :

Correspondance rapide avant de commencer :

- utilisateur destinataire = la personne qui doit recevoir la notification
- utilisateur bot = le compte Matrix OpenClaw qui envoie la réponse
- utilisez le jeton d'accès de l'utilisateur destinataire pour les appels API ci-dessous
- faites correspondre `sender` dans la règle push avec le MXID complet de l'utilisateur bot

1. Configurez OpenClaw pour utiliser des aperçus discrets :

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Assurez-vous que le compte destinataire reçoit déjà des notifications push Matrix normales. Les règles
   d'aperçu discret ne fonctionnent que si cet utilisateur a déjà des pushers/appareils fonctionnels.

3. Obtenez le jeton d'accès de l'utilisateur destinataire.
   - Utilisez le jeton de l'utilisateur qui reçoit, pas celui du bot.
   - Réutiliser un jeton de session client existant est généralement le plus simple.
   - Si vous devez générer un nouveau jeton, vous pouvez vous connecter via l'API Client-Server Matrix standard :

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. Vérifiez que le compte destinataire a déjà des pushers :

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Si cela ne renvoie aucun pusher/appareil actif, corrigez d'abord les notifications Matrix normales avant d'ajouter la
règle OpenClaw ci-dessous.

OpenClaw marque les modifications d'aperçu finalisées texte uniquement avec :

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Créez une règle push de type override pour chaque compte destinataire qui doit recevoir ces notifications :

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

Remplacez ces valeurs avant d'exécuter la commande :

- `https://matrix.example.org` : l'URL de base de votre homeserver
- `$USER_ACCESS_TOKEN` : le jeton d'accès de l'utilisateur destinataire
- `openclaw-finalized-preview-botname` : un ID de règle unique à ce bot pour cet utilisateur destinataire
- `@bot:example.org` : le MXID de votre bot Matrix OpenClaw, pas le MXID de l'utilisateur destinataire

Important pour les configurations multi-bot :

- Les règles push sont indexées par `ruleId`. Réexécuter `PUT` sur le même ID de règle met à jour cette règle.
- Si un utilisateur destinataire doit recevoir des notifications de plusieurs comptes bot Matrix OpenClaw, créez une règle par bot avec un ID de règle unique pour chaque correspondance `sender`.
- Un modèle simple est `openclaw-finalized-preview-<botname>`, par exemple `openclaw-finalized-preview-ops` ou `openclaw-finalized-preview-support`.

La règle est évaluée par rapport à l'expéditeur de l'événement :

- authentifiez-vous avec le jeton de l'utilisateur destinataire
- faites correspondre `sender` avec le MXID du bot OpenClaw

6. Vérifiez que la règle existe :

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Testez une réponse diffusée. En mode discret, le salon doit afficher un brouillon d'aperçu discret et la
   modification finale sur place doit notifier une fois le bloc ou le tour terminé.

Si vous devez supprimer la règle plus tard, supprimez ce même ID de règle avec le jeton de l'utilisateur destinataire :

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Remarques :

- Créez la règle avec le jeton d'accès de l'utilisateur destinataire, pas celui du bot.
- Les nouvelles règles `override` définies par l'utilisateur sont insérées avant les règles de suppression par défaut, donc aucun paramètre d'ordre supplémentaire n'est nécessaire.
- Cela n'affecte que les modifications d'aperçu texte uniquement qu'OpenClaw peut finaliser en toute sécurité sur place. Les replis média et les replis sur aperçu obsolète utilisent toujours la livraison Matrix normale.
- Si `GET /_matrix/client/v3/pushers` n'affiche aucun pusher, l'utilisateur n'a pas encore de livraison push Matrix fonctionnelle pour ce compte/appareil.

#### Synapse

Pour Synapse, la configuration ci-dessus est généralement suffisante à elle seule :

- Aucun changement spécial dans `homeserver.yaml` n'est requis pour les notifications d'aperçu OpenClaw finalisées.
- Si votre déploiement Synapse envoie déjà des notifications push Matrix normales, le jeton utilisateur + l'appel `pushrules` ci-dessus constituent la principale étape de configuration.
- Si vous exécutez Synapse derrière un proxy inverse ou des workers, assurez-vous que `/_matrix/client/.../pushrules/` atteint correctement Synapse.
- Si vous exécutez des workers Synapse, assurez-vous que les pushers sont sains. La livraison push est gérée par le processus principal ou par `synapse.app.pusher` / les workers pusher configurés.

#### Tuwunel

Pour Tuwunel, utilisez le même flux de configuration et le même appel API `pushrules` présentés ci-dessus :

- Aucune configuration spécifique à Tuwunel n'est requise pour le marqueur d'aperçu finalisé lui-même.
- Si les notifications Matrix normales fonctionnent déjà pour cet utilisateur, le jeton utilisateur + l'appel `pushrules` ci-dessus constituent la principale étape de configuration.
- Si les notifications semblent disparaître lorsque l'utilisateur est actif sur un autre appareil, vérifiez si `suppress_push_when_active` est activé. Tuwunel a ajouté cette option dans Tuwunel 1.4.2 le 12 septembre 2025, et elle peut intentionnellement supprimer les pushes vers d'autres appareils pendant qu'un appareil est actif.

## Chiffrement et vérification

Dans les salons chiffrés (E2EE), les événements d'image sortants utilisent `thumbnail_file` afin que les aperçus d'image soient chiffrés avec la pièce jointe complète. Les salons non chiffrés utilisent toujours `thumbnail_url` en clair. Aucune configuration n'est nécessaire — le plugin détecte automatiquement l'état E2EE.

### Salons bot à bot

Par défaut, les messages Matrix provenant d'autres comptes Matrix OpenClaw configurés sont ignorés.

Utilisez `allowBots` lorsque vous voulez intentionnellement du trafic Matrix inter-agent :

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` accepte les messages d'autres comptes bot Matrix configurés dans les salons et DM autorisés.
- `allowBots: "mentions"` accepte ces messages uniquement lorsqu'ils mentionnent visiblement ce bot dans les salons. Les DM restent autorisés.
- `groups.<room>.allowBots` remplace le paramètre au niveau du compte pour un salon.
- OpenClaw ignore toujours les messages du même ID utilisateur Matrix pour éviter les boucles de réponse à soi-même.
- Matrix n'expose pas ici d'indicateur natif de bot ; OpenClaw considère « rédigé par un bot » comme « envoyé par un autre compte Matrix configuré sur cette passerelle OpenClaw ».

Utilisez des allowlists de salon strictes et des exigences de mention lorsque vous activez le trafic bot à bot dans des salons partagés.

Activer le chiffrement :

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

Vérifier l'état de vérification :

```bash
openclaw matrix verify status
```

État détaillé (diagnostics complets) :

```bash
openclaw matrix verify status --verbose
```

Inclure la clé de récupération stockée dans la sortie lisible par machine :

```bash
openclaw matrix verify status --include-recovery-key --json
```

Initialiser l'état de cross-signing et de vérification :

```bash
openclaw matrix verify bootstrap
```

Prise en charge multi-comptes : utilisez `channels.matrix.accounts` avec des identifiants par compte et un `name` facultatif. Voir [Configuration reference](/fr/gateway/configuration-reference#multi-account-all-channels) pour le modèle partagé.

Diagnostics détaillés de l'initialisation :

```bash
openclaw matrix verify bootstrap --verbose
```

Forcer une réinitialisation fraîche de l'identité de cross-signing avant l'initialisation :

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Vérifier cet appareil avec une clé de récupération :

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Détails détaillés de la vérification de l'appareil :

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Vérifier l'état de santé de la sauvegarde des clés de salon :

```bash
openclaw matrix verify backup status
```

Diagnostics détaillés de l'état de santé de la sauvegarde :

```bash
openclaw matrix verify backup status --verbose
```

Restaurer les clés de salon à partir de la sauvegarde serveur :

```bash
openclaw matrix verify backup restore
```

Diagnostics détaillés de la restauration :

```bash
openclaw matrix verify backup restore --verbose
```

Supprimez la sauvegarde serveur actuelle et créez une nouvelle base de référence de sauvegarde. Si la
clé de sauvegarde stockée ne peut pas être chargée proprement, cette réinitialisation peut aussi recréer le stockage secret afin que
les futurs démarrages à froid puissent charger la nouvelle clé de sauvegarde :

```bash
openclaw matrix verify backup reset --yes
```

Toutes les commandes `verify` sont concises par défaut (y compris la journalisation SDK interne discrète) et n'affichent des diagnostics détaillés qu'avec `--verbose`.
Utilisez `--json` pour une sortie entièrement lisible par machine lors des scripts.

Dans les configurations multi-comptes, les commandes CLI Matrix utilisent le compte Matrix par défaut implicite sauf si vous passez `--account <id>`.
Si vous configurez plusieurs comptes nommés, définissez d'abord `channels.matrix.defaultAccount`, sinon ces opérations CLI implicites s'arrêteront et vous demanderont de choisir explicitement un compte.
Utilisez `--account` chaque fois que vous souhaitez que les opérations de vérification ou d'appareil ciblent explicitement un compte nommé :

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Lorsque le chiffrement est désactivé ou indisponible pour un compte nommé, les avertissements Matrix et les erreurs de vérification pointent vers la clé de configuration de ce compte, par exemple `channels.matrix.accounts.assistant.encryption`.

### Ce que signifie « vérifié »

OpenClaw considère cet appareil Matrix comme vérifié uniquement lorsqu'il est vérifié par votre propre identité de cross-signing.
En pratique, `openclaw matrix verify status --verbose` expose trois signaux de confiance :

- `Locally trusted` : cet appareil n'est approuvé que par le client actuel
- `Cross-signing verified` : le SDK signale l'appareil comme vérifié via le cross-signing
- `Signed by owner` : l'appareil est signé par votre propre clé de self-signing

`Verified by owner` ne devient `yes` que lorsque la vérification par cross-signing ou la signature par le propriétaire est présente.
La confiance locale seule ne suffit pas pour qu'OpenClaw considère l'appareil comme entièrement vérifié.

### Ce que fait l'initialisation

`openclaw matrix verify bootstrap` est la commande de réparation et de configuration pour les comptes Matrix chiffrés.
Elle fait tout ce qui suit dans cet ordre :

- initialise le stockage secret, en réutilisant une clé de récupération existante lorsque c'est possible
- initialise le cross-signing et téléverse les clés publiques de cross-signing manquantes
- tente de marquer et de cross-signer l'appareil actuel
- crée une nouvelle sauvegarde des clés de salon côté serveur si elle n'existe pas déjà

Si le homeserver exige une authentification interactive pour téléverser les clés de cross-signing, OpenClaw essaie d'abord le téléversement sans authentification, puis avec `m.login.dummy`, puis avec `m.login.password` lorsque `channels.matrix.password` est configuré.

Utilisez `--force-reset-cross-signing` uniquement lorsque vous voulez intentionnellement abandonner l'identité de cross-signing actuelle et en créer une nouvelle.

Si vous souhaitez intentionnellement abandonner la sauvegarde actuelle des clés de salon et démarrer une nouvelle
base de référence de sauvegarde pour les futurs messages, utilisez `openclaw matrix verify backup reset --yes`.
Ne faites cela que si vous acceptez qu'un ancien historique chiffré irrécupérable reste
indisponible et qu'OpenClaw puisse recréer le stockage secret si le secret de sauvegarde actuel
ne peut pas être chargé en toute sécurité.

### Nouvelle base de référence de sauvegarde

Si vous voulez conserver le fonctionnement des futurs messages chiffrés et acceptez de perdre l'ancien historique irrécupérable, exécutez ces commandes dans l'ordre :

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Ajoutez `--account <id>` à chaque commande lorsque vous voulez cibler explicitement un compte Matrix nommé.

### Comportement au démarrage

Lorsque `encryption: true`, Matrix définit par défaut `startupVerification` sur `"if-unverified"`.
Au démarrage, si cet appareil n'est toujours pas vérifié, Matrix demandera l'auto-vérification dans un autre client Matrix,
évitera les demandes en double tant qu'une demande est déjà en attente, et appliquera un délai local avant de réessayer après les redémarrages.
Par défaut, les tentatives de demande échouées réessaient plus tôt que la création réussie d'une demande.
Définissez `startupVerification: "off"` pour désactiver les demandes automatiques au démarrage, ou ajustez `startupVerificationCooldownHours`
si vous voulez une fenêtre de réessai plus courte ou plus longue.

Le démarrage effectue aussi automatiquement un passage conservateur d'initialisation crypto.
Ce passage essaie d'abord de réutiliser le stockage secret et l'identité de cross-signing actuels, et évite de réinitialiser le cross-signing sauf si vous exécutez un flux de réparation par initialisation explicite.

Si le démarrage détecte un état d'initialisation défectueux et que `channels.matrix.password` est configuré, OpenClaw peut tenter un chemin de réparation plus strict.
Si l'appareil actuel est déjà signé par le propriétaire, OpenClaw préserve cette identité au lieu de la réinitialiser automatiquement.

Mise à niveau depuis le précédent plugin Matrix public :

- OpenClaw réutilise automatiquement le même compte Matrix, jeton d'accès et identité d'appareil lorsque c'est possible.
- Avant l'exécution de toute modification de migration Matrix exploitable, OpenClaw crée ou réutilise un instantané de récupération sous `~/Backups/openclaw-migrations/`.
- Si vous utilisez plusieurs comptes Matrix, définissez `channels.matrix.defaultAccount` avant la mise à niveau depuis l'ancien agencement de stockage plat afin qu'OpenClaw sache quel compte doit recevoir cet état hérité partagé.
- Si le précédent plugin stockait localement une clé de déchiffrement de sauvegarde des clés de salon Matrix, le démarrage ou `openclaw doctor --fix` l'importera automatiquement dans le nouveau flux de clé de récupération.
- Si le jeton d'accès Matrix a changé après la préparation de la migration, le démarrage analyse désormais les racines de stockage de hachage de jeton voisines pour trouver un état de restauration hérité en attente avant d'abandonner la restauration automatique de sauvegarde.
- Si le jeton d'accès Matrix change plus tard pour le même compte, homeserver et utilisateur, OpenClaw préfère désormais réutiliser la racine de stockage par hachage de jeton existante la plus complète au lieu de repartir d'un répertoire d'état Matrix vide.
- Au prochain démarrage de la passerelle, les clés de salon sauvegardées sont restaurées automatiquement dans le nouveau magasin crypto.
- Si l'ancien plugin avait des clés de salon uniquement locales qui n'ont jamais été sauvegardées, OpenClaw affichera un avertissement clair. Ces clés ne peuvent pas être exportées automatiquement depuis l'ancien magasin crypto rust, donc une partie de l'ancien historique chiffré peut rester indisponible jusqu'à une récupération manuelle.
- Voir [Matrix migration](/fr/install/migrating-matrix) pour le flux complet de mise à niveau, les limites, les commandes de récupération et les messages de migration fréquents.

L'état chiffré à l'exécution est organisé sous des racines par compte, par utilisateur et par hachage de jeton dans
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Ce répertoire contient le magasin de synchronisation (`bot-storage.json`), le magasin crypto (`crypto/`),
le fichier de clé de récupération (`recovery-key.json`), l'instantané IndexedDB (`crypto-idb-snapshot.json`),
les liaisons de fil (`thread-bindings.json`) et l'état de vérification au démarrage (`startup-verification.json`)
lorsque ces fonctionnalités sont utilisées.
Lorsque le jeton change mais que l'identité du compte reste la même, OpenClaw réutilise la meilleure racine existante
pour ce tuple compte/homeserver/utilisateur afin que l'état de synchronisation antérieur, l'état crypto, les liaisons de fil
et l'état de vérification au démarrage restent visibles.

### Modèle de magasin crypto Node

Le E2EE Matrix dans ce plugin utilise le chemin crypto Rust officiel de `matrix-js-sdk` dans Node.
Ce chemin attend une persistance basée sur IndexedDB lorsque vous voulez que l'état crypto survive aux redémarrages.

OpenClaw fournit actuellement cela dans Node en :

- utilisant `fake-indexeddb` comme shim API IndexedDB attendu par le SDK
- restaurant le contenu IndexedDB du crypto Rust depuis `crypto-idb-snapshot.json` avant `initRustCrypto`
- persistant le contenu IndexedDB mis à jour vers `crypto-idb-snapshot.json` après l'initialisation et pendant l'exécution
- sérialisant la restauration et la persistance de l'instantané sur `crypto-idb-snapshot.json` avec un verrou de fichier consultatif afin que la persistance à l'exécution de la passerelle et la maintenance CLI n'entrent pas en conflit sur le même fichier d'instantané

Il s'agit d'une plomberie de compatibilité/stockage, pas d'une implémentation crypto personnalisée.
Le fichier d'instantané est un état d'exécution sensible et est stocké avec des permissions de fichier restrictives.
Dans le modèle de sécurité d'OpenClaw, l'hôte de la passerelle et le répertoire d'état OpenClaw local se trouvent déjà dans la limite de confiance de l'opérateur, il s'agit donc principalement d'une question de durabilité opérationnelle plutôt que d'une limite de confiance distante distincte.

Amélioration prévue :

- ajouter la prise en charge de SecretRef pour le matériel de clé Matrix persistant afin que les clés de récupération et les secrets liés au chiffrement du magasin puissent provenir des fournisseurs de secrets OpenClaw au lieu de fichiers locaux uniquement

## Gestion du profil

Mettez à jour l'auto-profil Matrix pour le compte sélectionné avec :

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Ajoutez `--account <id>` lorsque vous voulez cibler explicitement un compte Matrix nommé.

Matrix accepte directement les URL d'avatar `mxc://`. Lorsque vous passez une URL d'avatar `http://` ou `https://`, OpenClaw la téléverse d'abord sur Matrix puis enregistre l'URL `mxc://` résolue dans `channels.matrix.avatarUrl` (ou le remplacement du compte sélectionné).

## Notifications automatiques de vérification

Matrix publie désormais directement dans le salon DM strict de vérification les notifications de cycle de vie de vérification comme messages `m.notice`.
Cela inclut :

- notifications de demande de vérification
- notifications de vérification prête (avec indication explicite « Vérifier par emoji »)
- notifications de début et de fin de vérification
- détails SAS (emoji et décimal) lorsqu'ils sont disponibles

Les demandes de vérification entrantes depuis un autre client Matrix sont suivies et automatiquement acceptées par OpenClaw.
Pour les flux d'auto-vérification, OpenClaw démarre aussi automatiquement le flux SAS lorsque la vérification par emoji devient disponible et confirme automatiquement son propre côté.
Pour les demandes de vérification provenant d'un autre utilisateur/appareil Matrix, OpenClaw accepte automatiquement la demande puis attend que le flux SAS se poursuive normalement.
Vous devez toujours comparer les emoji ou le SAS décimal dans votre client Matrix et confirmer « Ils correspondent » là-bas pour terminer la vérification.

OpenClaw n'accepte pas automatiquement et aveuglément les flux en double initiés par lui-même. Au démarrage, il évite de créer une nouvelle demande lorsqu'une demande d'auto-vérification est déjà en attente.

Les notifications système/protocole de vérification ne sont pas transmises au pipeline de chat agent, donc elles ne produisent pas `NO_REPLY`.

### Hygiène des appareils

Les anciens appareils Matrix gérés par OpenClaw peuvent s'accumuler sur le compte et rendre la confiance dans les salons chiffrés plus difficile à comprendre.
Listez-les avec :

```bash
openclaw matrix devices list
```

Supprimez les appareils gérés par OpenClaw devenus obsolètes avec :

```bash
openclaw matrix devices prune-stale
```

### Réparation de salon direct

Si l'état des messages directs se désynchronise, OpenClaw peut se retrouver avec des mappages `m.direct` obsolètes qui pointent vers d'anciens salons solo au lieu du DM actif. Inspectez le mappage actuel pour un pair avec :

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Réparez-le avec :

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

La réparation conserve la logique spécifique à Matrix dans le plugin :

- elle préfère un DM strict 1:1 déjà mappé dans `m.direct`
- sinon, elle se replie sur n'importe quel DM strict 1:1 actuellement rejoint avec cet utilisateur
- si aucun DM sain n'existe, elle crée un nouveau salon direct et réécrit `m.direct` pour qu'il pointe vers lui

Le flux de réparation ne supprime pas automatiquement les anciens salons. Il choisit seulement le DM sain et met à jour le mappage afin que les nouveaux envois Matrix, les notifications de vérification et les autres flux de message direct ciblent à nouveau le bon salon.

## Fils

Matrix prend en charge les fils Matrix natifs à la fois pour les réponses automatiques et pour les envois via les outils de message.

- `dm.sessionScope: "per-user"` (par défaut) conserve le routage DM Matrix par expéditeur, de sorte que plusieurs salons DM peuvent partager une session lorsqu'ils se résolvent vers le même pair.
- `dm.sessionScope: "per-room"` isole chaque salon DM Matrix dans sa propre clé de session tout en continuant à utiliser l'authentification DM normale et les vérifications d'allowlist.
- Les liaisons explicites de conversation Matrix ont toujours priorité sur `dm.sessionScope`, donc les salons et fils liés conservent leur session cible choisie.
- `threadReplies: "off"` conserve les réponses au niveau supérieur et garde les messages entrants en fil sur la session parent.
- `threadReplies: "inbound"` répond dans un fil uniquement lorsque le message entrant était déjà dans ce fil.
- `threadReplies: "always"` conserve les réponses de salon dans un fil enraciné au message déclencheur et route cette conversation via la session à portée de fil correspondante à partir du premier message déclencheur.
- `dm.threadReplies` remplace le paramètre de niveau supérieur pour les DM uniquement. Par exemple, vous pouvez garder les fils de salon isolés tout en gardant les DM à plat.
- Les messages entrants en fil incluent le message racine du fil comme contexte supplémentaire pour l'agent.
- Les envois via les outils de message héritent désormais automatiquement du fil Matrix actuel lorsque la cible est le même salon, ou la même cible utilisateur DM, sauf si un `threadId` explicite est fourni.
- La réutilisation d'une cible utilisateur DM sur la même session n'intervient que lorsque les métadonnées de la session actuelle prouvent le même pair DM sur le même compte Matrix ; sinon OpenClaw revient au routage normal à portée utilisateur.
- Lorsque OpenClaw détecte qu'un salon DM Matrix entre en collision avec un autre salon DM sur la même session DM Matrix partagée, il publie un `m.notice` unique dans ce salon avec l'échappatoire `/focus` lorsque les liaisons de fil sont activées et avec l'indication `dm.sessionScope`.
- Les liaisons de fil à l'exécution sont prises en charge pour Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` et `/acp spawn` lié à un fil fonctionnent désormais dans les salons et DM Matrix.
- Le `/focus` Matrix de niveau supérieur dans un salon/DM crée un nouveau fil Matrix et le lie à la session cible lorsque `threadBindings.spawnSubagentSessions=true`.
- Exécuter `/focus` ou `/acp spawn --thread here` dans un fil Matrix existant lie ce fil actuel à la place.

## Liaisons de conversation ACP

Les salons Matrix, DM et fils Matrix existants peuvent être transformés en espaces de travail ACP durables sans modifier la surface de chat.

Flux opérateur rapide :

- Exécutez `/acp spawn codex --bind here` dans le DM Matrix, le salon ou le fil existant que vous voulez continuer à utiliser.
- Dans un DM ou salon Matrix de niveau supérieur, le DM/salon actuel reste la surface de chat et les futurs messages sont routés vers la session ACP créée.
- Dans un fil Matrix existant, `--bind here` lie ce fil actuel sur place.
- `/new` et `/reset` réinitialisent la même session ACP liée sur place.
- `/acp close` ferme la session ACP et supprime la liaison.

Remarques :

- `--bind here` ne crée pas de fil Matrix enfant.
- `threadBindings.spawnAcpSessions` n'est requis que pour `/acp spawn --thread auto|here`, lorsque OpenClaw doit créer ou lier un fil Matrix enfant.

### Configuration des liaisons de fil

Matrix hérite des valeurs globales par défaut depuis `session.threadBindings`, et prend aussi en charge des remplacements par canal :

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Les indicateurs de création liée à un fil Matrix sont activés sur option :

- Définissez `threadBindings.spawnSubagentSessions: true` pour permettre à `/focus` de niveau supérieur de créer et lier de nouveaux fils Matrix.
- Définissez `threadBindings.spawnAcpSessions: true` pour permettre à `/acp spawn --thread auto|here` de lier des sessions ACP à des fils Matrix.

## Réactions

Matrix prend en charge les actions de réaction sortantes, les notifications de réaction entrantes et les réactions d'accusé de réception entrantes.

- L'outillage de réaction sortante est contrôlé par `channels["matrix"].actions.reactions`.
- `react` ajoute une réaction à un événement Matrix spécifique.
- `reactions` liste le résumé actuel des réactions pour un événement Matrix spécifique.
- `emoji=""` supprime les réactions du propre compte bot sur cet événement.
- `remove: true` supprime uniquement la réaction emoji spécifiée du compte bot.

La portée des réactions d'accusé de réception est résolue dans cet ordre :

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- repli sur l'emoji d'identité de l'agent

La portée de la réaction d'accusé de réception se résout dans cet ordre :

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Le mode de notification des réactions se résout dans cet ordre :

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- par défaut : `own`

Comportement actuel :

- `reactionNotifications: "own"` transmet les événements `m.reaction` ajoutés lorsqu'ils ciblent des messages Matrix rédigés par le bot.
- `reactionNotifications: "off"` désactive les événements système de réaction.
- Les suppressions de réaction ne sont toujours pas synthétisées en événements système, car Matrix les expose comme des redactions, et non comme des suppressions autonomes de `m.reaction`.

## Contexte d'historique

- `channels.matrix.historyLimit` contrôle combien de messages récents du salon sont inclus comme `InboundHistory` lorsqu'un message de salon Matrix déclenche l'agent.
- Il se replie sur `messages.groupChat.historyLimit`. Définissez `0` pour désactiver.
- L'historique de salon Matrix est uniquement lié au salon. Les DM continuent d'utiliser l'historique normal de session.
- L'historique de salon Matrix est limité aux éléments en attente : OpenClaw met en tampon les messages de salon qui n'ont pas encore déclenché de réponse, puis capture cet intervalle lorsqu'une mention ou un autre déclencheur arrive.
- Le message déclencheur actuel n'est pas inclus dans `InboundHistory` ; il reste dans le corps entrant principal pour ce tour.
- Les nouvelles tentatives du même événement Matrix réutilisent l'instantané d'historique d'origine au lieu de dériver vers des messages de salon plus récents.

## Visibilité du contexte

Matrix prend en charge le contrôle partagé `contextVisibility` pour le contexte de salon supplémentaire tel que le texte de réponse récupéré, les racines de fil et l'historique en attente.

- `contextVisibility: "all"` est la valeur par défaut. Le contexte supplémentaire est conservé tel que reçu.
- `contextVisibility: "allowlist"` filtre le contexte supplémentaire aux expéditeurs autorisés par les vérifications actives d'allowlist salon/utilisateur.
- `contextVisibility: "allowlist_quote"` se comporte comme `allowlist`, mais conserve quand même une réponse citée explicite.

Ce paramètre affecte la visibilité du contexte supplémentaire, et non le fait que le message entrant lui-même puisse déclencher une réponse.
L'autorisation du déclenchement provient toujours de `groupPolicy`, `groups`, `groupAllowFrom` et des paramètres de politique DM.

## Exemple de politique DM et salon

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Voir [Groups](/fr/channels/groups) pour le comportement de contrôle par mention et d'allowlist.

Exemple d'appairage pour les DM Matrix :

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un utilisateur Matrix non approuvé continue à vous envoyer des messages avant l'approbation, OpenClaw réutilise le même code d'appairage en attente et peut renvoyer une réponse de rappel après un court délai au lieu d'en créer un nouveau.

Voir [Pairing](/fr/channels/pairing) pour le flux partagé d'appairage DM et l'agencement de stockage.

## Approbations exec

Matrix peut agir comme client d'approbation exec pour un compte Matrix.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (facultatif ; repli sur `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Les approbateurs doivent être des ID utilisateur Matrix tels que `@owner:example.org`. Matrix active automatiquement les approbations exec natives lorsque `enabled` n'est pas défini ou vaut `"auto"` et qu'au moins un approbateur peut être résolu, soit depuis `execApprovals.approvers`, soit depuis `channels.matrix.dm.allowFrom`. Définissez `enabled: false` pour désactiver explicitement Matrix comme client d'approbation natif. Les demandes d'approbation se replient sinon sur d'autres routes d'approbation configurées ou sur la politique de repli des approbations exec.

Le routage natif Matrix est aujourd'hui limité à exec :

- `channels.matrix.execApprovals.*` contrôle le routage natif DM/canal pour les approbations exec uniquement.
- Les approbations de plugin utilisent toujours le `/approve` partagé dans le même chat plus tout transfert `approvals.plugin` configuré.
- Matrix peut toujours réutiliser `channels.matrix.dm.allowFrom` pour l'autorisation des approbations de plugin lorsqu'il peut déduire les approbateurs en toute sécurité, mais il n'expose pas de chemin séparé natif de diffusion DM/canal pour les approbations de plugin.

Règles de livraison :

- `target: "dm"` envoie les invites d'approbation vers les DM des approbateurs
- `target: "channel"` renvoie l'invite dans le salon ou DM Matrix d'origine
- `target: "both"` envoie vers les DM des approbateurs et vers le salon ou DM Matrix d'origine

Les invites d'approbation Matrix initialisent des raccourcis de réaction sur le message principal d'approbation :

- `✅` = autoriser une fois
- `❌` = refuser
- `♾️` = toujours autoriser lorsque cette décision est permise par la politique exec effective

Les approbateurs peuvent réagir à ce message ou utiliser les commandes slash de repli : `/approve <id> allow-once`, `/approve <id> allow-always`, ou `/approve <id> deny`.

Seuls les approbateurs résolus peuvent autoriser ou refuser. La livraison sur canal inclut le texte de commande, donc n'activez `channel` ou `both` que dans des salons de confiance.

Les invites d'approbation Matrix réutilisent le planificateur d'approbation partagé du cœur. La surface native spécifique à Matrix n'est qu'un transport pour les approbations exec : routage salon/DM et comportement d'envoi/mise à jour/suppression de message.

Remplacement par compte :

- `channels.matrix.accounts.<account>.execApprovals`

Documentation connexe : [Exec approvals](/fr/tools/exec-approvals)

## Exemple multi-comptes

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

Les valeurs de niveau supérieur dans `channels.matrix` servent de valeurs par défaut pour les comptes nommés sauf si un compte les remplace.
Vous pouvez limiter les entrées de salon héritées à un compte Matrix avec `groups.<room>.account` (ou l'ancien `rooms.<room>.account`).
Les entrées sans `account` restent partagées entre tous les comptes Matrix, et les entrées avec `account: "default"` fonctionnent toujours lorsque le compte par défaut est configuré directement au niveau supérieur dans `channels.matrix.*`.
Les valeurs d'authentification partagées partielles ne créent pas à elles seules un compte par défaut implicite séparé. OpenClaw ne synthétise le compte `default` de niveau supérieur que lorsque ce compte par défaut a une authentification complète (`homeserver` plus `accessToken`, ou `homeserver` plus `userId` et `password`) ; les comptes nommés peuvent toujours rester détectables à partir de `homeserver` plus `userId` lorsque des identifiants mis en cache satisfont plus tard l'authentification.
Si Matrix a déjà exactement un compte nommé, ou si `defaultAccount` pointe vers une clé de compte nommé existante, la promotion de réparation/configuration d'un compte unique vers multi-comptes préserve ce compte au lieu de créer une nouvelle entrée `accounts.default`. Seules les clés d'authentification/initialisation Matrix sont déplacées vers ce compte promu ; les clés de politique de livraison partagées restent au niveau supérieur.
Définissez `defaultAccount` lorsque vous voulez qu'OpenClaw privilégie un compte Matrix nommé pour le routage implicite, les sondes et les opérations CLI.
Si vous configurez plusieurs comptes nommés, définissez `defaultAccount` ou passez `--account <id>` pour les commandes CLI qui dépendent de la sélection implicite du compte.
Passez `--account <id>` à `openclaw matrix verify ...` et `openclaw matrix devices ...` lorsque vous voulez remplacer cette sélection implicite pour une commande.

## Homeservers privés/LAN

Par défaut, OpenClaw bloque les homeservers Matrix privés/internes pour la protection SSRF sauf si vous
activez explicitement l'option compte par compte.

Si votre homeserver fonctionne sur localhost, une IP LAN/Tailscale ou un nom d'hôte interne, activez
`allowPrivateNetwork` pour ce compte Matrix :

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      allowPrivateNetwork: true,
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Exemple de configuration CLI :

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Cette activation explicite n'autorise que les cibles privées/internes de confiance. Les homeservers publics en clair tels que
`http://matrix.example.org:8008` restent bloqués. Préférez `https://` quand c'est possible.

## Proxy du trafic Matrix

Si votre déploiement Matrix nécessite un proxy HTTP(S) sortant explicite, définissez `channels.matrix.proxy` :

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Les comptes nommés peuvent remplacer la valeur par défaut de niveau supérieur avec `channels.matrix.accounts.<id>.proxy`.
OpenClaw utilise le même paramètre proxy pour le trafic Matrix à l'exécution et pour les sondes d'état de compte.

## Résolution de cible

Matrix accepte ces formes de cible partout où OpenClaw vous demande une cible de salon ou d'utilisateur :

- Utilisateurs : `@user:server`, `user:@user:server`, ou `matrix:user:@user:server`
- Salons : `!room:server`, `room:!room:server`, ou `matrix:room:!room:server`
- Alias : `#alias:server`, `channel:#alias:server`, ou `matrix:channel:#alias:server`

La recherche en direct dans l'annuaire utilise le compte Matrix connecté :

- Les recherches d'utilisateur interrogent l'annuaire utilisateur Matrix sur ce homeserver.
- Les recherches de salon acceptent directement les ID et alias explicites, puis se replient sur la recherche dans les noms des salons rejoints pour ce compte.
- La recherche de nom de salon rejoint est fournie au mieux. Si un nom de salon ne peut pas être résolu en ID ou alias, il est ignoré par la résolution d'allowlist à l'exécution.

## Référence de configuration

- `enabled` : activer ou désactiver le canal.
- `name` : libellé facultatif du compte.
- `defaultAccount` : ID de compte préféré lorsque plusieurs comptes Matrix sont configurés.
- `homeserver` : URL du homeserver, par exemple `https://matrix.example.org`.
- `allowPrivateNetwork` : autorise ce compte Matrix à se connecter à des homeservers privés/internes. Activez cette option lorsque le homeserver se résout vers `localhost`, une IP LAN/Tailscale, ou un hôte interne tel que `matrix-synapse`.
- `proxy` : URL de proxy HTTP(S) facultative pour le trafic Matrix. Les comptes nommés peuvent remplacer la valeur par défaut de niveau supérieur avec leur propre `proxy`.
- `userId` : ID utilisateur Matrix complet, par exemple `@bot:example.org`.
- `accessToken` : jeton d'accès pour l'authentification basée sur jeton. Les valeurs en texte clair et les valeurs SecretRef sont prises en charge pour `channels.matrix.accessToken` et `channels.matrix.accounts.<id>.accessToken` avec les fournisseurs env/file/exec. Voir [Secrets Management](/fr/gateway/secrets).
- `password` : mot de passe pour la connexion basée sur mot de passe. Les valeurs en texte clair et SecretRef sont prises en charge.
- `deviceId` : ID d'appareil Matrix explicite.
- `deviceName` : nom d'affichage de l'appareil pour la connexion par mot de passe.
- `avatarUrl` : URL d'avatar stockée pour la synchronisation de profil et les mises à jour `set-profile`.
- `initialSyncLimit` : limite d'événements de synchronisation au démarrage.
- `encryption` : activer E2EE.
- `allowlistOnly` : force un comportement allowlist uniquement pour les DM et les salons.
- `allowBots` : autorise les messages d'autres comptes Matrix OpenClaw configurés (`true` ou `"mentions"`).
- `groupPolicy` : `open`, `allowlist`, ou `disabled`.
- `contextVisibility` : mode de visibilité du contexte de salon supplémentaire (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom` : allowlist des ID utilisateur pour le trafic de salon.
- Les entrées `groupAllowFrom` doivent être des ID utilisateur Matrix complets. Les noms non résolus sont ignorés à l'exécution.
- `historyLimit` : nombre maximal de messages de salon à inclure comme contexte d'historique de groupe. Se replie sur `messages.groupChat.historyLimit`. Définissez `0` pour désactiver.
- `replyToMode` : `off`, `first`, ou `all`.
- `markdown` : configuration facultative du rendu Markdown pour le texte Matrix sortant.
- `streaming` : `off` (par défaut), `partial`, `quiet`, `true`, ou `false`. `partial` et `true` activent les mises à jour de brouillon en premier aperçu avec des messages texte Matrix normaux. `quiet` utilise des aperçus discrets sans notification pour les configurations auto-hébergées avec règles push.
- `blockStreaming` : `true` active des messages de progression séparés pour les blocs assistant terminés pendant que le streaming d'aperçu du brouillon est actif.
- `threadReplies` : `off`, `inbound`, ou `always`.
- `threadBindings` : remplacements par canal pour le routage et le cycle de vie des sessions liées à un fil.
- `startupVerification` : mode automatique de demande d'auto-vérification au démarrage (`if-unverified`, `off`).
- `startupVerificationCooldownHours` : délai avant de réessayer les demandes automatiques de vérification au démarrage.
- `textChunkLimit` : taille de fragmentation des messages sortants.
- `chunkMode` : `length` ou `newline`.
- `responsePrefix` : préfixe facultatif du message pour les réponses sortantes.
- `ackReaction` : remplacement facultatif de réaction d'accusé de réception pour ce canal/compte.
- `ackReactionScope` : remplacement facultatif de la portée de réaction d'accusé de réception (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications` : mode de notification des réactions entrantes (`own`, `off`).
- `mediaMaxMb` : limite de taille média en Mo pour la gestion des médias Matrix. Elle s'applique aux envois sortants et au traitement des médias entrants.
- `autoJoin` : politique d'auto-adhésion sur invitation (`always`, `allowlist`, `off`). Par défaut : `off`.
- `autoJoinAllowlist` : salons/alias autorisés lorsque `autoJoin` vaut `allowlist`. Les entrées d'alias sont résolues en ID de salon pendant la gestion d'invitation ; OpenClaw ne fait pas confiance à l'état d'alias revendiqué par le salon invité.
- `dm` : bloc de politique DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- Les entrées `dm.allowFrom` doivent être des ID utilisateur Matrix complets sauf si vous les avez déjà résolues via une recherche en direct dans l'annuaire.
- `dm.sessionScope` : `per-user` (par défaut) ou `per-room`. Utilisez `per-room` lorsque vous voulez que chaque salon DM Matrix conserve un contexte séparé même si le pair est le même.
- `dm.threadReplies` : remplacement de politique de fil spécifique aux DM (`off`, `inbound`, `always`). Il remplace le paramètre `threadReplies` de niveau supérieur pour le placement des réponses et l'isolation de session dans les DM.
- `execApprovals` : livraison native Matrix des approbations exec (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers` : ID utilisateur Matrix autorisés à approuver les demandes exec. Facultatif lorsque `dm.allowFrom` identifie déjà les approbateurs.
- `execApprovals.target` : `dm | channel | both` (par défaut : `dm`).
- `accounts` : remplacements nommés par compte. Les valeurs de niveau supérieur dans `channels.matrix` servent de valeurs par défaut pour ces entrées.
- `groups` : carte de politique par salon. Préférez les ID de salon ou les alias ; les noms de salon non résolus sont ignorés à l'exécution. L'identité de session/groupe utilise l'ID de salon stable après résolution, tandis que les libellés lisibles par des humains continuent de provenir des noms de salon.
- `groups.<room>.account` : limite une entrée de salon héritée à un compte Matrix spécifique dans les configurations multi-comptes.
- `groups.<room>.allowBots` : remplacement au niveau du salon pour les expéditeurs bots configurés (`true` ou `"mentions"`).
- `groups.<room>.users` : allowlist d'expéditeur par salon.
- `groups.<room>.tools` : remplacements par salon de type autoriser/refuser pour les outils.
- `groups.<room>.autoReply` : remplacement au niveau du salon pour le contrôle par mention. `true` désactive les exigences de mention pour ce salon ; `false` les force de nouveau.
- `groups.<room>.skills` : filtre facultatif de Skills au niveau du salon.
- `groups.<room>.systemPrompt` : extrait facultatif de prompt système au niveau du salon.
- `rooms` : ancien alias de `groups`.
- `actions` : contrôle des outils par action (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Connexe

- [Channels Overview](/fr/channels) — tous les canaux pris en charge
- [Pairing](/fr/channels/pairing) — authentification DM et flux d'appairage
- [Groups](/fr/channels/groups) — comportement de chat de groupe et contrôle par mention
- [Channel Routing](/fr/channels/channel-routing) — routage de session pour les messages
- [Security](/fr/gateway/security) — modèle d'accès et durcissement
