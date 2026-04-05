---
read_when:
    - Travailler sur les fonctionnalités du canal Microsoft Teams
summary: État de prise en charge du bot Microsoft Teams, capacités et configuration
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-05T12:37:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99fc6e136893ec65dc85d3bc0c0d92134069a2f3b8cb4fcf66c14674399b3eaf
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> "Vous qui entrez ici, abandonnez tout espoir."

Mise à jour : 2026-01-21

Statut : le texte + les pièces jointes DM sont pris en charge ; l’envoi de fichiers dans les canaux/groupes nécessite `sharePointSiteId` + les autorisations Graph (voir [Sending files in group chats](#sending-files-in-group-chats)). Les sondages sont envoyés via des Adaptive Cards. Les actions de message exposent `upload-file` explicite pour les envois centrés sur les fichiers.

## Plugin intégré

Microsoft Teams est fourni comme plugin intégré dans les versions actuelles d’OpenClaw, donc
aucune installation séparée n’est requise dans la build empaquetée normale.

Si vous utilisez une ancienne build ou une installation personnalisée qui exclut Teams intégré,
installez-le manuellement :

```bash
openclaw plugins install @openclaw/msteams
```

Extraction locale (lors d’une exécution à partir d’un dépôt git) :

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Détails : [Plugins](/tools/plugin)

## Configuration rapide (débutant)

1. Assurez-vous que le plugin Microsoft Teams est disponible.
   - Les versions empaquetées actuelles d’OpenClaw l’intègrent déjà.
   - Les installations anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Créez un **Azure Bot** (ID d’application + secret client + ID de locataire).
3. Configurez OpenClaw avec ces identifiants.
4. Exposez `/api/messages` (port 3978 par défaut) via une URL publique ou un tunnel.
5. Installez le package d’application Teams et démarrez la gateway.

Configuration minimale :

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Remarque : les discussions de groupe sont bloquées par défaut (`channels.msteams.groupPolicy: "allowlist"`). Pour autoriser les réponses de groupe, définissez `channels.msteams.groupAllowFrom` (ou utilisez `groupPolicy: "open"` pour autoriser n’importe quel membre, avec filtrage par mention).

## Objectifs

- Parler à OpenClaw via des DM, des discussions de groupe ou des canaux Teams.
- Garder un routage déterministe : les réponses reviennent toujours au canal d’où elles proviennent.
- Utiliser par défaut un comportement de canal sûr (mentions requises sauf configuration contraire).

## Écritures de configuration

Par défaut, Microsoft Teams est autorisé à écrire des mises à jour de configuration déclenchées par `/config set|unset` (nécessite `commands.config: true`).

Désactivez-les avec :

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Contrôle d’accès (DM + groupes)

**Accès DM**

- Par défaut : `channels.msteams.dmPolicy = "pairing"`. Les expéditeurs inconnus sont ignorés jusqu’à approbation.
- `channels.msteams.allowFrom` doit utiliser des ID d’objet AAD stables.
- Les UPN/noms d’affichage sont modifiables ; la correspondance directe est désactivée par défaut et n’est activée qu’avec `channels.msteams.dangerouslyAllowNameMatching: true`.
- L’assistant peut résoudre les noms en ID via Microsoft Graph lorsque les identifiants le permettent.

**Accès de groupe**

- Par défaut : `channels.msteams.groupPolicy = "allowlist"` (bloqué tant que vous n’ajoutez pas `groupAllowFrom`). Utilisez `channels.defaults.groupPolicy` pour remplacer la valeur par défaut lorsqu’elle n’est pas définie.
- `channels.msteams.groupAllowFrom` contrôle quels expéditeurs peuvent déclencher l’agent dans les discussions/canaux de groupe (solution de repli vers `channels.msteams.allowFrom`).
- Définissez `groupPolicy: "open"` pour autoriser n’importe quel membre (toujours filtré par mention par défaut).
- Pour n’autoriser **aucun canal**, définissez `channels.msteams.groupPolicy: "disabled"`.

Exemple :

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + liste d’autorisation de canaux**

- Cadrez les réponses de groupe/canal en listant les équipes et les canaux sous `channels.msteams.teams`.
- Les clés doivent utiliser des ID d’équipe stables et des ID de conversation de canal.
- Lorsque `groupPolicy="allowlist"` et qu’une liste d’autorisation d’équipes est présente, seules les équipes/canaux listés sont acceptés (avec filtrage par mention).
- L’assistant de configuration accepte les entrées `Team/Channel` et les enregistre pour vous.
- Au démarrage, OpenClaw résout les noms d’équipes/canaux et les noms d’utilisateurs des listes d’autorisation en ID (lorsque les autorisations Graph le permettent)
  et journalise le mappage ; les noms d’équipes/canaux non résolus sont conservés tels qu’ils ont été saisis mais ignorés pour le routage par défaut, sauf si `channels.msteams.dangerouslyAllowNameMatching: true` est activé.

Exemple :

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## Fonctionnement

1. Assurez-vous que le plugin Microsoft Teams est disponible.
   - Les versions empaquetées actuelles d’OpenClaw l’intègrent déjà.
   - Les installations anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Créez un **Azure Bot** (ID d’application + secret + ID de locataire).
3. Construisez un **package d’application Teams** qui référence le bot et inclut les autorisations RSC ci-dessous.
4. Téléversez/installez l’application Teams dans une équipe (ou dans l’étendue personnelle pour les DM).
5. Configurez `msteams` dans `~/.openclaw/openclaw.json` (ou via des variables d’environnement) et démarrez la gateway.
6. La gateway écoute par défaut le trafic webhook Bot Framework sur `/api/messages`.

## Configuration d’Azure Bot (prérequis)

Avant de configurer OpenClaw, vous devez créer une ressource Azure Bot.

### Étape 1 : créer Azure Bot

1. Accédez à [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Remplissez l’onglet **Basics** :

   | Champ              | Valeur                                                   |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nom de votre bot, par ex. `openclaw-msteams` (doit être unique) |
   | **Subscription**   | Sélectionnez votre abonnement Azure                      |
   | **Resource group** | Créez-en un nouveau ou utilisez un groupe existant       |
   | **Pricing tier**   | **Free** pour le développement/test                      |
   | **Type of App**    | **Single Tenant** (recommandé - voir la note ci-dessous) |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Avis de dépréciation :** la création de nouveaux bots multi-locataires a été dépréciée après le 2025-07-31. Utilisez **Single Tenant** pour les nouveaux bots.

3. Cliquez sur **Review + create** → **Create** (attendez ~1-2 minutes)

### Étape 2 : récupérer les identifiants

1. Accédez à votre ressource Azure Bot → **Configuration**
2. Copiez **Microsoft App ID** → c’est votre `appId`
3. Cliquez sur **Manage Password** → accédez à l’enregistrement d’application
4. Sous **Certificates & secrets** → **New client secret** → copiez la **Value** → c’est votre `appPassword`
5. Accédez à **Overview** → copiez **Directory (tenant) ID** → c’est votre `tenantId`

### Étape 3 : configurer le point de terminaison de messagerie

1. Dans Azure Bot → **Configuration**
2. Définissez **Messaging endpoint** sur votre URL webhook :
   - Production : `https://your-domain.com/api/messages`
   - Développement local : utilisez un tunnel (voir [Local Development](#local-development-tunneling) ci-dessous)

### Étape 4 : activer le canal Teams

1. Dans Azure Bot → **Channels**
2. Cliquez sur **Microsoft Teams** → Configure → Save
3. Acceptez les Conditions d’utilisation

## Développement local (tunneling)

Teams ne peut pas joindre `localhost`. Utilisez un tunnel pour le développement local :

**Option A : ngrok**

```bash
ngrok http 3978
# Copiez l’URL https, par ex. https://abc123.ngrok.io
# Définissez le point de terminaison de messagerie sur : https://abc123.ngrok.io/api/messages
```

**Option B : Tailscale Funnel**

```bash
tailscale funnel 3978
# Utilisez votre URL de funnel Tailscale comme point de terminaison de messagerie
```

## Teams Developer Portal (alternative)

Au lieu de créer manuellement un ZIP de manifeste, vous pouvez utiliser le [Teams Developer Portal](https://dev.teams.microsoft.com/apps) :

1. Cliquez sur **+ New app**
2. Remplissez les informations de base (nom, description, informations développeur)
3. Accédez à **App features** → **Bot**
4. Sélectionnez **Enter a bot ID manually** et collez votre Azure Bot App ID
5. Cochez les étendues : **Personal**, **Team**, **Group Chat**
6. Cliquez sur **Distribute** → **Download app package**
7. Dans Teams : **Apps** → **Manage your apps** → **Upload a custom app** → sélectionnez le ZIP

C’est souvent plus simple que de modifier manuellement des manifestes JSON.

## Tester le bot

**Option A : Azure Web Chat (vérifier d’abord le webhook)**

1. Dans Azure Portal → votre ressource Azure Bot → **Test in Web Chat**
2. Envoyez un message - vous devriez voir une réponse
3. Cela confirme que votre point de terminaison webhook fonctionne avant la configuration Teams

**Option B : Teams (après installation de l’application)**

1. Installez l’application Teams (chargement latéral ou catalogue de l’organisation)
2. Trouvez le bot dans Teams et envoyez un DM
3. Vérifiez les journaux de la gateway pour voir l’activité entrante

## Configuration (texte uniquement minimal)

1. **Assurez-vous que le plugin Microsoft Teams est disponible**
   - Les versions empaquetées actuelles d’OpenClaw l’intègrent déjà.
   - Les installations anciennes/personnalisées peuvent l’ajouter manuellement :
     - Depuis npm : `openclaw plugins install @openclaw/msteams`
     - Depuis une extraction locale : `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Enregistrement du bot**
   - Créez un Azure Bot (voir ci-dessus) et notez :
     - ID d’application
     - Secret client (mot de passe de l’application)
     - ID de locataire (single-tenant)

3. **Manifeste d’application Teams**
   - Incluez une entrée `bot` avec `botId = <App ID>`.
   - Étendues : `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (requis pour la gestion des fichiers dans l’étendue personnelle).
   - Ajoutez les autorisations RSC (ci-dessous).
   - Créez les icônes : `outline.png` (32x32) et `color.png` (192x192).
   - Compressez ensemble les trois fichiers : `manifest.json`, `outline.png`, `color.png`.

4. **Configurer OpenClaw**

   ```json5
   {
     channels: {
       msteams: {
         enabled: true,
         appId: "<APP_ID>",
         appPassword: "<APP_PASSWORD>",
         tenantId: "<TENANT_ID>",
         webhook: { port: 3978, path: "/api/messages" },
       },
     },
   }
   ```

   Vous pouvez aussi utiliser des variables d’environnement au lieu des clés de configuration :
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **Point de terminaison du bot**
   - Définissez le Messaging Endpoint d’Azure Bot sur :
     - `https://<host>:3978/api/messages` (ou votre chemin/port choisi).

6. **Exécuter la gateway**
   - Le canal Teams démarre automatiquement lorsque le plugin intégré ou installé manuellement est disponible et que la configuration `msteams` existe avec les identifiants.

## Action d’informations sur les membres

OpenClaw expose une action `member-info` reposant sur Graph pour Microsoft Teams afin que les agents et automatisations puissent résoudre directement depuis Microsoft Graph les détails des membres d’un canal (nom d’affichage, e-mail, rôle).

Exigences :

- Autorisation RSC `Member.Read.Group` (déjà présente dans le manifeste recommandé)
- Pour les recherches inter-équipes : autorisation d’application Graph `User.Read.All` avec consentement administrateur

L’action est contrôlée par `channels.msteams.actions.memberInfo` (activée par défaut lorsque les identifiants Graph sont disponibles).

## Contexte d’historique

- `channels.msteams.historyLimit` contrôle combien de messages récents de canal/groupe sont encapsulés dans le prompt.
- Utilise `messages.groupChat.historyLimit` comme solution de repli. Définissez `0` pour désactiver (50 par défaut).
- L’historique de fil récupéré est filtré par les listes d’autorisation d’expéditeurs (`allowFrom` / `groupAllowFrom`), de sorte que l’initialisation du contexte du fil n’inclut que les messages d’expéditeurs autorisés.
- Le contexte de pièce jointe citée (`ReplyTo*` dérivé du HTML de réponse Teams) est actuellement transmis tel que reçu.
- En d’autres termes, les listes d’autorisation contrôlent qui peut déclencher l’agent ; seuls certains chemins de contexte complémentaire sont filtrés aujourd’hui.
- L’historique DM peut être limité avec `channels.msteams.dmHistoryLimit` (tours utilisateur). Remplacements par utilisateur : `channels.msteams.dms["<user_id>"].historyLimit`.

## Autorisations RSC Teams actuelles (manifeste)

Ce sont les **autorisations resourceSpecific existantes** dans notre manifeste d’application Teams. Elles ne s’appliquent qu’à l’intérieur de l’équipe/de la discussion où l’application est installée.

**Pour les canaux (étendue équipe) :**

- `ChannelMessage.Read.Group` (Application) - recevoir tous les messages de canal sans @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Pour les discussions de groupe :**

- `ChatMessage.Read.Chat` (Application) - recevoir tous les messages de discussion de groupe sans @mention

## Exemple de manifeste Teams (expurgé)

Exemple minimal et valide avec les champs requis. Remplacez les ID et les URL.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Réserves sur le manifeste (champs indispensables)

- `bots[].botId` **doit** correspondre à l’Azure Bot App ID.
- `webApplicationInfo.id` **doit** correspondre à l’Azure Bot App ID.
- `bots[].scopes` doit inclure les surfaces que vous prévoyez d’utiliser (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` est requis pour la gestion des fichiers dans l’étendue personnelle.
- `authorization.permissions.resourceSpecific` doit inclure la lecture/l’envoi de canaux si vous voulez du trafic de canal.

### Mettre à jour une application existante

Pour mettre à jour une application Teams déjà installée (par exemple, pour ajouter des autorisations RSC) :

1. Mettez à jour votre `manifest.json` avec les nouveaux paramètres
2. **Incrémentez le champ `version`** (par ex. `1.0.0` → `1.1.0`)
3. **Recompressez** le manifeste avec les icônes (`manifest.json`, `outline.png`, `color.png`)
4. Téléversez le nouveau zip :
   - **Option A (Teams Admin Center) :** Teams Admin Center → Teams apps → Manage apps → trouvez votre application → Upload new version
   - **Option B (chargement latéral) :** Dans Teams → Apps → Manage your apps → Upload a custom app
5. **Pour les canaux d’équipe :** réinstallez l’application dans chaque équipe pour que les nouvelles autorisations prennent effet
6. **Quittez complètement et relancez Teams** (pas seulement fermer la fenêtre) pour effacer les métadonnées d’application mises en cache

## Capacités : RSC uniquement vs Graph

### Avec **Teams RSC uniquement** (application installée, sans autorisations API Graph)

Fonctionne :

- Lire le contenu **texte** des messages de canal.
- Envoyer le contenu **texte** des messages de canal.
- Recevoir des pièces jointes de fichiers en **personnel (DM)**.

Ne fonctionne PAS :

- Le contenu **image ou fichier** des canaux/groupes (la charge utile n’inclut qu’un stub HTML).
- Le téléchargement des pièces jointes stockées dans SharePoint/OneDrive.
- La lecture de l’historique des messages (au-delà de l’événement webhook en direct).

### Avec **Teams RSC + autorisations d’application Microsoft Graph**

Ajoute :

- Le téléchargement des contenus hébergés (images collées dans des messages).
- Le téléchargement des pièces jointes de fichiers stockées dans SharePoint/OneDrive.
- La lecture de l’historique des messages de canal/discussion via Graph.

### RSC vs API Graph

| Capacité                | Autorisations RSC    | API Graph                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Messages en temps réel** | Oui (via webhook) | Non (sondage uniquement)            |
| **Messages historiques** | Non                | Oui (peut interroger l’historique)  |
| **Complexité de configuration** | Manifeste d’application uniquement | Nécessite consentement administrateur + flux de jetons |
| **Fonctionne hors ligne** | Non (doit être en cours d’exécution) | Oui (interroger à tout moment) |

**En résumé :** RSC sert à l’écoute en temps réel ; l’API Graph sert à l’accès historique. Pour rattraper les messages manqués hors ligne, vous avez besoin de l’API Graph avec `ChannelMessage.Read.All` (nécessite le consentement administrateur).

## Médias + historique activés par Graph (requis pour les canaux)

Si vous avez besoin d’images/fichiers dans les **canaux** ou si vous voulez récupérer **l’historique des messages**, vous devez activer les autorisations Microsoft Graph et accorder le consentement administrateur.

1. Dans l’**App Registration** Entra ID (Azure AD), ajoutez des **autorisations d’application** Microsoft Graph :
   - `ChannelMessage.Read.All` (pièces jointes de canal + historique)
   - `Chat.Read.All` ou `ChatMessage.Read.All` (discussions de groupe)
2. **Accordez le consentement administrateur** pour le locataire.
3. Incrémentez la **version du manifeste** de l’application Teams, téléversez-la de nouveau, puis **réinstallez l’application dans Teams**.
4. **Quittez complètement et relancez Teams** pour effacer les métadonnées d’application mises en cache.

**Autorisation supplémentaire pour les mentions utilisateur :** les @mentions utilisateur fonctionnent immédiatement pour les utilisateurs présents dans la conversation. En revanche, si vous voulez rechercher dynamiquement et mentionner des utilisateurs qui **ne sont pas dans la conversation actuelle**, ajoutez l’autorisation `User.Read.All` (Application) et accordez le consentement administrateur.

## Limitations connues

### Délais d’attente des webhooks

Teams transmet les messages via un webhook HTTP. Si le traitement prend trop de temps (par ex. réponses LLM lentes), vous pouvez voir :

- Des délais d’attente gateway
- Des nouvelles tentatives Teams sur le message (provoquant des doublons)
- Des réponses perdues

OpenClaw gère cela en renvoyant rapidement puis en envoyant les réponses de manière proactive, mais des réponses très lentes peuvent toujours poser problème.

### Mise en forme

Le markdown Teams est plus limité que celui de Slack ou Discord :

- La mise en forme de base fonctionne : **gras**, _italique_, `code`, liens
- Le markdown complexe (tableaux, listes imbriquées) peut ne pas être rendu correctement
- Les Adaptive Cards sont prises en charge pour les sondages et les envois arbitraires de cartes (voir ci-dessous)

## Configuration

Paramètres clés (voir `/gateway/configuration` pour les modèles de canal partagés) :

- `channels.msteams.enabled` : activer/désactiver le canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId` : identifiants du bot.
- `channels.msteams.webhook.port` (par défaut `3978`)
- `channels.msteams.webhook.path` (par défaut `/api/messages`)
- `channels.msteams.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : pairing)
- `channels.msteams.allowFrom` : liste d’autorisation DM (ID d’objet AAD recommandés). L’assistant résout les noms en ID pendant la configuration lorsque l’accès Graph est disponible.
- `channels.msteams.dangerouslyAllowNameMatching` : interrupteur de secours pour réactiver la correspondance sur UPN/nom d’affichage modifiables et le routage direct par nom d’équipe/canal.
- `channels.msteams.textChunkLimit` : taille des blocs de texte sortants.
- `channels.msteams.chunkMode` : `length` (par défaut) ou `newline` pour découper sur les lignes vides (limites de paragraphe) avant le découpage par longueur.
- `channels.msteams.mediaAllowHosts` : liste d’autorisation des hôtes pour les pièces jointes entrantes (par défaut, domaines Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts` : liste d’autorisation pour joindre des en-têtes Authorization lors des nouvelles tentatives sur des médias (par défaut, hôtes Graph + Bot Framework).
- `channels.msteams.requireMention` : exiger une @mention dans les canaux/groupes (true par défaut).
- `channels.msteams.replyStyle` : `thread | top-level` (voir [Reply Style](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle` : remplacement par équipe.
- `channels.msteams.teams.<teamId>.requireMention` : remplacement par équipe.
- `channels.msteams.teams.<teamId>.tools` : remplacements de politique d’outils par défaut par équipe (`allow`/`deny`/`alsoAllow`) utilisés lorsqu’un remplacement de canal est absent.
- `channels.msteams.teams.<teamId>.toolsBySender` : remplacements de politique d’outils par équipe et par expéditeur (`"*"` pris en charge).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle` : remplacement par canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention` : remplacement par canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools` : remplacements de politique d’outils par canal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender` : remplacements de politique d’outils par canal et par expéditeur (`"*"` pris en charge).
- Les clés `toolsBySender` doivent utiliser des préfixes explicites :
  `id:`, `e164:`, `username:`, `name:` (les anciennes clés sans préfixe sont toujours mappées uniquement à `id:`).
- `channels.msteams.actions.memberInfo` : activer ou désactiver l’action d’informations sur les membres reposant sur Graph (activée par défaut lorsque les identifiants Graph sont disponibles).
- `channels.msteams.sharePointSiteId` : ID du site SharePoint pour les téléversements de fichiers dans les discussions/canaux de groupe (voir [Sending files in group chats](#sending-files-in-group-chats)).

## Routage et sessions

- Les clés de session suivent le format d’agent standard (voir [/concepts/session](/concepts/session)) :
  - Les messages directs partagent la session principale (`agent:<agentId>:<mainKey>`).
  - Les messages de canal/groupe utilisent l’ID de conversation :
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Style de réponse : fils vs publications

Teams a récemment introduit deux styles d’interface de canal sur le même modèle de données sous-jacent :

| Style                    | Description                                               | `replyStyle` recommandé |
| ------------------------ | --------------------------------------------------------- | ----------------------- |
| **Posts** (classique)    | Les messages apparaissent comme des cartes avec des réponses en fil dessous | `thread` (par défaut)   |
| **Threads** (type Slack) | Les messages s’enchaînent linéairement, davantage comme Slack | `top-level`             |

**Le problème :** l’API Teams n’expose pas le style d’interface utilisé par un canal. Si vous utilisez le mauvais `replyStyle` :

- `thread` dans un canal de style Threads → les réponses apparaissent imbriquées de manière maladroite
- `top-level` dans un canal de style Posts → les réponses apparaissent comme des publications de niveau supérieur séparées au lieu d’être dans le fil

**Solution :** configurez `replyStyle` par canal en fonction de la manière dont le canal est configuré :

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## Pièces jointes et images

**Limitations actuelles :**

- **DM :** les images et pièces jointes de fichiers fonctionnent via les API de fichiers du bot Teams.
- **Canaux/groupes :** les pièces jointes résident dans le stockage M365 (SharePoint/OneDrive). La charge utile webhook n’inclut qu’un stub HTML, pas les octets réels du fichier. **Les autorisations API Graph sont requises** pour télécharger les pièces jointes de canal.
- Pour les envois explicites centrés sur les fichiers, utilisez `action=upload-file` avec `media` / `filePath` / `path` ; `message` facultatif devient le texte/commentaire d’accompagnement, et `filename` remplace le nom téléversé.

Sans autorisations Graph, les messages de canal avec images seront reçus en texte seul (le contenu de l’image n’est pas accessible au bot).
Par défaut, OpenClaw ne télécharge les médias qu’à partir de noms d’hôte Microsoft/Teams. Remplacez ce comportement avec `channels.msteams.mediaAllowHosts` (utilisez `["*"]` pour autoriser n’importe quel hôte).
Les en-têtes Authorization ne sont joints que pour les hôtes dans `channels.msteams.mediaAuthAllowHosts` (par défaut, hôtes Graph + Bot Framework). Gardez cette liste stricte (évitez les suffixes multi-locataires).

## Sending files in group chats

Les bots peuvent envoyer des fichiers dans les DM en utilisant le flux FileConsentCard (intégré). En revanche, **l’envoi de fichiers dans les discussions/canaux de groupe** nécessite une configuration supplémentaire :

| Contexte                 | Mode d’envoi des fichiers                  | Configuration requise                              |
| ------------------------ | ------------------------------------------ | -------------------------------------------------- |
| **DM**                   | FileConsentCard → l’utilisateur accepte → le bot téléverse | Fonctionne immédiatement                           |
| **Discussions/canaux de groupe** | Téléversement vers SharePoint → lien de partage | Nécessite `sharePointSiteId` + autorisations Graph |
| **Images (tout contexte)** | Inline encodé en Base64                  | Fonctionne immédiatement                           |

### Pourquoi les discussions de groupe ont besoin de SharePoint

Les bots n’ont pas de lecteur OneDrive personnel (le point de terminaison API Graph `/me/drive` ne fonctionne pas pour les identités d’application). Pour envoyer des fichiers dans des discussions/canaux de groupe, le bot téléverse vers un **site SharePoint** et crée un lien de partage.

### Configuration

1. **Ajoutez des autorisations API Graph** dans Entra ID (Azure AD) → App Registration :
   - `Sites.ReadWrite.All` (Application) - téléverser des fichiers vers SharePoint
   - `Chat.Read.All` (Application) - facultatif, active les liens de partage par utilisateur

2. **Accordez le consentement administrateur** pour le locataire.

3. **Récupérez l’ID de votre site SharePoint :**

   ```bash
   # Via Graph Explorer ou curl avec un jeton valide :
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Exemple : pour un site à "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # La réponse inclut : "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Configurez OpenClaw :**

   ```json5
   {
     channels: {
       msteams: {
         // ... autre configuration ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Comportement de partage

| Autorisation                              | Comportement de partage                                  |
| ----------------------------------------- | -------------------------------------------------------- |
| `Sites.ReadWrite.All` uniquement          | Lien de partage à l’échelle de l’organisation (toute personne de l’organisation peut y accéder) |
| `Sites.ReadWrite.All` + `Chat.Read.All`   | Lien de partage par utilisateur (seuls les membres de la discussion peuvent y accéder) |

Le partage par utilisateur est plus sûr, car seuls les participants à la discussion peuvent accéder au fichier. Si l’autorisation `Chat.Read.All` est absente, le bot revient à un partage à l’échelle de l’organisation.

### Comportement de repli

| Scénario                                          | Résultat                                           |
| ------------------------------------------------- | -------------------------------------------------- |
| Discussion de groupe + fichier + `sharePointSiteId` configuré | Téléverser vers SharePoint, envoyer le lien de partage |
| Discussion de groupe + fichier + pas de `sharePointSiteId` | Tenter un téléversement OneDrive (peut échouer), envoyer uniquement du texte |
| Discussion personnelle + fichier                  | Flux FileConsentCard (fonctionne sans SharePoint)  |
| Tout contexte + image                             | Inline encodé en Base64 (fonctionne sans SharePoint) |

### Emplacement de stockage des fichiers

Les fichiers téléversés sont stockés dans un dossier `/OpenClawShared/` de la bibliothèque de documents par défaut du site SharePoint configuré.

## Sondages (Adaptive Cards)

OpenClaw envoie les sondages Teams sous forme d’Adaptive Cards (il n’existe pas d’API de sondage Teams native).

- CLI : `openclaw message poll --channel msteams --target conversation:<id> ...`
- Les votes sont enregistrés par la gateway dans `~/.openclaw/msteams-polls.json`.
- La gateway doit rester en ligne pour enregistrer les votes.
- Les sondages ne publient pas encore automatiquement de résumés de résultats (inspectez le fichier de stockage si nécessaire).

## Adaptive Cards (arbitraires)

Envoyez n’importe quel JSON Adaptive Card à des utilisateurs ou conversations Teams à l’aide de l’outil `message` ou de la CLI.

Le paramètre `card` accepte un objet JSON Adaptive Card. Lorsque `card` est fourni, le texte du message est facultatif.

**Outil d’agent :**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello!" }],
  },
}
```

**CLI :**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello!"}]}'
```

Consultez la [documentation Adaptive Cards](https://adaptivecards.io/) pour le schéma de carte et des exemples. Pour les détails du format cible, voir [Target formats](#target-formats) ci-dessous.

## Formats cibles

Les cibles MSTeams utilisent des préfixes pour distinguer les utilisateurs des conversations :

| Type de cible          | Format                           | Exemple                                             |
| ---------------------- | -------------------------------- | --------------------------------------------------- |
| Utilisateur (par ID)   | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Utilisateur (par nom)  | `user:<display-name>`            | `user:John Smith` (nécessite l’API Graph)          |
| Groupe/canal           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| Groupe/canal (brut)    | `<conversation-id>`              | `19:abc123...@thread.tacv2` (si contient `@thread`) |

**Exemples CLI :**

```bash
# Envoyer à un utilisateur par ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Envoyer à un utilisateur par nom d’affichage (déclenche une recherche API Graph)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Envoyer à une discussion de groupe ou à un canal
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Envoyer une Adaptive Card à une conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello"}]}'
```

**Exemples d’outils d’agent :**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello" }],
  },
}
```

Remarque : sans le préfixe `user:`, les noms sont interprétés par défaut comme une résolution de groupe/équipe. Utilisez toujours `user:` lorsque vous ciblez des personnes par nom d’affichage.

## Messagerie proactive

- Les messages proactifs ne sont possibles **qu’après** une interaction d’un utilisateur, car nous stockons alors les références de conversation.
- Voir `/gateway/configuration` pour `dmPolicy` et le filtrage par liste d’autorisation.

## ID d’équipe et de canal (piège courant)

Le paramètre de requête `groupId` dans les URL Teams n’est **PAS** l’ID d’équipe utilisé pour la configuration. Extrayez plutôt les ID du chemin de l’URL :

**URL d’équipe :**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID d’équipe (décoder l’URL)
```

**URL de canal :**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID de canal (décoder l’URL)
```

**Pour la configuration :**

- ID d’équipe = segment de chemin après `/team/` (décodé de l’URL, par ex. `19:Bk4j...@thread.tacv2`)
- ID de canal = segment de chemin après `/channel/` (décodé de l’URL)
- **Ignorez** le paramètre de requête `groupId`

## Canaux privés

Les bots ont une prise en charge limitée dans les canaux privés :

| Fonctionnalité               | Canaux standard | Canaux privés         |
| ---------------------------- | --------------- | --------------------- |
| Installation du bot          | Oui             | Limitée               |
| Messages en temps réel (webhook) | Oui         | Peut ne pas fonctionner |
| Autorisations RSC            | Oui             | Peuvent se comporter différemment |
| @mentions                    | Oui             | Si le bot est accessible |
| Historique API Graph         | Oui             | Oui (avec autorisations) |

**Solutions de contournement si les canaux privés ne fonctionnent pas :**

1. Utilisez des canaux standard pour les interactions avec le bot
2. Utilisez les DM - les utilisateurs peuvent toujours envoyer directement un message au bot
3. Utilisez l’API Graph pour l’accès historique (nécessite `ChannelMessage.Read.All`)

## Dépannage

### Problèmes courants

- **Les images ne s’affichent pas dans les canaux :** autorisations Graph ou consentement administrateur manquants. Réinstallez l’application Teams et quittez/rouvrez complètement Teams.
- **Aucune réponse dans le canal :** les mentions sont requises par défaut ; définissez `channels.msteams.requireMention=false` ou configurez cela par équipe/canal.
- **Incohérence de version (Teams affiche toujours l’ancien manifeste) :** supprimez puis réajoutez l’application et quittez complètement Teams pour actualiser.
- **401 Unauthorized depuis le webhook :** attendu lors d’un test manuel sans JWT Azure - cela signifie que le point de terminaison est joignable mais que l’authentification a échoué. Utilisez Azure Web Chat pour tester correctement.

### Erreurs de téléversement du manifeste

- **"Icon file cannot be empty" :** le manifeste référence des fichiers d’icône de 0 octet. Créez des icônes PNG valides (32x32 pour `outline.png`, 192x192 pour `color.png`).
- **"webApplicationInfo.Id already in use" :** l’application est encore installée dans une autre équipe/discussion. Trouvez-la et désinstallez-la d’abord, ou attendez 5-10 minutes pour la propagation.
- **"Something went wrong" lors du téléversement :** téléversez plutôt via [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), ouvrez les outils de développement du navigateur (F12) → onglet Network, puis vérifiez le corps de la réponse pour l’erreur réelle.
- **Échec du chargement latéral :** essayez "Upload an app to your org's app catalog" au lieu de "Upload a custom app" - cela contourne souvent les restrictions de chargement latéral.

### Les autorisations RSC ne fonctionnent pas

1. Vérifiez que `webApplicationInfo.id` correspond exactement à l’App ID de votre bot
2. Téléversez à nouveau l’application et réinstallez-la dans l’équipe/la discussion
3. Vérifiez si l’administrateur de votre organisation a bloqué les autorisations RSC
4. Confirmez que vous utilisez la bonne étendue : `ChannelMessage.Read.Group` pour les équipes, `ChatMessage.Read.Chat` pour les discussions de groupe

## Références

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guide de configuration Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - créer/gérer des applications Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema) - schéma du manifeste d’application Teams
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc) - recevoir les messages de canal avec RSC
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) - référence des autorisations RSC
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/groupe nécessite Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Liens associés

- [Channels Overview](/channels) — tous les canaux pris en charge
- [Pairing](/channels/pairing) — authentification DM et flux de pairing
- [Groups](/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Channel Routing](/channels/channel-routing) — routage de session pour les messages
- [Security](/gateway/security) — modèle d’accès et durcissement
