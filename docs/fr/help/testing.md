---
read_when:
    - Exécuter les tests en local ou dans CI
    - Ajouter des tests de régression pour les bugs de modèle/fournisseur
    - Déboguer le comportement de Gateway et de l’agent
summary: 'Kit de test : suites unitaires/e2e/live, exécuteurs Docker, et ce que couvre chaque test'
title: Testირება
x-i18n:
    generated_at: "2026-04-16T21:51:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: af2bc0e9b5e08ca3119806d355b517290f6078fda430109e7a0b153586215e34
    source_path: help/testing.md
    workflow: 15
---

# Tests

OpenClaw propose trois suites Vitest (unitaire/intégration, e2e, live) et un petit ensemble d’exécuteurs Docker.

Cette documentation est un guide « comment nous testons » :

- Ce que couvre chaque suite (et ce qu’elle ne couvre délibérément _pas_)
- Quelles commandes exécuter pour les workflows courants (local, avant push, débogage)
- Comment les tests live découvrent les identifiants et sélectionnent les modèles/fournisseurs
- Comment ajouter des tests de régression pour des problèmes réels de modèle/fournisseur

## Démarrage rapide

La plupart du temps :

- Porte complète (attendue avant push) : `pnpm build && pnpm check && pnpm test`
- Exécution locale plus rapide de la suite complète sur une machine bien dimensionnée : `pnpm test:max`
- Boucle de surveillance Vitest directe : `pnpm test:watch`
- Le ciblage direct de fichier route maintenant aussi les chemins d’extension/de canal : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Préférez d’abord les exécutions ciblées quand vous itérez sur un seul échec.
- Site QA adossé à Docker : `pnpm qa:lab:up`
- Voie QA adossée à une VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quand vous modifiez des tests ou voulez plus de confiance :

- Porte de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

Quand vous déboguez de vrais fournisseurs/modèles (nécessite de vrais identifiants) :

- Suite live (modèles + sondes d’outils/images Gateway) : `pnpm test:live`
- Cibler silencieusement un seul fichier live : `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Astuce : quand vous n’avez besoin que d’un seul cas en échec, préférez restreindre les tests live via les variables d’environnement de liste d’autorisation décrites ci-dessous.

## Exécuteurs spécifiques à la QA

Ces commandes se trouvent à côté des suites de test principales quand vous avez besoin du réalisme de qa-lab :

- `pnpm openclaw qa suite`
  - Exécute directement sur l’hôte des scénarios QA adossés au dépôt.
  - Exécute par défaut plusieurs scénarios sélectionnés en parallèle avec des workers Gateway isolés, jusqu’à 64 workers ou au nombre de scénarios sélectionnés. Utilisez `--concurrency <count>` pour ajuster le nombre de workers, ou `--concurrency 1` pour l’ancienne voie sérielle.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite QA dans une VM Linux Multipass jetable.
  - Conserve le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
  - Réutilise les mêmes drapeaux de sélection de fournisseur/modèle que `qa suite`.
  - Les exécutions live transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour l’invité :
    clés de fournisseur basées sur l’environnement, chemin de configuration du fournisseur live QA, et `CODEX_HOME` si présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt pour que l’invité puisse réécrire via l’espace de travail monté.
  - Écrit le rapport QA normal + le résumé ainsi que les logs Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA adossé à Docker pour le travail QA de type opérateur.
- `pnpm openclaw qa matrix`
  - Exécute la voie QA live Matrix contre un homeserver Tuwunel jetable adossé à Docker.
  - Cet hôte QA est pour le dépôt/le développement uniquement aujourd’hui. Les installations OpenClaw packagées n’incluent pas `qa-lab`, elles n’exposent donc pas `openclaw qa`.
  - Les extractions du dépôt chargent directement l’exécuteur intégré ; aucune étape d’installation de plugin séparée n’est nécessaire.
  - Approvisionne trois utilisateurs Matrix temporaires (`driver`, `sut`, `observer`) ainsi qu’une salle privée, puis démarre un processus enfant de Gateway QA avec le vrai plugin Matrix comme transport SUT.
  - Utilise par défaut l’image Tuwunel stable épinglée `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Remplacez-la avec `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quand vous devez tester une autre image.
  - Matrix n’expose pas de drapeaux partagés de source d’identifiants, car la voie provisionne localement des utilisateurs jetables.
  - Écrit un rapport QA Matrix, un résumé, un artefact observed-events, et un log de sortie combiné stdout/stderr sous `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Exécute la voie QA live Telegram contre un groupe privé réel en utilisant les jetons de bot du driver et du SUT depuis l’environnement.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, et `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’identifiant du groupe doit être l’identifiant numérique du chat Telegram.
  - Prend en charge `--credential-source convex` pour des identifiants partagés mutualisés. Utilisez le mode env par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour utiliser des baux mutualisés.
  - Nécessite deux bots distincts dans le même groupe privé, avec le bot SUT exposant un nom d’utilisateur Telegram.
  - Pour une observation stable entre bots, activez le mode de communication bot-à-bot dans `@BotFather` pour les deux bots et assurez-vous que le bot driver peut observer le trafic des bots du groupe.
  - Écrit un rapport QA Telegram, un résumé et un artefact observed-messages sous `.artifacts/qa-e2e/...`.

Les voies de transport live partagent un contrat standard pour éviter que les nouveaux transports ne divergent :

`qa-channel` reste la suite QA synthétique large et ne fait pas partie de la matrice de couverture des transports live.

| Voie     | Canary | Filtrage des mentions | Blocage par liste d’autorisation | Réponse de premier niveau | Reprise après redémarrage | Suivi de fil | Isolation du fil | Observation des réactions | Commande d’aide |
| -------- | ------ | --------------------- | -------------------------------- | ------------------------- | ------------------------- | ------------ | ---------------- | ------------------------- | --------------- |
| Matrix   | x      | x                     | x                                | x                         | x                         | x            | x                | x                         |                 |
| Telegram | x      |                       |                                  |                           |                           |              |                  |                           | x               |

### Identifiants Telegram partagés via Convex (v1)

Quand `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour
`openclaw qa telegram`, QA lab acquiert un bail exclusif depuis un pool adossé à Convex, envoie un Heartbeat pour
ce bail pendant l’exécution de la voie, puis libère le bail à l’arrêt.

Squelette de projet Convex de référence :

- `qa/convex-credential-broker/`

Variables d’environnement requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle des identifiants :
  - CLI : `--credential-role maintainer|ci`
  - Valeur par défaut de l’environnement : `OPENCLAW_QA_CREDENTIAL_ROLE` (par défaut : `maintainer`)

Variables d’environnement facultatives :

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (par défaut `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (par défaut `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (par défaut `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (par défaut `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (par défaut `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (identifiant de traçage facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex `http://` de loopback pour le développement strictement local.

`OPENCLAW_QA_CONVEX_SITE_URL` doit utiliser `https://` en fonctionnement normal.

Les commandes d’administration mainteneur (ajout/suppression/liste du pool) nécessitent
spécifiquement `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Aides CLI pour les mainteneurs :

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Utilisez `--json` pour une sortie lisible par machine dans les scripts et utilitaires CI.

Contrat de point de terminaison par défaut (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`) :

- `POST /acquire`
  - Requête : `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Succès : `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Épuisé / réessayable : `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Succès : `{ status: "ok" }` (ou `2xx` vide)
- `POST /release`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Succès : `{ status: "ok" }` (ou `2xx` vide)
- `POST /admin/add` (secret mainteneur uniquement)
  - Requête : `{ kind, actorId, payload, note?, status? }`
  - Succès : `{ status: "ok", credential }`
- `POST /admin/remove` (secret mainteneur uniquement)
  - Requête : `{ credentialId, actorId }`
  - Succès : `{ status: "ok", changed, credential }`
  - Garde de bail actif : `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret mainteneur uniquement)
  - Requête : `{ kind?, status?, includePayload?, limit? }`
  - Succès : `{ status: "ok", credentials, count }`

Structure de payload pour le type Telegram :

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` doit être une chaîne représentant un identifiant numérique de chat Telegram.
- `admin/add` valide cette structure pour `kind: "telegram"` et rejette les payloads mal formés.

### Ajouter un canal à la QA

Ajouter un canal au système QA Markdown nécessite exactement deux choses :

1. Un adaptateur de transport pour le canal.
2. Un pack de scénarios qui exerce le contrat du canal.

N’ajoutez pas une nouvelle racine de commande QA de premier niveau quand l’hôte partagé `qa-lab` peut
gérer le flux.

`qa-lab` gère les mécanismes d’hôte partagés :

- la racine de commande `openclaw qa`
- le démarrage et l’arrêt de la suite
- la concurrence des workers
- l’écriture des artefacts
- la génération de rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les plugins d’exécuteur gèrent le contrat de transport :

- comment `openclaw qa <runner>` est monté sous la racine partagée `qa`
- comment Gateway est configuré pour ce transport
- comment l’état prêt est vérifié
- comment les événements entrants sont injectés
- comment les messages sortants sont observés
- comment les transcriptions et l’état de transport normalisé sont exposés
- comment les actions adossées au transport sont exécutées
- comment la réinitialisation ou le nettoyage spécifiques au transport sont gérés

Le seuil minimal d’adoption pour un nouveau canal est :

1. Conserver `qa-lab` comme propriétaire de la racine partagée `qa`.
2. Implémenter l’exécuteur de transport sur l’interface d’hôte partagée `qa-lab`.
3. Conserver les mécanismes spécifiques au transport dans le plugin d’exécuteur ou le harnais du canal.
4. Monter l’exécuteur sous `openclaw qa <runner>` au lieu d’enregistrer une racine de commande concurrente.
   Les plugins d’exécuteur doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`.
   Gardez `runtime-api.ts` léger ; l’exécution paresseuse de la CLI et de l’exécuteur doit rester derrière des points d’entrée séparés.
5. Rédiger ou adapter les scénarios Markdown sous `qa/scenarios/`.
6. Utiliser les aides de scénario génériques pour les nouveaux scénarios.
7. Conserver les alias de compatibilité existants en fonctionnement, sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si un comportement peut être exprimé une seule fois dans `qa-lab`, placez-le dans `qa-lab`.
- Si un comportement dépend d’un transport de canal, conservez-le dans ce plugin d’exécuteur ou ce harnais de plugin.
- Si un scénario nécessite une nouvelle capacité que plusieurs canaux peuvent utiliser, ajoutez une aide générique plutôt qu’une branche spécifique à un canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un seul transport, gardez le scénario spécifique à ce transport et rendez cela explicite dans le contrat du scénario.

Les noms d’aides génériques préférés pour les nouveaux scénarios sont :

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Des alias de compatibilité restent disponibles pour les scénarios existants, notamment :

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Les nouveaux travaux sur les canaux doivent utiliser les noms d’aide génériques.
Les alias de compatibilité existent pour éviter une migration brutale, pas comme modèle pour
la rédaction de nouveaux scénarios.

## Suites de test (ce qui s’exécute où)

Considérez les suites comme un « réalisme croissant » (et une fragilité/un coût croissants) :

### Unitaire / intégration (par défaut)

- Commande : `pnpm test`
- Configuration : dix exécutions de fragments séquentielles (`vitest.full-*.config.ts`) sur les projets Vitest ciblés existants
- Fichiers : inventaires core/unit sous `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts`, et les tests node `ui` autorisés couverts par `vitest.unit.config.ts`
- Portée :
  - Tests unitaires purs
  - Tests d’intégration en processus (auth Gateway, routage, outillage, parsing, configuration)
  - Régressions déterministes pour des bugs connus
- Attentes :
  - S’exécute dans CI
  - Aucune vraie clé requise
  - Doit être rapide et stable
- Note sur les projets :
  - `pnpm test` sans ciblage exécute maintenant onze petites configurations fragmentées (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un seul énorme processus projet-racine natif. Cela réduit le pic de RSS sur les machines chargées et évite que le travail auto-reply/extension n’affame les suites non liées.
  - `pnpm test --watch` utilise toujours le graphe de projets racine natif `vitest.config.ts`, car une boucle de surveillance multi-fragments n’est pas pratique.
  - `pnpm test`, `pnpm test:watch`, et `pnpm test:perf:imports` font passer en priorité les cibles explicites de fichier/répertoire par des voies ciblées, donc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite de payer le coût de démarrage complet du projet racine.
  - `pnpm test:changed` étend les chemins git modifiés vers ces mêmes voies ciblées quand le diff ne touche que des fichiers source/test routables ; les modifications de config/setup reviennent toujours à une relance large du projet racine.
  - Les tests unitaires légers à l’import depuis agents, commands, plugins, aides auto-reply, `plugin-sdk`, et zones utilitaires pures similaires passent par la voie `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers stateful/lourds à l’exécution restent sur les voies existantes.
  - Certains fichiers source utilitaires `plugin-sdk` et `commands` sélectionnés font aussi correspondre les exécutions en mode changed à des tests frères explicites dans ces voies légères, afin que les modifications d’aides évitent de relancer toute la suite lourde pour ce répertoire.
  - `auto-reply` a maintenant trois compartiments dédiés : aides core de premier niveau, tests d’intégration `reply.*` de premier niveau, et le sous-arbre `src/auto-reply/reply/**`. Cela garde le travail de harnais de réponse le plus lourd à l’écart des tests bon marché de statut/bloc/token.
- Note sur l’exécuteur embarqué :
  - Quand vous modifiez les entrées de découverte des outils de message ou le contexte d’exécution de Compaction,
    conservez les deux niveaux de couverture.
  - Ajoutez des régressions d’aides ciblées pour les frontières pures de routage/normalisation.
  - Gardez également saines les suites d’intégration de l’exécuteur embarqué :
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, et
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ces suites vérifient que les identifiants ciblés et le comportement de Compaction passent toujours
    par les vrais chemins `run.ts` / `compact.ts` ; des tests d’aides seuls ne sont pas
    un substitut suffisant à ces chemins d’intégration.
- Note sur le pool :
  - La configuration Vitest de base utilise désormais `threads` par défaut.
  - La configuration Vitest partagée fixe aussi `isolate: false` et utilise l’exécuteur non isolé sur les projets racine, e2e et live.
  - La voie UI racine conserve sa configuration `jsdom` et son optimiseur, mais s’exécute désormais aussi sur l’exécuteur partagé non isolé.
  - Chaque fragment `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false` depuis la configuration Vitest partagée.
  - Le lanceur partagé `scripts/run-vitest.mjs` ajoute maintenant aussi `--no-maglev` par défaut pour les processus enfant Node de Vitest afin de réduire l’agitation de compilation V8 pendant les grosses exécutions locales. Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` si vous devez comparer avec le comportement V8 standard.
- Note sur l’itération locale rapide :
  - `pnpm test:changed` passe par des voies ciblées lorsque les chemins modifiés correspondent proprement à une suite plus petite.
  - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage, simplement avec une limite de workers plus élevée.
  - L’auto-dimensionnement local des workers est maintenant volontairement conservateur et réduit aussi la charge quand la moyenne de charge de l’hôte est déjà élevée, afin que plusieurs exécutions Vitest concurrentes fassent moins de dégâts par défaut.
  - La configuration Vitest de base marque les fichiers de projet/configuration comme `forceRerunTriggers` afin que les relances en mode changed restent correctes quand le câblage des tests change.
  - La configuration garde `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes pris en charge ; définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez un emplacement de cache explicite pour du profilage direct.
- Note de débogage des performances :
  - `pnpm test:perf:imports` active les rapports de durée d’import Vitest ainsi qu’une sortie détaillée des imports.
  - `pnpm test:perf:imports:changed` applique cette même vue de profilage aux fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compare `test:changed` routé avec le chemin natif projet-racine pour ce diff validé et affiche le temps mur ainsi que le RSS max macOS.
- `pnpm test:perf:changed:bench -- --worktree` mesure l’arbre de travail courant en faisant passer la liste des fichiers modifiés par `scripts/test-projects.mjs` et la configuration Vitest racine.
  - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour les coûts de démarrage et de transformation Vitest/Vite.
  - `pnpm test:perf:profile:runner` écrit des profils CPU+tas de l’exécuteur pour la suite unitaire avec le parallélisme de fichiers désactivé.

### E2E (smoke Gateway)

- Commande : `pnpm test:e2e`
- Configuration : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Valeurs d’exécution par défaut :
  - Utilise `threads` de Vitest avec `isolate: false`, comme le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute en mode silencieux par défaut pour réduire le coût des E/S console.
- Remplacements utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console détaillée.
- Portée :
  - Comportement end-to-end Gateway multi-instance
  - Surfaces WebSocket/HTTP, appairage de nœuds et réseau plus lourd
- Attentes :
  - S’exécute dans CI (lorsqu’activé dans le pipeline)
  - Aucune vraie clé requise
  - Plus de pièces mobiles que les tests unitaires (peut être plus lent)

### E2E : smoke du backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `test/openshell-sandbox.e2e.test.ts`
- Portée :
  - Démarre un Gateway OpenShell isolé sur l’hôte via Docker
  - Crée un sandbox à partir d’un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via de vrais `sandbox ssh-config` + exécution SSH
  - Vérifie le comportement du système de fichiers canonique distant via le pont fs du sandbox
- Attentes :
  - Opt-in uniquement ; ne fait pas partie de l’exécution par défaut `pnpm test:e2e`
  - Nécessite une CLI `openshell` locale ainsi qu’un démon Docker fonctionnel
  - Utilise `HOME` / `XDG_CONFIG_HOME` isolés, puis détruit le Gateway de test et le sandbox
- Remplacements utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI non standard ou un script wrapper

### Live (vrais fournisseurs + vrais modèles)

- Commande : `pnpm test:live`
- Configuration : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Est-ce que ce fournisseur/modèle fonctionne vraiment _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format de fournisseur, les particularités d’appel d’outils, les problèmes d’authentification et le comportement de limite de débit
- Attentes :
  - Pas stable pour CI par conception (vrais réseaux, vraies politiques de fournisseur, quotas, pannes)
  - Coûte de l’argent / consomme des limites de débit
  - Préférez exécuter des sous-ensembles restreints plutôt que « tout »
- Les exécutions live chargent `~/.profile` pour récupérer les clés API manquantes.
- Par défaut, les exécutions live isolent toujours `HOME` et copient les éléments de configuration/authentification dans un home de test temporaire afin que les fixtures unitaires ne puissent pas modifier votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous avez intentionnellement besoin que les tests live utilisent votre vrai répertoire home.
- `pnpm test:live` utilise maintenant par défaut un mode plus discret : il conserve la sortie de progression `[live] ...`, mais masque l’avis supplémentaire `~/.profile` et coupe les logs de bootstrap Gateway / le bruit Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous voulez récupérer les logs complets de démarrage.
- Rotation des clés API (spécifique au fournisseur) : définissez `*_API_KEYS` avec un format virgule/point-virgule ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou un remplacement par live via `OPENCLAW_LIVE_*_KEY` ; les tests réessaient sur les réponses de limitation de débit.
- Sortie de progression/Heartbeat :
  - Les suites live émettent maintenant des lignes de progression vers stderr afin que les longs appels fournisseur soient visiblement actifs même lorsque la capture console Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l’interception console de Vitest afin que les lignes de progression fournisseur/Gateway soient diffusées immédiatement pendant les exécutions live.
  - Ajustez les Heartbeat de modèle direct avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajustez les Heartbeat Gateway/sonde avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modification de logique/tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup modifié)
- Modification du réseau Gateway / du protocole WS / de l’appairage : ajoutez `pnpm test:e2e`
- Débogage de « mon bot est en panne » / d’échecs spécifiques au fournisseur / d’appels d’outils : exécutez un `pnpm test:live` restreint

## Live : balayage des capacités du nœud Android

- Test : `src/gateway/android-node.capabilities.live.test.ts`
- Script : `pnpm android:test:integration`
- Objectif : invoquer **chaque commande actuellement annoncée** par un nœud Android connecté et vérifier le comportement du contrat de commande.
- Portée :
  - Configuration préalable/manuelle (la suite n’installe pas, n’exécute pas et n’appaire pas l’application).
  - Validation Gateway `node.invoke` commande par commande pour le nœud Android sélectionné.
- Préconfiguration requise :
  - Application Android déjà connectée et appairée à Gateway.
  - Application maintenue au premier plan.
  - Permissions/consentement de capture accordés pour les capacités que vous attendez de voir réussir.
- Remplacements de cible facultatifs :
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Détails complets de configuration Android : [Application Android](/fr/platforms/android)

## Live : smoke des modèles (clés de profil)

Les tests live sont divisés en deux couches afin d’isoler les échecs :

- « Modèle direct » nous indique si le fournisseur/modèle peut répondre tout court avec la clé donnée.
- « Smoke Gateway » nous indique si le pipeline complet Gateway+agent fonctionne pour ce modèle (sessions, historique, outils, politique sandbox, etc.).

### Couche 1 : complétion de modèle directe (sans Gateway)

- Test : `src/agents/models.profiles.live.test.ts`
- Objectif :
  - Énumérer les modèles découverts
  - Utiliser `getApiKeyForModel` pour sélectionner les modèles pour lesquels vous avez des identifiants
  - Exécuter une petite complétion par modèle (et des régressions ciblées si nécessaire)
- Comment l’activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Définissez `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias de modern) pour exécuter réellement cette suite ; sinon elle est ignorée afin de garder `pnpm test:live` centré sur le smoke Gateway
- Comment sélectionner les modèles :
  - `OPENCLAW_LIVE_MODELS=modern` pour exécuter la liste d’autorisation moderne (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` est un alias de la liste d’autorisation moderne
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (liste d’autorisation séparée par des virgules)
  - Les balayages modern/all utilisent par défaut une limite sélectionnée à fort signal ; définissez `OPENCLAW_LIVE_MAX_MODELS=0` pour un balayage modern exhaustif ou une valeur positive pour une limite plus petite.
- Comment sélectionner les fournisseurs :
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (liste d’autorisation séparée par des virgules)
- D’où viennent les clés :
  - Par défaut : magasin de profils et replis environnementaux
  - Définissez `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour imposer **uniquement le magasin de profils**
- Pourquoi cela existe :
  - Sépare « l’API fournisseur est cassée / la clé est invalide » de « le pipeline d’agent Gateway est cassé »
  - Contient de petites régressions isolées (exemple : rejouage du raisonnement OpenAI Responses/Codex Responses + flux d’appels d’outils)

### Couche 2 : smoke Gateway + agent de développement (ce que fait réellement "@openclaw")

- Test : `src/gateway/gateway-models.profiles.live.test.ts`
- Objectif :
  - Démarrer un Gateway en processus
  - Créer/modifier une session `agent:dev:*` (remplacement de modèle par exécution)
  - Itérer sur les modèles avec clés et vérifier :
    - réponse « pertinente » (sans outils)
    - le fonctionnement d’une vraie invocation d’outil (sonde de lecture)
    - des sondes d’outils supplémentaires facultatives (sonde exec+lecture)
    - que les chemins de régression OpenAI (appel d’outil seul → suivi) continuent de fonctionner
- Détails des sondes (pour pouvoir expliquer rapidement les échecs) :
  - sonde `read` : le test écrit un fichier nonce dans l’espace de travail et demande à l’agent de le `read` puis de renvoyer le nonce.
  - sonde `exec+read` : le test demande à l’agent d’écrire un nonce dans un fichier temporaire via `exec`, puis de le relire via `read`.
  - sonde d’image : le test joint un PNG généré (chat + code aléatoire) et attend du modèle qu’il renvoie `cat <CODE>`.
  - Référence d’implémentation : `src/gateway/gateway-models.profiles.live.test.ts` et `src/gateway/live-image-probe.ts`.
- Comment l’activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Comment sélectionner les modèles :
  - Par défaut : liste d’autorisation moderne (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` est un alias de la liste d’autorisation moderne
  - Ou définissez `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou une liste séparée par des virgules) pour restreindre
  - Les balayages Gateway modern/all utilisent par défaut une limite sélectionnée à fort signal ; définissez `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` pour un balayage moderne exhaustif ou une valeur positive pour une limite plus petite.
- Comment sélectionner les fournisseurs (éviter « tout OpenRouter ») :
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (liste d’autorisation séparée par des virgules)
- Les sondes d’outil + d’image sont toujours activées dans ce test live :
  - sonde `read` + sonde `exec+read` (stress des outils)
  - la sonde d’image s’exécute quand le modèle annonce la prise en charge de l’entrée image
  - Flux (vue d’ensemble) :
    - Le test génère un petit PNG avec « CAT » + un code aléatoire (`src/gateway/live-image-probe.ts`)
    - L’envoie via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parse les pièces jointes dans `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L’agent embarqué transmet au modèle un message utilisateur multimodal
    - Vérification : la réponse contient `cat` + le code (tolérance OCR : de petites erreurs sont autorisées)

Astuce : pour voir ce que vous pouvez tester sur votre machine (et les identifiants exacts `provider/model`), exécutez :

```bash
openclaw models list
openclaw models list --json
```

## Live : smoke du backend CLI (Claude, Codex, Gemini, ou autres CLI locales)

- Test : `src/gateway/gateway-cli-backend.live.test.ts`
- Objectif : valider le pipeline Gateway + agent à l’aide d’un backend CLI local, sans toucher à votre configuration par défaut.
- Les valeurs par défaut de smoke spécifiques au backend se trouvent dans la définition `cli-backend.ts` de l’extension propriétaire.
- Activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valeurs par défaut :
  - Fournisseur/modèle par défaut : `claude-cli/claude-sonnet-4-6`
  - Le comportement commande/arguments/image provient des métadonnées du plugin backend CLI propriétaire.
- Remplacements facultatifs :
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` pour envoyer une vraie pièce jointe image (les chemins sont injectés dans le prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` pour transmettre les chemins de fichier image comme arguments CLI au lieu de l’injection dans le prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) pour contrôler comment les arguments image sont transmis lorsque `IMAGE_ARG` est défini.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` pour envoyer un deuxième tour et valider le flux de reprise.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` pour désactiver la sonde par défaut de continuité de même session Claude Sonnet -> Opus (définissez `1` pour la forcer lorsque le modèle sélectionné prend en charge une cible de bascule).

Exemple :

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Recette Docker :

```bash
pnpm test:docker:live-cli-backend
```

Recettes Docker à fournisseur unique :

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Notes :

- L’exécuteur Docker se trouve dans `scripts/test-live-cli-backend-docker.sh`.
- Il exécute le smoke live du backend CLI dans l’image Docker du dépôt en tant qu’utilisateur `node` non root.
- Il résout les métadonnées de smoke CLI depuis l’extension propriétaire, puis installe le paquet CLI Linux correspondant (`@anthropic-ai/claude-code`, `@openai/codex`, ou `@google/gemini-cli`) dans un préfixe inscriptible en cache à `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (par défaut : `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` nécessite une authentification OAuth portable à l’abonnement Claude Code via soit `~/.claude/.credentials.json` avec `claudeAiOauth.subscriptionType`, soit `CLAUDE_CODE_OAUTH_TOKEN` depuis `claude setup-token`. Il prouve d’abord `claude -p` direct dans Docker, puis exécute deux tours Gateway backend CLI sans conserver les variables d’environnement de clé API Anthropic. Cette voie d’abonnement désactive par défaut l’outil Claude MCP et les sondes d’image, car Claude route actuellement l’usage d’applications tierces via une facturation d’usage supplémentaire plutôt que via les limites normales du plan d’abonnement.
- Le smoke live du backend CLI exerce maintenant le même flux end-to-end pour Claude, Codex et Gemini : tour texte, tour de classification d’image, puis appel d’outil MCP `cron` vérifié via la CLI Gateway.
- Le smoke par défaut de Claude modifie aussi la session de Sonnet vers Opus et vérifie que la session reprise se souvient toujours d’une note antérieure.

## Live : smoke de liaison ACP (`/acp spawn ... --bind here`)

- Test : `src/gateway/gateway-acp-bind.live.test.ts`
- Objectif : valider le vrai flux de liaison de conversation ACP avec un agent ACP live :
  - envoyer `/acp spawn <agent> --bind here`
  - lier sur place une conversation synthétique de canal de messages
  - envoyer un suivi normal sur cette même conversation
  - vérifier que le suivi arrive dans la transcription de session ACP liée
- Activer :
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valeurs par défaut :
  - Agents ACP dans Docker : `claude,codex,gemini`
  - Agent ACP pour `pnpm test:live ...` direct : `claude`
  - Canal synthétique : contexte de conversation de type message privé Slack
  - Backend ACP : `acpx`
- Remplacements :
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Notes :
  - Cette voie utilise la surface Gateway `chat.send` avec des champs `originating-route` synthétiques réservés à l’administrateur afin que les tests puissent attacher un contexte de canal de messages sans prétendre effectuer une livraison externe.
  - Quand `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` n’est pas défini, le test utilise le registre d’agents intégré du plugin `acpx` embarqué pour l’agent de harnais ACP sélectionné.

Exemple :

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Recette Docker :

```bash
pnpm test:docker:live-acp-bind
```

Recettes Docker à agent unique :

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Notes Docker :

- L’exécuteur Docker se trouve dans `scripts/test-live-acp-bind-docker.sh`.
- Par défaut, il exécute le smoke de liaison ACP contre tous les agents CLI live pris en charge en séquence : `claude`, `codex`, puis `gemini`.
- Utilisez `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` pour restreindre la matrice.
- Il charge `~/.profile`, prépare le matériel d’authentification CLI correspondant dans le conteneur, installe `acpx` dans un préfixe npm inscriptible, puis installe la CLI live demandée (`@anthropic-ai/claude-code`, `@openai/codex`, ou `@google/gemini-cli`) si elle est absente.
- Dans Docker, l’exécuteur définit `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` afin que acpx conserve les variables d’environnement fournisseur du profil chargé disponibles pour la CLI harnais enfant.

## Live : smoke du harnais app-server Codex

- Objectif : valider le harnais Codex appartenant au plugin via la méthode
  Gateway `agent` normale :
  - charger le plugin `codex` intégré
  - sélectionner `OPENCLAW_AGENT_RUNTIME=codex`
  - envoyer un premier tour d’agent Gateway vers `codex/gpt-5.4`
  - envoyer un deuxième tour à la même session OpenClaw et vérifier que le fil
    app-server peut reprendre
  - exécuter `/codex status` et `/codex models` via le même chemin de commande
    Gateway
- Test : `src/gateway/gateway-codex-harness.live.test.ts`
- Activer : `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modèle par défaut : `codex/gpt-5.4`
- Sonde d’image facultative : `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonde MCP/outil facultative : `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Le smoke définit `OPENCLAW_AGENT_HARNESS_FALLBACK=none` afin qu’un harnais Codex
  cassé ne puisse pas réussir en retombant silencieusement sur PI.
- Authentification : `OPENAI_API_KEY` depuis le shell/profil, plus éventuelle copie de
  `~/.codex/auth.json` et `~/.codex/config.toml`

Recette locale :

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Recette Docker :

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Notes Docker :

- L’exécuteur Docker se trouve dans `scripts/test-live-codex-harness-docker.sh`.
- Il charge le `~/.profile` monté, transmet `OPENAI_API_KEY`, copie les fichiers d’authentification CLI Codex lorsqu’ils sont présents, installe `@openai/codex` dans un préfixe npm monté inscriptible, prépare l’arbre source, puis n’exécute que le test live du harnais Codex.
- Docker active par défaut les sondes d’image et MCP/outil. Définissez
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` lorsque vous avez besoin d’une exécution de débogage plus restreinte.
- Docker exporte aussi `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, conformément à la
  configuration du test live afin que le repli `openai-codex/*` ou PI ne puisse pas masquer une régression du harnais Codex.

### Recettes live recommandées

Les listes d’autorisation restreintes et explicites sont les plus rapides et les moins fragiles :

- Modèle unique, direct (sans Gateway) :
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modèle unique, smoke Gateway :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Appel d’outils sur plusieurs fournisseurs :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (clé API Gemini + Antigravity) :
  - Gemini (clé API) : `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth) : `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notes :

- `google/...` utilise l’API Gemini (clé API).
- `google-antigravity/...` utilise le pont OAuth Antigravity (point de terminaison d’agent de style Cloud Code Assist).
- `google-gemini-cli/...` utilise la CLI Gemini locale sur votre machine (authentification séparée + particularités d’outillage).
- API Gemini vs CLI Gemini :
  - API : OpenClaw appelle l’API Gemini hébergée par Google via HTTP (clé API / authentification de profil) ; c’est ce que la plupart des utilisateurs veulent dire par « Gemini ».
  - CLI : OpenClaw exécute un binaire `gemini` local ; il a sa propre authentification et peut se comporter différemment (streaming/prise en charge des outils/décalage de version).

## Live : matrice de modèles (ce que nous couvrons)

Il n’existe pas de « liste de modèles CI » fixe (le live est opt-in), mais voici les modèles **recommandés** à couvrir régulièrement sur une machine de développement disposant de clés.

### Ensemble de smoke moderne (appel d’outils + image)

C’est l’exécution « modèles courants » que nous nous attendons à maintenir opérationnelle :

- OpenAI (hors Codex) : `openai/gpt-5.4` (facultatif : `openai/gpt-5.4-mini`)
- OpenAI Codex : `openai-codex/gpt-5.4`
- Anthropic : `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini) : `google/gemini-3.1-pro-preview` et `google/gemini-3-flash-preview` (évitez les anciens modèles Gemini 2.x)
- Google (Antigravity) : `google-antigravity/claude-opus-4-6-thinking` et `google-antigravity/gemini-3-flash`
- Z.AI (GLM) : `zai/glm-4.7`
- MiniMax : `minimax/MiniMax-M2.7`

Exécutez le smoke Gateway avec outils + image :
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Référence de base : appel d’outils (Read + Exec facultatif)

Choisissez au moins un modèle par famille de fournisseurs :

- OpenAI : `openai/gpt-5.4` (ou `openai/gpt-5.4-mini`)
- Anthropic : `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google : `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- Z.AI (GLM) : `zai/glm-4.7`
- MiniMax : `minimax/MiniMax-M2.7`

Couverture facultative supplémentaire (souhaitable) :

- xAI : `xai/grok-4` (ou la dernière version disponible)
- Mistral : `mistral/`… (choisissez un modèle compatible « tools » que vous avez activé)
- Cerebras : `cerebras/`… (si vous y avez accès)
- LM Studio : `lmstudio/`… (local ; l’appel d’outils dépend du mode API)

### Vision : envoi d’image (pièce jointe → message multimodal)

Incluez au moins un modèle compatible image dans `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes Claude/Gemini/OpenAI compatibles vision, etc.) afin d’exercer la sonde d’image.

### Agrégateurs / passerelles alternatives

Si vous avez les clés activées, nous prenons aussi en charge des tests via :

- OpenRouter : `openrouter/...` (des centaines de modèles ; utilisez `openclaw models scan` pour trouver des candidats compatibles outil+image)
- OpenCode : `opencode/...` pour Zen et `opencode-go/...` pour Go (authentification via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Autres fournisseurs que vous pouvez inclure dans la matrice live (si vous avez les identifiants/la configuration) :

- Intégrés : `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (points de terminaison personnalisés) : `minimax` (cloud/API), ainsi que tout proxy compatible OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

Astuce : n’essayez pas de coder en dur « tous les modèles » dans la documentation. La liste faisant autorité est celle que `discoverModels(...)` renvoie sur votre machine + les clés disponibles.

## Identifiants (ne jamais commit)

Les tests live découvrent les identifiants de la même manière que la CLI. Implications pratiques :

- Si la CLI fonctionne, les tests live devraient trouver les mêmes clés.
- Si un test live indique « aucun identifiant », déboguez-le de la même manière que `openclaw models list` / la sélection de modèle.

- Profils d’authentification par agent : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (c’est ce que signifient les « clés de profil » dans les tests live)
- Configuration : `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Répertoire d’état hérité : `~/.openclaw/credentials/` (copié dans le home live préparé quand il est présent, mais pas dans le magasin principal de clés de profil)
- Les exécutions live locales copient par défaut la configuration active, les fichiers `auth-profiles.json` par agent, le répertoire hérité `credentials/` et les répertoires d’authentification CLI externes pris en charge dans un home de test temporaire ; les homes live préparés ignorent `workspace/` et `sandboxes/`, et les remplacements de chemin `agents.*.workspace` / `agentDir` sont supprimés afin que les sondes restent hors de votre véritable espace de travail hôte.

Si vous voulez vous appuyer sur des clés d’environnement (par exemple exportées dans votre `~/.profile`), exécutez les tests locaux après `source ~/.profile`, ou utilisez les exécuteurs Docker ci-dessous (ils peuvent monter `~/.profile` dans le conteneur).

## Deepgram live (transcription audio)

- Test : `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Activer : `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Test : `src/agents/byteplus.live.test.ts`
- Activer : `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Remplacement facultatif du modèle : `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Test : `extensions/comfy/comfy.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Portée :
  - Exerce les chemins image, vidéo et `music_generate` du paquet comfy intégré
  - Ignore chaque capacité sauf si `models.providers.comfy.<capability>` est configuré
  - Utile après avoir modifié l’envoi de workflow comfy, le polling, les téléchargements ou l’enregistrement du plugin

## Génération d’image live

- Test : `src/image-generation/runtime.live.test.ts`
- Commande : `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harnais : `pnpm test:live:media image`
- Portée :
  - Énumère chaque plugin fournisseur de génération d’image enregistré
  - Charge les variables d’environnement fournisseur manquantes depuis votre shell de connexion (`~/.profile`) avant les sondes
  - Utilise par défaut les clés API live/env avant les profils d’authentification stockés, afin que d’anciennes clés de test dans `auth-profiles.json` ne masquent pas les vrais identifiants du shell
  - Ignore les fournisseurs sans authentification/profil/modèle exploitable
  - Exécute les variantes standard de génération d’image via la capacité runtime partagée :
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Fournisseurs intégrés actuellement couverts :
  - `openai`
  - `google`
- Restriction facultative :
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportement d’authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l’authentification via le magasin de profils et ignorer les remplacements provenant uniquement de l’environnement

## Génération de musique live

- Test : `extensions/music-generation-providers.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harnais : `pnpm test:live:media music`
- Portée :
  - Exerce le chemin partagé des fournisseurs intégrés de génération de musique
  - Couvre actuellement Google et MiniMax
  - Charge les variables d’environnement fournisseur depuis votre shell de connexion (`~/.profile`) avant les sondes
  - Utilise par défaut les clés API live/env avant les profils d’authentification stockés, afin que d’anciennes clés de test dans `auth-profiles.json` ne masquent pas les vrais identifiants du shell
  - Ignore les fournisseurs sans authentification/profil/modèle exploitable
  - Exécute les deux modes runtime déclarés lorsqu’ils sont disponibles :
    - `generate` avec entrée de type prompt uniquement
    - `edit` lorsque le fournisseur déclare `capabilities.edit.enabled`
  - Couverture actuelle de la voie partagée :
    - `google` : `generate`, `edit`
    - `minimax` : `generate`
    - `comfy` : fichier live Comfy séparé, pas ce balayage partagé
- Restriction facultative :
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportement d’authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l’authentification via le magasin de profils et ignorer les remplacements provenant uniquement de l’environnement

## Génération de vidéo live

- Test : `extensions/video-generation-providers.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harnais : `pnpm test:live:media video`
- Portée :
  - Exerce le chemin partagé des fournisseurs intégrés de génération de vidéo
  - Utilise par défaut le chemin de smoke sûr pour les versions : fournisseurs hors FAL, une requête texte-vers-vidéo par fournisseur, prompt lobster d’une seconde, et une limite d’opération par fournisseur depuis `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` par défaut)
  - Ignore FAL par défaut car la latence de file d’attente côté fournisseur peut dominer le temps de release ; passez `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` pour l’exécuter explicitement
  - Charge les variables d’environnement fournisseur depuis votre shell de connexion (`~/.profile`) avant les sondes
  - Utilise par défaut les clés API live/env avant les profils d’authentification stockés, afin que d’anciennes clés de test dans `auth-profiles.json` ne masquent pas les vrais identifiants du shell
  - Ignore les fournisseurs sans authentification/profil/modèle exploitable
  - Exécute uniquement `generate` par défaut
  - Définissez `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` pour exécuter aussi les modes de transformation déclarés quand ils sont disponibles :
    - `imageToVideo` lorsque le fournisseur déclare `capabilities.imageToVideo.enabled` et que le fournisseur/modèle sélectionné accepte une entrée image locale adossée à un tampon dans le balayage partagé
    - `videoToVideo` lorsque le fournisseur déclare `capabilities.videoToVideo.enabled` et que le fournisseur/modèle sélectionné accepte une entrée vidéo locale adossée à un tampon dans le balayage partagé
  - Fournisseurs `imageToVideo` actuellement déclarés mais ignorés dans le balayage partagé :
    - `vydra` car le `veo3` intégré est uniquement texte et le `kling` intégré exige une URL d’image distante
  - Couverture spécifique au fournisseur Vydra :
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ce fichier exécute `veo3` en texte-vers-vidéo ainsi qu’une voie `kling` qui utilise par défaut une fixture d’URL d’image distante
  - Couverture live `videoToVideo` actuelle :
    - `runway` uniquement lorsque le modèle sélectionné est `runway/gen4_aleph`
  - Fournisseurs `videoToVideo` actuellement déclarés mais ignorés dans le balayage partagé :
    - `alibaba`, `qwen`, `xai` car ces chemins nécessitent actuellement des URL de référence distantes `http(s)` / MP4
    - `google` car la voie partagée Gemini/Veo actuelle utilise une entrée locale adossée à un tampon, et ce chemin n’est pas accepté dans le balayage partagé
    - `openai` car la voie partagée actuelle ne garantit pas l’accès spécifique à l’organisation pour la retouche/remix vidéo
- Restriction facultative :
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` pour inclure chaque fournisseur dans le balayage par défaut, y compris FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` pour réduire la limite d’opération de chaque fournisseur lors d’un smoke agressif
- Comportement d’authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l’authentification via le magasin de profils et ignorer les remplacements provenant uniquement de l’environnement

## Harnais media live

- Commande : `pnpm test:live:media`
- But :
  - Exécute les suites live partagées d’image, de musique et de vidéo via un point d’entrée natif du dépôt
  - Charge automatiquement les variables d’environnement fournisseur manquantes depuis `~/.profile`
  - Restreint automatiquement chaque suite aux fournisseurs qui disposent actuellement d’une authentification exploitable par défaut
  - Réutilise `scripts/test-live.mjs`, afin que le comportement Heartbeat et le mode silencieux restent cohérents
- Exemples :
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Exécuteurs Docker (vérifications facultatives « ça fonctionne sous Linux »)

Ces exécuteurs Docker se divisent en deux catégories :

- Exécuteurs live de modèles : `test:docker:live-models` et `test:docker:live-gateway` n’exécutent que leur fichier live à clés de profil correspondant dans l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de configuration local et votre espace de travail (et en chargeant `~/.profile` s’il est monté). Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les exécuteurs live Docker utilisent par défaut une limite de smoke plus petite afin qu’un balayage Docker complet reste pratique :
  `test:docker:live-models` utilise par défaut `OPENCLAW_LIVE_MAX_MODELS=12`, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Remplacez ces variables d’environnement quand vous
  voulez explicitement un balayage exhaustif plus large.
- `test:docker:all` construit une fois l’image Docker live via `test:docker:live-build`, puis la réutilise pour les deux voies live Docker.
- Exécuteurs smoke de conteneur : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels`, et `test:docker:plugins` démarrent un ou plusieurs vrais conteneurs et vérifient des chemins d’intégration de plus haut niveau.

Les exécuteurs Docker live de modèles montent aussi uniquement les répertoires d’authentification CLI nécessaires (ou tous ceux pris en charge lorsque l’exécution n’est pas restreinte), puis les copient dans le home du conteneur avant l’exécution afin que l’OAuth des CLI externes puisse rafraîchir les jetons sans modifier le magasin d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Smoke de liaison ACP : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh`)
- Smoke du backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Smoke du harnais app-server Codex : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent de développement : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’onboarding (TTY, échafaudage complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Réseau Gateway (deux conteneurs, authentification WS + santé) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Pont de canal MCP (Gateway amorcé + pont stdio + smoke brut de trame de notification Claude) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke d’installation + alias `/plugin` + sémantique de redémarrage du bundle Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)

Les exécuteurs Docker live de modèles montent aussi l’extraction courante en lecture seule et
la préparent dans un répertoire de travail temporaire à l’intérieur du conteneur. Cela garde l’image d’exécution
légère tout en exécutant Vitest sur votre source/configuration locale exacte.
L’étape de préparation ignore les gros caches locaux et sorties de build d’application comme
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, et les répertoires locaux `.build` ou
de sortie Gradle afin que les exécutions live Docker ne passent pas des minutes à copier
des artefacts spécifiques à la machine.
Ils définissent aussi `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes live Gateway ne démarrent pas
de vrais workers de canal Telegram/Discord/etc. dans le conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, donc transmettez aussi
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez restreindre ou exclure la couverture
live Gateway de cette voie Docker.
`test:docker:openwebui` est un smoke de compatibilité de plus haut niveau : il démarre un
conteneur Gateway OpenClaw avec les points de terminaison HTTP compatibles OpenAI activés,
démarre un conteneur Open WebUI épinglé contre ce Gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
vraie requête de chat via le proxy `/api/chat/completions` d’Open WebUI.
La première exécution peut être sensiblement plus lente car Docker peut devoir extraire l’image
Open WebUI et Open WebUI peut devoir terminer sa propre initialisation à froid.
Cette voie attend une clé de modèle live exploitable, et `OPENCLAW_PROFILE_FILE`
(`~/.profile` par défaut) est le principal moyen de la fournir dans les exécutions Docker.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est volontairement déterministe et n’a pas besoin d’un
vrai compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway
amorcé, démarre un second conteneur qui lance `openclaw mcp serve`, puis
vérifie la découverte de conversation routée, la lecture des transcriptions, les métadonnées de pièce jointe,
le comportement de la file d’attente d’événements live, le routage d’envoi sortant, et les notifications de canal +
permissions de style Claude via le vrai pont MCP stdio. La vérification de notification
inspecte directement les trames MCP stdio brutes afin que le smoke valide ce que le
pont émet réellement, et pas seulement ce qu’un SDK client particulier choisit d’exposer.

Smoke manuel ACP de fil en langage naturel (hors CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression/débogage. Il pourrait être de nouveau nécessaire pour la validation du routage des fils ACP, donc ne le supprimez pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté sur `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté sur `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (par défaut : `~/.profile`) monté sur `/home/node/.profile` et chargé avant l’exécution des tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement chargées depuis `OPENCLAW_PROFILE_FILE`, en utilisant des répertoires config/workspace temporaires et sans montage d’authentification CLI externe
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté sur `/home/node/.npm-global` pour les installations CLI en cache dans Docker
- Les répertoires/fichiers d’authentification CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés vers `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions restreintes par fournisseur ne montent que les répertoires/fichiers nécessaires déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacement manuel avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par des virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour restreindre l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante lors de relances qui ne nécessitent pas de reconstruction
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour garantir que les identifiants proviennent du magasin de profils (et non de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par Gateway pour le smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer le prompt de vérification de nonce utilisé par le smoke Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer le tag d’image Open WebUI épinglé

## Vérification de la documentation

Exécutez les vérifications de documentation après des modifications de doc : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify quand vous avez aussi besoin de vérifier les titres dans la page : `pnpm docs:check-links:anchors`.

## Régression hors ligne (compatible CI)

Ce sont des régressions de « vrai pipeline » sans vrais fournisseurs :

- Appel d’outils Gateway (OpenAI simulé, vraie boucle Gateway + agent) : `src/gateway/gateway.test.ts` (cas : "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistant Gateway (WS `wizard.start`/`wizard.next`, écriture de config + authentification imposée) : `src/gateway/gateway.test.ts` (cas : "runs wizard over ws and writes auth token config")

## Évaluations de fiabilité d’agent (Skills)

Nous avons déjà quelques tests compatibles CI qui se comportent comme des « évaluations de fiabilité d’agent » :

- Appel d’outils simulé via la vraie boucle Gateway + agent (`src/gateway/gateway.test.ts`).
- Flux d’assistant end-to-end qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour les Skills (voir [Skills](/fr/tools/skills)) :

- **Prise de décision :** lorsque des Skills sont listées dans le prompt, l’agent choisit-il la bonne Skill (ou évite-t-il celles qui sont non pertinentes) ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/arguments requis ?
- **Contrats de workflow :** scénarios multi-tours qui vérifient l’ordre des outils, la conservation de l’historique de session, et les frontières du sandbox.

Les futures évaluations doivent d’abord rester déterministes :

- Un exécuteur de scénarios utilisant des fournisseurs simulés pour vérifier les appels d’outils + leur ordre, les lectures de fichiers de Skills, et le câblage de session.
- Une petite suite de scénarios ciblés sur les Skills (utiliser vs éviter, filtrage, injection de prompt).
- Des évaluations live facultatives (opt-in, filtrées par variables d’environnement) uniquement après la mise en place de la suite compatible CI.

## Tests de contrat (forme des plugins et des canaux)

Les tests de contrat vérifient que chaque plugin et canal enregistré respecte son
contrat d’interface. Ils parcourent tous les plugins découverts et exécutent une suite de
vérifications de forme et de comportement. La voie unitaire par défaut `pnpm test`
ignore volontairement ces fichiers partagés de seam et de smoke ; exécutez explicitement
les commandes de contrat quand vous touchez les surfaces partagées de canal ou de fournisseur.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canaux uniquement : `pnpm test:contracts:channels`
- Contrats de fournisseurs uniquement : `pnpm test:contracts:plugins`

### Contrats de canaux

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - Forme de base du plugin (id, nom, capacités)
- **setup** - Contrat de l’assistant de configuration
- **session-binding** - Comportement de liaison de session
- **outbound-payload** - Structure de la charge utile du message
- **inbound** - Gestion des messages entrants
- **actions** - Gestionnaires d’actions de canal
- **threading** - Gestion des identifiants de fil
- **directory** - API d’annuaire/de roster
- **group-policy** - Application de la politique de groupe

### Contrats d’état des fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondes d’état du canal
- **registry** - Forme du registre de plugins

### Contrats de fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts` :

- **auth** - Contrat du flux d’authentification
- **auth-choice** - Choix/sélection d’authentification
- **catalog** - API du catalogue de modèles
- **discovery** - Découverte de plugins
- **loader** - Chargement de plugin
- **runtime** - Runtime du fournisseur
- **shape** - Forme/interface du plugin
- **wizard** - Assistant de configuration

### Quand les exécuter

- Après une modification des exports ou sous-chemins de `plugin-sdk`
- Après l’ajout ou la modification d’un plugin de canal ou de fournisseur
- Après un refactoring de l’enregistrement ou de la découverte de plugins

Les tests de contrat s’exécutent dans CI et ne nécessitent pas de vraies clés API.

## Ajouter des régressions (guide)

Quand vous corrigez un problème de fournisseur/modèle découvert en live :

- Ajoutez si possible une régression compatible CI (fournisseur simulé/mocké, ou capture exacte de la transformation de forme de requête)
- Si c’est intrinsèquement live-only (limitations de débit, politiques d’authentification), gardez le test live restreint et opt-in via des variables d’environnement
- Préférez cibler la plus petite couche qui détecte le bug :
  - bug de conversion/rejeu de requête fournisseur → test de modèles directs
  - bug de pipeline Gateway session/historique/outils → smoke live Gateway ou test mock Gateway compatible CI
- Garde-fou de traversée SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillonnée par classe SecretRef à partir des métadonnées de registre (`listSecretTargetRegistryEntries()`), puis vérifie que les identifiants exec de segment de traversée sont rejetés.
  - Si vous ajoutez une nouvelle famille cible SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue volontairement sur les identifiants de cible non classés afin qu’aucune nouvelle classe ne puisse être ignorée silencieusement.
