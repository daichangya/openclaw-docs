---
read_when:
    - Étendre qa-lab ou qa-channel
    - Ajouter des scénarios QA adossés au dépôt
    - Construire une automatisation QA plus réaliste autour du tableau de bord Gateway
summary: Structure d’automatisation QA privée pour qa-lab, qa-channel, scénarios initialisés et rapports de protocole
title: Automatisation QA E2E
x-i18n:
    generated_at: "2026-04-24T07:07:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbde51169a1572dc6753ab550ca29ca98abb2394e8991a8482bd7b66ea80ce76
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

La pile QA privée est conçue pour exercer OpenClaw d’une manière plus réaliste,
avec une forme de canal, qu’un simple test unitaire ne peut le faire.

Composants actuels :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces DM, canal, fil,
  réaction, modification et suppression.
- `extensions/qa-lab` : interface de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `qa/` : ressources d’initialisation adossées au dépôt pour la tâche de démarrage et les scénarios QA
  de base.

Le flux opérateur QA actuel est un site QA à deux volets :

- Gauche : tableau de bord Gateway (Control UI) avec l’agent.
- Droite : QA Lab, affichant la transcription de type Slack et le plan de scénario.

Exécutez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie gateway adossée à Docker, et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut donner à l’agent une
mission QA, observer le comportement réel du canal, et consigner ce qui a fonctionné, échoué ou
est resté bloqué.

Pour itérer plus rapidement sur l’interface QA Lab sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un bundle QA Lab monté par bind mount :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` garde les services Docker sur une image préconstruite et monte par bind
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
reconstruit ce bundle à chaque modification, et le navigateur se recharge automatiquement lorsque le hash des ressources QA Lab change.

Pour une voie de smoke Matrix en transport réel, exécutez :

```bash
pnpm openclaw qa matrix
```

Cette voie provisionne un homeserver Tuwunel jetable dans Docker, enregistre
des utilisateurs temporaires driver, SUT et observer, crée une salle privée, puis exécute
le véritable Plugin Matrix dans un enfant QA gateway. La voie de transport en direct garde
la configuration enfant limitée au transport testé, de sorte que Matrix s’exécute sans
`qa-channel` dans la configuration enfant. Elle écrit les artefacts de rapport structurés et
un journal combiné stdout/stderr dans le répertoire de sortie Matrix QA sélectionné. Pour
capturer aussi la sortie externe de build/lanceur `scripts/run-node.mjs`,
définissez `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` vers un fichier journal local au dépôt.

Pour une voie de smoke Telegram en transport réel, exécutez :

```bash
pnpm openclaw qa telegram
```

Cette voie cible un vrai groupe privé Telegram au lieu de provisionner un
serveur jetable. Elle exige `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, et
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, ainsi que deux bots distincts dans le même
groupe privé. Le bot SUT doit avoir un nom d’utilisateur Telegram, et l’observation bot-à-bot fonctionne au mieux lorsque les deux bots ont le mode Bot-to-Bot Communication
activé dans `@BotFather`.
La commande se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez des artefacts sans code de sortie en échec.
Le rapport et le résumé Telegram incluent le RTT par réponse, depuis la requête d’envoi
du message du driver jusqu’à la réponse observée du SUT, à partir du canari.

Pour une voie de smoke Discord en transport réel, exécutez :

```bash
pnpm openclaw qa discord
```

Cette voie cible un vrai canal privé de guilde Discord avec deux bots : un
bot driver contrôlé par le harnais et un bot SUT démarré par le gateway
OpenClaw enfant via le Plugin Discord intégré. Elle exige
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`,
et `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` lors de l’utilisation d’identifiants via l’environnement.
La voie vérifie la gestion des mentions de canal et contrôle que le bot SUT a
enregistré la commande native `/help` auprès de Discord.
La commande se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez des artefacts sans code de sortie en échec.

Les voies de transport en direct partagent désormais un contrat plus petit au lieu que chacune invente
sa propre forme de liste de scénarios :

`qa-channel` reste la suite synthétique large du comportement produit et ne fait pas partie
de la matrice de couverture des transports en direct.

| Voie     | Canari | Déclenchement par mention | Blocage par liste blanche | Réponse de niveau supérieur | Reprise après redémarrage | Suivi de fil | Isolation de fil | Observation de réaction | Commande help | Enregistrement de commande native |
| -------- | ------ | ------------------------- | ------------------------- | --------------------------- | ------------------------- | ------------ | ---------------- | ----------------------- | ------------- | --------------------------------- |
| Matrix   | x      | x                         | x                         | x                           | x                         | x            | x                | x                       |               |                                   |
| Telegram | x      | x                         |                           |                             |                           |              |                  |                         | x             |                                   |
| Discord  | x      | x                         |                           |                             |                           |              |                  |                         |               | x                                 |

Cela conserve `qa-channel` comme suite large de comportement produit tandis que Matrix,
Telegram et les futurs transports en direct partagent une checklist explicite unique de contrat de transport.

Pour une voie de VM Linux jetable sans intégrer Docker dans le chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un invité Multipass vierge, installe les dépendances, construit OpenClaw
dans l’invité, exécute `qa suite`, puis copie le rapport et le résumé QA normaux
dans `.artifacts/qa-e2e/...` sur l’hôte.
Cette commande réutilise le même comportement de sélection de scénario que `qa suite` sur l’hôte.
Les exécutions de suite sur l’hôte et dans Multipass exécutent par défaut plusieurs scénarios sélectionnés en parallèle
avec des workers gateway isolés. `qa-channel` utilise par défaut une concurrence de
4, plafonnée par le nombre de scénarios sélectionnés. Utilisez `--concurrency <count>` pour ajuster
le nombre de workers, ou `--concurrency 1` pour une exécution sérielle.
La commande se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez des artefacts sans code de sortie en échec.
Les exécutions en direct transfèrent les entrées d’authentification QA prises en charge qui sont pratiques pour
l’invité : clés de fournisseur via l’environnement, chemin de configuration du fournisseur QA live, et
`CODEX_HOME` lorsqu’il est présent. Gardez `--output-dir` sous la racine du dépôt afin que l’invité
puisse réécrire via l’espace de travail monté.

## Initialisations adossées au dépôt

Les ressources d’initialisation se trouvent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Elles sont intentionnellement dans git afin que le plan QA soit visible à la fois pour les humains et pour
l’agent.

`qa-lab` doit rester un exécuteur Markdown générique. Chaque fichier Markdown de scénario est
la source de vérité pour une exécution de test et doit définir :

- métadonnées du scénario
- métadonnées facultatives de catégorie, capacité, voie et risque
- références de documentation et de code
- exigences facultatives de Plugin
- patch de configuration gateway facultatif
- le `qa-flow` exécutable

La surface d’exécution réutilisable qui soutient `qa-flow` peut rester générique
et transversale. Par exemple, les scénarios Markdown peuvent combiner des helpers côté transport
avec des helpers côté navigateur qui pilotent la Control UI embarquée via la
couche Gateway `browser.request` sans ajouter d’exécuteur à cas particulier.

Les fichiers de scénario doivent être regroupés par capacité produit plutôt que par dossier
de l’arborescence source. Gardez les ID de scénario stables lorsque les fichiers bougent ; utilisez `docsRefs` et `codeRefs`
pour la traçabilité d’implémentation.

La liste de base doit rester suffisamment large pour couvrir :

- chat DM et canal
- comportement des fils
- cycle de vie des actions de message
- rappels Cron
- rappel mémoire
- changement de modèle
- transfert à un sous-agent
- lecture du dépôt et de la documentation
- une petite tâche de build telle que Lobster Invaders

## Voies mock de fournisseur

`qa suite` possède deux voies locales mock de fournisseur :

- `mock-openai` est le mock OpenClaw sensible aux scénarios. Elle reste la
  voie mock déterministe par défaut pour la QA adossée au dépôt et les barrières de parité.
- `aimock` démarre un serveur fournisseur adossé à AIMock pour une couverture expérimentale de protocole,
  de fixtures, d’enregistrement/relecture et de chaos. Elle est additive et ne
  remplace pas le répartiteur de scénarios `mock-openai`.

L’implémentation des voies fournisseur se trouve sous `extensions/qa-lab/src/providers/`.
Chaque fournisseur possède ses valeurs par défaut, le démarrage de serveur local, la configuration
du modèle gateway, les besoins de préparation de profil d’authentification, et les indicateurs de capacité live/mock. Le code partagé de suite et du gateway doit passer par le registre
des fournisseurs au lieu de brancher sur des noms de fournisseurs.

## Adaptateurs de transport

`qa-lab` possède une couche de transport générique pour les scénarios QA Markdown.
`qa-channel` est le premier adaptateur sur cette couche, mais l’objectif de conception est plus large :
de futurs canaux réels ou synthétiques doivent se brancher sur le même exécuteur de suite
au lieu d’ajouter un exécuteur QA spécifique au transport.

Au niveau architecture, la séparation est :

- `qa-lab` possède l’exécution générique des scénarios, la concurrence des workers, l’écriture des artefacts et les rapports.
- l’adaptateur de transport possède la configuration gateway, la préparation, l’observation entrante et sortante, les actions de transport et l’état de transport normalisé.
- les fichiers de scénario Markdown sous `qa/scenarios/` définissent l’exécution de test ; `qa-lab` fournit la surface d’exécution réutilisable qui les exécute.

Les conseils d’adoption destinés aux mainteneurs pour les nouveaux adaptateurs de canal se trouvent dans
[Testing](/fr/help/testing#adding-a-channel-to-qa).

## Rapports

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie observée du bus.
Le rapport doit répondre à :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Quels scénarios de suivi méritent d’être ajoutés

Pour les vérifications de caractère et de style, exécutez le même scénario sur plusieurs références de modèle live
et écrivez un rapport Markdown évalué :

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

La commande exécute des processus enfants locaux du gateway QA, pas Docker. Les
scénarios d’évaluation de caractère doivent définir le persona via `SOUL.md`, puis exécuter des tours utilisateur ordinaires
tels que chat, aide sur l’espace de travail et petites tâches sur fichiers. Le modèle candidat ne doit
pas être informé qu’il est évalué. La commande préserve chaque transcription complète,
enregistre des statistiques d’exécution de base, puis demande aux modèles juges en mode rapide avec
un raisonnement `xhigh` lorsque pris en charge de classer les exécutions par naturel, ambiance et humour.
Utilisez `--blind-judge-models` lors de la comparaison de fournisseurs : le prompt du juge reçoit toujours
chaque transcription et statut d’exécution, mais les références candidates sont remplacées par des étiquettes neutres
telles que `candidate-01` ; le rapport remappe les classements vers les références réelles après analyse.
Les exécutions candidates utilisent par défaut un niveau de réflexion `high`, avec `medium` pour GPT-5.4 et `xhigh`
pour les anciennes références d’évaluation OpenAI qui le prennent en charge. Remplacez une candidate spécifique en ligne avec
`--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours un repli global, et l’ancienne forme `--model-thinking <provider/model=level>` est
conservée pour compatibilité.
Les références candidates OpenAI utilisent par défaut le mode rapide afin que le traitement prioritaire soit utilisé lorsque
le fournisseur le prend en charge. Ajoutez `,fast`, `,no-fast` ou `,fast=false` en ligne lorsqu’une
candidate ou un juge particulier a besoin d’un remplacement. Passez `--fast` uniquement lorsque vous voulez
forcer le mode rapide pour tous les modèles candidats. Les durées des candidates et des juges sont
enregistrées dans le rapport pour l’analyse comparative, mais les prompts de juge indiquent explicitement
de ne pas classer selon la vitesse.
Les exécutions des modèles candidats et juges utilisent toutes deux par défaut une concurrence de 16. Réduisez
`--concurrency` ou `--judge-concurrency` lorsque les limites du fournisseur ou la charge du gateway local
rendent une exécution trop bruitée.
Lorsqu’aucun `--model` candidat n’est passé, l’évaluation de caractère utilise par défaut
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est passé.
Lorsqu’aucun `--judge-model` n’est passé, les juges utilisent par défaut
`openai/gpt-5.4,thinking=xhigh,fast` et
`anthropic/claude-opus-4-6,thinking=high`.

## Documentation liée

- [Testing](/fr/help/testing)
- [Canal QA](/fr/channels/qa-channel)
- [Tableau de bord](/fr/web/dashboard)
