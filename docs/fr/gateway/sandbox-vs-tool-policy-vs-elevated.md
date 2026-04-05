---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Pourquoi un outil est bloqué : runtime sandbox, politique allow/deny des outils et garde-fous elevated exec'
title: Sandbox vs politique d’outils vs Elevated
x-i18n:
    generated_at: "2026-04-05T12:43:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d5ddc1dbf02b89f18d46e5473ff0a29b8a984426fe2db7270c170f2de0cdeac
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox vs politique d’outils vs Elevated

OpenClaw a trois contrôles liés (mais différents) :

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) décide **où les outils s’exécutent** (Docker vs hôte).
2. **Politique d’outils** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) décide **quels outils sont disponibles/autorisés**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) est une **échappatoire réservée à exec** pour exécuter hors de la sandbox lorsque vous êtes en mode sandbox (`gateway` par défaut, ou `node` lorsque la cible exec est configurée sur `node`).

## Débogage rapide

Utilisez l’inspecteur pour voir ce qu’OpenClaw est _réellement_ en train de faire :

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Il affiche :

- le mode/la portée/l’accès à l’espace de travail effectifs de la sandbox
- si la session est actuellement en sandbox (main vs non-main)
- l’allow/deny effectif des outils dans la sandbox (et s’il provient de l’agent/global/par défaut)
- les garde-fous elevated et les chemins de clé de correction

## Sandbox : où les outils s’exécutent

Le sandboxing est contrôlé par `agents.defaults.sandbox.mode` :

- `"off"` : tout s’exécute sur l’hôte.
- `"non-main"` : seules les sessions non principales sont en sandbox (surprise fréquente pour les groupes/canaux).
- `"all"` : tout est en sandbox.

Voir [Sandboxing](/gateway/sandboxing) pour la matrice complète (portée, montages d’espace de travail, images).

### Bind mounts (vérification rapide de sécurité)

- `docker.binds` _perce_ le système de fichiers de la sandbox : tout ce que vous montez est visible à l’intérieur du conteneur avec le mode que vous définissez (`:ro` ou `:rw`).
- Le mode par défaut est lecture-écriture si vous omettez le mode ; préférez `:ro` pour le code source/les secrets.
- `scope: "shared"` ignore les bind mounts par agent (seuls les bind mounts globaux s’appliquent).
- OpenClaw valide les sources de bind deux fois : d’abord sur le chemin source normalisé, puis à nouveau après résolution via l’ancêtre existant le plus profond. Les échappements via parent de lien symbolique ne contournent pas les vérifications de chemin bloqué ou de racine autorisée.
- Les chemins feuille inexistants sont quand même vérifiés en toute sécurité. Si `/workspace/alias-out/new-file` se résout via un parent lié symboliquement vers un chemin bloqué ou hors des racines autorisées configurées, le bind est rejeté.
- Monter `/var/run/docker.sock` revient en pratique à donner le contrôle de l’hôte à la sandbox ; ne faites cela que délibérément.
- L’accès à l’espace de travail (`workspaceAccess: "ro"`/`"rw"`) est indépendant des modes de bind.

## Politique d’outils : quels outils existent/peuvent être appelés

Deux couches importent :

- **Profil d’outils** : `tools.profile` et `agents.list[].tools.profile` (allowlist de base)
- **Profil d’outils par fournisseur** : `tools.byProvider[provider].profile` et `agents.list[].tools.byProvider[provider].profile`
- **Politique d’outils globale/par agent** : `tools.allow`/`tools.deny` et `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Politique d’outils par fournisseur** : `tools.byProvider[provider].allow/deny` et `agents.list[].tools.byProvider[provider].allow/deny`
- **Politique d’outils de sandbox** (ne s’applique que lorsqu’on est en sandbox) : `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` et `agents.list[].tools.sandbox.tools.*`

Règles générales :

- `deny` l’emporte toujours.
- Si `allow` n’est pas vide, tout le reste est traité comme bloqué.
- La politique d’outils est l’arrêt ferme : `/exec` ne peut pas contourner un outil `exec` refusé.
- `/exec` ne modifie que les valeurs par défaut de session pour les expéditeurs autorisés ; il n’accorde pas l’accès aux outils.
  Les clés d’outil par fournisseur acceptent soit `provider` (par ex. `google-antigravity`), soit `provider/model` (par ex. `openai/gpt-5.4`).

### Groupes d’outils (raccourcis)

Les politiques d’outils (globales, par agent, sandbox) prennent en charge les entrées `group:*` qui se développent en plusieurs outils :

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
- `group:media` : `image`, `image_generate`, `tts`
- `group:openclaw` : tous les outils OpenClaw intégrés (exclut les plugins fournisseurs)

## Elevated : « exécuter sur l’hôte » réservé à exec

Elevated n’accorde **pas** d’outils supplémentaires ; il n’affecte que `exec`.

- Si vous êtes en sandbox, `/elevated on` (ou `exec` avec `elevated: true`) s’exécute hors de la sandbox (des approbations peuvent toujours s’appliquer).
- Utilisez `/elevated full` pour ignorer les approbations exec pour la session.
- Si vous exécutez déjà en direct, elevated est effectivement sans effet (mais reste protégé par des garde-fous).
- Elevated n’est **pas** à portée de Skills et ne remplace **pas** `allow`/`deny` des outils.
- Elevated n’accorde pas de surcharges croisées arbitraires depuis `host=auto` ; il suit les règles normales de cible exec et ne préserve `node` que lorsque la cible configurée/de session est déjà `node`.
- `/exec` est distinct de elevated. Il n’ajuste que les valeurs par défaut exec par session pour les expéditeurs autorisés.

Garde-fous :

- Activation : `tools.elevated.enabled` (et éventuellement `agents.list[].tools.elevated.enabled`)
- Allowlists d’expéditeurs : `tools.elevated.allowFrom.<provider>` (et éventuellement `agents.list[].tools.elevated.allowFrom.<provider>`)

Voir [Mode Elevated](/tools/elevated).

## Correctifs courants de « prison sandbox »

### « L’outil X est bloqué par la politique d’outils de sandbox »

Clés de correction (choisissez-en une) :

- Désactiver la sandbox : `agents.defaults.sandbox.mode=off` (ou par agent `agents.list[].sandbox.mode=off`)
- Autoriser l’outil dans la sandbox :
  - le supprimer de `tools.sandbox.tools.deny` (ou par agent `agents.list[].tools.sandbox.tools.deny`)
  - ou l’ajouter à `tools.sandbox.tools.allow` (ou à l’allow par agent)

### « Je pensais que c’était main, pourquoi est-ce en sandbox ? »

En mode `"non-main"`, les clés de groupe/canal ne sont _pas_ main. Utilisez la clé de session principale (affichée par `sandbox explain`) ou passez le mode à `"off"`.

## Voir aussi

- [Sandboxing](/gateway/sandboxing) -- référence complète du sandbox (modes, portées, backends, images)
- [Sandbox multi-agent et outils](/tools/multi-agent-sandbox-tools) -- surcharges par agent et priorité
- [Mode Elevated](/tools/elevated)
