---
read_when:
    - Étendre qa-lab ou qa-channel
    - Ajouter des scénarios QA soutenus par le dépôt
    - Créer une automatisation QA plus réaliste autour du tableau de bord Gateway
summary: Structure d’automatisation QA privée pour qa-lab, qa-channel, les scénarios préconfigurés et les rapports de protocole
title: Automatisation QA E2E
x-i18n:
    generated_at: "2026-04-25T18:18:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: be2cfc97a33519e0c4263dc7da356136b10ddcbeef436ab821e645688b6b2cfc
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

La pile QA privée vise à exercer OpenClaw d’une manière plus réaliste et plus proche de la forme des canaux qu’un simple test unitaire ne peut le faire.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces de MP, de canal, de fil, de réaction, de modification et de suppression.
- `extensions/qa-lab` : interface de débogage et bus QA pour observer la transcription, injecter des messages entrants et exporter un rapport Markdown.
- `qa/` : ressources d’amorçage soutenues par le dépôt pour la tâche de démarrage et les scénarios QA de base.

Le flux opérateur QA actuel repose sur un site QA à deux volets :

- Gauche : tableau de bord Gateway (interface de contrôle) avec l’agent.
- Droite : QA Lab, affichant la transcription de type Slack et le plan du scénario.

Exécutez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie Gateway soutenue par Docker et expose la page QA Lab où un opérateur ou une boucle d’automatisation peut donner à l’agent une mission QA, observer le comportement réel du canal et consigner ce qui a fonctionné, échoué ou est resté bloqué.

Pour des itérations plus rapides sur l’interface QA Lab sans reconstruire l’image Docker à chaque fois, démarrez la pile avec un bundle QA Lab monté par liaison :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` conserve les services Docker sur une image préconstruite et monte par liaison `extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch` reconstruit ce bundle à chaque modification, et le navigateur se recharge automatiquement lorsque le hachage de ressource QA Lab change.

Pour une voie smoke Matrix sur transport réel, exécutez :

```bash
pnpm openclaw qa matrix
```

Cette voie provisionne un homeserver Tuwunel jetable dans Docker, enregistre des utilisateurs temporaires driver, SUT et observateur, crée un salon privé, puis exécute le vrai Plugin Matrix à l’intérieur d’un enfant Gateway QA. La voie de transport en direct limite la configuration enfant au transport testé, de sorte que Matrix s’exécute sans `qa-channel` dans la configuration enfant. Elle écrit les artefacts de rapport structuré et un journal combiné stdout/stderr dans le répertoire de sortie Matrix QA sélectionné. Pour capturer également la sortie de build/lancement externe de `scripts/run-node.mjs`, définissez `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` vers un fichier journal local au dépôt.
La progression Matrix est affichée par défaut. `OPENCLAW_QA_MATRIX_TIMEOUT_MS` borne l’exécution complète, et `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` borne le nettoyage afin qu’un démontage Docker bloqué signale la commande exacte de récupération au lieu de rester suspendu.

Pour une voie smoke Telegram sur transport réel, exécutez :

```bash
pnpm openclaw qa telegram
```

Cette voie cible un vrai groupe privé Telegram au lieu de provisionner un serveur jetable. Elle nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, ainsi que deux bots distincts dans le même groupe privé. Le bot SUT doit avoir un nom d’utilisateur Telegram, et l’observation bot-à-bot fonctionne mieux lorsque les deux bots ont le Bot-to-Bot Communication Mode activé dans `@BotFather`.
La commande se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous voulez des artefacts sans code de sortie en échec.
Le rapport et le résumé Telegram incluent le RTT par réponse, depuis la requête d’envoi du message driver jusqu’à la réponse SUT observée, à commencer par le canari.

Avant d’utiliser des identifiants en direct mutualisés, exécutez :

```bash
pnpm openclaw qa credentials doctor
```

Le diagnostic vérifie l’environnement du broker Convex, valide les paramètres du point de terminaison et vérifie l’accessibilité admin/list lorsque le secret mainteneur est présent. Il ne signale pour les secrets que l’état défini/manquant.

Pour une voie smoke Discord sur transport réel, exécutez :

```bash
pnpm openclaw qa discord
```

Cette voie cible un vrai canal de guilde Discord privé avec deux bots : un bot driver contrôlé par le harnais et un bot SUT démarré par la Gateway enfant OpenClaw via le Plugin Discord intégré. Elle nécessite `OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`, `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN` et `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` lors de l’utilisation d’identifiants d’environnement.
La voie vérifie la gestion des mentions dans le canal et contrôle que le bot SUT a bien enregistré la commande native `/help` auprès de Discord.
La commande se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous voulez des artefacts sans code de sortie en échec.

Les voies de transport en direct partagent désormais un contrat plus réduit au lieu que chacune invente sa propre forme de liste de scénarios.

`qa-channel` reste la suite synthétique large de comportement produit et ne fait pas partie de la matrice de couverture des transports en direct.

| Voie     | Canari | Filtrage par mention | Blocage par liste d’autorisation | Réponse de premier niveau | Reprise après redémarrage | Suivi dans le fil | Isolation du fil | Observation des réactions | Commande d’aide | Enregistrement de commande native |
| -------- | ------ | -------------------- | -------------------------------- | ------------------------- | ------------------------- | ----------------- | ---------------- | ------------------------- | ---------------- | --------------------------------- |
| Matrix   | x      | x                    | x                                | x                         | x                         | x                 | x                | x                         |                  |                                   |
| Telegram | x      | x                    |                                  |                           |                           |                   |                  |                           | x                |                                   |
| Discord  | x      | x                    |                                  |                           |                           |                   |                  |                           |                  | x                                 |

Cela permet à `qa-channel` de rester la suite large de comportement produit tandis que Matrix, Telegram et les futurs transports en direct partagent une checklist explicite unique de contrat de transport.

Pour une voie de VM Linux jetable sans faire intervenir Docker dans le chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un invité Multipass neuf, installe les dépendances, construit OpenClaw à l’intérieur de l’invité, exécute `qa suite`, puis recopie le rapport et le résumé QA habituels dans `.artifacts/qa-e2e/...` sur l’hôte.
Cela réutilise le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
Les exécutions de suite sur l’hôte et dans Multipass exécutent en parallèle plusieurs scénarios sélectionnés avec des workers Gateway isolés par défaut. `qa-channel` utilise par défaut une concurrence de 4, plafonnée par le nombre de scénarios sélectionnés. Utilisez `--concurrency <count>` pour ajuster le nombre de workers, ou `--concurrency 1` pour une exécution en série.
La commande se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque vous voulez des artefacts sans code de sortie en échec.
Les exécutions en direct transfèrent les entrées d’authentification QA prises en charge qui sont pratiques pour l’invité : clés de fournisseur basées sur l’environnement, chemin de configuration du fournisseur QA en direct, et `CODEX_HOME` lorsqu’il est présent. Conservez `--output-dir` sous la racine du dépôt afin que l’invité puisse réécrire via l’espace de travail monté.

## Ressources d’amorçage soutenues par le dépôt

Les ressources d’amorçage vivent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Elles sont intentionnellement dans git afin que le plan QA soit visible à la fois pour les humains et pour l’agent.

`qa-lab` doit rester un exécuteur Markdown générique. Chaque fichier Markdown de scénario est la source de vérité pour une exécution de test et doit définir :

- les métadonnées du scénario
- des métadonnées facultatives de catégorie, capacité, voie et risque
- des références de documentation et de code
- des exigences facultatives de Plugin
- un correctif de configuration Gateway facultatif
- le `qa-flow` exécutable

La surface d’exécution réutilisable qui soutient `qa-flow` peut rester générique et transversale. Par exemple, des scénarios Markdown peuvent combiner des assistants côté transport avec des assistants côté navigateur qui pilotent l’interface de contrôle embarquée via le point d’entrée Gateway `browser.request` sans ajouter d’exécuteur spécial.

Les fichiers de scénario doivent être regroupés par capacité produit plutôt que par dossier de l’arborescence source. Conservez des identifiants de scénario stables lorsque les fichiers changent d’emplacement ; utilisez `docsRefs` et `codeRefs` pour la traçabilité de l’implémentation.

La liste de base doit rester assez large pour couvrir :

- les conversations en MP et en canal
- le comportement des fils
- le cycle de vie des actions sur les messages
- les rappels Cron
- le rappel mémoire
- le changement de modèle
- le transfert vers un sous-agent
- la lecture du dépôt et de la documentation
- une petite tâche de build comme Lobster Invaders

## Voies mock de fournisseur

`qa suite` dispose de deux voies mock locales de fournisseur :

- `mock-openai` est le mock OpenClaw tenant compte des scénarios. Il reste la voie mock déterministe par défaut pour la QA soutenue par le dépôt et les portes de parité.
- `aimock` démarre un serveur de fournisseur soutenu par AIMock pour une couverture expérimentale de protocole, de fixtures, d’enregistrement/relecture et de chaos. Il est additif et ne remplace pas le répartiteur de scénarios `mock-openai`.

L’implémentation des voies de fournisseur se trouve sous `extensions/qa-lab/src/providers/`.
Chaque fournisseur possède ses propres valeurs par défaut, le démarrage du serveur local, la configuration de modèle Gateway, les besoins de préparation du profil d’authentification et les indicateurs de capacité live/mock. Le code partagé de la suite et de la Gateway doit passer par le registre des fournisseurs plutôt que bifurquer selon les noms des fournisseurs.

## Adaptateurs de transport

`qa-lab` possède un point d’entrée de transport générique pour les scénarios QA Markdown.
`qa-channel` est le premier adaptateur de ce point d’entrée, mais l’objectif de conception est plus large : les futurs canaux, réels ou synthétiques, doivent se brancher au même exécuteur de suite au lieu d’ajouter un exécuteur QA spécifique au transport.

Au niveau de l’architecture, la séparation est la suivante :

- `qa-lab` possède l’exécution générique des scénarios, la concurrence des workers, l’écriture des artefacts et le reporting.
- l’adaptateur de transport possède la configuration Gateway, l’état prêt, l’observation entrante et sortante, les actions de transport et l’état de transport normalisé.
- les fichiers de scénario Markdown sous `qa/scenarios/` définissent l’exécution de test ; `qa-lab` fournit la surface d’exécution réutilisable qui les exécute.

Les recommandations d’adoption destinées aux mainteneurs pour les nouveaux adaptateurs de canal figurent dans
[Testing](/fr/help/testing#adding-a-channel-to-qa).

## Reporting

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie observée du bus.
Le rapport doit répondre à :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Quels scénarios de suivi valent la peine d’être ajoutés

Pour les vérifications de caractère et de style, exécutez le même scénario sur plusieurs références de modèle en direct et écrivez un rapport Markdown évalué :

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

La commande exécute des processus enfants locaux de Gateway QA, pas Docker. Les scénarios d’évaluation de caractère doivent définir la persona via `SOUL.md`, puis exécuter des tours utilisateur ordinaires comme la discussion, l’aide sur l’espace de travail et de petites tâches sur des fichiers. Le modèle candidat ne doit pas être informé qu’il est en cours d’évaluation. La commande préserve chaque transcription complète, enregistre des statistiques d’exécution de base, puis demande aux modèles juges en mode rapide avec un raisonnement `xhigh` lorsque pris en charge de classer les exécutions selon le naturel, l’ambiance et l’humour.
Utilisez `--blind-judge-models` lors de la comparaison de fournisseurs : le prompt du juge reçoit toujours chaque transcription et l’état d’exécution, mais les références des candidats sont remplacées par des libellés neutres comme `candidate-01` ; le rapport réassocie les classements aux vraies références après l’analyse.
Les exécutions candidates utilisent par défaut un niveau de réflexion `high`, avec `medium` pour GPT-5.5 et `xhigh` pour les anciennes références d’évaluation OpenAI qui le prennent en charge. Surchargez un candidat spécifique inline avec `--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours une valeur de repli globale, et l’ancienne forme `--model-thinking <provider/model=level>` est conservée pour compatibilité.
Les références candidates OpenAI utilisent par défaut le mode rapide afin que le traitement prioritaire soit employé lorsque le fournisseur le prend en charge. Ajoutez `,fast`, `,no-fast` ou `,fast=false` inline lorsqu’un seul candidat ou juge a besoin d’une surcharge. Passez `--fast` uniquement lorsque vous voulez forcer le mode rapide pour chaque modèle candidat. Les durées des candidats et des juges sont enregistrées dans le rapport pour l’analyse comparative, mais les prompts des juges indiquent explicitement de ne pas classer selon la vitesse.
Les exécutions des modèles candidats et juges utilisent toutes deux par défaut une concurrence de 16. Réduisez `--concurrency` ou `--judge-concurrency` lorsque les limites du fournisseur ou la pression sur la Gateway locale rendent une exécution trop bruyante.
Lorsqu’aucun `--model` candidat n’est transmis, l’évaluation de caractère utilise par défaut
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est transmis.
Lorsqu’aucun `--judge-model` n’est transmis, les juges utilisent par défaut
`openai/gpt-5.5,thinking=xhigh,fast` et
`anthropic/claude-opus-4-6,thinking=high`.

## Documentation liée

- [Testing](/fr/help/testing)
- [QA Channel](/fr/channels/qa-channel)
- [Tableau de bord](/fr/web/dashboard)
