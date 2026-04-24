---
read_when:
    - Vous voulez utiliser le Gateway depuis un navigateur
    - Vous voulez un accès Tailnet sans tunnels SSH
summary: Interface de contrôle basée sur le navigateur pour le Gateway (chat, nodes, configuration)
title: Interface de contrôle
x-i18n:
    generated_at: "2026-04-24T07:40:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ad0d0cef7d842eddf665ba50f37403df258b17d4c072d22a30d1bc3830dc467
    source_path: web/control-ui.md
    workflow: 15
---

L’interface de contrôle est une petite application monopage **Vite + Lit** servie par le Gateway :

- par défaut : `http://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par ex. `/openclaw`)

Elle communique **directement avec le WebSocket Gateway** sur le même port.

## Ouverture rapide (local)

Si le Gateway s’exécute sur le même ordinateur, ouvrez :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Si la page ne se charge pas, démarrez d’abord le Gateway : `openclaw gateway`.

L’authentification est fournie lors de la poignée de main WebSocket via :

- `connect.params.auth.token`
- `connect.params.auth.password`
- les en-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- les en-têtes d’identité trusted-proxy lorsque `gateway.auth.mode: "trusted-proxy"`

Le panneau des paramètres du tableau de bord conserve un jeton pour la session
de l’onglet actuel du navigateur et l’URL Gateway sélectionnée ; les mots de passe ne sont pas persistés. L’onboarding
génère généralement un jeton Gateway pour l’authentification à secret partagé à la première connexion, mais l’authentification
par mot de passe fonctionne aussi lorsque `gateway.auth.mode` vaut `"password"`.

## Appairage d’appareil (première connexion)

Lorsque vous vous connectez à l’interface de contrôle depuis un nouveau navigateur ou appareil, le Gateway
exige une **approbation d’appairage unique** — même si vous êtes sur le même Tailnet
avec `gateway.auth.allowTailscale: true`. Il s’agit d’une mesure de sécurité destinée à empêcher
les accès non autorisés.

**Ce que vous verrez :** "disconnected (1008): pairing required"

**Pour approuver l’appareil :**

```bash
# List pending requests
openclaw devices list

# Approve by request ID
openclaw devices approve <requestId>
```

Si le navigateur réessaie l’appairage avec des détails d’authentification modifiés (rôle/scopes/clé
publique), la demande en attente précédente est remplacée et un nouveau `requestId` est
créé. Réexécutez `openclaw devices list` avant l’approbation.

Si le navigateur est déjà appairé et que vous le faites passer d’un accès en lecture à un
accès en écriture/admin, cela est traité comme une montée d’approbation, et non comme une reconnexion silencieuse.
OpenClaw conserve l’ancienne approbation active, bloque la reconnexion élargie,
et vous demande d’approuver explicitement le nouvel ensemble de scopes.

Une fois approuvé, l’appareil est mémorisé et ne nécessitera pas de nouvelle approbation sauf
si vous le révoquez avec `openclaw devices revoke --device <id> --role <role>`. Voir
[CLI Devices](/fr/cli/devices) pour la rotation et la révocation des jetons.

**Remarques :**

- Les connexions directes de navigateur local loopback (`127.0.0.1` / `localhost`) sont
  approuvées automatiquement.
- Les connexions navigateur Tailnet et LAN exigent toujours une approbation explicite, même lorsqu’elles
  proviennent de la même machine.
- Chaque profil de navigateur génère un identifiant d’appareil unique, donc changer de navigateur ou
  effacer les données du navigateur nécessitera un nouvel appairage.

## Identité personnelle (locale au navigateur)

L’interface de contrôle prend en charge une identité personnelle par navigateur (nom d’affichage et
avatar) attachée aux messages sortants pour l’attribution dans les sessions partagées. Elle
réside dans le stockage du navigateur, est limitée au profil de navigateur actuel, et n’est pas
synchronisée avec d’autres appareils ni persistée côté serveur au-delà des métadonnées normales
d’auteur de transcription sur les messages que vous envoyez réellement. Effacer les données du site ou
changer de navigateur la réinitialise à vide.

## Endpoint de configuration runtime

L’interface de contrôle récupère ses paramètres runtime depuis
`/__openclaw/control-ui-config.json`. Cet endpoint est protégé par la même
authentification gateway que le reste de la surface HTTP : les navigateurs non authentifiés ne peuvent pas
le récupérer, et une récupération réussie exige soit un jeton/mot de passe Gateway déjà valide,
soit une identité Tailscale Serve, soit une identité trusted-proxy.

## Prise en charge des langues

L’interface de contrôle peut se localiser elle-même au premier chargement en fonction de la locale de votre navigateur.
Pour la remplacer ultérieurement, ouvrez **Overview -> Gateway Access -> Language**. Le
sélecteur de locale se trouve dans la carte Gateway Access, pas dans Appearance.

- Locales prises en charge : `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Les traductions non anglaises sont chargées à la demande dans le navigateur.
- La locale sélectionnée est enregistrée dans le stockage du navigateur et réutilisée lors des visites futures.
- Les clés de traduction manquantes reviennent à l’anglais.

## Ce qu’elle peut faire (aujourd’hui)

- Discuter avec le modèle via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Parler directement à OpenAI Realtime depuis le navigateur via WebRTC. Le Gateway
  génère un secret client Realtime de courte durée avec `talk.realtime.session` ; le
  navigateur envoie l’audio du microphone directement à OpenAI et relaie les appels d’outil
  `openclaw_agent_consult` via `chat.send` vers le plus grand
  modèle OpenClaw configuré.
- Diffuser les appels d’outils + les cartes de sortie d’outil en direct dans Chat (événements agent)
- Canaux : état des canaux intégrés ainsi que des plugins groupés/externes, connexion QR, et configuration par canal (`channels.status`, `web.login.*`, `config.patch`)
- Instances : liste de présence + actualisation (`system-presence`)
- Sessions : liste + remplacements par session pour modèle/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams : statut du Dreaming, bascule activation/désactivation et lecteur Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Tâches Cron : lister/ajouter/modifier/exécuter/activer/désactiver + historique d’exécution (`cron.*`)
- Skills : état, activation/désactivation, installation, mises à jour de clé API (`skills.*`)
- Nodes : liste + capacités (`node.list`)
- Approbations exec : modifier les listes d’autorisation gateway ou node + politique ask pour `exec host=gateway/node` (`exec.approvals.*`)
- Config : voir/modifier `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Config : appliquer + redémarrer avec validation (`config.apply`) et réveiller la dernière session active
- Les écritures de configuration incluent une garde par hash de base pour éviter d’écraser des modifications concurrentes
- Les écritures de configuration (`config.set`/`config.apply`/`config.patch`) effectuent aussi en prévol la résolution active de SecretRef pour les refs dans la charge utile de configuration soumise ; les refs actives soumises non résolues sont rejetées avant l’écriture
- Schéma de configuration + rendu de formulaire (`config.schema` / `config.schema.lookup`,
  y compris `title` / `description` de champ, indices d’UI correspondants, résumés immédiats des enfants,
  métadonnées de documentation sur les nœuds imbriqués objet/wildcard/tableau/composition,
  ainsi que les schémas de plugin + canal lorsque disponibles) ; l’éditeur Raw JSON n’est
  disponible que lorsque le snapshot a un aller-retour brut sûr
- Si un snapshot ne peut pas effectuer en toute sécurité un aller-retour de texte brut, l’interface de contrôle force le mode Form et désactive le mode Raw pour ce snapshot
- « Reset to saved » dans l’éditeur Raw JSON préserve la forme rédigée en brut (formatage, commentaires, disposition `$include`) au lieu de réafficher un snapshot aplati, afin que les modifications externes survivent à une réinitialisation lorsque le snapshot peut effectuer en toute sécurité un aller-retour
- Les valeurs d’objet SecretRef structurées sont rendues en lecture seule dans les entrées texte du formulaire pour éviter une corruption accidentelle objet-vers-chaîne
- Débogage : snapshots statut/health/models + journal d’événements + appels RPC manuels (`status`, `health`, `models.list`)
- Logs : suivi en direct des fichiers journaux du gateway avec filtre/export (`logs.tail`)
- Mise à jour : exécuter une mise à jour package/git + redémarrage (`update.run`) avec rapport de redémarrage

Remarques sur le panneau des tâches Cron :

- Pour les tâches isolées, la livraison par défaut est announce summary. Vous pouvez la passer à none si vous voulez des exécutions internes uniquement.
- Les champs canal/cible apparaissent lorsque announce est sélectionné.
- Le mode Webhook utilise `delivery.mode = "webhook"` avec `delivery.to` défini sur une URL Webhook HTTP(S) valide.
- Pour les tâches main-session, les modes de livraison webhook et none sont disponibles.
- Les contrôles d’édition avancée incluent delete-after-run, clear agent override, les options cron exact/stagger,
  les remplacements agent model/thinking, et les bascules de livraison best-effort.
- La validation du formulaire est intégrée avec des erreurs au niveau du champ ; les valeurs invalides désactivent le bouton d’enregistrement jusqu’à correction.
- Définissez `cron.webhookToken` pour envoyer un jeton bearer dédié ; s’il est omis, le webhook est envoyé sans en-tête d’authentification.
- Repli obsolète : les anciennes tâches stockées avec `notify: true` peuvent toujours utiliser `cron.webhook` jusqu’à migration.

## Comportement du chat

- `chat.send` est **non bloquant** : il accuse réception immédiatement avec `{ runId, status: "started" }` et la réponse est diffusée via des événements `chat`.
- Renvoyer avec la même `idempotencyKey` retourne `{ status: "in_flight" }` pendant l’exécution, et `{ status: "ok" }` après la fin.
- Les réponses `chat.history` sont bornées en taille pour la sécurité de l’UI. Lorsque les entrées de transcription sont trop volumineuses, Gateway peut tronquer les champs texte longs, omettre les blocs de métadonnées lourds, et remplacer les messages surdimensionnés par un placeholder (`[chat.history omitted: message too large]`).
- Les images assistant/générées sont persistées comme références de média gérées et resservies via des URLs média Gateway authentifiées, de sorte que les rechargements ne dépendent pas de la conservation des charges utiles image base64 brutes dans la réponse de l’historique du chat.
- `chat.history` supprime aussi les balises de directive inline réservées à l’affichage du texte assistant visible (par exemple `[[reply_to_*]]` et `[[audio_as_voice]]`), les charges utiles XML d’appel d’outil en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, et les blocs d’appel d’outil tronqués), ainsi que les jetons de contrôle de modèle ASCII/full-width divulgués, et omet les entrées assistant dont tout le texte visible est seulement le jeton silencieux exact `NO_REPLY` / `no_reply`.
- `chat.inject` ajoute une note assistant à la transcription de session et diffuse un événement `chat` pour les mises à jour UI uniquement (pas d’exécution d’agent, pas de livraison de canal).
- Les sélecteurs de modèle et de thinking dans l’en-tête du chat patchent immédiatement la session active via `sessions.patch` ; ce sont des remplacements persistants de session, et non des options d’envoi à usage unique.
- Le mode Talk utilise le fournisseur de voix temps réel enregistré. Configurez OpenAI avec
  `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, ou réutilisez la
  configuration du fournisseur temps réel Voice Call. Le navigateur ne reçoit jamais la clé API OpenAI standard ; il reçoit seulement le secret client Realtime éphémère. L’invite de session Realtime est assemblée par le Gateway ; `talk.realtime.session` n’accepte pas de remplacements d’instructions fournis par l’appelant.
- Dans le compositeur Chat, le contrôle Talk est le bouton en forme d’ondes à côté du
  bouton de dictée micro. Lorsque Talk démarre, la ligne d’état du compositeur affiche
  `Connecting Talk...`, puis `Talk live` pendant que l’audio est connecté, ou
  `Asking OpenClaw...` pendant qu’un appel d’outil temps réel consulte le plus grand
  modèle configuré via `chat.send`.
- Arrêt :
  - Cliquez sur **Stop** (appelle `chat.abort`)
  - Pendant qu’une exécution est active, les suivis normaux sont mis en file d’attente. Cliquez sur **Steer** sur un message en attente pour injecter ce suivi dans le tour en cours.
  - Tapez `/stop` (ou des phrases d’interruption autonomes comme `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) pour interrompre hors bande
  - `chat.abort` prend en charge `{ sessionKey }` (sans `runId`) pour interrompre toutes les exécutions actives de cette session
- Conservation partielle après interruption :
  - Lorsqu’une exécution est interrompue, du texte assistant partiel peut quand même être affiché dans l’UI
  - Gateway persiste le texte assistant partiel interrompu dans l’historique de transcription lorsqu’une sortie tamponnée existe
  - Les entrées persistées incluent des métadonnées d’interruption afin que les consommateurs de transcription puissent distinguer les partiels interrompus de la sortie normale de fin

## Intégrations hébergées

Les messages assistant peuvent afficher du contenu web hébergé en ligne avec le shortcode `[embed ...]`.
La politique sandbox iframe est contrôlée par
`gateway.controlUi.embedSandbox` :

- `strict` : désactive l’exécution de scripts dans les intégrations hébergées
- `scripts` : autorise les intégrations interactives tout en conservant l’isolation d’origine ; c’est
  la valeur par défaut et c’est généralement suffisant pour les jeux/widgets navigateur autonomes
- `trusted` : ajoute `allow-same-origin` en plus de `allow-scripts` pour les
  documents de même site qui ont intentionnellement besoin de privilèges plus élevés

Exemple :

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

Utilisez `trusted` uniquement lorsque le document intégré a réellement besoin d’un
comportement same-origin. Pour la plupart des jeux générés par agent et des canvases interactifs, `scripts` est
le choix le plus sûr.

Les URLs d’intégration externes absolues `http(s)` restent bloquées par défaut. Si vous
voulez intentionnellement que `[embed url="https://..."]` charge des pages tierces, définissez
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Accès Tailnet (recommandé)

### Tailscale Serve intégré (préféré)

Gardez le Gateway sur loopback et laissez Tailscale Serve le proxifier en HTTPS :

```bash
openclaw gateway --tailscale serve
```

Ouvrez :

- `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

Par défaut, les requêtes Serve de Control UI/WebSocket peuvent s’authentifier via les en-têtes d’identité Tailscale
(`tailscale-user-login`) lorsque `gateway.auth.allowTailscale` vaut `true`. OpenClaw
vérifie l’identité en résolvant l’adresse `x-forwarded-for` avec
`tailscale whois` et en la faisant correspondre à l’en-tête, et n’accepte ces en-têtes que lorsque la
requête atteint loopback avec les en-têtes `x-forwarded-*` de Tailscale. Définissez
`gateway.auth.allowTailscale: false` si vous voulez exiger des identifiants explicites à secret partagé
même pour le trafic Serve. Utilisez alors `gateway.auth.mode: "token"` ou
`"password"`.
Pour ce chemin d’identité Serve asynchrone, les tentatives d’authentification échouées pour la même IP cliente
et le même scope d’authentification sont sérialisées avant les écritures de limitation de débit. Des nouvelles tentatives invalides
concurrentes depuis le même navigateur peuvent donc afficher `retry later` sur la deuxième requête
au lieu de deux simples incompatibilités en course parallèle.
L’authentification Serve sans jeton suppose que l’hôte gateway est digne de confiance. Si du code local non digne de confiance
peut s’exécuter sur cet hôte, exigez une authentification par jeton/mot de passe.

### Lier à tailnet + jeton

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Puis ouvrez :

- `http://<tailscale-ip>:18789/` (ou votre `gateway.controlUi.basePath` configuré)

Collez le secret partagé correspondant dans les paramètres de l’UI (envoyé comme
`connect.params.auth.token` ou `connect.params.auth.password`).

## HTTP non sécurisé

Si vous ouvrez le tableau de bord en HTTP simple (`http://<lan-ip>` ou `http://<tailscale-ip>`),
le navigateur s’exécute dans un **contexte non sécurisé** et bloque WebCrypto. Par défaut,
OpenClaw **bloque** les connexions à l’interface de contrôle sans identité d’appareil.

Exceptions documentées :

- compatibilité HTTP non sécurisé localhost uniquement avec `gateway.controlUi.allowInsecureAuth=true`
- authentification opérateur réussie à l’interface de contrôle via `gateway.auth.mode: "trusted-proxy"`
- solution de secours `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correctif recommandé :** utilisez HTTPS (Tailscale Serve) ou ouvrez l’UI localement :

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sur l’hôte gateway)

**Comportement de la bascule d’authentification non sécurisée :**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` est uniquement une bascule de compatibilité locale :

- Elle permet aux sessions localhost de l’interface de contrôle de continuer sans identité d’appareil dans
  des contextes HTTP non sécurisés.
- Elle ne contourne pas les vérifications d’appairage.
- Elle n’assouplit pas les exigences d’identité d’appareil à distance (hors localhost).

**Solution de secours uniquement :**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` désactive les vérifications d’identité d’appareil de l’interface de contrôle et constitue une
forte dégradation de la sécurité. Revenez rapidement en arrière après usage d’urgence.

Remarque trusted-proxy :

- une authentification trusted-proxy réussie peut autoriser des sessions **opérateur** de l’interface de contrôle sans
  identité d’appareil
- cela ne s’étend **pas** aux sessions de l’interface de contrôle de rôle node
- les proxys inverses loopback sur le même hôte ne satisfont toujours pas l’authentification trusted-proxy ; voir
  [Authentification Trusted Proxy](/fr/gateway/trusted-proxy-auth)

Voir [Tailscale](/fr/gateway/tailscale) pour les conseils de configuration HTTPS.

## Politique de sécurité du contenu

L’interface de contrôle est fournie avec une politique `img-src` stricte : seuls les assets **same-origin** et les URLs `data:` sont autorisés. Les URLs d’image distantes `http(s)` et relatives au protocole sont rejetées par le navigateur et n’émettent aucune récupération réseau.

Ce que cela signifie en pratique :

- Les avatars et images servis sous des chemins relatifs (par exemple `/avatars/<id>`) s’affichent toujours.
- Les URLs inline `data:image/...` s’affichent toujours (utile pour les charges utiles dans le protocole).
- Les URLs d’avatar distantes émises par les métadonnées de canal sont supprimées au niveau des helpers d’avatar de l’interface de contrôle et remplacées par le logo/le badge intégré, de sorte qu’un canal compromis ou malveillant ne puisse pas forcer des récupérations d’image distantes arbitraires depuis le navigateur d’un opérateur.

Vous n’avez rien à changer pour obtenir ce comportement — il est toujours activé et non configurable.

## Authentification de la route avatar

Lorsque l’authentification gateway est configurée, l’endpoint avatar de l’interface de contrôle exige le même jeton gateway que le reste de l’API :

- `GET /avatar/<agentId>` ne renvoie l’image avatar qu’aux appelants authentifiés. `GET /avatar/<agentId>?meta=1` renvoie les métadonnées d’avatar selon la même règle.
- Les requêtes non authentifiées vers l’une ou l’autre route sont rejetées (comme la route sœur assistant-media). Cela empêche la route avatar de divulguer l’identité de l’agent sur des hôtes autrement protégés.
- L’interface de contrôle elle-même transmet le jeton gateway comme en-tête bearer lors de la récupération des avatars, et utilise des URLs blob authentifiées afin que l’image s’affiche toujours dans les tableaux de bord.

Si vous désactivez l’authentification gateway (non recommandé sur des hôtes partagés), la route avatar devient également non authentifiée, en cohérence avec le reste du gateway.

## Construction de l’UI

Le Gateway sert des fichiers statiques depuis `dist/control-ui`. Construisez-les avec :

```bash
pnpm ui:build
```

Base absolue facultative (lorsque vous voulez des URLs d’assets fixes) :

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Pour le développement local (serveur de développement séparé) :

```bash
pnpm ui:dev
```

Puis pointez l’UI vers l’URL WS de votre Gateway (par ex. `ws://127.0.0.1:18789`).

## Débogage/test : serveur de développement + Gateway distant

L’interface de contrôle est constituée de fichiers statiques ; la cible WebSocket est configurable et peut être
différente de l’origine HTTP. C’est pratique lorsque vous voulez le serveur de développement Vite
en local mais que le Gateway s’exécute ailleurs.

1. Démarrez le serveur de développement UI : `pnpm ui:dev`
2. Ouvrez une URL comme :

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Authentification ponctuelle facultative (si nécessaire) :

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Remarques :

- `gatewayUrl` est stocké dans localStorage après le chargement et retiré de l’URL.
- `token` doit être passé via le fragment d’URL (`#token=...`) chaque fois que possible. Les fragments ne sont pas envoyés au serveur, ce qui évite les fuites via journaux de requête et Referer. Les anciens paramètres de requête `?token=` sont encore importés une fois pour compatibilité, mais seulement comme repli, et sont supprimés immédiatement après le bootstrap.
- `password` est conservé uniquement en mémoire.
- Lorsque `gatewayUrl` est défini, l’UI ne retombe pas sur des identifiants issus de la configuration ou de l’environnement.
  Fournissez explicitement `token` (ou `password`). L’absence d’identifiants explicites est une erreur.
- Utilisez `wss://` lorsque le Gateway est derrière TLS (Tailscale Serve, proxy HTTPS, etc.).
- `gatewayUrl` n’est accepté que dans une fenêtre de premier niveau (pas intégrée) afin d’empêcher le clickjacking.
- Les déploiements d’interface de contrôle hors loopback doivent définir `gateway.controlUi.allowedOrigins`
  explicitement (origines complètes). Cela inclut les configurations de développement distantes.
- N’utilisez pas `gateway.controlUi.allowedOrigins: ["*"]` sauf pour des tests locaux très contrôlés.
  Cela signifie autoriser n’importe quelle origine de navigateur, pas « correspondre à l’hôte que j’utilise ».
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active
  le mode de repli d’origine par en-tête Host, mais c’est un mode de sécurité dangereux.

Exemple :

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Détails de configuration de l’accès distant : [Accès distant](/fr/gateway/remote).

## Associé

- [Dashboard](/fr/web/dashboard) — tableau de bord du gateway
- [WebChat](/fr/web/webchat) — interface de chat basée sur le navigateur
- [TUI](/fr/web/tui) — interface utilisateur terminal
- [Health Checks](/fr/gateway/health) — surveillance de l’état du gateway
