---
read_when:
    - Vous souhaitez utiliser le Gateway depuis un navigateur
    - Vous souhaitez un accès Tailnet sans tunnels SSH
summary: Interface de contrôle du Gateway dans le navigateur (chat, Nodes, configuration)
title: Interface de contrôle
x-i18n:
    generated_at: "2026-04-25T18:23:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29d77ae57e32abe5ad25b2c22986d9d8e67f7ac183af06e8ffc4907ae4e6c0bc
    source_path: web/control-ui.md
    workflow: 15
---

L’interface de contrôle est une petite application monopage **Vite + Lit** servie par le Gateway :

- par défaut : `http://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par ex. `/openclaw`)

Elle communique **directement avec le WebSocket du Gateway** sur le même port.

## Ouverture rapide (local)

Si le Gateway s’exécute sur le même ordinateur, ouvrez :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Si la page ne se charge pas, démarrez d’abord le Gateway : `openclaw gateway`.

L’authentification est fournie pendant la négociation WebSocket via :

- `connect.params.auth.token`
- `connect.params.auth.password`
- les en-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- les en-têtes d’identité de proxy de confiance lorsque `gateway.auth.mode: "trusted-proxy"`

Le panneau des paramètres du tableau de bord conserve un token pour la session
de l’onglet de navigateur courant et l’URL Gateway sélectionnée ; les mots de passe ne sont pas persistés. L’onboarding génère généralement un token Gateway pour l’authentification par secret partagé lors de la première connexion, mais l’authentification par mot de passe fonctionne aussi lorsque `gateway.auth.mode` vaut `"password"`.

## Appairage d’appareil (première connexion)

Lorsque vous vous connectez à l’interface de contrôle depuis un nouveau navigateur ou appareil, le Gateway exige une **approbation d’appairage à usage unique** — même si vous êtes sur le même Tailnet avec `gateway.auth.allowTailscale: true`. Il s’agit d’une mesure de sécurité pour empêcher les accès non autorisés.

**Ce que vous verrez :** « disconnected (1008): pairing required »

**Pour approuver l’appareil :**

```bash
# Lister les demandes en attente
openclaw devices list

# Approuver par ID de demande
openclaw devices approve <requestId>
```

Si le navigateur relance l’appairage avec des détails d’authentification modifiés (rôle/portées/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé. Réexécutez `openclaw devices list` avant l’approbation.

Si le navigateur est déjà appairé et que vous le faites passer d’un accès en lecture à un accès en écriture/admin, cela est traité comme une montée de niveau d’approbation, et non comme une reconnexion silencieuse. OpenClaw conserve l’ancienne approbation active, bloque la reconnexion plus large et vous demande d’approuver explicitement le nouvel ensemble de portées.

Une fois approuvé, l’appareil est mémorisé et ne nécessitera pas de nouvelle approbation sauf si vous le révoquez avec `openclaw devices revoke --device <id> --role <role>`. Voir [CLI Devices](/fr/cli/devices) pour la rotation de token et la révocation.

**Notes :**

- Les connexions directes locales loopback depuis le navigateur (`127.0.0.1` / `localhost`) sont approuvées automatiquement.
- Les connexions navigateur via Tailnet et LAN nécessitent toujours une approbation explicite, même lorsqu’elles proviennent de la même machine.
- Chaque profil de navigateur génère un identifiant d’appareil unique ; changer de navigateur ou effacer les données du navigateur nécessitera donc un nouvel appairage.

## Identité personnelle (locale au navigateur)

L’interface de contrôle prend en charge une identité personnelle par navigateur (nom d’affichage et avatar) jointe aux messages sortants pour l’attribution dans les sessions partagées. Elle est stockée dans le navigateur, limitée au profil de navigateur courant, et n’est ni synchronisée vers d’autres appareils ni persistée côté serveur au-delà des métadonnées normales d’auteur du transcript sur les messages que vous envoyez réellement. Effacer les données du site ou changer de navigateur la réinitialise à vide.

Le même schéma local au navigateur s’applique à la surcharge d’avatar de l’assistant.
Les avatars d’assistant téléversés se superposent à l’identité résolue par le gateway uniquement dans le navigateur local et ne transitent jamais via `config.patch`. Le champ de configuration partagé `ui.assistant.avatar` reste disponible pour les clients non UI qui écrivent directement ce champ (comme les gateways scriptés ou les tableaux de bord personnalisés).

## Point de terminaison de configuration runtime

L’interface de contrôle récupère ses paramètres runtime depuis
`/__openclaw/control-ui-config.json`. Ce point de terminaison est protégé par la même authentification gateway que le reste de la surface HTTP : les navigateurs non authentifiés ne peuvent pas le récupérer, et une récupération réussie exige soit un token/mot de passe gateway déjà valide, soit une identité Tailscale Serve, soit une identité de proxy de confiance.

## Prise en charge des langues

L’interface de contrôle peut se localiser elle-même au premier chargement en fonction de la langue de votre navigateur.
Pour la modifier ensuite, ouvrez **Overview -> Gateway Access -> Language**. Le sélecteur de langue se trouve dans la carte Gateway Access, et non dans Appearance.

- Langues prises en charge : `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Les traductions non anglaises sont chargées à la demande dans le navigateur.
- La langue sélectionnée est enregistrée dans le stockage du navigateur et réutilisée lors des visites futures.
- Les clés de traduction manquantes reviennent à l’anglais.

## Ce qu’elle peut faire (aujourd’hui)

- Discuter avec le modèle via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Parler directement à OpenAI Realtime depuis le navigateur via WebRTC. Le Gateway
  génère un secret client Realtime de courte durée avec `talk.realtime.session` ; le
  navigateur envoie l’audio du microphone directement à OpenAI et relaie les appels d’outil
  `openclaw_agent_consult` via `chat.send` pour le modèle OpenClaw configuré plus large.
- Diffuser les appels d’outils + les cartes de sortie d’outil live dans le chat (événements d’agent)
- Canaux : statut des canaux intégrés ainsi que des canaux de Plugin groupés/externes, connexion QR et configuration par canal (`channels.status`, `web.login.*`, `config.patch`)
- Instances : liste de présence + actualisation (`system-presence`)
- Sessions : liste + surcharges par session de modèle/réflexion/rapide/verbose/trace/raisonnement (`sessions.list`, `sessions.patch`)
- Dreams : statut de Dreaming, bascule activer/désactiver et lecteur de Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Tâches Cron : lister/ajouter/modifier/exécuter/activer/désactiver + historique d’exécution (`cron.*`)
- Skills : statut, activer/désactiver, installer, mises à jour de clé API (`skills.*`)
- Nodes : liste + capacités (`node.list`)
- Approbations Exec : modifier les listes d’autorisation du gateway ou du Node + stratégie ask pour `exec host=gateway/node` (`exec.approvals.*`)
- Configuration : afficher/modifier `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configuration : appliquer + redémarrer avec validation (`config.apply`) et réveiller la dernière session active
- Les écritures de configuration incluent une protection par hash de base pour éviter d’écraser des modifications concurrentes
- Les écritures de configuration (`config.set`/`config.apply`/`config.patch`) précontrôlent également la résolution active de SecretRef pour les refs dans la charge utile de configuration soumise ; les refs actives soumises non résolues sont rejetées avant l’écriture
- Schéma de configuration + rendu de formulaire (`config.schema` / `config.schema.lookup`,
  y compris `title` / `description` des champs, indices UI correspondants, résumés
  immédiats des enfants, métadonnées de documentation sur les nœuds imbriqués objet/joker/tableau/composition,
  ainsi que les schémas de Plugin + de canal lorsqu’ils sont disponibles) ; l’éditeur JSON brut est
  disponible uniquement lorsque le snapshot prend en charge un aller-retour brut sûr
- Si un snapshot ne peut pas effectuer un aller-retour sûr en texte brut, l’interface de contrôle force le mode Form et désactive le mode Raw pour ce snapshot
- L’action « Reset to saved » de l’éditeur JSON brut préserve la forme rédigée brute (mise en forme, commentaires, structure `$include`) au lieu de rerendre un snapshot aplati, de sorte que les modifications externes survivent à une réinitialisation lorsque le snapshot peut effectuer un aller-retour sûr
- Les valeurs d’objet SecretRef structurées sont rendues en lecture seule dans les champs texte du formulaire afin d’éviter toute corruption accidentelle objet-vers-chaîne
- Débogage : snapshots de statut/santé/modèles + journal d’événements + appels RPC manuels (`status`, `health`, `models.list`)
- Journaux : tail en direct des journaux de fichiers du gateway avec filtrage/export (`logs.tail`)
- Mise à jour : exécuter une mise à jour package/git + redémarrage (`update.run`) avec rapport de redémarrage

Notes sur le panneau des tâches Cron :

- Pour les tâches isolées, la remise utilise par défaut un résumé d’annonce. Vous pouvez passer à none si vous souhaitez des exécutions internes uniquement.
- Les champs canal/cible apparaissent lorsque announce est sélectionné.
- Le mode Webhook utilise `delivery.mode = "webhook"` avec `delivery.to` défini sur une URL Webhook HTTP(S) valide.
- Pour les tâches de session principale, les modes de remise webhook et none sont disponibles.
- Les contrôles d’édition avancée incluent delete-after-run, l’effacement de la surcharge d’agent, les options Cron exact/stagger,
  les surcharges de modèle/réflexion de l’agent, et les bascules de remise best-effort.
- La validation du formulaire est inline avec des erreurs au niveau des champs ; les valeurs invalides désactivent le bouton d’enregistrement jusqu’à correction.
- Définissez `cron.webhookToken` pour envoyer un bearer token dédié ; s’il est omis, le webhook est envoyé sans en-tête d’authentification.
- Solution de repli dépréciée : les anciennes tâches stockées avec `notify: true` peuvent toujours utiliser `cron.webhook` jusqu’à leur migration.

## Comportement du chat

- `chat.send` est **non bloquant** : il accuse réception immédiatement avec `{ runId, status: "started" }` et la réponse est diffusée via des événements `chat`.
- Un nouvel envoi avec la même `idempotencyKey` renvoie `{ status: "in_flight" }` pendant l’exécution, puis `{ status: "ok" }` après la fin.
- Les réponses `chat.history` sont bornées en taille pour la sécurité de l’UI. Lorsque les entrées du transcript sont trop volumineuses, Gateway peut tronquer les champs de texte longs, omettre les blocs de métadonnées lourds, et remplacer les messages surdimensionnés par un espace réservé (`[chat.history omitted: message too large]`).
- Les images assistant/générées sont persistées comme références média gérées et resservies via des URL média Gateway authentifiées, de sorte que les rechargements ne dépendent pas du maintien des charges utiles d’image base64 brutes dans la réponse de l’historique du chat.
- `chat.history` retire aussi du texte assistant visible les balises de directive inline réservées à l’affichage (par exemple `[[reply_to_*]]` et `[[audio_as_voice]]`), les charges utiles XML d’appel d’outil en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appel d’outil tronqués), ainsi que les tokens de contrôle de modèle divulgués en ASCII/pleine largeur, et omet les entrées assistant dont tout le texte visible correspond uniquement au token silencieux exact `NO_REPLY` / `no_reply`.
- Pendant un envoi actif et l’actualisation finale de l’historique, la vue de chat conserve visibles les messages utilisateur/assistant optimistes locaux si `chat.history` renvoie brièvement un snapshot plus ancien ; le transcript canonique remplace ces messages locaux une fois que l’historique Gateway a rattrapé son retard.
- `chat.inject` ajoute une note assistant au transcript de session et diffuse un événement `chat` pour les mises à jour UI uniquement (aucune exécution d’agent, aucune remise au canal).
- Les sélecteurs de modèle et de réflexion de l’en-tête du chat patchent immédiatement la session active via `sessions.patch` ; ce sont des surcharges de session persistantes, pas des options d’envoi limitées à un seul tour.
- Lorsque les rapports récents d’usage de session Gateway montrent une forte pression de contexte, la zone du compositeur de chat affiche un avis de contexte et, aux niveaux de Compaction recommandés, un bouton de Compaction qui exécute le chemin normal de Compaction de session. Les snapshots de tokens obsolètes sont masqués jusqu’à ce que Gateway signale à nouveau un usage récent.
- Le mode Talk utilise un fournisseur vocal Realtime enregistré prenant en charge les sessions WebRTC dans le navigateur. Configurez OpenAI avec `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, ou réutilisez la configuration du fournisseur Realtime de Voice Call. Le navigateur ne reçoit jamais la clé API OpenAI standard ; il reçoit uniquement le secret client Realtime éphémère. Google Live realtime voice est pris en charge pour Voice Call backend et les ponts Google Meet, mais pas encore pour ce chemin WebRTC navigateur. Le prompt de session Realtime est assemblé par Gateway ; `talk.realtime.session` n’accepte pas de surcharges d’instructions fournies par l’appelant.
- Dans le compositeur Chat, le contrôle Talk est le bouton en forme d’ondes à côté du bouton de dictée microphone. Lorsque Talk démarre, la ligne d’état du compositeur affiche `Connecting Talk...`, puis `Talk live` une fois l’audio connecté, ou `Asking OpenClaw...` lorsqu’un appel d’outil realtime consulte le modèle OpenClaw configuré plus large via `chat.send`.
- Arrêt :
  - Cliquez sur **Stop** (appelle `chat.abort`)
  - Lorsqu’une exécution est active, les suivis normaux sont mis en file d’attente. Cliquez sur **Steer** sur un message en file pour injecter ce suivi dans le tour en cours.
  - Tapez `/stop` (ou des formulations autonomes d’abandon comme `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) pour interrompre hors bande
  - `chat.abort` prend en charge `{ sessionKey }` (sans `runId`) pour interrompre toutes les exécutions actives de cette session
- Conservation partielle après interruption :
  - Lorsqu’une exécution est interrompue, un texte assistant partiel peut quand même être affiché dans l’UI
  - Gateway persiste le texte assistant partiel interrompu dans l’historique du transcript lorsqu’une sortie tamponnée existe
  - Les entrées persistées incluent des métadonnées d’interruption afin que les consommateurs du transcript puissent distinguer les partiels interrompus d’une sortie de fin normale

## Installation PWA et push web

L’interface de contrôle livre un `manifest.webmanifest` et un service worker, de sorte que
les navigateurs modernes peuvent l’installer comme PWA autonome. Web Push permet au
Gateway de réveiller la PWA installée avec des notifications même lorsque l’onglet ou la
fenêtre du navigateur n’est pas ouvert.

| Surface                                               | Ce qu’elle fait                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Les navigateurs proposent « Installer l’app » une fois qu’il est accessible. |
| `ui/public/sw.js`                                     | Service worker qui gère les événements `push` et les clics sur notification. |
| `push/vapid-keys.json` (sous le répertoire d’état OpenClaw) | Paire de clés VAPID générée automatiquement utilisée pour signer les charges utiles Web Push. |
| `push/web-push-subscriptions.json`                    | Points de terminaison d’abonnement navigateur persistés.           |

Remplacez la paire de clés VAPID via des variables d’environnement sur le processus Gateway si
vous voulez épingler les clés (pour les déploiements multi-hôtes, la rotation des secrets, ou
les tests) :

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (valeur par défaut : `mailto:openclaw@localhost`)

L’interface de contrôle utilise ces méthodes Gateway à portée contrôlée pour enregistrer et
tester les abonnements navigateur :

- `push.web.vapidPublicKey` — récupère la clé publique VAPID active.
- `push.web.subscribe` — enregistre un `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — supprime un point de terminaison enregistré.
- `push.web.test` — envoie une notification de test à l’abonnement de l’appelant.

Web Push est indépendant du chemin de relais APNS iOS
(voir [Configuration](/fr/gateway/configuration) pour le push adossé à un relais) et
de la méthode existante `push.test`, qui cible l’appairage mobile natif.

## Embeds hébergés

Les messages assistant peuvent rendre du contenu web hébergé inline avec le shortcode `[embed ...]`.
La politique sandbox iframe est contrôlée par
`gateway.controlUi.embedSandbox` :

- `strict` : désactive l’exécution de scripts dans les embeds hébergés
- `scripts` : autorise les embeds interactifs tout en conservant l’isolation d’origine ; c’est
  la valeur par défaut et elle suffit généralement pour les jeux/widgets navigateur autonomes
- `trusted` : ajoute `allow-same-origin` à `allow-scripts` pour les
  documents du même site qui ont volontairement besoin de privilèges plus étendus

Exemple :

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

Utilisez `trusted` uniquement lorsque le document embarqué a réellement besoin d’un
comportement same-origin. Pour la plupart des jeux et canvas interactifs générés par agent, `scripts` est
le choix le plus sûr.

Les URL d’embed externes absolues `http(s)` restent bloquées par défaut. Si vous
souhaitez volontairement charger des pages tierces avec `[embed url="https://..."]`, définissez
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Accès Tailnet (recommandé)

### Tailscale Serve intégré (préféré)

Conservez le Gateway sur loopback et laissez Tailscale Serve le proxyfier en HTTPS :

```bash
openclaw gateway --tailscale serve
```

Ouvrez :

- `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

Par défaut, les requêtes Serve Control UI/WebSocket peuvent s’authentifier via les en-têtes d’identité Tailscale
(`tailscale-user-login`) lorsque `gateway.auth.allowTailscale` vaut `true`. OpenClaw
vérifie l’identité en résolvant l’adresse `x-forwarded-for` avec
`tailscale whois` et en la comparant à l’en-tête, et n’accepte cela que lorsque la
requête atteint loopback avec les en-têtes `x-forwarded-*` de Tailscale. Définissez
`gateway.auth.allowTailscale: false` si vous souhaitez exiger des identifiants explicites à secret partagé
même pour le trafic Serve. Utilisez ensuite `gateway.auth.mode: "token"` ou
`"password"`.
Pour ce chemin asynchrone d’identité Serve, les tentatives d’authentification échouées pour le même IP client
et la même portée d’authentification sont sérialisées avant les écritures de limitation de débit. Des nouvelles tentatives invalides concurrentes
depuis le même navigateur peuvent donc afficher `retry later` à la deuxième requête
au lieu de deux échecs simples en parallèle.
L’authentification Serve sans token suppose que l’hôte gateway est digne de confiance. Si du code local non fiable
peut s’exécuter sur cet hôte, exigez une authentification par token/mot de passe.

### Bind au tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Ouvrez ensuite :

- `http://<tailscale-ip>:18789/` (ou votre `gateway.controlUi.basePath` configuré)

Collez le secret partagé correspondant dans les paramètres UI (envoyé sous forme de
`connect.params.auth.token` ou `connect.params.auth.password`).

## HTTP non sécurisé

Si vous ouvrez le tableau de bord en HTTP simple (`http://<lan-ip>` ou `http://<tailscale-ip>`),
le navigateur fonctionne dans un **contexte non sécurisé** et bloque WebCrypto. Par défaut,
OpenClaw **bloque** les connexions de l’interface de contrôle sans identité d’appareil.

Exceptions documentées :

- compatibilité HTTP non sécurisé localhost uniquement avec `gateway.controlUi.allowInsecureAuth=true`
- authentification opérateur réussie dans l’interface de contrôle via `gateway.auth.mode: "trusted-proxy"`
- procédure d’exception `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correctif recommandé :** utilisez HTTPS (Tailscale Serve) ou ouvrez l’UI localement :

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sur l’hôte gateway)

**Comportement de la bascule d’authentification non sécurisée :**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` n’est qu’une bascule de compatibilité locale :

- Elle permet aux sessions de l’interface de contrôle sur localhost de se poursuivre sans identité d’appareil dans
  des contextes HTTP non sécurisés.
- Elle ne contourne pas les vérifications d’appairage.
- Elle n’assouplit pas les exigences d’identité d’appareil à distance (hors localhost).

**Procédure d’exception uniquement :**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` désactive les vérifications d’identité d’appareil de l’interface de contrôle et constitue
une forte dégradation de sécurité. Revenez rapidement en arrière après usage d’urgence.

Note sur trusted-proxy :

- une authentification trusted-proxy réussie peut autoriser des sessions **operator** de l’interface de contrôle sans
  identité d’appareil
- cela ne s’étend **pas** aux sessions de l’interface de contrôle de rôle node
- les proxys inverses loopback sur le même hôte ne satisfont toujours pas l’authentification trusted-proxy ; voir
  [Authentification trusted proxy](/fr/gateway/trusted-proxy-auth)

Voir [Tailscale](/fr/gateway/tailscale) pour les indications de configuration HTTPS.

## Content Security Policy

L’interface de contrôle est livrée avec une politique `img-src` stricte : seuls les assets **same-origin**, les URL `data:` et les URL `blob:` générées localement sont autorisés. Les URL d’image distantes `http(s)` et relatives au protocole sont rejetées par le navigateur et n’émettent aucune récupération réseau.

Ce que cela signifie concrètement :

- Les avatars et images servis sous des chemins relatifs (par exemple `/avatars/<id>`) continuent d’être rendus, y compris les routes d’avatar authentifiées que l’UI récupère et convertit en URL `blob:` locales.
- Les URL inline `data:image/...` continuent d’être rendues (utile pour les charges utiles in-protocol).
- Les URL `blob:` locales créées par l’interface de contrôle continuent d’être rendues.
- Les URL d’avatar distantes émises par les métadonnées de canal sont retirées dans les helpers d’avatar de l’interface de contrôle et remplacées par le logo/badge intégré, de sorte qu’un canal compromis ou malveillant ne puisse pas forcer des récupérations arbitraires d’images distantes depuis le navigateur d’un opérateur.

Vous n’avez rien à changer pour obtenir ce comportement — il est toujours actif et n’est pas configurable.

## Authentification de la route d’avatar

Lorsque l’authentification gateway est configurée, le point de terminaison d’avatar de l’interface de contrôle requiert le même token gateway que le reste de l’API :

- `GET /avatar/<agentId>` renvoie l’image d’avatar uniquement aux appelants authentifiés. `GET /avatar/<agentId>?meta=1` renvoie les métadonnées d’avatar selon la même règle.
- Les requêtes non authentifiées vers l’une ou l’autre route sont rejetées (comme pour la route sœur assistant-media). Cela empêche la route d’avatar de divulguer l’identité d’un agent sur des hôtes autrement protégés.
- L’interface de contrôle elle-même transmet le token gateway comme en-tête bearer lors de la récupération des avatars, et utilise des URL blob authentifiées pour que l’image continue d’être rendue dans les tableaux de bord.

Si vous désactivez l’authentification gateway (déconseillé sur des hôtes partagés), la route d’avatar devient également non authentifiée, conformément au reste du gateway.

## Construire l’UI

Le Gateway sert des fichiers statiques depuis `dist/control-ui`. Construisez-les avec :

```bash
pnpm ui:build
```

Base absolue facultative (lorsque vous voulez des URL d’assets fixes) :

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Pour le développement local (serveur de développement séparé) :

```bash
pnpm ui:dev
```

Pointez ensuite l’UI vers l’URL WS de votre Gateway (par ex. `ws://127.0.0.1:18789`).

## Débogage/test : serveur de développement + Gateway distant

L’interface de contrôle est constituée de fichiers statiques ; la cible WebSocket est configurable et peut être différente de l’origine HTTP. C’est pratique lorsque vous voulez le serveur de développement Vite en local mais que le Gateway s’exécute ailleurs.

1. Démarrez le serveur de développement UI : `pnpm ui:dev`
2. Ouvrez une URL comme :

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Authentification ponctuelle facultative (si nécessaire) :

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Notes :

- `gatewayUrl` est stocké dans localStorage après chargement puis retiré de l’URL.
- `token` doit être transmis via le fragment d’URL (`#token=...`) autant que possible. Les fragments ne sont pas envoyés au serveur, ce qui évite les fuites dans les journaux de requêtes et l’en-tête Referer. Les anciens paramètres de requête `?token=` sont encore importés une fois pour compatibilité, mais uniquement en solution de repli, et sont retirés immédiatement après le bootstrap.
- `password` est conservé uniquement en mémoire.
- Lorsque `gatewayUrl` est défini, l’UI ne revient pas aux identifiants fournis par la configuration ou l’environnement.
  Fournissez `token` (ou `password`) explicitement. L’absence d’identifiants explicites est une erreur.
- Utilisez `wss://` lorsque le Gateway est derrière TLS (Tailscale Serve, proxy HTTPS, etc.).
- `gatewayUrl` n’est accepté que dans une fenêtre de niveau supérieur (pas embarquée) afin d’éviter le clickjacking.
- Les déploiements de l’interface de contrôle hors loopback doivent définir explicitement `gateway.controlUi.allowedOrigins`
  (origines complètes). Cela inclut les configurations de développement distantes.
- N’utilisez pas `gateway.controlUi.allowedOrigins: ["*"]` sauf pour des tests locaux
  strictement contrôlés. Cela signifie autoriser n’importe quelle origine de navigateur, et non « faire correspondre l’hôte que j’utilise ».
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active le
  mode de repli d’origine basé sur l’en-tête Host, mais c’est un mode de sécurité dangereux.

Exemple :

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Détails de configuration pour l’accès distant : [Accès distant](/fr/gateway/remote).

## Lié

- [Tableau de bord](/fr/web/dashboard) — tableau de bord gateway
- [WebChat](/fr/web/webchat) — interface de chat dans le navigateur
- [TUI](/fr/web/tui) — interface utilisateur en terminal
- [Vérifications d’état](/fr/gateway/health) — surveillance de l’état du gateway
