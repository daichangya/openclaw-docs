---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Pourquoi un outil est bloqué : runtime sandbox, stratégie allow/deny des outils et contrôles exec Elevated'
title: Sandbox vs stratégie d’outil vs Elevated
x-i18n:
    generated_at: "2026-04-21T06:59:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: a85378343df0594be451212cb4c95b349a0cc7cd1f242b9306be89903a450db1
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox vs stratégie d’outil vs Elevated

OpenClaw dispose de trois contrôles liés (mais différents) :

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) décide **où les outils s’exécutent** (backend sandbox vs hôte).
2. **Stratégie d’outil** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) décide **quels outils sont disponibles/autorisés**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) est une **porte de sortie réservée à exec** pour s’exécuter hors du sandbox lorsque vous êtes sandboxé (`gateway` par défaut, ou `node` lorsque la cible exec est configurée sur `node`).

## Débogage rapide

Utilisez l’inspecteur pour voir ce qu’OpenClaw fait _réellement_ :

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Il affiche :

- le mode/scope/accès workspace effectifs du sandbox
- si la session est actuellement sandboxée (main vs non-main)
- l’autorisation/le refus effectif des outils du sandbox (et si cela vient de l’agent/global/par défaut)
- les contrôles Elevated et les chemins de clés correctifs

## Sandbox : où les outils s’exécutent

Le sandboxing est contrôlé par `agents.defaults.sandbox.mode` :

- `"off"` : tout s’exécute sur l’hôte.
- `"non-main"` : seules les sessions non principales sont sandboxées (surprise fréquente pour les groupes/canaux).
- `"all"` : tout est sandboxé.

Voir [Sandboxing](/fr/gateway/sandboxing) pour la matrice complète (scope, montages workspace, images).

### Bind mounts (contrôle de sécurité rapide)

- `docker.binds` _perce_ le système de fichiers du sandbox : tout ce que vous montez est visible dans le conteneur avec le mode que vous définissez (`:ro` ou `:rw`).
- Par défaut, c’est en lecture-écriture si vous omettez le mode ; préférez `:ro` pour les sources/secrets.
- `scope: "shared"` ignore les binds par agent (seuls les binds globaux s’appliquent).
- OpenClaw valide deux fois les sources de bind : d’abord sur le chemin source normalisé, puis à nouveau après résolution via l’ancêtre existant le plus profond. Les échappements via parent symlink ne contournent pas les vérifications de chemin bloqué ou de racine autorisée.
- Les chemins feuilles inexistants sont quand même vérifiés en toute sécurité. Si `/workspace/alias-out/new-file` se résout via un parent symlinké vers un chemin bloqué ou en dehors des racines autorisées configurées, le bind est rejeté.
- Monter `/var/run/docker.sock` revient pratiquement à donner le contrôle de l’hôte au sandbox ; ne le faites qu’intentionnellement.
- L’accès workspace (`workspaceAccess: "ro"`/`"rw"`) est indépendant des modes de bind.

## Stratégie d’outil : quels outils existent / peuvent être appelés

Deux couches comptent :

- **Profil d’outils** : `tools.profile` et `agents.list[].tools.profile` (liste d’autorisation de base)
- **Profil d’outils provider** : `tools.byProvider[provider].profile` et `agents.list[].tools.byProvider[provider].profile`
- **Stratégie d’outil globale/par agent** : `tools.allow`/`tools.deny` et `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Stratégie d’outil provider** : `tools.byProvider[provider].allow/deny` et `agents.list[].tools.byProvider[provider].allow/deny`
- **Stratégie d’outil sandbox** (s’applique uniquement en mode sandbox) : `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` et `agents.list[].tools.sandbox.tools.*`

Règles pratiques :

- `deny` l’emporte toujours.
- Si `allow` n’est pas vide, tout le reste est considéré comme bloqué.
- La stratégie d’outil est l’arrêt strict : `/exec` ne peut pas contourner un outil `exec` refusé.
- `/exec` modifie seulement les valeurs par défaut de session pour les expéditeurs autorisés ; il n’accorde pas l’accès aux outils.
  Les clés d’outils provider acceptent soit `provider` (par ex. `google-antigravity`) soit `provider/model` (par ex. `openai/gpt-5.4`).

### Groupes d’outils (raccourcis)

Les stratégies d’outils (globales, agent, sandbox) prennent en charge des entrées `group:*` qui s’étendent à plusieurs outils :

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

Groupes disponibles :

- `group:runtime` : `exec`, `process`, `code_execution` (`bash` est accepté comme
  alias de `exec`)
- `group:fs` : `read`, `write`, `edit`, `apply_patch`
- `group:sessions` : `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory` : `memory_search`, `memory_get`
- `group:web` : `web_search`, `x_search`, `web_fetch`
- `group:ui` : `browser`, `canvas`
- `group:automation` : `cron`, `gateway`
- `group:messaging` : `message`
- `group:nodes` : `nodes`
- `group:agents` : `agents_list`
- `group:media` : `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw` : tous les outils intégrés d’OpenClaw (hors plugins provider)

## Elevated : « exécuter sur l’hôte » réservé à exec

Elevated n’accorde **pas** d’outils supplémentaires ; il n’affecte que `exec`.

- Si vous êtes sandboxé, `/elevated on` (ou `exec` avec `elevated: true`) s’exécute hors du sandbox (des approbations peuvent encore s’appliquer).
- Utilisez `/elevated full` pour ignorer les approbations exec pour la session.
- Si vous vous exécutez déjà directement, Elevated est en pratique sans effet (mais reste soumis à contrôle).
- Elevated n’est **pas** limité par Skill et ne contourne **pas** les règles allow/deny des outils.
- Elevated n’accorde pas de remplacements inter-hôtes arbitraires depuis `host=auto` ; il suit les règles normales de cible exec et ne préserve `node` que lorsque la cible configurée/de session est déjà `node`.
- `/exec` est distinct d’Elevated. Il ajuste seulement les valeurs exec par session pour les expéditeurs autorisés.

Contrôles :

- Activation : `tools.elevated.enabled` (et éventuellement `agents.list[].tools.elevated.enabled`)
- Listes d’autorisation d’expéditeurs : `tools.elevated.allowFrom.<provider>` (et éventuellement `agents.list[].tools.elevated.allowFrom.<provider>`)

Voir [Mode Elevated](/fr/tools/elevated).

## Correctifs courants du « sandbox jail »

### « Outil X bloqué par la stratégie d’outil du sandbox »

Clés correctives (choisissez-en une) :

- Désactiver le sandbox : `agents.defaults.sandbox.mode=off` (ou par agent `agents.list[].sandbox.mode=off`)
- Autoriser l’outil dans le sandbox :
  - le retirer de `tools.sandbox.tools.deny` (ou par agent `agents.list[].tools.sandbox.tools.deny`)
  - ou l’ajouter à `tools.sandbox.tools.allow` (ou à l’autorisation par agent)

### « Je pensais que c’était main, pourquoi est-ce sandboxé ? »

En mode `"non-main"`, les clés de groupe/canal ne sont _pas_ principales. Utilisez la clé de session principale (affichée par `sandbox explain`) ou passez le mode à `"off"`.

## Voir aussi

- [Sandboxing](/fr/gateway/sandboxing) -- référence complète du sandbox (modes, scopes, backends, images)
- [Sandbox & outils multi-agent](/fr/tools/multi-agent-sandbox-tools) -- remplacements par agent et ordre de priorité
- [Mode Elevated](/fr/tools/elevated)
