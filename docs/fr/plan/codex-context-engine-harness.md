---
read_when:
    - Vous connectez le comportement du cycle de vie du moteur de contexte au harnais Codex
    - Vous avez besoin que `lossless-claw` ou un autre Plugin de moteur de contexte fonctionne avec les sessions de harnais embarqué `codex/*`
    - Vous comparez le comportement de contexte du PI embarqué et du serveur d’application Codex
summary: Spécification pour faire en sorte que le harnais groupé du serveur d’application Codex respecte les Plugins de moteur de contexte OpenClaw
title: Portage du moteur de contexte du harnais Codex
x-i18n:
    generated_at: "2026-04-24T07:19:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d6b106915f2888337cb08c831c1722770ad8ec6612c575efe88fe2fc263dec5
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

# Portage du moteur de contexte du harnais Codex

## Statut

Spécification d’implémentation à l’état de brouillon.

## Objectif

Faire en sorte que le harnais groupé du serveur d’application Codex respecte le même
contrat de cycle de vie de moteur de contexte OpenClaw que celui déjà respecté par les tours PI embarqués.

Une session utilisant `agents.defaults.embeddedHarness.runtime: "codex"` ou un
modèle `codex/*` doit toujours permettre au Plugin de moteur de contexte sélectionné, tel que
`lossless-claw`, de contrôler l’assemblage du contexte, l’ingestion après tour, la maintenance et
la politique de Compaction au niveau OpenClaw, dans la mesure permise par la frontière du serveur d’application Codex.

## Non-objectifs

- Ne pas réimplémenter les internes du serveur d’application Codex.
- Ne pas faire en sorte que la Compaction native des fils Codex produise un résumé lossless-claw.
- Ne pas exiger que les modèles non Codex utilisent le harnais Codex.
- Ne pas modifier le comportement des sessions ACP/acpx. Cette spécification concerne uniquement le
  chemin du harnais d’agent embarqué non-ACP.
- Ne pas faire en sorte que des Plugins tiers enregistrent des fabriques d’extensions du serveur d’application Codex ;
  la frontière de confiance existante du Plugin groupé reste inchangée.

## Architecture actuelle

La boucle d’exécution embarquée résout le moteur de contexte configuré une fois par exécution avant
de sélectionner un harnais concret de bas niveau :

- `src/agents/pi-embedded-runner/run.ts`
  - initialise les Plugins de moteur de contexte
  - appelle `resolveContextEngine(params.config)`
  - transmet `contextEngine` et `contextTokenBudget` à
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` délègue au harnais d’agent sélectionné :

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Le harnais du serveur d’application Codex est enregistré par le Plugin Codex groupé :

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

L’implémentation du harnais Codex reçoit les mêmes `EmbeddedRunAttemptParams`
que les tentatives soutenues par PI :

- `extensions/codex/src/app-server/run-attempt.ts`

Cela signifie que le point d’extension requis se trouve dans le code contrôlé par OpenClaw. La frontière
externe est le protocole du serveur d’application Codex lui-même : OpenClaw peut contrôler ce qu’il
envoie à `thread/start`, `thread/resume` et `turn/start`, et peut observer les
notifications, mais il ne peut pas modifier le magasin de fils interne de Codex ni son compacteur natif.

## Lacune actuelle

Les tentatives PI embarquées appellent directement le cycle de vie du moteur de contexte :

- bootstrap/maintenance avant la tentative
- assemble avant l’appel au modèle
- afterTurn ou ingest après la tentative
- maintenance après un tour réussi
- Compaction du moteur de contexte pour les moteurs qui possèdent la Compaction

Code PI pertinent :

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Les tentatives du serveur d’application Codex exécutent actuellement les hooks génériques du harnais d’agent et reflètent
la transcription, mais n’appellent pas `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest`, ou
`params.contextEngine.maintain`.

Code Codex pertinent :

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Comportement souhaité

Pour les tours de harnais Codex, OpenClaw doit préserver ce cycle de vie :

1. Lire la transcription de session OpenClaw miroir.
2. Exécuter le bootstrap du moteur de contexte actif lorsqu’un fichier de session précédent existe.
3. Exécuter la maintenance de bootstrap lorsqu’elle est disponible.
4. Assembler le contexte en utilisant le moteur de contexte actif.
5. Convertir le contexte assemblé en entrées compatibles Codex.
6. Démarrer ou reprendre le fil Codex avec des instructions développeur qui incluent tout
   `systemPromptAddition` du moteur de contexte.
7. Démarrer le tour Codex avec le prompt orienté utilisateur assemblé.
8. Refléter le résultat Codex dans la transcription OpenClaw.
9. Appeler `afterTurn` si implémenté, sinon `ingestBatch`/`ingest`, en utilisant l’instantané de transcription reflétée.
10. Exécuter la maintenance du tour après les tours réussis non annulés.
11. Préserver les signaux de Compaction native de Codex et les hooks de Compaction OpenClaw.

## Contraintes de conception

### Le serveur d’application Codex reste canonique pour l’état natif du fil

Codex possède son fil natif et tout historique étendu interne. OpenClaw ne doit
pas tenter de modifier l’historique interne du serveur d’application autrement que via des appels de protocole pris en charge.

Le miroir de transcription d’OpenClaw reste la source pour les fonctionnalités OpenClaw :

- historique de chat
- recherche
- gestion de `/new` et `/reset`
- futur changement de modèle ou de harnais
- état du Plugin de moteur de contexte

### L’assemblage du moteur de contexte doit être projeté dans les entrées Codex

L’interface du moteur de contexte renvoie des `AgentMessage[]` OpenClaw, et non un correctif de fil Codex. Codex app-server `turn/start` accepte une entrée utilisateur courante, tandis que
`thread/start` et `thread/resume` acceptent des instructions développeur.

L’implémentation a donc besoin d’une couche de projection. La première version sûre
doit éviter de prétendre pouvoir remplacer l’historique interne de Codex. Elle doit injecter
le contexte assemblé sous forme de matériel déterministe de prompt/instructions développeur autour
du tour courant.

### La stabilité du cache de prompt est importante

Pour des moteurs comme lossless-claw, le contexte assemblé doit être déterministe
pour des entrées inchangées. N’ajoutez ni horodatages, ni identifiants aléatoires, ni ordonnancement non déterministe au texte de contexte généré.

### Les sémantiques de repli PI ne changent pas

La sélection du harnais reste inchangée :

- `runtime: "pi"` force PI
- `runtime: "codex"` sélectionne le harnais Codex enregistré
- `runtime: "auto"` laisse les harnais Plugin revendiquer les fournisseurs pris en charge
- `fallback: "none"` désactive le repli PI lorsqu’aucun harnais Plugin ne correspond

Ce travail change ce qui se passe après la sélection du harnais Codex.

## Plan d’implémentation

### 1. Exporter ou déplacer des assistants réutilisables de cycle de vie du moteur de contexte

Aujourd’hui, les assistants de cycle de vie réutilisables vivent sous l’exécuteur PI :

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex ne doit pas importer depuis un chemin d’implémentation dont le nom implique PI si nous
pouvons l’éviter.

Créer un module neutre vis-à-vis du harnais, par exemple :

- `src/agents/harness/context-engine-lifecycle.ts`

Déplacer ou réexporter :

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- un petit wrapper autour de `runContextEngineMaintenance`

Garder les imports PI fonctionnels soit en réexportant depuis les anciens fichiers, soit en mettant à jour les sites d’appel PI dans la même PR.

Les noms neutres des assistants ne doivent pas mentionner PI.

Noms suggérés :

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Ajouter un assistant de projection de contexte Codex

Ajouter un nouveau module :

- `extensions/codex/src/app-server/context-engine-projection.ts`

Responsabilités :

- Accepter les `AgentMessage[]` assemblés, l’historique miroir d’origine et le prompt courant.
- Déterminer quel contexte appartient aux instructions développeur par rapport à l’entrée utilisateur courante.
- Préserver le prompt utilisateur courant comme requête exploitable finale.
- Rendre les messages précédents dans un format stable et explicite.
- Éviter les métadonnées volatiles.

API proposée :

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

Première projection recommandée :

- Mettre `systemPromptAddition` dans les instructions développeur.
- Mettre le contexte de transcription assemblé avant le prompt courant dans `promptText`.
- L’étiqueter clairement comme contexte assemblé par OpenClaw.
- Garder le prompt courant en dernier.
- Exclure le prompt utilisateur courant en double s’il apparaît déjà à la fin.

Exemple de forme de prompt :

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

C’est moins élégant qu’une chirurgie native de l’historique Codex, mais cela peut être implémenté
à l’intérieur d’OpenClaw et préserve la sémantique du moteur de contexte.

Amélioration future : si le serveur d’application Codex expose un protocole pour remplacer ou compléter
l’historique du fil, remplacez cette couche de projection pour utiliser cette API.

### 3. Connecter le bootstrap avant le démarrage du fil Codex

Dans `extensions/codex/src/app-server/run-attempt.ts` :

- Lire l’historique de session miroir comme aujourd’hui.
- Déterminer si le fichier de session existait avant cette exécution. Préférer un assistant
  qui vérifie `fs.stat(params.sessionFile)` avant les écritures miroir.
- Ouvrir un `SessionManager` ou utiliser un adaptateur étroit de gestionnaire de session si l’assistant
  l’exige.
- Appeler l’assistant de bootstrap neutre lorsque `params.contextEngine` existe.

Pseudo-flux :

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Utiliser la même convention de `sessionKey` que le pont d’outils Codex et le miroir
de transcription. Aujourd’hui Codex calcule `sandboxSessionKey` à partir de `params.sessionKey` ou
`params.sessionId` ; utilisez cela de manière cohérente sauf s’il existe une raison de préserver `params.sessionKey` brut.

### 4. Connecter assemble avant `thread/start` / `thread/resume` et `turn/start`

Dans `runCodexAppServerAttempt` :

1. Construire d’abord les outils dynamiques, afin que le moteur de contexte voie les
   noms d’outils réellement disponibles.
2. Lire l’historique de session miroir.
3. Exécuter `assemble(...)` du moteur de contexte lorsque `params.contextEngine` existe.
4. Projeter le résultat assemblé en :
   - ajout d’instructions développeur
   - texte de prompt pour `turn/start`

L’appel de hook existant :

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

doit devenir sensible au contexte :

1. calculer les instructions développeur de base avec `buildDeveloperInstructions(params)`
2. appliquer l’assemblage/la projection du moteur de contexte
3. exécuter `before_prompt_build` avec le prompt/les instructions développeur projetés

Cet ordre permet aux hooks de prompt génériques de voir le même prompt que celui que Codex recevra. Si
nous avons besoin d’une stricte parité PI, exécuter l’assemblage du moteur de contexte avant la composition du hook,
car PI applique `systemPromptAddition` du moteur de contexte au prompt système final après son pipeline de prompt. L’invariant important est que le moteur de contexte et les hooks obtiennent tous deux un ordre déterministe et documenté.

Ordre recommandé pour la première implémentation :

1. `buildDeveloperInstructions(params)`
2. `assemble()` du moteur de contexte
3. ajouter/préfixer `systemPromptAddition` aux instructions développeur
4. projeter les messages assemblés dans le texte du prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. transmettre les instructions développeur finales à `startOrResumeThread(...)`
7. transmettre le texte de prompt final à `buildTurnStartParams(...)`

La spécification doit être encodée dans les tests afin que les modifications futures ne
réordonnent pas cela par accident.

### 5. Préserver un formatage stable pour le cache de prompt

L’assistant de projection doit produire une sortie stable au niveau des octets pour des entrées identiques :

- ordre stable des messages
- étiquettes de rôle stables
- aucun horodatage généré
- aucune fuite d’ordre de clés d’objet
- aucun délimiteur aléatoire
- aucun identifiant par exécution

Utiliser des délimiteurs fixes et des sections explicites.

### 6. Connecter le post-tour après le miroir de transcription

Le `CodexAppServerEventProjector` de Codex construit un `messagesSnapshot` local pour le
tour courant. `mirrorTranscriptBestEffort(...)` écrit cet instantané dans le miroir de transcription OpenClaw.

Après la réussite ou l’échec du miroir, appelez le finaliseur du moteur de contexte avec le
meilleur instantané de messages disponible :

- Préférez le contexte complet de session miroir après l’écriture, car `afterTurn`
  attend l’instantané de session, pas seulement le tour courant.
- Repliez-vous sur `historyMessages + result.messagesSnapshot` si le fichier de session
  ne peut pas être rouvert.

Pseudo-flux :

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

Si le miroir échoue, appelez quand même `afterTurn` avec l’instantané de secours, mais journalisez
que le moteur de contexte ingère à partir des données de tour de secours.

### 7. Normaliser l’usage et le contexte d’exécution du cache de prompt

Les résultats Codex incluent un usage normalisé à partir des notifications de jetons du serveur d’application lorsqu’il
est disponible. Passez cet usage dans le contexte d’exécution du moteur de contexte.

Si le serveur d’application Codex expose à l’avenir des détails de lecture/écriture de cache, mappez-les dans
`ContextEnginePromptCacheInfo`. D’ici là, omettez `promptCache` plutôt que
d’inventer des zéros.

### 8. Politique de Compaction

Il existe deux systèmes de Compaction :

1. `compact()` du moteur de contexte OpenClaw
2. `thread/compact/start` natif du serveur d’application Codex

Ne les confondez pas silencieusement.

#### `/compact` et Compaction OpenClaw explicite

Lorsque le moteur de contexte sélectionné a `info.ownsCompaction === true`, la
Compaction OpenClaw explicite doit préférer le résultat de `compact()` du moteur de contexte pour
le miroir de transcription OpenClaw et l’état du Plugin.

Lorsque le harnais Codex sélectionné possède une liaison de fil native, nous pouvons en outre
demander une Compaction native Codex afin de garder le fil du serveur d’application en bonne santé, mais cela
doit être rapporté comme une action de backend distincte dans les détails.

Comportement recommandé :

- Si `contextEngine.info.ownsCompaction === true` :
  - appeler d’abord `compact()` du moteur de contexte
  - puis appeler au mieux la Compaction native Codex lorsqu’une liaison de fil existe
  - renvoyer le résultat du moteur de contexte comme résultat principal
  - inclure l’état de Compaction native Codex dans `details.codexNativeCompaction`
- Si le moteur de contexte actif ne possède pas la Compaction :
  - préserver le comportement actuel de Compaction native Codex

Cela nécessitera probablement de modifier `extensions/codex/src/app-server/compact.ts` ou
de l’envelopper depuis le chemin de Compaction générique, selon l’endroit où
`maybeCompactAgentHarnessSession(...)` est invoqué.

#### Événements natifs Codex `contextCompaction` en cours de tour

Codex peut émettre des événements d’élément `contextCompaction` pendant un tour. Conservez l’émission actuelle
des hooks avant/après Compaction dans `event-projector.ts`, mais ne la traitez pas
comme une Compaction de moteur de contexte terminée.

Pour les moteurs qui possèdent la Compaction, émettez un diagnostic explicite lorsque Codex exécute quand même
une Compaction native :

- nom de flux/événement : le flux existant `compaction` est acceptable
- détails : `{ backend: "codex-app-server", ownsCompaction: true }`

Cela rend la séparation audit-able.

### 9. Comportement de réinitialisation et de liaison de session

Le `reset(...)` actuel du harnais Codex efface la liaison du serveur d’application Codex à partir
du fichier de session OpenClaw. Préservez ce comportement.

Assurez-vous également que le nettoyage de l’état du moteur de contexte continue à se produire via les chemins
existants du cycle de vie de session OpenClaw. N’ajoutez pas de nettoyage spécifique à Codex sauf si le
cycle de vie actuel du moteur de contexte manque les événements de réinitialisation/suppression pour tous les harnais.

### 10. Gestion des erreurs

Suivez les sémantiques PI :

- les échecs de bootstrap émettent un avertissement et continuent
- les échecs de assemble émettent un avertissement et reviennent au pipeline non assemblé de messages/prompt
- les échecs de afterTurn/ingest émettent un avertissement et marquent la finalisation post-tour comme non réussie
- la maintenance ne s’exécute qu’après des tours réussis, non annulés et non yield
- les erreurs de Compaction ne doivent pas être réessayées comme de nouveaux prompts

Ajouts spécifiques à Codex :

- Si la projection de contexte échoue, émettre un avertissement et revenir au prompt d’origine.
- Si le miroir de transcription échoue, tenter quand même la finalisation du moteur de contexte avec
  des messages de secours.
- Si la Compaction native Codex échoue après le succès de la Compaction du moteur de contexte,
  ne pas faire échouer toute la Compaction OpenClaw lorsque le moteur de contexte est primaire.

## Plan de test

### Tests unitaires

Ajouter des tests sous `extensions/codex/src/app-server` :

1. `run-attempt.context-engine.test.ts`
   - Codex appelle `bootstrap` lorsqu’un fichier de session existe.
   - Codex appelle `assemble` avec les messages miroir, le budget de jetons, les noms
     d’outils, le mode de citations, l’identifiant du modèle et le prompt.
   - `systemPromptAddition` est inclus dans les instructions développeur.
   - Les messages assemblés sont projetés dans le prompt avant la requête courante.
   - Codex appelle `afterTurn` après le miroir de transcription.
   - Sans `afterTurn`, Codex appelle `ingestBatch` ou `ingest` par message.
   - La maintenance du tour s’exécute après les tours réussis.
   - La maintenance du tour ne s’exécute pas en cas d’erreur de prompt, d’annulation ou de yield abort.

2. `context-engine-projection.test.ts`
   - sortie stable pour des entrées identiques
   - aucun prompt courant dupliqué lorsque l’historique assemblé l’inclut
   - gère l’historique vide
   - préserve l’ordre des rôles
   - inclut l’ajout de prompt système uniquement dans les instructions développeur

3. `compact.context-engine.test.ts`
   - le résultat principal du moteur de contexte propriétaire l’emporte
   - l’état de Compaction native Codex apparaît dans les détails lorsqu’elle est aussi tentée
   - l’échec natif Codex ne fait pas échouer la Compaction du moteur de contexte propriétaire
   - un moteur de contexte non propriétaire préserve le comportement actuel de Compaction native

### Tests existants à mettre à jour

- `extensions/codex/src/app-server/run-attempt.test.ts` s’il existe, sinon
  les tests d’exécution du serveur d’application Codex les plus proches.
- `extensions/codex/src/app-server/event-projector.test.ts` uniquement si les détails
  des événements de Compaction changent.
- `src/agents/harness/selection.test.ts` ne devrait pas nécessiter de changements sauf si
  le comportement de configuration change ; il doit rester stable.
- Les tests PI du moteur de contexte doivent continuer à réussir sans changement.

### Tests d’intégration / live

Ajouter ou étendre les tests smoke live du harnais Codex :

- configurer `plugins.slots.contextEngine` vers un moteur de test
- configurer `agents.defaults.model` vers un modèle `codex/*`
- configurer `agents.defaults.embeddedHarness.runtime = "codex"`
- vérifier que le moteur de test a observé :
  - bootstrap
  - assemble
  - afterTurn ou ingest
  - maintenance

Évitez d’exiger lossless-claw dans les tests core d’OpenClaw. Utilisez un faux
Plugin de moteur de contexte minimal dans le dépôt.

## Observabilité

Ajouter des journaux de débogage autour des appels du cycle de vie du moteur de contexte Codex :

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` avec la raison
- `codex native compaction completed alongside context-engine compaction`

Évitez de journaliser les prompts complets ou le contenu des transcriptions.

Ajoutez des champs structurés lorsque c’est utile :

- `sessionId`
- `sessionKey` caviardé ou omis selon la pratique existante de journalisation
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migration / compatibilité

Cela doit rester rétrocompatible :

- Si aucun moteur de contexte n’est configuré, le comportement du moteur de contexte hérité doit être
  équivalent au comportement actuel du harnais Codex.
- Si `assemble` du moteur de contexte échoue, Codex doit continuer avec le chemin du
  prompt d’origine.
- Les liaisons de fil Codex existantes doivent rester valides.
- L’empreinte dynamique des outils ne doit pas inclure la sortie du moteur de contexte ; sinon
  chaque changement de contexte pourrait forcer un nouveau fil Codex. Seul le catalogue
  d’outils doit affecter l’empreinte dynamique des outils.

## Questions ouvertes

1. Le contexte assemblé doit-il être injecté entièrement dans le prompt utilisateur, entièrement
   dans les instructions développeur, ou être scindé ?

   Recommandation : le scinder. Mettre `systemPromptAddition` dans les instructions développeur ;
   mettre le contexte de transcription assemblé dans l’enveloppe du prompt utilisateur. Cela correspond le mieux
   au protocole Codex actuel sans modifier l’historique natif du fil.

2. La Compaction native Codex doit-elle être désactivée lorsqu’un moteur de contexte possède
   la Compaction ?

   Recommandation : non, pas dans un premier temps. La Compaction native Codex peut encore être
   nécessaire pour maintenir le fil du serveur d’application en vie. Mais elle doit être rapportée comme
   Compaction native Codex, et non comme Compaction de moteur de contexte.

3. `before_prompt_build` doit-il s’exécuter avant ou après l’assemblage du moteur de contexte ?

   Recommandation : après la projection du moteur de contexte pour Codex, afin que les hooks génériques du harnais
   voient le prompt/les instructions développeur réels que Codex recevra. Si la parité PI
   exige l’inverse, encodez l’ordre choisi dans les tests et documentez-le
   ici.

4. Le serveur d’application Codex peut-il accepter un futur remplacement structuré de contexte/historique ?

   Inconnu. Si c’est le cas, remplacez la couche de projection texte par ce protocole et
   gardez les appels de cycle de vie inchangés.

## Critères d’acceptation

- Un tour de harnais embarqué `codex/*` invoque le cycle de vie assemble du moteur de contexte sélectionné.
- Un `systemPromptAddition` de moteur de contexte affecte les instructions développeur Codex.
- Le contexte assemblé affecte de manière déterministe l’entrée du tour Codex.
- Les tours Codex réussis appellent `afterTurn` ou le repli ingest.
- Les tours Codex réussis exécutent la maintenance de tour du moteur de contexte.
- Les tours échoués/annulés/yield-aborted n’exécutent pas la maintenance de tour.
- La Compaction possédée par le moteur de contexte reste primaire pour l’état OpenClaw/Plugin.
- La Compaction native Codex reste audit-able comme comportement natif Codex.
- Le comportement existant du moteur de contexte PI reste inchangé.
- Le comportement existant du harnais Codex reste inchangé lorsqu’aucun moteur de contexte non hérité
  n’est sélectionné ou lorsque l’assemblage échoue.
