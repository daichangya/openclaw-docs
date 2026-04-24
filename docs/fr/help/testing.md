---
read_when:
    - Exécuter des tests localement ou en CI
    - Ajouter des tests de régression pour les bugs de modèle/fournisseur
    - Déboguer le comportement du Gateway + de l’agent
summary: 'Kit de test : suites unitaires/e2e/live, exécuteurs Docker et ce que couvre chaque test'
title: Tests
x-i18n:
    generated_at: "2026-04-24T07:15:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c88325e0edb49437e7faa2eaf730eb3be59054d8c4bb86e56a42bc39a29a2b1
    source_path: help/testing.md
    workflow: 15
---

OpenClaw propose trois suites Vitest (unit/integration, e2e, live) et un petit ensemble
d’exécuteurs Docker. Cette documentation est un guide « comment nous testons » :

- Ce que couvre chaque suite (et ce qu’elle ne couvre délibérément _pas_).
- Quelles commandes exécuter pour les flux de travail courants (local, avant push, débogage).
- Comment les tests live découvrent les identifiants et sélectionnent les modèles/fournisseurs.
- Comment ajouter des régressions pour des problèmes réels de modèle/fournisseur.

## Démarrage rapide

La plupart du temps :

- Barrière complète (attendue avant push) : `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Exécution locale plus rapide de la suite complète sur une machine confortable : `pnpm test:max`
- Boucle de surveillance Vitest directe : `pnpm test:watch`
- Le ciblage direct de fichier route désormais aussi les chemins extension/channel : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Préférez d’abord des exécutions ciblées lorsque vous itérez sur un seul échec.
- Site QA soutenu par Docker : `pnpm qa:lab:up`
- Voie QA soutenue par VM Linux : `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Lorsque vous touchez aux tests ou souhaitez plus de confiance :

- Barrière de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

Lors du débogage de vrais fournisseurs/modèles (nécessite de vrais identifiants) :

- Suite live (modèles + sondes outil/image gateway) : `pnpm test:live`
- Cibler silencieusement un seul fichier live : `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Balayage Docker live des modèles : `pnpm test:docker:live-models`
  - Chaque modèle sélectionné exécute désormais un tour texte plus une petite sonde de type lecture de fichier.
    Les modèles dont les métadonnées annoncent une entrée `image` exécutent également un petit tour image.
    Désactivez les sondes supplémentaires avec `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` lorsque vous isolez des défaillances de fournisseur.
  - Couverture CI : la tâche quotidienne `OpenClaw Scheduled Live And E2E Checks` et la tâche manuelle
    `OpenClaw Release Checks` appellent toutes deux le workflow réutilisable live/E2E avec
    `include_live_suites: true`, ce qui inclut des tâches distinctes de matrice Docker live par
    fournisseur.
  - Pour des réexécutions CI ciblées, déclenchez `OpenClaw Live And E2E Checks (Reusable)`
    avec `include_live_suites: true` et `live_models_only: true`.
  - Ajoutez de nouveaux secrets de fournisseur à fort signal dans `scripts/ci-hydrate-live-auth.sh`
    ainsi que dans `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` et ses
    appelants planifiés/de publication.
- Test smoke natif Codex bound-chat : `pnpm test:docker:live-codex-bind`
  - Exécute une voie Docker live contre le chemin du serveur d’application Codex, lie un
    message privé Slack synthétique avec `/codex bind`, exerce `/codex fast` et
    `/codex permissions`, puis vérifie qu’une réponse simple et une pièce jointe image
    passent par la liaison du Plugin natif plutôt que par ACP.
- Test smoke de coût Moonshot/Kimi : avec `MOONSHOT_API_KEY` défini, exécutez
  `openclaw models list --provider moonshot --json`, puis exécutez un
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolé contre `moonshot/kimi-k2.6`. Vérifiez que le JSON signale Moonshot/K2.6 et que la
  transcription de l’assistant stocke `usage.cost` normalisé.

Conseil : lorsque vous n’avez besoin que d’un seul cas en échec, préférez affiner les tests live via les variables d’environnement de liste d’autorisation décrites ci-dessous.

## Exécuteurs spécifiques QA

Ces commandes se placent à côté des suites de test principales lorsque vous avez besoin du réalisme de qa-lab :

La CI exécute QA Lab dans des workflows dédiés. `Parity gate` s’exécute sur les PR correspondantes et
depuis un déclenchement manuel avec des fournisseurs simulés. `QA-Lab - All Lanes` s’exécute chaque nuit sur
`main` et depuis un déclenchement manuel avec la porte de parité simulée, la voie live Matrix et
la voie live Telegram gérée par Convex comme tâches parallèles. `OpenClaw Release Checks`
exécute les mêmes voies avant l’approbation d’une publication.

- `pnpm openclaw qa suite`
  - Exécute des scénarios QA soutenus par dépôt directement sur l’hôte.
  - Exécute plusieurs scénarios sélectionnés en parallèle par défaut avec des
    workers gateway isolés. `qa-channel` utilise par défaut une concurrence de 4 (bornée par le
    nombre de scénarios sélectionnés). Utilisez `--concurrency <count>` pour ajuster le nombre de workers, ou `--concurrency 1` pour l’ancienne voie série.
  - Se termine avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie en échec.
  - Prend en charge les modes fournisseur `live-frontier`, `mock-openai` et `aimock`.
    `aimock` démarre un serveur fournisseur local soutenu par AIMock pour une couverture expérimentale
    de fixtures et de simulation de protocole sans remplacer la voie `mock-openai` sensible aux scénarios.
- `pnpm openclaw qa suite --runner multipass`
  - Exécute la même suite QA dans une VM Linux Multipass jetable.
  - Conserve le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
  - Réutilise les mêmes options de sélection fournisseur/modèle que `qa suite`.
  - Les exécutions live transmettent les entrées d’authentification QA prises en charge et praticables pour l’invité :
    clés de fournisseur basées sur l’environnement, chemin de configuration du fournisseur live QA et `CODEX_HOME`
    lorsqu’il est présent.
  - Les répertoires de sortie doivent rester sous la racine du dépôt afin que l’invité puisse réécrire
    via l’espace de travail monté.
  - Écrit le rapport QA + résumé normaux ainsi que les journaux Multipass sous
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Démarre le site QA soutenu par Docker pour le travail QA de style opérateur.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Construit un tarball npm à partir de l’extraction actuelle, l’installe globalement dans
    Docker, exécute un onboarding OpenAI non interactif par clé API, configure Telegram
    par défaut, vérifie que l’activation du Plugin installe les dépendances d’exécution à la demande, exécute doctor, puis exécute un tour d’agent local contre un endpoint OpenAI simulé.
  - Utilisez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` pour exécuter la même
    voie d’installation empaquetée avec Discord.
- `pnpm test:docker:npm-telegram-live`
  - Installe un package OpenClaw publié dans Docker, exécute l’onboarding du package installé,
    configure Telegram via la CLI installée, puis réutilise la voie QA Telegram live avec ce package installé comme Gateway SUT.
  - Utilise par défaut `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Utilise les mêmes identifiants Telegram depuis l’environnement ou la même source d’identifiants Convex que
    `pnpm openclaw qa telegram`. Pour l’automatisation CI/publication, définissez
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` et le secret de rôle. Si
    `OPENCLAW_QA_CONVEX_SITE_URL` et un secret de rôle Convex sont présents en CI,
    le wrapper Docker sélectionne automatiquement Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` remplace le
    `OPENCLAW_QA_CREDENTIAL_ROLE` partagé pour cette voie uniquement.
  - GitHub Actions expose cette voie en tant que workflow mainteneur manuel
    `NPM Telegram Beta E2E`. Il ne s’exécute pas lors d’une fusion. Le workflow utilise l’environnement
    `qa-live-shared` et des baux d’identifiants CI Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Empaquette et installe la build OpenClaw actuelle dans Docker, démarre le Gateway
    avec OpenAI configuré, puis active des canaux/Plugins groupés via des modifications de configuration.
  - Vérifie que la découverte de configuration laisse absentes les dépendances d’exécution du Plugin non configuré, que la première exécution configurée du Gateway ou de doctor installe à la demande les dépendances d’exécution de chaque Plugin groupé, et qu’un second redémarrage ne réinstalle pas des dépendances déjà activées.
  - Installe également une base npm plus ancienne connue, active Telegram avant d’exécuter
    `openclaw update --tag <candidate>`, puis vérifie que le doctor post-mise à jour du candidat répare les dépendances d’exécution des canaux groupés sans réparation postinstall côté harnais.
- `pnpm openclaw qa aimock`
  - Démarre uniquement le serveur fournisseur AIMock local pour des tests smoke directs de protocole.
- `pnpm openclaw qa matrix`
  - Exécute la voie QA Matrix live contre un homeserver Tuwunel jetable soutenu par Docker.
  - Cet hôte QA est aujourd’hui réservé au dépôt/dev. Les installations OpenClaw empaquetées ne fournissent pas `qa-lab`, donc elles n’exposent pas `openclaw qa`.
  - Les extractions de dépôt chargent directement l’exécuteur groupé ; aucune installation séparée de Plugin n’est nécessaire.
  - Approvisionne trois utilisateurs Matrix temporaires (`driver`, `sut`, `observer`) plus un salon privé, puis démarre un enfant QA gateway avec le vrai Plugin Matrix comme transport SUT.
  - Utilise par défaut l’image Tuwunel stable épinglée `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Remplacez-la avec `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` lorsque vous devez tester une autre image.
  - Matrix n’expose pas les indicateurs partagés de source d’identifiants car la voie approvisionne des utilisateurs jetables localement.
  - Écrit un rapport QA Matrix, un résumé, un artefact d’événements observés et un journal combiné stdout/stderr sous `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Exécute la voie QA Telegram live contre un vrai groupe privé en utilisant les jetons du bot driver et du bot SUT provenant de l’environnement.
  - Nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. L’identifiant du groupe doit être l’identifiant numérique du chat Telegram.
  - Prend en charge `--credential-source convex` pour des identifiants mutualisés. Utilisez le mode environnement par défaut, ou définissez `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` pour activer des baux mutualisés.
  - Se termine avec un code non nul si un scénario échoue. Utilisez `--allow-failures` lorsque vous
    voulez des artefacts sans code de sortie en échec.
  - Nécessite deux bots distincts dans le même groupe privé, le bot SUT exposant un nom d’utilisateur Telegram.
  - Pour une observation stable bot-à-bot, activez le mode Bot-to-Bot Communication dans `@BotFather` pour les deux bots et assurez-vous que le bot driver peut observer le trafic de bots dans le groupe.
  - Écrit un rapport QA Telegram, un résumé et un artefact des messages observés sous `.artifacts/qa-e2e/...`. Les scénarios de réponse incluent le RTT entre la requête d’envoi du driver et la réponse observée du SUT.

Les voies live de transport partagent un contrat standard afin que les nouveaux transports ne divergent pas :

`qa-channel` reste la suite QA synthétique large et ne fait pas partie de la matrice de couverture des transports live.

| Voie     | Canary | Filtrage par mention | Blocage par liste d’autorisation | Réponse de premier niveau | Reprise après redémarrage | Suivi de fil | Isolation de fil | Observation des réactions | Commande d’aide |
| -------- | ------ | -------------------- | -------------------------------- | ------------------------- | ------------------------- | ------------ | ---------------- | ------------------------- | --------------- |
| Matrix   | x      | x                    | x                                | x                         | x                         | x            | x                | x                         |                 |
| Telegram | x      |                      |                                  |                           |                           |              |                  |                           | x               |

### Identifiants Telegram partagés via Convex (v1)

Lorsque `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) est activé pour
`openclaw qa telegram`, QA lab acquiert un bail exclusif depuis un pool soutenu par Convex, envoie des heartbeats
sur ce bail pendant l’exécution de la voie et libère le bail à l’arrêt.

Structure de projet Convex de référence :

- `qa/convex-credential-broker/`

Variables d’environnement requises :

- `OPENCLAW_QA_CONVEX_SITE_URL` (par exemple `https://your-deployment.convex.site`)
- Un secret pour le rôle sélectionné :
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` pour `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` pour `ci`
- Sélection du rôle d’identifiant :
  - CLI : `--credential-role maintainer|ci`
  - Valeur par défaut environnement : `OPENCLAW_QA_CREDENTIAL_ROLE` (par défaut `ci` en CI, `maintainer` sinon)

Variables d’environnement facultatives :

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (par défaut `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (par défaut `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (par défaut `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (par défaut `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (par défaut `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (identifiant de traçage facultatif)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` autorise les URL Convex `http://` loopback pour le développement local uniquement.

`OPENCLAW_QA_CONVEX_SITE_URL` doit utiliser `https://` en fonctionnement normal.

Les commandes d’administration mainteneur (ajout/suppression/liste du pool) nécessitent
spécifiquement `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Assistants CLI pour les mainteneurs :

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Utilisez `--json` pour une sortie lisible par machine dans les scripts et utilitaires CI.

Contrat d’endpoint par défaut (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`) :

- `POST /acquire`
  - Requête : `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Succès : `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Pool épuisé / réessayable : `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - Garde-fou sur bail actif : `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (secret mainteneur uniquement)
  - Requête : `{ kind?, status?, includePayload?, limit? }`
  - Succès : `{ status: "ok", credentials, count }`

Forme de charge utile pour le type Telegram :

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` doit être une chaîne d’identifiant numérique de chat Telegram.
- `admin/add` valide cette forme pour `kind: "telegram"` et rejette les charges utiles mal formées.

### Ajouter un canal à QA

Ajouter un canal au système QA markdown nécessite exactement deux choses :

1. Un adaptateur de transport pour le canal.
2. Un ensemble de scénarios qui exerce le contrat du canal.

N’ajoutez pas une nouvelle racine de commande QA de niveau supérieur lorsque l’hôte partagé `qa-lab` peut
prendre en charge le flux.

`qa-lab` gère les mécanismes d’hôte partagés :

- la racine de commande `openclaw qa`
- le démarrage et l’arrêt de la suite
- la concurrence des workers
- l’écriture des artefacts
- la génération de rapports
- l’exécution des scénarios
- les alias de compatibilité pour les anciens scénarios `qa-channel`

Les Plugins d’exécuteur gèrent le contrat de transport :

- comment `openclaw qa <runner>` est monté sous la racine partagée `qa`
- comment le Gateway est configuré pour ce transport
- comment l’état de préparation est vérifié
- comment les événements entrants sont injectés
- comment les messages sortants sont observés
- comment les transcriptions et l’état de transport normalisé sont exposés
- comment les actions soutenues par le transport sont exécutées
- comment la réinitialisation ou le nettoyage spécifique au transport est géré

Le seuil minimal d’adoption pour un nouveau canal est le suivant :

1. Conserver `qa-lab` comme propriétaire de la racine partagée `qa`.
2. Implémenter l’exécuteur de transport sur le point d’extension d’hôte partagé `qa-lab`.
3. Conserver les mécanismes spécifiques au transport à l’intérieur du Plugin d’exécuteur ou du harnais de canal.
4. Monter l’exécuteur comme `openclaw qa <runner>` au lieu d’enregistrer une racine de commande concurrente.
   Les Plugins d’exécuteur doivent déclarer `qaRunners` dans `openclaw.plugin.json` et exporter un tableau `qaRunnerCliRegistrations` correspondant depuis `runtime-api.ts`.
   Gardez `runtime-api.ts` léger ; la CLI paresseuse et l’exécution de l’exécuteur doivent rester derrière des points d’entrée séparés.
5. Rédiger ou adapter les scénarios markdown sous les répertoires thématiques `qa/scenarios/`.
6. Utiliser les assistants de scénarios génériques pour les nouveaux scénarios.
7. Garder les alias de compatibilité existants fonctionnels sauf si le dépôt effectue une migration intentionnelle.

La règle de décision est stricte :

- Si un comportement peut être exprimé une seule fois dans `qa-lab`, placez-le dans `qa-lab`.
- Si un comportement dépend d’un transport de canal, conservez-le dans ce Plugin d’exécuteur ou ce harnais de Plugin.
- Si un scénario nécessite une nouvelle capacité que plus d’un canal peut utiliser, ajoutez un assistant générique au lieu d’une branche spécifique à un canal dans `suite.ts`.
- Si un comportement n’a de sens que pour un seul transport, gardez le scénario spécifique à ce transport et rendez cela explicite dans le contrat du scénario.

Les noms préférés des assistants génériques pour les nouveaux scénarios sont :

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

Le nouveau travail de canal doit utiliser les noms d’assistants génériques.
Les alias de compatibilité existent pour éviter une migration brutale, pas comme modèle pour
la rédaction de nouveaux scénarios.

## Suites de test (ce qui s’exécute où)

Considérez les suites comme un « réalisme croissant » (et une fragilité/coût croissants) :

### Unit / integration (par défaut)

- Commande : `pnpm test`
- Configuration : les exécutions non ciblées utilisent l’ensemble de fragments `vitest.full-*.config.ts` et peuvent développer les fragments multi-projets en configurations par projet pour l’ordonnancement parallèle
- Fichiers : inventaires core/unit sous `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts`, et les tests Node `ui` en liste blanche couverts par `vitest.unit.config.ts`
- Portée :
  - Tests unitaires purs
  - Tests d’intégration en processus (authentification gateway, routage, outillage, parsing, configuration)
  - Régressions déterministes pour des bugs connus
- Attentes :
  - S’exécute en CI
  - Aucune vraie clé requise
  - Doit être rapide et stable
    <AccordionGroup>
    <Accordion title="Projets, fragments et voies ciblées"> - Les exécutions non ciblées de `pnpm test` utilisent douze petites configurations de fragments (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d’un seul grand processus racine natif. Cela réduit le pic de RSS sur les machines chargées et évite que le travail auto-reply/extension n’affame les suites non liées. - `pnpm test --watch` utilise toujours le graphe de projets racine natif `vitest.config.ts`, car une boucle de surveillance multi-fragments n’est pas praticable. - `pnpm test`, `pnpm test:watch` et `pnpm test:perf:imports` routent d’abord les cibles explicites fichier/répertoire via des voies ciblées, de sorte que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite de payer le coût complet de démarrage du projet racine. - `pnpm test:changed` développe les chemins git modifiés vers les mêmes voies ciblées lorsque le diff ne touche que des fichiers source/test routables ; les modifications de configuration/setup reviennent toujours à une relance large du projet racine. - `pnpm check:changed` est la barrière locale intelligente normale pour le travail étroit. Il classe le diff en core, tests core, extensions, tests d’extension, apps, docs, métadonnées de publication et outillage, puis exécute les voies correspondantes de typecheck/lint/test. Les modifications du SDK Plugin public et du contrat Plugin incluent une passe de validation d’extension, car les extensions dépendent de ces contrats core. Les hausses de version limitées aux métadonnées de publication exécutent des vérifications ciblées de version/configuration/dépendances racine au lieu de la suite complète, avec un garde-fou qui rejette les changements de package en dehors du champ de version de niveau supérieur. - Les tests unitaires à import léger provenant des agents, commandes, plugins, assistants auto-reply, `plugin-sdk` et zones utilitaires pures similaires passent par la voie `unit-fast`, qui ignore `test/setup-openclaw-runtime.ts` ; les fichiers lourds à l’exécution/avec état restent sur les voies existantes. - Certains fichiers source d’assistants `plugin-sdk` et `commands` associent aussi les exécutions en mode changed à des tests frères explicites dans ces voies légères, afin que les modifications d’assistants évitent de relancer toute la suite lourde pour ce répertoire. - `auto-reply` comporte trois compartiments dédiés : assistants core de premier niveau, tests d’intégration `reply.*` de premier niveau et sous-arborescence `src/auto-reply/reply/**`. Cela évite que le travail de harnais reply le plus lourd ne se retrouve dans les tests bon marché de statut/fragment/jeton.
    </Accordion>

      <Accordion title="Couverture de l’exécuteur embarqué">
        - Lorsque vous modifiez les entrées de découverte des outils de message ou le
          contexte d’exécution de Compaction, conservez les deux niveaux de couverture.
        - Ajoutez des régressions ciblées d’assistants pour les limites pures de routage et de normalisation.
        - Gardez saines les suites d’intégration de l’exécuteur embarqué :
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, et
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Ces suites vérifient que les identifiants ciblés et le comportement de Compaction circulent toujours
          à travers les vrais chemins `run.ts` / `compact.ts` ; les tests limités aux assistants ne
          remplacent pas suffisamment ces chemins d’intégration.
      </Accordion>

      <Accordion title="Valeurs par défaut du pool Vitest et de l’isolation">
        - La configuration Vitest de base utilise par défaut `threads`.
        - La configuration Vitest partagée fixe `isolate: false` et utilise
          l’exécuteur non isolé sur les projets racine, les configurations e2e et live.
        - La voie UI racine conserve sa configuration `jsdom` et son optimiseur, mais s’exécute
          également sur l’exécuteur partagé non isolé.
        - Chaque fragment `pnpm test` hérite des mêmes valeurs par défaut
          `threads` + `isolate: false` depuis la configuration Vitest partagée.
        - `scripts/run-vitest.mjs` ajoute `--no-maglev` pour les processus Node enfants Vitest
          par défaut afin de réduire le churn de compilation V8 lors des grosses exécutions locales.
          Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` pour comparer au
          comportement V8 standard.
      </Accordion>

      <Accordion title="Itération locale rapide">
        - `pnpm changed:lanes` affiche quelles voies architecturales un diff déclenche.
        - Le hook pre-commit ne fait que le formatage. Il remet en scène les fichiers
          formatés et n’exécute ni lint, ni typecheck, ni tests.
        - Exécutez explicitement `pnpm check:changed` avant le handoff ou le push lorsque vous
          avez besoin de la barrière locale intelligente. Les modifications du SDK Plugin public et du contrat Plugin
          incluent une passe de validation d’extension.
        - `pnpm test:changed` route via des voies ciblées lorsque les chemins modifiés
          correspondent proprement à une suite plus petite.
        - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage,
          simplement avec un plafond de workers plus élevé.
        - La mise à l’échelle automatique locale des workers est volontairement conservatrice et recule
          lorsque la moyenne de charge de l’hôte est déjà élevée, de sorte que plusieurs exécutions
          Vitest concurrentes font moins de dégâts par défaut.
        - La configuration Vitest de base marque les projets/fichiers de configuration comme
          `forceRerunTriggers` afin que les relances en mode changed restent correctes lorsque
          le câblage des tests change.
        - La configuration garde `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes
          pris en charge ; définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez
          un emplacement de cache explicite pour le profilage direct.
      </Accordion>

      <Accordion title="Débogage des performances">
        - `pnpm test:perf:imports` active le rapport de durée d’import Vitest ainsi
          que la sortie de détail des imports.
        - `pnpm test:perf:imports:changed` limite la même vue de profilage aux
          fichiers modifiés depuis `origin/main`.
        - Lorsqu’un test chaud passe encore la majeure partie de son temps dans les imports de démarrage,
          gardez les dépendances lourdes derrière un point d’extension local étroit `*.runtime.ts` et
          simulez directement ce point d’extension au lieu d’importer en profondeur des assistants d’exécution juste
          pour les transmettre à `vi.mock(...)`.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` compare
          `test:changed` routé au chemin natif du projet racine pour ce diff validé et
          affiche le temps mur plus le RSS maximal macOS.
        - `pnpm test:perf:changed:bench -- --worktree` mesure l’arbre sale actuel
          en routant la liste des fichiers modifiés via
          `scripts/test-projects.mjs` et la configuration Vitest racine.
        - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour
          les surcoûts de démarrage et de transformation Vitest/Vite.
        - `pnpm test:perf:profile:runner` écrit des profils CPU+tas de l’exécuteur pour la
          suite unit avec parallélisme par fichier désactivé.
      </Accordion>
    </AccordionGroup>

### Stability (gateway)

- Commande : `pnpm test:stability:gateway`
- Configuration : `vitest.gateway.config.ts`, forcée à un seul worker
- Portée :
  - Démarre un vrai Gateway loopback avec les diagnostics activés par défaut
  - Fait passer du churn synthétique de messages, mémoire et grosses charges utiles gateway par le chemin d’événements de diagnostic
  - Interroge `diagnostics.stability` via le RPC WS Gateway
  - Couvre les assistants de persistance du bundle de stabilité de diagnostic
  - Vérifie que l’enregistreur reste borné, que les échantillons RSS synthétiques restent sous le budget de pression et que les profondeurs de file par session reviennent à zéro
- Attentes :
  - Sûr pour la CI et sans clé
  - Voie étroite pour le suivi des régressions de stabilité, pas un substitut à la suite Gateway complète

### E2E (gateway smoke)

- Commande : `pnpm test:e2e`
- Configuration : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, et tests E2E des Plugins groupés sous `extensions/`
- Valeurs d’exécution par défaut :
  - Utilise Vitest `threads` avec `isolate: false`, comme le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu’à 2, local : 1 par défaut).
  - S’exécute en mode silencieux par défaut pour réduire le surcoût d’E/S console.
- Remplacements utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (limité à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console détaillée.
- Portée :
  - Comportement end-to-end Gateway à plusieurs instances
  - Surfaces WebSocket/HTTP, appairage de Nodes et réseau plus lourd
- Attentes :
  - S’exécute en CI (lorsqu’il est activé dans le pipeline)
  - Aucune vraie clé requise
  - Plus de pièces mobiles que les tests unitaires (peut être plus lent)

### E2E : smoke du backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `extensions/openshell/src/backend.e2e.test.ts`
- Portée :
  - Démarre sur l’hôte un Gateway OpenShell isolé via Docker
  - Crée un sandbox à partir d’un Dockerfile local temporaire
  - Exerce le backend OpenShell d’OpenClaw via un vrai `sandbox ssh-config` + exec SSH
  - Vérifie le comportement du système de fichiers canonique distant via le pont fs du sandbox
- Attentes :
  - Uniquement sur activation explicite ; ne fait pas partie de l’exécution par défaut `pnpm test:e2e`
  - Nécessite une CLI `openshell` locale et un démon Docker fonctionnel
  - Utilise `HOME` / `XDG_CONFIG_HOME` isolés, puis détruit le Gateway de test et le sandbox
- Remplacements utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l’exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI non standard ou un script wrapper

### Live (vrais fournisseurs + vrais modèles)

- Commande : `pnpm test:live`
- Configuration : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, et tests live des Plugins groupés sous `extensions/`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Ce fournisseur/modèle fonctionne-t-il vraiment _aujourd’hui_ avec de vrais identifiants ? »
  - Détecter les changements de format des fournisseurs, les particularités d’appel d’outil, les problèmes d’authentification et le comportement de limitation de débit
- Attentes :
  - Pas stable en CI par conception (vrais réseaux, vraies politiques de fournisseur, quotas, pannes)
  - Coûte de l’argent / consomme des limites de débit
  - Préférez exécuter des sous-ensembles ciblés plutôt que « tout »
- Les exécutions live chargent `~/.profile` pour récupérer les clés API manquantes.
- Par défaut, les exécutions live isolent toujours `HOME` et copient la configuration/le matériel d’authentification dans un répertoire personnel temporaire de test afin que les fixtures unitaires ne puissent pas modifier votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous avez intentionnellement besoin que les tests live utilisent votre vrai répertoire personnel.
- `pnpm test:live` utilise désormais par défaut un mode plus silencieux : il conserve la sortie de progression `[live] ...`, mais supprime l’avis supplémentaire sur `~/.profile` et coupe les journaux de démarrage gateway / le bruit Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous voulez retrouver les journaux complets de démarrage.
- Rotation des clés API (spécifique au fournisseur) : définissez `*_API_KEYS` avec un format virgule/point-virgule ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou un remplacement par live via `OPENCLAW_LIVE_*_KEY` ; les tests réessaient en cas de réponses de limitation de débit.
- Sortie progression/heartbeat :
  - Les suites live émettent désormais des lignes de progression sur stderr afin que les longs appels de fournisseur soient visiblement actifs même lorsque la capture console Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l’interception de console Vitest afin que les lignes de progression fournisseur/gateway soient diffusées immédiatement pendant les exécutions live.
  - Ajustez les heartbeats du modèle direct avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajustez les heartbeats gateway/sonde avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modifier la logique/les tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup changé)
- Toucher au réseau gateway / protocole WS / appairage : ajoutez `pnpm test:e2e`
- Déboguer « mon bot est en panne » / des défaillances spécifiques à un fournisseur / l’appel d’outil : exécutez un `pnpm test:live` ciblé

## Tests live (touchant au réseau)

Pour la matrice de modèles live, les tests smoke de backends CLI, les tests smoke ACP, le harnais
du serveur d’application Codex, ainsi que tous les tests live de fournisseurs média (Deepgram, BytePlus, ComfyUI, image,
musique, vidéo, harnais média) — plus la gestion des identifiants pour les exécutions live — voir
[Tests — suites live](/fr/help/testing-live).

## Exécuteurs Docker (vérifications facultatives « ça fonctionne sous Linux »)

Ces exécuteurs Docker se répartissent en deux catégories :

- Exécuteurs live de modèles : `test:docker:live-models` et `test:docker:live-gateway` n’exécutent que leur fichier live de clé de profil correspondant à l’intérieur de l’image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de configuration local et votre espace de travail (et en chargeant `~/.profile` s’il est monté). Les points d’entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les exécuteurs Docker live utilisent par défaut un plafond de smoke plus petit pour qu’un balayage Docker complet reste praticable :
  `test:docker:live-models` utilise par défaut `OPENCLAW_LIVE_MAX_MODELS=12`, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Remplacez ces variables d’environnement lorsque vous
  voulez explicitement le balayage exhaustif plus large.
- `test:docker:all` construit l’image Docker live une seule fois via `test:docker:live-build`, puis la réutilise pour les deux voies Docker live. Il construit aussi une image partagée `scripts/e2e/Dockerfile` via `test:docker:e2e-build` et la réutilise pour les exécuteurs smoke E2E en conteneur qui exercent l’application construite.
- Exécuteurs smoke en conteneur : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, et `test:docker:config-reload` démarrent un ou plusieurs conteneurs réels et vérifient des chemins d’intégration de plus haut niveau.

Les exécuteurs Docker live de modèles montent également uniquement les répertoires personnels d’authentification CLI nécessaires (ou tous ceux pris en charge lorsque l’exécution n’est pas ciblée), puis les copient dans le répertoire personnel du conteneur avant l’exécution afin que l’OAuth CLI externe puisse rafraîchir les jetons sans modifier le magasin d’authentification de l’hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Test smoke ACP bind : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh`)
- Test smoke backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Test smoke harnais serveur d’application Codex : `pnpm test:docker:live-codex-harness` (script : `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Test smoke live Open WebUI : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d’onboarding (TTY, échafaudage complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Test smoke onboarding/canal/agent via tarball npm : `pnpm test:docker:npm-onboard-channel-agent` installe globalement le tarball OpenClaw empaqueté dans Docker, configure OpenAI via onboarding par référence env plus Telegram par défaut, vérifie que doctor répare les dépendances d’exécution du Plugin activé et exécute un tour d’agent OpenAI simulé. Réutilisez un tarball préconstruit avec `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la reconstruction sur l’hôte avec `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, ou changez de canal avec `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Test smoke d’installation globale Bun : `bash scripts/e2e/bun-global-install-smoke.sh` empaquette l’arbre courant, l’installe avec `bun install -g` dans un répertoire personnel isolé et vérifie que `openclaw infer image providers --json` renvoie les fournisseurs d’images groupés au lieu de bloquer. Réutilisez un tarball préconstruit avec `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignorez la build hôte avec `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, ou copiez `dist/` depuis une image Docker construite avec `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Test smoke Docker de l’installateur : `bash scripts/test-install-sh-docker.sh` partage un seul cache npm entre ses conteneurs racine, mise à jour et npm direct. Le test de mise à jour utilise par défaut npm `latest` comme base stable avant de mettre à niveau vers le tarball candidat. Les vérifications d’installateur non root conservent un cache npm isolé afin que les entrées de cache détenues par root ne masquent pas le comportement d’installation locale utilisateur. Définissez `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` pour réutiliser le cache root/update/direct-npm lors des relances locales.
- La CI Install Smoke ignore la mise à jour globale directe npm en double avec `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` ; exécutez le script localement sans cette variable d’environnement lorsque la couverture directe `npm install -g` est nécessaire.
- Réseau Gateway (deux conteneurs, auth WS + health) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Régression OpenAI Responses web_search minimal reasoning : `pnpm test:docker:openai-web-search-minimal` (script : `scripts/e2e/openai-web-search-minimal-docker.sh`) exécute un serveur OpenAI simulé via Gateway, vérifie que `web_search` élève `reasoning.effort` de `minimal` à `low`, puis force le rejet du schéma fournisseur et vérifie que le détail brut apparaît dans les journaux Gateway.
- Pont de canal MCP (Gateway initialisé + pont stdio + test smoke de trame de notification Claude brute) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Outils MCP groupés Pi (vrai serveur MCP stdio + smoke allow/deny de profil Pi embarqué) : `pnpm test:docker:pi-bundle-mcp-tools` (script : `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Nettoyage MCP cron/sous-agent (vrai Gateway + arrêt du processus enfant MCP stdio après cron isolé et exécutions ponctuelles de sous-agent) : `pnpm test:docker:cron-mcp-cleanup` (script : `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (test smoke d’installation + alias `/plugin` + sémantique de redémarrage Claude-bundle) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)
- Test smoke de mise à jour de Plugin inchangée : `pnpm test:docker:plugin-update` (script : `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Test smoke des métadonnées de rechargement de configuration : `pnpm test:docker:config-reload` (script : `scripts/e2e/config-reload-source-docker.sh`)
- Dépendances d’exécution des Plugins groupés : `pnpm test:docker:bundled-channel-deps` construit par défaut une petite image Docker d’exécution, construit et empaquette OpenClaw une seule fois sur l’hôte, puis monte ce tarball dans chaque scénario d’installation Linux. Réutilisez l’image avec `OPENCLAW_SKIP_DOCKER_BUILD=1`, ignorez la reconstruction hôte après une build locale récente avec `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, ou pointez vers un tarball existant avec `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Réduisez le test des dépendances d’exécution des Plugins groupés pendant l’itération en désactivant les scénarios non liés, par exemple :
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Pour préconstruire et réutiliser manuellement l’image partagée built-app :

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Les remplacements d’image spécifiques à une suite tels que `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` restent prioritaires lorsqu’ils sont définis. Lorsque `OPENCLAW_SKIP_DOCKER_BUILD=1` pointe vers une image partagée distante, les scripts la récupèrent si elle n’est pas déjà présente localement. Les tests Docker QR et installateur conservent leurs propres Dockerfiles car ils valident le comportement du package/de l’installation plutôt que l’exécution partagée built-app.

Les exécuteurs Docker live de modèles montent également l’extraction courante en lecture seule et
la placent dans un répertoire de travail temporaire dans le conteneur. Cela garde l’image d’exécution
mince tout en exécutant Vitest contre votre source/configuration locale exacte.
L’étape de staging ignore les gros caches locaux uniquement et les sorties de build d’app telles que
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, ainsi que les répertoires locaux `.build` ou
les sorties Gradle, afin que les exécutions Docker live ne passent pas des minutes à copier
des artefacts spécifiques à la machine.
Ils définissent aussi `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes gateway live ne démarrent pas
de vrais workers de canaux Telegram/Discord/etc. à l’intérieur du conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, donc transmettez aussi
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez réduire ou exclure la couverture gateway
live de cette voie Docker.
`test:docker:openwebui` est un test smoke de compatibilité de plus haut niveau : il démarre un
conteneur gateway OpenClaw avec les endpoints HTTP compatibles OpenAI activés,
démarre un conteneur Open WebUI épinglé contre ce gateway, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
vraie requête de chat via le proxy `/api/chat/completions` d’Open WebUI.
La première exécution peut être sensiblement plus lente car Docker peut devoir récupérer l’image
Open WebUI et Open WebUI peut devoir terminer sa propre configuration à froid.
Cette voie attend une clé de modèle live exploitable, et `OPENCLAW_PROFILE_FILE`
(`~/.profile` par défaut) est le moyen principal de la fournir dans les exécutions Dockerisées.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est volontairement déterministe et n’a pas besoin d’un
vrai compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway initialisé,
démarre un second conteneur qui lance `openclaw mcp serve`, puis
vérifie la découverte de conversation routée, les lectures de transcription, les métadonnées de pièces jointes,
le comportement de file d’événements live, le routage d’envoi sortant, ainsi que les notifications de canal + permission de style Claude via le vrai pont MCP stdio. La vérification des notifications
inspecte directement les trames MCP stdio brutes, afin que le test smoke valide ce que le
pont émet réellement, et pas seulement ce qu’un SDK client particulier choisit d’exposer.
`test:docker:pi-bundle-mcp-tools` est déterministe et n’a pas besoin d’une clé de modèle live.
Il construit l’image Docker du dépôt, démarre un vrai serveur de sonde MCP stdio
à l’intérieur du conteneur, matérialise ce serveur via l’exécution MCP groupée Pi embarquée,
exécute l’outil, puis vérifie que `coding` et `messaging` conservent
les outils `bundle-mcp` tandis que `minimal` et `tools.deny: ["bundle-mcp"]` les filtrent.
`test:docker:cron-mcp-cleanup` est déterministe et n’a pas besoin d’une clé de modèle live.
Il démarre un Gateway initialisé avec un vrai serveur de sonde MCP stdio, exécute un
tour cron isolé et un tour enfant ponctuel `/subagents spawn`, puis vérifie que
le processus enfant MCP se termine après chaque exécution.

Test smoke manuel ACP de fil en langage naturel (hors CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Gardez ce script pour les flux de travail de régression/débogage. Il peut être nécessaire à nouveau pour la validation du routage des fils ACP, donc ne le supprimez pas.

Variables d’environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté sur `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté sur `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (par défaut : `~/.profile`) monté sur `/home/node/.profile` et chargé avant l’exécution des tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` pour vérifier uniquement les variables d’environnement chargées depuis `OPENCLAW_PROFILE_FILE`, en utilisant des répertoires config/workspace temporaires et aucun montage externe d’authentification CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté sur `/home/node/.npm-global` pour les installations CLI mises en cache dans Docker
- Les répertoires/fichiers d’authentification CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions de fournisseur ciblées ne montent que les répertoires/fichiers nécessaires déduits de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacement manuel avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par des virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour réduire l’exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_SKIP_DOCKER_BUILD=1` pour réutiliser une image `openclaw:local-live` existante pour les relances sans reconstruction
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour s’assurer que les identifiants proviennent du magasin de profils (et non de l’environnement)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par le gateway pour le smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer le prompt de vérification nonce utilisé par le smoke Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer le tag d’image Open WebUI épinglé

## Vérification de la documentation

Exécutez les contrôles de documentation après des modifications de docs : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous avez aussi besoin des vérifications d’en-têtes dans la page : `pnpm docs:check-links:anchors`.

## Régression hors ligne (sûre pour la CI)

Ce sont des régressions de « vrai pipeline » sans vrais fournisseurs :

- Appel d’outil Gateway (simulation OpenAI, vrai gateway + boucle agent) : `src/gateway/gateway.test.ts` (cas : « runs a mock OpenAI tool call end-to-end via gateway agent loop »)
- Assistant Gateway (WS `wizard.start`/`wizard.next`, écrit la configuration + auth imposée) : `src/gateway/gateway.test.ts` (cas : « runs wizard over ws and writes auth token config »)

## Évaluations de fiabilité d’agent (Skills)

Nous avons déjà quelques tests sûrs pour la CI qui se comportent comme des « évaluations de fiabilité d’agent » :

- Appel d’outil simulé via la vraie boucle gateway + agent (`src/gateway/gateway.test.ts`).
- Flux d’assistant end-to-end qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qu’il manque encore pour les Skills (voir [Skills](/fr/tools/skills)) :

- **Prise de décision :** lorsque des Skills sont listées dans le prompt, l’agent choisit-il la bonne Skill (ou évite-t-il les Skills non pertinentes) ?
- **Conformité :** l’agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/arguments requis ?
- **Contrats de flux de travail :** scénarios multi-tours qui valident l’ordre des outils, la reprise de l’historique de session et les limites du sandbox.

Les futures évaluations devraient rester déterministes en priorité :

- Un exécuteur de scénarios utilisant des fournisseurs simulés pour vérifier les appels d’outils + leur ordre, les lectures de fichiers de Skill et le câblage de session.
- Une petite suite de scénarios centrés sur les Skills (utiliser vs éviter, filtrage, injection de prompt).
- Des évaluations live facultatives (opt-in, contrôlées par env) uniquement après la mise en place de la suite sûre pour la CI.

## Tests de contrat (forme des Plugins et des canaux)

Les tests de contrat vérifient que chaque Plugin et canal enregistré respecte son
contrat d’interface. Ils itèrent sur tous les Plugins découverts et exécutent une suite
d’assertions de forme et de comportement. La voie unitaire par défaut `pnpm test`
ignore volontairement ces fichiers partagés de point d’extension et de smoke ; exécutez explicitement les commandes de contrat
lorsque vous modifiez des surfaces partagées de canal ou de fournisseur.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canal uniquement : `pnpm test:contracts:channels`
- Contrats de fournisseur uniquement : `pnpm test:contracts:plugins`

### Contrats de canal

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - Forme de base du Plugin (id, nom, capacités)
- **setup** - Contrat de l’assistant de configuration
- **session-binding** - Comportement de liaison de session
- **outbound-payload** - Structure de charge utile de message
- **inbound** - Gestion des messages entrants
- **actions** - Gestionnaires d’actions de canal
- **threading** - Gestion des identifiants de fil
- **directory** - API d’annuaire/liste
- **group-policy** - Application de la politique de groupe

### Contrats de statut des fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondes de statut des canaux
- **registry** - Forme du registre de Plugins

### Contrats de fournisseur

Situés dans `src/plugins/contracts/*.contract.test.ts` :

- **auth** - Contrat du flux d’authentification
- **auth-choice** - Choix/sélection d’authentification
- **catalog** - API du catalogue de modèles
- **discovery** - Découverte de Plugin
- **loader** - Chargement de Plugin
- **runtime** - Exécution du fournisseur
- **shape** - Forme/interface du Plugin
- **wizard** - Assistant de configuration

### Quand les exécuter

- Après modification des exports ou sous-chemins du SDK Plugin
- Après ajout ou modification d’un Plugin de canal ou de fournisseur
- Après refactorisation de l’enregistrement ou de la découverte des Plugins

Les tests de contrat s’exécutent en CI et ne nécessitent pas de vraies clés API.

## Ajouter des régressions (conseils)

Lorsque vous corrigez un problème de fournisseur/modèle découvert en live :

- Ajoutez si possible une régression sûre pour la CI (fournisseur simulé/factice, ou capture de la transformation exacte de forme de requête)
- Si le problème est intrinsèquement live uniquement (limites de débit, politiques d’authentification), gardez le test live étroit et opt-in via des variables d’environnement
- Préférez cibler la plus petite couche qui capture le bug :
  - bug de conversion/rejeu de requête fournisseur → test direct de modèles
  - bug de pipeline gateway session/historique/outil → smoke gateway live ou test gateway simulé sûr pour la CI
- Garde-fou de traversée SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillon par classe SecretRef à partir des métadonnées du registre (`listSecretTargetRegistryEntries()`), puis vérifie que les identifiants exec par segment de traversée sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue volontairement sur les identifiants de cible non classés afin que de nouvelles classes ne puissent pas être ignorées silencieusement.

## Voir aussi

- [Tests live](/fr/help/testing-live)
- [CI](/fr/ci)
