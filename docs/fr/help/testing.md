---
read_when:
    - Exécuter les tests en local ou dans la CI
    - Ajout de régressions pour les bugs de modèle/fournisseur
    - Débogage du comportement du Gateway et de l’agent
summary: 'Kit de test : suites unitaires/e2e/actives, exécuteurs Docker et couverture de chaque test'
title: Testing
x-i18n:
    generated_at: "2026-04-23T14:00:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0e9bdea78cba7e512358d2e4d428da04a2071188e74af2d5419d2c85eafe15
    source_path: help/testing.md
    workflow: 15
---

# Testing

OpenClaw dispose de trois suites Vitest (unitaire/intégration, e2e, active) et d’un petit ensemble d’exécuteurs Docker.

Cette documentation est un guide « comment nous testons » :

- Ce que couvre chaque suite (et ce qu’elle ne couvre délibérément _pas_)
- Quelles commandes exécuter pour les flux de travail courants (local, avant push, débogage)
- Comment les tests actifs découvrent les identifiants et sélectionnent les modèles/fournisseurs
- Comment ajouter des régressions pour des problèmes réels de modèle/fournisseur

## Démarrage rapide

La plupart des jours :

- Barrière complète (attendue avant push) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution locale plus rapide de la suite complète sur une machine confortable : `pnpm test:max`
- Boucle directe de surveillance Vitest : `pnpm test:watch`
- Le ciblage direct de fichier route désormais aussi les chemins d’extension/canal : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Préférez d’abord les exécutions ciblées lorsque vous itérez sur un seul échec.
- Site QA adossé à Docker : `pnpm qa:lab:up`
- Voie QA adossée à une VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Lorsque vous modifiez des tests ou voulez davantage de confiance :

- Barrière de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

Lors du débogage de fournisseurs/modèles réels (nécessite de vrais identifiants) :

- Suite active (modèles + sondes d’outil/image du gateway) : `pnpm test:live`
- Cibler silencieusement un fichier actif : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Balayage Docker des modèles actifs : `pnpm test:docker:live-models`
  - Couverture CI : la tâche quotidienne `OpenClaw Scheduled Live And E2E Checks` et la tâche manuelle
    `OpenClaw Release Checks` appellent toutes deux le flux de travail réutilisable actif/E2E avec
    `include_live_suites: true`, qui inclut des tâches de matrice Docker séparées pour les modèles actifs,
    fragmentées par fournisseur.
  - Pour des relances CI ciblées, déclenchez `OpenClaw Live And E2E Checks (Reusable)`
    avec `include_live_suites: true` et `live_models_only: true`.
  - Ajoutez les nouveaux secrets fournisseur à fort signal à `scripts/ci-hydrate-live-auth.sh`
    ainsi qu’à `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` et à ses
    appelants planifiés/de release.
- Smoke de coût Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis exécutez un agent isolé
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  sur `moonshot/kimi-k2.6`. Vérifiez que le JSON signale Moonshot/K2.6 et que la
  transcription de l’assistant stocke `usage.cost` normalisé.

Conseil : lorsque vous n’avez besoin que d’un seul cas en échec, préférez restreindre les tests actifs via les variables d’environnement de liste d’autorisation décrites ci-dessous.

## Exécuteurs spécifiques à la QA

Ces commandes se trouvent à côté des suites de test principales lorsque vous avez besoin du réalisme de qa-lab :

La CI exécute QA Lab dans des flux de travail dédiés. `Parity gate` s’exécute sur les PR correspondantes et
à partir d’un déclenchement manuel avec des fournisseurs mock. `QA-Lab - All Lanes` s’exécute chaque nuit sur
`main` et depuis un déclenchement manuel avec la barrière de parité mock, la voie active Matrix et la voie active Telegram gérée par Convex comme tâches parallèles. `OpenClaw Release Checks`
exécute les mêmes voies avant l’approbation de la release.

- `pnpm openclaw qa suite`
  - Exécute directement sur l’hôte les scénarios QA adossés au dépôt.
  - Exécute par défaut plusieurs scénarios sélectionnés en parallèle avec des
    workers gateway isolés. `qa-channel` utilise par défaut une simultanéité de 4 (bornée par le
    nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le
    nombre de workers, ou `--concurrency 1` pour l’ancienne voie série.
  - Se termine avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie en échec.
  - Prend en charge les modes fournisseur `live-frontier`, `mock-openai` et `aimock`.
    `aimock` démarre un serveur fournisseur local adossé à AIMock pour une couverture expérimentale
    des fixtures et des mocks de protocole sans remplacer la
    voie `mock-openai` sensible aux scénarios.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite QA dans une VM Linux Multipass jetable.
  - Conserve le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
  - Réutilise les mêmes options de sélection fournisseur/modèle que `qa suite`.
  - Les exécutions actives transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour l’invité :
    clés de fournisseur basées sur l’environnement, chemin de configuration du fournisseur actif QA, et `CODEX_HOME`
    lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt afin que l’invité puisse écrire en retour via
    l’espace de travail monté.
  - Écrit le rapport QA normal + le résumé ainsi que les journaux Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA adossé à Docker pour le travail QA de type opérateur.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construit une archive npm depuis l’extraction actuelle, l’installe globalement dans
    Docker, exécute un onboarding non interactif avec clé API OpenAI, configure Telegram
    par défaut, vérifie que l’activation du Plugin installe les dépendances runtime à la demande,
    exécute doctor, puis exécute un tour d’agent local sur un point de terminaison OpenAI mocké.
  - Utilisez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` pour exécuter la même
    voie d’installation packagée avec Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Empaquette et installe la build OpenClaw actuelle dans Docker, démarre le Gateway
    avec OpenAI configuré, puis active les canaux/Plugins intégrés via des modifications de configuration.
  - Vérifie que la découverte de configuration laisse absentes les dépendances runtime des Plugins non configurés,
    que la première exécution configurée du Gateway ou de doctor installe à la demande les dépendances runtime de chaque Plugin intégré, et qu’un second redémarrage ne réinstalle pas les dépendances
    déjà activées.
  - Installe aussi une base npm plus ancienne connue, active Telegram avant d’exécuter
    `openclaw update --tag <candidate>`, et vérifie que le doctor post-mise à jour
    du candidat répare les dépendances runtime des canaux intégrés sans
    réparation postinstall côté harnais.
- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur fournisseur local AIMock pour des tests smoke de protocole directs.
- `pnpm openclaw qa matrix`
  - Exécute la voie QA active Matrix sur un homeserver Tuwunel jetable adossé à Docker.
  - Cet hôte QA est aujourd’hui réservé au dépôt/dev. Les installations packagées d’OpenClaw n’embarquent pas
    `qa-lab`, donc elles n’exposent pas `openclaw qa`.
  - Les extractions du dépôt chargent directement l’exécuteur intégré ; aucune étape distincte d’installation de Plugin n’est nécessaire.
  - Provisionne trois utilisateurs Matrix temporaires (`driver`, `sut`, `observer`) plus un salon privé, puis démarre un enfant gateway QA avec le vrai Plugin Matrix comme transport SUT.
  - Utilise par défaut l’image Tuwunel stable épinglée `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Remplacez-la avec `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` lorsque vous devez tester une autre image.
  - Matrix n’expose pas d’options partagées de source d’identifiants, car la voie provisionne localement des utilisateurs jetables.
  - Écrit un rapport QA Matrix, un résumé, un artefact d’événements observés et un journal de sortie combiné stdout/stderr sous `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Exécute la voie QA active Telegram sur un vrai groupe privé à l’aide des jetons de bot driver et SUT fournis par l’environnement.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’identifiant du groupe doit être l’identifiant numérique du chat Telegram.
  - Prend en charge `--credential-source convex` pour des identifiants partagés mutualisés. Utilisez le mode environnement par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour utiliser des baux mutualisés.
  - Se termine avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie en échec.
  - Nécessite deux bots distincts dans le même groupe privé, le bot SUT exposant un nom d’utilisateur Telegram.
  - Pour une observation bot à bot stable, activez le mode de communication bot à bot dans `@BotFather` pour les deux bots et assurez-vous que le bot driver peut observer le trafic des bots du groupe.
  - Écrit un rapport QA Telegram, un résumé et un artefact de messages observés sous `.artifacts/qa-e2e/...`. Les scénarios avec réponse incluent le RTT entre la requête d’envoi du driver et la réponse SUT observée.

Les voies de transport actives partagent un contrat standard afin que les nouveaux transports ne divergent pas :

`qa-channel` reste la suite QA synthétique large et ne fait pas partie de la matrice de couverture des transports actifs.

| Voie     | Canari | Filtrage des mentions | Blocage par liste d’autorisation | Réponse de premier niveau | Reprise après redémarrage | Suivi de fil | Isolation du fil | Observation des réactions | Commande d’aide |
| -------- | ------ | --------------------- | -------------------------------- | ------------------------- | ------------------------- | ------------ | ---------------- | ------------------------- | --------------- |
| Matrix   | x      | x                     | x                                | x                         | x                         | x            | x                | x                         |                 |
| Telegram | x      |                       |                                  |                           |                           |              |                  |                           | x               |

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour
`openclaw qa telegram`, QA Lab acquiert un bail exclusif à partir d’un pool adossé à Convex, envoie des Heartbeat
pour ce bail pendant l’exécution de la voie et libère le bail à l’arrêt.

Structure de projet Convex de référence :

- `qa/convex-credential-broker/`

Variables d’environnement requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle d’identifiant :
  - CLI : `--credential-role maintainer|ci`
  - Valeur par défaut via l’environnement : `OPENCLAW_QA_CREDENTIAL_ROLE` (vaut par défaut `ci` en CI, `maintainer` sinon)

Variables d’environnement facultatives :

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (par défaut `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (par défaut `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (par défaut `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (par défaut `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (par défaut `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (identifiant de traçage facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex `http://` en loopback uniquement pour le développement local.

`OPENCLAW_QA_CONVEX_SITE_URL` doit utiliser `https://` en fonctionnement normal.

Les commandes d’administration mainteneur (ajout/suppression/liste du pool) nécessitent
spécifiquement `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Assistants CLI pour les mainteneurs :

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Utilisez `--json` pour une sortie lisible par machine dans les scripts et utilitaires CI.

Contrat de point de terminaison par défaut (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`) :

- `POST /acquire`
  - Requête : `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Succès : `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Pool épuisé/réessayable : `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Succès : `{ status: "ok" }` (ou `2xx` vide)
- `POST /release`
  - Requête : `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Succès : `{ status: "ok" }` (ou `2xx` vide)
- `POST /admin/add` (secret mainteneur uniquement)
  - Requête : `{ kind, actorId, payload, note?, status? }`
  - Succès : `{ status: "ok", credential }`
- `POST /admin/remove` (secret mainteneur uniquement)
  - Requête : `{ credentialId, actorId }`
  - Succès : `{ status: "ok", changed, credential }`
  - Garde de bail actif : `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret mainteneur uniquement)
  - Requête : `{ kind?, status?, includePayload?, limit? }`
  - Succès : `{ status: "ok", credentials, count }`

Forme de charge utile pour le type Telegram :

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` doit être une chaîne d’identifiant numérique de chat Telegram.
- `admin/add` valide cette forme pour `kind: "telegram"` et rejette les charges utiles mal formées.

### Ajouter un canal à la QA

Ajouter un canal au système QA Markdown nécessite exactement deux choses :

1. Un adaptateur de transport pour le canal.
2. Un pack de scénarios qui exerce le contrat du canal.

N’ajoutez pas une nouvelle racine de commande QA de niveau supérieur lorsque l’hôte partagé `qa-lab` peut gérer le flux.

`qa-lab` gère les mécanismes partagés de l’hôte :

- la racine de commande `openclaw qa`
- le démarrage et l’arrêt de la suite
- la simultanéité des workers
- l’écriture des artefacts
- la génération des rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les Plugins d’exécution gèrent le contrat de transport :

- la manière dont `openclaw qa <runner>` est monté sous la racine partagée `qa`
- la manière dont le gateway est configuré pour ce transport
- la manière dont l’état de préparation est vérifié
- la manière dont les événements entrants sont injectés
- la manière dont les messages sortants sont observés
- la manière dont les transcriptions et l’état de transport normalisé sont exposés
- la manière dont les actions adossées au transport sont exécutées
- la manière dont la réinitialisation ou le nettoyage spécifiques au transport sont gérés

Le niveau d’adoption minimal pour un nouveau canal est :

1. Garder `qa-lab` comme propriétaire de la racine partagée `qa`.
2. Implémenter l’exécuteur de transport sur la jointure d’hôte partagée `qa-lab`.
3. Garder les mécanismes spécifiques au transport à l’intérieur du Plugin d’exécution ou du harnais de canal.
4. Monter l’exécuteur comme `openclaw qa <runner>` au lieu d’enregistrer une racine de commande concurrente.
   Les Plugins d’exécution doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`.
   Gardez `runtime-api.ts` léger ; la CLI paresseuse et l’exécution du runner doivent rester derrière des points d’entrée séparés.
5. Rédiger ou adapter des scénarios Markdown sous les répertoires thématiques `qa/scenarios/`.
6. Utiliser les assistants de scénario génériques pour les nouveaux scénarios.
7. Garder les alias de compatibilité existants fonctionnels sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si un comportement peut être exprimé une seule fois dans `qa-lab`, placez-le dans `qa-lab`.
- Si un comportement dépend d’un transport de canal, gardez-le dans ce Plugin d’exécution ou harnais de Plugin.
- Si un scénario a besoin d’une nouvelle capacité que plus d’un canal peut utiliser, ajoutez un assistant générique au lieu d’une branche spécifique à un canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un seul transport, gardez le scénario spécifique à ce transport et rendez cela explicite dans le contrat du scénario.

Les noms d’assistants génériques préférés pour les nouveaux scénarios sont :

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

Les alias de compatibilité restent disponibles pour les scénarios existants, notamment :

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Le nouveau travail sur les canaux doit utiliser les noms d’assistants génériques.
Les alias de compatibilité existent pour éviter une migration brutale, pas comme modèle pour
la rédaction de nouveaux scénarios.

## Suites de tests (ce qui s’exécute où)

Considérez les suites comme ayant un « réalisme croissant » (et une fragilité/un coût croissants) :

### Unitaire / intégration (par défaut)

- Commande : `pnpm test`
- Configuration : les exécutions non ciblées utilisent l’ensemble de fragments `vitest.full-*.config.ts` et peuvent étendre les fragments multi-projets en configurations par projet pour une planification parallèle
- Fichiers : inventaires cœur/unitaire sous `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts`, et les tests node `ui` placés sur liste d’autorisation couverts par `vitest.unit.config.ts`
- Portée :
  - Tests unitaires purs
  - Tests d’intégration en processus (authentification gateway, routage, outillage, analyse, configuration)
  - Régressions déterministes pour les bugs connus
- Attentes :
  - S’exécute en CI
  - Aucune vraie clé requise
  - Doit être rapide et stable
- Note sur les projets :
  - `pnpm test` non ciblé exécute désormais douze configurations de fragments plus petites (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un unique processus racine natif géant. Cela réduit le RSS maximal sur les machines chargées et évite que le travail auto-reply/extension affame les suites non liées.
  - `pnpm test --watch` utilise toujours le graphe de projets racine natif `vitest.config.ts`, car une boucle watch multi-fragments n’est pas pratique.
  - `pnpm test`, `pnpm test:watch` et `pnpm test:perf:imports` font d’abord passer les cibles explicites fichier/répertoire par des voies limitées, de sorte que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite le coût de démarrage complet du projet racine.
  - `pnpm test:changed` étend les chemins git modifiés vers les mêmes voies limitées lorsque le diff ne touche que des fichiers source/test routables ; les modifications de configuration/setup reviennent toujours à la réexécution large du projet racine.
  - `pnpm check:changed` est la barrière locale intelligente normale pour un travail ciblé. Il classe le diff en cœur, tests cœur, extensions, tests d’extension, apps, docs, métadonnées de release et outillage, puis exécute les voies de typecheck/lint/test correspondantes. Les modifications du SDK Plugin public et du contrat de Plugin incluent la validation des extensions, car les extensions dépendent de ces contrats cœur. Les seules augmentations de version dans les métadonnées de release exécutent des vérifications ciblées de version/configuration/dépendances racine au lieu de la suite complète, avec une protection qui rejette les modifications de package en dehors du champ de version de niveau supérieur.
  - Les tests unitaires à import léger issus des agents, commandes, Plugins, assistants auto-reply, `plugin-sdk` et zones utilitaires pures similaires passent par la voie `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers à état/runtime lourds restent sur les voies existantes.
  - Certains fichiers source d’assistants `plugin-sdk` et `commands` mappent aussi les exécutions en mode changed vers des tests frères explicites dans ces voies légères, afin que les modifications d’assistants évitent de relancer toute la suite lourde pour ce répertoire.
  - `auto-reply` a désormais trois catégories dédiées : assistants cœur de niveau supérieur, tests d’intégration `reply.*` de niveau supérieur, et le sous-arbre `src/auto-reply/reply/**`. Cela garde le travail de harnais reply le plus lourd à l’écart des tests peu coûteux sur le statut/chunk/token.
- Note sur l’exécuteur intégré :
  - Lorsque vous modifiez les entrées de découverte de l’outil de message ou le contexte runtime de Compaction,
    gardez les deux niveaux de couverture.
  - Ajoutez des régressions d’assistants ciblées pour les frontières pures de routage/normalisation.
  - Gardez aussi saines les suites d’intégration de l’exécuteur intégré :
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, et
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ces suites vérifient que les identifiants à portée et le comportement de Compaction continuent de circuler
    à travers les vrais chemins `run.ts` / `compact.ts` ; des tests d’assistants seuls ne
    remplacent pas suffisamment ces chemins d’intégration.
- Note sur le pool :
  - La configuration Vitest de base utilise désormais `threads` par défaut.
  - La configuration Vitest partagée fixe aussi `isolate: false` et utilise l’exécuteur non isolé sur les projets racine, e2e et actifs.
  - La voie UI racine conserve sa configuration et son optimiseur `jsdom`, mais s’exécute désormais aussi sur l’exécuteur partagé non isolé.
  - Chaque fragment `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false` à partir de la configuration Vitest partagée.
  - Le lanceur partagé `scripts/run-vitest.mjs` ajoute désormais aussi `--no-maglev` par défaut pour les processus Node enfants de Vitest afin de réduire l’activité de compilation V8 pendant les grandes exécutions locales. Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` si vous devez comparer avec le comportement V8 standard.
- Note sur l’itération locale rapide :
  - `pnpm changed:lanes` montre quelles voies architecturales un diff déclenche.
  - Le hook pre-commit exécute `pnpm check:changed --staged` après le formatage/lint des fichiers indexés, afin que les commits cœur seuls ne paient pas le coût des tests d’extension à moins de toucher des contrats publics orientés extension. Les commits ne touchant que les métadonnées de release restent sur la voie ciblée version/configuration/dépendances racine.
  - Si l’ensemble exact de modifications indexées a déjà été validé avec des barrières équivalentes ou plus fortes, utilisez `scripts/committer --fast "<message>" <files...>` pour ignorer uniquement la relance du hook à portée changed. Le format/lint des fichiers indexés s’exécute toujours. Mentionnez les barrières déjà effectuées dans votre transmission. Cela est aussi acceptable après la relance d’un échec de hook isolé et instable qui passe avec une preuve ciblée.
  - `pnpm test:changed` passe par des voies limitées lorsque les chemins modifiés se mappent proprement à une suite plus petite.
  - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage, simplement avec un plafond de workers plus élevé.
  - L’auto-dimensionnement local des workers est désormais volontairement prudent et réduit aussi l’allure lorsque la charge moyenne de l’hôte est déjà élevée, de sorte que plusieurs exécutions Vitest simultanées font moins de dégâts par défaut.
  - La configuration Vitest de base marque les projets/fichiers de configuration comme `forceRerunTriggers` afin que les relances en mode changed restent correctes lorsque le câblage des tests change.
  - La configuration garde `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes pris en charge ; définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez un emplacement de cache explicite pour le profilage direct.
- Note sur le débogage des performances :
  - `pnpm test:perf:imports` active les rapports de durée d’import Vitest ainsi que la sortie de répartition des imports.
  - `pnpm test:perf:imports:changed` limite la même vue de profilage aux fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compare `test:changed` routé au chemin natif du projet racine pour ce diff validé et affiche le temps mur plus le RSS maximal macOS.
- `pnpm test:perf:changed:bench -- --worktree` mesure l’arbre de travail courant non validé en faisant passer la liste des fichiers modifiés par `scripts/test-projects.mjs` et la configuration Vitest racine.
  - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour les surcoûts de démarrage et de transformation Vitest/Vite.
  - `pnpm test:perf:profile:runner` écrit des profils CPU+heap de l’exécuteur pour la suite unitaire avec le parallélisme fichier désactivé.

### Stabilité (gateway)

- Commande : `pnpm test:stability:gateway`
- Configuration : `vitest.gateway.config.ts`, forcée à un worker
- Portée :
  - Démarre un vrai Gateway loopback avec diagnostics activés par défaut
  - Fait circuler des charges synthétiques de messages gateway, de mémoire et de gros volumes via le chemin d’événements de diagnostic
  - Interroge `diagnostics.stability` via le RPC WS du Gateway
  - Couvre les assistants de persistance du bundle de stabilité de diagnostic
  - Vérifie que l’enregistreur reste borné, que les échantillons RSS synthétiques restent sous le budget de pression, et que les profondeurs de file par session reviennent à zéro
- Attentes :
  - Compatible CI et sans clés
  - Voie étroite pour le suivi des régressions de stabilité, pas un substitut à la suite Gateway complète

### E2E (smoke gateway)

- Commande : `pnpm test:e2e`
- Configuration : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, et les tests E2E de Plugins intégrés sous `extensions/`
- Valeurs par défaut du runtime :
  - Utilise Vitest `threads` avec `isolate: false`, en cohérence avec le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute en mode silencieux par défaut pour réduire le coût d’E/S console.
- Remplacements utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console détaillée.
- Portée :
  - Comportement bout en bout du gateway multi-instance
  - Surfaces WebSocket/HTTP, appairage de nœuds et réseau plus lourd
- Attentes :
  - S’exécute en CI (lorsqu’activé dans le pipeline)
  - Aucune vraie clé requise
  - Plus de composants mobiles que les tests unitaires (peut être plus lent)

### E2E : smoke du backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `extensions/openshell/src/backend.e2e.test.ts`
- Portée :
  - Démarre sur l’hôte un gateway OpenShell isolé via Docker
  - Crée un bac à sable à partir d’un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via de vrais `sandbox ssh-config` + exécutions SSH
  - Vérifie le comportement du système de fichiers canonique à distance via le pont fs du bac à sable
- Attentes :
  - Sur activation uniquement ; ne fait pas partie de l’exécution par défaut de `pnpm test:e2e`
  - Nécessite une CLI `openshell` locale ainsi qu’un démon Docker fonctionnel
  - Utilise `HOME` / `XDG_CONFIG_HOME` isolés, puis détruit le gateway de test et le bac à sable
- Remplacements utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI non par défaut ou un script d’encapsulation

### Actif (vrais fournisseurs + vrais modèles)

- Commande : `pnpm test:live`
- Configuration : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, et les tests actifs de Plugins intégrés sous `extensions/`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Ce fournisseur/modèle fonctionne-t-il réellement _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format des fournisseurs, les particularités d’appel d’outils, les problèmes d’authentification et le comportement face aux limites de débit
- Attentes :
  - Pas stable en CI par conception (réseaux réels, politiques réelles des fournisseurs, quotas, pannes)
  - Coûte de l’argent / consomme des limites de débit
  - Préférez l’exécution de sous-ensembles limités plutôt que de « tout »
- Les exécutions actives chargent `~/.profile` pour récupérer les clés API manquantes.
- Par défaut, les exécutions actives isolent quand même `HOME` et copient les éléments config/auth dans un répertoire home de test temporaire afin que les fixtures unitaires ne puissent pas modifier votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous avez intentionnellement besoin que les tests actifs utilisent votre vrai répertoire home.
- `pnpm test:live` utilise désormais par défaut un mode plus discret : il conserve la sortie de progression `[live] ...`, mais masque l’avis supplémentaire sur `~/.profile` et coupe les journaux de bootstrap du gateway / le bruit Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous voulez récupérer tous les journaux de démarrage.
- Rotation des clés API (spécifique au fournisseur) : définissez `*_API_KEYS` au format virgule/point-virgule ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou un remplacement spécifique à l’actif via `OPENCLAW_LIVE_*_KEY` ; les tests réessaient lors des réponses de limite de débit.
- Sortie de progression/Heartbeat :
  - Les suites actives émettent désormais les lignes de progression vers stderr afin que les longs appels fournisseur restent visiblement actifs même lorsque la capture console de Vitest est discrète.
  - `vitest.live.config.ts` désactive l’interception console de Vitest afin que les lignes de progression du fournisseur/gateway soient diffusées immédiatement pendant les exécutions actives.
  - Ajustez les Heartbeat des modèles directs avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajustez les Heartbeat gateway/sonde avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modification de logique/tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup modifié)
- Modification du réseau gateway / protocole WS / appairage : ajoutez `pnpm test:e2e`
- Débogage de « mon bot est hors service » / échecs spécifiques au fournisseur / appel d’outils : exécutez un `pnpm test:live` limité

## Actif : balayage de capacité de nœud Android

- Test : `src/gateway/android-node.capabilities.live.test.ts`
- Script : `pnpm android:test:integration`
- Objectif : invoquer **chaque commande actuellement annoncée** par un nœud Android connecté et vérifier le comportement contractuel de la commande.
- Portée :
  - Configuration préalable/manuelle (la suite n’installe pas, ne lance pas et n’appaire pas l’application).
  - Validation `node.invoke` du gateway commande par commande pour le nœud Android sélectionné.
- Préconfiguration requise :
  - Application Android déjà connectée et appairée au gateway.
  - Application maintenue au premier plan.
  - Autorisations/consentement de capture accordés pour les capacités que vous attendez comme valides.
- Remplacements de cible facultatifs :
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Détails complets de configuration Android : [Android App](/fr/platforms/android)

## Actif : smoke de modèle (clés de profil)

Les tests actifs sont divisés en deux couches afin de pouvoir isoler les échecs :

- « Modèle direct » nous indique si le fournisseur/modèle peut répondre tout court avec la clé donnée.
- « Smoke gateway » nous indique si tout le pipeline gateway+agent fonctionne pour ce modèle (sessions, historique, outils, politique de bac à sable, etc.).

### Couche 1 : complétion de modèle direct (sans gateway)

- Test : `src/agents/models.profiles.live.test.ts`
- Objectif :
  - Énumérer les modèles découverts
  - Utiliser `getApiKeyForModel` pour sélectionner les modèles pour lesquels vous avez des identifiants
  - Exécuter une petite complétion par modèle (et des régressions ciblées si nécessaire)
- Comment l’activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Définissez `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias de modern) pour réellement exécuter cette suite ; sinon elle est ignorée afin que `pnpm test:live` reste centré sur le smoke gateway
- Comment sélectionner les modèles :
  - `OPENCLAW_LIVE_MODELS=modern` pour exécuter la liste d’autorisation moderne (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` est un alias pour la liste d’autorisation moderne
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (liste d’autorisation séparée par des virgules)
  - Les balayages modern/all utilisent par défaut un plafond organisé à fort signal ; définissez `OPENCLAW_LIVE_MAX_MODELS=0` pour un balayage moderne exhaustif ou un nombre positif pour un plafond plus petit.
- Comment sélectionner les fournisseurs :
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (liste d’autorisation séparée par des virgules)
- D’où viennent les clés :
  - Par défaut : dépôt de profils et solutions de repli environnement
  - Définissez `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour imposer le **dépôt de profils** uniquement
- Pourquoi cela existe :
  - Sépare « l’API du fournisseur est cassée / la clé est invalide » de « le pipeline agent gateway est cassé »
  - Contient de petites régressions isolées (exemple : rejeu de raisonnement OpenAI Responses/Codex Responses + flux d’appel d’outils)

### Couche 2 : smoke gateway + agent dev (ce que fait réellement "@openclaw")

- Test : `src/gateway/gateway-models.profiles.live.test.ts`
- Objectif :
  - Démarrer un gateway en processus
  - Créer/modifier une session `agent:dev:*` (remplacement de modèle à chaque exécution)
  - Itérer sur les modèles avec clés et vérifier :
    - une réponse « significative » (sans outils)
    - qu’une invocation d’outil réelle fonctionne (sonde read)
    - des sondes d’outil supplémentaires facultatives (sonde exec+read)
    - que les chemins de régression OpenAI (appel d’outil seul → suivi) continuent de fonctionner
- Détails des sondes (pour que vous puissiez expliquer rapidement les échecs) :
  - Sonde `read` : le test écrit un fichier nonce dans l’espace de travail et demande à l’agent de le `read` et de renvoyer le nonce.
  - Sonde `exec+read` : le test demande à l’agent d’écrire via `exec` un nonce dans un fichier temporaire, puis de le `read`.
  - Sonde d’image : le test joint un PNG généré (chat + code aléatoire) et attend du modèle qu’il renvoie `cat <CODE>`.
  - Référence d’implémentation : `src/gateway/gateway-models.profiles.live.test.ts` et `src/gateway/live-image-probe.ts`.
- Comment l’activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Comment sélectionner les modèles :
  - Par défaut : liste d’autorisation moderne (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` est un alias pour la liste d’autorisation moderne
  - Ou définissez `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou liste séparée par des virgules) pour limiter
  - Les balayages gateway modern/all utilisent par défaut un plafond organisé à fort signal ; définissez `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` pour un balayage moderne exhaustif ou un nombre positif pour un plafond plus petit.
- Comment sélectionner les fournisseurs (éviter « OpenRouter tout ») :
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (liste d’autorisation séparée par des virgules)
- Les sondes d’outil + image sont toujours actives dans ce test actif :
  - sonde `read` + sonde `exec+read` (stress d’outil)
  - la sonde d’image s’exécute lorsque le modèle annonce la prise en charge des entrées image
  - Flux (haut niveau) :
    - Le test génère un petit PNG avec « CAT » + code aléatoire (`src/gateway/live-image-probe.ts`)
    - L’envoie via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Le Gateway analyse les pièces jointes dans `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L’agent intégré transmet au modèle un message utilisateur multimodal
    - Vérification : la réponse contient `cat` + le code (tolérance OCR : de petites erreurs sont autorisées)

Conseil : pour voir ce que vous pouvez tester sur votre machine (et les identifiants exacts `provider/model`), exécutez :

```bash
openclaw models list
openclaw models list --json
```

## Actif : smoke du backend CLI (Claude, Codex, Gemini ou autres CLI locales)

- Test : `src/gateway/gateway-cli-backend.live.test.ts`
- Objectif : valider le pipeline Gateway + agent à l’aide d’un backend CLI local, sans toucher à votre configuration par défaut.
- Les valeurs par défaut smoke spécifiques au backend se trouvent avec la définition `cli-backend.ts` de l’extension propriétaire.
- Activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valeurs par défaut :
  - Fournisseur/modèle par défaut : `claude-cli/claude-sonnet-4-6`
  - Le comportement commande/arguments/image provient des métadonnées du Plugin backend CLI propriétaire.
- Remplacements facultatifs :
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` pour envoyer une vraie pièce jointe image (les chemins sont injectés dans le prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` pour passer les chemins de fichiers image comme arguments CLI au lieu de l’injection dans le prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) pour contrôler la manière dont les arguments image sont passés lorsque `IMAGE_ARG` est défini.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` pour envoyer un second tour et valider le flux de reprise.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` pour désactiver la sonde par défaut de continuité même session Claude Sonnet -> Opus (définissez `1` pour l’imposer lorsque le modèle sélectionné prend en charge une cible de changement).

Exemple :

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Recette Docker :

```bash
pnpm test:docker:live-cli-backend
```

Recettes Docker fournisseur unique :

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Remarques :

- L’exécuteur Docker se trouve dans `scripts/test-live-cli-backend-docker.sh`.
- Il exécute le smoke actif du backend CLI dans l’image Docker du dépôt en tant qu’utilisateur `node` non root.
- Il résout les métadonnées de smoke CLI à partir de l’extension propriétaire, puis installe le package CLI Linux correspondant (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) dans un préfixe inscriptible mis en cache à `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (par défaut : `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` nécessite une authentification OAuth d’abonnement Claude Code portable via soit `~/.claude/.credentials.json` avec `claudeAiOauth.subscriptionType`, soit `CLAUDE_CODE_OAUTH_TOKEN` depuis `claude setup-token`. Il prouve d’abord un `claude -p` direct dans Docker, puis exécute deux tours du backend CLI Gateway sans conserver les variables d’environnement de clé API Anthropic. Cette voie d’abonnement désactive par défaut les sondes Claude MCP/outil et image, car Claude route actuellement l’usage d’applications tierces via une facturation d’usage supplémentaire plutôt que via les limites normales du plan d’abonnement.
- Le smoke actif du backend CLI exerce désormais le même flux de bout en bout pour Claude, Codex et Gemini : tour texte, tour de classification d’image, puis appel d’outil MCP `cron` vérifié via la CLI gateway.
- Le smoke par défaut de Claude modifie aussi la session de Sonnet vers Opus et vérifie que la session reprise se souvient encore d’une note antérieure.

## Actif : smoke de liaison ACP (`/acp spawn ... --bind here`)

- Test : `src/gateway/gateway-acp-bind.live.test.ts`
- Objectif : valider le vrai flux de liaison de conversation ACP avec un agent ACP actif :
  - envoyer `/acp spawn <agent> --bind here`
  - lier sur place une conversation de canal de messages synthétique
  - envoyer un suivi normal sur cette même conversation
  - vérifier que le suivi arrive dans la transcription de la session ACP liée
- Activer :
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valeurs par défaut :
  - Agents ACP dans Docker : `claude,codex,gemini`
  - Agent ACP pour `pnpm test:live ...` direct : `claude`
  - Canal synthétique : contexte de conversation de type MP Slack
  - Backend ACP : `acpx`
- Remplacements :
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Remarques :
  - Cette voie utilise la surface gateway `chat.send` avec des champs de route d’origine synthétiques réservés à l’administration afin que les tests puissent attacher un contexte de canal de messages sans prétendre livrer à l’extérieur.
  - Lorsque `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` n’est pas défini, le test utilise le registre d’agents intégré du Plugin `acpx` embarqué pour l’agent de harnais ACP sélectionné.

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

Recettes Docker à agent unique :

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Remarques Docker :

- L’exécuteur Docker se trouve dans `scripts/test-live-acp-bind-docker.sh`.
- Par défaut, il exécute le smoke de liaison ACP sur tous les agents CLI actifs pris en charge en séquence : `claude`, `codex`, puis `gemini`.
- Utilisez `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` pour réduire la matrice.
- Il charge `~/.profile`, prépare le matériel d’authentification CLI correspondant dans le conteneur, installe `acpx` dans un préfixe npm inscriptible, puis installe la CLI active demandée (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) si elle est absente.
- Dans Docker, l’exécuteur définit `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` afin que acpx conserve les variables d’environnement fournisseur du profil chargé disponibles pour la CLI de harnais enfant.

## Actif : smoke du harnais app-server Codex

- Objectif : valider le harnais Codex géré par le Plugin via la méthode gateway
  `agent` normale :
  - charger le Plugin intégré `codex`
  - sélectionner `OPENCLAW_AGENT_RUNTIME=codex`
  - envoyer un premier tour d’agent gateway vers `codex/gpt-5.4`
  - envoyer un second tour à la même session OpenClaw et vérifier que le fil
    app-server peut reprendre
  - exécuter `/codex status` et `/codex models` via le même chemin de commande
    gateway
  - exécuter éventuellement deux sondes shell escaladées revues par Guardian : une commande
    bénigne qui devrait être approuvée et un faux téléversement de secret qui devrait être
    refusé afin que l’agent redemande
- Test : `src/gateway/gateway-codex-harness.live.test.ts`
- Activer : `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modèle par défaut : `codex/gpt-5.4`
- Sonde d’image facultative : `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonde MCP/outil facultative : `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sonde Guardian facultative : `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Le smoke définit `OPENCLAW_AGENT_HARNESS_FALLBACK=none` afin qu’un harnais Codex cassé
  ne puisse pas réussir en retombant silencieusement sur PI.
- Authentification : `OPENAI_API_KEY` depuis le shell/profil, plus éventuellement
  `~/.codex/auth.json` et `~/.codex/config.toml` copiés

Recette locale :

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Recette Docker :

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Remarques Docker :

- L’exécuteur Docker se trouve dans `scripts/test-live-codex-harness-docker.sh`.
- Il charge le `~/.profile` monté, transmet `OPENAI_API_KEY`, copie les fichiers d’authentification CLI Codex lorsqu’ils sont présents, installe `@openai/codex` dans un préfixe npm monté et inscriptible, prépare l’arborescence source, puis exécute uniquement le test actif du harnais Codex.
- Docker active par défaut les sondes image, MCP/outil et Guardian. Définissez
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` lorsque vous avez besoin d’une exécution de débogage plus limitée.
- Docker exporte aussi `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, en cohérence avec la configuration du test actif afin qu’un repli `openai-codex/*` ou PI ne puisse pas masquer une
  régression du harnais Codex.

### Recettes actives recommandées

Des listes d’autorisation étroites et explicites sont les plus rapides et les moins fragiles :

- Modèle unique, direct (sans gateway) :
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modèle unique, smoke gateway :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Appel d’outils sur plusieurs fournisseurs :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (clé API Gemini + Antigravity) :
  - Gemini (clé API) : `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth) : `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Remarques :

- `google/...` utilise l’API Gemini (clé API).
- `google-antigravity/...` utilise le pont OAuth Antigravity (point de terminaison d’agent de type Cloud Code Assist).
- `google-gemini-cli/...` utilise la CLI Gemini locale sur votre machine (authentification séparée + particularités de l’outillage).
- API Gemini vs CLI Gemini :
  - API : OpenClaw appelle l’API Gemini hébergée de Google via HTTP (authentification par clé API / profil) ; c’est ce que la plupart des utilisateurs entendent par « Gemini ».
  - CLI : OpenClaw exécute un binaire local `gemini` ; il a sa propre authentification et peut se comporter différemment (streaming/prise en charge des outils/décalage de version).

## Actif : matrice de modèles (ce que nous couvrons)

Il n’existe pas de « liste de modèles CI » fixe (l’actif est opt-in), mais voici les modèles **recommandés** à couvrir régulièrement sur une machine de développement disposant des clés.

### Ensemble smoke moderne (appel d’outils + image)

C’est l’exécution des « modèles courants » que nous nous attendons à voir fonctionner en continu :

- OpenAI (hors Codex) : `openai/gpt-5.4` (facultatif : `openai/gpt-5.4-mini`)
- OpenAI Codex : `openai-codex/gpt-5.4`
- Anthropic : `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini) : `google/gemini-3.1-pro-preview` et `google/gemini-3-flash-preview` (évitez les anciens modèles Gemini 2.x)
- Google (Antigravity) : `google-antigravity/claude-opus-4-6-thinking` et `google-antigravity/gemini-3-flash`
- Z.AI (GLM) : `zai/glm-4.7`
- MiniMax : `minimax/MiniMax-M2.7`

Exécuter le smoke gateway avec outils + image :
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Référence : appel d’outils (Read + Exec facultatif)

Choisissez au moins un modèle par famille de fournisseurs :

- OpenAI : `openai/gpt-5.4` (ou `openai/gpt-5.4-mini`)
- Anthropic : `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google : `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- Z.AI (GLM) : `zai/glm-4.7`
- MiniMax : `minimax/MiniMax-M2.7`

Couverture additionnelle facultative (souhaitable) :

- xAI : `xai/grok-4` (ou la dernière version disponible)
- Mistral : `mistral/`… (choisissez un modèle capable d’utiliser des outils que vous avez activé)
- Cerebras : `cerebras/`… (si vous y avez accès)
- LM Studio : `lmstudio/`… (local ; l’appel d’outils dépend du mode API)

### Vision : envoi d’image (pièce jointe → message multimodal)

Incluez au moins un modèle capable de traiter les images dans `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/variantes OpenAI capables de vision, etc.) afin d’exercer la sonde d’image.

### Agrégateurs / passerelles alternatives

Si vous avez activé les clés, nous prenons aussi en charge les tests via :

- OpenRouter : `openrouter/...` (des centaines de modèles ; utilisez `openclaw models scan` pour trouver des candidats capables d’utiliser des outils et des images)
- OpenCode : `opencode/...` pour Zen et `opencode-go/...` pour Go (authentification via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Autres fournisseurs que vous pouvez inclure dans la matrice active (si vous avez les identifiants/la configuration) :

- Intégrés : `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (points de terminaison personnalisés) : `minimax` (cloud/API), ainsi que tout proxy compatible OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

Conseil : n’essayez pas de coder en dur « tous les modèles » dans la documentation. La liste faisant autorité est celle que `discoverModels(...)` renvoie sur votre machine + les clés disponibles.

## Identifiants (ne jamais commiter)

Les tests actifs découvrent les identifiants de la même manière que la CLI. Implications pratiques :

- Si la CLI fonctionne, les tests actifs devraient trouver les mêmes clés.
- Si un test actif dit « no creds », déboguez-le de la même façon que vous débogueriez `openclaw models list` / la sélection de modèle.

- Profils d’authentification par agent : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (c’est ce que signifient les « profile keys » dans les tests actifs)
- Configuration : `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Répertoire d’état historique : `~/.openclaw/credentials/` (copié dans le home actif préparé lorsqu’il est présent, mais pas dans le dépôt principal de clés de profil)
- Les exécutions actives locales copient par défaut la configuration active, les fichiers `auth-profiles.json` par agent, le répertoire historique `credentials/` et les répertoires d’authentification CLI externes pris en charge dans un home de test temporaire ; les homes actifs préparés ignorent `workspace/` et `sandboxes/`, et les remplacements de chemin `agents.*.workspace` / `agentDir` sont supprimés afin que les sondes restent hors de votre véritable espace de travail hôte.

Si vous voulez vous appuyer sur des clés d’environnement (par exemple exportées dans votre `~/.profile`), exécutez les tests locaux après `source ~/.profile`, ou utilisez les exécuteurs Docker ci-dessous (ils peuvent monter `~/.profile` dans le conteneur).

## Actif Deepgram (transcription audio)

- Test : `extensions/deepgram/audio.live.test.ts`
- Activer : `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Actif plan de codage BytePlus

- Test : `extensions/byteplus/live.test.ts`
- Activer : `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Remplacement de modèle facultatif : `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Actif média de workflow ComfyUI

- Test : `extensions/comfy/comfy.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Portée :
  - Exerce les chemins image, vidéo et `music_generate` intégrés de comfy
  - Ignore chaque capacité sauf si `models.providers.comfy.<capability>` est configuré
  - Utile après modification de la soumission de workflow comfy, du polling, des téléchargements ou de l’enregistrement du Plugin

## Génération d’images active

- Test : `test/image-generation.runtime.live.test.ts`
- Commande : `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harnais : `pnpm test:live:media image`
- Portée :
  - Énumère chaque Plugin fournisseur de génération d’images enregistré
  - Charge les variables d’environnement fournisseur manquantes depuis votre shell de connexion (`~/.profile`) avant les sondes
  - Utilise par défaut les clés API actives/d’environnement avant les profils d’authentification stockés, afin que des clés de test obsolètes dans `auth-profiles.json` ne masquent pas les vrais identifiants du shell
  - Ignore les fournisseurs sans authentification/profil/modèle utilisable
  - Exécute les variantes standard de génération d’images via la capacité runtime partagée :
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Fournisseurs intégrés actuellement couverts :
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- Restriction facultative :
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- Comportement d’authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l’authentification par dépôt de profils et ignorer les remplacements environnement seuls

## Génération musicale active

- Test : `extensions/music-generation-providers.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harnais : `pnpm test:live:media music`
- Portée :
  - Exerce le chemin partagé des fournisseurs intégrés de génération musicale
  - Couvre actuellement Google et MiniMax
  - Charge les variables d’environnement fournisseur depuis votre shell de connexion (`~/.profile`) avant les sondes
  - Utilise par défaut les clés API actives/d’environnement avant les profils d’authentification stockés, afin que des clés de test obsolètes dans `auth-profiles.json` ne masquent pas les vrais identifiants du shell
  - Ignore les fournisseurs sans authentification/profil/modèle utilisable
  - Exécute les deux modes runtime déclarés lorsqu’ils sont disponibles :
    - `generate` avec entrée par prompt uniquement
    - `edit` lorsque le fournisseur déclare `capabilities.edit.enabled`
  - Couverture actuelle de la voie partagée :
    - `google` : `generate`, `edit`
    - `minimax` : `generate`
    - `comfy` : fichier actif Comfy séparé, pas ce balayage partagé
- Restriction facultative :
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportement d’authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l’authentification par dépôt de profils et ignorer les remplacements environnement seuls

## Génération vidéo active

- Test : `extensions/video-generation-providers.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harnais : `pnpm test:live:media video`
- Portée :
  - Exerce le chemin partagé des fournisseurs intégrés de génération vidéo
  - Utilise par défaut le chemin smoke sûr pour la release : fournisseurs hors FAL, une requête texte-vers-vidéo par fournisseur, prompt homard d’une seconde, et plafond d’opération par fournisseur issu de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` par défaut)
  - Ignore FAL par défaut parce que la latence de file côté fournisseur peut dominer le temps de release ; passez `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` pour l’exécuter explicitement
  - Charge les variables d’environnement fournisseur depuis votre shell de connexion (`~/.profile`) avant les sondes
  - Utilise par défaut les clés API actives/d’environnement avant les profils d’authentification stockés, afin que des clés de test obsolètes dans `auth-profiles.json` ne masquent pas les vrais identifiants du shell
  - Ignore les fournisseurs sans authentification/profil/modèle utilisable
  - Exécute uniquement `generate` par défaut
  - Définissez `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` pour exécuter aussi les modes de transformation déclarés lorsqu’ils sont disponibles :
    - `imageToVideo` lorsque le fournisseur déclare `capabilities.imageToVideo.enabled` et que le fournisseur/modèle sélectionné accepte une entrée image locale adossée à un buffer dans le balayage partagé
    - `videoToVideo` lorsque le fournisseur déclare `capabilities.videoToVideo.enabled` et que le fournisseur/modèle sélectionné accepte une entrée vidéo locale adossée à un buffer dans le balayage partagé
  - Fournisseurs `imageToVideo` actuellement déclarés mais ignorés dans le balayage partagé :
    - `vydra` parce que le `veo3` intégré est texte seul et que le `kling` intégré nécessite une URL d’image distante
  - Couverture spécifique au fournisseur Vydra :
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ce fichier exécute `veo3` texte-vers-vidéo plus une voie `kling` qui utilise par défaut une fixture d’URL d’image distante
  - Couverture active `videoToVideo` actuelle :
    - `runway` uniquement lorsque le modèle sélectionné est `runway/gen4_aleph`
  - Fournisseurs `videoToVideo` actuellement déclarés mais ignorés dans le balayage partagé :
    - `alibaba`, `qwen`, `xai` parce que ces chemins nécessitent actuellement des URL de référence distantes `http(s)` / MP4
    - `google` parce que la voie Gemini/Veo partagée actuelle utilise une entrée locale adossée à un buffer et que ce chemin n’est pas accepté dans le balayage partagé
    - `openai` parce que la voie partagée actuelle ne garantit pas l’accès spécifique à l’organisation pour l’inpainting/remix vidéo
- Restriction facultative :
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` pour inclure chaque fournisseur dans le balayage par défaut, y compris FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` pour réduire le plafond d’opération de chaque fournisseur lors d’une exécution smoke agressive
- Comportement d’authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l’authentification par dépôt de profils et ignorer les remplacements environnement seuls

## Harnais actif média

- Commande : `pnpm test:live:media`
- Objectif :
  - Exécute les suites actives partagées image, musique et vidéo via un point d’entrée natif du dépôt unique
  - Charge automatiquement les variables d’environnement fournisseur manquantes depuis `~/.profile`
  - Restreint automatiquement par défaut chaque suite aux fournisseurs disposant actuellement d’une authentification utilisable
  - Réutilise `scripts/test-live.mjs`, afin que le comportement Heartbeat et le mode discret restent cohérents
- Exemples :
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Exécuteurs Docker (vérifications facultatives « fonctionne sous Linux »)

Ces exécuteurs Docker sont répartis en deux catégories :

- Exécuteurs de modèles actifs : `test:docker:live-models` et `test:docker:live-gateway` n’exécutent que leur fichier actif à clés de profil correspondant dans l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de configuration local et votre espace de travail (et en chargeant `~/.profile` s’il est monté). Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les exécuteurs Docker actifs utilisent par défaut un plafond smoke plus petit afin qu’un balayage Docker complet reste praticable :
  `test:docker:live-models` utilise par défaut `OPENCLAW_LIVE_MAX_MODELS=12`, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Remplacez ces variables d’environnement lorsque vous
  voulez explicitement le balayage exhaustif plus large.
- `test:docker:all` construit une fois l’image Docker active via `test:docker:live-build`, puis la réutilise pour les deux voies Docker actives. Il construit aussi une image partagée `scripts/e2e/Dockerfile` via `test:docker:e2e-build` et la réutilise pour les exécuteurs smoke E2E en conteneur qui exercent l’application construite.

Les exécuteurs Docker de modèles actifs montent aussi par liaison uniquement les homes d’authentification CLI nécessaires (ou tous ceux pris en charge lorsque l’exécution n’est pas restreinte), puis les copient dans le home du conteneur avant l’exécution afin que l’OAuth des CLI externes puisse rafraîchir les jetons sans modifier le dépôt d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Smoke de liaison ACP : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh`)
- Smoke du backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Smoke du harnais app-server Codex : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Smoke actif Open WebUI : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’onboarding (TTY, échafaudage complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Smoke d’onboarding/canal/agent via archive npm : `pnpm test:docker:npm-onboard-channel-agent` installe globalement dans Docker l’archive OpenClaw empaquetée, configure OpenAI via onboarding par référence d’environnement ainsi que Telegram par défaut, vérifie que l’activation du Plugin installe ses dépendances runtime à la demande, exécute doctor, puis exécute un tour d’agent OpenAI mocké. Réutilisez une archive préconstruite avec `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la reconstruction hôte avec `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, ou changez de canal avec `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Réseau Gateway (deux conteneurs, auth WS + santé) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Régression minimale de raisonnement OpenAI Responses `web_search` : `pnpm test:docker:openai-web-search-minimal` (script : `scripts/e2e/openai-web-search-minimal-docker.sh`) exécute un serveur OpenAI mocké via Gateway, vérifie que `web_search` élève `reasoning.effort` de `minimal` à `low`, puis force le rejet du schéma fournisseur et vérifie que le détail brut apparaît dans les journaux Gateway.
- Pont de canal MCP (Gateway initialisé + pont stdio + smoke brut de trame de notification Claude) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Outils MCP du bundle Pi (vrai serveur MCP stdio + smoke allow/deny du profil Pi intégré) : `pnpm test:docker:pi-bundle-mcp-tools` (script : `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Nettoyage MCP Cron/sous-agent (vrai Gateway + arrêt des processus enfants MCP stdio après des exécutions cron isolées et de sous-agent ponctuel) : `pnpm test:docker:cron-mcp-cleanup` (script : `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke d’installation + alias `/plugin` + sémantique de redémarrage du bundle Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)
- Smoke sans changement de mise à jour de Plugin : `pnpm test:docker:plugin-update` (script : `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke des métadonnées de rechargement de configuration : `pnpm test:docker:config-reload` (script : `scripts/e2e/config-reload-source-docker.sh`)
- Dépendances runtime de Plugin intégré : `pnpm test:docker:bundled-channel-deps` construit par défaut une petite image d’exécuteur Docker, construit et empaquette OpenClaw une fois sur l’hôte, puis monte cette archive dans chaque scénario d’installation Linux. Réutilisez l’image avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, ignorez la reconstruction hôte après une build locale récente avec `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, ou pointez vers une archive existante avec `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Restreignez les dépendances runtime de Plugin intégré pendant l’itération en désactivant les scénarios non liés, par exemple :
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Pour préconstruire et réutiliser manuellement l’image partagée de l’application construite :

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Les remplacements d’image spécifiques à une suite tels que `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` restent prioritaires lorsqu’ils sont définis. Lorsque `OPENCLAW_SKIP_DOCKER_BUILD=1` pointe vers une image partagée distante, les scripts la récupèrent si elle n’est pas déjà locale. Les tests Docker QR et d’installation conservent leurs propres Dockerfiles car ils valident le comportement de package/installation plutôt que le runtime partagé de l’application construite.

Les exécuteurs Docker de modèles actifs montent aussi par liaison l’extraction actuelle en lecture seule et
la préparent dans un répertoire de travail temporaire à l’intérieur du conteneur. Cela garde l’image runtime
compacte tout en exécutant Vitest sur votre source/configuration locale exacte.
L’étape de préparation ignore les gros caches uniquement locaux et les sorties de build d’application telles que
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, et les répertoires de sortie `.build` ou
Gradle locaux à l’application afin que les exécutions Docker actives ne passent pas des minutes à copier
des artefacts spécifiques à la machine.
Ils définissent aussi `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes actives du gateway ne démarrent pas
de vrais workers de canaux Telegram/Discord/etc. à l’intérieur du conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, alors faites aussi passer
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez réduire ou exclure la couverture active
gateway de cette voie Docker.
`test:docker:openwebui` est un smoke de compatibilité de plus haut niveau : il démarre un
conteneur gateway OpenClaw avec les points de terminaison HTTP compatibles OpenAI activés,
démarre un conteneur Open WebUI épinglé sur ce gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
vraie requête de chat via le proxy `/api/chat/completions` d’Open WebUI.
La première exécution peut être sensiblement plus lente parce que Docker peut devoir récupérer l’image
Open WebUI et qu’Open WebUI peut devoir terminer sa propre configuration à froid.
Cette voie attend une clé de modèle actif utilisable, et `OPENCLAW_PROFILE_FILE`
(`~/.profile` par défaut) est le principal moyen de la fournir dans les exécutions Dockerisées.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est volontairement déterministe et n’a pas besoin d’un
vrai compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway
initialisé, lance un second conteneur qui démarre `openclaw mcp serve`, puis
vérifie la découverte de conversation routée, la lecture des transcriptions, les métadonnées de pièces jointes,
le comportement de la file d’événements active, le routage des envois sortants, ainsi que les notifications de type Claude sur les canaux +
les permissions via le vrai pont MCP stdio. La vérification des notifications
inspecte directement les trames MCP stdio brutes afin que le smoke valide ce que le
pont émet réellement, et pas seulement ce qu’un SDK client particulier choisit d’exposer.
`test:docker:pi-bundle-mcp-tools` est déterministe et n’a pas besoin d’une clé de
modèle actif. Il construit l’image Docker du dépôt, démarre un vrai serveur de sondes MCP stdio
dans le conteneur, matérialise ce serveur via le runtime MCP du bundle Pi intégré,
exécute l’outil, puis vérifie que `coding` et `messaging` conservent les
outils `bundle-mcp` tandis que `minimal` et `tools.deny: ["bundle-mcp"]` les filtrent.
`test:docker:cron-mcp-cleanup` est déterministe et n’a pas besoin d’une clé de modèle actif.
Il démarre un Gateway initialisé avec un vrai serveur de sondes MCP stdio, exécute un
tour cron isolé et un tour enfant ponctuel `/subagents spawn`, puis vérifie
que le processus enfant MCP se termine après chaque exécution.

Smoke manuel ACP en fil en langage clair (hors CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les flux de travail de régression/débogage. Il pourrait être de nouveau nécessaire pour la validation du routage des fils ACP, donc ne le supprimez pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté sur `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté sur `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (par défaut : `~/.profile`) monté sur `/home/node/.profile` et chargé avant l’exécution des tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement chargées depuis `OPENCLAW_PROFILE_FILE`, en utilisant des répertoires config/workspace temporaires et sans montages d’authentification CLI externes
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté sur `/home/node/.npm-global` pour les installations CLI mises en cache dans Docker
- Les répertoires/fichiers d’authentification CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions limitées à certains fournisseurs ne montent que les répertoires/fichiers nécessaires, déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacez manuellement avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par des virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour restreindre l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante pour des relances ne nécessitant pas de reconstruction
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour garantir que les identifiants proviennent du dépôt de profils (et non de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par le gateway pour le smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer le prompt de vérification de nonce utilisé par le smoke Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer le tag d’image Open WebUI épinglé

## Vérification rapide de la documentation

Exécutez les vérifications de documentation après modification de la doc : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous avez aussi besoin de vérifier les titres dans la page : `pnpm docs:check-links:anchors`.

## Régression hors ligne (compatible CI)

Ce sont des régressions de « vrai pipeline » sans vrais fournisseurs :

- Appel d’outils Gateway (OpenAI mocké, vraie boucle gateway + agent) : `src/gateway/gateway.test.ts` (cas : "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistant Gateway (WS `wizard.start`/`wizard.next`, écriture de config + auth imposée) : `src/gateway/gateway.test.ts` (cas : "runs wizard over ws and writes auth token config")

## Évaluations de fiabilité d’agent (Skills)

Nous avons déjà quelques tests compatibles CI qui se comportent comme des « évaluations de fiabilité d’agent » :

- Appel d’outils mocké via la vraie boucle gateway + agent (`src/gateway/gateway.test.ts`).
- Flux d’assistant de bout en bout qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour les Skills (voir [Skills](/fr/tools/skills)) :

- **Prise de décision :** lorsque les Skills sont listées dans le prompt, l’agent choisit-il la bonne Skills (ou évite-t-il celles qui sont sans rapport) ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/arguments requis ?
- **Contrats de flux de travail :** scénarios multi-tours qui vérifient l’ordre des outils, la conservation de l’historique de session et les limites du bac à sable.

Les évaluations futures doivent rester déterministes d’abord :

- Un exécuteur de scénarios utilisant des fournisseurs mockés pour vérifier les appels d’outils + leur ordre, la lecture des fichiers de Skills et le câblage de session.
- Une petite suite de scénarios centrés sur les Skills (utiliser vs éviter, barrières, injection de prompt).
- Des évaluations actives facultatives (opt-in, contrôlées par l’environnement) seulement après la mise en place de la suite compatible CI.

## Tests de contrat (forme des Plugins et des canaux)

Les tests de contrat vérifient que chaque Plugin et canal enregistré respecte son
contrat d’interface. Ils parcourent tous les Plugins découverts et exécutent une suite
de vérifications de forme et de comportement. La voie unitaire par défaut `pnpm test`
ignore volontairement ces fichiers partagés de jointure et de smoke ; exécutez explicitement
les commandes de contrat lorsque vous modifiez des surfaces partagées de canal ou de fournisseur.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canaux uniquement : `pnpm test:contracts:channels`
- Contrats de fournisseurs uniquement : `pnpm test:contracts:plugins`

### Contrats de canal

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - Forme de base du Plugin (id, nom, capacités)
- **setup** - Contrat de l’assistant de configuration
- **session-binding** - Comportement de liaison de session
- **outbound-payload** - Structure de la charge utile du message
- **inbound** - Gestion des messages entrants
- **actions** - Gestionnaires d’actions de canal
- **threading** - Gestion des ID de fil
- **directory** - API d’annuaire/de liste
- **group-policy** - Application de la politique de groupe

### Contrats d’état des fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondes d’état de canal
- **registry** - Forme du registre de Plugins

### Contrats de fournisseur

Situés dans `src/plugins/contracts/*.contract.test.ts` :

- **auth** - Contrat du flux d’authentification
- **auth-choice** - Choix/sélection de l’authentification
- **catalog** - API du catalogue de modèles
- **discovery** - Découverte de Plugin
- **loader** - Chargement de Plugin
- **runtime** - Runtime du fournisseur
- **shape** - Forme/interface du Plugin
- **wizard** - Assistant de configuration

### Quand les exécuter

- Après modification des exports ou sous-chemins du SDK Plugin
- Après ajout ou modification d’un Plugin de canal ou de fournisseur
- Après refactorisation de l’enregistrement ou de la découverte des Plugins

Les tests de contrat s’exécutent en CI et ne nécessitent pas de vraies clés API.

## Ajout de régressions (recommandations)

Lorsque vous corrigez un problème de fournisseur/modèle découvert en actif :

- Ajoutez si possible une régression compatible CI (fournisseur mocké/stub, ou capture de la transformation exacte de forme de requête)
- Si le problème est intrinsèquement actif uniquement (limites de débit, politiques d’authentification), gardez le test actif étroit et opt-in via des variables d’environnement
- Préférez cibler la plus petite couche qui intercepte le bug :
  - bug de conversion/rejeu de requête fournisseur → test de modèles directs
  - bug du pipeline session/historique/outils du gateway → smoke actif gateway ou test mocké compatible CI du gateway
- Garde-fou de parcours SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillonnée par classe SecretRef à partir des métadonnées du registre (`listSecretTargetRegistryEntries()`), puis vérifie que les identifiants exec à segment de parcours sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue volontairement sur les identifiants de cible non classés afin que les nouvelles classes ne puissent pas être ignorées silencieusement.
