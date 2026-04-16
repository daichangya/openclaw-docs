---
read_when:
    - Extension de qa-lab ou qa-channel
    - Ajout de scénarios QA adossés au dépôt
    - Création d’une automatisation QA plus réaliste autour du tableau de bord Gateway
summary: Forme de l’automatisation QA privée pour qa-lab, qa-channel, les scénarios initialisés et les rapports de protocole
title: Automatisation E2E de la QA
x-i18n:
    generated_at: "2026-04-16T21:51:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7deefda1c90a0d2e21e2155ffd8b585fb999e7416bdbaf0ff57eb33ccc063afc
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automatisation E2E de la QA

La pile QA privée est conçue pour tester OpenClaw d’une manière plus réaliste,
façonnée par les canaux, qu’un simple test unitaire ne peut le faire.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétique avec des surfaces pour les MP, les canaux, les fils,
  les réactions, les modifications et les suppressions.
- `extensions/qa-lab` : interface de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `qa/` : ressources de départ adossées au dépôt pour la tâche de lancement et les
  scénarios QA de référence.

Le flux opérateur QA actuel est un site QA à deux volets :

- Gauche : tableau de bord Gateway (Control UI) avec l’agent.
- Droite : QA Lab, affichant une transcription de type Slack et le plan du scénario.

Lancez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie Gateway adossée à Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut confier à l’agent une
mission QA, observer le comportement réel du canal et consigner ce qui a
fonctionné, échoué ou est resté bloqué.

Pour des itérations plus rapides sur l’interface QA Lab sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un bundle QA Lab monté par liaison :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` maintient les services Docker sur une image préconstruite et monte par liaison
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
reconstruit ce bundle à chaque modification, et le navigateur se recharge automatiquement lorsque le hachage
des ressources QA Lab change.

Pour une voie de validation Matrix avec transport réel, exécutez :

```bash
pnpm openclaw qa matrix
```

Cette voie provisionne un homeserver Tuwunel jetable dans Docker, enregistre
des utilisateurs temporaires pour le pilote, le SUT et l’observateur, crée une salle privée,
puis exécute le véritable plugin Matrix dans un enfant Gateway QA. La voie de transport en direct conserve
la configuration enfant limitée au transport testé, de sorte que Matrix s’exécute sans
`qa-channel` dans la configuration enfant. Elle écrit les artefacts de rapport structurés ainsi
qu’un journal combiné stdout/stderr dans le répertoire de sortie Matrix QA sélectionné. Pour
capturer également la sortie de construction/lancement externe de `scripts/run-node.mjs`, définissez
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` vers un fichier journal local au dépôt.

Pour une voie de validation Telegram avec transport réel, exécutez :

```bash
pnpm openclaw qa telegram
```

Cette voie cible un groupe Telegram privé réel au lieu de provisionner un
serveur jetable. Elle nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, ainsi que deux bots distincts dans le même
groupe privé. Le bot SUT doit avoir un nom d’utilisateur Telegram, et l’observation
bot-à-bot fonctionne mieux lorsque les deux bots ont le mode de communication bot-à-bot
activé dans `@BotFather`.

Les voies de transport en direct partagent désormais un contrat plus petit au lieu que chacune
invente sa propre forme de liste de scénarios.

`qa-channel` reste la suite large de comportements synthétiques du produit et ne fait pas partie
de la matrice de couverture des transports en direct.

| Voie     | Canary | Filtrage des mentions | Blocage par liste d’autorisation | Réponse de niveau supérieur | Reprise après redémarrage | Suivi dans un fil | Isolation des fils | Observation des réactions | Commande d’aide |
| -------- | ------ | --------------------- | -------------------------------- | --------------------------- | ------------------------- | ----------------- | ------------------ | ------------------------- | --------------- |
| Matrix   | x      | x                     | x                                | x                           | x                         | x                 | x                  | x                         |                 |
| Telegram | x      |                       |                                  |                             |                           |                   |                    |                           | x               |

Cela conserve `qa-channel` comme la suite large de comportements du produit, tandis que Matrix,
Telegram et les futurs transports en direct partagent une checklist explicite de contrat de transport.

Pour une voie sur VM Linux jetable sans intégrer Docker dans le parcours QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un invité Multipass neuf, installe les dépendances, construit OpenClaw
dans l’invité, exécute `qa suite`, puis copie le rapport QA normal et le
résumé dans `.artifacts/qa-e2e/...` sur l’hôte.
Elle réutilise le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
Les exécutions sur l’hôte et sur Multipass exécutent par défaut plusieurs scénarios sélectionnés en parallèle
avec des workers Gateway isolés, jusqu’à 64 workers ou au nombre de scénarios sélectionnés.
Utilisez `--concurrency <count>` pour ajuster le nombre de workers, ou
`--concurrency 1` pour une exécution en série.
Les exécutions en direct transmettent les entrées d’authentification QA prises en charge qui sont pratiques pour
l’invité : les clés de fournisseur basées sur l’environnement, le chemin de configuration du fournisseur QA live, et
`CODEX_HOME` lorsqu’il est présent. Gardez `--output-dir` sous la racine du dépôt afin que l’invité
puisse écrire en retour via l’espace de travail monté.

## Ressources de départ adossées au dépôt

Les ressources de départ se trouvent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Elles sont volontairement conservées dans git afin que le plan QA soit visible à la fois pour les humains et pour
l’agent.

`qa-lab` doit rester un exécuteur Markdown générique. Chaque fichier Markdown de scénario est
la source de vérité pour une exécution de test et doit définir :

- les métadonnées du scénario
- les références de documentation et de code
- les exigences de plugin facultatives
- le correctif de configuration Gateway facultatif
- le `qa-flow` exécutable

La surface d’exécution réutilisable qui sous-tend `qa-flow` peut rester générique
et transversale. Par exemple, les scénarios Markdown peuvent combiner des
helpers côté transport avec des helpers côté navigateur qui pilotent la Control UI intégrée via la
surface Gateway `browser.request` sans ajouter d’exécuteur spécialisé.

La liste de référence doit rester suffisamment large pour couvrir :

- les conversations en MP et en canal
- le comportement des fils
- le cycle de vie des actions sur les messages
- les rappels Cron
- le rappel de mémoire
- le changement de modèle
- le transfert à un sous-agent
- la lecture du dépôt et de la documentation
- une petite tâche de build comme Lobster Invaders

## Adaptateurs de transport

`qa-lab` possède une interface de transport générique pour les scénarios QA Markdown.
`qa-channel` est le premier adaptateur sur cette interface, mais l’objectif de conception est plus large :
les futurs canaux réels ou synthétiques devraient s’intégrer au même exécuteur de suite
au lieu d’ajouter un exécuteur QA spécifique au transport.

Au niveau de l’architecture, la séparation est la suivante :

- `qa-lab` gère l’exécution générique des scénarios, la concurrence des workers, l’écriture des artefacts et le reporting.
- l’adaptateur de transport gère la configuration Gateway, l’état de préparation, l’observation des entrées et sorties, les actions de transport et l’état de transport normalisé.
- les fichiers de scénarios Markdown sous `qa/scenarios/` définissent l’exécution du test ; `qa-lab` fournit la surface d’exécution réutilisable qui les exécute.

Les consignes d’adoption destinées aux mainteneurs pour les nouveaux adaptateurs de canal se trouvent dans
[Testing](/fr/help/testing#adding-a-channel-to-qa).

## Rapports

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie observée du bus.
Le rapport doit répondre aux questions suivantes :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Quels scénarios de suivi valent la peine d’être ajoutés

Pour les vérifications de caractère et de style, exécutez le même scénario sur plusieurs
références de modèles en direct et écrivez un rapport Markdown évalué :

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

La commande exécute des processus enfants Gateway QA locaux, pas Docker. Les scénarios d’évaluation de caractère
doivent définir la persona via `SOUL.md`, puis exécuter des tours utilisateur ordinaires
comme la discussion, l’aide sur l’espace de travail et de petites tâches sur des fichiers. Le
modèle candidat ne doit pas être informé qu’il est en cours d’évaluation. La commande préserve chaque
transcription complète, enregistre des statistiques d’exécution de base, puis demande aux modèles juges en mode rapide avec
un raisonnement `xhigh` de classer les exécutions selon leur naturel, leur ambiance et leur humour.
Utilisez `--blind-judge-models` lors de la comparaison de fournisseurs : l’invite du juge reçoit toujours
chaque transcription et le statut d’exécution, mais les références candidates sont remplacées par des
étiquettes neutres telles que `candidate-01` ; le rapport réassocie les classements aux références réelles après
l’analyse.
Les exécutions candidates utilisent par défaut le niveau de réflexion `high`, avec `xhigh` pour les modèles OpenAI qui
le prennent en charge. Remplacez un candidat spécifique en ligne avec
`--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours un
repli global, et l’ancienne forme `--model-thinking <provider/model=level>` est
conservée pour compatibilité.
Les références candidates OpenAI utilisent par défaut le mode rapide afin que le traitement prioritaire soit utilisé lorsque
le fournisseur le prend en charge. Ajoutez `,fast`, `,no-fast` ou `,fast=false` en ligne lorsqu’un
candidat ou juge unique nécessite un remplacement. Passez `--fast` uniquement si vous souhaitez
forcer le mode rapide pour chaque modèle candidat. Les durées des candidats et des juges sont
enregistrées dans le rapport pour l’analyse comparative, mais les invites des juges indiquent explicitement
de ne pas classer en fonction de la vitesse.
Les exécutions des modèles candidats et juges utilisent toutes deux par défaut une concurrence de 16. Réduisez
`--concurrency` ou `--judge-concurrency` lorsque les limites des fournisseurs ou la pression locale sur Gateway
rendent une exécution trop bruyante.
Lorsqu’aucun `--model` candidat n’est transmis, l’évaluation de caractère utilise par défaut
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est transmis.
Lorsqu’aucun `--judge-model` n’est transmis, les juges utilisent par défaut
`openai/gpt-5.4,thinking=xhigh,fast` et
`anthropic/claude-opus-4-6,thinking=high`.

## Documentation associée

- [Testing](/fr/help/testing)
- [QA Channel](/fr/channels/qa-channel)
- [Dashboard](/web/dashboard)
