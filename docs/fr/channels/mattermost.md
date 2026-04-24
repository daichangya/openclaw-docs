---
read_when:
    - Configuration de Mattermost
    - Débogage du routage Mattermost
summary: Configuration du bot Mattermost et configuration OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-24T07:00:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 09c91790a2ea0149c179031b6c08e06358cb4efa5a027778cec87b38444d7718
    source_path: channels/mattermost.md
    workflow: 15
---

Statut : Plugin intégré (jeton de bot + événements WebSocket). Les canaux, groupes et DM sont pris en charge.
Mattermost est une plateforme de messagerie d’équipe auto-hébergeable ; consultez le site officiel
[mattermost.com](https://mattermost.com) pour les détails du produit et les téléchargements.

## Plugin intégré

Mattermost est livré comme Plugin intégré dans les versions actuelles d’OpenClaw, donc les
builds packagés normaux n’ont pas besoin d’une installation séparée.

Si vous utilisez une build plus ancienne ou une installation personnalisée qui exclut Mattermost,
installez-le manuellement :

Installer via le CLI (registre npm) :

```bash
openclaw plugins install @openclaw/mattermost
```

Checkout local (lors d’une exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide

1. Assurez-vous que le Plugin Mattermost est disponible.
   - Les versions packagées actuelles d’OpenClaw l’intègrent déjà.
   - Les installations anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Créez un compte bot Mattermost et copiez le **jeton du bot**.
3. Copiez l’**URL de base** Mattermost (par ex. `https://chat.example.com`).
4. Configurez OpenClaw et démarrez le Gateway.

Configuration minimale :

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## Commandes slash natives

Les commandes slash natives sont activées sur demande. Lorsqu’elles sont activées, OpenClaw enregistre les commandes slash `oc_*` via
l’API Mattermost et reçoit les POST de rappel sur le serveur HTTP du Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Remarques :

- `native: "auto"` est désactivé par défaut pour Mattermost. Définissez `native: true` pour l’activer.
- Si `callbackUrl` est omis, OpenClaw en dérive une à partir de l’hôte/port du gateway + `callbackPath`.
- Pour les configurations multi-comptes, `commands` peut être défini au niveau supérieur ou sous
  `channels.mattermost.accounts.<id>.commands` (les valeurs du compte remplacent les champs de niveau supérieur).
- Les rappels de commande sont validés avec les jetons par commande renvoyés par
  Mattermost lorsqu’OpenClaw enregistre les commandes `oc_*`.
- Les rappels slash échouent en fermeture si l’enregistrement a échoué, si le démarrage était partiel, ou
  si le jeton de rappel ne correspond à aucune des commandes enregistrées.
- Exigence d’accessibilité : le point de terminaison de rappel doit être accessible depuis le serveur Mattermost.
  - Ne définissez pas `callbackUrl` sur `localhost` à moins que Mattermost ne s’exécute sur le même hôte/espace de noms réseau qu’OpenClaw.
  - Ne définissez pas `callbackUrl` sur votre URL de base Mattermost à moins que cette URL ne fasse un proxy inverse de `/api/channels/mattermost/command` vers OpenClaw.
  - Une vérification rapide consiste à exécuter `curl https://<gateway-host>/api/channels/mattermost/command` ; une requête GET doit renvoyer `405 Method Not Allowed` depuis OpenClaw, et non `404`.
- Exigence de liste d’autorisation de sortie Mattermost :
  - Si votre rappel cible des adresses privées/tailnet/internes, définissez
    `ServiceSettings.AllowedUntrustedInternalConnections` dans Mattermost pour inclure l’hôte/domaine du rappel.
  - Utilisez des entrées hôte/domaine, pas des URL complètes.
    - Bon : `gateway.tailnet-name.ts.net`
    - Mauvais : `https://gateway.tailnet-name.ts.net`

## Variables d’environnement (compte par défaut)

Définissez celles-ci sur l’hôte Gateway si vous préférez les variables d’environnement :

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Les variables d’environnement s’appliquent uniquement au compte **par défaut** (`default`). Les autres comptes doivent utiliser des valeurs de configuration.

`MATTERMOST_URL` ne peut pas être défini depuis un `.env` d’espace de travail ; voir [Fichiers `.env` d’espace de travail](/fr/gateway/security).

## Modes de chat

Mattermost répond automatiquement aux DM. Le comportement dans les canaux est contrôlé par `chatmode` :

- `oncall` (par défaut) : répondre uniquement lorsqu’il est @mentionné dans les canaux.
- `onmessage` : répondre à chaque message de canal.
- `onchar` : répondre lorsqu’un message commence par un préfixe de déclenchement.

Exemple de configuration :

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Remarques :

- `onchar` répond toujours aux @mentions explicites.
- `channels.mattermost.requireMention` est respecté pour les configurations existantes, mais `chatmode` est préférable.

## Fils de discussion et sessions

Utilisez `channels.mattermost.replyToMode` pour contrôler si les réponses de canal et de groupe restent dans le
canal principal ou démarrent un fil de discussion sous le post déclencheur.

- `off` (par défaut) : répondre dans un fil seulement si le post entrant s’y trouve déjà.
- `first` : pour les posts de canal/groupe de premier niveau, démarrer un fil sous ce post et router la
  conversation vers une session à portée de fil.
- `all` : même comportement que `first` pour Mattermost aujourd’hui.
- Les messages directs ignorent ce paramètre et restent hors fil.

Exemple de configuration :

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Remarques :

- Les sessions à portée de fil utilisent l’identifiant du post déclencheur comme racine du fil.
- `first` et `all` sont actuellement équivalents, car une fois que Mattermost a une racine de fil,
  les segments de suivi et médias continuent dans ce même fil.

## Contrôle d’accès (DM)

- Par défaut : `channels.mattermost.dmPolicy = "pairing"` (les expéditeurs inconnus reçoivent un code d’association).
- Approuver via :
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM publics : `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Canaux (groupes)

- Par défaut : `channels.mattermost.groupPolicy = "allowlist"` (avec filtrage par mention).
- Ajoutez les expéditeurs autorisés avec `channels.mattermost.groupAllowFrom` (identifiants utilisateur recommandés).
- Les remplacements de mention par canal se trouvent sous `channels.mattermost.groups.<channelId>.requireMention`
  ou `channels.mattermost.groups["*"].requireMention` pour une valeur par défaut.
- La correspondance `@username` est mutable et n’est activée que lorsque `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canaux ouverts : `channels.mattermost.groupPolicy="open"` (avec filtrage par mention).
- Remarque d’exécution : si `channels.mattermost` est complètement absent, l’exécution revient à `groupPolicy="allowlist"` pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

Exemple :

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Cibles pour l’envoi sortant

Utilisez ces formats de cible avec `openclaw message send` ou Cron/Webhooks :

- `channel:<id>` pour un canal
- `user:<id>` pour un DM
- `@username` pour un DM (résolu via l’API Mattermost)

Les identifiants opaques nus (comme `64ifufp...`) sont **ambigus** dans Mattermost (identifiant utilisateur vs identifiant de canal).

OpenClaw les résout **en donnant la priorité à l’utilisateur** :

- Si l’identifiant existe comme utilisateur (`GET /api/v4/users/<id>` réussit), OpenClaw envoie un **DM** en résolvant le canal direct via `/api/v4/channels/direct`.
- Sinon, l’identifiant est traité comme un **identifiant de canal**.

Si vous avez besoin d’un comportement déterministe, utilisez toujours les préfixes explicites (`user:<id>` / `channel:<id>`).

## Nouvelle tentative pour canal DM

Lorsqu’OpenClaw envoie vers une cible DM Mattermost et doit d’abord résoudre le canal direct, il
réessaie par défaut en cas d’échec transitoire de création de canal direct.

Utilisez `channels.mattermost.dmChannelRetry` pour ajuster ce comportement globalement pour le Plugin Mattermost,
ou `channels.mattermost.accounts.<id>.dmChannelRetry` pour un compte donné.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Remarques :

- Cela s’applique uniquement à la création de canal DM (`/api/v4/channels/direct`), pas à chaque appel API Mattermost.
- Les nouvelles tentatives s’appliquent aux échecs transitoires tels que les limites de débit, les réponses 5xx et les erreurs réseau ou de délai d’attente.
- Les erreurs client 4xx autres que `429` sont traitées comme permanentes et ne font pas l’objet de nouvelles tentatives.

## Streaming d’aperçu

Mattermost diffuse la réflexion, l’activité des outils et le texte partiel de réponse dans un unique **post d’aperçu brouillon** qui est finalisé sur place lorsque la réponse finale peut être envoyée en toute sécurité. L’aperçu est mis à jour sur le même identifiant de post au lieu d’inonder le canal avec des messages par segment. Les fins média/erreur annulent les modifications d’aperçu en attente et utilisent la livraison normale au lieu de vider un post d’aperçu jetable.

Activez-le via `channels.mattermost.streaming` :

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

Remarques :

- `partial` est le choix habituel : un post d’aperçu unique modifié au fur et à mesure que la réponse grandit, puis finalisé avec la réponse complète.
- `block` utilise des segments de brouillon de style ajout dans le post d’aperçu.
- `progress` affiche un aperçu de statut pendant la génération et ne publie la réponse finale qu’à la fin.
- `off` désactive le streaming d’aperçu.
- Si le flux ne peut pas être finalisé sur place (par exemple si le post a été supprimé en cours de flux), OpenClaw revient à l’envoi d’un nouveau post final afin que la réponse ne soit jamais perdue.
- Les charges utiles de raisonnement seules sont supprimées des posts de canal, y compris le texte arrivant sous forme de bloc de citation `> Reasoning:`. Définissez `/reasoning on` pour voir la réflexion sur d’autres surfaces ; le post final Mattermost conserve uniquement la réponse.
- Consultez [Streaming](/fr/concepts/streaming#preview-streaming-modes) pour la matrice de correspondance des canaux.

## Réactions (outil de message)

- Utilisez `message action=react` avec `channel=mattermost`.
- `messageId` est l’identifiant du post Mattermost.
- `emoji` accepte des noms comme `thumbsup` ou `:+1:` (les deux-points sont facultatifs).
- Définissez `remove=true` (booléen) pour supprimer une réaction.
- Les événements d’ajout/suppression de réaction sont transmis comme événements système à la session d’agent routée.

Exemples :

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuration :

- `channels.mattermost.actions.reactions` : activer/désactiver les actions de réaction (par défaut true).
- Remplacement par compte : `channels.mattermost.accounts.<id>.actions.reactions`.

## Boutons interactifs (outil de message)

Envoyez des messages avec des boutons cliquables. Lorsqu’un utilisateur clique sur un bouton, l’agent reçoit la
sélection et peut répondre.

Activez les boutons en ajoutant `inlineButtons` aux capacités du canal :

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Utilisez `message action=send` avec un paramètre `buttons`. Les boutons sont un tableau 2D (lignes de boutons) :

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Champs des boutons :

- `text` (obligatoire) : libellé affiché.
- `callback_data` (obligatoire) : valeur renvoyée au clic (utilisée comme identifiant d’action).
- `style` (facultatif) : `"default"`, `"primary"` ou `"danger"`.

Lorsqu’un utilisateur clique sur un bouton :

1. Tous les boutons sont remplacés par une ligne de confirmation (par ex. "✓ **Yes** selected by @user").
2. L’agent reçoit la sélection comme message entrant et répond.

Remarques :

- Les rappels de bouton utilisent une vérification HMAC-SHA256 (automatique, aucune configuration requise).
- Mattermost supprime les données de rappel de ses réponses API (fonctionnalité de sécurité), donc tous les boutons
  sont supprimés au clic — une suppression partielle n’est pas possible.
- Les identifiants d’action contenant des tirets ou des underscores sont automatiquement assainis
  (limitation du routage Mattermost).

Configuration :

- `channels.mattermost.capabilities` : tableau de chaînes de capacités. Ajoutez `"inlineButtons"` pour
  activer la description de l’outil de boutons dans le prompt système de l’agent.
- `channels.mattermost.interactions.callbackBaseUrl` : URL de base externe facultative pour les
  rappels de boutons (par exemple `https://gateway.example.com`). Utilisez-la lorsque Mattermost ne peut pas
  atteindre directement le gateway à son hôte de liaison.
- Dans les configurations multi-comptes, vous pouvez également définir le même champ sous
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Si `interactions.callbackBaseUrl` est omis, OpenClaw dérive l’URL de rappel à partir de
  `gateway.customBindHost` + `gateway.port`, puis se rabat sur `http://localhost:<port>`.
- Règle d’accessibilité : l’URL de rappel des boutons doit être accessible depuis le serveur Mattermost.
  `localhost` ne fonctionne que lorsque Mattermost et OpenClaw s’exécutent sur le même hôte/espace de noms réseau.
- Si votre cible de rappel est privée/tailnet/interne, ajoutez son hôte/domaine à
  `ServiceSettings.AllowedUntrustedInternalConnections` dans Mattermost.

### Intégration API directe (scripts externes)

Les scripts externes et les Webhooks peuvent publier des boutons directement via l’API REST Mattermost
au lieu de passer par l’outil `message` de l’agent. Utilisez `buildButtonAttachments()` du
Plugin lorsque c’est possible ; si vous publiez du JSON brut, respectez les règles suivantes :

**Structure de la charge utile :**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only — see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

**Règles critiques :**

1. Les pièces jointes vont dans `props.attachments`, pas dans `attachments` au niveau supérieur (sinon elles sont ignorées silencieusement).
2. Chaque action doit avoir `type: "button"` — sans cela, les clics sont silencieusement ignorés.
3. Chaque action doit avoir un champ `id` — Mattermost ignore les actions sans ID.
4. L’`id` de l’action doit être **strictement alphanumérique** (`[a-zA-Z0-9]`). Les tirets et underscores cassent
   le routage côté serveur de Mattermost (renvoie 404). Supprimez-les avant utilisation.
5. `context.action_id` doit correspondre à l’`id` du bouton afin que le message de confirmation affiche le
   nom du bouton (par ex. « Approve ») au lieu d’un ID brut.
6. `context.action_id` est obligatoire — le gestionnaire d’interaction renvoie 400 sans lui.

**Génération du jeton HMAC :**

Le gateway vérifie les clics sur les boutons avec HMAC-SHA256. Les scripts externes doivent générer des jetons
qui correspondent à la logique de vérification du gateway :

1. Dérivez le secret à partir du jeton du bot :
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Construisez l’objet de contexte avec tous les champs **sauf** `_token`.
3. Sérialisez avec des **clés triées** et **sans espaces** (le gateway utilise `JSON.stringify`
   avec des clés triées, ce qui produit une sortie compacte).
4. Signez : `HMAC-SHA256(key=secret, data=serializedContext)`
5. Ajoutez l’empreinte hexadécimale résultante comme `_token` dans le contexte.

Exemple Python :

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

Pièges fréquents avec HMAC :

- `json.dumps` de Python ajoute des espaces par défaut (`{"key": "val"}`). Utilisez
  `separators=(",", ":")` pour correspondre à la sortie compacte de JavaScript (`{"key":"val"}`).
- Signez toujours **tous** les champs du contexte (hors `_token`). Le gateway retire `_token`, puis
  signe tout le reste. Signer seulement un sous-ensemble provoque un échec de vérification silencieux.
- Utilisez `sort_keys=True` — le gateway trie les clés avant de signer, et Mattermost peut
  réordonner les champs du contexte lors du stockage de la charge utile.
- Dérivez le secret à partir du jeton du bot (déterministe), pas à partir d’octets aléatoires. Le secret
  doit être identique dans le processus qui crée les boutons et dans le gateway qui vérifie.

## Adaptateur d’annuaire

Le Plugin Mattermost inclut un adaptateur d’annuaire qui résout les noms de canaux et d’utilisateurs
via l’API Mattermost. Cela active les cibles `#channel-name` et `@username` dans
`openclaw message send` et les envois Cron/Webhook.

Aucune configuration n’est nécessaire — l’adaptateur utilise le jeton du bot issu de la configuration du compte.

## Multi-comptes

Mattermost prend en charge plusieurs comptes sous `channels.mattermost.accounts` :

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Dépannage

- Pas de réponses dans les canaux : assurez-vous que le bot est dans le canal et mentionnez-le (oncall), utilisez un préfixe de déclenchement (onchar), ou définissez `chatmode: "onmessage"`.
- Erreurs d’authentification : vérifiez le jeton du bot, l’URL de base, et si le compte est activé.
- Problèmes multi-comptes : les variables d’environnement ne s’appliquent qu’au compte `default`.
- Les commandes slash natives renvoient `Unauthorized: invalid command token.` : OpenClaw
  n’a pas accepté le jeton de rappel. Causes typiques :
  - l’enregistrement de la commande slash a échoué ou n’a été que partiellement terminé au démarrage
  - le rappel atteint le mauvais gateway/compte
  - Mattermost a encore d’anciennes commandes pointant vers une cible de rappel précédente
  - le gateway a redémarré sans réactiver les commandes slash
- Si les commandes slash natives cessent de fonctionner, vérifiez les journaux pour
  `mattermost: failed to register slash commands` ou
  `mattermost: native slash commands enabled but no commands could be registered`.
- Si `callbackUrl` est omis et que les journaux avertissent que le rappel a été résolu en
  `http://127.0.0.1:18789/...`, cette URL n’est probablement accessible que lorsque
  Mattermost s’exécute sur le même hôte/espace de noms réseau qu’OpenClaw. Définissez à la place
  un `commands.callbackUrl` explicite et accessible de l’extérieur.
- Les boutons apparaissent comme des boîtes blanches : l’agent envoie peut-être des données de bouton mal formées. Vérifiez que chaque bouton possède bien les champs `text` et `callback_data`.
- Les boutons s’affichent mais les clics ne font rien : vérifiez que `AllowedUntrustedInternalConnections` dans la configuration du serveur Mattermost inclut `127.0.0.1 localhost`, et que `EnablePostActionIntegration` est `true` dans `ServiceSettings`.
- Les boutons renvoient 404 au clic : l’`id` du bouton contient probablement des tirets ou des underscores. Le routeur d’actions de Mattermost ne fonctionne pas avec des ID non alphanumériques. Utilisez uniquement `[a-zA-Z0-9]`.
- Le gateway journalise `invalid _token` : non-correspondance HMAC. Vérifiez que vous signez tous les champs du contexte (pas seulement un sous-ensemble), que vous utilisez des clés triées, et du JSON compact (sans espaces). Voir la section HMAC ci-dessus.
- Le gateway journalise `missing _token in context` : le champ `_token` n’est pas présent dans le contexte du bouton. Assurez-vous de l’inclure lors de la construction de la charge utile d’intégration.
- La confirmation affiche l’ID brut au lieu du nom du bouton : `context.action_id` ne correspond pas à l’`id` du bouton. Définissez les deux à la même valeur assainie.
- L’agent ne connaît pas les boutons : ajoutez `capabilities: ["inlineButtons"]` à la configuration du canal Mattermost.

## Lié

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Association](/fr/channels/pairing) — authentification DM et flux d’association
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et sécurisation
