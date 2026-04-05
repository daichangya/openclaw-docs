---
read_when:
    - Configurer Matrix dans OpenClaw
    - Configurer E2EE et la vérification Matrix
summary: Statut de prise en charge, configuration et exemples de configuration de Matrix
title: Matrix
x-i18n:
    generated_at: "2026-04-05T12:37:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba5c49ad2125d97adf66b5517f8409567eff8b86e20224a32fcb940a02cb0659
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix est le plugin de canal intégré Matrix pour OpenClaw.
Il utilise le `matrix-js-sdk` officiel et prend en charge les messages privés, les salons, les fils, les médias, les réactions, les sondages, la localisation et E2EE.

## Plugin intégré

Matrix est livré comme plugin intégré dans les versions actuelles d’OpenClaw, donc les
builds packagés normaux ne nécessitent pas d’installation séparée.

Si vous utilisez une build plus ancienne ou une installation personnalisée qui exclut Matrix, installez-le
manuellement :

Installer depuis npm :

```bash
openclaw plugins install @openclaw/matrix
```

Installer depuis un checkout local :

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Voir [Plugins](/tools/plugin) pour le comportement des plugins et les règles d’installation.

## Configuration

1. Assurez-vous que le plugin Matrix est disponible.
   - Les versions packagées actuelles d’OpenClaw l’intègrent déjà.
   - Les installations anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Créez un compte Matrix sur votre homeserver.
3. Configurez `channels.matrix` avec soit :
   - `homeserver` + `accessToken`, soit
   - `homeserver` + `userId` + `password`.
4. Redémarrez la passerelle.
5. Démarrez un message privé avec le bot ou invitez-le dans un salon.

Chemins de configuration interactifs :

```bash
openclaw channels add
openclaw configure --section channels
```

Ce que l’assistant Matrix demande réellement :

- URL du homeserver
- méthode d’authentification : jeton d’accès ou mot de passe
- identifiant utilisateur uniquement si vous choisissez l’authentification par mot de passe
- nom de l’appareil facultatif
- si vous voulez activer E2EE
- si vous voulez configurer maintenant l’accès aux salons Matrix

Comportement de l’assistant à connaître :

- Si des variables d’environnement d’authentification Matrix existent déjà pour le compte sélectionné, et que ce compte n’a pas déjà d’authentification enregistrée dans la configuration, l’assistant propose un raccourci via variables d’environnement et écrit uniquement `enabled: true` pour ce compte.
- Lorsque vous ajoutez un autre compte Matrix de manière interactive, le nom de compte saisi est normalisé en identifiant de compte utilisé dans la configuration et les variables d’environnement. Par exemple, `Ops Bot` devient `ops-bot`.
- Les invites de liste d’autorisation des messages privés acceptent immédiatement les valeurs complètes `@user:server`. Les noms d’affichage ne fonctionnent que si la recherche en direct dans l’annuaire trouve une seule correspondance exacte ; sinon, l’assistant vous demande de réessayer avec un identifiant Matrix complet.
- Les invites de liste d’autorisation des salons acceptent directement les identifiants et alias de salon. Elles peuvent aussi résoudre en direct les noms de salons rejoints, mais les noms non résolus ne sont conservés tels quels que pendant la configuration et sont ignorés plus tard par la résolution de liste d’autorisation à l’exécution. Préférez `!room:server` ou `#alias:server`.
- L’identité du salon/de la session à l’exécution utilise l’identifiant stable du salon Matrix. Les alias déclarés pour le salon ne sont utilisés qu’en entrée de recherche, pas comme clé de session à long terme ni comme identité stable du groupe.
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

Pour l’identifiant de compte normalisé `ops-bot`, utilisez :

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix échappe la ponctuation dans les identifiants de compte pour éviter les collisions dans les variables d’environnement à portée de compte.
Par exemple, `-` devient `_X2D_`, donc `ops-prod` devient `MATRIX_OPS_X2D_PROD_*`.

L’assistant interactif ne propose le raccourci via variables d’environnement que si ces variables d’authentification sont déjà présentes et que le compte sélectionné n’a pas déjà d’authentification Matrix enregistrée dans la configuration.

## Exemple de configuration

Voici une configuration de base pratique avec appairage des messages privés, liste d’autorisation des salons et E2EE activé :

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

Le streaming des réponses Matrix est optionnel.

Définissez `channels.matrix.streaming` sur `"partial"` lorsque vous voulez qu’OpenClaw envoie une seule réponse brouillon,
modifie ce brouillon sur place pendant que le modèle génère du texte, puis le finalise lorsque la réponse est
terminée :

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
- `streaming: "partial"` crée un message d’aperçu modifiable pour le bloc assistant en cours au lieu d’envoyer plusieurs messages partiels.
- `blockStreaming: true` active des messages de progression Matrix séparés. Avec `streaming: "partial"`, Matrix conserve le brouillon en direct pour le bloc en cours et préserve les blocs terminés comme messages séparés.
- Lorsque `streaming: "partial"` est activé et que `blockStreaming` est désactivé, Matrix modifie uniquement le brouillon en direct et envoie la réponse terminée une fois que ce bloc ou ce tour est fini.
- Si l’aperçu ne tient plus dans un seul événement Matrix, OpenClaw arrête le streaming de l’aperçu et revient à l’envoi final normal.
- Les réponses avec médias envoient toujours les pièces jointes normalement. Si un aperçu obsolète ne peut plus être réutilisé en toute sécurité, OpenClaw le redacte avant d’envoyer la réponse finale avec média.
- Les modifications d’aperçu coûtent des appels supplémentaires à l’API Matrix. Laissez le streaming désactivé si vous voulez le comportement le plus conservateur vis-à-vis des limites de débit.

`blockStreaming` n’active pas à lui seul les aperçus brouillon.
Utilisez `streaming: "partial"` pour les modifications d’aperçu ; ajoutez ensuite `blockStreaming: true` uniquement si vous voulez aussi que les blocs assistant terminés restent visibles comme messages de progression séparés.

## Chiffrement et vérification

Dans les salons chiffrés (E2EE), les événements d’image sortants utilisent `thumbnail_file`, de sorte que les aperçus d’image sont chiffrés avec la pièce jointe complète. Les salons non chiffrés utilisent toujours `thumbnail_url` en clair. Aucune configuration n’est nécessaire — le plugin détecte automatiquement l’état E2EE.

### Salons bot à bot

Par défaut, les messages Matrix provenant d’autres comptes Matrix OpenClaw configurés sont ignorés.

Utilisez `allowBots` lorsque vous voulez intentionnellement autoriser le trafic Matrix inter-agents :

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

- `allowBots: true` accepte les messages d’autres comptes bot Matrix configurés dans les salons autorisés et les messages privés.
- `allowBots: "mentions"` accepte ces messages uniquement lorsqu’ils mentionnent visiblement ce bot dans les salons. Les messages privés restent autorisés.
- `groups.<room>.allowBots` remplace le paramètre au niveau du compte pour un salon.
- OpenClaw ignore toujours les messages provenant du même identifiant utilisateur Matrix afin d’éviter les boucles d’auto-réponse.
- Matrix n’expose pas ici d’indicateur natif de bot ; OpenClaw considère « rédigé par un bot » comme « envoyé par un autre compte Matrix configuré sur cette passerelle OpenClaw ».

Utilisez des listes d’autorisation strictes pour les salons et des exigences de mention lorsque vous activez le trafic bot à bot dans des salons partagés.

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

Inclure la clé de récupération enregistrée dans une sortie lisible par machine :

```bash
openclaw matrix verify status --include-recovery-key --json
```

Initialiser l’état de cross-signing et de vérification :

```bash
openclaw matrix verify bootstrap
```

Prise en charge multi-comptes : utilisez `channels.matrix.accounts` avec des identifiants par compte et un `name` facultatif. Voir [Référence de configuration](/gateway/configuration-reference#multi-account-all-channels) pour le modèle partagé.

Diagnostics détaillés d’initialisation :

```bash
openclaw matrix verify bootstrap --verbose
```

Forcer une réinitialisation fraîche de l’identité de cross-signing avant l’initialisation :

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

Restaurer les clés de salon depuis la sauvegarde serveur :

```bash
openclaw matrix verify backup restore
```

Diagnostics détaillés de la restauration :

```bash
openclaw matrix verify backup restore --verbose
```

Supprimer la sauvegarde serveur actuelle et créer une nouvelle base de sauvegarde. Si la
clé de sauvegarde enregistrée ne peut pas être chargée proprement, cette réinitialisation peut aussi recréer le stockage de secrets afin que
les futurs démarrages à froid puissent charger la nouvelle clé de sauvegarde :

```bash
openclaw matrix verify backup reset --yes
```

Toutes les commandes `verify` sont concises par défaut (y compris la journalisation interne silencieuse du SDK) et n’affichent des diagnostics détaillés qu’avec `--verbose`.
Utilisez `--json` pour une sortie entièrement lisible par machine lors des scripts.

Dans les configurations multi-comptes, les commandes CLI Matrix utilisent le compte Matrix par défaut implicite sauf si vous passez `--account <id>`.
Si vous configurez plusieurs comptes nommés, définissez d’abord `channels.matrix.defaultAccount` sinon ces opérations CLI implicites s’arrêteront et vous demanderont de choisir explicitement un compte.
Utilisez `--account` dès que vous voulez que les opérations de vérification ou sur les appareils ciblent explicitement un compte nommé :

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Lorsque le chiffrement est désactivé ou indisponible pour un compte nommé, les avertissements Matrix et les erreurs de vérification pointent vers la clé de configuration de ce compte, par exemple `channels.matrix.accounts.assistant.encryption`.

### Ce que signifie « vérifié »

OpenClaw considère cet appareil Matrix comme vérifié uniquement lorsqu’il est vérifié par votre propre identité de cross-signing.
En pratique, `openclaw matrix verify status --verbose` expose trois signaux de confiance :

- `Locally trusted` : cet appareil n’est approuvé que par le client actuel
- `Cross-signing verified` : le SDK signale que l’appareil est vérifié via le cross-signing
- `Signed by owner` : l’appareil est signé par votre propre clé de self-signing

`Verified by owner` devient `yes` uniquement lorsque la vérification par cross-signing ou la signature par le propriétaire est présente.
La confiance locale à elle seule ne suffit pas pour qu’OpenClaw considère l’appareil comme entièrement vérifié.

### Ce que fait l’initialisation

`openclaw matrix verify bootstrap` est la commande de réparation et de configuration des comptes Matrix chiffrés.
Elle effectue toutes les actions suivantes dans l’ordre :

- initialise le stockage de secrets, en réutilisant une clé de récupération existante lorsque c’est possible
- initialise le cross-signing et téléverse les clés publiques de cross-signing manquantes
- tente de marquer et de signer en cross-signing l’appareil actuel
- crée une nouvelle sauvegarde côté serveur des clés de salon si elle n’existe pas déjà

Si le homeserver exige une authentification interactive pour téléverser les clés de cross-signing, OpenClaw tente d’abord le téléversement sans authentification, puis avec `m.login.dummy`, puis avec `m.login.password` lorsque `channels.matrix.password` est configuré.

Utilisez `--force-reset-cross-signing` uniquement si vous voulez volontairement abandonner l’identité actuelle de cross-signing et en créer une nouvelle.

Si vous voulez volontairement abandonner la sauvegarde actuelle des clés de salon et démarrer une nouvelle
base de sauvegarde pour les futurs messages, utilisez `openclaw matrix verify backup reset --yes`.
Ne faites cela que si vous acceptez que l’ancien historique chiffré irrécupérable reste
indisponible et qu’OpenClaw puisse recréer le stockage de secrets si le secret de sauvegarde actuel
ne peut pas être chargé en toute sécurité.

### Nouvelle base de sauvegarde

Si vous voulez préserver le fonctionnement des futurs messages chiffrés et acceptez de perdre l’ancien historique irrécupérable, exécutez ces commandes dans l’ordre :

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Ajoutez `--account <id>` à chaque commande lorsque vous voulez cibler explicitement un compte Matrix nommé.

### Comportement au démarrage

Lorsque `encryption: true`, Matrix définit par défaut `startupVerification` sur `"if-unverified"`.
Au démarrage, si cet appareil n’est toujours pas vérifié, Matrix demandera l’auto-vérification dans un autre client Matrix,
évitera les demandes en double lorsqu’une demande est déjà en attente, et appliquera un délai local avant de réessayer après les redémarrages.
Les tentatives de demande échouées sont réessayées plus tôt que la création réussie de demandes par défaut.
Définissez `startupVerification: "off"` pour désactiver les demandes automatiques au démarrage, ou ajustez `startupVerificationCooldownHours`
si vous voulez une fenêtre de réessai plus courte ou plus longue.

Le démarrage effectue aussi automatiquement une passe prudente d’initialisation crypto.
Cette passe tente d’abord de réutiliser le stockage de secrets actuel et l’identité actuelle de cross-signing, et évite de réinitialiser le cross-signing sauf si vous exécutez un flux explicite de réparation d’initialisation.

Si le démarrage détecte un état d’initialisation défectueux et que `channels.matrix.password` est configuré, OpenClaw peut tenter un chemin de réparation plus strict.
Si l’appareil actuel est déjà signé par le propriétaire, OpenClaw préserve cette identité au lieu de la réinitialiser automatiquement.

Mise à niveau depuis l’ancien plugin public Matrix :

- OpenClaw réutilise automatiquement le même compte Matrix, jeton d’accès et identité d’appareil lorsque c’est possible.
- Avant toute modification de migration Matrix exploitable, OpenClaw crée ou réutilise un instantané de récupération sous `~/Backups/openclaw-migrations/`.
- Si vous utilisez plusieurs comptes Matrix, définissez `channels.matrix.defaultAccount` avant la mise à niveau depuis l’ancienne disposition à stockage plat afin qu’OpenClaw sache quel compte doit recevoir cet état hérité partagé.
- Si l’ancien plugin stockait localement une clé de déchiffrement de sauvegarde des clés de salon Matrix, le démarrage ou `openclaw doctor --fix` l’importera automatiquement dans le nouveau flux de clé de récupération.
- Si le jeton d’accès Matrix a changé après la préparation de la migration, le démarrage analyse désormais les racines de stockage voisines basées sur le hachage du jeton pour trouver un état hérité en attente de restauration avant d’abandonner la restauration automatique de sauvegarde.
- Si le jeton d’accès Matrix change plus tard pour le même compte, homeserver et utilisateur, OpenClaw préfère désormais réutiliser la racine de stockage basée sur le hachage du jeton la plus complète existante au lieu de repartir d’un répertoire d’état Matrix vide.
- Au prochain démarrage de la passerelle, les clés de salon sauvegardées seront automatiquement restaurées dans le nouveau magasin crypto.
- Si l’ancien plugin possédait des clés de salon uniquement locales qui n’ont jamais été sauvegardées, OpenClaw l’indiquera clairement. Ces clés ne peuvent pas être exportées automatiquement depuis l’ancien magasin crypto rust, donc une partie de l’ancien historique chiffré peut rester indisponible jusqu’à une récupération manuelle.
- Voir [Migration Matrix](/install/migrating-matrix) pour le flux complet de mise à niveau, les limites, les commandes de récupération et les messages de migration courants.

L’état d’exécution chiffré est organisé sous des racines basées sur le hachage du jeton, par compte et par utilisateur, dans
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Ce répertoire contient le magasin de synchronisation (`bot-storage.json`), le magasin crypto (`crypto/`),
le fichier de clé de récupération (`recovery-key.json`), l’instantané IndexedDB (`crypto-idb-snapshot.json`),
les liaisons de fils (`thread-bindings.json`) et l’état de vérification au démarrage (`startup-verification.json`)
lorsque ces fonctionnalités sont utilisées.
Lorsque le jeton change mais que l’identité du compte reste la même, OpenClaw réutilise la meilleure
racine existante pour ce tuple compte/homeserver/utilisateur afin que l’état de synchronisation antérieur, l’état crypto, les liaisons de fils
et l’état de vérification au démarrage restent visibles.

### Modèle de magasin crypto Node

E2EE Matrix dans ce plugin utilise, dans Node, le chemin crypto Rust officiel du `matrix-js-sdk`.
Ce chemin attend une persistance basée sur IndexedDB si vous voulez que l’état crypto survive aux redémarrages.

OpenClaw fournit actuellement cela dans Node en :

- utilisant `fake-indexeddb` comme shim d’API IndexedDB attendu par le SDK
- restaurant le contenu IndexedDB crypto Rust depuis `crypto-idb-snapshot.json` avant `initRustCrypto`
- persistant le contenu IndexedDB mis à jour vers `crypto-idb-snapshot.json` après l’initialisation et pendant l’exécution
- sérialisant la restauration et la persistance de l’instantané par rapport à `crypto-idb-snapshot.json` avec un verrou de fichier consultatif afin que la persistance à l’exécution de la passerelle et la maintenance via CLI n’entrent pas en concurrence sur le même fichier d’instantané

Il s’agit d’une plomberie de compatibilité/stockage, pas d’une implémentation crypto personnalisée.
Le fichier d’instantané est un état d’exécution sensible et est stocké avec des permissions de fichier restrictives.
Selon le modèle de sécurité d’OpenClaw, l’hôte de la passerelle et le répertoire d’état local d’OpenClaw se trouvent déjà à l’intérieur de la frontière de confiance de l’opérateur ; il s’agit donc principalement d’un enjeu de durabilité opérationnelle plutôt que d’une frontière de confiance distante distincte.

Amélioration prévue :

- ajouter la prise en charge de SecretRef pour le matériel de clé Matrix persistant afin que les clés de récupération et les secrets associés de chiffrement du magasin puissent provenir des fournisseurs de secrets OpenClaw plutôt que seulement de fichiers locaux

## Gestion du profil

Mettez à jour l’auto-profil Matrix pour le compte sélectionné avec :

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Ajoutez `--account <id>` lorsque vous voulez cibler explicitement un compte Matrix nommé.

Matrix accepte directement les URL d’avatar `mxc://`. Lorsque vous passez une URL d’avatar `http://` ou `https://`, OpenClaw la téléverse d’abord vers Matrix et enregistre l’URL `mxc://` résolue dans `channels.matrix.avatarUrl` (ou la surcharge du compte sélectionné).

## Avis de vérification automatiques

Matrix publie désormais directement les avis de cycle de vie de vérification dans le salon strict de vérification en message privé sous forme de messages `m.notice`.
Cela inclut :

- les avis de demande de vérification
- les avis d’état prêt à vérifier (avec indication explicite « Verify by emoji »)
- les avis de démarrage et de fin de vérification
- les détails SAS (emoji et décimal) lorsqu’ils sont disponibles

Les demandes de vérification entrantes provenant d’un autre client Matrix sont suivies et acceptées automatiquement par OpenClaw.
Pour les flux d’auto-vérification, OpenClaw démarre aussi automatiquement le flux SAS lorsque la vérification par emoji devient disponible et confirme son propre côté.
Pour les demandes de vérification provenant d’un autre utilisateur/appareil Matrix, OpenClaw accepte automatiquement la demande puis attend que le flux SAS se poursuive normalement.
Vous devez toujours comparer les emoji ou le SAS décimal dans votre client Matrix et confirmer « They match » là-bas pour terminer la vérification.

OpenClaw n’accepte pas automatiquement à l’aveugle les flux dupliqués auto-initiés. Le démarrage évite de créer une nouvelle demande lorsqu’une demande d’auto-vérification est déjà en attente.

Les avis système/de protocole de vérification ne sont pas transmis au pipeline de chat de l’agent, ils ne produisent donc pas `NO_REPLY`.

### Hygiène des appareils

Les anciens appareils Matrix gérés par OpenClaw peuvent s’accumuler sur le compte et rendre la confiance dans les salons chiffrés plus difficile à raisonner.
Listez-les avec :

```bash
openclaw matrix devices list
```

Supprimez les appareils OpenClaw gérés obsolètes avec :

```bash
openclaw matrix devices prune-stale
```

### Réparation des salons directs

Si l’état des messages privés se désynchronise, OpenClaw peut se retrouver avec des mappages `m.direct` obsolètes qui pointent vers d’anciens salons solo au lieu du message privé actif. Inspectez le mappage actuel pour un pair avec :

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Réparez-le avec :

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

La réparation garde la logique spécifique à Matrix dans le plugin :

- elle privilégie un message privé strict 1:1 déjà mappé dans `m.direct`
- sinon, elle se rabat sur n’importe quel message privé strict 1:1 actuellement rejoint avec cet utilisateur
- si aucun message privé sain n’existe, elle crée un nouveau salon direct et réécrit `m.direct` pour pointer vers lui

Le flux de réparation ne supprime pas automatiquement les anciens salons. Il sélectionne seulement le message privé sain et met à jour le mappage afin que les nouveaux envois Matrix, les avis de vérification et les autres flux de messages directs ciblent de nouveau le bon salon.

## Fils

Matrix prend en charge les fils Matrix natifs à la fois pour les réponses automatiques et les envois via les outils de message.

- `threadReplies: "off"` garde les réponses au niveau supérieur et maintient les messages entrants en fil sur la session parente.
- `threadReplies: "inbound"` répond dans un fil uniquement si le message entrant était déjà dans ce fil.
- `threadReplies: "always"` garde les réponses de salon dans un fil ancré sur le message déclencheur et route cette conversation via la session à portée de fil correspondante à partir du premier message déclencheur.
- `dm.threadReplies` remplace le paramètre global pour les messages privés uniquement. Par exemple, vous pouvez garder les fils de salon isolés tout en gardant les messages privés à plat.
- Les messages entrants en fil incluent le message racine du fil comme contexte agent supplémentaire.
- Les envois via les outils de message héritent désormais automatiquement du fil Matrix actuel lorsque la cible est le même salon, ou la même cible utilisateur en message privé, sauf si un `threadId` explicite est fourni.
- Les liaisons de fils à l’exécution sont prises en charge pour Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` et `/acp spawn` lié à un fil fonctionnent désormais dans les salons et messages privés Matrix.
- `/focus` au niveau supérieur dans un salon/message privé Matrix crée un nouveau fil Matrix et le lie à la session cible lorsque `threadBindings.spawnSubagentSessions=true`.
- L’exécution de `/focus` ou `/acp spawn --thread here` dans un fil Matrix existant lie ce fil courant à la place.

## Liaisons de conversation ACP

Les salons, messages privés et fils Matrix existants peuvent être transformés en espaces de travail ACP persistants sans changer la surface de chat.

Flux opérateur rapide :

- Exécutez `/acp spawn codex --bind here` dans le message privé, le salon ou le fil existant Matrix que vous voulez continuer à utiliser.
- Dans un message privé ou un salon Matrix de niveau supérieur, le message privé/le salon actuel reste la surface de chat et les futurs messages sont routés vers la session ACP créée.
- À l’intérieur d’un fil Matrix existant, `--bind here` lie ce fil courant sur place.
- `/new` et `/reset` réinitialisent sur place la même session ACP liée.
- `/acp close` ferme la session ACP et supprime la liaison.

Remarques :

- `--bind here` ne crée pas de fil Matrix enfant.
- `threadBindings.spawnAcpSessions` n’est requis que pour `/acp spawn --thread auto|here`, quand OpenClaw doit créer ou lier un fil Matrix enfant.

### Configuration des liaisons de fils

Matrix hérite des valeurs globales par défaut depuis `session.threadBindings`, et prend aussi en charge des surcharges par canal :

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Les indicateurs d’apparition liés aux fils Matrix sont optionnels :

- Définissez `threadBindings.spawnSubagentSessions: true` pour permettre à `/focus` au niveau supérieur de créer et lier de nouveaux fils Matrix.
- Définissez `threadBindings.spawnAcpSessions: true` pour permettre à `/acp spawn --thread auto|here` de lier des sessions ACP à des fils Matrix.

## Réactions

Matrix prend en charge les actions de réaction sortantes, les notifications de réaction entrantes et les réactions d’accusé de réception entrantes.

- L’outillage de réaction sortante est contrôlé par `channels["matrix"].actions.reactions`.
- `react` ajoute une réaction à un événement Matrix spécifique.
- `reactions` liste le résumé actuel des réactions pour un événement Matrix spécifique.
- `emoji=""` supprime les réactions du compte bot lui-même sur cet événement.
- `remove: true` supprime uniquement la réaction emoji spécifiée du compte bot.

La portée de la réaction d’accusé de réception est résolue dans cet ordre :

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- repli sur l’emoji d’identité de l’agent

La portée de la réaction d’accusé de réception est résolue dans cet ordre :

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Le mode de notification des réactions est résolu dans cet ordre :

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- par défaut : `own`

Comportement actuel :

- `reactionNotifications: "own"` transmet les événements `m.reaction` ajoutés lorsqu’ils ciblent des messages Matrix rédigés par le bot.
- `reactionNotifications: "off"` désactive les événements système de réaction.
- Les suppressions de réactions ne sont toujours pas synthétisées en événements système car Matrix les expose comme des redactions et non comme des suppressions autonomes de `m.reaction`.

## Contexte d’historique

- `channels.matrix.historyLimit` contrôle le nombre de messages récents du salon inclus comme `InboundHistory` lorsqu’un message de salon Matrix déclenche l’agent.
- Il se rabat sur `messages.groupChat.historyLimit`. Définissez `0` pour désactiver.
- L’historique des salons Matrix est limité au salon. Les messages privés continuent d’utiliser l’historique normal de session.
- L’historique des salons Matrix est limité aux messages en attente : OpenClaw met en mémoire tampon les messages du salon qui n’ont pas encore déclenché de réponse, puis prend un instantané de cette fenêtre lorsqu’une mention ou un autre déclencheur arrive.
- Le message déclencheur actuel n’est pas inclus dans `InboundHistory` ; il reste dans le corps entrant principal pour ce tour.
- Les nouvelles tentatives du même événement Matrix réutilisent l’instantané d’historique d’origine au lieu de dériver vers des messages plus récents du salon.

## Visibilité du contexte

Matrix prend en charge le contrôle partagé `contextVisibility` pour le contexte supplémentaire du salon, comme le texte de réponse récupéré, les racines de fil et l’historique en attente.

- `contextVisibility: "all"` est la valeur par défaut. Le contexte supplémentaire est conservé tel qu’il a été reçu.
- `contextVisibility: "allowlist"` filtre le contexte supplémentaire selon les expéditeurs autorisés par les vérifications actives de liste d’autorisation salon/utilisateur.
- `contextVisibility: "allowlist_quote"` se comporte comme `allowlist`, mais conserve quand même une réponse citée explicite.

Ce paramètre affecte la visibilité du contexte supplémentaire, pas la possibilité pour le message entrant lui-même de déclencher une réponse.
L’autorisation de déclenchement provient toujours de `groupPolicy`, `groups`, `groupAllowFrom` et des paramètres de politique des messages privés.

## Exemple de politique pour messages privés et salons

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

Voir [Groups](/channels/groups) pour le comportement des listes d’autorisation et du déclenchement par mention.

Exemple d’appairage pour les messages privés Matrix :

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Si un utilisateur Matrix non approuvé continue à vous envoyer des messages avant approbation, OpenClaw réutilise le même code d’appairage en attente et peut renvoyer un rappel après un court délai au lieu d’émettre un nouveau code.

Voir [Pairing](/channels/pairing) pour le flux partagé d’appairage des messages privés et la disposition du stockage.

## Approbations exec

Matrix peut agir comme client d’approbation exec pour un compte Matrix.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (facultatif ; se rabat sur `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Les approbateurs doivent être des identifiants utilisateur Matrix comme `@owner:example.org`. Matrix active automatiquement les approbations exec natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur peut être résolu, soit depuis `execApprovals.approvers`, soit depuis `channels.matrix.dm.allowFrom`. Définissez `enabled: false` pour désactiver explicitement Matrix comme client d’approbation natif. Les demandes d’approbation se rabattent sinon sur d’autres routes d’approbation configurées ou sur la politique de repli des approbations exec.

Le routage natif Matrix est aujourd’hui limité à exec :

- `channels.matrix.execApprovals.*` contrôle le routage natif message privé/canal pour les approbations exec uniquement.
- Les approbations de plugin utilisent toujours le `/approve` partagé dans le même chat ainsi que tout transfert `approvals.plugin` configuré.
- Matrix peut toujours réutiliser `channels.matrix.dm.allowFrom` pour l’autorisation des approbations de plugin lorsqu’il peut déduire les approbateurs en toute sécurité, mais il n’expose pas de chemin natif séparé d’éventail message privé/canal pour les approbations de plugin.

Règles d’envoi :

- `target: "dm"` envoie les invites d’approbation dans les messages privés des approbateurs
- `target: "channel"` renvoie l’invite dans le salon ou message privé Matrix d’origine
- `target: "both"` envoie vers les messages privés des approbateurs et le salon ou message privé Matrix d’origine

Matrix utilise aujourd’hui des invites d’approbation textuelles. Les approbateurs les résolvent avec `/approve <id> allow-once`, `/approve <id> allow-always`, ou `/approve <id> deny`.

Seuls les approbateurs résolus peuvent autoriser ou refuser. L’envoi dans le canal inclut le texte de commande ; activez donc `channel` ou `both` uniquement dans des salons de confiance.

Les invites d’approbation Matrix réutilisent le planificateur d’approbation partagé du cœur. La surface native spécifique à Matrix ne sert de transport que pour les approbations exec : routage salon/message privé et comportement d’envoi/mise à jour/suppression des messages.

Surcharge par compte :

- `channels.matrix.accounts.<account>.execApprovals`

Documentation associée : [Approbations exec](/tools/exec-approvals)

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

Les valeurs de niveau supérieur `channels.matrix` servent de valeurs par défaut pour les comptes nommés, sauf si un compte les remplace.
Vous pouvez limiter les entrées de salon héritées à un compte Matrix avec `groups.<room>.account` (ou l’ancien `rooms.<room>.account`).
Les entrées sans `account` restent partagées entre tous les comptes Matrix, et les entrées avec `account: "default"` continuent de fonctionner lorsque le compte par défaut est configuré directement au niveau supérieur dans `channels.matrix.*`.
Les valeurs partagées par défaut d’authentification partielles ne créent pas à elles seules un compte implicite par défaut distinct. OpenClaw ne synthétise le compte `default` de niveau supérieur que lorsque ce compte par défaut dispose d’une authentification fraîche (`homeserver` plus `accessToken`, ou `homeserver` plus `userId` et `password`) ; les comptes nommés peuvent rester détectables à partir de `homeserver` plus `userId` lorsque des identifiants mis en cache satisfont l’authentification plus tard.
Si Matrix possède déjà exactement un compte nommé, ou si `defaultAccount` pointe vers une clé de compte nommé existante, la promotion réparation/configuration d’un compte unique vers plusieurs comptes préserve ce compte au lieu de créer une nouvelle entrée `accounts.default`. Seules les clés d’authentification/d’initialisation Matrix sont déplacées dans ce compte promu ; les clés partagées de politique d’envoi restent au niveau supérieur.
Définissez `defaultAccount` lorsque vous voulez qu’OpenClaw privilégie un compte Matrix nommé pour le routage implicite, les sondes et les opérations CLI.
Si vous configurez plusieurs comptes nommés, définissez `defaultAccount` ou passez `--account <id>` pour les commandes CLI qui reposent sur une sélection implicite de compte.
Passez `--account <id>` à `openclaw matrix verify ...` et `openclaw matrix devices ...` lorsque vous voulez remplacer cette sélection implicite pour une commande.

## Homeservers privés/LAN

Par défaut, OpenClaw bloque les homeservers Matrix privés/internes pour la protection SSRF sauf si vous
optez explicitement pour cela par compte.

Si votre homeserver fonctionne sur localhost, une IP LAN/Tailscale ou un nom d’hôte interne, activez
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

Exemple de configuration via CLI :

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Cette option ne permet que des cibles privées/internes de confiance. Les homeservers publics en clair comme
`http://matrix.example.org:8008` restent bloqués. Préférez `https://` dès que possible.

## Utilisation d’un proxy pour le trafic Matrix

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
OpenClaw utilise le même paramètre de proxy pour le trafic Matrix à l’exécution et les sondes d’état des comptes.

## Résolution des cibles

Matrix accepte ces formes de cible partout où OpenClaw vous demande une cible de salon ou d’utilisateur :

- Utilisateurs : `@user:server`, `user:@user:server`, ou `matrix:user:@user:server`
- Salons : `!room:server`, `room:!room:server`, ou `matrix:room:!room:server`
- Alias : `#alias:server`, `channel:#alias:server`, ou `matrix:channel:#alias:server`

La recherche en direct dans l’annuaire utilise le compte Matrix connecté :

- Les recherches d’utilisateurs interrogent l’annuaire des utilisateurs Matrix sur ce homeserver.
- Les recherches de salons acceptent directement les identifiants et alias explicites de salon, puis se rabattent sur la recherche des noms de salons rejoints pour ce compte.
- La recherche par nom de salon rejoint fonctionne au mieux. Si un nom de salon ne peut pas être résolu en identifiant ou alias, il est ignoré par la résolution de liste d’autorisation à l’exécution.

## Référence de configuration

- `enabled` : active ou désactive le canal.
- `name` : libellé facultatif pour le compte.
- `defaultAccount` : identifiant de compte préféré lorsque plusieurs comptes Matrix sont configurés.
- `homeserver` : URL du homeserver, par exemple `https://matrix.example.org`.
- `allowPrivateNetwork` : autorise ce compte Matrix à se connecter à des homeservers privés/internes. Activez-le lorsque le homeserver se résout vers `localhost`, une IP LAN/Tailscale ou un hôte interne tel que `matrix-synapse`.
- `proxy` : URL facultative d’un proxy HTTP(S) pour le trafic Matrix. Les comptes nommés peuvent remplacer la valeur par défaut de niveau supérieur avec leur propre `proxy`.
- `userId` : identifiant utilisateur Matrix complet, par exemple `@bot:example.org`.
- `accessToken` : jeton d’accès pour l’authentification basée sur un jeton. Les valeurs en clair et SecretRef sont prises en charge pour `channels.matrix.accessToken` et `channels.matrix.accounts.<id>.accessToken` via les fournisseurs env/file/exec. Voir [Gestion des secrets](/gateway/secrets).
- `password` : mot de passe pour la connexion par mot de passe. Les valeurs en clair et SecretRef sont prises en charge.
- `deviceId` : identifiant explicite de l’appareil Matrix.
- `deviceName` : nom d’affichage de l’appareil pour la connexion par mot de passe.
- `avatarUrl` : URL stockée de l’avatar du compte pour la synchronisation du profil et les mises à jour `set-profile`.
- `initialSyncLimit` : limite d’événements de synchronisation au démarrage.
- `encryption` : active E2EE.
- `allowlistOnly` : force le comportement liste d’autorisation uniquement pour les messages privés et les salons.
- `allowBots` : autorise les messages d’autres comptes Matrix OpenClaw configurés (`true` ou `"mentions"`).
- `groupPolicy` : `open`, `allowlist`, ou `disabled`.
- `contextVisibility` : mode de visibilité du contexte supplémentaire du salon (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom` : liste d’autorisation des identifiants utilisateur pour le trafic de salon.
- Les entrées `groupAllowFrom` doivent être des identifiants utilisateur Matrix complets. Les noms non résolus sont ignorés à l’exécution.
- `historyLimit` : nombre maximal de messages de salon à inclure comme contexte d’historique de groupe. Se rabat sur `messages.groupChat.historyLimit`. Définissez `0` pour désactiver.
- `replyToMode` : `off`, `first`, ou `all`.
- `markdown` : configuration facultative de rendu Markdown pour le texte Matrix sortant.
- `streaming` : `off` (par défaut), `partial`, `true`, ou `false`. `partial` et `true` activent des aperçus brouillon en un seul message avec mises à jour sur place.
- `blockStreaming` : `true` active des messages de progression séparés pour les blocs assistant terminés pendant que le streaming d’aperçu brouillon est actif.
- `threadReplies` : `off`, `inbound`, ou `always`.
- `threadBindings` : surcharges par canal pour le routage et le cycle de vie des sessions liées à un fil.
- `startupVerification` : mode de demande automatique d’auto-vérification au démarrage (`if-unverified`, `off`).
- `startupVerificationCooldownHours` : délai avant de réessayer les demandes automatiques de vérification au démarrage.
- `textChunkLimit` : taille des segments de message sortant.
- `chunkMode` : `length` ou `newline`.
- `responsePrefix` : préfixe facultatif de message pour les réponses sortantes.
- `ackReaction` : surcharge facultative de réaction d’accusé de réception pour ce canal/compte.
- `ackReactionScope` : surcharge facultative de portée de réaction d’accusé de réception (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications` : mode de notification de réaction entrante (`own`, `off`).
- `mediaMaxMb` : limite de taille des médias en Mo pour la gestion des médias Matrix. Elle s’applique aux envois sortants et au traitement des médias entrants.
- `autoJoin` : politique de jointure automatique des invitations (`always`, `allowlist`, `off`). Valeur par défaut : `off`.
- `autoJoinAllowlist` : salons/alias autorisés lorsque `autoJoin` vaut `allowlist`. Les entrées d’alias sont résolues en identifiants de salon pendant le traitement des invitations ; OpenClaw ne fait pas confiance à l’état d’alias revendiqué par le salon invité.
- `dm` : bloc de politique de messages privés (`enabled`, `policy`, `allowFrom`, `threadReplies`).
- Les entrées `dm.allowFrom` doivent être des identifiants utilisateur Matrix complets, sauf si vous les avez déjà résolues via la recherche en direct dans l’annuaire.
- `dm.threadReplies` : surcharge de politique de fil pour les messages privés uniquement (`off`, `inbound`, `always`). Elle remplace le paramètre global `threadReplies` à la fois pour l’emplacement des réponses et l’isolation des sessions dans les messages privés.
- `execApprovals` : envoi natif des approbations exec Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers` : identifiants utilisateur Matrix autorisés à approuver les demandes exec. Facultatif lorsque `dm.allowFrom` identifie déjà les approbateurs.
- `execApprovals.target` : `dm | channel | both` (par défaut : `dm`).
- `accounts` : surcharges nommées par compte. Les valeurs de niveau supérieur `channels.matrix` servent de valeurs par défaut pour ces entrées.
- `groups` : carte de politique par salon. Préférez les identifiants ou alias de salon ; les noms de salon non résolus sont ignorés à l’exécution. L’identité de session/de groupe utilise l’identifiant stable du salon après résolution, tandis que les libellés lisibles restent issus des noms de salon.
- `groups.<room>.account` : limite une entrée de salon héritée à un compte Matrix spécifique dans les configurations multi-comptes.
- `groups.<room>.allowBots` : surcharge au niveau du salon pour les expéditeurs bots configurés (`true` ou `"mentions"`).
- `groups.<room>.users` : liste d’autorisation des expéditeurs par salon.
- `groups.<room>.tools` : surcharges d’autorisation/refus d’outils par salon.
- `groups.<room>.autoReply` : surcharge au niveau du salon du déclenchement par mention. `true` désactive l’exigence de mention pour ce salon ; `false` la réactive de force.
- `groups.<room>.skills` : filtre facultatif de Skills au niveau du salon.
- `groups.<room>.systemPrompt` : extrait facultatif de prompt système au niveau du salon.
- `rooms` : ancien alias de `groups`.
- `actions` : contrôle d’accès par action pour les outils (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Lié

- [Vue d’ensemble des canaux](/channels) — tous les canaux pris en charge
- [Appairage](/channels/pairing) — flux d’authentification et d’appairage des messages privés
- [Groups](/channels/groups) — comportement des discussions de groupe et déclenchement par mention
- [Routage des canaux](/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/gateway/security) — modèle d’accès et durcissement
