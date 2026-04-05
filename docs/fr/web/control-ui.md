---
read_when:
    - Vous voulez utiliser la Gateway depuis un navigateur
    - Vous voulez un accès tailnet sans tunnels SSH
summary: Interface de contrôle basée sur le navigateur pour la Gateway (chat, nœuds, configuration)
title: Interface de contrôle
x-i18n:
    generated_at: "2026-04-05T12:58:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1568680a07907343352dbb3a2e6a1b896826404a7d8baba62512f03eac28e3d7
    source_path: web/control-ui.md
    workflow: 15
---

# Interface de contrôle (navigateur)

L'interface de contrôle est une petite application monopage **Vite + Lit** servie par la Gateway :

- par défaut : `http://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par exemple `/openclaw`)

Elle communique **directement avec le WebSocket de la Gateway** sur le même port.

## Ouverture rapide (local)

Si la Gateway s'exécute sur le même ordinateur, ouvrez :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Si la page ne se charge pas, démarrez d'abord la Gateway : `openclaw gateway`.

L'authentification est fournie pendant la poignée de main WebSocket via :

- `connect.params.auth.token`
- `connect.params.auth.password`
- les en-têtes d'identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- les en-têtes d'identité de proxy de confiance lorsque `gateway.auth.mode: "trusted-proxy"`

Le panneau des paramètres du tableau de bord conserve un jeton pour la session
de l'onglet de navigateur en cours et l'URL de gateway sélectionnée ; les mots de passe ne sont pas conservés. L'onboarding
génère généralement un jeton de gateway pour l'authentification par secret partagé lors de la première connexion, mais l'authentification
par mot de passe fonctionne aussi lorsque `gateway.auth.mode` vaut `"password"`.

## Appairage d'appareil (première connexion)

Lorsque vous vous connectez à l'interface de contrôle depuis un nouveau navigateur ou appareil, la Gateway
exige une **approbation d'appairage unique** — même si vous êtes sur le même tailnet
avec `gateway.auth.allowTailscale: true`. Il s'agit d'une mesure de sécurité pour empêcher
les accès non autorisés.

**Ce que vous verrez :** « disconnected (1008): pairing required »

**Pour approuver l'appareil :**

```bash
# Lister les demandes en attente
openclaw devices list

# Approuver par ID de demande
openclaw devices approve <requestId>
```

Si le navigateur réessaie l'appairage avec des détails auth modifiés (rôle/portées/clé publique),
la demande en attente précédente est remplacée et un nouveau `requestId` est
créé. Réexécutez `openclaw devices list` avant l'approbation.

Une fois approuvé, l'appareil est mémorisé et ne nécessitera pas de nouvelle approbation sauf
si vous le révoquez avec `openclaw devices revoke --device <id> --role <role>`. Voir
[Devices CLI](/cli/devices) pour la rotation et la révocation des jetons.

**Notes :**

- Les connexions directes locales en loopback depuis le navigateur (`127.0.0.1` / `localhost`) sont
  approuvées automatiquement.
- Les connexions navigateur via tailnet et LAN nécessitent toujours une approbation explicite, même lorsqu'elles
  proviennent de la même machine.
- Chaque profil de navigateur génère un ID d'appareil unique ; changer de navigateur ou
  effacer les données du navigateur nécessitera donc un nouvel appairage.

## Prise en charge des langues

L'interface de contrôle peut se localiser au premier chargement en fonction de la langue de votre navigateur, et vous pouvez la remplacer ensuite depuis le sélecteur de langue dans la carte Access.

- Langues prises en charge : `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`
- Les traductions non anglaises sont chargées à la demande dans le navigateur.
- La langue sélectionnée est enregistrée dans le stockage du navigateur et réutilisée lors des visites ultérieures.
- Les clés de traduction manquantes reviennent à l'anglais.

## Ce qu'elle peut faire (aujourd'hui)

- Discuter avec le modèle via la WS Gateway (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Diffuser les appels d'outils et les cartes de sortie d'outil en direct dans le chat (événements d'agent)
- Canaux : état des canaux intégrés ainsi que des plugins de canaux groupés/externes, connexion QR et configuration par canal (`channels.status`, `web.login.*`, `config.patch`)
- Instances : liste de présence + actualisation (`system-presence`)
- Sessions : liste + remplacements par session du modèle/thinking/fast/verbose/reasoning (`sessions.list`, `sessions.patch`)
- Tâches cron : lister/ajouter/modifier/exécuter/activer/désactiver + historique d'exécution (`cron.*`)
- Skills : état, activer/désactiver, installation, mises à jour de clé API (`skills.*`)
- Nœuds : liste + capacités (`node.list`)
- Approbations exec : modifier les listes d'autorisation gateway ou node + la politique ask pour `exec host=gateway/node` (`exec.approvals.*`)
- Configuration : afficher/modifier `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configuration : appliquer + redémarrer avec validation (`config.apply`) et réveiller la dernière session active
- Les écritures de configuration incluent une protection par hash de base pour éviter d'écraser des modifications concurrentes
- Les écritures de configuration (`config.set`/`config.apply`/`config.patch`) effectuent aussi une vérification préalable de la résolution active de SecretRef pour les références du payload de configuration soumis ; les références actives soumises non résolues sont rejetées avant l'écriture
- Rendu du schéma de configuration + du formulaire (`config.schema` / `config.schema.lookup`,
  y compris `title` / `description` des champs, indices d'UI correspondants, résumés
  des enfants immédiats, métadonnées de documentation sur les nœuds d'objet imbriqué/wildcard/tableau/composition,
  ainsi que les schémas de plugin + de canal lorsqu'ils sont disponibles) ; l'éditeur JSON brut n'est
  disponible que lorsque le snapshot permet un aller-retour brut sûr
- Si un snapshot ne peut pas faire un aller-retour sûr en texte brut, l'interface de contrôle force le mode Form et désactive le mode Raw pour ce snapshot
- Les valeurs d'objet SecretRef structurées sont rendues en lecture seule dans les champs texte du formulaire afin d'éviter toute corruption accidentelle par conversion objet-chaîne
- Débogage : snapshots d'état/santé/modèles + journal des événements + appels RPC manuels (`status`, `health`, `models.list`)
- Journaux : suivi en direct des journaux de fichiers de la gateway avec filtre/export (`logs.tail`)
- Mise à jour : exécuter une mise à jour package/git + redémarrage (`update.run`) avec rapport de redémarrage

Notes sur le panneau des tâches cron :

- Pour les tâches isolées, la remise est par défaut définie sur l'annonce d'un résumé. Vous pouvez passer à none si vous voulez des exécutions internes uniquement.
- Les champs canal/cible apparaissent lorsque announce est sélectionné.
- Le mode webhook utilise `delivery.mode = "webhook"` avec `delivery.to` défini sur une URL de webhook HTTP(S) valide.
- Pour les tâches de session principale, les modes de remise webhook et none sont disponibles.
- Les contrôles d'édition avancés incluent delete-after-run, clear agent override, les options cron exact/stagger,
  les remplacements de modèle/thinking d'agent et les bascules de remise best-effort.
- La validation du formulaire est inline avec des erreurs au niveau des champs ; les valeurs invalides désactivent le bouton d'enregistrement jusqu'à correction.
- Définissez `cron.webhookToken` pour envoyer un jeton bearer dédié ; si omis, le webhook est envoyé sans en-tête auth.
- Repli obsolète : les anciennes tâches stockées avec `notify: true` peuvent encore utiliser `cron.webhook` jusqu'à migration.

## Comportement du chat

- `chat.send` est **non bloquant** : il accuse réception immédiatement avec `{ runId, status: "started" }` et la réponse est diffusée via des événements `chat`.
- Un nouvel envoi avec la même `idempotencyKey` renvoie `{ status: "in_flight" }` pendant l'exécution, et `{ status: "ok" }` après la fin.
- Les réponses `chat.history` sont limitées en taille pour la sécurité de l'UI. Lorsque les entrées de transcription sont trop volumineuses, la Gateway peut tronquer les longs champs texte, omettre les blocs de métadonnées lourds et remplacer les messages surdimensionnés par un placeholder (`[chat.history omitted: message too large]`).
- `chat.history` supprime également les balises de directive inline d'affichage uniquement du texte visible de l'assistant (par exemple `[[reply_to_*]]` et `[[audio_as_voice]]`), les payloads XML d'appel d'outil en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d'appel d'outil tronqués), ainsi que les jetons de contrôle de modèle ASCII/pleine largeur divulgués, et omet les entrées assistant dont tout le texte visible n'est que le jeton silencieux exact `NO_REPLY` / `no_reply`.
- `chat.inject` ajoute une note d'assistant à la transcription de session et diffuse un événement `chat` pour les mises à jour uniquement UI (pas d'exécution d'agent, pas de remise au canal).
- Les sélecteurs de modèle et de thinking de l'en-tête du chat corrigent immédiatement la session active via `sessions.patch` ; ce sont des remplacements persistants de session, pas des options d'envoi pour un seul tour.
- Arrêt :
  - Cliquez sur **Stop** (appelle `chat.abort`)
  - Saisissez `/stop` (ou des expressions d'arrêt autonomes comme `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) pour interrompre hors bande
  - `chat.abort` prend en charge `{ sessionKey }` (sans `runId`) pour interrompre toutes les exécutions actives de cette session
- Conservation partielle après interruption :
  - Lorsqu'une exécution est interrompue, un texte partiel de l'assistant peut tout de même être affiché dans l'UI
  - La Gateway conserve le texte partiel interrompu de l'assistant dans l'historique de transcription lorsqu'une sortie tamponnée existe
  - Les entrées conservées incluent des métadonnées d'interruption pour que les consommateurs de transcription puissent distinguer les fragments interrompus d'une sortie normale terminée

## Accès tailnet (recommandé)

### Tailscale Serve intégré (préféré)

Gardez la Gateway sur loopback et laissez Tailscale Serve la proxifier avec HTTPS :

```bash
openclaw gateway --tailscale serve
```

Ouvrez :

- `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

Par défaut, les requêtes Serve de l'interface de contrôle/WebSocket peuvent s'authentifier via les en-têtes d'identité Tailscale
(`tailscale-user-login`) lorsque `gateway.auth.allowTailscale` vaut `true`. OpenClaw
vérifie l'identité en résolvant l'adresse `x-forwarded-for` avec
`tailscale whois` et en la comparant à l'en-tête, et n'accepte ces requêtes que lorsque
la requête atteint loopback avec les en-têtes `x-forwarded-*` de Tailscale. Définissez
`gateway.auth.allowTailscale: false` si vous voulez exiger des identifiants explicites à secret partagé
même pour le trafic Serve. Utilisez alors `gateway.auth.mode: "token"` ou
`"password"`.
Pour ce chemin d'identité Serve asynchrone, les tentatives d'authentification échouées provenant de la même IP client
et de la même portée auth sont sérialisées avant les écritures de limitation de débit. Des
nouvelles tentatives concurrentes incorrectes depuis le même navigateur peuvent donc afficher `retry later` à la deuxième requête
au lieu de deux simples incompatibilités en parallèle.
L'authentification Serve sans jeton suppose que l'hôte de la gateway est fiable. Si du code local non fiable
peut s'exécuter sur cet hôte, exigez une authentification par jeton/mot de passe.

### Bind au tailnet + jeton

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Ouvrez ensuite :

- `http://<tailscale-ip>:18789/` (ou votre `gateway.controlUi.basePath` configuré)

Collez le secret partagé correspondant dans les paramètres de l'UI (envoyé comme
`connect.params.auth.token` ou `connect.params.auth.password`).

## HTTP non sécurisé

Si vous ouvrez le tableau de bord en HTTP simple (`http://<lan-ip>` ou `http://<tailscale-ip>`),
le navigateur fonctionne dans un **contexte non sécurisé** et bloque WebCrypto. Par défaut,
OpenClaw **bloque** les connexions de l'interface de contrôle sans identité d'appareil.

Exceptions documentées :

- compatibilité HTTP non sécurisée localhost uniquement avec `gateway.controlUi.allowInsecureAuth=true`
- authentification réussie d'opérateur dans l'interface de contrôle via `gateway.auth.mode: "trusted-proxy"`
- option de secours `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correctif recommandé :** utilisez HTTPS (Tailscale Serve) ou ouvrez l'UI localement :

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sur l'hôte de la gateway)

**Comportement du commutateur allowInsecureAuth :**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` n'est qu'un commutateur local de compatibilité :

- Il permet aux sessions de l'interface de contrôle sur localhost de se poursuivre sans identité d'appareil dans
  des contextes HTTP non sécurisés.
- Il ne contourne pas les vérifications d'appairage.
- Il n'assouplit pas les exigences d'identité d'appareil à distance (hors localhost).

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

`dangerouslyDisableDeviceAuth` désactive les vérifications d'identité d'appareil de l'interface de contrôle et constitue une
grave dégradation de sécurité. Rétablissez vite la configuration après un usage d'urgence.

Note trusted-proxy :

- une authentification trusted-proxy réussie peut admettre des sessions **operator** de l'interface de contrôle sans
  identité d'appareil
- cela **ne s'étend pas** aux sessions de l'interface de contrôle avec rôle node
- les proxys inverses loopback sur le même hôte ne satisfont toujours pas l'authentification trusted-proxy ; voir
  [Trusted Proxy Auth](/fr/gateway/trusted-proxy-auth)

Voir [Tailscale](/fr/gateway/tailscale) pour les instructions de configuration HTTPS.

## Construire l'UI

La Gateway sert des fichiers statiques depuis `dist/control-ui`. Construisez-les avec :

```bash
pnpm ui:build # installe automatiquement les dépendances UI lors de la première exécution
```

Base absolue facultative (lorsque vous voulez des URL de ressources fixes) :

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Pour le développement local (serveur de dev séparé) :

```bash
pnpm ui:dev # installe automatiquement les dépendances UI lors de la première exécution
```

Pointez ensuite l'UI vers l'URL WS de votre Gateway (par exemple `ws://127.0.0.1:18789`).

## Débogage/test : serveur de dev + Gateway distante

L'interface de contrôle est constituée de fichiers statiques ; la cible WebSocket est configurable et peut être
différente de l'origine HTTP. C'est pratique lorsque vous voulez le serveur de dev Vite
en local mais que la Gateway s'exécute ailleurs.

1. Démarrez le serveur de dev UI : `pnpm ui:dev`
2. Ouvrez une URL comme :

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Authentification facultative à usage unique (si nécessaire) :

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Notes :

- `gatewayUrl` est stocké dans localStorage après le chargement et supprimé de l'URL.
- `token` doit être transmis via le fragment d'URL (`#token=...`) dès que possible. Les fragments ne sont pas envoyés au serveur, ce qui évite les fuites dans les journaux de requêtes et via Referer. Les anciens paramètres de requête `?token=` sont encore importés une fois pour compatibilité, mais uniquement en repli, et sont supprimés immédiatement après l'amorçage.
- `password` est conservé en mémoire uniquement.
- Lorsque `gatewayUrl` est défini, l'UI ne revient pas aux identifiants de configuration ou d'environnement.
  Fournissez explicitement `token` (ou `password`). L'absence d'identifiants explicites est une erreur.
- Utilisez `wss://` lorsque la Gateway est derrière TLS (Tailscale Serve, proxy HTTPS, etc.).
- `gatewayUrl` n'est accepté que dans une fenêtre de niveau supérieur (pas intégrée) afin d'empêcher le clickjacking.
- Les déploiements d'interface de contrôle hors loopback doivent définir explicitement `gateway.controlUi.allowedOrigins`
  (origines complètes). Cela inclut les configurations de dev distantes.
- N'utilisez pas `gateway.controlUi.allowedOrigins: ["*"]` sauf pour des
  tests locaux strictement contrôlés. Cela signifie autoriser n'importe quelle origine de navigateur, pas « correspondre à l'hôte que j'utilise ».
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active
  le mode de repli d'origine basé sur l'en-tête Host, mais il s'agit d'un mode de sécurité dangereux.

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

Détails de configuration pour l'accès distant : [Accès distant](/fr/gateway/remote).

## Lié

- [Dashboard](/web/dashboard) — tableau de bord de la gateway
- [WebChat](/web/webchat) — interface de chat basée sur le navigateur
- [TUI](/web/tui) — interface utilisateur en terminal
- [Health Checks](/fr/gateway/health) — surveillance de l'état de la gateway
