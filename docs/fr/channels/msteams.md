---
read_when:
    - Travailler sur les fonctionnalités du canal Microsoft Teams
summary: Statut de prise en charge des bots Microsoft Teams, fonctionnalités et configuration
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-24T07:00:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba01e831382d31a3787b94d1c882d911c91c0f43d2aff84fd4ac5041423a08ac
    source_path: channels/msteams.md
    workflow: 15
---

La prise en charge du texte et des pièces jointes en DM est assurée ; l’envoi de fichiers dans les canaux et les groupes nécessite `sharePointSiteId` + les autorisations Graph (voir [Envoi de fichiers dans les discussions de groupe](#sending-files-in-group-chats)). Les sondages sont envoyés via des cartes adaptatives. Les actions de message exposent `upload-file` explicite pour les envois centrés sur les fichiers.

## Plugin intégré

Microsoft Teams est livré sous forme de Plugin intégré dans les versions actuelles d’OpenClaw, donc
aucune installation séparée n’est requise dans la version packagée normale.

Si vous utilisez une version plus ancienne ou une installation personnalisée qui exclut Teams intégré,
installez-le manuellement :

```bash
openclaw plugins install @openclaw/msteams
```

Copie locale (lors d’une exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide (débutant)

1. Assurez-vous que le Plugin Microsoft Teams est disponible.
   - Les versions packagées actuelles d’OpenClaw l’intègrent déjà.
   - Les installations plus anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Créez un **Azure Bot** (ID d’application + secret client + ID de locataire).
3. Configurez OpenClaw avec ces identifiants.
4. Exposez `/api/messages` (port 3978 par défaut) via une URL publique ou un tunnel.
5. Installez le package d’application Teams et démarrez le Gateway.

Configuration minimale (secret client) :

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

Pour les déploiements en production, envisagez d’utiliser [l’authentification fédérée](#federated-authentication) (certificat ou identité managée) au lieu des secrets clients.

Remarque : les discussions de groupe sont bloquées par défaut (`channels.msteams.groupPolicy: "allowlist"`). Pour autoriser les réponses de groupe, définissez `channels.msteams.groupAllowFrom` (ou utilisez `groupPolicy: "open"` pour autoriser n’importe quel membre, avec obligation de mention).

## Écritures de configuration

Par défaut, Microsoft Teams est autorisé à écrire des mises à jour de configuration déclenchées par `/config set|unset` (nécessite `commands.config: true`).

Désactivez avec :

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Contrôle d’accès (DM + groupes)

**Accès DM**

- Par défaut : `channels.msteams.dmPolicy = "pairing"`. Les expéditeurs inconnus sont ignorés jusqu’à approbation.
- `channels.msteams.allowFrom` doit utiliser des ID d’objet AAD stables.
- Ne vous fiez pas à la correspondance UPN/nom d’affichage pour les listes d’autorisation — ils peuvent changer. OpenClaw désactive par défaut la correspondance directe par nom ; activez-la explicitement avec `channels.msteams.dangerouslyAllowNameMatching: true`.
- L’assistant peut résoudre les noms en ID via Microsoft Graph lorsque les identifiants le permettent.

**Accès groupe**

- Par défaut : `channels.msteams.groupPolicy = "allowlist"` (bloqué tant que vous n’ajoutez pas `groupAllowFrom`). Utilisez `channels.defaults.groupPolicy` pour remplacer la valeur par défaut lorsqu’elle n’est pas définie.
- `channels.msteams.groupAllowFrom` contrôle quels expéditeurs peuvent déclencher des réponses dans les discussions/canaux de groupe (revient à `channels.msteams.allowFrom`).
- Définissez `groupPolicy: "open"` pour autoriser n’importe quel membre (toujours avec obligation de mention par défaut).
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

**Teams + liste d’autorisation des canaux**

- Limitez les réponses de groupe/canal en listant les équipes et les canaux sous `channels.msteams.teams`.
- Les clés doivent utiliser des ID d’équipe stables et des ID de conversation de canal.
- Lorsque `groupPolicy="allowlist"` et qu’une liste d’autorisation d’équipes est présente, seules les équipes/canaux listés sont acceptés (avec obligation de mention).
- L’assistant de configuration accepte des entrées `Équipe/Canal` et les enregistre pour vous.
- Au démarrage, OpenClaw résout les noms d’équipe/canal et de liste d’autorisation utilisateur en ID (lorsque les autorisations Graph le permettent)
  et journalise le mappage ; les noms d’équipe/canal non résolus sont conservés tels que saisis mais ignorés pour le routage par défaut, sauf si `channels.msteams.dangerouslyAllowNameMatching: true` est activé.

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

## Configuration Azure Bot

Avant de configurer OpenClaw, créez une ressource Azure Bot et récupérez ses identifiants.

<Steps>
  <Step title="Créer l’Azure Bot">
    Accédez à [Créer Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) et remplissez l’onglet **Basics** :

    | Champ              | Valeur                                                   |
    | ------------------ | -------------------------------------------------------- |
    | **Bot handle**     | Le nom de votre bot, par ex. `openclaw-msteams` (doit être unique) |
    | **Subscription**   | Votre abonnement Azure                                   |
    | **Resource group** | Créez-en un nouveau ou utilisez un existant              |
    | **Pricing tier**   | **Free** pour le développement/test                      |
    | **Type of App**    | **Single Tenant** (recommandé)                           |
    | **Creation type**  | **Create new Microsoft App ID**                          |

    <Note>
    Les nouveaux bots multi-locataires ont été dépréciés après le 2025-07-31. Utilisez **Single Tenant** pour les nouveaux bots.
    </Note>

    Cliquez sur **Review + create** → **Create** (attendez ~1-2 minutes).

  </Step>

  <Step title="Récupérer les identifiants">
    Depuis la ressource Azure Bot → **Configuration** :

    - copiez **Microsoft App ID** → `appId`
    - **Manage Password** → **Certificates & secrets** → **New client secret** → copiez la valeur → `appPassword`
    - **Overview** → **Directory (tenant) ID** → `tenantId`

  </Step>

  <Step title="Configurer le point de terminaison de messagerie">
    Azure Bot → **Configuration** → définissez **Messaging endpoint** :

    - Production : `https://your-domain.com/api/messages`
    - Développement local : utilisez un tunnel (voir [Développement local](#local-development-tunneling))

  </Step>

  <Step title="Activer le canal Teams">
    Azure Bot → **Channels** → cliquez sur **Microsoft Teams** → Configure → Save. Acceptez les conditions d’utilisation.
  </Step>
</Steps>

## Authentification fédérée

> Ajouté dans 2026.3.24

Pour les déploiements en production, OpenClaw prend en charge **l’authentification fédérée** comme alternative plus sécurisée aux secrets clients. Deux méthodes sont disponibles :

### Option A : authentification basée sur un certificat

Utilisez un certificat PEM enregistré avec votre enregistrement d’application Entra ID.

**Configuration :**

1. Générez ou obtenez un certificat (format PEM avec clé privée).
2. Dans Entra ID → App Registration → **Certificates & secrets** → **Certificates** → téléversez le certificat public.

**Config :**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Variables d’environnement :**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Option B : identité managée Azure

Utilisez Azure Managed Identity pour une authentification sans mot de passe. C’est idéal pour les déploiements sur l’infrastructure Azure (AKS, App Service, machines virtuelles Azure) lorsqu’une identité managée est disponible.

**Fonctionnement :**

1. Le pod/VM du bot dispose d’une identité managée (attribuée par le système ou par l’utilisateur).
2. Un **identifiant d’identité fédérée** relie l’identité managée à l’enregistrement d’application Entra ID.
3. À l’exécution, OpenClaw utilise `@azure/identity` pour acquérir des jetons depuis le point de terminaison Azure IMDS (`169.254.169.254`).
4. Le jeton est transmis au SDK Teams pour l’authentification du bot.

**Prérequis :**

- Infrastructure Azure avec identité managée activée (AKS workload identity, App Service, VM)
- Identifiant d’identité fédérée créé sur l’enregistrement d’application Entra ID
- Accès réseau à IMDS (`169.254.169.254:80`) depuis le pod/VM

**Config (identité managée attribuée par le système) :**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Config (identité managée attribuée par l’utilisateur) :**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Variables d’environnement :**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (uniquement pour une identité attribuée par l’utilisateur)

### Configuration d’AKS workload identity

Pour les déploiements AKS utilisant workload identity :

1. **Activez workload identity** sur votre cluster AKS.
2. **Créez un identifiant d’identité fédérée** sur l’enregistrement d’application Entra ID :

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Annotez le compte de service Kubernetes** avec l’ID client de l’application :

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Ajoutez un label au pod** pour l’injection workload identity :

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Assurez l’accès réseau** à IMDS (`169.254.169.254`) — si vous utilisez NetworkPolicy, ajoutez une règle de sortie autorisant le trafic vers `169.254.169.254/32` sur le port 80.

### Comparaison des types d’authentification

| Méthode              | Config                                         | Avantages                          | Inconvénients                          |
| -------------------- | ---------------------------------------------- | ---------------------------------- | -------------------------------------- |
| **Secret client**    | `appPassword`                                  | Configuration simple               | Rotation du secret requise, moins sécurisé |
| **Certificat**       | `authType: "federated"` + `certificatePath`    | Pas de secret partagé sur le réseau | Surcharge de gestion des certificats   |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Sans mot de passe, aucun secret à gérer | Infrastructure Azure requise       |

**Comportement par défaut :** lorsque `authType` n’est pas défini, OpenClaw utilise par défaut l’authentification par secret client. Les configurations existantes continuent de fonctionner sans modification.

## Développement local (tunnel)

Teams ne peut pas atteindre `localhost`. Utilisez un tunnel pour le développement local :

**Option A : ngrok**

```bash
ngrok http 3978
# Copiez l'URL https, par ex. https://abc123.ngrok.io
# Définissez le point de terminaison de messagerie sur : https://abc123.ngrok.io/api/messages
```

**Option B : Tailscale Funnel**

```bash
tailscale funnel 3978
# Utilisez votre URL Tailscale funnel comme point de terminaison de messagerie
```

## Teams Developer Portal (alternative)

Au lieu de créer manuellement un ZIP de manifeste, vous pouvez utiliser le [Teams Developer Portal](https://dev.teams.microsoft.com/apps) :

1. Cliquez sur **+ New app**
2. Renseignez les informations de base (nom, description, informations développeur)
3. Allez dans **App features** → **Bot**
4. Sélectionnez **Enter a bot ID manually** et collez votre App ID Azure Bot
5. Cochez les portées : **Personal**, **Team**, **Group Chat**
6. Cliquez sur **Distribute** → **Download app package**
7. Dans Teams : **Apps** → **Manage your apps** → **Upload a custom app** → sélectionnez le ZIP

C’est souvent plus simple que de modifier manuellement des manifestes JSON.

## Tester le bot

**Option A : Azure Web Chat (vérifier d’abord le Webhook)**

1. Dans le portail Azure → votre ressource Azure Bot → **Test in Web Chat**
2. Envoyez un message — vous devriez voir une réponse
3. Cela confirme que votre point de terminaison Webhook fonctionne avant la configuration Teams

**Option B : Teams (après l’installation de l’application)**

1. Installez l’application Teams (chargement latéral ou catalogue de l’organisation)
2. Trouvez le bot dans Teams et envoyez un DM
3. Vérifiez les journaux du Gateway pour l’activité entrante

<Accordion title="Remplacements par variables d’environnement">

N’importe laquelle des clés de configuration du bot/de l’authentification peut aussi être définie via des variables d’environnement :

- `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (`"secret"` ou `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH`, `MSTEAMS_CERTIFICATE_THUMBPRINT` (fédérée + certificat)
- `MSTEAMS_USE_MANAGED_IDENTITY`, `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (fédérée + identité managée ; ID client uniquement pour une identité attribuée par l’utilisateur)

</Accordion>

## Action d’informations sur les membres

OpenClaw expose une action `member-info` adossée à Graph pour Microsoft Teams afin que les agents et les automatisations puissent résoudre directement depuis Microsoft Graph les détails des membres d’un canal (nom d’affichage, e-mail, rôle).

Exigences :

- Autorisation RSC `Member.Read.Group` (déjà présente dans le manifeste recommandé)
- Pour les recherches inter-équipes : autorisation d’application Graph `User.Read.All` avec consentement administrateur

L’action est contrôlée par `channels.msteams.actions.memberInfo` (par défaut : activée lorsque des identifiants Graph sont disponibles).

## Contexte d’historique

- `channels.msteams.historyLimit` contrôle combien de messages récents de canal/groupe sont intégrés dans le prompt.
- Revient à `messages.groupChat.historyLimit`. Définissez `0` pour désactiver (50 par défaut).
- L’historique de fil récupéré est filtré par les listes d’autorisation d’expéditeur (`allowFrom` / `groupAllowFrom`), donc l’initialisation du contexte de fil n’inclut que les messages des expéditeurs autorisés.
- Le contexte de pièce jointe citée (`ReplyTo*` dérivé du HTML de réponse Teams) est actuellement transmis tel que reçu.
- En d’autres termes, les listes d’autorisation contrôlent qui peut déclencher l’agent ; aujourd’hui, seuls certains chemins de contexte supplémentaire sont filtrés.
- L’historique des DM peut être limité avec `channels.msteams.dmHistoryLimit` (tours utilisateur). Remplacements par utilisateur : `channels.msteams.dms["<user_id>"].historyLimit`.

## Autorisations RSC Teams actuelles

Voici les **autorisations resourceSpecific existantes** dans le manifeste de notre application Teams. Elles s’appliquent uniquement à l’intérieur de l’équipe/chat où l’application est installée.

**Pour les canaux (portée équipe) :**

- `ChannelMessage.Read.Group` (Application) - recevoir tous les messages de canal sans @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Pour les discussions de groupe :**

- `ChatMessage.Read.Chat` (Application) - recevoir tous les messages de discussion de groupe sans @mention

## Exemple de manifeste Teams

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

- `bots[].botId` **doit** correspondre à l’ID d’application Azure Bot.
- `webApplicationInfo.id` **doit** correspondre à l’ID d’application Azure Bot.
- `bots[].scopes` doit inclure les surfaces que vous prévoyez d’utiliser (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` est requis pour la gestion des fichiers en portée personnelle.
- `authorization.permissions.resourceSpecific` doit inclure la lecture/l’envoi de canal si vous voulez le trafic de canal.

### Mise à jour d’une application existante

Pour mettre à jour une application Teams déjà installée (par exemple pour ajouter des autorisations RSC) :

1. Mettez à jour votre `manifest.json` avec les nouveaux paramètres
2. **Incrémentez le champ `version`** (par ex. `1.0.0` → `1.1.0`)
3. **Recréez l’archive zip** du manifeste avec les icônes (`manifest.json`, `outline.png`, `color.png`)
4. Téléversez le nouveau zip :
   - **Option A (Centre d’administration Teams) :** Centre d’administration Teams → Applications Teams → Gérer les applications → trouvez votre application → Téléverser une nouvelle version
   - **Option B (chargement latéral) :** Dans Teams → Applications → Gérer vos applications → Téléverser une application personnalisée
5. **Pour les canaux d’équipe :** réinstallez l’application dans chaque équipe pour que les nouvelles autorisations prennent effet
6. **Quittez complètement puis relancez Teams** (pas seulement fermer la fenêtre) pour effacer les métadonnées d’application mises en cache

## Capacités : RSC uniquement vs Graph

### Teams RSC uniquement (sans autorisations API Graph)

Fonctionne :

- Lire le contenu **texte** des messages de canal.
- Envoyer le contenu **texte** des messages de canal.
- Recevoir les pièces jointes de fichiers en **personnel (DM)**.

Ne fonctionne PAS :

- Le contenu des **images ou fichiers** de canal/groupe (la charge utile inclut seulement un stub HTML).
- Le téléchargement des pièces jointes stockées dans SharePoint/OneDrive.
- La lecture de l’historique des messages (au-delà de l’événement Webhook en direct).

### Teams RSC plus autorisations d’application Microsoft Graph

Ajoute :

- Le téléchargement des contenus hébergés (images collées dans les messages).
- Le téléchargement des pièces jointes de fichiers stockées dans SharePoint/OneDrive.
- La lecture de l’historique des messages de canal/chat via Graph.

### RSC vs API Graph

| Capacité                | Autorisations RSC    | API Graph                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Messages en temps réel** | Oui (via Webhook) | Non (interrogation uniquement)      |
| **Messages historiques** | Non                | Oui (peut interroger l’historique)  |
| **Complexité de configuration** | Manifeste d’application uniquement | Nécessite consentement administrateur + flux de jeton |
| **Fonctionne hors ligne** | Non (doit être en cours d’exécution) | Oui (interrogeable à tout moment) |

**En bref :** RSC sert à l’écoute en temps réel ; l’API Graph sert à l’accès historique. Pour rattraper les messages manqués hors ligne, vous avez besoin de l’API Graph avec `ChannelMessage.Read.All` (nécessite un consentement administrateur).

## Médias + historique avec Graph (requis pour les canaux)

Si vous avez besoin d’images/fichiers dans les **canaux** ou si vous voulez récupérer **l’historique des messages**, vous devez activer les autorisations Microsoft Graph et accorder le consentement administrateur.

1. Dans **App Registration** Entra ID (Azure AD), ajoutez des **autorisations d’application** Microsoft Graph :
   - `ChannelMessage.Read.All` (pièces jointes de canal + historique)
   - `Chat.Read.All` ou `ChatMessage.Read.All` (discussions de groupe)
2. **Accordez le consentement administrateur** pour le locataire.
3. Incrémentez la **version du manifeste** de l’application Teams, retéléversez-la, puis **réinstallez l’application dans Teams**.
4. **Quittez complètement puis relancez Teams** pour effacer les métadonnées d’application mises en cache.

**Autorisation supplémentaire pour les mentions utilisateur :** les @mentions d’utilisateurs fonctionnent immédiatement pour les utilisateurs présents dans la conversation. En revanche, si vous souhaitez rechercher dynamiquement et mentionner des utilisateurs qui **ne sont pas dans la conversation actuelle**, ajoutez l’autorisation d’application `User.Read.All` et accordez le consentement administrateur.

## Limites connues

### Délais d’attente du Webhook

Teams livre les messages via un Webhook HTTP. Si le traitement prend trop de temps (par exemple des réponses LLM lentes), vous pouvez observer :

- Des délais d’attente du Gateway
- Des tentatives de réessai du message par Teams (provoquant des doublons)
- Des réponses perdues

OpenClaw gère cela en renvoyant rapidement une réponse et en envoyant les réponses de manière proactive, mais des réponses très lentes peuvent quand même provoquer des problèmes.

### Mise en forme

Le markdown Teams est plus limité que celui de Slack ou Discord :

- La mise en forme de base fonctionne : **gras**, _italique_, `code`, liens
- Le markdown complexe (tableaux, listes imbriquées) peut ne pas être rendu correctement
- Les cartes adaptatives sont prises en charge pour les sondages et les envois de présentation sémantique (voir ci-dessous)

## Configuration

Paramètres groupés (voir `/gateway/configuration` pour les modèles partagés entre canaux).

<AccordionGroup>
  <Accordion title="Noyau et webhook">
    - `channels.msteams.enabled`
    - `channels.msteams.appId`, `appPassword`, `tenantId` : identifiants du bot
    - `channels.msteams.webhook.port` (par défaut `3978`)
    - `channels.msteams.webhook.path` (par défaut `/api/messages`)
  </Accordion>

  <Accordion title="Authentification">
    - `authType` : `"secret"` (par défaut) ou `"federated"`
    - `certificatePath`, `certificateThumbprint` : authentification fédérée + certificat (thumbprint facultatif)
    - `useManagedIdentity`, `managedIdentityClientId` : authentification fédérée + identité managée
  </Accordion>

  <Accordion title="Contrôle d’accès">
    - `dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : pairing)
    - `allowFrom` : liste d’autorisation DM, privilégiez les ID d’objet AAD ; l’assistant résout les noms lorsque l’accès Graph est disponible
    - `dangerouslyAllowNameMatching` : solution de dernier recours pour le routage mutable par UPN/nom d’affichage et nom d’équipe/canal
    - `requireMention` : exiger une @mention dans les canaux/groupes (par défaut `true`)
  </Accordion>

  <Accordion title="Remplacements pour équipes et canaux">
    Tous ces paramètres remplacent les valeurs par défaut de premier niveau :

    - `teams.<teamId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.tools`, `.toolsBySender` : valeurs par défaut de politique d’outils par équipe
    - `teams.<teamId>.channels.<conversationId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.channels.<conversationId>.tools`, `.toolsBySender`

    Les clés `toolsBySender` acceptent les préfixes `id:`, `e164:`, `username:`, `name:` (les clés sans préfixe sont mappées à `id:`). `"*"` est un joker.

  </Accordion>

  <Accordion title="Livraison, médias et actions">
    - `textChunkLimit` : taille des blocs de texte sortants
    - `chunkMode` : `length` (par défaut) ou `newline` (découpe sur les limites de paragraphe avant la longueur)
    - `mediaAllowHosts` : liste d’autorisation d’hôtes pour les pièces jointes entrantes (par défaut domaines Microsoft/Teams)
    - `mediaAuthAllowHosts` : hôtes pouvant recevoir des en-têtes Authorization lors des nouvelles tentatives (par défaut Graph + Bot Framework)
    - `replyStyle` : `thread | top-level` (voir [Style de réponse](#reply-style-threads-vs-posts))
    - `actions.memberInfo` : activer/désactiver l’action d’informations sur les membres adossée à Graph (activée par défaut lorsque Graph est disponible)
    - `sharePointSiteId` : requis pour les téléversements de fichiers dans les discussions/canaux de groupe (voir [Envoi de fichiers dans les discussions de groupe](#sending-files-in-group-chats))
  </Accordion>
</AccordionGroup>

## Routage et sessions

- Les clés de session suivent le format standard des agents (voir [/concepts/session](/fr/concepts/session)) :
  - Les messages directs partagent la session principale (`agent:<agentId>:<mainKey>`).
  - Les messages de canal/groupe utilisent l’ID de conversation :
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Style de réponse : fils vs publications

Teams a récemment introduit deux styles d’interface de canal au-dessus du même modèle de données sous-jacent :

| Style                    | Description                                               | `replyStyle` recommandé |
| ------------------------ | --------------------------------------------------------- | ----------------------- |
| **Posts** (classique)    | Les messages apparaissent comme des cartes avec des réponses en fil en dessous | `thread` (par défaut)   |
| **Threads** (type Slack) | Les messages s’enchaînent linéairement, davantage comme Slack | `top-level`             |

**Le problème :** l’API Teams n’expose pas le style d’interface utilisé par un canal. Si vous utilisez le mauvais `replyStyle` :

- `thread` dans un canal de style Threads → les réponses apparaissent imbriquées de manière peu élégante
- `top-level` dans un canal de style Posts → les réponses apparaissent comme des publications distinctes de premier niveau au lieu d’être dans le fil

**Solution :** configurez `replyStyle` par canal en fonction de la configuration du canal :

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

**Limites actuelles :**

- **DM :** les images et les pièces jointes de fichiers fonctionnent via les API de fichiers du bot Teams.
- **Canaux/groupes :** les pièces jointes vivent dans le stockage M365 (SharePoint/OneDrive). La charge utile du Webhook ne contient qu’un stub HTML, pas les octets réels du fichier. Les **autorisations API Graph sont requises** pour télécharger les pièces jointes de canal.
- Pour les envois explicites centrés sur les fichiers, utilisez `action=upload-file` avec `media` / `filePath` / `path` ; le `message` facultatif devient le texte/commentaire d’accompagnement et `filename` remplace le nom téléversé.

Sans autorisations Graph, les messages de canal avec images seront reçus comme du texte uniquement (le contenu de l’image n’est pas accessible au bot).
Par défaut, OpenClaw ne télécharge les médias qu’à partir des noms d’hôte Microsoft/Teams. Remplacez cela avec `channels.msteams.mediaAllowHosts` (utilisez `["*"]` pour autoriser n’importe quel hôte).
Les en-têtes Authorization ne sont joints que pour les hôtes de `channels.msteams.mediaAuthAllowHosts` (par défaut hôtes Graph + Bot Framework). Gardez cette liste stricte (évitez les suffixes multi-locataires).

## Envoi de fichiers dans les discussions de groupe

Les bots peuvent envoyer des fichiers dans les DM via le flux FileConsentCard (intégré). Cependant, **l’envoi de fichiers dans les discussions/canaux de groupe** nécessite une configuration supplémentaire :

| Contexte                 | Méthode d’envoi des fichiers                 | Configuration nécessaire                           |
| ------------------------ | -------------------------------------------- | -------------------------------------------------- |
| **DM**                   | FileConsentCard → l’utilisateur accepte → le bot téléverse | Fonctionne immédiatement                     |
| **Discussions/canaux de groupe** | Téléversement vers SharePoint → lien de partage | Nécessite `sharePointSiteId` + autorisations Graph |
| **Images (tout contexte)** | Inline encodé en base64                    | Fonctionne immédiatement                           |

### Pourquoi les discussions de groupe nécessitent SharePoint

Les bots n’ont pas de lecteur OneDrive personnel (le point de terminaison API Graph `/me/drive` ne fonctionne pas pour les identités d’application). Pour envoyer des fichiers dans les discussions/canaux de groupe, le bot téléverse vers un **site SharePoint** et crée un lien de partage.

### Configuration

1. **Ajoutez des autorisations API Graph** dans Entra ID (Azure AD) → App Registration :
   - `Sites.ReadWrite.All` (Application) - téléverser des fichiers vers SharePoint
   - `Chat.Read.All` (Application) - facultatif, active les liens de partage par utilisateur

2. **Accordez le consentement administrateur** pour le locataire.

3. **Obtenez l’ID de votre site SharePoint :**

   ```bash
   # Via Graph Explorer ou curl avec un jeton valide :
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Exemple : pour un site sur "contoso.sharepoint.com/sites/BotFiles"
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

### Comportement du partage

| Autorisation                            | Comportement du partage                                  |
| --------------------------------------- | -------------------------------------------------------- |
| `Sites.ReadWrite.All` uniquement        | Lien de partage à l’échelle de l’organisation (toute personne de l’organisation peut accéder) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Lien de partage par utilisateur (seuls les membres du chat peuvent accéder) |

Le partage par utilisateur est plus sécurisé puisque seuls les participants au chat peuvent accéder au fichier. Si l’autorisation `Chat.Read.All` est absente, le bot revient au partage à l’échelle de l’organisation.

### Comportement de repli

| Scénario                                          | Résultat                                           |
| ------------------------------------------------- | -------------------------------------------------- |
| Discussion de groupe + fichier + `sharePointSiteId` configuré | Téléverse vers SharePoint, envoie un lien de partage |
| Discussion de groupe + fichier + pas de `sharePointSiteId` | Tente un téléversement OneDrive (peut échouer), envoie uniquement du texte |
| Discussion personnelle + fichier                  | Flux FileConsentCard (fonctionne sans SharePoint)  |
| Tout contexte + image                             | Inline encodé en base64 (fonctionne sans SharePoint) |

### Emplacement de stockage des fichiers

Les fichiers téléversés sont stockés dans un dossier `/OpenClawShared/` de la bibliothèque de documents par défaut du site SharePoint configuré.

## Sondages (cartes adaptatives)

OpenClaw envoie les sondages Teams sous forme de cartes adaptatives (il n’existe pas d’API native de sondage Teams).

- CLI : `openclaw message poll --channel msteams --target conversation:<id> ...`
- Les votes sont enregistrés par le Gateway dans `~/.openclaw/msteams-polls.json`.
- Le Gateway doit rester en ligne pour enregistrer les votes.
- Les sondages ne publient pas encore automatiquement de résumés de résultats (inspectez le fichier de stockage si nécessaire).

## Cartes de présentation

Envoyez des charges utiles de présentation sémantique aux utilisateurs ou conversations Teams à l’aide de l’outil `message` ou de la CLI. OpenClaw les rend sous forme de cartes adaptatives Teams à partir du contrat de présentation générique.

Le paramètre `presentation` accepte des blocs sémantiques. Lorsque `presentation` est fourni, le texte du message est facultatif.

**Outil d’agent :**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI :**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

Pour les détails du format de cible, voir [Formats de cible](#target-formats) ci-dessous.

## Formats de cible

Les cibles MSTeams utilisent des préfixes pour distinguer les utilisateurs et les conversations :

| Type de cible         | Format                           | Exemple                                             |
| --------------------- | -------------------------------- | --------------------------------------------------- |
| Utilisateur (par ID)  | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Utilisateur (par nom) | `user:<display-name>`            | `user:John Smith` (nécessite l’API Graph)          |
| Groupe/canal          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| Groupe/canal (brut)   | `<conversation-id>`              | `19:abc123...@thread.tacv2` (si contient `@thread`) |

**Exemples CLI :**

```bash
# Envoyer à un utilisateur par ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Envoyer à un utilisateur par nom d'affichage (déclenche une recherche API Graph)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Envoyer à une discussion de groupe ou à un canal
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Envoyer une carte de présentation à une conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Exemples d’outil d’agent :**

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
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

Remarque : sans le préfixe `user:`, les noms reviennent par défaut à une résolution groupe/équipe. Utilisez toujours `user:` lorsque vous ciblez des personnes par nom d’affichage.

## Messagerie proactive

- Les messages proactifs ne sont possibles **qu’après** qu’un utilisateur a interagi, car nous stockons alors les références de conversation.
- Voir `/gateway/configuration` pour `dmPolicy` et le contrôle par liste d’autorisation.

## ID d’équipe et de canal

Le paramètre de requête `groupId` dans les URL Teams n’est **PAS** l’ID d’équipe utilisé pour la configuration. Extrayez plutôt les ID du chemin de l’URL :

**URL d’équipe :**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID d’équipe (à décoder depuis l’URL)
```

**URL de canal :**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID de canal (à décoder depuis l’URL)
```

**Pour la configuration :**

- ID d’équipe = segment de chemin après `/team/` (décodé depuis l’URL, par ex. `19:Bk4j...@thread.tacv2`)
- ID de canal = segment de chemin après `/channel/` (décodé depuis l’URL)
- **Ignorez** le paramètre de requête `groupId`

## Canaux privés

Les bots ont une prise en charge limitée dans les canaux privés :

| Fonctionnalité              | Canaux standard | Canaux privés         |
| --------------------------- | --------------- | --------------------- |
| Installation du bot         | Oui             | Limitée               |
| Messages en temps réel (Webhook) | Oui        | Peut ne pas fonctionner |
| Autorisations RSC           | Oui             | Peuvent se comporter différemment |
| @mentions                   | Oui             | Si le bot est accessible |
| Historique API Graph        | Oui             | Oui (avec autorisations) |

**Solutions de contournement si les canaux privés ne fonctionnent pas :**

1. Utilisez des canaux standard pour les interactions avec le bot
2. Utilisez les DM - les utilisateurs peuvent toujours envoyer des messages directement au bot
3. Utilisez l’API Graph pour l’accès historique (nécessite `ChannelMessage.Read.All`)

## Dépannage

### Problèmes fréquents

- **Les images ne s’affichent pas dans les canaux :** autorisations Graph ou consentement administrateur manquants. Réinstallez l’application Teams et quittez/réouvrez complètement Teams.
- **Aucune réponse dans le canal :** les mentions sont requises par défaut ; définissez `channels.msteams.requireMention=false` ou configurez cela par équipe/canal.
- **Incompatibilité de version (Teams affiche toujours l’ancien manifeste) :** supprimez puis rajoutez l’application et quittez complètement Teams pour actualiser.
- **401 Unauthorized depuis le Webhook :** normal lors de tests manuels sans JWT Azure — cela signifie que le point de terminaison est accessible mais que l’authentification a échoué. Utilisez Azure Web Chat pour tester correctement.

### Erreurs de téléversement du manifeste

- **"Icon file cannot be empty" :** le manifeste référence des fichiers d’icône de 0 octet. Créez des icônes PNG valides (32x32 pour `outline.png`, 192x192 pour `color.png`).
- **"webApplicationInfo.Id already in use" :** l’application est toujours installée dans une autre équipe/un autre chat. Trouvez-la et désinstallez-la d’abord, ou attendez 5 à 10 minutes pour la propagation.
- **"Something went wrong" lors du téléversement :** téléversez plutôt via [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), ouvrez les DevTools du navigateur (F12) → onglet Network, puis vérifiez le corps de la réponse pour l’erreur réelle.
- **Échec du chargement latéral :** essayez « Upload an app to your org's app catalog » au lieu de « Upload a custom app » — cela contourne souvent les restrictions de chargement latéral.

### Les autorisations RSC ne fonctionnent pas

1. Vérifiez que `webApplicationInfo.id` correspond exactement à l’App ID de votre bot
2. Retéléversez l’application et réinstallez-la dans l’équipe/le chat
3. Vérifiez si l’administrateur de votre organisation a bloqué les autorisations RSC
4. Confirmez que vous utilisez la bonne portée : `ChannelMessage.Read.Group` pour les équipes, `ChatMessage.Read.Chat` pour les discussions de groupe

## Références

- [Créer Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guide de configuration Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - créer/gérer des applications Teams
- [Schéma du manifeste d’application Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Recevoir les messages de canal avec RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Référence des autorisations RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Gestion des fichiers par les bots Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/groupe nécessite Graph)
- [Messagerie proactive](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Associé

<CardGroup cols={2}>
  <Card title="Vue d’ensemble des canaux" icon="list" href="/fr/channels">
    Tous les canaux pris en charge.
  </Card>
  <Card title="Jumelage" icon="link" href="/fr/channels/pairing">
    Authentification DM et flux de jumelage.
  </Card>
  <Card title="Groupes" icon="users" href="/fr/channels/groups">
    Comportement des discussions de groupe et contrôle par mention.
  </Card>
  <Card title="Routage des canaux" icon="route" href="/fr/channels/channel-routing">
    Routage des sessions pour les messages.
  </Card>
  <Card title="Security" icon="shield" href="/fr/gateway/security">
    Modèle d’accès et durcissement.
  </Card>
</CardGroup>
