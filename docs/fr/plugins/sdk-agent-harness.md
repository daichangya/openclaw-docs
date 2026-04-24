---
read_when:
    - Vous modifiez le runtime d’agent intégré ou le registre de harnais
    - Vous enregistrez un harnais d’agent depuis un Plugin intégré ou de confiance
    - Vous devez comprendre comment le Plugin Codex se rattache aux providers de modèles
sidebarTitle: Agent Harness
summary: Surface SDK expérimentale pour les Plugins qui remplacent l’exécuteur d’agent intégré de bas niveau
title: Plugins de harnais d’agent
x-i18n:
    generated_at: "2026-04-24T07:23:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: af76c2a3ebe54c87920954b58126ee59538c0e6d3d1b4ba44890c1f5079fabc2
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Un **harnais d’agent** est l’exécuteur de bas niveau pour un tour d’agent OpenClaw
préparé. Ce n’est pas un provider de modèle, pas un canal, et pas un registre d’outils.

Utilisez cette surface uniquement pour des Plugins natifs intégrés ou de confiance. Le contrat est
encore expérimental car les types de paramètres reflètent volontairement le runner intégré actuel.

## Quand utiliser un harnais

Enregistrez un harnais d’agent lorsqu’une famille de modèles possède son propre runtime de session natif
et que le transport provider OpenClaw normal est une abstraction inadaptée.

Exemples :

- un serveur d’agent de code natif qui possède les threads et la Compaction
- un CLI local ou un daemon qui doit diffuser des événements natifs de plan/raisonnement/outils
- un runtime de modèle qui a besoin de son propre identifiant de reprise en plus de la
  transcription de session OpenClaw

N’enregistrez **pas** un harnais simplement pour ajouter une nouvelle API LLM. Pour les API de modèle HTTP ou
WebSocket normales, construisez un [Plugin de provider](/fr/plugins/sdk-provider-plugins).

## Ce que le cœur possède encore

Avant qu’un harnais soit sélectionné, OpenClaw a déjà résolu :

- provider et modèle
- état d’authentification d’exécution
- niveau de réflexion et budget de contexte
- la transcription OpenClaw / le fichier de session
- espace de travail, sandbox et politique d’outils
- callbacks de réponse de canal et callbacks de streaming
- politique de repli de modèle et de basculement de modèle en direct

Cette séparation est intentionnelle. Un harnais exécute une tentative préparée ; il ne choisit
pas les providers, ne remplace pas la livraison de canal, et ne change pas silencieusement de modèle.

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

OpenClaw choisit un harnais après la résolution du provider/modèle :

1. L’identifiant de harnais enregistré d’une session existante gagne, de sorte que les changements de config/env
   ne basculent pas à chaud cette transcription vers un autre runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` force un harnais enregistré avec cet identifiant pour
   les sessions qui ne sont pas déjà épinglées.
3. `OPENCLAW_AGENT_RUNTIME=pi` force le harnais PI intégré.
4. `OPENCLAW_AGENT_RUNTIME=auto` demande aux harnais enregistrés s’ils prennent en charge la
   paire provider/modèle résolue.
5. Si aucun harnais enregistré ne correspond, OpenClaw utilise PI sauf si le repli PI est
   désactivé.

Les échecs de harnais Plugin remontent comme échecs d’exécution. En mode `auto`, le repli PI
n’est utilisé que lorsqu’aucun harnais Plugin enregistré ne prend en charge la
paire provider/modèle résolue. Une fois qu’un harnais Plugin a revendiqué une exécution, OpenClaw ne
rejoue pas ce même tour via PI, car cela peut changer la sémantique d’authentification/d’exécution
ou dupliquer des effets de bord.

L’identifiant de harnais sélectionné est persisté avec l’identifiant de session après une exécution intégrée.
Les sessions héritées créées avant les épingles de harnais sont traitées comme épinglées PI une fois
qu’elles ont un historique de transcription. Utilisez une nouvelle session ou une réinitialisation lorsque vous changez entre PI et un harnais Plugin natif. `/status` affiche les identifiants de harnais non par défaut comme `codex`
à côté de `Fast` ; PI reste masqué car c’est le chemin de compatibilité par défaut.
Si le harnais sélectionné est surprenant, activez les journaux de débogage `agents/harness` et
inspectez l’enregistrement structuré `agent harness selected` du gateway. Il inclut
l’identifiant du harnais sélectionné, la raison de la sélection, la politique d’exécution/de repli, et, en mode
`auto`, le résultat de prise en charge de chaque candidat Plugin.

Le Plugin Codex intégré enregistre `codex` comme identifiant de harnais. Le cœur traite cela
comme un identifiant de harnais Plugin ordinaire ; les alias spécifiques à Codex doivent appartenir au Plugin
ou à la configuration de l’opérateur, pas au sélecteur d’exécution partagé.

## Appariement provider + harnais

La plupart des harnais devraient également enregistrer un provider. Le provider rend visibles au reste
d’OpenClaw les références de modèle, l’état d’authentification, les métadonnées de modèle et la sélection `/model`.
Le harnais revendique ensuite ce provider dans `supports(...)`.

Le Plugin Codex intégré suit ce modèle :

- identifiant provider : `codex`
- références de modèle utilisateur : `openai/gpt-5.5` plus `embeddedHarness.runtime: "codex"` ;
  les anciennes références `codex/gpt-*` restent acceptées pour compatibilité
- identifiant de harnais : `codex`
- auth : disponibilité synthétique du provider, car le harnais Codex possède la
  connexion/session Codex native
- requête app-server : OpenClaw envoie l’identifiant de modèle brut à Codex et laisse le
  harnais parler le protocole app-server natif

Le Plugin Codex est additif. Les références simples `openai/gpt-*` continuent à utiliser le
chemin provider OpenClaw normal à moins que vous ne forciez le harnais Codex avec
`embeddedHarness.runtime: "codex"`. Les anciennes références `codex/gpt-*` sélectionnent toujours le
provider et le harnais Codex pour compatibilité.

Pour la configuration opérateur, les exemples de préfixe de modèle et les configurations propres à Codex, voir
[Harnais Codex](/fr/plugins/codex-harness).

OpenClaw exige Codex app-server `0.118.0` ou plus récent. Le Plugin Codex vérifie
la poignée de main d’initialisation de l’app-server et bloque les serveurs plus anciens ou sans version afin que
OpenClaw ne s’exécute que contre la surface de protocole sur laquelle il a été testé.

### Middleware tool-result de Codex app-server

Les Plugins intégrés peuvent aussi attacher un middleware `tool_result` spécifique à Codex app-server via `api.registerCodexAppServerExtensionFactory(...)` lorsque leur
manifeste déclare `contracts.embeddedExtensionFactories: ["codex-app-server"]`.
Il s’agit de l’interface de Plugin de confiance pour les transformations asynchrones de résultat d’outil qui doivent
s’exécuter dans le harnais Codex natif avant que la sortie de l’outil ne soit reprojetée dans la transcription OpenClaw.

### Mode natif de harnais Codex

Le harnais intégré `codex` est le mode Codex natif pour les tours d’agent OpenClaw
intégrés. Activez d’abord le Plugin intégré `codex`, et incluez `codex` dans
`plugins.allow` si votre configuration utilise une liste d’autorisation restrictive. Les configurations app-server natives doivent utiliser `openai/gpt-*` avec `embeddedHarness.runtime: "codex"`.
Utilisez plutôt `openai-codex/*` pour Codex OAuth via PI. Les anciennes références de modèle `codex/*`
restent des alias de compatibilité pour le harnais natif.

Lorsque ce mode s’exécute, Codex possède l’identifiant de thread natif, le comportement de reprise,
la Compaction et l’exécution app-server. OpenClaw possède toujours le canal de chat,
le miroir de transcription visible, la politique d’outils, les approbations, la livraison média et la sélection de session. Utilisez `embeddedHarness.runtime: "codex"` avec
`embeddedHarness.fallback: "none"` lorsque vous devez prouver que seul le chemin
Codex app-server peut revendiquer l’exécution. Cette configuration n’est qu’un garde de sélection :
les échecs de Codex app-server échouent déjà directement au lieu d’être réessayés via PI.

## Désactiver le repli PI

Par défaut, OpenClaw exécute les agents intégrés avec `agents.defaults.embeddedHarness`
défini sur `{ runtime: "auto", fallback: "pi" }`. En mode `auto`, les harnais Plugin enregistrés
peuvent revendiquer une paire provider/modèle. Si aucun ne correspond, OpenClaw revient à PI.

Définissez `fallback: "none"` lorsque vous avez besoin qu’une sélection manquante de harnais Plugin échoue
au lieu d’utiliser PI. Les échecs de harnais Plugin sélectionnés échouent déjà en dur. Cela
ne bloque pas un `runtime: "pi"` explicite ni `OPENCLAW_AGENT_RUNTIME=pi`.

Pour des exécutions intégrées Codex uniquement :

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Si vous voulez qu’un harnais Plugin enregistré revendique les modèles correspondants mais que vous ne
voulez jamais qu’OpenClaw revienne silencieusement à PI, gardez `runtime: "auto"` et désactivez
le repli :

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

Les surcharges par agent utilisent la même forme :

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
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` remplace toujours le runtime configuré. Utilisez
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` pour désactiver le repli PI depuis
l’environnement.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Avec le repli désactivé, une session échoue tôt lorsque le harnais demandé n’est pas
enregistré, ne prend pas en charge la paire provider/modèle résolue, ou échoue avant
de produire des effets de bord de tour. C’est intentionnel pour les déploiements Codex-only et
pour les tests en direct qui doivent prouver que le chemin Codex app-server est réellement utilisé.

Ce paramètre ne contrôle que le harnais d’agent intégré. Il ne désactive pas
le routage provider spécifique pour les images, vidéos, musique, TTS, PDF ou autres.

## Sessions natives et miroir de transcription

Un harnais peut conserver un identifiant de session natif, un identifiant de thread, ou un jeton de reprise côté daemon.
Gardez cette liaison explicitement associée à la session OpenClaw, et continuez à
refléter dans la transcription OpenClaw la sortie d’assistant/d’outil visible par l’utilisateur.

La transcription OpenClaw reste la couche de compatibilité pour :

- l’historique de session visible par le canal
- la recherche et l’indexation de transcription
- le retour au harnais PI intégré sur un tour ultérieur
- le comportement générique de `/new`, `/reset` et de suppression de session

Si votre harnais stocke une liaison sidecar, implémentez `reset(...)` pour qu’OpenClaw puisse
l’effacer lorsque la session OpenClaw propriétaire est réinitialisée.

## Résultats d’outils et de médias

Le cœur construit la liste des outils OpenClaw et la transmet à la tentative préparée.
Lorsqu’un harnais exécute un appel d’outil dynamique, renvoyez le résultat de l’outil via
la forme de résultat du harnais au lieu d’envoyer vous-même le média au canal.

Cela garde les sorties texte, image, vidéo, musique, TTS, approbation et outil de messagerie
sur le même chemin de livraison que les exécutions adossées à PI.

## Limites actuelles

- Le chemin d’import public est générique, mais certains alias de type tentative/résultat portent encore
  des noms `Pi` pour compatibilité.
- L’installation de harnais tiers est expérimentale. Préférez les Plugins de provider
  tant que vous n’avez pas besoin d’un runtime de session natif.
- Le basculement de harnais est pris en charge entre les tours. Ne changez pas de harnais au
  milieu d’un tour après le démarrage d’outils natifs, d’approbations, de texte d’assistant ou d’envois de message.

## Lié

- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview)
- [Helpers d’exécution](/fr/plugins/sdk-runtime)
- [Plugins de provider](/fr/plugins/sdk-provider-plugins)
- [Harnais Codex](/fr/plugins/codex-harness)
- [Providers de modèles](/fr/concepts/model-providers)
