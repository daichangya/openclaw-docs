---
read_when:
    - Travail sur les fonctionnalités du canal Discord
summary: Statut de prise en charge du bot Discord, capacités et configuration
title: Discord
x-i18n:
    generated_at: "2026-04-23T13:57:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1160a0b221bc3251722a81c00c65ee7c2001efce345248727f1f3c8580a0e953
    source_path: channels/discord.md
    workflow: 15
---

# Discord (API Bot)

Statut : prêt pour les DM et les canaux de serveur via la passerelle Discord officielle.

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Les DM Discord utilisent par défaut le mode d’appairage.
  </Card>
  <Card title="Commandes slash" icon="terminal" href="/fr/tools/slash-commands">
    Comportement natif des commandes et catalogue des commandes.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et procédure de réparation.
  </Card>
</CardGroup>

## Configuration rapide

Vous devrez créer une nouvelle application avec un bot, ajouter le bot à votre serveur, puis l’appairer à OpenClaw. Nous vous recommandons d’ajouter votre bot à votre propre serveur privé. Si vous n’en avez pas encore, [créez-en un d’abord](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (choisissez **Create My Own > For me and my friends**).

<Steps>
  <Step title="Créer une application Discord et un bot">
    Accédez au [Portail des développeurs Discord](https://discord.com/developers/applications) et cliquez sur **New Application**. Donnez-lui un nom comme « OpenClaw ».

    Cliquez sur **Bot** dans la barre latérale. Définissez le **Username** sur le nom que vous donnez à votre agent OpenClaw.

  </Step>

  <Step title="Activer les intents privilégiés">
    Toujours sur la page **Bot**, faites défiler jusqu’à **Privileged Gateway Intents** et activez :

    - **Message Content Intent** (requis)
    - **Server Members Intent** (recommandé ; requis pour les listes d’autorisation de rôles et la correspondance nom-vers-ID)
    - **Presence Intent** (facultatif ; nécessaire uniquement pour les mises à jour de présence)

  </Step>

  <Step title="Copier votre jeton de bot">
    Remontez sur la page **Bot** et cliquez sur **Reset Token**.

    <Note>
    Malgré son nom, cela génère votre premier jeton — rien n’est réellement « réinitialisé ».
    </Note>

    Copiez le jeton et enregistrez-le quelque part. Il s’agit de votre **Bot Token** et vous en aurez besoin très bientôt.

  </Step>

  <Step title="Générer une URL d’invitation et ajouter le bot à votre serveur">
    Cliquez sur **OAuth2** dans la barre latérale. Vous allez générer une URL d’invitation avec les bonnes autorisations pour ajouter le bot à votre serveur.

    Faites défiler jusqu’à **OAuth2 URL Generator** et activez :

    - `bot`
    - `applications.commands`

    Une section **Bot Permissions** apparaîtra en dessous. Activez au minimum :

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (facultatif)

    Il s’agit de l’ensemble minimal pour les canaux textuels classiques. Si vous prévoyez de publier dans des fils Discord, y compris des workflows de canaux forum ou média qui créent ou poursuivent un fil, activez aussi **Send Messages in Threads**.
    Copiez l’URL générée en bas, collez-la dans votre navigateur, sélectionnez votre serveur, puis cliquez sur **Continue** pour connecter le bot. Vous devriez maintenant voir votre bot dans le serveur Discord.

  </Step>

  <Step title="Activer le mode développeur et récupérer vos IDs">
    De retour dans l’application Discord, vous devez activer le mode développeur afin de pouvoir copier les IDs internes.

    1. Cliquez sur **User Settings** (icône d’engrenage à côté de votre avatar) → **Advanced** → activez **Developer Mode**
    2. Faites un clic droit sur l’**icône de votre serveur** dans la barre latérale → **Copy Server ID**
    3. Faites un clic droit sur **votre propre avatar** → **Copy User ID**

    Enregistrez votre **Server ID** et votre **User ID** avec votre Bot Token — vous enverrez les trois à OpenClaw à l’étape suivante.

  </Step>

  <Step title="Autoriser les DM des membres du serveur">
    Pour que l’appairage fonctionne, Discord doit autoriser votre bot à vous envoyer un DM. Faites un clic droit sur l’**icône de votre serveur** → **Privacy Settings** → activez **Direct Messages**.

    Cela permet aux membres du serveur (y compris les bots) de vous envoyer des DM. Laissez cette option activée si vous souhaitez utiliser les DM Discord avec OpenClaw. Si vous prévoyez d’utiliser uniquement des canaux de serveur, vous pouvez désactiver les DM après l’appairage.

  </Step>

  <Step title="Définir votre jeton de bot de manière sécurisée (ne l’envoyez pas dans le chat)">
    Votre jeton de bot Discord est un secret (comme un mot de passe). Définissez-le sur la machine qui exécute OpenClaw avant d’envoyer un message à votre agent.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Si OpenClaw s’exécute déjà en tant que service en arrière-plan, redémarrez-le via l’app Mac OpenClaw ou en arrêtant puis en redémarrant le processus `openclaw gateway run`.

  </Step>

  <Step title="Configurer OpenClaw et appairer">

    <Tabs>
      <Tab title="Demander à votre agent">
        Discutez avec votre agent OpenClaw sur n’importe quel canal existant (par exemple Telegram) et dites-lui quoi faire. Si Discord est votre premier canal, utilisez plutôt l’onglet CLI / configuration.

        > « J’ai déjà défini mon jeton de bot Discord dans la configuration. Merci de terminer la configuration de Discord avec le User ID `<user_id>` et le Server ID `<server_id>`. »
      </Tab>
      <Tab title="CLI / configuration">
        Si vous préférez une configuration basée sur un fichier, définissez :

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        Solution de repli env pour le compte par défaut :

```bash
DISCORD_BOT_TOKEN=...
```

        Les valeurs `token` en texte brut sont prises en charge. Les valeurs SecretRef sont également prises en charge pour `channels.discord.token` avec les fournisseurs env/file/exec. Voir [Gestion des secrets](/fr/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Approuver le premier appairage par DM">
    Attendez que la passerelle soit en cours d’exécution, puis envoyez un DM à votre bot dans Discord. Il répondra avec un code d’appairage.

    <Tabs>
      <Tab title="Demander à votre agent">
        Envoyez le code d’appairage à votre agent sur votre canal existant :

        > « Approuve ce code d’appairage Discord : `<CODE>` »
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Les codes d’appairage expirent après 1 heure.

    Vous devriez maintenant pouvoir discuter avec votre agent en DM sur Discord.

  </Step>
</Steps>

<Note>
La résolution des jetons tient compte du compte. Les valeurs de jeton dans la configuration ont priorité sur la solution de repli env. `DISCORD_BOT_TOKEN` n’est utilisé que pour le compte par défaut.
Pour les appels sortants avancés (outil de message/actions de canal), un `token` explicite par appel est utilisé pour cet appel. Cela s’applique aux actions d’envoi et de lecture/sondage (par exemple read/search/fetch/thread/pins/permissions). Les paramètres de politique de compte et de nouvelle tentative proviennent toujours du compte sélectionné dans l’instantané d’exécution actif.
</Note>

## Recommandé : configurer un espace de travail de serveur

Une fois que les DM fonctionnent, vous pouvez configurer votre serveur Discord comme un espace de travail complet où chaque canal dispose de sa propre session d’agent avec son propre contexte. C’est recommandé pour les serveurs privés où il n’y a que vous et votre bot.

<Steps>
  <Step title="Ajouter votre serveur à la liste d’autorisation des serveurs">
    Cela permet à votre agent de répondre dans n’importe quel canal de votre serveur, pas seulement dans les DM.

    <Tabs>
      <Tab title="Demander à votre agent">
        > « Ajoute mon Server ID Discord `<server_id>` à la liste d’autorisation des serveurs »
      </Tab>
      <Tab title="Configuration">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Autoriser les réponses sans @mention">
    Par défaut, votre agent ne répond dans les canaux de serveur que lorsqu’il est @mentionné. Pour un serveur privé, vous voudrez probablement qu’il réponde à chaque message.

    <Tabs>
      <Tab title="Demander à votre agent">
        > « Autorise mon agent à répondre sur ce serveur sans devoir être @mentionné »
      </Tab>
      <Tab title="Configuration">
        Définissez `requireMention: false` dans votre configuration de serveur :

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Prévoir la mémoire dans les canaux de serveur">
    Par défaut, la mémoire à long terme (`MEMORY.md`) n’est chargée que dans les sessions DM. Les canaux de serveur ne chargent pas automatiquement `MEMORY.md`.

    <Tabs>
      <Tab title="Demander à votre agent">
        > « Quand je pose des questions dans les canaux Discord, utilise memory_search ou memory_get si tu as besoin de contexte à long terme depuis MEMORY.md. »
      </Tab>
      <Tab title="Manuel">
        Si vous avez besoin d’un contexte partagé dans chaque canal, placez les instructions stables dans `AGENTS.md` ou `USER.md` (ils sont injectés dans chaque session). Conservez les notes à long terme dans `MEMORY.md` et accédez-y à la demande avec les outils de mémoire.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Créez maintenant quelques canaux sur votre serveur Discord et commencez à discuter. Votre agent peut voir le nom du canal, et chaque canal obtient sa propre session isolée — vous pouvez donc configurer `#coding`, `#home`, `#research` ou tout autre canal adapté à votre workflow.

## Modèle d’exécution

- La Gateway possède la connexion Discord.
- Le routage des réponses est déterministe : les réponses entrantes depuis Discord repartent vers Discord.
- Par défaut (`session.dmScope=main`), les conversations directes partagent la session principale de l’agent (`agent:main:main`).
- Les canaux de serveur utilisent des clés de session isolées (`agent:<agentId>:discord:channel:<channelId>`).
- Les DM de groupe sont ignorés par défaut (`channels.discord.dm.groupEnabled=false`).
- Les commandes slash natives s’exécutent dans des sessions de commande isolées (`agent:<agentId>:discord:slash:<userId>`), tout en transportant toujours `CommandTargetSessionKey` vers la session de conversation routée.

## Canaux forum

Les canaux forum et média Discord n’acceptent que des publications dans des fils. OpenClaw prend en charge deux façons de les créer :

- Envoyer un message au parent du forum (`channel:<forumId>`) pour créer automatiquement un fil. Le titre du fil utilise la première ligne non vide de votre message.
- Utiliser `openclaw message thread create` pour créer directement un fil. Ne passez pas `--message-id` pour les canaux forum.

Exemple : envoyer au parent du forum pour créer un fil

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Exemple : créer explicitement un fil de forum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Les parents de forum n’acceptent pas les composants Discord. Si vous avez besoin de composants, envoyez-les au fil lui-même (`channel:<threadId>`).

## Composants interactifs

OpenClaw prend en charge les conteneurs de composants Discord v2 pour les messages d’agent. Utilisez l’outil de message avec une charge utile `components`. Les résultats des interactions sont renvoyés à l’agent comme des messages entrants normaux et suivent les paramètres Discord `replyToMode` existants.

Blocs pris en charge :

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Les lignes d’action autorisent jusqu’à 5 boutons ou un seul menu de sélection
- Types de sélection : `string`, `user`, `role`, `mentionable`, `channel`

Par défaut, les composants sont à usage unique. Définissez `components.reusable=true` pour permettre l’utilisation multiple des boutons, sélections et formulaires jusqu’à leur expiration.

Pour restreindre qui peut cliquer sur un bouton, définissez `allowedUsers` sur ce bouton (IDs utilisateur Discord, tags ou `*`). Lorsqu’il est configuré, les utilisateurs non correspondants reçoivent un refus éphémère.

Les commandes slash `/model` et `/models` ouvrent un sélecteur de modèle interactif avec des menus déroulants pour le fournisseur et le modèle, plus une étape Submit. Sauf si `commands.modelsWrite=false`, `/models add` permet aussi d’ajouter une nouvelle entrée fournisseur/modèle depuis le chat, et les modèles nouvellement ajoutés apparaissent sans redémarrer la passerelle. La réponse du sélecteur est éphémère et seul l’utilisateur qui l’a invoqué peut l’utiliser.

Pièces jointes de fichiers :

- Les blocs `file` doivent pointer vers une référence de pièce jointe (`attachment://<filename>`)
- Fournissez la pièce jointe via `media`/`path`/`filePath` (fichier unique) ; utilisez `media-gallery` pour plusieurs fichiers
- Utilisez `filename` pour remplacer le nom d’envoi lorsqu’il doit correspondre à la référence de pièce jointe

Formulaires modaux :

- Ajoutez `components.modal` avec jusqu’à 5 champs
- Types de champs : `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw ajoute automatiquement un bouton de déclenchement

Exemple :

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Texte de secours facultatif",
  components: {
    reusable: true,
    text: "Choisissez une voie",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approuver",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Refuser", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Choisissez une option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Détails",
      triggerLabel: "Ouvrir le formulaire",
      fields: [
        { type: "text", label: "Demandeur" },
        {
          type: "select",
          label: "Priorité",
          options: [
            { label: "Faible", value: "low" },
            { label: "Élevée", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique des DM">
    `channels.discord.dmPolicy` contrôle l’accès aux DM (hérité : `channels.discord.dm.policy`) :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `channels.discord.allowFrom` inclue `"*"` ; hérité : `channels.discord.dm.allowFrom`)
    - `disabled`

    Si la politique DM n’est pas ouverte, les utilisateurs inconnus sont bloqués (ou invités à s’appairer en mode `pairing`).

    Priorité multi-compte :

    - `channels.discord.accounts.default.allowFrom` s’applique uniquement au compte `default`.
    - Les comptes nommés héritent de `channels.discord.allowFrom` lorsque leur propre `allowFrom` n’est pas défini.
    - Les comptes nommés n’héritent pas de `channels.discord.accounts.default.allowFrom`.

    Format de cible DM pour la livraison :

    - `user:<id>`
    - mention `<@id>`

    Les IDs numériques seuls sont ambigus et rejetés, sauf si un type de cible utilisateur/canal explicite est fourni.

  </Tab>

  <Tab title="Politique des serveurs">
    La gestion des serveurs est contrôlée par `channels.discord.groupPolicy` :

    - `open`
    - `allowlist`
    - `disabled`

    La base de sécurité quand `channels.discord` existe est `allowlist`.

    Comportement de `allowlist` :

    - le serveur doit correspondre à `channels.discord.guilds` (`id` préféré, slug accepté)
    - listes d’autorisation facultatives pour l’expéditeur : `users` (IDs stables recommandés) et `roles` (IDs de rôle uniquement) ; si l’un ou l’autre est configuré, les expéditeurs sont autorisés s’ils correspondent à `users` OU `roles`
    - la correspondance directe par nom/tag est désactivée par défaut ; activez `channels.discord.dangerouslyAllowNameMatching: true` uniquement comme mode de compatibilité de dernier recours
    - les noms/tags sont pris en charge pour `users`, mais les IDs sont plus sûrs ; `openclaw security audit` avertit quand des entrées nom/tag sont utilisées
    - si un serveur a `channels` configuré, les canaux non listés sont refusés
    - si un serveur n’a pas de bloc `channels`, tous les canaux de ce serveur en liste d’autorisation sont autorisés

    Exemple :

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Si vous définissez uniquement `DISCORD_BOT_TOKEN` sans créer de bloc `channels.discord`, la solution de repli à l’exécution est `groupPolicy="allowlist"` (avec un avertissement dans les journaux), même si `channels.defaults.groupPolicy` vaut `open`.

  </Tab>

  <Tab title="Mentions et DM de groupe">
    Les messages de serveur sont soumis par défaut à une exigence de mention.

    La détection des mentions inclut :

    - mention explicite du bot
    - modèles de mention configurés (`agents.list[].groupChat.mentionPatterns`, repli sur `messages.groupChat.mentionPatterns`)
    - comportement implicite de réponse au bot dans les cas pris en charge

    `requireMention` est configuré par serveur/canal (`channels.discord.guilds...`).
    `ignoreOtherMentions` ignore facultativement les messages qui mentionnent un autre utilisateur/rôle mais pas le bot (hors @everyone/@here).

    DM de groupe :

    - par défaut : ignorés (`dm.groupEnabled=false`)
    - liste d’autorisation facultative via `dm.groupChannels` (IDs ou slugs de canal)

  </Tab>
</Tabs>

### Routage d’agent basé sur les rôles

Utilisez `bindings[].match.roles` pour router les membres d’un serveur Discord vers différents agents selon l’ID du rôle. Les liaisons basées sur les rôles n’acceptent que des IDs de rôle et sont évaluées après les liaisons peer ou parent-peer et avant les liaisons uniquement basées sur le serveur. Si une liaison définit aussi d’autres champs de correspondance (par exemple `peer` + `guildId` + `roles`), tous les champs configurés doivent correspondre.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Configuration du Portail des développeurs

<AccordionGroup>
  <Accordion title="Créer une application et un bot">

    1. Portail des développeurs Discord -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Copiez le jeton du bot

  </Accordion>

  <Accordion title="Intents privilégiés">
    Dans **Bot -> Privileged Gateway Intents**, activez :

    - Message Content Intent
    - Server Members Intent (recommandé)

    Presence Intent est facultatif et n’est requis que si vous voulez recevoir les mises à jour de présence. Définir la présence du bot (`setPresence`) ne nécessite pas d’activer les mises à jour de présence pour les membres.

  </Accordion>

  <Accordion title="Scopes OAuth et autorisations de base">
    Générateur d’URL OAuth :

    - scopes : `bot`, `applications.commands`

    Autorisations de base typiques :

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (facultatif)

    Il s’agit de l’ensemble minimal pour les canaux textuels classiques. Si vous prévoyez de publier dans des fils Discord, y compris des workflows de canaux forum ou média qui créent ou poursuivent un fil, activez aussi **Send Messages in Threads**.
    Évitez `Administrator` sauf nécessité explicite.

  </Accordion>

  <Accordion title="Copier les IDs">
    Activez le mode développeur Discord, puis copiez :

    - ID du serveur
    - ID du canal
    - ID de l’utilisateur

    Préférez les IDs numériques dans la configuration OpenClaw pour des audits et sondages fiables.

  </Accordion>
</AccordionGroup>

## Commandes natives et authentification des commandes

- `commands.native` vaut par défaut `"auto"` et est activé pour Discord.
- Remplacement par canal : `channels.discord.commands.native`.
- `commands.native=false` supprime explicitement les commandes natives Discord précédemment enregistrées.
- L’authentification des commandes natives utilise les mêmes listes d’autorisation/politiques Discord que le traitement normal des messages.
- Les commandes peuvent encore être visibles dans l’interface Discord pour des utilisateurs non autorisés ; l’exécution applique tout de même l’authentification OpenClaw et renvoie « not authorized ».

Voir [Commandes slash](/fr/tools/slash-commands) pour le catalogue des commandes et leur comportement.

Paramètres par défaut des commandes slash :

- `ephemeral: true`

## Détails des fonctionnalités

<AccordionGroup>
  <Accordion title="Balises de réponse et réponses natives">
    Discord prend en charge les balises de réponse dans la sortie de l’agent :

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Contrôlé par `channels.discord.replyToMode` :

    - `off` (par défaut)
    - `first`
    - `all`
    - `batched`

    Remarque : `off` désactive le fil de réponse implicite. Les balises explicites `[[reply_to_*]]` sont toujours respectées.
    `first` attache toujours la référence implicite de réponse native au premier message Discord sortant du tour.
    `batched` n’attache la référence implicite de réponse native de Discord que lorsque le tour entrant était un lot anti-rebond de plusieurs messages. Cela est utile si vous voulez des réponses natives principalement pour les conversations ambiguës et très actives, pas pour chaque tour composé d’un seul message.

    Les IDs de message sont exposés dans le contexte/l’historique afin que les agents puissent cibler des messages spécifiques.

  </Accordion>

  <Accordion title="Aperçu du flux en direct">
    OpenClaw peut diffuser des brouillons de réponse en envoyant un message temporaire et en le modifiant à mesure que le texte arrive. `channels.discord.streaming` accepte `off` (par défaut) | `partial` | `block` | `progress`. `progress` correspond à `partial` sur Discord ; `streamMode` est un alias hérité et est migré automatiquement.

    La valeur par défaut reste `off` car les modifications d’aperçu Discord atteignent rapidement les limites de débit lorsque plusieurs bots ou passerelles partagent un compte.

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial` modifie un seul message d’aperçu à mesure que les jetons arrivent.
    - `block` émet des segments de taille brouillon (utilisez `draftChunk` pour ajuster la taille et les points de coupure, plafonnés à `textChunkLimit`).
    - Les médias, erreurs et réponses finales explicites annulent les modifications d’aperçu en attente.
    - `streaming.preview.toolProgress` (par défaut `true`) contrôle si les mises à jour d’outil/progression réutilisent le message d’aperçu.

    Le flux d’aperçu est uniquement textuel ; les réponses média reviennent à la livraison normale. Lorsque le flux `block` est explicitement activé, OpenClaw ignore le flux d’aperçu pour éviter un double flux.

  </Accordion>

  <Accordion title="Historique, contexte et comportement des fils">
    Contexte d’historique du serveur :

    - `channels.discord.historyLimit` par défaut `20`
    - repli : `messages.groupChat.historyLimit`
    - `0` désactive

    Contrôles d’historique DM :

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportement des fils :

    - Les fils Discord sont routés comme des sessions de canal et héritent de la configuration du canal parent sauf remplacement.
    - `channels.discord.thread.inheritParent` (par défaut `false`) permet aux nouveaux fils automatiques d’être initialisés à partir de la transcription du parent. Les remplacements par compte se trouvent sous `channels.discord.accounts.<id>.thread.inheritParent`.
    - Les réactions de l’outil de message peuvent résoudre les cibles DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` est conservé pendant le repli d’activation à l’étape de réponse.

    Les sujets de canal sont injectés comme contexte **non fiable**. Les listes d’autorisation contrôlent qui peut déclencher l’agent, mais ne constituent pas une frontière complète de masquage du contexte supplémentaire.

  </Accordion>

  <Accordion title="Sessions liées aux fils pour les sous-agents">
    Discord peut lier un fil à une cible de session afin que les messages suivants dans ce fil continuent d’être routés vers la même session (y compris les sessions de sous-agent).

    Commandes :

    - `/focus <target>` lie le fil actuel/nouveau à une cible de sous-agent/session
    - `/unfocus` supprime la liaison du fil actuel
    - `/agents` affiche les exécutions actives et l’état des liaisons
    - `/session idle <duration|off>` inspecte/met à jour le retrait automatique du focus après inactivité pour les liaisons focalisées
    - `/session max-age <duration|off>` inspecte/met à jour l’âge maximal strict pour les liaisons focalisées

    Configuration :

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // activation explicite
      },
    },
  },
}
```

    Remarques :

    - `session.threadBindings.*` définit les valeurs par défaut globales.
    - `channels.discord.threadBindings.*` remplace le comportement Discord.
    - `spawnSubagentSessions` doit être à true pour créer/lier automatiquement des fils pour `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` doit être à true pour créer/lier automatiquement des fils pour ACP (`/acp spawn ... --thread ...` ou `sessions_spawn({ runtime: "acp", thread: true })`).
    - Si les liaisons de fils sont désactivées pour un compte, `/focus` et les opérations liées aux liaisons de fils ne sont pas disponibles.

    Voir [Sous-agents](/fr/tools/subagents), [Agents ACP](/fr/tools/acp-agents) et [Référence de configuration](/fr/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Liaisons de canal ACP persistantes">
    Pour des espaces de travail ACP stables « toujours actifs », configurez des liaisons ACP typées de niveau supérieur ciblant des conversations Discord.

    Chemin de configuration :

    - `bindings[]` avec `type: "acp"` et `match.channel: "discord"`

    Exemple :

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Remarques :

    - `/acp spawn codex --bind here` lie le canal ou le fil actuel sur place et conserve les messages futurs sur la même session ACP. Les messages de fil héritent de la liaison du canal parent.
    - Dans un canal ou fil lié, `/new` et `/reset` réinitialisent la même session ACP sur place. Les liaisons temporaires de fil peuvent remplacer la résolution de cible tant qu’elles sont actives.
    - `spawnAcpSessions` n’est requis que lorsque OpenClaw doit créer/lier un fil enfant via `--thread auto|here`.

    Voir [Agents ACP](/fr/tools/acp-agents) pour les détails du comportement des liaisons.

  </Accordion>

  <Accordion title="Notifications de réactions">
    Mode de notification des réactions par serveur :

    - `off`
    - `own` (par défaut)
    - `all`
    - `allowlist` (utilise `guilds.<id>.users`)

    Les événements de réaction sont transformés en événements système et attachés à la session Discord routée.

  </Accordion>

  <Accordion title="Réactions d’accusé de réception">
    `ackReaction` envoie un emoji d’accusé de réception pendant qu’OpenClaw traite un message entrant.

    Ordre de résolution :

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - repli sur l’emoji d’identité de l’agent (`agents.list[].identity.emoji`, sinon "👀")

    Remarques :

    - Discord accepte les emojis unicode ou les noms d’emojis personnalisés.
    - Utilisez `""` pour désactiver la réaction pour un canal ou un compte.

  </Accordion>

  <Accordion title="Écritures de configuration">
    Les écritures de configuration initiées depuis le canal sont activées par défaut.

    Cela affecte les flux `/config set|unset` (lorsque les fonctionnalités de commande sont activées).

    Désactiver :

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Proxy de Gateway">
    Acheminez le trafic WebSocket de la passerelle Discord et les recherches REST au démarrage (ID d’application + résolution de liste d’autorisation) via un proxy HTTP(S) avec `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Remplacement par compte :

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Prise en charge de PluralKit">
    Activez la résolution PluralKit pour mapper les messages relayés à l’identité du membre du système :

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // facultatif ; nécessaire pour les systèmes privés
      },
    },
  },
}
```

    Remarques :

    - les listes d’autorisation peuvent utiliser `pk:<memberId>`
    - les noms d’affichage des membres ne sont mis en correspondance par nom/slug que lorsque `channels.discord.dangerouslyAllowNameMatching: true`
    - les recherches utilisent l’ID du message d’origine et sont limitées à une fenêtre temporelle
    - si la recherche échoue, les messages relayés sont traités comme des messages de bot et supprimés sauf si `allowBots=true`

  </Accordion>

  <Accordion title="Configuration de présence">
    Les mises à jour de présence sont appliquées lorsque vous définissez un champ de statut ou d’activité, ou lorsque vous activez la présence automatique.

    Exemple de statut uniquement :

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Exemple d’activité (le statut personnalisé est le type d’activité par défaut) :

```json5
{
  channels: {
    discord: {
      activity: "Temps de concentration",
      activityType: 4,
    },
  },
}
```

    Exemple de streaming :

```json5
{
  channels: {
    discord: {
      activity: "Codage en direct",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Correspondance des types d’activité :

    - 0: Playing
    - 1: Streaming (nécessite `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (utilise le texte d’activité comme état du statut ; emoji facultatif)
    - 5: Competing

    Exemple de présence automatique (signal de santé d’exécution) :

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "jeton épuisé",
      },
    },
  },
}
```

    La présence automatique mappe la disponibilité d’exécution vers le statut Discord : sain => online, dégradé ou inconnu => idle, épuisé ou indisponible => dnd. Remplacements de texte facultatifs :

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (prend en charge l’espace réservé `{reason}`)

  </Accordion>

  <Accordion title="Approbations dans Discord">
    Discord prend en charge la gestion des approbations par boutons dans les DM et peut, de manière facultative, publier les invites d’approbation dans le canal d’origine.

    Chemin de configuration :

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (facultatif ; repli sur `commands.ownerAllowFrom` lorsque possible)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, par défaut : `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord active automatiquement les approbations d’exécution natives lorsque `enabled` n’est pas défini ou vaut `"auto"` et qu’au moins un approbateur peut être résolu, soit à partir de `execApprovals.approvers`, soit à partir de `commands.ownerAllowFrom`. Discord ne déduit pas les approbateurs d’exécution à partir de `allowFrom` du canal, de l’hérité `dm.allowFrom` ou de `defaultTo` en message direct. Définissez `enabled: false` pour désactiver explicitement Discord comme client d’approbation natif.

    Lorsque `target` vaut `channel` ou `both`, l’invite d’approbation est visible dans le canal. Seuls les approbateurs résolus peuvent utiliser les boutons ; les autres utilisateurs reçoivent un refus éphémère. Les invites d’approbation incluent le texte de la commande, n’activez donc la livraison dans le canal que dans des canaux de confiance. Si l’ID du canal ne peut pas être dérivé à partir de la clé de session, OpenClaw revient à la livraison par DM.

    Discord affiche également les boutons d’approbation partagés utilisés par d’autres canaux de chat. L’adaptateur natif Discord ajoute principalement le routage DM des approbateurs et la diffusion vers le canal.
    Lorsque ces boutons sont présents, ils constituent l’expérience d’approbation principale ; OpenClaw
    ne doit inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique
    que les approbations par chat ne sont pas disponibles ou que l’approbation manuelle est la seule option.

    L’authentification Gateway et la résolution des approbations suivent le contrat client Gateway partagé (`plugin:` IDs résolus via `plugin.approval.resolve` ; autres IDs via `exec.approval.resolve`). Les approbations expirent après 30 minutes par défaut.

    Voir [Approbations d’exécution](/fr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Outils et barrières d’actions

Les actions de message Discord incluent la messagerie, l’administration de canal, la modération, la présence et les actions sur les métadonnées.

Exemples principaux :

- messagerie : `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- réactions : `react`, `reactions`, `emojiList`
- modération : `timeout`, `kick`, `ban`
- présence : `setPresence`

L’action `event-create` accepte un paramètre facultatif `image` (URL ou chemin de fichier local) pour définir l’image de couverture de l’événement planifié.

Les barrières d’actions se trouvent sous `channels.discord.actions.*`.

Comportement par défaut des barrières :

| Groupe d’actions                                                                                                                                                         | Par défaut |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | activé     |
| roles                                                                                                                                                                    | désactivé  |
| moderation                                                                                                                                                               | désactivé  |
| presence                                                                                                                                                                 | désactivé  |

## Interface Components v2

OpenClaw utilise les composants Discord v2 pour les approbations d’exécution et les marqueurs inter-contexte. Les actions de message Discord peuvent aussi accepter `components` pour une interface personnalisée (avancé ; nécessite de construire une charge utile de composant via l’outil Discord), tandis que les `embeds` hérités restent disponibles mais ne sont pas recommandés.

- `channels.discord.ui.components.accentColor` définit la couleur d’accent utilisée par les conteneurs de composants Discord (hex).
- Définissez-la par compte avec `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` sont ignorés lorsque des composants v2 sont présents.

Exemple :

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Voix

Discord a deux surfaces vocales distinctes : les **canaux vocaux** en temps réel (conversations continues) et les **pièces jointes de messages vocaux** (format d’aperçu avec forme d’onde). La passerelle prend en charge les deux.

### Canaux vocaux

Exigences :

- Activez les commandes natives (`commands.native` ou `channels.discord.commands.native`).
- Configurez `channels.discord.voice`.
- Le bot a besoin des autorisations Connect + Speak dans le canal vocal cible.

Utilisez `/vc join|leave|status` pour contrôler les sessions. La commande utilise l’agent par défaut du compte et suit les mêmes règles de liste d’autorisation et de politique de groupe que les autres commandes Discord.

Exemple de jonction automatique :

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

Remarques :

- `voice.tts` remplace `messages.tts` uniquement pour la lecture vocale.
- Les tours de transcription vocale dérivent le statut de propriétaire à partir de Discord `allowFrom` (ou `dm.allowFrom`) ; les locuteurs non propriétaires ne peuvent pas accéder aux outils réservés au propriétaire (par exemple `gateway` et `cron`).
- La voix est activée par défaut ; définissez `channels.discord.voice.enabled=false` pour la désactiver.
- `voice.daveEncryption` et `voice.decryptionFailureTolerance` sont transmis aux options de jonction de `@discordjs/voice`.
- Les valeurs par défaut de `@discordjs/voice` sont `daveEncryption=true` et `decryptionFailureTolerance=24` si elles ne sont pas définies.
- OpenClaw surveille également les échecs de déchiffrement à la réception et récupère automatiquement en quittant/rejoignant le canal vocal après des échecs répétés dans une courte fenêtre.
- Si les journaux de réception affichent de manière répétée `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, cela peut correspondre au bogue amont de réception `@discordjs/voice` suivi dans [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

### Messages vocaux

Les messages vocaux Discord affichent un aperçu de forme d’onde et nécessitent un audio OGG/Opus. OpenClaw génère automatiquement la forme d’onde, mais a besoin de `ffmpeg` et `ffprobe` sur l’hôte Gateway pour inspecter et convertir.

- Fournissez un **chemin de fichier local** (les URL sont rejetées).
- Omettez le contenu textuel (Discord rejette le texte + message vocal dans la même charge utile).
- Tout format audio est accepté ; OpenClaw le convertit en OGG/Opus si nécessaire.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Dépannage

<AccordionGroup>
  <Accordion title="Intents non autorisés utilisés ou le bot ne voit aucun message de serveur">

    - activez Message Content Intent
    - activez Server Members Intent lorsque vous dépendez de la résolution utilisateur/membre
    - redémarrez la Gateway après avoir modifié les intents

  </Accordion>

  <Accordion title="Messages de serveur bloqués de manière inattendue">

    - vérifiez `groupPolicy`
    - vérifiez la liste d’autorisation du serveur sous `channels.discord.guilds`
    - si la map `channels` du serveur existe, seuls les canaux listés sont autorisés
    - vérifiez le comportement de `requireMention` et les modèles de mention

    Vérifications utiles :

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false mais toujours bloqué">
    Causes courantes :

    - `groupPolicy="allowlist"` sans liste d’autorisation de serveur/canal correspondante
    - `requireMention` configuré au mauvais endroit (doit être sous `channels.discord.guilds` ou sous l’entrée du canal)
    - expéditeur bloqué par la liste d’autorisation `users` du serveur/canal

  </Accordion>

  <Accordion title="Les gestionnaires de longue durée expirent ou dupliquent les réponses">

    Journaux typiques :

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Paramètre du budget du listener :

    - compte unique : `channels.discord.eventQueue.listenerTimeout`
    - multi-compte : `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Paramètre de délai d’expiration d’exécution du worker :

    - compte unique : `channels.discord.inboundWorker.runTimeoutMs`
    - multi-compte : `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - par défaut : `1800000` (30 minutes) ; définissez `0` pour désactiver

    Base recommandée :

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Utilisez `eventQueue.listenerTimeout` pour un démarrage lent du listener et `inboundWorker.runTimeoutMs`
    uniquement si vous voulez une soupape de sécurité distincte pour les tours d’agent mis en file d’attente.

  </Accordion>

  <Accordion title="Écarts dans l’audit des autorisations">
    Les vérifications d’autorisation de `channels status --probe` ne fonctionnent qu’avec des IDs de canal numériques.

    Si vous utilisez des clés slug, la correspondance à l’exécution peut toujours fonctionner, mais la sonde ne peut pas vérifier complètement les autorisations.

  </Accordion>

  <Accordion title="Problèmes de DM et d’appairage">

    - DM désactivés : `channels.discord.dm.enabled=false`
    - politique DM désactivée : `channels.discord.dmPolicy="disabled"` (hérité : `channels.discord.dm.policy`)
    - en attente d’approbation d’appairage en mode `pairing`

  </Accordion>

  <Accordion title="Boucles bot à bot">
    Par défaut, les messages rédigés par des bots sont ignorés.

    Si vous définissez `channels.discord.allowBots=true`, utilisez des règles strictes de mention et de liste d’autorisation pour éviter un comportement en boucle.
    Préférez `channels.discord.allowBots="mentions"` pour n’accepter que les messages de bot qui mentionnent le bot.

  </Accordion>

  <Accordion title="La STT vocale perd des données avec DecryptionFailed(...)">

    - gardez OpenClaw à jour (`openclaw update`) afin que la logique de récupération de réception vocale Discord soit présente
    - confirmez `channels.discord.voice.daveEncryption=true` (par défaut)
    - partez de `channels.discord.voice.decryptionFailureTolerance=24` (valeur par défaut amont) et ajustez seulement si nécessaire
    - surveillez les journaux pour :
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - si les échecs continuent après la reconnexion automatique, collectez les journaux et comparez-les à [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Indications vers la référence de configuration

Référence principale :

- [Référence de configuration - Discord](/fr/gateway/configuration-reference#discord)

Champs Discord à fort signal :

- démarrage/authentification : `enabled`, `token`, `accounts.*`, `allowBots`
- politique : `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- commande : `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- file d’événements : `eventQueue.listenerTimeout` (budget du listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker entrant : `inboundWorker.runTimeoutMs`
- réponse/historique : `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- livraison : `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming : `streaming` (alias hérité : `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- média/nouvelle tentative : `mediaMaxMb`, `retry`
  - `mediaMaxMb` limite les envois Discord sortants (par défaut : `100MB`)
- actions : `actions.*`
- présence : `activity`, `status`, `activityType`, `activityUrl`
- interface : `ui.components.accentColor`
- fonctionnalités : `threadBindings`, `bindings[]` de niveau supérieur (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Sécurité et opérations

- Traitez les jetons de bot comme des secrets (`DISCORD_BOT_TOKEN` préféré dans les environnements supervisés).
- Accordez le minimum d’autorisations Discord nécessaire.
- Si le déploiement/l’état des commandes est obsolète, redémarrez la Gateway et revérifiez avec `openclaw channels status --probe`.

## Liens connexes

- [Appairage](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Routage des canaux](/fr/channels/channel-routing)
- [Sécurité](/fr/gateway/security)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Dépannage](/fr/channels/troubleshooting)
- [Commandes slash](/fr/tools/slash-commands)
