---
read_when:
    - Travailler sur les fonctionnalités du canal Google Chat
summary: Statut de prise en charge, capacités et configuration de l'application Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-04-05T12:35:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 570894ed798dd0b9ba42806b050927216379a1228fcd2f96de565bc8a4ac7c2c
    source_path: channels/googlechat.md
    workflow: 15
---

# Google Chat (API Chat)

Statut : prêt pour les messages privés et les espaces via les webhooks de l'API Google Chat (HTTP uniquement).

## Configuration rapide (débutant)

1. Créez un projet Google Cloud et activez l'**API Google Chat**.
   - Accédez à : [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Activez l'API si elle n'est pas déjà activée.
2. Créez un **compte de service** :
   - Cliquez sur **Create Credentials** > **Service Account**.
   - Donnez-lui le nom de votre choix (par exemple, `openclaw-chat`).
   - Laissez les autorisations vides (cliquez sur **Continue**).
   - Laissez les principaux ayant accès vides (cliquez sur **Done**).
3. Créez et téléchargez la **clé JSON** :
   - Dans la liste des comptes de service, cliquez sur celui que vous venez de créer.
   - Accédez à l'onglet **Keys**.
   - Cliquez sur **Add Key** > **Create new key**.
   - Sélectionnez **JSON** et cliquez sur **Create**.
4. Stockez le fichier JSON téléchargé sur votre hôte gateway (par exemple, `~/.openclaw/googlechat-service-account.json`).
5. Créez une application Google Chat dans la [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) :
   - Renseignez les **informations de l'application** :
     - **App name** : (par exemple `OpenClaw`)
     - **Avatar URL** : (par exemple `https://openclaw.ai/logo.png`)
     - **Description** : (par exemple `Assistant IA personnel`)
   - Activez les **Interactive features**.
   - Sous **Functionality**, cochez **Join spaces and group conversations**.
   - Sous **Connection settings**, sélectionnez **HTTP endpoint URL**.
   - Sous **Triggers**, sélectionnez **Use a common HTTP endpoint URL for all triggers** et définissez-la sur l'URL publique de votre gateway suivie de `/googlechat`.
     - _Astuce : exécutez `openclaw status` pour trouver l'URL publique de votre gateway._
   - Sous **Visibility**, cochez **Make this Chat app available to specific people and groups in &lt;Your Domain&gt;**.
   - Saisissez votre adresse e-mail (par exemple `user@example.com`) dans la zone de texte.
   - Cliquez sur **Save** en bas.
6. **Activez le statut de l'application** :
   - Après l'enregistrement, **actualisez la page**.
   - Recherchez la section **App status** (généralement vers le haut ou le bas après l'enregistrement).
   - Remplacez le statut par **Live - available to users**.
   - Cliquez à nouveau sur **Save**.
7. Configurez OpenClaw avec le chemin du compte de service + l'audience du webhook :
   - Variable d'environnement : `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Ou configuration : `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Définissez le type et la valeur de l'audience du webhook (correspondant à votre configuration d'application Chat).
9. Démarrez la gateway. Google Chat enverra des requêtes POST à votre chemin de webhook.

## Ajouter à Google Chat

Une fois la gateway en cours d'exécution et votre adresse e-mail ajoutée à la liste de visibilité :

1. Accédez à [Google Chat](https://chat.google.com/).
2. Cliquez sur l'icône **+** (plus) à côté de **Direct Messages**.
3. Dans la barre de recherche (où vous ajoutez habituellement des personnes), saisissez le **nom de l'application** que vous avez configuré dans Google Cloud Console.
   - **Remarque** : le bot n'apparaîtra _pas_ dans la liste de navigation « Marketplace » car il s'agit d'une application privée. Vous devez la rechercher par son nom.
4. Sélectionnez votre bot dans les résultats.
5. Cliquez sur **Add** ou **Chat** pour démarrer une conversation en tête-à-tête.
6. Envoyez « Hello » pour déclencher l'assistant !

## URL publique (webhook uniquement)

Les webhooks Google Chat nécessitent un point de terminaison HTTPS public. Pour des raisons de sécurité, **n'exposez que le chemin `/googlechat`** sur internet. Gardez le tableau de bord OpenClaw et les autres points de terminaison sensibles sur votre réseau privé.

### Option A : Tailscale Funnel (recommandé)

Utilisez Tailscale Serve pour le tableau de bord privé et Funnel pour le chemin du webhook public. Cela permet de garder `/` privé tout en n'exposant que `/googlechat`.

1. **Vérifiez à quelle adresse votre gateway est liée :**

   ```bash
   ss -tlnp | grep 18789
   ```

   Notez l'adresse IP (par exemple, `127.0.0.1`, `0.0.0.0` ou votre IP Tailscale comme `100.x.x.x`).

2. **Exposez le tableau de bord uniquement au tailnet (port 8443) :**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Exposez uniquement le chemin du webhook publiquement :**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autorisez le nœud pour l'accès Funnel :**
   Si une invite s'affiche, consultez l'URL d'autorisation affichée dans la sortie pour activer Funnel pour ce nœud dans votre politique tailnet.

5. **Vérifiez la configuration :**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

L'URL publique de votre webhook sera :
`https://<node-name>.<tailnet>.ts.net/googlechat`

Votre tableau de bord privé reste accessible uniquement au tailnet :
`https://<node-name>.<tailnet>.ts.net:8443/`

Utilisez l'URL publique (sans `:8443`) dans la configuration de l'application Google Chat.

> Remarque : cette configuration persiste après les redémarrages. Pour la supprimer plus tard, exécutez `tailscale funnel reset` et `tailscale serve reset`.

### Option B : proxy inverse (Caddy)

Si vous utilisez un proxy inverse comme Caddy, proxifiez uniquement le chemin spécifique :

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Avec cette configuration, toute requête vers `your-domain.com/` sera ignorée ou renverra 404, tandis que `your-domain.com/googlechat` sera acheminé en toute sécurité vers OpenClaw.

### Option C : Cloudflare Tunnel

Configurez les règles d'ingress de votre tunnel pour n'acheminer que le chemin du webhook :

- **Chemin** : `/googlechat` -> `http://localhost:18789/googlechat`
- **Règle par défaut** : HTTP 404 (Not Found)

## Fonctionnement

1. Google Chat envoie des requêtes POST de webhook à la gateway. Chaque requête comprend un en-tête `Authorization: Bearer <token>`.
   - OpenClaw vérifie l'authentification bearer avant de lire/analyser les corps complets de webhook lorsque l'en-tête est présent.
   - Les requêtes Google Workspace Add-on qui contiennent `authorizationEventObject.systemIdToken` dans le corps sont prises en charge via un budget de corps de pré-authentification plus strict.
2. OpenClaw vérifie le jeton par rapport au `audienceType` + `audience` configuré :
   - `audienceType: "app-url"` → l'audience est l'URL HTTPS de votre webhook.
   - `audienceType: "project-number"` → l'audience est le numéro du projet Cloud.
3. Les messages sont acheminés par espace :
   - Les messages privés utilisent la clé de session `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Les espaces utilisent la clé de session `agent:<agentId>:googlechat:group:<spaceId>`.
4. L'accès en message privé utilise le jumelage par défaut. Les expéditeurs inconnus reçoivent un code de jumelage ; approuvez-le avec :
   - `openclaw pairing approve googlechat <code>`
5. Les espaces de groupe nécessitent une @mention par défaut. Utilisez `botUser` si la détection de mention a besoin du nom d'utilisateur de l'application.

## Cibles

Utilisez ces identifiants pour la livraison et les listes d'autorisation :

- Messages privés : `users/<userId>` (recommandé).
- L'e-mail brut `name@example.com` est modifiable et n'est utilisé que pour la correspondance directe de liste d'autorisation lorsque `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsolète : `users/<email>` est traité comme un identifiant utilisateur, pas comme une liste d'autorisation par e-mail.
- Espaces : `spaces/<spaceId>`.

## Points clés de la configuration

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

- Les identifiants de compte de service peuvent aussi être transmis en ligne avec `serviceAccount` (chaîne JSON).
- `serviceAccountRef` est également pris en charge (SecretRef env/fichier), y compris les références par compte sous `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Le chemin de webhook par défaut est `/googlechat` si `webhookPath` n'est pas défini.
- `dangerouslyAllowNameMatching` réactive la correspondance modifiable du principal d'e-mail pour les listes d'autorisation (mode de compatibilité de dernier recours).
- Les réactions sont disponibles via l'outil `reactions` et `channels action` lorsque `actions.reactions` est activé.
- Les actions de message exposent `send` pour le texte et `upload-file` pour les envois explicites de pièces jointes. `upload-file` accepte `media` / `filePath` / `path` ainsi que `message`, `filename` et le ciblage de fil facultatifs.
- `typingIndicator` prend en charge `none`, `message` (par défaut) et `reaction` (la réaction nécessite l'OAuth utilisateur).
- Les pièces jointes sont téléchargées via l'API Chat et stockées dans le pipeline média (taille limitée par `mediaMaxMb`).

Détails de référence des secrets : [Gestion des secrets](/gateway/secrets).

## Dépannage

### 405 Method Not Allowed

Si Google Cloud Logs Explorer affiche des erreurs comme :

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Cela signifie que le gestionnaire de webhook n'est pas enregistré. Causes courantes :

1. **Canal non configuré** : la section `channels.googlechat` est absente de votre configuration. Vérifiez avec :

   ```bash
   openclaw config get channels.googlechat
   ```

   Si la commande renvoie « Config path not found », ajoutez la configuration (voir [Points clés de la configuration](#points-clés-de-la-configuration)).

2. **Plugin non activé** : vérifiez le statut du plugin :

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Si « disabled » s'affiche, ajoutez `plugins.entries.googlechat.enabled: true` à votre configuration.

3. **Gateway non redémarrée** : après avoir ajouté la configuration, redémarrez la gateway :

   ```bash
   openclaw gateway restart
   ```

Vérifiez que le canal est en cours d'exécution :

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Autres problèmes

- Vérifiez `openclaw channels status --probe` pour les erreurs d'authentification ou l'absence de configuration d'audience.
- Si aucun message n'arrive, confirmez l'URL du webhook de l'application Chat et les abonnements aux événements.
- Si le filtrage par mention bloque les réponses, définissez `botUser` sur le nom de ressource utilisateur de l'application et vérifiez `requireMention`.
- Utilisez `openclaw logs --follow` pendant l'envoi d'un message de test pour voir si les requêtes atteignent la gateway.

Documentation associée :

- [Configuration de la gateway](/gateway/configuration)
- [Sécurité](/gateway/security)
- [Réactions](/tools/reactions)

## Lié

- [Vue d'ensemble des canaux](/channels) — tous les canaux pris en charge
- [Jumelage](/channels/pairing) — authentification en message privé et flux de jumelage
- [Groupes](/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/gateway/security) — modèle d'accès et durcissement
