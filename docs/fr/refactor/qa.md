---
read_when:
    - Refactorisation des définitions de scénarios QA ou du code du harnais qa-lab
    - Déplacer le comportement QA entre les scénarios Markdown et la logique du harnais TypeScript
summary: Plan de refactorisation QA pour la consolidation du catalogue de scénarios et du harnais
title: Refactorisation QA
x-i18n:
    generated_at: "2026-04-24T07:30:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d774d7b5e0fffd5c2504d9a4d6063198d77b866263ea8448474dce6246012d4
    source_path: refactor/qa.md
    workflow: 15
---

Statut : migration fondatrice effectuée.

## Objectif

Faire passer la QA OpenClaw d’un modèle à définition partagée à une source de vérité unique :

- métadonnées de scénario
- prompts envoyés au modèle
- setup et teardown
- logique de harnais
- assertions et critères de succès
- artefacts et indications de rapport

L’état final visé est un harnais QA générique qui charge des fichiers de définition de scénario puissants au lieu de coder en dur l’essentiel du comportement en TypeScript.

## État actuel

La source de vérité principale vit désormais dans `qa/scenarios/index.md` plus un fichier par
scénario sous `qa/scenarios/<theme>/*.md`.

Implémenté :

- `qa/scenarios/index.md`
  - métadonnées canoniques du pack QA
  - identité operator
  - mission de démarrage
- `qa/scenarios/<theme>/*.md`
  - un fichier Markdown par scénario
  - métadonnées de scénario
  - liaisons de gestionnaires
  - configuration d’exécution spécifique au scénario
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parseur de pack Markdown + validation zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - rendu du plan depuis le pack Markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - injecte des fichiers de compatibilité générés plus `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - sélectionne les scénarios exécutables via les liaisons de gestionnaires définies en Markdown
- Protocole QA bus + UI
  - pièces jointes en ligne génériques pour le rendu image/vidéo/audio/fichier

Surfaces encore partagées :

- `extensions/qa-lab/src/suite.ts`
  - détient encore l’essentiel de la logique exécutable des gestionnaires personnalisés
- `extensions/qa-lab/src/report.ts`
  - dérive encore la structure du rapport depuis les sorties runtime

Donc la séparation de source de vérité est corrigée, mais l’exécution reste encore largement adossée à des gestionnaires plutôt que pleinement déclarative.

## À quoi ressemble réellement la surface de scénario

La lecture de la suite actuelle montre quelques classes de scénarios distinctes.

### Interaction simple

- base de canal
- base DM
- suivi en thread
- changement de modèle
- enchaînement après approbation
- réaction/édition/suppression

### Mutation de configuration et de runtime

- désactivation de Skill par patch de config
- réveil après redémarrage par config apply
- bascule de capacité après redémarrage de config
- vérification de dérive d’inventaire runtime

### Assertions système de fichiers et dépôt

- rapport de découverte source/docs
- build Lobster Invaders
- recherche d’artefact d’image générée

### Orchestration mémoire

- rappel mémoire
- outils mémoire dans le contexte d’un canal
- repli en cas d’échec mémoire
- classement de mémoire de session
- isolation mémoire par thread
- balayage Dreaming de la mémoire

### Intégration outils et plugins

- appel MCP plugin-tools
- visibilité des Skills
- installation à chaud de Skill
- génération d’image native
- aller-retour d’image
- compréhension d’image depuis une pièce jointe

### Multi-tour et multi-acteur

- transfert à un sous-agent
- synthèse de fanout de sous-agents
- flux de style reprise après redémarrage

Ces catégories comptent car elles pilotent les exigences du DSL. Une simple liste de prompt + texte attendu ne suffit pas.

## Direction

### Source de vérité unique

Utiliser `qa/scenarios/index.md` plus `qa/scenarios/<theme>/*.md` comme
source de vérité rédigée.

Le pack doit rester :

- lisible par un humain en revue
- analysable par machine
- assez riche pour piloter :
  - l’exécution de la suite
  - le bootstrap de l’espace de travail QA
  - les métadonnées UI de QA Lab
  - les prompts docs/discovery
  - la génération de rapports

### Format de rédaction préféré

Utiliser Markdown comme format de haut niveau, avec du YAML structuré à l’intérieur.

Forme recommandée :

- frontmatter YAML
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - surcharges de modèle/fournisseur
  - prérequis
- sections en prose
  - objectif
  - notes
  - indices de débogage
- blocs YAML délimités
  - setup
  - steps
  - assertions
  - cleanup

Cela apporte :

- une meilleure lisibilité en PR qu’un gros JSON
- un contexte plus riche que du pur YAML
- une analyse stricte et une validation zod

Le JSON brut n’est acceptable qu’en tant que forme intermédiaire générée.

## Forme proposée pour un fichier de scénario

Exemple :

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objectif

Vérifier qu’un média généré est rattaché au tour suivant.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Étapes

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Attendu

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Capacités du runner que le DSL doit couvrir

D’après la suite actuelle, le runner générique a besoin de plus que de l’exécution de prompts.

### Actions d’environnement et de setup

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Actions de tour d’agent

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Actions de configuration et de runtime

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Actions de fichier et d’artefact

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Actions mémoire et Cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### Actions MCP

- `mcp.callTool`

### Assertions

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## Variables et références d’artefacts

Le DSL doit prendre en charge les sorties sauvegardées et les références ultérieures.

Exemples issus de la suite actuelle :

- créer un thread, puis réutiliser `threadId`
- créer une session, puis réutiliser `sessionKey`
- générer une image, puis joindre le fichier au tour suivant
- générer une chaîne de marqueur de réveil, puis vérifier qu’elle apparaît plus tard

Capacités nécessaires :

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- références typées pour les chemins, clés de session, IDs de thread, marqueurs, sorties d’outils

Sans prise en charge des variables, le harnais continuera à faire fuiter la logique de scénario vers TypeScript.

## Ce qui doit rester comme échappatoires

Un runner totalement déclaratif n’est pas réaliste en phase 1.

Certains scénarios sont intrinsèquement lourds en orchestration :

- balayage Dreaming de la mémoire
- réveil après redémarrage par config apply
- bascule de capacité après redémarrage de config
- résolution d’artefact d’image générée par horodatage/chemin
- évaluation de rapport de discovery

Ceux-ci doivent pour l’instant utiliser des gestionnaires personnalisés explicites.

Règle recommandée :

- 85-90 % déclaratif
- étapes `customHandler` explicites pour le reste difficile
- gestionnaires personnalisés nommés et documentés uniquement
- pas de code inline anonyme dans le fichier de scénario

Cela garde le moteur générique propre tout en permettant d’avancer.

## Changement d’architecture

### Actuel

Le Markdown de scénario est déjà la source de vérité pour :

- l’exécution de la suite
- les fichiers de bootstrap de l’espace de travail
- le catalogue de scénarios de l’UI QA Lab
- les métadonnées de rapport
- les prompts de discovery

Compatibilité générée :

- l’espace de travail injecté inclut encore `QA_KICKOFF_TASK.md`
- l’espace de travail injecté inclut encore `QA_SCENARIO_PLAN.md`
- l’espace de travail injecté inclut désormais aussi `QA_SCENARIOS.md`

## Plan de refactorisation

### Phase 1 : loader et schéma

Fait.

- ajout de `qa/scenarios/index.md`
- découpage des scénarios dans `qa/scenarios/<theme>/*.md`
- ajout d’un parseur pour le contenu nommé YAML dans Markdown
- validation avec zod
- bascule des consommateurs vers le pack analysé
- suppression de `qa/seed-scenarios.json` et `qa/QA_KICKOFF_TASK.md` au niveau dépôt

### Phase 2 : moteur générique

- découper `extensions/qa-lab/src/suite.ts` en :
  - loader
  - moteur
  - registre d’actions
  - registre d’assertions
  - gestionnaires personnalisés
- conserver les fonctions utilitaires existantes comme opérations du moteur

Livrable :

- le moteur exécute des scénarios déclaratifs simples

Commencer par des scénarios principalement de type prompt + attente + assertion :

- suivi en thread
- compréhension d’image depuis une pièce jointe
- visibilité et invocation de Skills
- base de canal

Livrable :

- premiers véritables scénarios définis en Markdown expédiés via le moteur générique

### Phase 4 : migrer les scénarios intermédiaires

- aller-retour de génération d’image
- outils mémoire dans le contexte d’un canal
- classement mémoire de session
- transfert à un sous-agent
- synthèse de fanout de sous-agents

Livrable :

- variables, artefacts, assertions d’outils, assertions request-log validés

### Phase 5 : garder les scénarios difficiles sur des gestionnaires personnalisés

- balayage Dreaming de la mémoire
- réveil après redémarrage par config apply
- bascule de capacité après redémarrage de config
- dérive d’inventaire runtime

Livrable :

- même format de rédaction, mais avec des blocs d’étapes personnalisées explicites lorsque nécessaire

### Phase 6 : supprimer la table de scénarios codée en dur

Une fois la couverture du pack suffisante :

- supprimer l’essentiel du branchement TypeScript spécifique à chaque scénario dans `extensions/qa-lab/src/suite.ts`

## Faux Slack / prise en charge des médias riches

Le QA bus actuel est centré sur le texte.

Fichiers concernés :

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Aujourd’hui, le QA bus prend en charge :

- le texte
- les réactions
- les threads

Il ne modélise pas encore les pièces jointes média en ligne.

### Contrat de transport nécessaire

Ajouter un modèle générique de pièce jointe QA bus :

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

Puis ajouter `attachments?: QaBusAttachment[]` à :

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Pourquoi générique d’abord

Ne pas construire un modèle média réservé à Slack.

À la place :

- un modèle de transport QA générique unique
- plusieurs moteurs de rendu par-dessus
  - le chat actuel de QA Lab
  - un futur faux Slack web
  - toute autre vue de faux transport

Cela évite la logique dupliquée et permet aux scénarios média de rester agnostiques au transport.

### Travail UI nécessaire

Mettre à jour l’UI QA pour rendre :

- aperçu d’image en ligne
- lecteur audio en ligne
- lecteur vidéo en ligne
- puce de pièce jointe fichier

L’UI actuelle peut déjà rendre les threads et les réactions, donc le rendu des pièces jointes devrait se superposer au même modèle de carte de message.

### Travail de scénario rendu possible par le transport média

Une fois que les pièces jointes circulent dans le QA bus, nous pouvons ajouter des scénarios de faux chat plus riches :

- réponse d’image en ligne dans un faux Slack
- compréhension de pièce jointe audio
- compréhension de pièce jointe vidéo
- ordre mixte de pièces jointes
- réponse en thread avec conservation du média

## Recommandation

Le prochain bloc d’implémentation devrait être :

1. ajouter un loader de scénarios Markdown + schéma zod
2. générer le catalogue actuel depuis Markdown
3. migrer d’abord quelques scénarios simples
4. ajouter la prise en charge générique des pièces jointes QA bus
5. rendre une image en ligne dans l’UI QA
6. puis étendre à l’audio et à la vidéo

C’est le plus petit chemin qui prouve les deux objectifs :

- QA générique définie en Markdown
- surfaces de faux messages plus riches

## Questions ouvertes

- faut-il autoriser dans les fichiers de scénario des modèles de prompt Markdown intégrés avec interpolation de variables
- faut-il que setup/cleanup soient des sections nommées ou simplement des listes d’actions ordonnées
- faut-il que les références d’artefacts soient fortement typées dans le schéma ou fondées sur des chaînes
- faut-il que les gestionnaires personnalisés vivent dans un registre unique ou dans des registres par surface
- faut-il que le fichier de compatibilité JSON généré reste validé dans le dépôt pendant la migration

## Articles connexes

- [Automatisation QA E2E](/fr/concepts/qa-e2e-automation)
