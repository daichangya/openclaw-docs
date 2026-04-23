---
read_when:
    - Vous voulez utiliser la Gateway depuis un navigateur
    - Vous voulez un accès Tailnet sans tunnels SSH
summary: Interface de contrôle Web pour la Gateway (chat, Nodes, configuration)
title: Interface de contrôle
x-i18n:
    generated_at: "2026-04-23T14:03:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce0ed08db83a04d47122c5ada0507d6a9e4c725f8ad4fa8f62cb5d4f0412bfc6
    source_path: web/control-ui.md
    workflow: 15
---

# Interface de contrôle (navigateur)

L’interface de contrôle est une petite application monopage **Vite + Lit** servie par la Gateway :

- par défaut : `http://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par exemple `/openclaw`)

Elle communique **directement avec le WebSocket de la Gateway** sur le même port.

## Ouverture rapide (local)

Si la Gateway s’exécute sur le même ordinateur, ouvrez :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Si la page ne se charge pas, démarrez d’abord la Gateway : `openclaw gateway`.

L’authentification est fournie pendant la négociation WebSocket via :

- `connect.params.auth.token`
- `connect.params.auth.password`
- les en-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- les en-têtes d’identité de proxy approuvé lorsque `gateway.auth.mode: "trusted-proxy"`

Le panneau des paramètres du tableau de bord conserve un jeton pour la session de l’onglet actuel du navigateur
et l’URL de Gateway sélectionnée ; les mots de passe ne sont pas persistés. L’onboarding
génère généralement un jeton de Gateway pour l’authentification par secret partagé lors de la première connexion,
mais l’authentification par mot de passe fonctionne aussi lorsque `gateway.auth.mode` vaut `"password"`.

## Appairage d’appareil (première connexion)

Lorsque vous vous connectez à l’interface de contrôle depuis un nouveau navigateur ou un nouvel appareil, la Gateway
exige une **approbation d’appairage à usage unique** — même si vous êtes sur le même Tailnet
avec `gateway.auth.allowTailscale: true`. Il s’agit d’une mesure de sécurité pour empêcher
les accès non autorisés.

**Ce que vous verrez :** « disconnected (1008): pairing required »

**Pour approuver l’appareil :**

```bash
# Lister les demandes en attente
openclaw devices list

# Approuver par ID de demande
openclaw devices approve <requestId>
```

Si le navigateur réessaie l’appairage avec des détails d’authentification modifiés (rôle/portées/clé
publique), la demande en attente précédente est remplacée et un nouveau `requestId` est
créé. Relancez `openclaw devices list` avant l’approbation.

Si le navigateur est déjà appairé et que vous le faites passer d’un accès en lecture à un
accès en écriture/admin, cela est traité comme une montée de niveau d’approbation, et non comme une reconnexion silencieuse.
OpenClaw conserve l’ancienne approbation active, bloque la reconnexion élargie,
et vous demande d’approuver explicitement le nouvel ensemble de portées.

Une fois approuvé, l’appareil est mémorisé et ne nécessitera pas de nouvelle approbation sauf
si vous le révoquez avec `openclaw devices revoke --device <id> --role <role>`. Consultez
[CLI Devices](/fr/cli/devices) pour la rotation et la révocation des jetons.

**Remarques :**

- Les connexions directes locales via local loopback (`127.0.0.1` / `localhost`) sont
  auto-approuvées.
- Les connexions navigateur Tailnet et LAN nécessitent toujours une approbation explicite, même lorsqu’elles
  proviennent de la même machine.
- Chaque profil de navigateur génère un ID d’appareil unique, donc changer de navigateur ou
  effacer les données du navigateur nécessitera un nouvel appairage.

## Identité personnelle (locale au navigateur)

L’interface de contrôle prend en charge une identité personnelle par navigateur (nom d’affichage et
avatar) jointe aux messages sortants pour l’attribution dans les sessions partagées. Elle
est stockée dans le navigateur, limitée au profil actuel du navigateur, et n’est pas
synchronisée vers d’autres appareils ni persistée côté serveur au-delà des métadonnées normales
d’auteur dans la transcription pour les messages que vous envoyez réellement. Effacer les données du site ou
changer de navigateur la réinitialise à vide.

## Endpoint de configuration runtime

L’interface de contrôle récupère ses paramètres runtime depuis
`/__openclaw/control-ui-config.json`. Cet endpoint est protégé par la même
authentification Gateway que le reste de la surface HTTP : les navigateurs non authentifiés ne peuvent pas
le récupérer, et une récupération réussie nécessite soit un jeton/mot de passe de Gateway déjà valide,
soit une identité Tailscale Serve, soit une identité de proxy approuvé.

## Prise en charge des langues

L’interface de contrôle peut se localiser au premier chargement en fonction de la langue de votre navigateur.
Pour la remplacer plus tard, ouvrez **Overview -> Gateway Access -> Language**. Le
sélecteur de langue se trouve dans la carte Gateway Access, pas sous Appearance.

- Langues prises en charge : `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Les traductions non anglaises sont chargées à la demande dans le navigateur.
- La langue sélectionnée est enregistrée dans le stockage du navigateur et réutilisée lors des visites futures.
- Les clés de traduction manquantes reviennent à l’anglais.

## Ce qu’elle peut faire (aujourd’hui)

- Discuter avec le modèle via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Diffuser les appels d’outils + les cartes de sortie d’outil en direct dans Chat (événements d’agent)
- Canaux : état des canaux intégrés ainsi que des canaux de plugins intégrés/externes, connexion QR, et configuration par canal (`channels.status`, `web.login.*`, `config.patch`)
- Instances : liste de présence + actualisation (`system-presence`)
- Sessions : liste + surcharges par session du modèle/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams : état de Dreaming, activation/désactivation, et lecteur de Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Tâches Cron : lister/ajouter/modifier/exécuter/activer/désactiver + historique d’exécution (`cron.*`)
- Skills : état, activation/désactivation, installation, mises à jour de clé API (`skills.*`)
- Nodes : liste + plafonds (`node.list`)
- Approbations exec : modifier les listes d’autorisation Gateway ou Node + demander la politique pour `exec host=gateway/node` (`exec.approvals.*`)
- Configuration : voir/modifier `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configuration : appliquer + redémarrer avec validation (`config.apply`) et réveiller la dernière session active
- Les écritures de configuration incluent une protection par hash de base pour éviter d’écraser des modifications concurrentes
- Les écritures de configuration (`config.set`/`config.apply`/`config.patch`) effectuent aussi en amont la résolution active des SecretRef pour les références dans la charge utile de configuration soumise ; les références actives soumises non résolues sont rejetées avant l’écriture
- Schéma de configuration + rendu de formulaire (`config.schema` / `config.schema.lookup`,
  y compris les `title` / `description` de champ, les indications UI correspondantes, les résumés immédiats des enfants,
  les métadonnées de documentation sur les nœuds imbriqués objet/joker/tableau/composition,
  ainsi que les schémas de Plugin + de canal lorsqu’ils sont disponibles) ; l’éditeur JSON brut n’est
  disponible que lorsque l’instantané permet un aller-retour brut sûr
- Si un instantané ne peut pas faire un aller-retour sûr du texte brut, l’interface de contrôle force le mode Form et désactive le mode Raw pour cet instantané
- L’option « Reset to saved » de l’éditeur JSON brut préserve la forme rédigée en brut (mise en forme, commentaires, disposition `$include`) au lieu de réafficher un instantané aplati, afin que les modifications externes survivent à une réinitialisation lorsque l’instantané peut faire un aller-retour sûr
- Les valeurs d’objet SecretRef structurées sont rendues en lecture seule dans les champs texte des formulaires pour empêcher toute corruption accidentelle d’objet en chaîne
- Débogage : instantanés d’état/santé/modèles + journal d’événements + appels RPC manuels (`status`, `health`, `models.list`)
- Logs : suivi en direct des logs de fichier de la Gateway avec filtre/export (`logs.tail`)
- Mise à jour : exécuter une mise à jour package/git + redémarrage (`update.run`) avec un rapport de redémarrage

Remarques sur le panneau des tâches Cron :

- Pour les tâches isolées, le mode de livraison par défaut est announce summary. Vous pouvez le passer à none si vous voulez des exécutions internes uniquement.
- Les champs canal/cible apparaissent lorsque announce est sélectionné.
- Le mode Webhook utilise `delivery.mode = "webhook"` avec `delivery.to` défini sur une URL Webhook HTTP(S) valide.
- Pour les tâches de session principale, les modes de livraison webhook et none sont disponibles.
- Les contrôles de modification avancés incluent delete-after-run, clear agent override, les options exact/stagger de Cron,
  les surcharges de modèle/thinking d’agent, et les bascules de livraison best-effort.
- La validation du formulaire est inline avec des erreurs au niveau des champs ; les valeurs invalides désactivent le bouton d’enregistrement jusqu’à correction.
- Définissez `cron.webhookToken` pour envoyer un jeton bearer dédié ; s’il est omis, le Webhook est envoyé sans en-tête d’authentification.
- Repli obsolète : les anciennes tâches stockées avec `notify: true` peuvent encore utiliser `cron.webhook` jusqu’à leur migration.

## Comportement du chat

- `chat.send` est **non bloquant** : il accuse réception immédiatement avec `{ runId, status: "started" }` et la réponse est diffusée via des événements `chat`.
- Un nouvel envoi avec la même `idempotencyKey` renvoie `{ status: "in_flight" }` pendant l’exécution, et `{ status: "ok" }` après achèvement.
- Les réponses `chat.history` sont bornées en taille pour la sécurité de l’UI. Lorsque les entrées de transcription sont trop volumineuses, la Gateway peut tronquer les champs de texte longs, omettre les blocs de métadonnées lourds, et remplacer les messages surdimensionnés par un espace réservé (`[chat.history omitted: message too large]`).
- `chat.history` retire aussi les balises de directives inline réservées à l’affichage du texte visible de l’assistant (par exemple `[[reply_to_*]]` et `[[audio_as_voice]]`), les charges utiles XML d’appel d’outil en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, et les blocs tronqués d’appel d’outil), ainsi que les jetons de contrôle de modèle ASCII/pleine largeur divulgués, et omet les entrées d’assistant dont tout le texte visible est uniquement le jeton silencieux exact `NO_REPLY` / `no_reply`.
- `chat.inject` ajoute une note d’assistant à la transcription de session et diffuse un événement `chat` pour les mises à jour UI uniquement (pas d’exécution d’agent, pas de livraison au canal).
- Les sélecteurs de modèle et de thinking dans l’en-tête du chat patchent immédiatement la session active via `sessions.patch` ; ce sont des surcharges persistantes de session, pas des options d’envoi pour un seul tour.
- Arrêt :
  - Cliquez sur **Stop** (appelle `chat.abort`)
  - Tapez `/stop` (ou des phrases autonomes d’abandon comme `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) pour interrompre hors bande
  - `chat.abort` prend en charge `{ sessionKey }` (sans `runId`) pour interrompre toutes les exécutions actives de cette session
- Conservation partielle lors de l’abandon :
  - Lorsqu’une exécution est interrompue, un texte partiel de l’assistant peut encore être affiché dans l’UI
  - La Gateway persiste dans l’historique de transcription le texte partiel interrompu de l’assistant lorsqu’une sortie tamponnée existe
  - Les entrées persistées incluent des métadonnées d’abandon afin que les consommateurs de transcription puissent distinguer les partiels interrompus d’une sortie de fin normale

## Intégrations hébergées

Les messages de l’assistant peuvent afficher du contenu web hébergé en ligne avec le shortcode `[embed ...]`.
La politique sandbox des iframe est contrôlée par
`gateway.controlUi.embedSandbox` :

- `strict` : désactive l’exécution de scripts à l’intérieur des intégrations hébergées
- `scripts` : autorise les intégrations interactives tout en conservant l’isolation d’origine ; c’est
  la valeur par défaut et cela suffit généralement pour des jeux/widgets navigateur autonomes
- `trusted` : ajoute `allow-same-origin` en plus de `allow-scripts` pour les
  documents du même site qui ont intentionnellement besoin de privilèges plus élevés

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
comportement same-origin. Pour la plupart des jeux générés par agent et des canevas interactifs, `scripts` est
le choix le plus sûr.

Les URL d’intégration externes absolues `http(s)` restent bloquées par défaut. Si vous
voulez intentionnellement que `[embed url="https://..."]` charge des pages tierces, définissez
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Accès Tailnet (recommandé)

### Tailscale Serve intégré (préféré)

Conservez la Gateway sur loopback et laissez Tailscale Serve la proxyfier en HTTPS :

```bash
openclaw gateway --tailscale serve
```

Ouvrez :

- `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

Par défaut, les requêtes Serve de l’interface de contrôle/WebSocket peuvent s’authentifier via les en-têtes d’identité Tailscale
(`tailscale-user-login`) lorsque `gateway.auth.allowTailscale` vaut `true`. OpenClaw
vérifie l’identité en résolvant l’adresse `x-forwarded-for` avec
`tailscale whois` et en la faisant correspondre à l’en-tête, et n’accepte ces en-têtes que lorsque la
requête atteint loopback avec les en-têtes `x-forwarded-*` de Tailscale. Définissez
`gateway.auth.allowTailscale: false` si vous voulez exiger des identifiants explicites à secret partagé
même pour le trafic Serve. Utilisez alors `gateway.auth.mode: "token"` ou
`"password"`.
Pour ce chemin asynchrone d’identité Serve, les tentatives d’authentification échouées pour la même IP cliente
et la même portée d’authentification sont sérialisées avant les écritures de limitation de débit. Des nouvelles tentatives erronées concurrentes
du même navigateur peuvent donc afficher `retry later` à la seconde requête
au lieu de deux simples divergences en parallèle.
L’authentification Serve sans jeton suppose que l’hôte de la gateway est de confiance. Si du code local non fiable peut s’exécuter sur cet hôte, exigez une authentification par jeton/mot de passe.

### Liaison au tailnet + jeton

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Ouvrez ensuite :

- `http://<tailscale-ip>:18789/` (ou votre `gateway.controlUi.basePath` configuré)

Collez le secret partagé correspondant dans les paramètres de l’UI (envoyé comme
`connect.params.auth.token` ou `connect.params.auth.password`).

## HTTP non sécurisé

Si vous ouvrez le tableau de bord en HTTP simple (`http://<lan-ip>` ou `http://<tailscale-ip>`),
le navigateur s’exécute dans un **contexte non sécurisé** et bloque WebCrypto. Par défaut,
OpenClaw **bloque** les connexions à l’interface de contrôle sans identité d’appareil.

Exceptions documentées :

- compatibilité HTTP non sécurisé localhost uniquement avec `gateway.controlUi.allowInsecureAuth=true`
- authentification réussie d’opérateur sur l’interface de contrôle via `gateway.auth.mode: "trusted-proxy"`
- mode de secours `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correctif recommandé :** utilisez HTTPS (Tailscale Serve) ou ouvrez l’UI localement :

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sur l’hôte de la gateway)

**Comportement de l’option d’authentification non sécurisée :**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` est uniquement une option locale de compatibilité :

- Elle permet aux sessions localhost de l’interface de contrôle de continuer sans identité d’appareil dans
  des contextes HTTP non sécurisés.
- Elle ne contourne pas les vérifications d’appairage.
- Elle n’assouplit pas les exigences d’identité d’appareil à distance (hors localhost).

**Secours uniquement :**

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
grave dégradation de sécurité. Revenez rapidement en arrière après un usage d’urgence.

Remarque sur le proxy approuvé :

- une authentification réussie via proxy approuvé peut admettre des sessions **opérateur** de l’interface de contrôle sans
  identité d’appareil
- cela ne s’étend **pas** aux sessions de l’interface de contrôle avec rôle de Node
- les proxys inverses loopback sur le même hôte ne satisfont toujours pas l’authentification par proxy approuvé ; consultez
  [Authentification par proxy approuvé](/fr/gateway/trusted-proxy-auth)

Consultez [Tailscale](/fr/gateway/tailscale) pour les indications de configuration HTTPS.

## Politique de sécurité du contenu

L’interface de contrôle est fournie avec une politique `img-src` stricte : seuls les ressources **same-origin** et les URL `data:` sont autorisées. Les URL d’image distantes `http(s)` et relatives au protocole sont rejetées par le navigateur et n’émettent pas de requêtes réseau.

Ce que cela signifie en pratique :

- Les avatars et images servis sous des chemins relatifs (par exemple `/avatars/<id>`) s’affichent toujours.
- Les URL inline `data:image/...` s’affichent toujours (utile pour les charges utiles dans le protocole).
- Les URL d’avatar distantes émises par les métadonnées de canal sont supprimées dans les helpers d’avatar de l’interface de contrôle et remplacées par le logo/badge intégré, de sorte qu’un canal compromis ou malveillant ne puisse pas forcer des requêtes d’images distantes arbitraires depuis le navigateur d’un opérateur.

Vous n’avez rien à modifier pour obtenir ce comportement — il est toujours activé et non configurable.

## Authentification de la route d’avatar

Lorsque l’authentification Gateway est configurée, l’endpoint d’avatar de l’interface de contrôle exige le même jeton Gateway que le reste de l’API :

- `GET /avatar/<agentId>` renvoie l’image d’avatar uniquement aux appelants authentifiés. `GET /avatar/<agentId>?meta=1` renvoie les métadonnées de l’avatar selon la même règle.
- Les requêtes non authentifiées vers l’une ou l’autre route sont rejetées (comme pour la route sœur assistant-media). Cela empêche la route d’avatar de divulguer l’identité de l’agent sur des hôtes autrement protégés.
- L’interface de contrôle elle-même transmet le jeton Gateway comme en-tête bearer lors de la récupération des avatars, et utilise des URL blob authentifiées afin que l’image continue à s’afficher dans les tableaux de bord.

Si vous désactivez l’authentification Gateway (non recommandé sur des hôtes partagés), la route d’avatar devient aussi non authentifiée, conformément au reste de la gateway.

## Construire l’UI

La Gateway sert les fichiers statiques depuis `dist/control-ui`. Construisez-les avec :

```bash
pnpm ui:build
```

Base absolue facultative (lorsque vous voulez des URL d’assets fixes) :

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Pour le développement local (serveur de développement séparé) :

```bash
pnpm ui:dev
```

Pointez ensuite l’UI vers l’URL WS de votre Gateway (par ex. `ws://127.0.0.1:18789`).

## Débogage/test : serveur de développement + Gateway distante

L’interface de contrôle est constituée de fichiers statiques ; la cible WebSocket est configurable et peut être
différente de l’origine HTTP. C’est pratique lorsque vous voulez utiliser le serveur de développement Vite
localement mais que la Gateway s’exécute ailleurs.

1. Démarrez le serveur de développement de l’UI : `pnpm ui:dev`
2. Ouvrez une URL comme :

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Authentification ponctuelle facultative (si nécessaire) :

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Remarques :

- `gatewayUrl` est stocké dans localStorage après le chargement puis retiré de l’URL.
- `token` doit être passé via le fragment d’URL (`#token=...`) chaque fois que possible. Les fragments ne sont pas envoyés au serveur, ce qui évite les fuites dans les journaux de requêtes et dans Referer. Les paramètres de requête historiques `?token=` sont encore importés une fois par compatibilité, mais seulement en repli, et sont supprimés immédiatement après le bootstrap.
- `password` est conservé uniquement en mémoire.
- Lorsque `gatewayUrl` est défini, l’UI ne revient pas aux identifiants de configuration ou d’environnement.
  Fournissez explicitement `token` (ou `password`). L’absence d’identifiants explicites est une erreur.
- Utilisez `wss://` lorsque la Gateway est derrière TLS (Tailscale Serve, proxy HTTPS, etc.).
- `gatewayUrl` n’est accepté que dans une fenêtre de niveau supérieur (non intégrée) pour empêcher le clickjacking.
- Les déploiements de l’interface de contrôle hors loopback doivent définir explicitement `gateway.controlUi.allowedOrigins`
  (origines complètes). Cela inclut les configurations de développement à distance.
- N’utilisez pas `gateway.controlUi.allowedOrigins: ["*"]` sauf pour des tests locaux
  très contrôlés. Cela signifie autoriser n’importe quelle origine de navigateur, et non « correspondre à l’hôte que j’utilise ».
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

Détails de configuration pour l’accès distant : [Accès distant](/fr/gateway/remote).

## Associé

- [Tableau de bord](/fr/web/dashboard) — tableau de bord de la gateway
- [WebChat](/fr/web/webchat) — interface de chat dans le navigateur
- [TUI](/fr/web/tui) — interface utilisateur en terminal
- [Vérifications d’état](/fr/gateway/health) — surveillance de l’état de la gateway
