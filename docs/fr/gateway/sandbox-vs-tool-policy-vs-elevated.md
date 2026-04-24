---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Pourquoi un outil est bloqué : runtime sandbox, politique d’autorisation/refus des outils, et barrières d’exécution élevée'
title: Sandbox vs politique d’outils vs elevated
x-i18n:
    generated_at: "2026-04-24T07:12:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 74bb73023a3f7a85a0c020b2e8df69610ab8f8e60f8ab6142f8da7810dc08429
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

OpenClaw dispose de trois contrôles liés (mais différents) :

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) décide **où les outils s’exécutent** (backend sandbox vs hôte).
2. **Politique d’outils** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) décide **quels outils sont disponibles/autorisés**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) est une **échappatoire réservée à exec** pour s’exécuter hors du sandbox lorsque vous êtes sandboxé (`gateway` par défaut, ou `node` lorsque la cible exec est configurée sur `node`).

## Débogage rapide

Utilisez l’inspecteur pour voir ce qu’OpenClaw fait _réellement_ :

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Il affiche :

- le mode/la portée/l’accès à l’espace de travail effectifs du sandbox
- si la session est actuellement sandboxée (main vs non-main)
- l’autorisation/le refus effectif des outils du sandbox (et si cela provient de l’agent/global/par défaut)
- les barrières elevated et les chemins de clé de correction

## Sandbox : où les outils s’exécutent

Le sandboxing est contrôlé par `agents.defaults.sandbox.mode` :

- `"off"` : tout s’exécute sur l’hôte.
- `"non-main"` : seules les sessions non-main sont sandboxées (surprise fréquente pour les groupes/canaux).
- `"all"` : tout est sandboxé.

Voir [Sandboxing](/fr/gateway/sandboxing) pour la matrice complète (portée, montages d’espace de travail, images).

### Montages bind (vérification de sécurité rapide)

- `docker.binds` _perce_ le système de fichiers du sandbox : tout ce que vous montez est visible à l’intérieur du conteneur avec le mode que vous définissez (`:ro` ou `:rw`).
- Le mode par défaut est lecture-écriture si vous l’omettez ; préférez `:ro` pour le code source/les secrets.
- `scope: "shared"` ignore les montages bind par agent (seuls les montages globaux s’appliquent).
- OpenClaw valide les sources bind deux fois : d’abord sur le chemin source normalisé, puis à nouveau après résolution via l’ancêtre existant le plus profond. Les échappements par parent symbolique ne contournent pas les vérifications de chemin bloqué ou de racine autorisée.
- Les chemins feuille inexistants sont tout de même vérifiés en sécurité. Si `/workspace/alias-out/new-file` se résout via un parent symbolique vers un chemin bloqué ou hors des racines autorisées configurées, le bind est rejeté.
- Monter `/var/run/docker.sock` revient en pratique à donner le contrôle de l’hôte au sandbox ; ne le faites que volontairement.
- L’accès à l’espace de travail (`workspaceAccess: "ro"`/`"rw"`) est indépendant des modes bind.

## Politique d’outils : quels outils existent/peuvent être appelés

Deux couches comptent :

- **Profil d’outils** : `tools.profile` et `agents.list[].tools.profile` (liste d’autorisation de base)
- **Profil d’outils par provider** : `tools.byProvider[provider].profile` et `agents.list[].tools.byProvider[provider].profile`
- **Politique d’outils globale/par agent** : `tools.allow`/`tools.deny` et `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Politique d’outils par provider** : `tools.byProvider[provider].allow/deny` et `agents.list[].tools.byProvider[provider].allow/deny`
- **Politique d’outils du sandbox** (ne s’applique que lorsque c’est sandboxé) : `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` et `agents.list[].tools.sandbox.tools.*`

Règles générales :

- `deny` gagne toujours.
- Si `allow` n’est pas vide, tout le reste est traité comme bloqué.
- La politique d’outils est l’arrêt strict : `/exec` ne peut pas contourner un outil `exec` refusé.
- `/exec` ne change que les paramètres de session par défaut pour les expéditeurs autorisés ; il n’accorde pas l’accès aux outils.
  Les clés d’outils par provider acceptent soit `provider` (par ex. `google-antigravity`), soit `provider/model` (par ex. `openai/gpt-5.4`).

### Groupes d’outils (raccourcis)

Les politiques d’outils (globales, agent, sandbox) prennent en charge les entrées `group:*` qui se développent en plusieurs outils :

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

- `group:runtime` : `exec`, `process`, `code_execution` (`bash` est accepté comme alias de `exec`)
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
- `group:openclaw` : tous les outils OpenClaw intégrés (hors Plugins provider)

## Elevated : « exécuter sur l’hôte » réservé à exec

Elevated n’accorde **pas** d’outils supplémentaires ; il n’affecte que `exec`.

- Si vous êtes sandboxé, `/elevated on` (ou `exec` avec `elevated: true`) s’exécute hors du sandbox (des approbations peuvent toujours s’appliquer).
- Utilisez `/elevated full` pour ignorer les approbations exec pour la session.
- Si vous vous exécutez déjà directement, elevated est en pratique sans effet (mais reste soumis aux barrières).
- Elevated n’est **pas** limité aux Skills et ne remplace **pas** les règles allow/deny des outils.
- Elevated n’accorde pas de surcharge arbitraire inter-hôtes depuis `host=auto` ; il suit les règles normales de cible exec et ne préserve `node` que lorsque la cible configurée/de session est déjà `node`.
- `/exec` est distinct d’elevated. Il ne fait qu’ajuster les valeurs par défaut exec par session pour les expéditeurs autorisés.

Barrières :

- Activation : `tools.elevated.enabled` (et éventuellement `agents.list[].tools.elevated.enabled`)
- Listes d’autorisation d’expéditeurs : `tools.elevated.allowFrom.<provider>` (et éventuellement `agents.list[].tools.elevated.allowFrom.<provider>`)

Voir [Mode Elevated](/fr/tools/elevated).

## Corrections fréquentes de « prison sandbox »

### « Outil X bloqué par la politique d’outils du sandbox »

Clés de correction (choisissez-en une) :

- Désactiver le sandbox : `agents.defaults.sandbox.mode=off` (ou par agent `agents.list[].sandbox.mode=off`)
- Autoriser l’outil dans le sandbox :
  - le retirer de `tools.sandbox.tools.deny` (ou par agent `agents.list[].tools.sandbox.tools.deny`)
  - ou l’ajouter à `tools.sandbox.tools.allow` (ou à l’autorisation par agent)

### « Je pensais que c’était main, pourquoi est-ce sandboxé ? »

En mode `"non-main"`, les clés de groupe/canal ne sont _pas_ main. Utilisez la clé de session main (affichée par `sandbox explain`) ou passez le mode à `"off"`.

## Lié

- [Sandboxing](/fr/gateway/sandboxing) -- référence complète du sandbox (modes, portées, backends, images)
- [Sandbox & outils multi-agents](/fr/tools/multi-agent-sandbox-tools) -- surcharges par agent et ordre de priorité
- [Mode Elevated](/fr/tools/elevated)
