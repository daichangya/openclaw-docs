---
read_when:
    - Étendre qa-lab ou qa-channel
    - Ajout de scénarios QA adossés au dépôt
    - Création d’une automatisation QA plus réaliste autour du tableau de bord Gateway
summary: Structure de l’automatisation QA privée pour qa-lab, qa-channel, scénarios initialisés et rapports de protocole
title: Automatisation QA E2E
x-i18n:
    generated_at: "2026-04-23T13:59:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967a74d2e70b042e9443c5ec954902b820d2e5a22cbecd9be74af13b9085553
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automatisation QA E2E

La pile QA privée est conçue pour exercer OpenClaw d’une manière plus réaliste,
calquée sur les canaux, qu’un simple test unitaire ne peut le faire.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces de MP, de canal, de fil,
  de réaction, de modification et de suppression.
- `extensions/qa-lab` : interface de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `qa/` : ressources initialisées adossées au dépôt pour la tâche de lancement et les
  scénarios QA de référence.

Le flux opérateur QA actuel est un site QA à deux volets :

- Gauche : tableau de bord Gateway (UI de contrôle) avec l’agent.
- Droite : QA Lab, affichant la transcription de type Slack et le plan du scénario.

Lancez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie Gateway adossée à Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut confier à l’agent une
mission QA, observer le comportement réel du canal et consigner ce qui a fonctionné, échoué
ou est resté bloqué.

Pour une itération plus rapide sur l’UI de QA Lab sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un bundle QA Lab monté par liaison :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` conserve les services Docker sur une image préconstruite et monte par liaison
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
reconstruit ce bundle lors des changements, et le navigateur se recharge automatiquement lorsque le hachage des ressources QA Lab change.

Pour une voie smoke Matrix en transport réel, exécutez :

```bash
pnpm openclaw qa matrix
```

Cette voie provisionne un homeserver Tuwunel jetable dans Docker, enregistre des
utilisateurs temporaires driver, SUT et observateur, crée un salon privé, puis exécute
le vrai Plugin Matrix dans un enfant Gateway QA. La voie de transport actif garde
la configuration enfant limitée au transport testé, afin que Matrix s’exécute sans
`qa-channel` dans la configuration enfant. Elle écrit les artefacts de rapport structurés et
un journal combiné stdout/stderr dans le répertoire de sortie Matrix QA sélectionné. Pour
capturer aussi la sortie de construction/lancement externe de `scripts/run-node.mjs`,
définissez `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` vers un fichier journal local au dépôt.

Pour une voie smoke Telegram en transport réel, exécutez :

```bash
pnpm openclaw qa telegram
```

Cette voie cible un vrai groupe privé Telegram au lieu de provisionner un serveur
jetable. Elle nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, ainsi que deux bots distincts dans le même
groupe privé. Le bot SUT doit avoir un nom d’utilisateur Telegram, et l’observation
bot à bot fonctionne au mieux lorsque les deux bots ont le mode de communication bot à bot
activé dans `@BotFather`.
La commande se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez des artefacts sans code de sortie en échec.
Le rapport et le résumé Telegram incluent le RTT par réponse, de la requête
d’envoi du message driver jusqu’à la réponse SUT observée, à partir du canari.

Les voies de transport actif partagent désormais un contrat plus petit au lieu que chacune invente
sa propre forme de liste de scénarios :

`qa-channel` reste la suite synthétique large de comportement produit et ne fait pas partie
de la matrice de couverture des transports actifs.

| Voie     | Canari | Filtrage des mentions | Blocage par liste d’autorisation | Réponse de premier niveau | Reprise après redémarrage | Suivi de fil | Isolation du fil | Observation des réactions | Commande d’aide |
| -------- | ------ | --------------------- | -------------------------------- | ------------------------- | ------------------------- | ------------ | ---------------- | ------------------------- | --------------- |
| Matrix   | x      | x                     | x                                | x                         | x                         | x            | x                | x                         |                 |
| Telegram | x      |                       |                                  |                           |                           |              |                  |                           | x               |

Cela conserve `qa-channel` comme suite large de comportement produit tandis que Matrix,
Telegram et les futurs transports actifs partagent une liste explicite unique de vérification de contrat de transport.

Pour une voie VM Linux jetable sans introduire Docker dans le chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un nouvel invité Multipass, installe les dépendances, construit OpenClaw
dans l’invité, exécute `qa suite`, puis copie le rapport QA normal et le résumé
dans `.artifacts/qa-e2e/...` sur l’hôte.
Cela réutilise le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
Les exécutions de suite hôte et Multipass exécutent par défaut plusieurs scénarios sélectionnés en parallèle
avec des workers Gateway isolés. `qa-channel` utilise par défaut une simultanéité de
4, plafonnée par le nombre de scénarios sélectionnés. Utilisez `--concurrency <count>` pour ajuster
le nombre de workers, ou `--concurrency 1` pour une exécution en série.
La commande se termine avec un code non nul lorsqu’un scénario échoue. Utilisez `--allow-failures` lorsque
vous voulez des artefacts sans code de sortie en échec.
Les exécutions actives transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour
l’invité : clés de fournisseur basées sur l’environnement, chemin de configuration du fournisseur actif QA, et
`CODEX_HOME` lorsqu’il est présent. Gardez `--output-dir` sous la racine du dépôt afin que l’invité
puisse écrire en retour via l’espace de travail monté.

## Ressources initialisées adossées au dépôt

Les ressources initialisées se trouvent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Elles sont volontairement dans git afin que le plan QA soit visible à la fois pour les humains et pour l’agent.

`qa-lab` doit rester un exécuteur Markdown générique. Chaque fichier Markdown de scénario est
la source de vérité pour une exécution de test et doit définir :

- les métadonnées du scénario
- des métadonnées facultatives de catégorie, de capacité, de voie et de risque
- des références de documentation et de code
- des exigences facultatives de Plugin
- un correctif facultatif de configuration Gateway
- le `qa-flow` exécutable

La surface de runtime réutilisable qui sous-tend `qa-flow` peut rester générique
et transversale. Par exemple, les scénarios Markdown peuvent combiner des
assistants côté transport avec des assistants côté navigateur qui pilotent l’UI de contrôle intégrée via la
jointure Gateway `browser.request` sans ajouter d’exécuteur avec cas particulier.

Les fichiers de scénario doivent être regroupés par capacité produit plutôt que par dossier
de l’arborescence source. Gardez les ID de scénario stables lorsque les fichiers sont déplacés ; utilisez
`docsRefs` et `codeRefs` pour la traçabilité d’implémentation.

La liste de référence doit rester suffisamment large pour couvrir :

- les MP et le chat de canal
- le comportement des fils
- le cycle de vie des actions sur les messages
- les rappels cron
- le rappel mémoire
- le changement de modèle
- le transfert à un sous-agent
- la lecture du dépôt et de la documentation
- une petite tâche de build comme Lobster Invaders

## Voies mock de fournisseur

`qa suite` a deux voies mock locales de fournisseur :

- `mock-openai` est le mock OpenClaw sensible aux scénarios. Il reste la
  voie mock déterministe par défaut pour la QA adossée au dépôt et les barrières de parité.
- `aimock` démarre un serveur fournisseur adossé à AIMock pour une couverture expérimentale de protocole,
  de fixtures, d’enregistrement/relecture et de chaos. Il est additif et ne remplace pas
  le répartiteur de scénarios `mock-openai`.

L’implémentation des voies de fournisseur se trouve sous `extensions/qa-lab/src/providers/`.
Chaque fournisseur possède ses valeurs par défaut, le démarrage de serveur local, la configuration
du modèle Gateway, les besoins de préparation de profil d’authentification, et les indicateurs de capacité actif/mock. Le code partagé de suite et de gateway doit passer par le registre des fournisseurs au lieu
de brancher sur les noms de fournisseurs.

## Adaptateurs de transport

`qa-lab` possède une jointure de transport générique pour les scénarios QA Markdown.
`qa-channel` est le premier adaptateur sur cette jointure, mais l’objectif de conception est plus large :
de futurs canaux réels ou synthétiques doivent se brancher sur le même exécuteur de suite au lieu d’ajouter
un exécuteur QA spécifique au transport.

Au niveau de l’architecture, la répartition est la suivante :

- `qa-lab` gère l’exécution générique des scénarios, la simultanéité des workers, l’écriture des artefacts et le reporting.
- l’adaptateur de transport gère la configuration Gateway, l’état de préparation, l’observation entrante et sortante, les actions de transport et l’état de transport normalisé.
- les fichiers de scénarios Markdown sous `qa/scenarios/` définissent l’exécution de test ; `qa-lab` fournit la surface de runtime réutilisable qui les exécute.

Les consignes d’adoption destinées aux mainteneurs pour les nouveaux adaptateurs de canal se trouvent dans
[Testing](/fr/help/testing#adding-a-channel-to-qa).

## Reporting

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie observée du bus.
Le rapport doit répondre à :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Quels scénarios de suivi valent la peine d’être ajoutés

Pour les vérifications de caractère et de style, exécutez le même scénario sur plusieurs références de modèles actives
et écrivez un rapport Markdown évalué :

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

La commande exécute des processus enfants Gateway QA locaux, pas Docker. Les scénarios d’évaluation du caractère
doivent définir la persona via `SOUL.md`, puis exécuter des tours utilisateur ordinaires
comme le chat, l’aide sur l’espace de travail et de petites tâches sur des fichiers. Le modèle candidat
ne doit pas être informé qu’il est en cours d’évaluation. La commande conserve chaque transcription
complète, enregistre les statistiques de base d’exécution, puis demande aux modèles juges en mode rapide avec
un raisonnement `xhigh` de classer les exécutions selon le naturel, l’ambiance et l’humour.
Utilisez `--blind-judge-models` lors de la comparaison de fournisseurs : le prompt du juge reçoit toujours
chaque transcription et chaque état d’exécution, mais les références candidates sont remplacées par des
étiquettes neutres comme `candidate-01` ; le rapport remappe les classements vers les vraies références après
analyse.
Les exécutions candidates utilisent par défaut le niveau de réflexion `high`, avec `xhigh` pour les modèles OpenAI qui
le prennent en charge. Remplacez un candidat spécifique en ligne avec
`--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours une
valeur de repli globale, et l’ancienne forme `--model-thinking <provider/model=level>` est
conservée pour compatibilité.
Les références candidates OpenAI utilisent par défaut le mode rapide afin que le traitement prioritaire soit utilisé lorsque
le fournisseur le prend en charge. Ajoutez `,fast`, `,no-fast` ou `,fast=false` en ligne lorsqu’un
candidat ou juge unique nécessite un remplacement. Passez `--fast` uniquement lorsque vous voulez
forcer le mode rapide pour tous les modèles candidats. Les durées des candidats et des juges sont
enregistrées dans le rapport pour l’analyse comparative, mais les prompts des juges indiquent explicitement
de ne pas classer selon la vitesse.
Les exécutions des modèles candidats et juges utilisent toutes deux par défaut une simultanéité de 16. Réduisez
`--concurrency` ou `--judge-concurrency` lorsque les limites du fournisseur ou la pression du gateway local rendent une exécution trop bruyante.
Quand aucun `--model` candidat n’est passé, l’évaluation du caractère utilise par défaut
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est passé.
Quand aucun `--judge-model` n’est passé, les juges utilisent par défaut
`openai/gpt-5.4,thinking=xhigh,fast` et
`anthropic/claude-opus-4-6,thinking=high`.

## Documentation associée

- [Testing](/fr/help/testing)
- [QA Channel](/fr/channels/qa-channel)
- [Dashboard](/fr/web/dashboard)
