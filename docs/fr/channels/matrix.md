---
read_when:
    - Configuration de Matrix dans OpenClaw
    - Configuration du chiffrement de bout en bout et de la vérification de Matrix
summary: Statut de prise en charge de Matrix, configuration initiale et exemples de configuration
title: Matrix
x-i18n:
    generated_at: "2026-04-24T07:00:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf25a6f64ed310f33b72517ccd1526876e27caae240e9fa837a86ca2c392ab25
    source_path: channels/matrix.md
    workflow: 15
---

Matrix est un Plugin de canal intégré pour OpenClaw.
Il utilise le `matrix-js-sdk` officiel et prend en charge les messages privés, les salons, les fils, les médias, les réactions, les sondages, la localisation et le chiffrement de bout en bout.

## Plugin intégré

Matrix est livré comme un Plugin intégré dans les versions actuelles d’OpenClaw, donc
les builds empaquetés normaux ne nécessitent pas d’installation séparée.

Si vous utilisez une version plus ancienne ou une installation personnalisée qui exclut Matrix, installez-le
manuellement :

Installer depuis npm :

```bash
openclaw plugins install @openclaw/matrix
```

Installer depuis un checkout local :

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Voir [Plugins](/fr/tools/plugin) pour le comportement des plugins et les règles d’installation.

## Configuration

1. Assurez-vous que le Plugin Matrix est disponible.
   - Les versions empaquetées actuelles d’OpenClaw l’intègrent déjà.
   - Les installations anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Créez un compte Matrix sur votre homeserver.
3. Configurez `channels.matrix` avec soit :
   - `homeserver` + `accessToken`, soit
   - `homeserver` + `userId` + `password`.
4. Redémarrez le Gateway.
5. Démarrez un message privé avec le bot ou invitez-le dans un salon.
   - Les nouvelles invitations Matrix ne fonctionnent que lorsque `channels.matrix.autoJoin` les autorise.

Chemins de configuration interactive :

```bash
openclaw channels add
openclaw configure --section channels
```

L’assistant Matrix demande :

- l’URL du homeserver
- la méthode d’authentification : jeton d’accès ou mot de passe
- l’ID utilisateur (authentification par mot de passe uniquement)
- le nom d’appareil facultatif
- s’il faut activer le chiffrement de bout en bout
- s’il faut configurer l’accès au salon et la jonction automatique sur invitation

Comportements clés de l’assistant :

- Si des variables d’environnement d’authentification Matrix existent déjà et que ce compte n’a pas déjà une authentification enregistrée dans la configuration, l’assistant propose un raccourci env pour conserver l’authentification dans les variables d’environnement.
- Les noms de compte sont normalisés en ID de compte. Par exemple, `Ops Bot` devient `ops-bot`.
- Les entrées de liste d’autorisation de messages privés acceptent directement `@user:server` ; les noms d’affichage ne fonctionnent que lorsqu’une recherche en direct dans l’annuaire trouve une seule correspondance exacte.
- Les entrées de liste d’autorisation de salon acceptent directement les ID et alias de salon. Préférez `!room:server` ou `#alias:server` ; les noms non résolus sont ignorés à l’exécution lors de la résolution de la liste d’autorisation.
- En mode liste d’autorisation pour la jonction automatique sur invitation, n’utilisez que des cibles d’invitation stables : `!roomId:server`, `#alias:server` ou `*`. Les noms de salon simples sont refusés.
- Pour résoudre les noms de salon avant l’enregistrement, utilisez `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` est désactivé par défaut (`off`).

Si vous ne le définissez pas, le bot ne rejoindra pas les salons invités ni les nouvelles invitations de type message privé, il n’apparaîtra donc pas dans les nouveaux groupes ou messages privés sur invitation à moins que vous ne le rejoigniez manuellement d’abord.

Définissez `autoJoin: "allowlist"` avec `autoJoinAllowlist` pour restreindre les invitations qu’il accepte, ou définissez `autoJoin: "always"` si vous voulez qu’il rejoigne chaque invitation.

En mode `allowlist`, `autoJoinAllowlist` n’accepte que `!roomId:server`, `#alias:server` ou `*`.
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
      password: "replace-me", // pragma: secret sur liste d’autorisation
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix stocke les identifiants mis en cache dans `~/.openclaw/credentials/matrix/`.
Le compte par défaut utilise `credentials.json` ; les comptes nommés utilisent `credentials-<account>.json`.
Lorsque des identifiants mis en cache existent à cet emplacement, OpenClaw considère Matrix comme configuré pour la configuration, le diagnostic et la découverte de l’état du canal, même si l’authentification actuelle n’est pas définie directement dans la configuration.

Équivalents en variables d’environnement (utilisés lorsque la clé de configuration n’est pas définie) :

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Pour les comptes non par défaut, utilisez des variables d’environnement à portée de compte :

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

Matrix échappe la ponctuation dans les ID de compte pour éviter les collisions entre variables d’environnement à portée de compte.
Par exemple, `-` devient `_X2D_`, donc `ops-prod` est mappé vers `MATRIX_OPS_X2D_PROD_*`.

L’assistant interactif ne propose le raccourci par variable d’environnement que lorsque ces variables d’environnement d’authentification sont déjà présentes et que le compte sélectionné n’a pas déjà une authentification Matrix enregistrée dans la configuration.

`MATRIX_HOMESERVER` ne peut pas être défini depuis un `.env` d’espace de travail ; voir [fichiers `.env` d’espace de travail](/fr/gateway/security).

## Exemple de configuration

Voici une configuration de base pratique avec appairage des messages privés, liste d’autorisation de salon et chiffrement de bout en bout activé :

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

`autoJoin` s’applique à toutes les invitations Matrix, y compris les invitations de type message privé. OpenClaw ne peut pas classifier de manière fiable
un salon invité comme message privé ou groupe au moment de l’invitation, donc toutes les invitations passent d’abord par `autoJoin`.
`dm.policy` s’applique après que le bot a rejoint et que le salon est classifié comme message privé.

## Aperçus en streaming

Le streaming des réponses Matrix est optionnel.

Définissez `channels.matrix.streaming` sur `"partial"` si vous voulez qu’OpenClaw envoie une seule réponse
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

- `streaming: "off"` est la valeur par défaut. OpenClaw attend la réponse finale et l’envoie en une seule fois.
- `streaming: "partial"` crée un message d’aperçu modifiable pour le bloc assistant actuel en utilisant des messages texte Matrix normaux. Cela préserve le comportement hérité de notification sur premier aperçu de Matrix, donc les clients standards peuvent notifier sur le premier texte d’aperçu diffusé plutôt que sur le bloc terminé.
- `streaming: "quiet"` crée un aperçu silencieux modifiable pour le bloc assistant actuel. Utilisez-le uniquement si vous configurez également les règles push des destinataires pour les modifications d’aperçus finalisées.
- `blockStreaming: true` active des messages de progression Matrix séparés. Lorsque le streaming d’aperçu est activé, Matrix conserve le brouillon en direct pour le bloc actuel et préserve les blocs terminés comme messages séparés.
- Lorsque le streaming d’aperçu est activé et que `blockStreaming` est désactivé, Matrix modifie le brouillon en direct sur place et finalise ce même événement lorsque le bloc ou le tour se termine.
- Si l’aperçu ne tient plus dans un seul événement Matrix, OpenClaw arrête le streaming d’aperçu et revient à la livraison finale normale.
- Les réponses avec médias envoient toujours les pièces jointes normalement. Si un aperçu obsolète ne peut plus être réutilisé en toute sécurité, OpenClaw le rédige avant d’envoyer la réponse média finale.
- Les modifications d’aperçu coûtent des appels API Matrix supplémentaires. Laissez le streaming désactivé si vous voulez le comportement le plus prudent vis-à-vis des limites de débit.

`blockStreaming` n’active pas à lui seul les aperçus de brouillon.
Utilisez `streaming: "partial"` ou `streaming: "quiet"` pour les modifications d’aperçu ; ajoutez ensuite `blockStreaming: true` uniquement si vous souhaitez aussi que les blocs assistant terminés restent visibles comme messages de progression séparés.

Si vous avez besoin des notifications Matrix standards sans règles push personnalisées, utilisez `streaming: "partial"` pour un comportement basé sur l’aperçu d’abord, ou laissez `streaming` désactivé pour une livraison finale uniquement. Avec `streaming: "off"` :

- `blockStreaming: true` envoie chaque bloc terminé comme un message Matrix normal avec notification.
- `blockStreaming: false` envoie uniquement la réponse finale terminée comme un message Matrix normal avec notification.

### Règles push auto-hébergées pour les aperçus silencieux finalisés

Le streaming silencieux (`streaming: "quiet"`) ne notifie les destinataires qu’une fois qu’un bloc ou un tour est finalisé — une règle push par utilisateur doit correspondre au marqueur d’aperçu finalisé. Voir [Règles push Matrix pour les aperçus silencieux](/fr/channels/matrix-push-rules) pour la configuration complète (jeton du destinataire, vérification du pusher, installation de règle, notes par homeserver).

## Salons bot à bot

Par défaut, les messages Matrix provenant d’autres comptes Matrix OpenClaw configurés sont ignorés.

Utilisez `allowBots` lorsque vous souhaitez intentionnellement du trafic inter-agents Matrix :

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

- `allowBots: true` accepte les messages d’autres comptes bot Matrix configurés dans les salons et messages privés autorisés.
- `allowBots: "mentions"` accepte ces messages uniquement lorsqu’ils mentionnent visiblement ce bot dans les salons. Les messages privés restent autorisés.
- `groups.<room>.allowBots` remplace le paramètre au niveau du compte pour un salon.
- OpenClaw ignore toujours les messages du même ID utilisateur Matrix pour éviter les boucles d’auto-réponse.
- Matrix n’expose pas ici de drapeau bot natif ; OpenClaw considère « rédigé par un bot » comme « envoyé par un autre compte Matrix configuré sur ce Gateway OpenClaw ».

Utilisez des listes d’autorisation de salon strictes et des exigences de mention lorsque vous activez le trafic bot à bot dans des salons partagés.

## Chiffrement et vérification

Dans les salons chiffrés (E2EE), les événements d’image sortants utilisent `thumbnail_file` afin que les aperçus d’image soient chiffrés en même temps que la pièce jointe complète. Les salons non chiffrés utilisent toujours `thumbnail_url` brut. Aucune configuration n’est nécessaire — le plugin détecte automatiquement l’état E2EE.

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

Commandes de vérification (elles acceptent toutes `--verbose` pour le diagnostic et `--json` pour une sortie lisible par machine) :

| Commande                                                       | Objectif                                                                            |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status`                                | Vérifier l’état de la signature croisée et de la vérification de l’appareil         |
| `openclaw matrix verify status --include-recovery-key --json`  | Inclure la clé de récupération stockée                                              |
| `openclaw matrix verify bootstrap`                             | Initialiser la signature croisée et la vérification (voir ci-dessous)               |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | Ignorer l’identité actuelle de signature croisée et en créer une nouvelle           |
| `openclaw matrix verify device "<recovery-key>"`               | Vérifier cet appareil avec une clé de récupération                                  |
| `openclaw matrix verify backup status`                         | Vérifier l’état de santé de la sauvegarde des clés de salon                         |
| `openclaw matrix verify backup restore`                        | Restaurer les clés de salon à partir de la sauvegarde serveur                       |
| `openclaw matrix verify backup reset --yes`                    | Supprimer la sauvegarde actuelle et créer une nouvelle base de référence (peut recréer le stockage des secrets) |

Dans les configurations multi-comptes, les commandes CLI Matrix utilisent le compte Matrix par défaut implicite sauf si vous passez `--account <id>`.
Si vous configurez plusieurs comptes nommés, définissez d’abord `channels.matrix.defaultAccount`, sinon ces opérations CLI implicites s’arrêteront et vous demanderont de choisir explicitement un compte.
Utilisez `--account` chaque fois que vous voulez que les opérations de vérification ou d’appareil ciblent explicitement un compte nommé :

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Lorsque le chiffrement est désactivé ou indisponible pour un compte nommé, les avertissements Matrix et les erreurs de vérification pointent vers la clé de configuration de ce compte, par exemple `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Ce que signifie vérifié">
    OpenClaw considère un appareil comme vérifié uniquement lorsque votre propre identité de signature croisée le signe. `verify status --verbose` expose trois signaux de confiance :

    - `Locally trusted` : approuvé uniquement par ce client
    - `Cross-signing verified` : le SDK signale une vérification via la signature croisée
    - `Signed by owner` : signé par votre propre clé d’auto-signature

    `Verified by owner` devient `yes` uniquement lorsqu’une signature croisée ou une signature du propriétaire est présente. La confiance locale seule ne suffit pas.

  </Accordion>

  <Accordion title="Ce que fait bootstrap">
    `verify bootstrap` est la commande de réparation et de configuration pour les comptes chiffrés. Dans l’ordre, elle :

    - initialise le stockage des secrets, en réutilisant si possible une clé de récupération existante
    - initialise la signature croisée et téléverse les clés publiques de signature croisée manquantes
    - marque et signe de manière croisée l’appareil actuel
    - crée une sauvegarde côté serveur des clés de salon si elle n’existe pas déjà

    Si le homeserver exige une UIA pour téléverser les clés de signature croisée, OpenClaw essaie d’abord sans authentification, puis `m.login.dummy`, puis `m.login.password` (nécessite `channels.matrix.password`). Utilisez `--force-reset-cross-signing` uniquement si vous voulez intentionnellement abandonner l’identité actuelle.

  </Accordion>

  <Accordion title="Nouvelle base de référence de sauvegarde">
    Si vous voulez conserver le fonctionnement des futurs messages chiffrés et acceptez de perdre l’ancien historique irrécupérable :

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Ajoutez `--account <id>` pour cibler un compte nommé. Cela peut aussi recréer le stockage des secrets si le secret de sauvegarde actuel ne peut pas être chargé en toute sécurité.

  </Accordion>

  <Accordion title="Comportement au démarrage">
    Avec `encryption: true`, `startupVerification` est défini par défaut sur `"if-unverified"`. Au démarrage, un appareil non vérifié demande une auto-vérification dans un autre client Matrix, en évitant les doublons et en appliquant un délai de réutilisation. Ajustez avec `startupVerificationCooldownHours` ou désactivez avec `startupVerification: "off"`.

    Le démarrage exécute également un passage conservateur d’initialisation crypto qui réutilise le stockage actuel des secrets et l’identité actuelle de signature croisée. Si l’état d’initialisation est cassé, OpenClaw tente une réparation protégée même sans `channels.matrix.password` ; si le homeserver exige une UIA par mot de passe, le démarrage journalise un avertissement et reste non fatal. Les appareils déjà signés par le propriétaire sont préservés.

    Voir [Migration Matrix](/fr/install/migrating-matrix) pour le flux complet de mise à niveau.

  </Accordion>

  <Accordion title="Avis de vérification">
    Matrix publie des avis de cycle de vie de vérification dans le salon strict de vérification des messages privés sous forme de messages `m.notice` : demande, prêt (avec indication « Vérifier par emoji »), démarrage/fin, et détails SAS (emoji/décimal) lorsqu’ils sont disponibles.

    Les demandes entrantes depuis un autre client Matrix sont suivies et acceptées automatiquement. Pour l’auto-vérification, OpenClaw démarre automatiquement le flux SAS et confirme son propre côté une fois la vérification par emoji disponible — vous devez toujours comparer et confirmer « They match » dans votre client Matrix.

    Les avis système de vérification ne sont pas transférés au pipeline de chat de l’agent.

  </Accordion>

  <Accordion title="Hygiène des appareils">
    Les anciens appareils gérés par OpenClaw peuvent s’accumuler. Lister et nettoyer :

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Stockage crypto">
    Le chiffrement de bout en bout Matrix utilise le chemin crypto Rust officiel de `matrix-js-sdk` avec `fake-indexeddb` comme shim IndexedDB. L’état crypto persiste dans `crypto-idb-snapshot.json` (autorisations de fichier restrictives).

    L’état d’exécution chiffré vit sous `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` et inclut le magasin de synchronisation, le magasin crypto, la clé de récupération, le snapshot IDB, les liaisons de fils et l’état de vérification au démarrage. Lorsque le jeton change mais que l’identité du compte reste la même, OpenClaw réutilise la meilleure racine existante afin que l’état antérieur reste visible.

  </Accordion>
</AccordionGroup>

## Gestion du profil

Mettez à jour le profil Matrix du compte sélectionné avec :

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Ajoutez `--account <id>` lorsque vous voulez cibler explicitement un compte Matrix nommé.

Matrix accepte directement les URL d’avatar `mxc://`. Lorsque vous passez une URL d’avatar `http://` ou `https://`, OpenClaw la téléverse d’abord vers Matrix puis stocke l’URL `mxc://` résolue dans `channels.matrix.avatarUrl` (ou dans le remplacement du compte sélectionné).

## Fils

Matrix prend en charge les fils Matrix natifs à la fois pour les réponses automatiques et pour les envois par outil de message.

- `dm.sessionScope: "per-user"` (par défaut) conserve le routage des messages privés Matrix à portée de l’expéditeur, ce qui permet à plusieurs salons de messages privés de partager une session lorsqu’ils se résolvent vers le même pair.
- `dm.sessionScope: "per-room"` isole chaque salon de message privé Matrix dans sa propre clé de session tout en utilisant les contrôles normaux d’authentification des messages privés et de liste d’autorisation.
- Les liaisons explicites de conversation Matrix restent prioritaires sur `dm.sessionScope`, de sorte que les salons et fils liés conservent leur session cible choisie.
- `threadReplies: "off"` conserve les réponses au niveau supérieur et garde les messages entrants filés sur la session parente.
- `threadReplies: "inbound"` répond dans un fil uniquement lorsque le message entrant était déjà dans ce fil.
- `threadReplies: "always"` conserve les réponses de salon dans un fil enraciné au message déclencheur et achemine cette conversation via la session à portée de fil correspondante dès le premier message déclencheur.
- `dm.threadReplies` remplace le paramètre de niveau supérieur pour les messages privés uniquement. Par exemple, vous pouvez garder les fils de salon isolés tout en conservant des messages privés plats.
- Les messages entrants filés incluent le message racine du fil comme contexte supplémentaire pour l’agent.
- Les envois par outil de message héritent automatiquement du fil Matrix actuel lorsque la cible est le même salon, ou la même cible utilisateur de message privé, sauf si un `threadId` explicite est fourni.
- La réutilisation de cible utilisateur de message privé sur la même session ne s’active que lorsque les métadonnées de la session actuelle prouvent le même pair de message privé sur le même compte Matrix ; sinon OpenClaw revient au routage normal à portée utilisateur.
- Lorsqu’OpenClaw constate qu’un salon de message privé Matrix entre en collision avec un autre salon de message privé sur la même session partagée de message privé Matrix, il publie un `m.notice` unique dans ce salon avec l’échappatoire `/focus` lorsque les liaisons de fils sont activées et l’indication `dm.sessionScope`.
- Les liaisons de fils à l’exécution sont prises en charge pour Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` et `/acp spawn` lié à un fil fonctionnent dans les salons et messages privés Matrix.
- Le `/focus` de niveau supérieur dans un salon/message privé Matrix crée un nouveau fil Matrix et le lie à la session cible lorsque `threadBindings.spawnSubagentSessions=true`.
- L’exécution de `/focus` ou `/acp spawn --thread here` à l’intérieur d’un fil Matrix existant lie ce fil actuel à la place.

## Liaisons de conversation ACP

Les salons, messages privés et fils Matrix existants peuvent être transformés en espaces de travail ACP durables sans changer la surface de chat.

Flux opérateur rapide :

- Exécutez `/acp spawn codex --bind here` dans le message privé, le salon ou le fil existant Matrix que vous souhaitez continuer à utiliser.
- Dans un message privé ou un salon Matrix de niveau supérieur, le message privé/salon actuel reste la surface de chat et les futurs messages sont acheminés vers la session ACP lancée.
- À l’intérieur d’un fil Matrix existant, `--bind here` lie ce fil actuel sur place.
- `/new` et `/reset` réinitialisent sur place la même session ACP liée.
- `/acp close` ferme la session ACP et supprime la liaison.

Remarques :

- `--bind here` ne crée pas de fil Matrix enfant.
- `threadBindings.spawnAcpSessions` n’est requis que pour `/acp spawn --thread auto|here`, lorsque OpenClaw doit créer ou lier un fil Matrix enfant.

### Configuration des liaisons de fils

Matrix hérite des valeurs par défaut globales depuis `session.threadBindings`, et prend aussi en charge des remplacements par canal :

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Les drapeaux de lancement lié à un fil Matrix sont optionnels :

- Définissez `threadBindings.spawnSubagentSessions: true` pour permettre à `/focus` de niveau supérieur de créer et lier de nouveaux fils Matrix.
- Définissez `threadBindings.spawnAcpSessions: true` pour permettre à `/acp spawn --thread auto|here` de lier des sessions ACP à des fils Matrix.

## Réactions

Matrix prend en charge les actions de réaction sortantes, les notifications de réaction entrantes et les réactions d’accusé de réception entrantes.

- L’outillage de réaction sortante est contrôlé par `channels["matrix"].actions.reactions`.
- `react` ajoute une réaction à un événement Matrix spécifique.
- `reactions` liste le résumé actuel des réactions pour un événement Matrix spécifique.
- `emoji=""` supprime les réactions du propre compte bot sur cet événement.
- `remove: true` supprime uniquement la réaction emoji spécifiée du compte bot.

Le périmètre des réactions d’accusé de réception est résolu dans cet ordre :

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- secours vers l’emoji d’identité de l’agent

Le périmètre des réactions d’accusé de réception est résolu dans cet ordre :

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Le mode de notification des réactions est résolu dans cet ordre :

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- par défaut : `own`

Comportement :

- `reactionNotifications: "own"` transfère les événements `m.reaction` ajoutés lorsqu’ils ciblent des messages Matrix rédigés par le bot.
- `reactionNotifications: "off"` désactive les événements système de réaction.
- Les suppressions de réaction ne sont pas synthétisées en événements système, car Matrix les expose comme des rédactions et non comme des suppressions autonomes de `m.reaction`.

## Contexte d’historique

- `channels.matrix.historyLimit` contrôle combien de messages récents du salon sont inclus comme `InboundHistory` lorsqu’un message de salon Matrix déclenche l’agent. Repli vers `messages.groupChat.historyLimit` ; si les deux ne sont pas définis, la valeur par défaut effective est `0`. Définissez `0` pour désactiver.
- L’historique des salons Matrix est limité au salon. Les messages privés continuent d’utiliser l’historique normal de session.
- L’historique des salons Matrix est uniquement en attente : OpenClaw met en mémoire tampon les messages de salon qui n’ont pas encore déclenché de réponse, puis capture cet intervalle lorsqu’une mention ou un autre déclencheur arrive.
- Le message déclencheur actuel n’est pas inclus dans `InboundHistory` ; il reste dans le corps entrant principal pour ce tour.
- Les nouvelles tentatives du même événement Matrix réutilisent le snapshot d’historique d’origine au lieu de dériver vers des messages de salon plus récents.

## Visibilité du contexte

Matrix prend en charge le contrôle partagé `contextVisibility` pour le contexte supplémentaire du salon, comme le texte de réponse récupéré, les racines de fils et l’historique en attente.

- `contextVisibility: "all"` est la valeur par défaut. Le contexte supplémentaire est conservé tel que reçu.
- `contextVisibility: "allowlist"` filtre le contexte supplémentaire pour n’envoyer que les expéditeurs autorisés par les vérifications actives de liste d’autorisation de salon/utilisateur.
- `contextVisibility: "allowlist_quote"` se comporte comme `allowlist`, mais conserve tout de même une réponse citée explicite.

Ce paramètre affecte la visibilité du contexte supplémentaire, pas le fait que le message entrant lui-même puisse déclencher une réponse.
L’autorisation de déclenchement continue de dépendre de `groupPolicy`, `groups`, `groupAllowFrom` et des paramètres de politique des messages privés.

## Politique des messages privés et des salons

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

Voir [Groupes](/fr/channels/groups) pour le comportement de contrôle par mention et de liste d’autorisation.

Exemple d’appairage pour les messages privés Matrix :

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un utilisateur Matrix non approuvé continue à vous envoyer des messages avant approbation, OpenClaw réutilise le même code d’appairage en attente et peut renvoyer une réponse de rappel après un court délai au lieu de générer un nouveau code.

Voir [Appairage](/fr/channels/pairing) pour le flux partagé d’appairage des messages privés et la disposition de stockage.

## Réparation directe de salon

Si l’état des messages directs se désynchronise, OpenClaw peut se retrouver avec des mappages `m.direct` obsolètes qui pointent vers d’anciens salons solo au lieu du message privé actif. Inspectez le mappage actuel pour un pair avec :

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Réparez-le avec :

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Le flux de réparation :

- préfère un message privé strict 1:1 déjà mappé dans `m.direct`
- revient à n’importe quel message privé strict 1:1 actuellement rejoint avec cet utilisateur
- crée un nouveau salon direct et réécrit `m.direct` si aucun message privé sain n’existe

Le flux de réparation ne supprime pas automatiquement les anciens salons. Il choisit uniquement le message privé sain et met à jour le mappage afin que les nouveaux envois Matrix, les avis de vérification et les autres flux de messages directs ciblent à nouveau le bon salon.

## Approbations exec

Matrix peut agir comme un client d’approbation natif pour un compte Matrix. Les réglages natifs
de routage des messages privés/canaux restent sous la configuration d’approbation exec :

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (facultatif ; repli vers `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Les approbateurs doivent être des ID utilisateur Matrix tels que `@owner:example.org`. Matrix active automatiquement les approbations natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur peut être résolu. Les approbations exec utilisent d’abord `execApprovals.approvers` et peuvent revenir à `channels.matrix.dm.allowFrom`. Les approbations Plugin autorisent via `channels.matrix.dm.allowFrom`. Définissez `enabled: false` pour désactiver explicitement Matrix comme client d’approbation natif. Sinon, les demandes d’approbation reviennent à d’autres routes d’approbation configurées ou à la politique de secours d’approbation.

Le routage natif Matrix prend en charge les deux types d’approbation :

- `channels.matrix.execApprovals.*` contrôle le mode natif de diffusion vers message privé/canal pour les invites d’approbation Matrix.
- Les approbations exec utilisent l’ensemble d’approbateurs exec depuis `execApprovals.approvers` ou `channels.matrix.dm.allowFrom`.
- Les approbations Plugin utilisent la liste d’autorisation des messages privés Matrix depuis `channels.matrix.dm.allowFrom`.
- Les raccourcis de réaction Matrix et les mises à jour de message s’appliquent à la fois aux approbations exec et Plugin.

Règles de remise :

- `target: "dm"` envoie les invites d’approbation aux messages privés des approbateurs
- `target: "channel"` renvoie l’invite vers le salon ou message privé Matrix d’origine
- `target: "both"` envoie aux messages privés des approbateurs et au salon ou message privé Matrix d’origine

Les invites d’approbation Matrix initialisent des raccourcis de réaction sur le message d’approbation principal :

- `✅` = autoriser une fois
- `❌` = refuser
- `♾️` = toujours autoriser lorsque cette décision est permise par la politique exec effective

Les approbateurs peuvent réagir à ce message ou utiliser les commandes slash de secours : `/approve <id> allow-once`, `/approve <id> allow-always` ou `/approve <id> deny`.

Seuls les approbateurs résolus peuvent autoriser ou refuser. Pour les approbations exec, la remise par canal inclut le texte de la commande, donc n’activez `channel` ou `both` que dans des salons de confiance.

Remplacement par compte :

- `channels.matrix.accounts.<account>.execApprovals`

Documentation associée : [Approbations exec](/fr/tools/exec-approvals)

## Commandes slash

Les commandes slash Matrix (par exemple `/new`, `/reset`, `/model`) fonctionnent directement dans les messages privés. Dans les salons, OpenClaw reconnaît aussi les commandes slash précédées de la propre mention Matrix du bot, donc `@bot:server /new` déclenche le chemin de commande sans nécessiter d’expression régulière personnalisée de mention. Cela permet au bot de rester réactif aux publications de type `@mention /commande` dans les salons qu’Element et des clients similaires émettent lorsqu’un utilisateur complète le bot par tabulation avant de taper la commande.

Les règles d’autorisation s’appliquent toujours : les expéditeurs de commandes doivent satisfaire aux politiques de propriétaire ou de liste d’autorisation des messages privés ou des salons, comme pour les messages ordinaires.

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

Les valeurs de niveau supérieur `channels.matrix` servent de valeurs par défaut pour les comptes nommés, sauf si un compte les remplace.
Vous pouvez limiter des entrées de salon héritées à un compte Matrix avec `groups.<room>.account`.
Les entrées sans `account` restent partagées entre tous les comptes Matrix, et les entrées avec `account: "default"` continuent de fonctionner lorsque le compte par défaut est configuré directement sur `channels.matrix.*` au niveau supérieur.
Les valeurs par défaut d’authentification partagée partielles ne créent pas à elles seules un compte implicite par défaut distinct. OpenClaw ne synthétise le compte `default` de niveau supérieur que lorsque ce compte par défaut a une authentification récente (`homeserver` plus `accessToken`, ou `homeserver` plus `userId` et `password`) ; les comptes nommés peuvent tout de même rester détectables à partir de `homeserver` plus `userId` lorsque des identifiants mis en cache satisfont l’authentification plus tard.
Si Matrix possède déjà exactement un compte nommé, ou si `defaultAccount` pointe vers une clé de compte nommé existante, la promotion de réparation/configuration d’un compte unique vers plusieurs comptes préserve ce compte au lieu de créer une nouvelle entrée `accounts.default`. Seules les clés d’authentification/d’initialisation Matrix sont déplacées vers ce compte promu ; les clés partagées de politique de remise restent au niveau supérieur.
Définissez `defaultAccount` lorsque vous voulez qu’OpenClaw préfère un compte Matrix nommé pour le routage implicite, le sondage et les opérations CLI.
Si plusieurs comptes Matrix sont configurés et qu’un ID de compte est `default`, OpenClaw utilise ce compte implicitement même lorsque `defaultAccount` n’est pas défini.
Si vous configurez plusieurs comptes nommés, définissez `defaultAccount` ou passez `--account <id>` pour les commandes CLI qui dépendent d’une sélection implicite du compte.
Passez `--account <id>` à `openclaw matrix verify ...` et `openclaw matrix devices ...` lorsque vous voulez remplacer cette sélection implicite pour une commande.

Voir [Référence de configuration](/fr/gateway/config-channels#multi-account-all-channels) pour le modèle multi-comptes partagé.

## Homeservers privés/LAN

Par défaut, OpenClaw bloque les homeservers Matrix privés/internes pour la protection SSRF sauf si vous
l’autorisez explicitement compte par compte.

Si votre homeserver s’exécute sur localhost, une IP LAN/Tailscale ou un nom d’hôte interne, activez
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

Cette activation ne permet que les cibles privées/internes de confiance. Les homeservers publics en texte clair tels que
`http://matrix.example.org:8008` restent bloqués. Préférez `https://` chaque fois que possible.

## Utiliser un proxy pour le trafic Matrix

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
OpenClaw utilise le même paramètre de proxy pour le trafic Matrix à l’exécution et pour les sondes d’état de compte.

## Résolution de cible

Matrix accepte ces formats de cible partout où OpenClaw vous demande une cible de salon ou d’utilisateur :

- Utilisateurs : `@user:server`, `user:@user:server` ou `matrix:user:@user:server`
- Salons : `!room:server`, `room:!room:server` ou `matrix:room:!room:server`
- Alias : `#alias:server`, `channel:#alias:server` ou `matrix:channel:#alias:server`

La recherche en direct dans l’annuaire utilise le compte Matrix connecté :

- Les recherches d’utilisateur interrogent l’annuaire des utilisateurs Matrix sur ce homeserver.
- Les recherches de salon acceptent directement les ID et alias de salon explicites, puis reviennent à la recherche dans les noms de salons rejoints pour ce compte.
- La recherche par nom de salon rejoint est au mieux. Si un nom de salon ne peut pas être résolu en ID ou alias, il est ignoré par la résolution de la liste d’autorisation à l’exécution.

## Référence de configuration

- `enabled` : activer ou désactiver le canal.
- `name` : libellé facultatif pour le compte.
- `defaultAccount` : ID de compte préféré lorsque plusieurs comptes Matrix sont configurés.
- `homeserver` : URL du homeserver, par exemple `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork` : autorise ce compte Matrix à se connecter à des homeservers privés/internes. Activez ce paramètre lorsque le homeserver se résout vers `localhost`, une IP LAN/Tailscale ou un hôte interne tel que `matrix-synapse`.
- `proxy` : URL facultative de proxy HTTP(S) pour le trafic Matrix. Les comptes nommés peuvent remplacer la valeur par défaut de niveau supérieur avec leur propre `proxy`.
- `userId` : ID utilisateur Matrix complet, par exemple `@bot:example.org`.
- `accessToken` : jeton d’accès pour l’authentification basée sur jeton. Les valeurs en texte brut et les valeurs SecretRef sont prises en charge pour `channels.matrix.accessToken` et `channels.matrix.accounts.<id>.accessToken` via les fournisseurs env/file/exec. Voir [Gestion des secrets](/fr/gateway/secrets).
- `password` : mot de passe pour la connexion basée sur mot de passe. Les valeurs en texte brut et les valeurs SecretRef sont prises en charge.
- `deviceId` : ID d’appareil Matrix explicite.
- `deviceName` : nom d’affichage de l’appareil pour la connexion par mot de passe.
- `avatarUrl` : URL d’avatar propre stockée pour la synchronisation du profil et les mises à jour `profile set`.
- `initialSyncLimit` : nombre maximal d’événements récupérés pendant la synchronisation au démarrage.
- `encryption` : activer le chiffrement de bout en bout.
- `allowlistOnly` : lorsque défini sur `true`, fait passer la politique de salon `open` à `allowlist`, et force toutes les politiques actives de messages privés sauf `disabled` (y compris `pairing` et `open`) vers `allowlist`. N’affecte pas les politiques `disabled`.
- `allowBots` : autoriser les messages provenant d’autres comptes Matrix OpenClaw configurés (`true` ou `"mentions"`).
- `groupPolicy` : `open`, `allowlist` ou `disabled`.
- `contextVisibility` : mode de visibilité du contexte supplémentaire de salon (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom` : liste d’autorisation des ID utilisateur pour le trafic de salon. Les ID utilisateur Matrix complets sont les plus sûrs ; les correspondances exactes dans l’annuaire sont résolues au démarrage et lorsque la liste d’autorisation change pendant l’exécution du moniteur. Les noms non résolus sont ignorés.
- `historyLimit` : nombre maximal de messages de salon à inclure comme contexte d’historique de groupe. Repli vers `messages.groupChat.historyLimit` ; si les deux ne sont pas définis, la valeur par défaut effective est `0`. Définissez `0` pour désactiver.
- `replyToMode` : `off`, `first`, `all` ou `batched`.
- `markdown` : configuration facultative du rendu Markdown pour le texte Matrix sortant.
- `streaming` : `off` (par défaut), `"partial"`, `"quiet"`, `true` ou `false`. `"partial"` et `true` activent les mises à jour de brouillon en aperçu d’abord avec des messages texte Matrix normaux. `"quiet"` utilise des avis d’aperçu sans notification pour les configurations auto-hébergées avec règles push. `false` équivaut à `"off"`.
- `blockStreaming` : `true` active des messages de progression séparés pour les blocs assistant terminés lorsque le streaming d’aperçu de brouillon est actif.
- `threadReplies` : `off`, `inbound` ou `always`.
- `threadBindings` : remplacements par canal pour le routage et le cycle de vie des sessions liées à un fil.
- `startupVerification` : mode automatique de demande d’auto-vérification au démarrage (`if-unverified`, `off`).
- `startupVerificationCooldownHours` : délai de réutilisation avant une nouvelle tentative de demandes automatiques de vérification au démarrage.
- `textChunkLimit` : taille des segments de message sortant en caractères (s’applique lorsque `chunkMode` vaut `length`).
- `chunkMode` : `length` découpe les messages selon le nombre de caractères ; `newline` les découpe aux limites de ligne.
- `responsePrefix` : chaîne facultative ajoutée au début de toutes les réponses sortantes pour ce canal.
- `ackReaction` : remplacement facultatif de la réaction d’accusé de réception pour ce canal/compte.
- `ackReactionScope` : remplacement facultatif du périmètre de la réaction d’accusé de réception (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications` : mode de notification des réactions entrantes (`own`, `off`).
- `mediaMaxMb` : limite de taille des médias en MB pour les envois sortants et le traitement des médias entrants.
- `autoJoin` : politique de jonction automatique sur invitation (`always`, `allowlist`, `off`). Par défaut : `off`. S’applique à toutes les invitations Matrix, y compris les invitations de type message privé.
- `autoJoinAllowlist` : salons/alias autorisés lorsque `autoJoin` vaut `allowlist`. Les entrées d’alias sont résolues en ID de salon pendant le traitement de l’invitation ; OpenClaw ne fait pas confiance à l’état d’alias revendiqué par le salon invité.
- `dm` : bloc de politique des messages privés (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy` : contrôle l’accès aux messages privés après qu’OpenClaw a rejoint le salon et l’a classifié comme message privé. Cela ne modifie pas le fait qu’une invitation soit rejointe automatiquement ou non.
- `dm.allowFrom` : liste d’autorisation des ID utilisateur pour le trafic de messages privés. Les ID utilisateur Matrix complets sont les plus sûrs ; les correspondances exactes dans l’annuaire sont résolues au démarrage et lorsque la liste d’autorisation change pendant l’exécution du moniteur. Les noms non résolus sont ignorés.
- `dm.sessionScope` : `per-user` (par défaut) ou `per-room`. Utilisez `per-room` lorsque vous voulez que chaque salon de message privé Matrix conserve un contexte distinct même si le pair est le même.
- `dm.threadReplies` : remplacement de politique de fil réservé aux messages privés (`off`, `inbound`, `always`). Il remplace le paramètre `threadReplies` de niveau supérieur à la fois pour l’emplacement des réponses et pour l’isolation de session dans les messages privés.
- `execApprovals` : remise native Matrix des approbations exec (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers` : ID utilisateur Matrix autorisés à approuver les demandes exec. Facultatif lorsque `dm.allowFrom` identifie déjà les approbateurs.
- `execApprovals.target` : `dm | channel | both` (par défaut : `dm`).
- `accounts` : remplacements nommés par compte. Les valeurs de niveau supérieur `channels.matrix` servent de valeurs par défaut pour ces entrées.
- `groups` : mappage de politique par salon. Préférez les ID ou alias de salon ; les noms de salon non résolus sont ignorés à l’exécution. L’identité de session/groupe utilise l’ID de salon stable après résolution.
- `groups.<room>.account` : restreint une entrée de salon héritée à un compte Matrix spécifique dans les configurations multi-comptes.
- `groups.<room>.allowBots` : remplacement au niveau du salon pour les expéditeurs bot configurés (`true` ou `"mentions"`).
- `groups.<room>.users` : liste d’autorisation des expéditeurs par salon.
- `groups.<room>.tools` : remplacements d’autorisation/interdiction d’outils par salon.
- `groups.<room>.autoReply` : remplacement au niveau du salon du contrôle par mention. `true` désactive l’obligation de mention pour ce salon ; `false` la réactive de force.
- `groups.<room>.skills` : filtre facultatif de Skills au niveau du salon.
- `groups.<room>.systemPrompt` : extrait facultatif d’invite système au niveau du salon.
- `rooms` : alias hérité de `groups`.
- `actions` : contrôle par action des outils (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Associé

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification des messages privés et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et contrôle par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement
