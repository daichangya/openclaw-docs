---
read_when:
    - Travail sur les fonctionnalités du canal Google Chat
summary: État de prise en charge de l’application Google Chat, capacités et configuration
title: Google Chat
x-i18n:
    generated_at: "2026-04-24T06:59:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc27c89fd563abab6214912687e0f15c80c7d3e652e9159bf8b43190b0886a
    source_path: channels/googlechat.md
    workflow: 15
---

Statut : prêt pour les DM + espaces via les Webhooks de l’API Google Chat (HTTP uniquement).

## Configuration rapide (débutant)

1. Créez un projet Google Cloud et activez la **Google Chat API**.
   - Accédez à : [Identifiants Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Activez l’API si elle n’est pas déjà activée.
2. Créez un **compte de service** :
   - Cliquez sur **Create Credentials** > **Service Account**.
   - Donnez-lui le nom de votre choix (par ex. `openclaw-chat`).
   - Laissez les autorisations vides (cliquez sur **Continue**).
   - Laissez les principaux ayant accès vides (cliquez sur **Done**).
3. Créez et téléchargez la **clé JSON** :
   - Dans la liste des comptes de service, cliquez sur celui que vous venez de créer.
   - Allez dans l’onglet **Keys**.
   - Cliquez sur **Add Key** > **Create new key**.
   - Sélectionnez **JSON** et cliquez sur **Create**.
4. Stockez le fichier JSON téléchargé sur votre hôte Gateway (par ex. `~/.openclaw/googlechat-service-account.json`).
5. Créez une application Google Chat dans la [configuration Google Chat de la Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) :
   - Renseignez les **informations de l’application** :
     - **App name** : (par ex. `OpenClaw`)
     - **Avatar URL** : (par ex. `https://openclaw.ai/logo.png`)
     - **Description** : (par ex. `Assistant IA personnel`)
   - Activez **Interactive features**.
   - Sous **Functionality**, cochez **Join spaces and group conversations**.
   - Sous **Connection settings**, sélectionnez **HTTP endpoint URL**.
   - Sous **Triggers**, sélectionnez **Use a common HTTP endpoint URL for all triggers** et définissez-la sur l’URL publique de votre gateway suivie de `/googlechat`.
     - _Conseil : exécutez `openclaw status` pour trouver l’URL publique de votre gateway._
   - Sous **Visibility**, cochez **Make this Chat app available to specific people and groups in `<Your Domain>`**.
   - Saisissez votre adresse e-mail (par ex. `user@example.com`) dans la zone de texte.
   - Cliquez sur **Save** en bas de page.
6. **Activez le statut de l’application** :
   - Après l’enregistrement, **actualisez la page**.
   - Recherchez la section **App status** (généralement vers le haut ou le bas après l’enregistrement).
   - Changez le statut en **Live - available to users**.
   - Cliquez de nouveau sur **Save**.
7. Configurez OpenClaw avec le chemin du compte de service + l’audience du Webhook :
   - Env : `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Ou config : `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Définissez le type + la valeur d’audience du Webhook (ils doivent correspondre à votre configuration d’application Chat).
9. Démarrez le Gateway. Google Chat enverra des requêtes POST à votre chemin de Webhook.

## Ajouter à Google Chat

Une fois le Gateway en cours d’exécution et votre adresse e-mail ajoutée à la liste de visibilité :

1. Accédez à [Google Chat](https://chat.google.com/).
2. Cliquez sur l’icône **+** (plus) à côté de **Direct Messages**.
3. Dans la barre de recherche (où vous ajoutez habituellement des personnes), saisissez le **nom de l’application** configuré dans la Google Cloud Console.
   - **Remarque** : le bot _n’apparaîtra pas_ dans la liste de navigation « Marketplace », car il s’agit d’une application privée. Vous devez le rechercher par son nom.
4. Sélectionnez votre bot dans les résultats.
5. Cliquez sur **Add** ou **Chat** pour démarrer une conversation 1:1.
6. Envoyez « Hello » pour déclencher l’assistant !

## URL publique (Webhook uniquement)

Les Webhooks Google Chat nécessitent un point de terminaison HTTPS public. Pour des raisons de sécurité, **n’exposez que le chemin `/googlechat`** sur Internet. Gardez le tableau de bord OpenClaw et les autres points de terminaison sensibles sur votre réseau privé.

### Option A : Tailscale Funnel (recommandé)

Utilisez Tailscale Serve pour le tableau de bord privé et Funnel pour le chemin public du Webhook. Cela permet de garder `/` privé tout en exposant uniquement `/googlechat`.

1. **Vérifiez à quelle adresse votre gateway est liée :**

   ```bash
   ss -tlnp | grep 18789
   ```

   Notez l’adresse IP (par ex. `127.0.0.1`, `0.0.0.0` ou votre IP Tailscale comme `100.x.x.x`).

2. **Exposez le tableau de bord uniquement au tailnet (port 8443) :**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Exposez uniquement le chemin du Webhook publiquement :**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autorisez le nœud pour l’accès Funnel :**
   Si cela vous est demandé, ouvrez l’URL d’autorisation affichée dans la sortie afin d’activer Funnel pour ce nœud dans votre politique tailnet.

5. **Vérifiez la configuration :**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

L’URL publique de votre Webhook sera :
`https://<node-name>.<tailnet>.ts.net/googlechat`

Votre tableau de bord privé reste limité au tailnet :
`https://<node-name>.<tailnet>.ts.net:8443/`

Utilisez l’URL publique (sans `:8443`) dans la configuration de l’application Google Chat.

> Remarque : cette configuration persiste après redémarrage. Pour la supprimer plus tard, exécutez `tailscale funnel reset` et `tailscale serve reset`.

### Option B : Proxy inverse (Caddy)

Si vous utilisez un proxy inverse comme Caddy, ne proxifiez que le chemin spécifique :

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Avec cette configuration, toute requête vers `your-domain.com/` sera ignorée ou renverra 404, tandis que `your-domain.com/googlechat` sera acheminé en toute sécurité vers OpenClaw.

### Option C : Cloudflare Tunnel

Configurez les règles d’ingress de votre tunnel pour n’acheminer que le chemin du Webhook :

- **Chemin** : `/googlechat` -> `http://localhost:18789/googlechat`
- **Règle par défaut** : HTTP 404 (Not Found)

## Fonctionnement

1. Google Chat envoie des requêtes POST de Webhook au Gateway. Chaque requête inclut un en-tête `Authorization: Bearer <token>`.
   - OpenClaw vérifie l’authentification bearer avant de lire/analyser l’intégralité des corps de Webhook lorsque l’en-tête est présent.
   - Les requêtes Google Workspace Add-on qui incluent `authorizationEventObject.systemIdToken` dans le corps sont prises en charge via un budget de corps de pré-authentification plus strict.
2. OpenClaw vérifie le jeton par rapport à `audienceType` + `audience` configurés :
   - `audienceType: "app-url"` → l’audience est l’URL HTTPS de votre Webhook.
   - `audienceType: "project-number"` → l’audience est le numéro de projet Cloud.
3. Les messages sont routés par espace :
   - Les DM utilisent la clé de session `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Les espaces utilisent la clé de session `agent:<agentId>:googlechat:group:<spaceId>`.
4. L’accès DM utilise l’association par défaut. Les expéditeurs inconnus reçoivent un code d’association ; approuvez-le avec :
   - `openclaw pairing approve googlechat <code>`
5. Les espaces de groupe exigent une @-mention par défaut. Utilisez `botUser` si la détection des mentions nécessite le nom d’utilisateur de l’application.

## Cibles

Utilisez ces identifiants pour l’envoi et les listes d’autorisation :

- Messages directs : `users/<userId>` (recommandé).
- L’adresse e-mail brute `name@example.com` est mutable et n’est utilisée que pour la correspondance directe de liste d’autorisation lorsque `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsolète : `users/<email>` est traité comme un identifiant utilisateur, et non comme une liste d’autorisation par e-mail.
- Espaces : `spaces/<spaceId>`.

## Points forts de la configuration

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Remarques :

- Les identifiants du compte de service peuvent aussi être transmis inline avec `serviceAccount` (chaîne JSON).
- `serviceAccountRef` est également pris en charge (SecretRef env/fichier), y compris les références par compte sous `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Le chemin de Webhook par défaut est `/googlechat` si `webhookPath` n’est pas défini.
- `dangerouslyAllowNameMatching` réactive la correspondance mutable du principal e-mail pour les listes d’autorisation (mode de compatibilité d’urgence).
- Les réactions sont disponibles via l’outil `reactions` et `channels action` lorsque `actions.reactions` est activé.
- Les actions de message exposent `send` pour le texte et `upload-file` pour les envois explicites de pièces jointes. `upload-file` accepte `media` / `filePath` / `path` ainsi que, facultativement, `message`, `filename` et le ciblage du fil de discussion.
- `typingIndicator` prend en charge `none`, `message` (par défaut) et `reaction` (les réactions nécessitent un OAuth utilisateur).
- Les pièces jointes sont téléchargées via l’API Chat et stockées dans le pipeline média (taille limitée par `mediaMaxMb`).

Détails sur la référence des secrets : [Gestion des secrets](/fr/gateway/secrets).

## Dépannage

### 405 Method Not Allowed

Si Google Cloud Logs Explorer affiche des erreurs comme :

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Cela signifie que le gestionnaire de Webhook n’est pas enregistré. Causes fréquentes :

1. **Canal non configuré** : la section `channels.googlechat` est absente de votre configuration. Vérifiez avec :

   ```bash
   openclaw config get channels.googlechat
   ```

   Si la commande renvoie « Config path not found », ajoutez la configuration (voir [Points forts de la configuration](#config-highlights)).

2. **Plugin non activé** : vérifiez le statut du Plugin :

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Si l’état affiché est « disabled », ajoutez `plugins.entries.googlechat.enabled: true` à votre configuration.

3. **Gateway non redémarré** : après avoir ajouté la configuration, redémarrez le Gateway :

   ```bash
   openclaw gateway restart
   ```

Vérifiez que le canal est en cours d’exécution :

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Autres problèmes

- Vérifiez `openclaw channels status --probe` pour détecter les erreurs d’authentification ou une configuration d’audience manquante.
- Si aucun message n’arrive, confirmez l’URL du Webhook de l’application Chat ainsi que les abonnements aux événements.
- Si le filtrage par mention bloque les réponses, définissez `botUser` sur le nom de ressource utilisateur de l’application et vérifiez `requireMention`.
- Utilisez `openclaw logs --follow` tout en envoyant un message de test pour voir si les requêtes atteignent le Gateway.

Documentation associée :

- [Configuration du Gateway](/fr/gateway/configuration)
- [Sécurité](/fr/gateway/security)
- [Réactions](/fr/tools/reactions)

## Lié

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Association](/fr/channels/pairing) — authentification DM et flux d’association
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et sécurisation
