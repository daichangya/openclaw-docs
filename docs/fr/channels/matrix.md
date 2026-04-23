---
read_when:
    - Configurer Matrix dans OpenClaw
    - Configurer le chiffrement E2EE et la vérification de Matrix
summary: Statut de prise en charge de Matrix, configuration et exemples de configuration
title: Matrix
x-i18n:
    generated_at: "2026-04-23T13:57:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14873e9d65994138d26ad0bc1bf9bc6e00bea17f9306d592c757503d363de71a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix est un plugin de canal intégré pour OpenClaw.
Il utilise le `matrix-js-sdk` officiel et prend en charge les MP, les salons, les fils, les médias, les réactions, les sondages, la localisation et le chiffrement E2EE.

## Plugin intégré

Matrix est livré comme plugin intégré dans les versions actuelles d’OpenClaw, donc les
builds empaquetés normaux n’ont pas besoin d’une installation séparée.

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

Consultez [Plugins](/fr/tools/plugin) pour le comportement des plugins et les règles d’installation.

## Configuration

1. Assurez-vous que le plugin Matrix est disponible.
   - Les versions empaquetées actuelles d’OpenClaw l’intègrent déjà.
   - Les installations plus anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Créez un compte Matrix sur votre homeserver.
3. Configurez `channels.matrix` avec soit :
   - `homeserver` + `accessToken`, ou
   - `homeserver` + `userId` + `password`.
4. Redémarrez la Gateway.
5. Démarrez un MP avec le bot ou invitez-le dans un salon.
   - Les nouvelles invitations Matrix ne fonctionnent que lorsque `channels.matrix.autoJoin` les autorise.

Chemins de configuration interactifs :

```bash
openclaw channels add
openclaw configure --section channels
```

L’assistant Matrix demande :

- l’URL du homeserver
- la méthode d’authentification : jeton d’accès ou mot de passe
- l’ID utilisateur (authentification par mot de passe uniquement)
- le nom de l’appareil facultatif
- s’il faut activer le chiffrement E2EE
- s’il faut configurer l’accès aux salons et l’adhésion automatique sur invitation

Comportements clés de l’assistant :

- Si des variables d’environnement d’authentification Matrix existent déjà et que ce compte n’a pas encore d’authentification enregistrée dans la configuration, l’assistant propose un raccourci via variables d’environnement pour conserver l’authentification dans les variables d’environnement.
- Les noms de compte sont normalisés vers l’ID du compte. Par exemple, `Ops Bot` devient `ops-bot`.
- Les entrées de liste d’autorisation de MP acceptent directement `@user:server` ; les noms d’affichage ne fonctionnent que si la recherche en direct dans l’annuaire trouve une correspondance exacte unique.
- Les entrées de liste d’autorisation de salon acceptent directement les ID et alias de salon. Préférez `!room:server` ou `#alias:server` ; les noms non résolus sont ignorés à l’exécution par la résolution de la liste d’autorisation.
- En mode liste d’autorisation pour l’adhésion automatique sur invitation, utilisez uniquement des cibles d’invitation stables : `!roomId:server`, `#alias:server` ou `*`. Les noms de salon simples sont rejetés.
- Pour résoudre les noms de salon avant l’enregistrement, utilisez `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` vaut par défaut `off`.

Si vous le laissez non défini, le bot ne rejoindra pas les salons invités ni les nouvelles invitations de type MP, donc il n’apparaîtra pas dans les nouveaux groupes ou les MP invités, sauf si vous le faites rejoindre manuellement d’abord.

Définissez `autoJoin: "allowlist"` avec `autoJoinAllowlist` pour restreindre les invitations qu’il accepte, ou définissez `autoJoin: "always"` si vous voulez qu’il rejoigne chaque invitation.

En mode `allowlist`, `autoJoinAllowlist` accepte uniquement `!roomId:server`, `#alias:server` ou `*`.
</Warning>

Exemple de liste d’autorisation :

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Rejoindre chaque invitation :

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

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

Configuration basée sur un mot de passe (le jeton est mis en cache après la connexion) :

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
Lorsque des identifiants mis en cache existent à cet emplacement, OpenClaw considère Matrix comme configuré pour la configuration, doctor et la détection de l’état du canal, même si l’authentification actuelle n’est pas définie directement dans la configuration.

Équivalents en variables d’environnement (utilisés lorsque la clé de configuration n’est pas définie) :

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Pour les comptes non par défaut, utilisez des variables d’environnement spécifiques au compte :

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Exemple pour le compte `ops` :

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Pour l’ID de compte normalisé `ops-bot`, utilisez :

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix échappe la ponctuation dans les ID de compte afin d’éviter les collisions dans les variables d’environnement spécifiques.
Par exemple, `-` devient `_X2D_`, donc `ops-prod` correspond à `MATRIX_OPS_X2D_PROD_*`.

L’assistant interactif ne propose le raccourci via variable d’environnement que lorsque ces variables d’environnement d’authentification sont déjà présentes et que le compte sélectionné n’a pas déjà une authentification Matrix enregistrée dans la configuration.

`MATRIX_HOMESERVER` ne peut pas être défini depuis un `.env` d’espace de travail ; consultez [Fichiers `.env` de l’espace de travail](/fr/gateway/security).

## Exemple de configuration

Voici une configuration de base pratique avec appairage des MP, liste d’autorisation de salon et E2EE activé :

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

`autoJoin` s’applique à toutes les invitations Matrix, y compris les invitations de type MP. OpenClaw ne peut pas
classifier de manière fiable un salon invité comme MP ou groupe au moment de l’invitation, donc toutes les invitations passent d’abord par `autoJoin`.
`dm.policy` s’applique après que le bot a rejoint et que le salon est classé comme MP.

## Aperçus en streaming

Le streaming des réponses Matrix est optionnel.

Définissez `channels.matrix.streaming` sur `"partial"` lorsque vous voulez qu’OpenClaw envoie une seule réponse
d’aperçu en direct, modifie cet aperçu sur place pendant que le modèle génère du texte, puis le finalise lorsque la
réponse est terminée :

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` est la valeur par défaut. OpenClaw attend la réponse finale et l’envoie une seule fois.
- `streaming: "partial"` crée un message d’aperçu modifiable pour le bloc d’assistant actuel à l’aide de messages texte Matrix normaux. Cela préserve le comportement historique de notification sur premier aperçu de Matrix, donc les clients standard peuvent notifier sur le premier texte d’aperçu diffusé au lieu du bloc terminé.
- `streaming: "quiet"` crée un aperçu discret modifiable pour le bloc d’assistant actuel. Utilisez-le uniquement si vous configurez aussi des règles push côté destinataire pour les modifications d’aperçu finalisées.
- `blockStreaming: true` active des messages de progression Matrix séparés. Lorsque le streaming d’aperçu est activé, Matrix conserve le brouillon en direct pour le bloc actuel et préserve les blocs terminés comme messages séparés.
- Lorsque le streaming d’aperçu est activé et que `blockStreaming` est désactivé, Matrix modifie le brouillon en direct sur place et finalise ce même événement lorsque le bloc ou le tour se termine.
- Si l’aperçu ne tient plus dans un seul événement Matrix, OpenClaw arrête le streaming d’aperçu et revient à une livraison finale normale.
- Les réponses média continuent d’envoyer normalement les pièces jointes. Si un aperçu obsolète ne peut plus être réutilisé en toute sécurité, OpenClaw le retire avant d’envoyer la réponse média finale.
- Les modifications d’aperçu coûtent des appels supplémentaires à l’API Matrix. Laissez le streaming désactivé si vous voulez le comportement le plus prudent en matière de limitation de débit.

`blockStreaming` n’active pas à lui seul les aperçus de brouillon.
Utilisez `streaming: "partial"` ou `streaming: "quiet"` pour les modifications d’aperçu ; puis ajoutez `blockStreaming: true` uniquement si vous voulez aussi que les blocs d’assistant terminés restent visibles comme messages de progression séparés.

Si vous avez besoin des notifications Matrix standard sans règles push personnalisées, utilisez `streaming: "partial"` pour un comportement avec aperçu en premier, ou laissez `streaming` désactivé pour une livraison finale uniquement. Avec `streaming: "off"` :

- `blockStreaming: true` envoie chaque bloc terminé comme un message Matrix normal avec notification.
- `blockStreaming: false` envoie uniquement la réponse finale complète comme un message Matrix normal avec notification.

### Règles push auto-hébergées pour des aperçus finalisés discrets

Si vous exploitez votre propre infrastructure Matrix et voulez que les aperçus discrets notifient uniquement lorsqu’un bloc ou
une réponse finale est terminé, définissez `streaming: "quiet"` et ajoutez une règle push par utilisateur pour les modifications d’aperçu finalisées.

Il s’agit généralement d’une configuration côté utilisateur destinataire, et non d’un changement de configuration global du homeserver :

Repères rapides avant de commencer :

- utilisateur destinataire = la personne qui doit recevoir la notification
- utilisateur bot = le compte Matrix OpenClaw qui envoie la réponse
- utilisez le jeton d’accès de l’utilisateur destinataire pour les appels API ci-dessous
- faites correspondre `sender` dans la règle push avec le MXID complet de l’utilisateur bot

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

2. Assurez-vous que le compte destinataire reçoit déjà les notifications push Matrix normales. Les règles
   d’aperçu discret ne fonctionnent que si cet utilisateur dispose déjà de pushers/appareils opérationnels.

3. Récupérez le jeton d’accès de l’utilisateur destinataire.
   - Utilisez le jeton de l’utilisateur qui reçoit, pas celui du bot.
   - Réutiliser un jeton de session client existant est généralement le plus simple.
   - Si vous devez générer un nouveau jeton, vous pouvez vous connecter via l’API Client-Server Matrix standard :

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

Si cela ne renvoie aucun pusher/appareil actif, corrigez d’abord les notifications Matrix normales avant d’ajouter la
règle OpenClaw ci-dessous.

OpenClaw marque les modifications d’aperçu finalisées en texte seul avec :

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Créez une règle push de priorité supérieure pour chaque compte destinataire qui doit recevoir ces notifications :

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

Remplacez ces valeurs avant d’exécuter la commande :

- `https://matrix.example.org` : l’URL de base de votre homeserver
- `$USER_ACCESS_TOKEN` : le jeton d’accès de l’utilisateur destinataire
- `openclaw-finalized-preview-botname` : un ID de règle unique à ce bot pour cet utilisateur destinataire
- `@bot:example.org` : le MXID de votre bot Matrix OpenClaw, pas le MXID de l’utilisateur destinataire

Important pour les configurations avec plusieurs bots :

- Les règles push sont indexées par `ruleId`. Relancer `PUT` sur le même ID de règle met à jour cette règle.
- Si un même utilisateur destinataire doit recevoir des notifications pour plusieurs comptes bot Matrix OpenClaw, créez une règle par bot avec un ID de règle unique pour chaque correspondance d’expéditeur.
- Un schéma simple est `openclaw-finalized-preview-<botname>`, par exemple `openclaw-finalized-preview-ops` ou `openclaw-finalized-preview-support`.

La règle est évaluée par rapport à l’expéditeur de l’événement :

- authentifiez-vous avec le jeton de l’utilisateur destinataire
- faites correspondre `sender` au MXID du bot OpenClaw

6. Vérifiez que la règle existe :

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Testez une réponse en streaming. En mode discret, le salon doit afficher un brouillon d’aperçu discret et la
   modification finale sur place doit envoyer une notification une fois le bloc ou le tour terminé.

Si vous devez supprimer la règle plus tard, supprimez ce même ID de règle avec le jeton de l’utilisateur destinataire :

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Remarques :

- Créez la règle avec le jeton d’accès de l’utilisateur destinataire, pas celui du bot.
- Les nouvelles règles `override` définies par l’utilisateur sont insérées avant les règles de suppression par défaut, donc aucun paramètre d’ordre supplémentaire n’est nécessaire.
- Cela n’affecte que les modifications d’aperçu en texte seul qu’OpenClaw peut finaliser en toute sécurité sur place. Les replis pour médias et les replis d’aperçus obsolètes utilisent toujours la livraison Matrix normale.
- Si `GET /_matrix/client/v3/pushers` n’affiche aucun pusher, l’utilisateur ne dispose pas encore d’une livraison push Matrix fonctionnelle pour ce compte/appareil.

#### Synapse

Pour Synapse, la configuration ci-dessus est généralement suffisante à elle seule :

- Aucun changement spécial de `homeserver.yaml` n’est requis pour les notifications d’aperçu OpenClaw finalisées.
- Si votre déploiement Synapse envoie déjà des notifications push Matrix normales, le jeton utilisateur + l’appel `pushrules` ci-dessus constituent l’étape principale de configuration.
- Si vous exécutez Synapse derrière un proxy inverse ou des workers, assurez-vous que `/_matrix/client/.../pushrules/` atteint correctement Synapse.
- Si vous utilisez des workers Synapse, assurez-vous que les pushers sont en bon état. La livraison push est gérée par le processus principal ou par `synapse.app.pusher` / les workers pusher configurés.

#### Tuwunel

Pour Tuwunel, utilisez le même flux de configuration et le même appel d’API `pushrules` que ci-dessus :

- Aucune configuration spécifique à Tuwunel n’est requise pour le marqueur d’aperçu finalisé lui-même.
- Si les notifications Matrix normales fonctionnent déjà pour cet utilisateur, le jeton utilisateur + l’appel `pushrules` ci-dessus constituent l’étape principale de configuration.
- Si les notifications semblent disparaître pendant que l’utilisateur est actif sur un autre appareil, vérifiez si `suppress_push_when_active` est activé. Tuwunel a ajouté cette option dans Tuwunel 1.4.2 le 12 septembre 2025, et elle peut intentionnellement supprimer les notifications push vers d’autres appareils lorsqu’un appareil est actif.

## Salons bot à bot

Par défaut, les messages Matrix provenant d’autres comptes Matrix OpenClaw configurés sont ignorés.

Utilisez `allowBots` lorsque vous voulez intentionnellement du trafic Matrix inter-agents :

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

- `allowBots: true` accepte les messages d’autres comptes bot Matrix configurés dans les salons autorisés et les MP.
- `allowBots: "mentions"` accepte ces messages uniquement lorsqu’ils mentionnent visiblement ce bot dans les salons. Les MP restent autorisés.
- `groups.<room>.allowBots` remplace le paramètre au niveau du compte pour un salon.
- OpenClaw ignore toujours les messages provenant du même ID utilisateur Matrix afin d’éviter les boucles d’auto-réponse.
- Matrix n’expose pas ici d’indicateur natif de bot ; OpenClaw considère qu’un message est « rédigé par un bot » s’il est « envoyé par un autre compte Matrix configuré sur cette Gateway OpenClaw ».

Utilisez des listes d’autorisation de salons strictes et des exigences de mention lorsque vous activez le trafic bot à bot dans des salons partagés.

## Chiffrement et vérification

Dans les salons chiffrés (E2EE), les événements image sortants utilisent `thumbnail_file` afin que les aperçus d’image soient chiffrés en même temps que la pièce jointe complète. Les salons non chiffrés utilisent toujours `thumbnail_url` en clair. Aucune configuration n’est nécessaire — le plugin détecte automatiquement l’état E2EE.

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

Vérifier l’état de la vérification :

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

Initialiser l’état de cross-signing et de vérification :

```bash
openclaw matrix verify bootstrap
```

Diagnostics détaillés d’initialisation :

```bash
openclaw matrix verify bootstrap --verbose
```

Forcer une réinitialisation complète de l’identité de cross-signing avant l’initialisation :

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Vérifier cet appareil avec une clé de récupération :

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Détails détaillés de la vérification de l’appareil :

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Vérifier l’état de santé de la sauvegarde des clés de salon :

```bash
openclaw matrix verify backup status
```

Diagnostics détaillés de l’état de santé de la sauvegarde :

```bash
openclaw matrix verify backup status --verbose
```

Restaurer les clés de salon depuis la sauvegarde du serveur :

```bash
openclaw matrix verify backup restore
```

Diagnostics détaillés de la restauration :

```bash
openclaw matrix verify backup restore --verbose
```

Supprimer la sauvegarde actuelle du serveur et créer une nouvelle base de sauvegarde. Si la
clé de sauvegarde stockée ne peut pas être chargée proprement, cette réinitialisation peut aussi recréer le stockage secret afin que
les futurs démarrages à froid puissent charger la nouvelle clé de sauvegarde :

```bash
openclaw matrix verify backup reset --yes
```

Toutes les commandes `verify` sont concises par défaut (y compris la journalisation interne discrète du SDK) et n’affichent des diagnostics détaillés qu’avec `--verbose`.
Utilisez `--json` pour une sortie complète lisible par machine lors de l’écriture de scripts.

Dans les configurations multi-comptes, les commandes CLI Matrix utilisent le compte Matrix par défaut implicite sauf si vous passez `--account <id>`.
Si vous configurez plusieurs comptes nommés, définissez d’abord `channels.matrix.defaultAccount`, sinon ces opérations CLI implicites s’arrêteront et vous demanderont de choisir explicitement un compte.
Utilisez `--account` chaque fois que vous voulez que les opérations de vérification ou d’appareil ciblent explicitement un compte nommé :

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Lorsque le chiffrement est désactivé ou indisponible pour un compte nommé, les avertissements Matrix et les erreurs de vérification pointent vers la clé de configuration de ce compte, par exemple `channels.matrix.accounts.assistant.encryption`.

### Ce que signifie « vérifié »

OpenClaw considère cet appareil Matrix comme vérifié uniquement lorsqu’il est vérifié par votre propre identité de cross-signing.
En pratique, `openclaw matrix verify status --verbose` expose trois signaux de confiance :

- `Locally trusted` : cet appareil est approuvé uniquement par le client actuel
- `Cross-signing verified` : le SDK indique que l’appareil est vérifié via cross-signing
- `Signed by owner` : l’appareil est signé par votre propre clé d’auto-signature

`Verified by owner` devient `yes` uniquement lorsque la vérification par cross-signing ou la signature par le propriétaire est présente.
La confiance locale à elle seule ne suffit pas pour qu’OpenClaw considère l’appareil comme entièrement vérifié.

### Ce que fait l’initialisation

`openclaw matrix verify bootstrap` est la commande de réparation et de configuration pour les comptes Matrix chiffrés.
Elle effectue tout ce qui suit dans cet ordre :

- initialise le stockage secret, en réutilisant une clé de récupération existante si possible
- initialise le cross-signing et téléverse les clés publiques de cross-signing manquantes
- tente de marquer et de signer l’appareil actuel par cross-signing
- crée une nouvelle sauvegarde côté serveur des clés de salon si elle n’existe pas déjà

Si le homeserver exige une authentification interactive pour téléverser les clés de cross-signing, OpenClaw tente d’abord le téléversement sans authentification, puis avec `m.login.dummy`, puis avec `m.login.password` lorsque `channels.matrix.password` est configuré.

Utilisez `--force-reset-cross-signing` uniquement lorsque vous voulez intentionnellement supprimer l’identité de cross-signing actuelle et en créer une nouvelle.

Si vous voulez intentionnellement supprimer la sauvegarde actuelle des clés de salon et démarrer une nouvelle
base de sauvegarde pour les futurs messages, utilisez `openclaw matrix verify backup reset --yes`.
Faites-le uniquement si vous acceptez qu’un ancien historique chiffré irrécupérable reste
indisponible et qu’OpenClaw puisse recréer le stockage secret si le secret de sauvegarde actuel
ne peut pas être chargé en toute sécurité.

### Nouvelle base de sauvegarde

Si vous voulez que les futurs messages chiffrés continuent de fonctionner et acceptez de perdre l’ancien historique irrécupérable, exécutez ces commandes dans cet ordre :

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Ajoutez `--account <id>` à chaque commande lorsque vous voulez cibler explicitement un compte Matrix nommé.

### Comportement au démarrage

Lorsque `encryption: true`, Matrix définit par défaut `startupVerification` sur `"if-unverified"`.
Au démarrage, si cet appareil n’est toujours pas vérifié, Matrix demandera une auto-vérification dans un autre client Matrix,
ignorera les demandes en doublon tant qu’une demande est déjà en attente, et appliquera un délai local avant de réessayer après des redémarrages.
Les tentatives de demande échouées réessaient plus tôt que la création réussie d’une demande, par défaut.
Définissez `startupVerification: "off"` pour désactiver les demandes automatiques au démarrage, ou ajustez `startupVerificationCooldownHours`
si vous voulez une fenêtre de nouvelle tentative plus courte ou plus longue.

Le démarrage effectue aussi automatiquement un passage conservateur d’initialisation crypto.
Ce passage tente d’abord de réutiliser le stockage secret et l’identité de cross-signing actuels, et évite de réinitialiser le cross-signing sauf si vous exécutez un flux explicite de réparation par initialisation.

Si le démarrage détecte encore un état d’initialisation défectueux, OpenClaw peut tenter un chemin de réparation protégé même lorsque `channels.matrix.password` n’est pas configuré.
Si le homeserver exige une UIA basée sur mot de passe pour cette réparation, OpenClaw consigne un avertissement et garde le démarrage non fatal au lieu d’interrompre le bot.
Si l’appareil actuel est déjà signé par le propriétaire, OpenClaw préserve cette identité au lieu de la réinitialiser automatiquement.

Consultez [Migration Matrix](/fr/install/migrating-matrix) pour le flux complet de mise à niveau, les limites, les commandes de récupération et les messages de migration courants.

### Avis de vérification

Matrix publie directement dans le salon MP strict de vérification des avis de cycle de vie de vérification sous forme de messages `m.notice`.
Cela comprend :

- les avis de demande de vérification
- les avis de vérification prête (avec indication explicite « Verify by emoji »)
- les avis de début et de fin de vérification
- les détails SAS (emoji et décimal) lorsqu’ils sont disponibles

Les demandes de vérification entrantes provenant d’un autre client Matrix sont suivies et automatiquement acceptées par OpenClaw.
Pour les flux d’auto-vérification, OpenClaw démarre aussi automatiquement le flux SAS lorsque la vérification par emoji devient disponible et confirme son propre côté.
Pour les demandes de vérification provenant d’un autre utilisateur/appareil Matrix, OpenClaw accepte automatiquement la demande puis attend que le flux SAS se poursuive normalement.
Vous devez toujours comparer les emoji ou le SAS décimal dans votre client Matrix et confirmer « They match » là-bas pour terminer la vérification.

OpenClaw n’accepte pas automatiquement et aveuglément les flux en doublon auto-initiés. Au démarrage, il évite de créer une nouvelle demande lorsqu’une demande d’auto-vérification est déjà en attente.

Les avis de protocole/système de vérification ne sont pas transmis au pipeline de chat de l’agent, donc ils ne produisent pas `NO_REPLY`.

### Hygiène des appareils

Les anciens appareils Matrix gérés par OpenClaw peuvent s’accumuler sur le compte et rendre la confiance dans les salons chiffrés plus difficile à interpréter.
Listez-les avec :

```bash
openclaw matrix devices list
```

Supprimez les appareils obsolètes gérés par OpenClaw avec :

```bash
openclaw matrix devices prune-stale
```

### Magasin crypto

Le chiffrement E2EE de Matrix utilise le chemin crypto Rust officiel de `matrix-js-sdk` dans Node, avec `fake-indexeddb` comme shim IndexedDB. L’état crypto est conservé dans un fichier d’instantané (`crypto-idb-snapshot.json`) et restauré au démarrage. Le fichier d’instantané est un état d’exécution sensible stocké avec des autorisations de fichier restrictives.

L’état d’exécution chiffré se trouve sous des racines par compte, par utilisateur et par hachage de jeton dans
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Ce répertoire contient le magasin de synchronisation (`bot-storage.json`), le magasin crypto (`crypto/`),
le fichier de clé de récupération (`recovery-key.json`), l’instantané IndexedDB (`crypto-idb-snapshot.json`),
les liaisons de fils (`thread-bindings.json`) et l’état de vérification au démarrage (`startup-verification.json`).
Lorsque le jeton change mais que l’identité du compte reste la même, OpenClaw réutilise la meilleure racine existante
pour ce tuple compte/homeserver/utilisateur afin que l’état de synchronisation antérieur, l’état crypto, les liaisons de fils,
et l’état de vérification au démarrage restent visibles.

## Gestion du profil

Mettez à jour le profil Matrix du compte sélectionné avec :

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Ajoutez `--account <id>` lorsque vous voulez cibler explicitement un compte Matrix nommé.

Matrix accepte directement les URL d’avatar `mxc://`. Lorsque vous passez une URL d’avatar `http://` ou `https://`, OpenClaw la téléverse d’abord dans Matrix puis enregistre l’URL `mxc://` résolue dans `channels.matrix.avatarUrl` (ou dans la surcharge du compte sélectionné).

## Fils

Matrix prend en charge les fils Matrix natifs à la fois pour les réponses automatiques et pour les envois par outil de message.

- `dm.sessionScope: "per-user"` (par défaut) conserve un routage des MP Matrix limité à l’expéditeur, de sorte que plusieurs salons MP peuvent partager une session lorsqu’ils se résolvent vers le même pair.
- `dm.sessionScope: "per-room"` isole chaque salon MP Matrix dans sa propre clé de session tout en utilisant l’authentification MP normale et les vérifications de liste d’autorisation.
- Les liaisons explicites de conversation Matrix priment toujours sur `dm.sessionScope`, de sorte que les salons et fils liés conservent leur session cible choisie.
- `threadReplies: "off"` conserve les réponses au niveau supérieur et maintient les messages entrants en fil sur la session parente.
- `threadReplies: "inbound"` répond dans un fil uniquement lorsque le message entrant était déjà dans ce fil.
- `threadReplies: "always"` conserve les réponses du salon dans un fil enraciné au message déclencheur et fait passer cette conversation par la session limitée au fil correspondante à partir du premier message déclencheur.
- `dm.threadReplies` remplace le paramètre de niveau supérieur pour les MP uniquement. Par exemple, vous pouvez isoler les fils de salon tout en gardant les MP à plat.
- Les messages entrants en fil incluent le message racine du fil comme contexte supplémentaire pour l’agent.
- Les envois par outil de message héritent automatiquement du fil Matrix actuel lorsque la cible est le même salon, ou la même cible utilisateur en MP, sauf si un `threadId` explicite est fourni.
- La réutilisation d’une cible utilisateur MP de même session ne se déclenche que lorsque les métadonnées de la session actuelle prouvent qu’il s’agit du même pair MP sur le même compte Matrix ; sinon OpenClaw revient au routage normal limité à l’utilisateur.
- Lorsque OpenClaw détecte qu’un salon MP Matrix entre en collision avec un autre salon MP sur la même session MP Matrix partagée, il publie une fois un `m.notice` dans ce salon avec l’échappatoire `/focus` lorsque les liaisons de fils sont activées et l’indication `dm.sessionScope`.
- Les liaisons de fils d’exécution sont prises en charge pour Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` et `/acp spawn` lié à un fil fonctionnent dans les salons et MP Matrix.
- Un `/focus` de haut niveau dans un salon/MP Matrix crée un nouveau fil Matrix et le lie à la session cible lorsque `threadBindings.spawnSubagentSessions=true`.
- Exécuter `/focus` ou `/acp spawn --thread here` à l’intérieur d’un fil Matrix existant lie plutôt ce fil actuel.

## Liaisons de conversation ACP

Les salons, MP et fils Matrix existants peuvent être transformés en espaces de travail ACP durables sans modifier la surface de chat.

Flux opérateur rapide :

- Exécutez `/acp spawn codex --bind here` dans le MP, le salon ou le fil Matrix existant que vous voulez continuer à utiliser.
- Dans un MP ou salon Matrix de haut niveau, le MP/salon actuel reste la surface de chat et les futurs messages sont routés vers la session ACP créée.
- À l’intérieur d’un fil Matrix existant, `--bind here` lie ce fil actuel sur place.
- `/new` et `/reset` réinitialisent sur place la même session ACP liée.
- `/acp close` ferme la session ACP et supprime la liaison.

Remarques :

- `--bind here` ne crée pas de fil Matrix enfant.
- `threadBindings.spawnAcpSessions` n’est requis que pour `/acp spawn --thread auto|here`, lorsque OpenClaw doit créer ou lier un fil Matrix enfant.

### Configuration des liaisons de fils

Matrix hérite des valeurs globales par défaut depuis `session.threadBindings`, et prend aussi en charge des surcharges par canal :

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Les indicateurs de création liés aux fils Matrix sont optionnels :

- Définissez `threadBindings.spawnSubagentSessions: true` pour permettre à un `/focus` de haut niveau de créer et lier de nouveaux fils Matrix.
- Définissez `threadBindings.spawnAcpSessions: true` pour permettre à `/acp spawn --thread auto|here` de lier des sessions ACP à des fils Matrix.

## Réactions

Matrix prend en charge les actions de réaction sortantes, les notifications de réaction entrantes et les réactions d’accusé de réception entrantes.

- L’outillage de réaction sortante est contrôlé par `channels["matrix"].actions.reactions`.
- `react` ajoute une réaction à un événement Matrix spécifique.
- `reactions` liste le résumé actuel des réactions pour un événement Matrix spécifique.
- `emoji=""` supprime les propres réactions du compte bot sur cet événement.
- `remove: true` supprime uniquement la réaction emoji spécifiée du compte bot.

La portée des réactions d’accusé de réception se résout dans cet ordre :

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- repli sur l’emoji d’identité de l’agent

La portée des réactions d’accusé de réception se résout dans cet ordre :

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Le mode de notification des réactions se résout dans cet ordre :

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- valeur par défaut : `own`

Comportement :

- `reactionNotifications: "own"` transmet les événements `m.reaction` ajoutés lorsqu’ils ciblent des messages Matrix rédigés par le bot.
- `reactionNotifications: "off"` désactive les événements système de réaction.
- Les suppressions de réactions ne sont pas synthétisées en événements système parce que Matrix les expose comme des rédactions, et non comme des suppressions autonomes de `m.reaction`.

## Contexte d’historique

- `channels.matrix.historyLimit` contrôle combien de messages récents du salon sont inclus comme `InboundHistory` lorsqu’un message de salon Matrix déclenche l’agent. Revient à `messages.groupChat.historyLimit` ; si les deux ne sont pas définis, la valeur par défaut effective est `0`. Définissez `0` pour désactiver.
- L’historique des salons Matrix est limité au salon. Les MP continuent d’utiliser l’historique de session normal.
- L’historique des salons Matrix ne porte que sur les messages en attente : OpenClaw met en tampon les messages du salon qui n’ont pas encore déclenché de réponse, puis capture cette fenêtre lorsqu’une mention ou un autre déclencheur arrive.
- Le message déclencheur actuel n’est pas inclus dans `InboundHistory` ; il reste dans le corps entrant principal pour ce tour.
- Les nouvelles tentatives du même événement Matrix réutilisent l’instantané d’historique d’origine au lieu de dériver vers des messages de salon plus récents.

## Visibilité du contexte

Matrix prend en charge le contrôle partagé `contextVisibility` pour le contexte supplémentaire du salon, comme le texte de réponse récupéré, les racines de fils et l’historique en attente.

- `contextVisibility: "all"` est la valeur par défaut. Le contexte supplémentaire est conservé tel que reçu.
- `contextVisibility: "allowlist"` filtre le contexte supplémentaire vers les expéditeurs autorisés par les vérifications actives de liste d’autorisation de salon/utilisateur.
- `contextVisibility: "allowlist_quote"` se comporte comme `allowlist`, mais conserve tout de même une réponse citée explicite.

Ce paramètre affecte la visibilité du contexte supplémentaire, pas la possibilité pour le message entrant lui-même de déclencher une réponse.
L’autorisation de déclenchement provient toujours de `groupPolicy`, `groups`, `groupAllowFrom` et des paramètres de politique MP.

## Politique de MP et de salon

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

Consultez [Groups](/fr/channels/groups) pour le filtrage par mention et le comportement de liste d’autorisation.

Exemple d’appairage pour les MP Matrix :

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un utilisateur Matrix non approuvé continue à vous envoyer des messages avant approbation, OpenClaw réutilise le même code d’appairage en attente et peut renvoyer une réponse de rappel après un court délai au lieu de générer un nouveau code.

Consultez [Pairing](/fr/channels/pairing) pour le flux partagé d’appairage MP et la disposition du stockage.

## Réparation des salons directs

Si l’état des messages directs se désynchronise, OpenClaw peut se retrouver avec des mappages `m.direct` obsolètes qui pointent vers d’anciens salons solo au lieu du MP actif. Inspectez le mappage actuel pour un pair avec :

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Réparez-le avec :

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Le flux de réparation :

- préfère un MP strict 1:1 déjà mappé dans `m.direct`
- se replie sur n’importe quel MP strict 1:1 actuellement rejoint avec cet utilisateur
- crée un nouveau salon direct et réécrit `m.direct` si aucun MP sain n’existe

Le flux de réparation ne supprime pas automatiquement les anciens salons. Il choisit seulement le MP sain et met à jour le mappage afin que les nouveaux envois Matrix, les avis de vérification et les autres flux de messages directs ciblent à nouveau le bon salon.

## Approbations exec

Matrix peut agir comme client d’approbation natif pour un compte Matrix. Les réglages
de routage natif MP/canal restent sous la configuration d’approbation exec :

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (facultatif ; revient à `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Les approbateurs doivent être des ID utilisateur Matrix tels que `@owner:example.org`. Matrix active automatiquement les approbations natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur peut être résolu. Les approbations exec utilisent d’abord `execApprovals.approvers` et peuvent revenir à `channels.matrix.dm.allowFrom`. Les approbations de Plugin autorisent via `channels.matrix.dm.allowFrom`. Définissez `enabled: false` pour désactiver explicitement Matrix comme client d’approbation natif. Sinon, les demandes d’approbation reviennent à d’autres routes d’approbation configurées ou à la politique de repli d’approbation.

Le routage natif Matrix prend en charge les deux types d’approbation :

- `channels.matrix.execApprovals.*` contrôle le mode natif de diffusion MP/canal pour les invites d’approbation Matrix.
- Les approbations exec utilisent l’ensemble d’approbateurs exec depuis `execApprovals.approvers` ou `channels.matrix.dm.allowFrom`.
- Les approbations de Plugin utilisent la liste d’autorisation des MP Matrix depuis `channels.matrix.dm.allowFrom`.
- Les raccourcis par réaction Matrix et les mises à jour de message s’appliquent à la fois aux approbations exec et aux approbations de Plugin.

Règles de livraison :

- `target: "dm"` envoie les invites d’approbation dans les MP des approbateurs
- `target: "channel"` renvoie l’invite dans le salon ou MP Matrix d’origine
- `target: "both"` envoie dans les MP des approbateurs et dans le salon ou MP Matrix d’origine

Les invites d’approbation Matrix initialisent des raccourcis par réaction sur le message d’approbation principal :

- `✅` = autoriser une fois
- `❌` = refuser
- `♾️` = toujours autoriser lorsque cette décision est permise par la politique exec effective

Les approbateurs peuvent réagir sur ce message ou utiliser les commandes slash de repli : `/approve <id> allow-once`, `/approve <id> allow-always`, ou `/approve <id> deny`.

Seuls les approbateurs résolus peuvent autoriser ou refuser. Pour les approbations exec, la livraison par canal inclut le texte de la commande, donc n’activez `channel` ou `both` que dans des salons de confiance.

Surcharge par compte :

- `channels.matrix.accounts.<account>.execApprovals`

Documentation associée : [Approbations exec](/fr/tools/exec-approvals)

## Commandes slash

Les commandes slash Matrix (par exemple `/new`, `/reset`, `/model`) fonctionnent directement dans les MP. Dans les salons, OpenClaw reconnaît aussi les commandes slash préfixées par la propre mention Matrix du bot, de sorte que `@bot:server /new` déclenche le chemin de commande sans nécessiter de regex de mention personnalisée. Cela permet au bot de rester réactif aux messages de style salon `@mention /command` qu’Element et des clients similaires émettent lorsqu’un utilisateur complète le bot par tabulation avant de saisir la commande.

Les règles d’autorisation s’appliquent toujours : les expéditeurs de commandes doivent satisfaire les politiques de liste d’autorisation ou de propriétaire pour les MP ou les salons, tout comme pour les messages ordinaires.

## Multi-comptes

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

Les valeurs de niveau supérieur dans `channels.matrix` servent de valeurs par défaut pour les comptes nommés, sauf si un compte les surcharge.
Vous pouvez limiter les entrées de salon héritées à un seul compte Matrix avec `groups.<room>.account`.
Les entrées sans `account` restent partagées entre tous les comptes Matrix, et les entrées avec `account: "default"` continuent de fonctionner lorsque le compte par défaut est configuré directement au niveau supérieur dans `channels.matrix.*`.
Des valeurs par défaut d’authentification partagées partielles ne créent pas à elles seules un compte implicite par défaut distinct. OpenClaw ne synthétise le compte `default` de niveau supérieur que lorsque ce compte par défaut a une authentification fraîche (`homeserver` plus `accessToken`, ou `homeserver` plus `userId` et `password`) ; les comptes nommés peuvent néanmoins rester détectables à partir de `homeserver` plus `userId` lorsque des identifiants mis en cache satisfont l’authentification plus tard.
Si Matrix a déjà exactement un compte nommé, ou si `defaultAccount` pointe vers une clé de compte nommé existante, la promotion de réparation/configuration d’un compte unique vers plusieurs comptes préserve ce compte au lieu de créer une nouvelle entrée `accounts.default`. Seules les clés d’authentification/d’initialisation Matrix sont déplacées dans ce compte promu ; les clés partagées de politique de livraison restent au niveau supérieur.
Définissez `defaultAccount` lorsque vous voulez qu’OpenClaw privilégie un compte Matrix nommé pour le routage implicite, la détection et les opérations CLI.
Si plusieurs comptes Matrix sont configurés et qu’un ID de compte vaut `default`, OpenClaw utilise ce compte implicitement même si `defaultAccount` n’est pas défini.
Si vous configurez plusieurs comptes nommés, définissez `defaultAccount` ou passez `--account <id>` pour les commandes CLI qui reposent sur une sélection implicite du compte.
Passez `--account <id>` à `openclaw matrix verify ...` et `openclaw matrix devices ...` lorsque vous voulez remplacer cette sélection implicite pour une commande.

Consultez [Référence de configuration](/fr/gateway/configuration-reference#multi-account-all-channels) pour le modèle multi-comptes partagé.

## Homeservers privés/LAN

Par défaut, OpenClaw bloque les homeservers Matrix privés/internes pour la protection SSRF, sauf si vous
activez explicitement cette possibilité compte par compte.

Si votre homeserver s’exécute sur localhost, une IP LAN/Tailscale, ou un nom d’hôte interne, activez
`network.dangerouslyAllowPrivateNetwork` pour ce compte Matrix :

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
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

Cette activation explicite n’autorise que des cibles privées/internes de confiance. Les homeservers publics en clair tels que
`http://matrix.example.org:8008` restent bloqués. Préférez `https://` dès que possible.

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

Les comptes nommés peuvent surcharger la valeur par défaut de niveau supérieur avec `channels.matrix.accounts.<id>.proxy`.
OpenClaw utilise le même paramètre de proxy pour le trafic Matrix d’exécution et les sondes d’état des comptes.

## Résolution des cibles

Matrix accepte ces formes de cible partout où OpenClaw vous demande une cible de salon ou d’utilisateur :

- Utilisateurs : `@user:server`, `user:@user:server`, ou `matrix:user:@user:server`
- Salons : `!room:server`, `room:!room:server`, ou `matrix:room:!room:server`
- Alias : `#alias:server`, `channel:#alias:server`, ou `matrix:channel:#alias:server`

La recherche en direct dans l’annuaire utilise le compte Matrix connecté :

- Les recherches d’utilisateurs interrogent l’annuaire d’utilisateurs Matrix sur ce homeserver.
- Les recherches de salons acceptent directement les ID et alias explicites de salon, puis reviennent à une recherche dans les noms des salons rejoints pour ce compte.
- La recherche par nom de salon rejoint est au mieux. Si un nom de salon ne peut pas être résolu en ID ou alias, il est ignoré par la résolution de liste d’autorisation à l’exécution.

## Référence de configuration

- `enabled` : active ou désactive le canal.
- `name` : étiquette facultative pour le compte.
- `defaultAccount` : ID de compte préféré lorsque plusieurs comptes Matrix sont configurés.
- `homeserver` : URL du homeserver, par exemple `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork` : autorise ce compte Matrix à se connecter à des homeservers privés/internes. Activez cette option lorsque le homeserver se résout vers `localhost`, une IP LAN/Tailscale, ou un hôte interne tel que `matrix-synapse`.
- `proxy` : URL facultative d’un proxy HTTP(S) pour le trafic Matrix. Les comptes nommés peuvent surcharger la valeur par défaut de niveau supérieur avec leur propre `proxy`.
- `userId` : ID utilisateur Matrix complet, par exemple `@bot:example.org`.
- `accessToken` : jeton d’accès pour l’authentification par jeton. Les valeurs en clair et les valeurs SecretRef sont prises en charge pour `channels.matrix.accessToken` et `channels.matrix.accounts.<id>.accessToken` via les fournisseurs env/file/exec. Consultez [Gestion des secrets](/fr/gateway/secrets).
- `password` : mot de passe pour la connexion par mot de passe. Les valeurs en clair et les valeurs SecretRef sont prises en charge.
- `deviceId` : ID d’appareil Matrix explicite.
- `deviceName` : nom d’affichage de l’appareil pour la connexion par mot de passe.
- `avatarUrl` : URL d’avatar personnel stockée pour la synchronisation du profil et les mises à jour `profile set`.
- `initialSyncLimit` : nombre maximal d’événements récupérés pendant la synchronisation de démarrage.
- `encryption` : active le chiffrement E2EE.
- `allowlistOnly` : lorsqu’elle vaut `true`, convertit la politique de salon `open` en `allowlist`, et force toutes les politiques MP actives sauf `disabled` (y compris `pairing` et `open`) à `allowlist`. N’affecte pas les politiques `disabled`.
- `allowBots` : autorise les messages d’autres comptes Matrix OpenClaw configurés (`true` ou `"mentions"`).
- `groupPolicy` : `open`, `allowlist`, ou `disabled`.
- `contextVisibility` : mode de visibilité du contexte supplémentaire du salon (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom` : liste d’autorisation d’ID utilisateur pour le trafic de salon. Les ID utilisateur Matrix complets sont les plus sûrs ; les correspondances exactes de l’annuaire sont résolues au démarrage et lorsque la liste d’autorisation change pendant l’exécution du moniteur. Les noms non résolus sont ignorés.
- `historyLimit` : nombre maximal de messages de salon à inclure comme contexte d’historique de groupe. Revient à `messages.groupChat.historyLimit` ; si les deux ne sont pas définis, la valeur par défaut effective est `0`. Définissez `0` pour désactiver.
- `replyToMode` : `off`, `first`, `all`, ou `batched`.
- `markdown` : configuration facultative de rendu Markdown pour le texte Matrix sortant.
- `streaming` : `off` (par défaut), `"partial"`, `"quiet"`, `true`, ou `false`. `"partial"` et `true` activent les mises à jour de brouillon avec aperçu d’abord à l’aide de messages texte Matrix normaux. `"quiet"` utilise des avis d’aperçu sans notification pour les configurations auto-hébergées avec règles push. `false` est équivalent à `"off"`.
- `blockStreaming` : `true` active des messages de progression séparés pour les blocs d’assistant terminés pendant que le streaming de brouillon d’aperçu est actif.
- `threadReplies` : `off`, `inbound`, ou `always`.
- `threadBindings` : surcharges par canal pour le routage et le cycle de vie des sessions liées à un fil.
- `startupVerification` : mode automatique de demande d’auto-vérification au démarrage (`if-unverified`, `off`).
- `startupVerificationCooldownHours` : délai avant nouvelle tentative des demandes automatiques de vérification au démarrage.
- `textChunkLimit` : taille des fragments de message sortants en caractères (s’applique lorsque `chunkMode` vaut `length`).
- `chunkMode` : `length` divise les messages par nombre de caractères ; `newline` les divise aux limites de ligne.
- `responsePrefix` : chaîne facultative préfixée à toutes les réponses sortantes de ce canal.
- `ackReaction` : surcharge facultative de réaction d’accusé de réception pour ce canal/compte.
- `ackReactionScope` : surcharge facultative de portée de réaction d’accusé de réception (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications` : mode de notification des réactions entrantes (`own`, `off`).
- `mediaMaxMb` : limite de taille des médias en Mo pour les envois sortants et le traitement des médias entrants.
- `autoJoin` : politique d’adhésion automatique sur invitation (`always`, `allowlist`, `off`). Par défaut : `off`. S’applique à toutes les invitations Matrix, y compris les invitations de type MP.
- `autoJoinAllowlist` : salons/alias autorisés lorsque `autoJoin` vaut `allowlist`. Les entrées d’alias sont résolues en ID de salon pendant le traitement de l’invitation ; OpenClaw ne fait pas confiance à l’état d’alias revendiqué par le salon invité.
- `dm` : bloc de politique MP (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy` : contrôle l’accès MP après qu’OpenClaw a rejoint le salon et l’a classé comme MP. Cela ne change pas si une invitation est rejointe automatiquement.
- `dm.allowFrom` : liste d’autorisation d’ID utilisateur pour le trafic MP. Les ID utilisateur Matrix complets sont les plus sûrs ; les correspondances exactes de l’annuaire sont résolues au démarrage et lorsque la liste d’autorisation change pendant l’exécution du moniteur. Les noms non résolus sont ignorés.
- `dm.sessionScope` : `per-user` (par défaut) ou `per-room`. Utilisez `per-room` lorsque vous voulez que chaque salon MP Matrix conserve un contexte séparé même si le pair est le même.
- `dm.threadReplies` : surcharge de politique de fil réservée aux MP (`off`, `inbound`, `always`). Elle remplace le paramètre `threadReplies` de niveau supérieur à la fois pour le placement des réponses et pour l’isolation des sessions dans les MP.
- `execApprovals` : livraison native Matrix des approbations exec (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers` : ID utilisateur Matrix autorisés à approuver les demandes exec. Facultatif lorsque `dm.allowFrom` identifie déjà les approbateurs.
- `execApprovals.target` : `dm | channel | both` (par défaut : `dm`).
- `accounts` : surcharges nommées par compte. Les valeurs de niveau supérieur dans `channels.matrix` servent de valeurs par défaut pour ces entrées.
- `groups` : map de politique par salon. Préférez les ID ou alias de salon ; les noms de salon non résolus sont ignorés à l’exécution. L’identité de session/groupe utilise l’ID de salon stable après résolution.
- `groups.<room>.account` : limite une entrée de salon héritée à un compte Matrix spécifique dans les configurations multi-comptes.
- `groups.<room>.allowBots` : surcharge au niveau du salon pour les expéditeurs bot configurés (`true` ou `"mentions"`).
- `groups.<room>.users` : liste d’autorisation des expéditeurs par salon.
- `groups.<room>.tools` : surcharges d’autorisation/refus d’outils par salon.
- `groups.<room>.autoReply` : surcharge au niveau du salon pour le filtrage par mention. `true` désactive les exigences de mention pour ce salon ; `false` les réactive de force.
- `groups.<room>.skills` : filtre Skills facultatif au niveau du salon.
- `groups.<room>.systemPrompt` : extrait facultatif de prompt système au niveau du salon.
- `rooms` : alias historique de `groups`.
- `actions` : contrôle d’accès par action (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Associé

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Pairing](/fr/channels/pairing) — authentification MP et flux d’appairage
- [Groups](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement
