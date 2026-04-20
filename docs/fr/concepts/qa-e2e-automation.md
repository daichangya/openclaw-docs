---
read_when:
    - Extension de qa-lab ou qa-channel
    - Ajout de scénarios QA adossés au dépôt
    - Création d’une automatisation QA plus réaliste autour du tableau de bord Gateway
summary: Forme de l’automatisation QA privée pour qa-lab, qa-channel, les scénarios initialisés et les rapports de protocole
title: Automatisation QA E2E
x-i18n:
    generated_at: "2026-04-20T07:05:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34245ce871356caeab0d9e0eeeaa9fb4e408920a4a97ad27567fa365d8db17c7
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automatisation QA E2E

La pile QA privée est conçue pour exercer OpenClaw d’une manière plus réaliste,
calquée sur les canaux, qu’un simple test unitaire ne peut le faire.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétique avec des surfaces pour les DM, canaux, fils,
  réactions, modifications et suppressions.
- `extensions/qa-lab` : interface de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `qa/` : ressources d’initialisation adossées au dépôt pour la tâche de démarrage et les
  scénarios QA de base.

Le flux opérateur QA actuel est un site QA en deux panneaux :

- Gauche : tableau de bord Gateway (Control UI) avec l’agent.
- Droite : QA Lab, affichant la transcription de type Slack et le plan du scénario.

Exécutez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie Gateway adossée à Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut confier à l’agent une mission QA,
observer le comportement réel du canal et consigner ce qui a fonctionné, échoué ou
est resté bloqué.

Pour une itération plus rapide sur l’interface QA Lab sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un bundle QA Lab monté par liaison :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` conserve les services Docker sur une image préconstruite et monte par liaison
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
reconstruit ce bundle à chaque modification, et le navigateur se recharge automatiquement lorsque le hachage
des ressources QA Lab change.

Pour une voie de smoke test Matrix sur transport réel, exécutez :

```bash
pnpm openclaw qa matrix
```

Cette voie provisionne un homeserver Tuwunel jetable dans Docker, enregistre des
utilisateurs temporaires driver, SUT et observateur, crée un salon privé, puis exécute
le véritable Plugin Matrix dans un enfant Gateway QA. La voie de transport réel garde
la configuration enfant limitée au transport testé, afin que Matrix fonctionne sans
`qa-channel` dans la configuration enfant. Elle écrit les artefacts de rapport structurés et
un journal combiné stdout/stderr dans le répertoire de sortie Matrix QA sélectionné. Pour
capturer également la sortie de build/lancement externe de `scripts/run-node.mjs`, définissez
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` vers un fichier journal local au dépôt.

Pour une voie de smoke test Telegram sur transport réel, exécutez :

```bash
pnpm openclaw qa telegram
```

Cette voie cible un véritable groupe privé Telegram au lieu de provisionner un serveur
jetable. Elle nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, ainsi que deux bots distincts dans le même
groupe privé. Le bot SUT doit avoir un nom d’utilisateur Telegram, et l’observation
bot à bot fonctionne mieux lorsque les deux bots ont le mode Bot-to-Bot Communication
activé dans `@BotFather`.
La commande se termine avec un code de sortie non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez les artefacts sans code de sortie en échec.

Les voies de transport réel partagent désormais un contrat plus réduit au lieu d’inventer
chacune leur propre forme de liste de scénarios :

`qa-channel` reste la suite large de comportements produit synthétiques et ne fait pas partie
de la matrice de couverture des transports réels.

| Voie     | Canary | Contrôle des mentions | Blocage par liste d’autorisation | Réponse de premier niveau | Reprise après redémarrage | Suivi dans un fil | Isolation des fils | Observation des réactions | Commande d’aide |
| -------- | ------ | --------------------- | -------------------------------- | ------------------------- | ------------------------- | ----------------- | ------------------ | ------------------------- | --------------- |
| Matrix   | x      | x                     | x                                | x                         | x                         | x                 | x                  | x                         |                 |
| Telegram | x      |                       |                                  |                           |                           |                   |                    |                           | x               |

Cela permet de conserver `qa-channel` comme la suite large de comportements produit, tandis que Matrix,
Telegram et les futurs transports réels partagent une liste de contrôle explicite de contrat de transport.

Pour une voie VM Linux jetable sans faire entrer Docker dans le chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un nouvel invité Multipass, installe les dépendances, construit OpenClaw
dans l’invité, exécute `qa suite`, puis copie le rapport QA normal et le résumé dans
`.artifacts/qa-e2e/...` sur l’hôte.
Cela réutilise le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
Les exécutions de suite sur l’hôte et sous Multipass exécutent plusieurs scénarios sélectionnés en parallèle
avec des workers Gateway isolés par défaut. `qa-channel` utilise par défaut une concurrence de
4, plafonnée par le nombre de scénarios sélectionnés. Utilisez `--concurrency <count>` pour ajuster
le nombre de workers, ou `--concurrency 1` pour une exécution en série.
La commande se termine avec un code de sortie non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez les artefacts sans code de sortie en échec.
Les exécutions live transmettent les entrées d’auth QA prises en charge qui sont pratiques pour
l’invité : clés de fournisseur basées sur l’environnement, chemin de configuration du fournisseur live QA, et
`CODEX_HOME` lorsqu’il est présent. Conservez `--output-dir` sous la racine du dépôt afin que l’invité
puisse écrire en retour via l’espace de travail monté.

## Amorces adossées au dépôt

Les ressources d’initialisation se trouvent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Elles sont intentionnellement versionnées dans git afin que le plan QA soit visible à la fois pour les humains et pour
l’agent.

`qa-lab` doit rester un exécuteur Markdown générique. Chaque fichier Markdown de scénario est
la source de vérité pour une exécution de test et doit définir :

- les métadonnées du scénario
- des métadonnées facultatives de catégorie, capacité, voie et risque
- des références de documentation et de code
- des exigences facultatives de Plugin
- un correctif facultatif de configuration Gateway
- le `qa-flow` exécutable

La surface d’exécution réutilisable qui sous-tend `qa-flow` est autorisée à rester générique
et transversale. Par exemple, les scénarios Markdown peuvent combiner des
helpers côté transport avec des helpers côté navigateur qui pilotent la Control UI embarquée via la
surface Gateway `browser.request` sans ajouter d’exécuteur à cas particulier.

Les fichiers de scénario doivent être regroupés par capacité produit plutôt que par dossier
de l’arborescence source. Gardez les ID de scénario stables quand les fichiers changent d’emplacement ; utilisez `docsRefs` et `codeRefs`
pour la traçabilité d’implémentation.

La liste de base doit rester assez large pour couvrir :

- chat DM et canal
- comportement des fils
- cycle de vie des actions sur les messages
- rappels Cron
- rappel de mémoire
- changement de modèle
- transfert à un sous-agent
- lecture du dépôt et de la documentation
- une petite tâche de build comme Lobster Invaders

## Voies de mock de fournisseur

`qa suite` possède deux voies locales de mock de fournisseur :

- `mock-openai` est le mock OpenClaw sensible aux scénarios. Il reste la
  voie de mock déterministe par défaut pour la QA adossée au dépôt et les portes de parité.
- `aimock` démarre un serveur de fournisseur adossé à AIMock pour une couverture expérimentale du protocole,
  des fixtures, de l’enregistrement/relecture et du chaos. Il est additif et ne remplace pas
  le répartiteur de scénarios `mock-openai`.

L’implémentation des voies de fournisseur se trouve sous `extensions/qa-lab/src/providers/`.
Chaque fournisseur est propriétaire de ses valeurs par défaut, du démarrage du serveur local, de la configuration du modèle Gateway,
des besoins de préparation du profil d’authentification, et des indicateurs de capacité live/mock. Le code partagé
de suite et de Gateway doit passer par le registre des fournisseurs au lieu d’effectuer des branchements sur les noms de fournisseurs.

## Adaptateurs de transport

`qa-lab` possède une interface de transport générique pour les scénarios QA Markdown.
`qa-channel` est le premier adaptateur sur cette interface, mais l’objectif de conception est plus large :
les futurs canaux réels ou synthétiques doivent se brancher sur le même exécuteur de suite
au lieu d’ajouter un exécuteur QA spécifique au transport.

Au niveau de l’architecture, la répartition est la suivante :

- `qa-lab` est responsable de l’exécution générique des scénarios, de la concurrence des workers, de l’écriture des artefacts et du reporting.
- l’adaptateur de transport est responsable de la configuration Gateway, de la disponibilité, de l’observation entrante et sortante, des actions de transport et de l’état de transport normalisé.
- les fichiers de scénario Markdown sous `qa/scenarios/` définissent l’exécution du test ; `qa-lab` fournit la surface d’exécution réutilisable qui les exécute.

Les consignes d’adoption destinées aux mainteneurs pour les nouveaux adaptateurs de canal se trouvent dans
[Testing](/fr/help/testing#adding-a-channel-to-qa).

## Reporting

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie observée du bus.
Le rapport doit répondre à ces questions :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Quels scénarios de suivi valent la peine d’être ajoutés

Pour les vérifications de caractère et de style, exécutez le même scénario sur plusieurs références de modèles live
et rédigez un rapport Markdown évalué :

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
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

La commande exécute des processus enfants locaux QA Gateway, pas Docker. Les scénarios d’évaluation du caractère
doivent définir la persona via `SOUL.md`, puis exécuter des tours utilisateur ordinaires
comme du chat, de l’aide sur l’espace de travail et de petites tâches sur des fichiers. Le modèle candidat
ne doit pas être informé qu’il est en cours d’évaluation. La commande préserve chaque transcription complète,
enregistre des statistiques d’exécution de base, puis demande aux modèles juges en mode rapide avec
un raisonnement `xhigh` de classer les exécutions selon le naturel, l’ambiance et l’humour.
Utilisez `--blind-judge-models` lorsque vous comparez des fournisseurs : l’invite du juge reçoit toujours
chaque transcription et statut d’exécution, mais les références candidates sont remplacées par des
étiquettes neutres comme `candidate-01` ; le rapport remappe les classements vers les références réelles après
l’analyse.
Les exécutions candidates utilisent par défaut le niveau de réflexion `high`, avec `xhigh` pour les modèles OpenAI qui
le prennent en charge. Remplacez un candidat précis en ligne avec
`--model provider/model,thinking=<level>`. `--thinking <level>` continue de définir une
valeur de repli globale, et l’ancienne forme `--model-thinking <provider/model=level>` est
conservée pour compatibilité.
Les références candidates OpenAI utilisent par défaut le mode rapide afin d’employer le traitement prioritaire lorsque
le fournisseur le prend en charge. Ajoutez `,fast`, `,no-fast` ou `,fast=false` en ligne lorsqu’un
candidat ou juge particulier a besoin d’une dérogation. Passez `--fast` uniquement si vous souhaitez
forcer le mode rapide pour tous les modèles candidats. Les durées des candidats et des juges sont
enregistrées dans le rapport pour l’analyse comparative, mais les invites des juges indiquent explicitement de
ne pas classer selon la vitesse.
Les exécutions des modèles candidats et juges utilisent toutes deux par défaut une concurrence de 16. Réduisez
`--concurrency` ou `--judge-concurrency` lorsque les limites du fournisseur ou la pression sur la Gateway locale
rendent une exécution trop bruyante.
Lorsqu’aucun candidat `--model` n’est transmis, l’évaluation du caractère utilise par défaut
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est transmis.
Lorsqu’aucun `--judge-model` n’est transmis, les juges utilisent par défaut
`openai/gpt-5.4,thinking=xhigh,fast` et
`anthropic/claude-opus-4-6,thinking=high`.

## Documentation associée

- [Testing](/fr/help/testing)
- [QA Channel](/fr/channels/qa-channel)
- [Dashboard](/web/dashboard)
