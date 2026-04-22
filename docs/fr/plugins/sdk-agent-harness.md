---
read_when:
    - Vous modifiez le runtime d’agent intégré ou le registre de harnais.
    - Vous enregistrez un harnais d’agent à partir d’un Plugin groupé ou de confiance.
    - Vous devez comprendre comment le Plugin Codex se rapporte aux fournisseurs de modèles.
sidebarTitle: Agent Harness
summary: Surface SDK expérimentale pour les plugins qui remplacent l’exécuteur d’agent intégré de bas niveau
title: Plugins de harnais d’agent
x-i18n:
    generated_at: "2026-04-22T06:57:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 728fef59ae3cce29a3348842820f1f71a2eac98ae6b276179bce6c85d16613df
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Plugins de harnais d’agent

Un **harnais d’agent** est l’exécuteur de bas niveau pour un tour préparé d’un agent OpenClaw. Ce n’est ni un fournisseur de modèles, ni un canal, ni un registre d’outils.

Utilisez cette surface uniquement pour des plugins natifs groupés ou de confiance. Le contrat est encore expérimental, car les types de paramètres reflètent intentionnellement l’exécuteur intégré actuel.

## Quand utiliser un harnais

Enregistrez un harnais d’agent lorsqu’une famille de modèles a son propre runtime de session natif et que le transport normal du fournisseur OpenClaw est une mauvaise abstraction.

Exemples :

- un serveur d’agent de codage natif qui gère les threads et la Compaction
- une CLI ou un daemon local qui doit diffuser des événements natifs de planification/raisonnement/outils
- un runtime de modèle qui a besoin de son propre identifiant de reprise en plus de la transcription de session OpenClaw

N’enregistrez **pas** un harnais uniquement pour ajouter une nouvelle API LLM. Pour des API de modèles HTTP ou WebSocket normales, créez un [Plugin de fournisseur](/fr/plugins/sdk-provider-plugins).

## Ce que le cœur possède toujours

Avant qu’un harnais soit sélectionné, OpenClaw a déjà résolu :

- le fournisseur et le modèle
- l’état d’authentification du runtime
- le niveau de réflexion et le budget de contexte
- le fichier de transcription/session OpenClaw
- l’espace de travail, le sandbox et la politique d’outils
- les callbacks de réponse du canal et les callbacks de streaming
- la politique de basculement de modèle et de changement de modèle en direct

Cette séparation est intentionnelle. Un harnais exécute une tentative préparée ; il ne choisit pas les fournisseurs, ne remplace pas la livraison par canal et ne change pas silencieusement de modèle.

## Enregistrer un harnais

**Import :** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Politique de sélection

OpenClaw choisit un harnais après la résolution du fournisseur/modèle :

1. `OPENCLAW_AGENT_RUNTIME=<id>` force un harnais enregistré avec cet identifiant.
2. `OPENCLAW_AGENT_RUNTIME=pi` force le harnais PI intégré.
3. `OPENCLAW_AGENT_RUNTIME=auto` demande aux harnais enregistrés s’ils prennent en charge le fournisseur/modèle résolu.
4. Si aucun harnais enregistré ne correspond, OpenClaw utilise PI sauf si le repli vers PI est désactivé.

Les échecs des harnais de plugin apparaissent comme des échecs d’exécution. En mode `auto`, le repli vers PI n’est utilisé que lorsqu’aucun harnais de Plugin enregistré ne prend en charge le fournisseur/modèle résolu. Une fois qu’un harnais de Plugin a revendiqué une exécution, OpenClaw ne rejoue pas ce même tour via PI, car cela peut modifier la sémantique d’authentification/runtime ou dupliquer des effets de bord.

Le Plugin Codex groupé enregistre `codex` comme identifiant de son harnais. Le cœur traite cela comme un identifiant de harnais de plugin ordinaire ; les alias spécifiques à Codex appartiennent au plugin ou à la configuration de l’opérateur, pas au sélecteur de runtime partagé.

## Appairage fournisseur plus harnais

La plupart des harnais devraient aussi enregistrer un fournisseur. Le fournisseur rend les références de modèles, l’état d’authentification, les métadonnées du modèle et la sélection `/model` visibles au reste d’OpenClaw. Le harnais revendique ensuite ce fournisseur dans `supports(...)`.

Le Plugin Codex groupé suit ce modèle :

- id du fournisseur : `codex`
- références de modèles utilisateur : `codex/gpt-5.4`, `codex/gpt-5.2`, ou un autre modèle renvoyé par le serveur d’application Codex
- id du harnais : `codex`
- authentification : disponibilité synthétique du fournisseur, car le harnais Codex gère la connexion/session Codex native
- requête au serveur d’application : OpenClaw envoie l’id nu du modèle à Codex et laisse le harnais dialoguer avec le protocole natif du serveur d’application

Le Plugin Codex est additif. Les références simples `openai/gpt-*` restent des références du fournisseur OpenAI et continuent d’utiliser le chemin normal du fournisseur OpenClaw. Sélectionnez `codex/gpt-*` lorsque vous voulez une authentification gérée par Codex, la découverte de modèles Codex, des threads natifs et une exécution via le serveur d’application Codex. `/model` peut basculer entre les modèles Codex renvoyés par le serveur d’application Codex sans nécessiter d’identifiants du fournisseur OpenAI.

Pour la configuration opérateur, les exemples de préfixes de modèles et les configurations propres à Codex, voir [Harnais Codex](/fr/plugins/codex-harness).

OpenClaw exige le serveur d’application Codex `0.118.0` ou plus récent. Le Plugin Codex vérifie la poignée de main d’initialisation du serveur d’application et bloque les serveurs plus anciens ou sans version afin qu’OpenClaw ne s’exécute que sur la surface de protocole avec laquelle il a été testé.

### Mode harnais Codex natif

Le harnais `codex` groupé est le mode Codex natif pour les tours d’agent OpenClaw intégrés. Activez d’abord le plugin `codex` groupé, et incluez `codex` dans `plugins.allow` si votre configuration utilise une liste d’autorisation restrictive. Il est différent de `openai-codex/*` :

- `openai-codex/*` utilise l’OAuth ChatGPT/Codex via le chemin normal du fournisseur OpenClaw.
- `codex/*` utilise le fournisseur Codex groupé et achemine le tour via le serveur d’application Codex.

Lorsque ce mode s’exécute, Codex possède l’id natif du thread, le comportement de reprise, la Compaction et l’exécution du serveur d’application. OpenClaw possède toujours le canal de chat, le miroir visible de transcription, la politique d’outils, les approbations, la livraison des médias et la sélection de session. Utilisez `embeddedHarness.runtime: "codex"` avec `embeddedHarness.fallback: "none"` lorsque vous devez prouver que seul le chemin du serveur d’application Codex peut revendiquer l’exécution. Cette configuration n’est qu’une garde de sélection : les échecs du serveur d’application Codex échouent déjà directement au lieu de réessayer via PI.

## Désactiver le repli vers PI

Par défaut, OpenClaw exécute les agents intégrés avec `agents.defaults.embeddedHarness` défini sur `{ runtime: "auto", fallback: "pi" }`. En mode `auto`, des harnais de plugin enregistrés peuvent revendiquer une paire fournisseur/modèle. Si aucun ne correspond, OpenClaw se replie sur PI.

Définissez `fallback: "none"` lorsque vous devez faire échouer l’absence de sélection d’un harnais de plugin au lieu d’utiliser PI. Les échecs des harnais de plugin sélectionnés échouent déjà immédiatement. Cela ne bloque pas un `runtime: "pi"` explicite ni `OPENCLAW_AGENT_RUNTIME=pi`.

Pour des exécutions intégrées Codex uniquement :

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Si vous voulez que n’importe quel harnais de plugin enregistré puisse revendiquer des modèles correspondants mais ne voulez jamais qu’OpenClaw se replie silencieusement sur PI, conservez `runtime: "auto"` et désactivez le repli :

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Les remplacements par agent utilisent la même forme :

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` remplace toujours le runtime configuré. Utilisez `OPENCLAW_AGENT_HARNESS_FALLBACK=none` pour désactiver le repli vers PI depuis l’environnement.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Avec le repli désactivé, une session échoue tôt lorsque le harnais demandé n’est pas enregistré, ne prend pas en charge le fournisseur/modèle résolu ou échoue avant de produire des effets de bord du tour. C’est intentionnel pour les déploiements Codex uniquement et pour les tests en direct qui doivent prouver que le chemin du serveur d’application Codex est réellement utilisé.

Ce paramètre contrôle uniquement le harnais d’agent intégré. Il ne désactive pas le routage de modèles spécifique au fournisseur pour les images, vidéos, musiques, TTS, PDF ou autres.

## Sessions natives et miroir de transcription

Un harnais peut conserver un id de session natif, un id de thread ou un jeton de reprise côté daemon. Gardez cette liaison explicitement associée à la session OpenClaw, et continuez à refléter dans la transcription OpenClaw la sortie utilisateur visible de l’assistant/des outils.

La transcription OpenClaw reste la couche de compatibilité pour :

- l’historique de session visible par le canal
- la recherche et l’indexation de transcription
- le retour au harnais PI intégré à un tour ultérieur
- le comportement générique de `/new`, `/reset` et de suppression de session

Si votre harnais stocke une liaison sidecar, implémentez `reset(...)` afin qu’OpenClaw puisse l’effacer lorsque la session OpenClaw propriétaire est réinitialisée.

## Résultats d’outils et de médias

Le cœur construit la liste d’outils OpenClaw et la transmet à la tentative préparée. Lorsqu’un harnais exécute un appel d’outil dynamique, renvoyez le résultat de l’outil via la forme de résultat du harnais au lieu d’envoyer vous-même le média du canal.

Cela maintient les sorties de texte, image, vidéo, musique, TTS, approbation et outils de messagerie sur le même chemin de livraison que les exécutions soutenues par PI.

## Limitations actuelles

- Le chemin d’import public est générique, mais certains alias de type de tentative/résultat portent encore des noms `Pi` pour des raisons de compatibilité.
- L’installation de harnais tiers est expérimentale. Préférez les plugins de fournisseur jusqu’à ce que vous ayez besoin d’un runtime de session natif.
- Le changement de harnais est pris en charge d’un tour à l’autre. Ne changez pas de harnais au milieu d’un tour après le début d’outils natifs, d’approbations, de texte d’assistant ou d’envois de messages.

## Liens associés

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview)
- [Helpers de runtime](/fr/plugins/sdk-runtime)
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins)
- [Harnais Codex](/fr/plugins/codex-harness)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
