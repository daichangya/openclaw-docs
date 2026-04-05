---
read_when:
    - Exécuter des tests localement ou en CI
    - Ajouter des régressions pour des bugs de modèle/fournisseur
    - Déboguer le comportement de la gateway et de l'agent
summary: 'Kit de test : suites unit/e2e/live, runners Docker, et ce que couvre chaque test'
title: Testing
x-i18n:
    generated_at: "2026-04-05T12:46:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 854a39ae261d8749b8d8d82097b97a7c52cf2216d1fe622e302d830a888866ab
    source_path: help/testing.md
    workflow: 15
---

# Testing

OpenClaw dispose de trois suites Vitest (unitaire/intégration, e2e, live) et d'un petit ensemble de runners Docker.

Cette documentation est un guide « comment nous testons » :

- Ce que couvre chaque suite (et ce qu'elle ne couvre _délibérément pas_)
- Quelles commandes exécuter pour les workflows courants (local, avant push, débogage)
- Comment les tests live découvrent les identifiants et sélectionnent les modèles/fournisseurs
- Comment ajouter des régressions pour des problèmes réels de modèle/fournisseur

## Démarrage rapide

La plupart des jours :

- Porte complète (attendue avant un push) : `pnpm build && pnpm check && pnpm test`
- Exécution locale plus rapide de la suite complète sur une machine bien dimensionnée : `pnpm test:max`
- Boucle directe Vitest watch (configuration moderne des projets) : `pnpm test:watch`
- Le ciblage direct de fichier route désormais aussi les chemins d'extension/canal : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`

Lorsque vous touchez aux tests ou souhaitez davantage de confiance :

- Porte de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

Lors du débogage de vrais fournisseurs/modèles (nécessite de vrais identifiants) :

- Suite live (modèles + sondes gateway outil/image) : `pnpm test:live`
- Cibler silencieusement un seul fichier live : `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Astuce : lorsque vous n'avez besoin que d'un seul cas en échec, préférez restreindre les tests live via les variables d'environnement de liste d'autorisation décrites ci-dessous.

## Suites de test (ce qui s'exécute où)

Considérez les suites comme ayant un « réalisme croissant » (et une instabilité/un coût croissants) :

### Unitaire / intégration (par défaut)

- Commande : `pnpm test`
- Configuration : `projects` Vitest natifs via `vitest.config.ts`
- Fichiers : inventaires core/unit sous `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts`, et les tests node `ui` autorisés couverts par `vitest.unit.config.ts`
- Portée :
  - Tests unitaires purs
  - Tests d'intégration en processus (authentification gateway, routage, outillage, parsing, configuration)
  - Régressions déterministes pour des bugs connus
- Attentes :
  - S'exécute en CI
  - Aucune vraie clé requise
  - Doit être rapide et stable
- Remarque sur les projets :
  - `pnpm test`, `pnpm test:watch` et `pnpm test:changed` utilisent désormais tous la même configuration racine Vitest native `projects`.
  - Les filtres de fichier directs passent nativement par le graphe de projet racine, donc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` fonctionne sans wrapper personnalisé.
- Remarque sur le runner intégré :
  - Lorsque vous modifiez les entrées de découverte de l'outil de message ou le contexte d'exécution de compaction, conservez les deux niveaux de couverture.
  - Ajoutez des régressions d'assistants ciblées pour les limites pures de routage/normalisation.
  - Gardez également en bon état les suites d'intégration du runner intégré :
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, et
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ces suites vérifient que les IDs limités en portée et le comportement de compaction passent toujours par les vrais chemins `run.ts` / `compact.ts` ; des tests sur assistants uniquement ne remplacent pas suffisamment ces chemins d'intégration.
- Remarque sur le pool :
  - La configuration Vitest de base utilise désormais `threads` par défaut.
  - La configuration Vitest partagée fixe aussi `isolate: false` et utilise le runner non isolé sur les projets racine, e2e et live.
  - La voie UI racine conserve sa configuration `jsdom` et son optimiseur, mais s'exécute désormais aussi sur le runner partagé non isolé.
  - `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false` depuis la configuration de projets de `vitest.config.ts`.
  - Le lanceur partagé `scripts/run-vitest.mjs` ajoute désormais aussi `--no-maglev` par défaut aux processus Node enfants de Vitest pour réduire l'agitation de compilation V8 lors des grosses exécutions locales. Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` si vous devez comparer avec le comportement V8 standard.
- Remarque sur l'itération locale rapide :
  - `pnpm test:changed` exécute la configuration native des projets avec `--changed origin/main`.
  - `pnpm test:max` et `pnpm test:changed:max` conservent la même configuration native des projets, simplement avec une limite supérieure de workers.
  - L'auto-scaling local des workers est désormais volontairement conservateur et réduit aussi l'activité lorsque la charge moyenne de l'hôte est déjà élevée, afin que plusieurs exécutions Vitest simultanées fassent moins de dégâts par défaut.
  - La configuration Vitest de base marque désormais les fichiers de projets/configuration comme `forceRerunTriggers` afin que les reruns en mode changed restent corrects lorsque le câblage des tests change.
  - La configuration garde `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes pris en charge ; définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous souhaitez un emplacement explicite de cache pour le profilage direct.
- Remarque sur le débogage des performances :
  - `pnpm test:perf:imports` active les rapports de durée d'import Vitest ainsi que la ventilation des imports.
  - `pnpm test:perf:imports:changed` limite cette même vue de profilage aux fichiers modifiés depuis `origin/main`.
  - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour la surcharge de démarrage et de transformation Vitest/Vite.
  - `pnpm test:perf:profile:runner` écrit des profils CPU+heap du runner pour la suite unitaire avec le parallélisme par fichier désactivé.

### E2E (gateway smoke)

- Commande : `pnpm test:e2e`
- Configuration : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Valeurs par défaut d'exécution :
  - Utilise Vitest `threads` avec `isolate: false`, en cohérence avec le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu'à 2, local : 1 par défaut).
  - S'exécute en mode silencieux par défaut afin de réduire la surcharge d'E/S console.
- Remplacements utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console détaillée.
- Portée :
  - Comportement E2E multi-instances de la gateway
  - Surfaces WebSocket/HTTP, jumelage de nœuds et réseau plus lourd
- Attentes :
  - S'exécute en CI (lorsqu'activé dans le pipeline)
  - Aucune vraie clé requise
  - Davantage d'éléments mobiles que les tests unitaires (peut être plus lent)

### E2E : smoke du backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `test/openshell-sandbox.e2e.test.ts`
- Portée :
  - Démarre une gateway OpenShell isolée sur l'hôte via Docker
  - Crée une sandbox à partir d'un Dockerfile local temporaire
  - Exerce le backend OpenShell d'OpenClaw via de vrais `sandbox ssh-config` + exécution SSH
  - Vérifie le comportement du système de fichiers canonique distant via le pont fs de la sandbox
- Attentes :
  - Opt-in uniquement ; ne fait pas partie de l'exécution par défaut `pnpm test:e2e`
  - Nécessite une CLI locale `openshell` ainsi qu'un daemon Docker fonctionnel
  - Utilise un `HOME` / `XDG_CONFIG_HOME` isolé, puis détruit la gateway et la sandbox de test
- Remplacements utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l'exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI non standard ou un script wrapper

### Live (vrais fournisseurs + vrais modèles)

- Commande : `pnpm test:live`
- Configuration : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Ce fournisseur/modèle fonctionne-t-il vraiment _aujourd'hui_ avec de vrais identifiants ? »
  - Détecter les changements de format fournisseur, les particularités d'appel d'outil, les problèmes d'authentification et le comportement de limitation de débit
- Attentes :
  - Non stable en CI par conception (vrais réseaux, vraies politiques fournisseur, quotas, pannes)
  - Coûte de l'argent / consomme des limites de débit
  - Préférez exécuter des sous-ensembles restreints plutôt que « tout »
- Les exécutions live sourcent `~/.profile` pour récupérer les clés API manquantes.
- Par défaut, les exécutions live isolent toujours `HOME` et copient la configuration/le matériel d'authentification dans un répertoire temporaire de test afin que les fixtures unitaires ne puissent pas modifier votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous voulez explicitement que les tests live utilisent votre vrai répertoire personnel.
- `pnpm test:live` utilise désormais un mode plus silencieux par défaut : il conserve la sortie de progression `[live] ...`, mais supprime la notice supplémentaire `~/.profile` et coupe les journaux de bootstrap gateway / le bruit Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous souhaitez retrouver les journaux complets de démarrage.
- Rotation de clés API (spécifique au fournisseur) : définissez `*_API_KEYS` au format virgule/point-virgule ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou un remplacement live par `OPENCLAW_LIVE_*_KEY` ; les tests réessaient sur les réponses de limitation de débit.
- Sortie de progression/heartbeat :
  - Les suites live émettent désormais des lignes de progression sur stderr afin que les appels fournisseur longs restent visiblement actifs même lorsque la capture de console Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l'interception de console Vitest afin que les lignes de progression fournisseur/gateway soient diffusées immédiatement pendant les exécutions live.
  - Ajustez les heartbeats de modèle direct avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajustez les heartbeats gateway/sonde avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modifier la logique/les tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup changé)
- Toucher au réseau gateway / protocole WS / jumelage : ajoutez `pnpm test:e2e`
- Déboguer « mon bot est en panne » / des échecs spécifiques à un fournisseur / l'appel d'outil : exécutez un `pnpm test:live` restreint

## Live : balayage des capacités du nœud Android

- Test : `src/gateway/android-node.capabilities.live.test.ts`
- Script : `pnpm android:test:integration`
- Objectif : invoquer **chaque commande actuellement annoncée** par un nœud Android connecté et vérifier le comportement du contrat de commande.
- Portée :
  - Préconfiguration/configuration manuelle (la suite n'installe ni n'exécute ni ne jumelle l'application).
  - Validation `node.invoke` de gateway, commande par commande, pour le nœud Android sélectionné.
- Préconfiguration requise :
  - Application Android déjà connectée + jumelée à la gateway.
  - Application maintenue au premier plan.
  - Permissions/consentements de capture accordés pour les capacités que vous attendez comme réussies.
- Remplacements facultatifs de cible :
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Détails complets de configuration Android : [Application Android](/platforms/android)

## Live : smoke des modèles (clés de profil)

Les tests live sont divisés en deux couches afin de pouvoir isoler les échecs :

- Le « modèle direct » nous indique si le fournisseur/modèle peut répondre tout court avec la clé donnée.
- Le « gateway smoke » nous indique si le pipeline complet gateway+agent fonctionne pour ce modèle (sessions, historique, outils, politique de sandbox, etc.).

### Couche 1 : complétion de modèle directe (sans gateway)

- Test : `src/agents/models.profiles.live.test.ts`
- Objectif :
  - Énumérer les modèles découverts
  - Utiliser `getApiKeyForModel` pour sélectionner les modèles pour lesquels vous avez des identifiants
  - Exécuter une petite complétion par modèle (et des régressions ciblées si nécessaire)
- Comment activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Définissez `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias de modern) pour réellement exécuter cette suite ; sinon elle est ignorée afin que `pnpm test:live` reste centré sur le gateway smoke
- Comment sélectionner les modèles :
  - `OPENCLAW_LIVE_MODELS=modern` pour exécuter la liste d'autorisation moderne (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` est un alias pour la liste d'autorisation moderne
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (liste d'autorisation séparée par des virgules)
- Comment sélectionner les fournisseurs :
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (liste d'autorisation séparée par des virgules)
- D'où viennent les clés :
  - Par défaut : magasin de profils et replis d'environnement
  - Définissez `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer le **magasin de profils** uniquement
- Pourquoi cela existe :
  - Sépare « l'API fournisseur est cassée / la clé est invalide » de « le pipeline d'agent gateway est cassé »
  - Contient de petites régressions isolées (exemple : réponses OpenAI / relecture de raisonnement Codex Responses + flux d'appel d'outil)

### Couche 2 : gateway + smoke de l'agent dev (ce que fait réellement "@openclaw")

- Test : `src/gateway/gateway-models.profiles.live.test.ts`
- Objectif :
  - Démarrer une gateway en processus
  - Créer/patcher une session `agent:dev:*` (remplacement de modèle par exécution)
  - Itérer sur les modèles-avec-clés et vérifier :
    - réponse « significative » (sans outils)
    - le fonctionnement d'une vraie invocation d'outil (sonde read)
    - des sondes d'outil supplémentaires facultatives (sonde exec+read)
    - le maintien des chemins de régression OpenAI (tool-call-only → suivi)
- Détails des sondes (afin que vous puissiez expliquer rapidement les échecs) :
  - sonde `read` : le test écrit un fichier nonce dans l'espace de travail et demande à l'agent de le `read` puis de renvoyer le nonce.
  - sonde `exec+read` : le test demande à l'agent d'écrire via `exec` un nonce dans un fichier temporaire, puis de le `read`.
  - sonde image : le test joint un PNG généré (chat + code aléatoire) et attend que le modèle renvoie `cat <CODE>`.
  - Référence d'implémentation : `src/gateway/gateway-models.profiles.live.test.ts` et `src/gateway/live-image-probe.ts`.
- Comment activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Comment sélectionner les modèles :
  - Par défaut : liste d'autorisation moderne (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` est un alias pour la liste d'autorisation moderne
  - Ou définissez `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou liste séparée par des virgules) pour restreindre
- Comment sélectionner les fournisseurs (éviter « tout OpenRouter ») :
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (liste d'autorisation séparée par des virgules)
- Les sondes d'outil + image sont toujours activées dans ce test live :
  - sonde `read` + sonde `exec+read` (stress d'outil)
  - la sonde image s'exécute lorsque le modèle annonce la prise en charge d'entrée image
  - Flux (niveau élevé) :
    - Le test génère un petit PNG avec « CAT » + un code aléatoire (`src/gateway/live-image-probe.ts`)
    - L'envoie via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - La gateway analyse les pièces jointes dans `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L'agent intégré transmet un message utilisateur multimodal au modèle
    - Assertion : la réponse contient `cat` + le code (tolérance OCR : erreurs mineures autorisées)

Astuce : pour voir ce que vous pouvez tester sur votre machine (et les IDs exacts `provider/model`), exécutez :

```bash
openclaw models list
openclaw models list --json
```

## Live : smoke du backend CLI (Claude CLI ou autres CLI locales)

- Test : `src/gateway/gateway-cli-backend.live.test.ts`
- Objectif : valider le pipeline gateway + agent à l'aide d'un backend CLI local, sans toucher à votre configuration par défaut.
- Activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valeurs par défaut :
  - Modèle : `claude-cli/claude-sonnet-4-6`
  - Commande : `claude`
  - Args : `["-p","--output-format","stream-json","--include-partial-messages","--verbose","--permission-mode","bypassPermissions"]`
- Remplacements (facultatifs) :
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-opus-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","stream-json","--include-partial-messages","--verbose","--permission-mode","bypassPermissions"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_CLEAR_ENV='["ANTHROPIC_API_KEY","ANTHROPIC_API_KEY_OLD"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` pour envoyer une vraie pièce jointe image (les chemins sont injectés dans le prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` pour passer les chemins de fichier image en args CLI au lieu de les injecter dans le prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) pour contrôler la façon dont les args image sont passés lorsque `IMAGE_ARG` est défini.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` pour envoyer un second tour et valider le flux de reprise.
- `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0` pour garder activée la configuration MCP de Claude CLI (par défaut injecte une configuration temporaire stricte vide `--mcp-config` afin que les serveurs MCP globaux/ambiants restent désactivés pendant le smoke).

Exemple :

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Recette Docker :

```bash
pnpm test:docker:live-cli-backend
```

Remarques :

- Le runner Docker se trouve dans `scripts/test-live-cli-backend-docker.sh`.
- Il exécute le smoke live du backend CLI dans l'image Docker du dépôt comme utilisateur non root `node`, car Claude CLI refuse `bypassPermissions` lorsqu'il est invoqué en root.
- Pour `claude-cli`, il installe le package Linux `@anthropic-ai/claude-code` dans un préfixe inscriptible mis en cache à `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (par défaut : `~/.cache/openclaw/docker-cli-tools`).
- Pour `claude-cli`, le smoke live injecte une configuration MCP vide stricte sauf si vous définissez `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0`.
- Il copie `~/.claude` dans le conteneur lorsqu'il est disponible, mais sur les machines où l'authentification Claude repose sur `ANTHROPIC_API_KEY`, il préserve aussi `ANTHROPIC_API_KEY` / `ANTHROPIC_API_KEY_OLD` pour la CLI Claude enfant via `OPENCLAW_LIVE_CLI_BACKEND_PRESERVE_ENV`.

## Live : smoke ACP bind (`/acp spawn ... --bind here`)

- Test : `src/gateway/gateway-acp-bind.live.test.ts`
- Objectif : valider le vrai flux de liaison de conversation ACP avec un agent ACP live :
  - envoyer `/acp spawn <agent> --bind here`
  - lier en place une conversation synthétique de canal de messages
  - envoyer un suivi normal sur cette même conversation
  - vérifier que le suivi aboutit dans la transcription de la session ACP liée
- Activer :
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valeurs par défaut :
  - Agent ACP : `claude`
  - Canal synthétique : contexte de conversation de type DM Slack
  - Backend ACP : `acpx`
- Remplacements :
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=/full/path/to/acpx`
- Remarques :
  - Cette voie utilise la surface gateway `chat.send` avec des champs de route d'origine synthétiques réservés à l'admin afin que les tests puissent joindre un contexte de canal de messages sans prétendre à une livraison externe.
  - Lorsque `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND` n'est pas défini, le test utilise la commande acpx configurée/groupée. Si l'authentification de votre harnais dépend de variables d'environnement issues de `~/.profile`, préférez une commande `acpx` personnalisée qui préserve l'environnement du fournisseur.

Exemple :

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Recette Docker :

```bash
pnpm test:docker:live-acp-bind
```

Remarques Docker :

- Le runner Docker se trouve dans `scripts/test-live-acp-bind-docker.sh`.
- Il source `~/.profile`, copie le répertoire d'authentification CLI correspondant (`~/.claude` ou `~/.codex`) dans le conteneur, installe `acpx` dans un préfixe npm inscriptible, puis installe la CLI live demandée (`@anthropic-ai/claude-code` ou `@openai/codex`) si elle est absente.
- Dans Docker, le runner définit `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` afin qu'acpx conserve pour la CLI enfant du harnais les variables d'environnement du fournisseur provenant du profil sourcé.

### Recettes live recommandées

Des listes d'autorisation étroites et explicites sont les plus rapides et les moins instables :

- Modèle unique, direct (sans gateway) :
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modèle unique, gateway smoke :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Appel d'outil sur plusieurs fournisseurs :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (clé API Gemini + Antigravity) :
  - Gemini (clé API) : `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth) : `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Remarques :

- `google/...` utilise l'API Gemini (clé API).
- `google-antigravity/...` utilise le pont OAuth Antigravity (point de terminaison d'agent type Cloud Code Assist).
- `google-gemini-cli/...` utilise la CLI Gemini locale sur votre machine (authentification séparée + particularités d'outillage).
- API Gemini vs CLI Gemini :
  - API : OpenClaw appelle l'API Gemini hébergée par Google via HTTP (clé API / auth de profil) ; c'est ce que la plupart des utilisateurs veulent dire par « Gemini ».
  - CLI : OpenClaw lance un binaire local `gemini` ; il possède sa propre authentification et peut se comporter différemment (streaming/prise en charge d'outils/décalage de version).

## Live : matrice de modèles (ce que nous couvrons)

Il n'existe pas de « liste de modèles CI » fixe (live est opt-in), mais voici les modèles **recommandés** à couvrir régulièrement sur une machine de développement disposant de clés.

### Ensemble smoke moderne (appel d'outil + image)

C'est l'exécution des « modèles courants » que nous nous attendons à voir fonctionner :

- OpenAI (hors Codex) : `openai/gpt-5.4` (facultatif : `openai/gpt-5.4-mini`)
- OpenAI Codex : `openai-codex/gpt-5.4`
- Anthropic : `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini) : `google/gemini-3.1-pro-preview` et `google/gemini-3-flash-preview` (éviter les anciens modèles Gemini 2.x)
- Google (Antigravity) : `google-antigravity/claude-opus-4-6-thinking` et `google-antigravity/gemini-3-flash`
- Z.AI (GLM) : `zai/glm-4.7`
- MiniMax : `minimax/MiniMax-M2.7`

Exécuter le gateway smoke avec outils + image :
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Base : appel d'outil (Read + Exec facultatif)

Choisissez-en au moins un par famille de fournisseurs :

- OpenAI : `openai/gpt-5.4` (ou `openai/gpt-5.4-mini`)
- Anthropic : `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google : `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- Z.AI (GLM) : `zai/glm-4.7`
- MiniMax : `minimax/MiniMax-M2.7`

Couverture supplémentaire facultative (agréable à avoir) :

- xAI : `xai/grok-4` (ou la dernière version disponible)
- Mistral : `mistral/`… (choisissez un modèle capable d'utiliser des outils que vous avez activé)
- Cerebras : `cerebras/`… (si vous y avez accès)
- LM Studio : `lmstudio/`… (local ; l'appel d'outil dépend du mode API)

### Vision : envoi d'image (pièce jointe → message multimodal)

Incluez au moins un modèle compatible image dans `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/variantes OpenAI compatibles vision, etc.) pour exercer la sonde image.

### Agrégateurs / passerelles alternatives

Si vous avez des clés activées, nous prenons aussi en charge les tests via :

- OpenRouter : `openrouter/...` (des centaines de modèles ; utilisez `openclaw models scan` pour trouver des candidats compatibles outils+image)
- OpenCode : `opencode/...` pour Zen et `opencode-go/...` pour Go (authentification via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Davantage de fournisseurs à inclure dans la matrice live (si vous avez les identifiants/la configuration) :

- Intégrés : `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (points de terminaison personnalisés) : `minimax` (cloud/API), plus tout proxy compatible OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

Astuce : n'essayez pas de coder en dur « tous les modèles » dans la documentation. La liste faisant autorité est ce que `discoverModels(...)` renvoie sur votre machine + les clés disponibles.

## Identifiants (ne jamais commit)

Les tests live découvrent les identifiants de la même manière que la CLI. Conséquences pratiques :

- Si la CLI fonctionne, les tests live devraient trouver les mêmes clés.
- Si un test live dit « no creds », déboguez-le de la même manière que `openclaw models list` / la sélection de modèle.

- Profils d'authentification par agent : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (c'est ce que signifient les « profile keys » dans les tests live)
- Configuration : `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Répertoire d'état hérité : `~/.openclaw/credentials/` (copié dans le home live intermédiaire lorsqu'il est présent, mais pas le magasin principal de clés de profil)
- Les exécutions locales live copient par défaut dans un home de test temporaire la configuration active, les fichiers `auth-profiles.json` par agent, le répertoire hérité `credentials/` et les répertoires d'authentification CLI externes pris en charge ; les remplacements de chemin `agents.*.workspace` / `agentDir` sont retirés de cette configuration intermédiaire afin que les sondes n'atteignent pas votre vrai espace de travail hôte.

Si vous souhaitez vous appuyer sur des clés d'environnement (par exemple exportées dans votre `~/.profile`), exécutez les tests locaux après `source ~/.profile`, ou utilisez les runners Docker ci-dessous (ils peuvent monter `~/.profile` dans le conteneur).

## Deepgram live (transcription audio)

- Test : `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Activer : `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Test : `src/agents/byteplus.live.test.ts`
- Activer : `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Remplacement facultatif du modèle : `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Génération d'image live

- Test : `src/image-generation/runtime.live.test.ts`
- Commande : `pnpm test:live src/image-generation/runtime.live.test.ts`
- Portée :
  - Énumère chaque plugin fournisseur de génération d'image enregistré
  - Charge les variables d'environnement fournisseur manquantes depuis votre shell de connexion (`~/.profile`) avant la sonde
  - Utilise par défaut les clés API live/env avant les profils d'authentification stockés, afin que des clés de test obsolètes dans `auth-profiles.json` ne masquent pas de vrais identifiants shell
  - Ignore les fournisseurs sans auth/profil/modèle exploitable
  - Exécute les variantes standard de génération d'image via la capacité runtime partagée :
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Fournisseurs groupés actuellement couverts :
  - `openai`
  - `google`
- Restriction facultative :
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportement d'authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l'authentification du magasin de profils et ignorer les remplacements uniquement env

## Runners Docker (vérifications facultatives « fonctionne sous Linux »)

Ces runners Docker sont répartis en deux catégories :

- Runners live-model : `test:docker:live-models` et `test:docker:live-gateway` n'exécutent que leur fichier live de profile-key correspondant à l'intérieur de l'image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire local de configuration et votre espace de travail (et en sourçant `~/.profile` si monté). Les points d'entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les runners Docker live utilisent par défaut une limite smoke plus réduite afin qu'un balayage Docker complet reste pratique :
  `test:docker:live-models` utilise par défaut `OPENCLAW_LIVE_MAX_MODELS=12`, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Remplacez ces variables d'environnement lorsque vous voulez explicitement un scan exhaustif plus large.
- `test:docker:all` construit l'image Docker live une fois via `test:docker:live-build`, puis la réutilise pour les deux voies Docker live.
- Runners de smoke de conteneur : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels`, et `test:docker:plugins` démarrent un ou plusieurs vrais conteneurs et vérifient des chemins d'intégration de plus haut niveau.

Les runners Docker live-model montent aussi uniquement les homes d'authentification CLI nécessaires (ou tous ceux pris en charge lorsque l'exécution n'est pas restreinte), puis les copient dans le home du conteneur avant l'exécution afin que l'OAuth de CLI externe puisse rafraîchir des jetons sans modifier le magasin d'authentification de l'hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- ACP bind smoke : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Gateway + agent dev : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d'onboarding (TTY, échafaudage complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Réseau gateway (deux conteneurs, auth WS + health) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Pont de canal MCP (gateway initialisée + pont stdio + smoke brut de trame de notification Claude) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke d'installation + alias `/plugin` + sémantique de redémarrage du bundle Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)

Les runners Docker live-model montent aussi l'extraction actuelle en lecture seule et
la copient dans un répertoire de travail temporaire à l'intérieur du conteneur. Cela garde l'image runtime
légère tout en exécutant Vitest exactement contre votre code source/configuration local.
Ils définissent aussi `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes live gateway ne démarrent
pas de vrais workers de canaux Telegram/Discord/etc. dans le conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, donc faites aussi passer
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez restreindre ou exclure la couverture
gateway live de cette voie Docker.
`test:docker:openwebui` est un smoke de compatibilité de plus haut niveau : il démarre un
conteneur gateway OpenClaw avec les points de terminaison HTTP compatibles OpenAI activés,
démarre un conteneur Open WebUI épinglé contre cette gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une vraie
requête de chat via le proxy `/api/chat/completions` d'Open WebUI.
La première exécution peut être sensiblement plus lente car Docker peut devoir récupérer l'image
Open WebUI et Open WebUI peut devoir terminer sa propre configuration de démarrage à froid.
Cette voie attend une clé de modèle live exploitable, et `OPENCLAW_PROFILE_FILE`
(`~/.profile` par défaut) est le principal moyen de la fournir dans les exécutions conteneurisées.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est volontairement déterministe et n'a pas besoin d'un
vrai compte Telegram, Discord ou iMessage. Il démarre une gateway
initialisée, lance un second conteneur qui exécute `openclaw mcp serve`, puis
vérifie la découverte de conversations routées, la lecture de transcription, les métadonnées de pièces jointes,
le comportement de la file d'événements live, le routage des envois sortants, ainsi que les notifications de canal +
d'autorisation de style Claude via le vrai pont MCP stdio. La vérification des notifications
inspecte directement les trames MCP stdio brutes afin que le smoke valide ce que le
pont émet réellement, et non seulement ce qu'un SDK client particulier choisit d'exposer.

Smoke manuel ACP en langage naturel sur fil (hors CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression/débogage. Il pourrait être nécessaire à nouveau pour la validation du routage ACP sur fil, donc ne le supprimez pas.

Variables d'environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté sur `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté sur `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (par défaut : `~/.profile`) monté sur `/home/node/.profile` et sourcé avant l'exécution des tests
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté sur `/home/node/.npm-global` pour les installations CLI mises en cache dans Docker
- Les répertoires d'authentification CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth/...`, puis copiés dans `/home/node/...` avant le démarrage des tests
  - Par défaut : monter tous les répertoires pris en charge (`.codex`, `.claude`, `.minimax`)
  - Les exécutions restreintes à certains fournisseurs ne montent que les répertoires nécessaires déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacement manuel avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par des virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour restreindre l'exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour garantir que les identifiants proviennent du magasin de profils (et non de l'environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par la gateway pour le smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer le prompt de vérification du nonce utilisé par le smoke Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer le tag d'image Open WebUI épinglé

## Vérification de la documentation

Exécutez les vérifications docs après des modifications de documentation : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous avez aussi besoin des vérifications d'en-têtes dans la page : `pnpm docs:check-links:anchors`.

## Régression hors ligne (compatible CI)

Il s'agit de régressions « vrai pipeline » sans vrais fournisseurs :

- Appel d'outil gateway (faux OpenAI, vraie gateway + boucle d'agent) : `src/gateway/gateway.test.ts` (cas : "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistant gateway (WS `wizard.start`/`wizard.next`, écrit config + auth imposée) : `src/gateway/gateway.test.ts` (cas : "runs wizard over ws and writes auth token config")

## Évaluations de fiabilité d'agent (Skills)

Nous avons déjà quelques tests compatibles CI qui se comportent comme des « évaluations de fiabilité d'agent » :

- Appel d'outil simulé via la vraie gateway + boucle d'agent (`src/gateway/gateway.test.ts`).
- Flux d'assistant de bout en bout qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour les Skills (voir [Skills](/tools/skills)) :

- **Prise de décision :** lorsque les Skills sont listés dans le prompt, l'agent choisit-il la bonne Skill (ou évite-t-il celles qui ne sont pas pertinentes) ?
- **Conformité :** l'agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/arguments requis ?
- **Contrats de workflow :** scénarios multi-tours qui vérifient l'ordre des outils, la reprise de l'historique de session et les limites de sandbox.

Les futures évaluations doivent d'abord rester déterministes :

- Un runner de scénarios utilisant des fournisseurs simulés pour vérifier les appels d'outils + leur ordre, les lectures de fichiers de Skill et le câblage de session.
- Une petite suite de scénarios centrés sur les Skills (utiliser vs éviter, gating, injection de prompt).
- Des évaluations live facultatives (opt-in, contrôlées par env) uniquement après la mise en place de la suite compatible CI.

## Tests de contrat (forme des plugins et des canaux)

Les tests de contrat vérifient que chaque plugin et canal enregistré respecte
son contrat d'interface. Ils itèrent sur tous les plugins découverts et exécutent une suite
de vérifications de forme et de comportement. La voie unitaire par défaut `pnpm test`
ignore volontairement ces fichiers de seam partagé et de smoke ; exécutez explicitement
les commandes de contrat lorsque vous touchez à des surfaces partagées de canal ou de fournisseur.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canal uniquement : `pnpm test:contracts:channels`
- Contrats de fournisseur uniquement : `pnpm test:contracts:plugins`

### Contrats de canal

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - forme de base du plugin (id, nom, capacités)
- **setup** - contrat de l'assistant de configuration
- **session-binding** - comportement de liaison de session
- **outbound-payload** - structure de la charge utile de message
- **inbound** - gestion des messages entrants
- **actions** - gestionnaires d'actions du canal
- **threading** - gestion des IDs de fil
- **directory** - API d'annuaire/roster
- **group-policy** - application de la politique de groupe

### Contrats d'état de fournisseur

Situés dans `src/plugins/contracts/*.contract.test.ts`.

- **status** - sondes d'état de canal
- **registry** - forme du registre de plugins

### Contrats de fournisseur

Situés dans `src/plugins/contracts/*.contract.test.ts` :

- **auth** - contrat du flux d'authentification
- **auth-choice** - choix/sélection d'authentification
- **catalog** - API de catalogue de modèles
- **discovery** - découverte de plugin
- **loader** - chargement de plugin
- **runtime** - runtime du fournisseur
- **shape** - forme/interface du plugin
- **wizard** - assistant de configuration

### Quand les exécuter

- Après avoir modifié les exports ou sous-chemins de plugin-sdk
- Après avoir ajouté ou modifié un plugin de canal ou de fournisseur
- Après une refactorisation de l'enregistrement ou de la découverte de plugins

Les tests de contrat s'exécutent en CI et ne nécessitent pas de vraies clés API.

## Ajout de régressions (conseils)

Lorsque vous corrigez un problème de fournisseur/modèle découvert en live :

- Ajoutez si possible une régression compatible CI (fournisseur simulé/stub, ou capture de la transformation exacte de forme de requête)
- Si le problème est intrinsèquement live-only (limitations de débit, politiques d'authentification), gardez le test live restreint et opt-in via variables d'environnement
- Préférez cibler la couche la plus petite qui détecte le bug :
  - bug de conversion/relecture de requête fournisseur → test direct de modèles
  - bug de pipeline gateway session/historique/outils → gateway live smoke ou test simulé de gateway compatible CI
- Garde-fou de traversée SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillon par classe SecretRef à partir des métadonnées du registre (`listSecretTargetRegistryEntries()`), puis vérifie que les IDs exec avec segments de traversée sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue intentionnellement sur les IDs de cibles non classés afin que les nouvelles classes ne puissent pas être ignorées silencieusement.
