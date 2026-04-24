---
read_when:
    - Vous avez besoin d’un déroulé exact de la boucle agent ou des événements de cycle de vie
    - Vous modifiez la mise en file des sessions, les écritures de transcriptions ou le comportement du verrou d’écriture de session
summary: Cycle de vie de la boucle agent, flux et sémantique d’attente
title: Boucle agent
x-i18n:
    generated_at: "2026-04-24T07:06:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: a413986168fe7eb1cb229e5ec45027d31fab889ca20ad53f289c8dfce98f7fab
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Boucle agent (OpenClaw)

Une boucle agentique est l’exécution complète et « réelle » d’un agent : ingestion → assemblage du contexte → inférence du modèle →
exécution d’outils → diffusion des réponses → persistance. C’est le chemin faisant autorité qui transforme un message
en actions et en réponse finale, tout en maintenant un état de session cohérent.

Dans OpenClaw, une boucle est une exécution unique, sérialisée par session, qui émet des événements de cycle de vie et de flux
pendant que le modèle réfléchit, appelle des outils et diffuse sa sortie. Ce document explique comment cette boucle authentique est
câblée de bout en bout.

## Points d’entrée

- Gateway RPC : `agent` et `agent.wait`.
- CLI : commande `agent`.

## Fonctionnement (vue d’ensemble)

1. La RPC `agent` valide les paramètres, résout la session (`sessionKey`/`sessionId`), persiste les métadonnées de session, puis renvoie immédiatement `{ runId, acceptedAt }`.
2. `agentCommand` exécute l’agent :
   - résout le modèle + les valeurs par défaut de thinking/verbose/trace
   - charge l’instantané des Skills
   - appelle `runEmbeddedPiAgent` (runtime pi-agent-core)
   - émet **lifecycle end/error** si la boucle embarquée n’en émet pas
3. `runEmbeddedPiAgent` :
   - sérialise les exécutions via des files par session + des files globales
   - résout le modèle + le profil d’authentification et construit la session Pi
   - s’abonne aux événements Pi et diffuse les deltas assistant/outils
   - applique le délai d’expiration -> interrompt l’exécution s’il est dépassé
   - renvoie les charges utiles + les métadonnées d’usage
4. `subscribeEmbeddedPiSession` fait le pont entre les événements pi-agent-core et le flux OpenClaw `agent` :
   - événements d’outil => `stream: "tool"`
   - deltas d’assistant => `stream: "assistant"`
   - événements de cycle de vie => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` utilise `waitForAgentRun` :
   - attend **lifecycle end/error** pour `runId`
   - renvoie `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Mise en file d’attente + concurrence

- Les exécutions sont sérialisées par clé de session (voie de session) et éventuellement via une voie globale.
- Cela évite les courses entre outils/sessions et garde l’historique de session cohérent.
- Les canaux de messagerie peuvent choisir des modes de file d’attente (collect/steer/followup) qui alimentent ce système de voies.
  Voir [File de commandes](/fr/concepts/queue).
- Les écritures de transcription sont aussi protégées par un verrou d’écriture de session sur le fichier de session. Le verrou est
  conscient du processus et basé sur des fichiers, ce qui lui permet de détecter les écrivains qui contournent la file en mémoire ou proviennent
  d’un autre processus.
- Les verrous d’écriture de session ne sont pas réentrants par défaut. Si un helper imbrique intentionnellement l’acquisition du
  même verrou tout en conservant un seul écrivain logique, il doit l’autoriser explicitement avec
  `allowReentrant: true`.

## Préparation de la session + de l’espace de travail

- L’espace de travail est résolu et créé ; les exécutions sandboxées peuvent rediriger vers une racine d’espace de travail sandboxée.
- Les Skills sont chargées (ou réutilisées depuis un instantané) et injectées dans l’environnement et le prompt.
- Les fichiers de bootstrap/contexte sont résolus et injectés dans le rapport du prompt système.
- Un verrou d’écriture de session est acquis ; `SessionManager` est ouvert et préparé avant la diffusion. Tout
  chemin ultérieur de réécriture de transcription, de Compaction ou de troncature doit prendre ce même verrou avant d’ouvrir ou de
  modifier le fichier de transcription.

## Assemblage du prompt + prompt système

- Le prompt système est construit à partir du prompt de base d’OpenClaw, du prompt Skills, du contexte bootstrap et des surcharges par exécution.
- Les limites spécifiques au modèle et les réserves de jetons pour la Compaction sont appliquées.
- Voir [Prompt système](/fr/concepts/system-prompt) pour ce que le modèle voit.

## Points d’accroche (où vous pouvez intercepter)

OpenClaw a deux systèmes de hooks :

- **Hooks internes** (hooks Gateway) : scripts pilotés par événements pour les commandes et les événements de cycle de vie.
- **Hooks de Plugin** : points d’extension à l’intérieur du cycle de vie agent/outil et du pipeline Gateway.

### Hooks internes (hooks Gateway)

- **`agent:bootstrap`** : s’exécute pendant la construction des fichiers bootstrap avant la finalisation du prompt système.
  Utilisez-le pour ajouter/supprimer des fichiers de contexte bootstrap.
- **Hooks de commande** : `/new`, `/reset`, `/stop`, et autres événements de commande (voir la documentation Hooks).

Voir [Hooks](/fr/automation/hooks) pour la configuration et les exemples.

### Hooks de Plugin (cycle de vie agent + Gateway)

Ils s’exécutent à l’intérieur de la boucle agent ou du pipeline Gateway :

- **`before_model_resolve`** : s’exécute avant la session (sans `messages`) pour surcharger de manière déterministe le fournisseur/modèle avant la résolution du modèle.
- **`before_prompt_build`** : s’exécute après le chargement de la session (avec `messages`) pour injecter `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` avant l’envoi du prompt. Utilisez `prependContext` pour du texte dynamique par tour et les champs de contexte système pour des consignes stables qui doivent se trouver dans l’espace du prompt système.
- **`before_agent_start`** : hook de compatibilité hérité qui peut s’exécuter dans l’une ou l’autre phase ; préférez les hooks explicites ci-dessus.
- **`before_agent_reply`** : s’exécute après les actions en ligne et avant l’appel LLM, permettant à un plugin de prendre en charge le tour et de renvoyer une réponse synthétique ou de rendre le tour entièrement silencieux.
- **`agent_end`** : inspecter la liste finale des messages et les métadonnées d’exécution après la fin.
- **`before_compaction` / `after_compaction`** : observer ou annoter les cycles de Compaction.
- **`before_tool_call` / `after_tool_call`** : intercepter les paramètres/résultats des outils.
- **`before_install`** : inspecter les résultats d’analyse intégrés et éventuellement bloquer les installations de Skills ou de plugins.
- **`tool_result_persist`** : transformer synchroniquement les résultats d’outils avant leur écriture dans une transcription de session détenue par OpenClaw.
- **`message_received` / `message_sending` / `message_sent`** : hooks de messages entrants + sortants.
- **`session_start` / `session_end`** : limites du cycle de vie de session.
- **`gateway_start` / `gateway_stop`** : événements du cycle de vie du Gateway.

Règles de décision des hooks pour les gardes sortants/outils :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call` : `{ block: false }` est une absence d’effet et n’annule pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install` : `{ block: false }` est une absence d’effet et n’annule pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending` : `{ cancel: false }` est une absence d’effet et n’annule pas une annulation antérieure.

Voir [Hooks de Plugin](/fr/plugins/architecture-internals#provider-runtime-hooks) pour l’API des hooks et les détails d’enregistrement.

Les harnais peuvent adapter ces hooks différemment. Le harnais app-server Codex conserve
les hooks de Plugin OpenClaw comme contrat de compatibilité pour les surfaces miroir
documentées, tandis que les hooks natifs Codex restent un mécanisme Codex de niveau inférieur distinct.

## Diffusion + réponses partielles

- Les deltas d’assistant sont diffusés depuis pi-agent-core et émis comme événements `assistant`.
- La diffusion par blocs peut émettre des réponses partielles soit sur `text_end`, soit sur `message_end`.
- La diffusion de raisonnement peut être émise comme flux séparé ou comme réponses par blocs.
- Voir [Diffusion](/fr/concepts/streaming) pour le découpage et le comportement des réponses par blocs.

## Exécution d’outils + outils de messagerie

- Les événements de début/mise à jour/fin d’outil sont émis sur le flux `tool`.
- Les résultats d’outils sont assainis pour la taille et les charges utiles d’image avant journalisation/émission.
- Les envois des outils de messagerie sont suivis pour éviter les confirmations dupliquées de l’assistant.

## Mise en forme de la réponse + suppression

- Les charges utiles finales sont assemblées à partir de :
  - texte de l’assistant (et raisonnement facultatif)
  - résumés d’outils en ligne (quand verbose + autorisé)
  - texte d’erreur de l’assistant quand le modèle échoue
- Le jeton silencieux exact `NO_REPLY` / `no_reply` est filtré des
  charges utiles sortantes.
- Les doublons d’outils de messagerie sont supprimés de la liste finale des charges utiles.
- S’il ne reste aucune charge utile rendable et qu’un outil a échoué, une réponse de secours d’erreur d’outil est émise
  (sauf si un outil de messagerie a déjà envoyé une réponse visible par l’utilisateur).

## Compaction + nouvelles tentatives

- La Compaction automatique émet des événements de flux `compaction` et peut déclencher une nouvelle tentative.
- Lors d’une nouvelle tentative, les tampons en mémoire et les résumés d’outils sont réinitialisés afin d’éviter une sortie dupliquée.
- Voir [Compaction](/fr/concepts/compaction) pour le pipeline de Compaction.

## Flux d’événements (aujourd’hui)

- `lifecycle` : émis par `subscribeEmbeddedPiSession` (et en secours par `agentCommand`)
- `assistant` : deltas diffusés depuis pi-agent-core
- `tool` : événements d’outils diffusés depuis pi-agent-core

## Gestion des canaux de chat

- Les deltas d’assistant sont mis en tampon dans des messages de chat `delta`.
- Un `final` de chat est émis sur **lifecycle end/error**.

## Délais d’expiration

- `agent.wait` par défaut : 30 s (attente uniquement). Le paramètre `timeoutMs` surcharge.
- Runtime de l’agent : `agents.defaults.timeoutSeconds` vaut par défaut 172800 s (48 heures) ; appliqué dans le minuteur d’interruption de `runEmbeddedPiAgent`.
- Délai d’inactivité du LLM : `agents.defaults.llm.idleTimeoutSeconds` interrompt une requête modèle lorsqu’aucun fragment de réponse n’arrive avant la fenêtre d’inactivité. Définissez-le explicitement pour les modèles locaux lents ou les fournisseurs avec raisonnement/appels d’outils ; définissez-le à 0 pour le désactiver. S’il n’est pas défini, OpenClaw utilise `agents.defaults.timeoutSeconds` lorsqu’il est configuré, sinon 120 s. Les exécutions déclenchées par Cron sans délai LLM ou agent explicite désactivent la surveillance d’inactivité et s’appuient sur le délai externe de Cron.

## Où les choses peuvent se terminer prématurément

- Délai d’expiration de l’agent (interruption)
- AbortSignal (annulation)
- Déconnexion du Gateway ou expiration RPC
- Expiration de `agent.wait` (attente uniquement, n’arrête pas l’agent)

## Articles connexes

- [Outils](/fr/tools) — outils d’agent disponibles
- [Hooks](/fr/automation/hooks) — scripts pilotés par événements déclenchés par les événements du cycle de vie de l’agent
- [Compaction](/fr/concepts/compaction) — comment les longues conversations sont résumées
- [Approbations Exec](/fr/tools/exec-approvals) — barrières d’approbation pour les commandes shell
- [Thinking](/fr/tools/thinking) — configuration du niveau de thinking/raisonnement
