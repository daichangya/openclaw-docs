---
read_when:
    - Vous avez besoin d’un parcours exact de la boucle d’agent ou des événements de cycle de vie
summary: Cycle de vie de la boucle d’agent, flux et sémantique d’attente
title: Boucle d’agent
x-i18n:
    generated_at: "2026-04-05T12:39:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e562e63c494881e9c345efcb93c5f972d69aaec61445afc3d4ad026b2d26883
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Boucle d’agent (OpenClaw)

Une boucle agentique est l’exécution complète et « réelle » d’un agent : ingestion → assemblage du contexte → inférence du modèle →
exécution des outils → réponses en streaming → persistance. C’est le chemin faisant autorité qui transforme un message
en actions et en réponse finale, tout en maintenant la cohérence de l’état de la session.

Dans OpenClaw, une boucle est une exécution unique, sérialisée par session, qui émet des événements de cycle de vie et de flux
pendant que le modèle réfléchit, appelle des outils et diffuse sa sortie en streaming. Ce document explique comment cette boucle authentique est
câblée de bout en bout.

## Points d’entrée

- RPC Gateway : `agent` et `agent.wait`.
- CLI : commande `agent`.

## Fonctionnement (vue d’ensemble)

1. La RPC `agent` valide les paramètres, résout la session (sessionKey/sessionId), persiste les métadonnées de session et renvoie immédiatement `{ runId, acceptedAt }`.
2. `agentCommand` exécute l’agent :
   - résout les valeurs par défaut du modèle + thinking/verbose
   - charge l’instantané des Skills
   - appelle `runEmbeddedPiAgent` (runtime pi-agent-core)
   - émet **lifecycle end/error** si la boucle intégrée n’en émet pas
3. `runEmbeddedPiAgent` :
   - sérialise les exécutions via des files d’attente par session + globale
   - résout le modèle + le profil d’authentification et construit la session pi
   - s’abonne aux événements pi et diffuse les deltas assistant/outils
   - applique le délai d’expiration -> annule l’exécution s’il est dépassé
   - renvoie les charges utiles + les métadonnées d’utilisation
4. `subscribeEmbeddedPiSession` relie les événements pi-agent-core au flux OpenClaw `agent` :
   - événements d’outil => `stream: "tool"`
   - deltas assistant => `stream: "assistant"`
   - événements de cycle de vie => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` utilise `waitForAgentRun` :
   - attend **lifecycle end/error** pour `runId`
   - renvoie `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Mise en file d’attente + concurrence

- Les exécutions sont sérialisées par clé de session (voie de session) et éventuellement via une voie globale.
- Cela empêche les courses entre outils/sessions et maintient la cohérence de l’historique de session.
- Les canaux de messagerie peuvent choisir des modes de file d’attente (collect/steer/followup) qui alimentent ce système de voies.
  Voir [File de commandes](/concepts/queue).

## Préparation de la session + de l’espace de travail

- L’espace de travail est résolu et créé ; les exécutions en sandbox peuvent être redirigées vers une racine d’espace de travail sandbox.
- Les Skills sont chargés (ou réutilisés depuis un instantané) et injectés dans l’environnement et le prompt.
- Les fichiers de bootstrap/contexte sont résolus et injectés dans le rapport de prompt système.
- Un verrou d’écriture de session est acquis ; `SessionManager` est ouvert et préparé avant le streaming.

## Assemblage du prompt + prompt système

- Le prompt système est construit à partir du prompt de base d’OpenClaw, du prompt des Skills, du contexte de bootstrap et des surcharges par exécution.
- Les limites spécifiques au modèle et les réserves de jetons pour la compaction sont appliquées.
- Voir [Prompt système](/concepts/system-prompt) pour ce que voit le modèle.

## Points d’accroche (où vous pouvez intercepter)

OpenClaw dispose de deux systèmes de hooks :

- **Hooks internes** (hooks Gateway) : scripts pilotés par événements pour les commandes et les événements de cycle de vie.
- **Hooks de plugin** : points d’extension à l’intérieur du cycle de vie agent/outils et du pipeline Gateway.

### Hooks internes (hooks Gateway)

- **`agent:bootstrap`** : s’exécute pendant la construction des fichiers de bootstrap avant la finalisation du prompt système.
  Utilisez-le pour ajouter/supprimer des fichiers de contexte de bootstrap.
- **Hooks de commande** : `/new`, `/reset`, `/stop`, et autres événements de commande (voir la doc Hooks).

Voir [Hooks](/automation/hooks) pour la configuration et les exemples.

### Hooks de plugin (cycle de vie agent + gateway)

Ils s’exécutent à l’intérieur de la boucle d’agent ou du pipeline Gateway :

- **`before_model_resolve`** : s’exécute avant la session (sans `messages`) pour remplacer de manière déterministe le fournisseur/modèle avant la résolution du modèle.
- **`before_prompt_build`** : s’exécute après le chargement de la session (avec `messages`) pour injecter `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` avant l’envoi du prompt. Utilisez `prependContext` pour du texte dynamique par tour et les champs de contexte système pour des indications stables qui doivent rester dans l’espace du prompt système.
- **`before_agent_start`** : hook de compatibilité hérité qui peut s’exécuter dans l’une ou l’autre phase ; préférez les hooks explicites ci-dessus.
- **`before_agent_reply`** : s’exécute après les actions en ligne et avant l’appel au LLM, permettant à un plugin de revendiquer le tour et de renvoyer une réponse synthétique ou de rendre le tour entièrement silencieux.
- **`agent_end`** : inspecte la liste finale de messages et les métadonnées d’exécution après achèvement.
- **`before_compaction` / `after_compaction`** : observent ou annotent les cycles de compaction.
- **`before_tool_call` / `after_tool_call`** : interceptent les paramètres/résultats des outils.
- **`before_install`** : inspecte les résultats d’analyse intégrés et peut éventuellement bloquer l’installation de Skills ou de plugins.
- **`tool_result_persist`** : transforme de façon synchrone les résultats d’outil avant leur écriture dans la transcription de session.
- **`message_received` / `message_sending` / `message_sent`** : hooks de messages entrants + sortants.
- **`session_start` / `session_end`** : bornes du cycle de vie de la session.
- **`gateway_start` / `gateway_stop`** : événements de cycle de vie Gateway.

Règles de décision des hooks pour les garde-fous sortants/outils :

- `before_tool_call`: `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call`: `{ block: false }` est sans effet et n’efface pas un blocage antérieur.
- `before_install`: `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install`: `{ block: false }` est sans effet et n’efface pas un blocage antérieur.
- `message_sending`: `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending`: `{ cancel: false }` est sans effet et n’efface pas une annulation antérieure.

Voir [Hooks de plugin](/plugins/architecture#provider-runtime-hooks) pour l’API des hooks et les détails d’enregistrement.

## Streaming + réponses partielles

- Les deltas assistant sont diffusés depuis pi-agent-core et émis comme événements `assistant`.
- Le streaming par bloc peut émettre des réponses partielles soit sur `text_end`, soit sur `message_end`.
- Le streaming du raisonnement peut être émis comme flux séparé ou comme réponses par bloc.
- Voir [Streaming](/concepts/streaming) pour le découpage et le comportement des réponses par bloc.

## Exécution des outils + outils de messagerie

- Les événements de début/mise à jour/fin d’outil sont émis sur le flux `tool`.
- Les résultats d’outil sont assainis pour la taille et les charges utiles d’image avant journalisation/émission.
- Les envois par outils de messagerie sont suivis afin de supprimer les confirmations assistant en double.

## Mise en forme de la réponse + suppression

- Les charges utiles finales sont assemblées à partir de :
  - texte assistant (et raisonnement facultatif)
  - résumés d’outils en ligne (quand verbose + autorisé)
  - texte d’erreur assistant lorsque le modèle échoue
- Le jeton silencieux exact `NO_REPLY` / `no_reply` est filtré des
  charges utiles sortantes.
- Les doublons issus des outils de messagerie sont supprimés de la liste finale des charges utiles.
- S’il ne reste aucune charge utile affichable et qu’un outil a échoué, une réponse de secours d’erreur d’outil est émise
  (sauf si un outil de messagerie a déjà envoyé une réponse visible par l’utilisateur).

## Compaction + nouvelles tentatives

- La compaction automatique émet des événements de flux `compaction` et peut déclencher une nouvelle tentative.
- Lors d’une nouvelle tentative, les tampons en mémoire et les résumés d’outils sont réinitialisés pour éviter les sorties en double.
- Voir [Compaction](/concepts/compaction) pour le pipeline de compaction.

## Flux d’événements (aujourd’hui)

- `lifecycle` : émis par `subscribeEmbeddedPiSession` (et en secours par `agentCommand`)
- `assistant` : deltas diffusés en streaming depuis pi-agent-core
- `tool` : événements d’outil diffusés en streaming depuis pi-agent-core

## Gestion des canaux de chat

- Les deltas assistant sont mis en mémoire tampon dans des messages `delta` de chat.
- Un `final` de chat est émis sur **lifecycle end/error**.

## Délais d’expiration

- Valeur par défaut de `agent.wait` : 30s (attente uniquement). Le paramètre `timeoutMs` remplace cette valeur.
- Runtime d’agent : `agents.defaults.timeoutSeconds` vaut par défaut 172800s (48 heures) ; appliqué dans le minuteur d’annulation de `runEmbeddedPiAgent`.

## Cas de fin anticipée

- Délai d’expiration de l’agent (annulation)
- AbortSignal (annulation)
- Déconnexion Gateway ou expiration RPC
- Expiration de `agent.wait` (attente uniquement, n’arrête pas l’agent)

## Lié

- [Outils](/tools) — outils d’agent disponibles
- [Hooks](/automation/hooks) — scripts pilotés par événements déclenchés par les événements du cycle de vie de l’agent
- [Compaction](/concepts/compaction) — comment les longues conversations sont résumées
- [Approbations exec](/tools/exec-approvals) — garde-fous d’approbation pour les commandes shell
- [Thinking](/tools/thinking) — configuration du niveau de thinking/raisonnement
