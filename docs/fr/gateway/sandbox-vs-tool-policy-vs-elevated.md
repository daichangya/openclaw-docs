---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Pourquoi un outil est bloqué : runtime sandbox, politique d''autorisation/refus des outils et contrôles d''exécution élevée'
title: Sandbox vs politique des outils vs Elevated
x-i18n:
    generated_at: "2026-04-06T03:07:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 331f5b2f0d5effa1320125d9f29948e16d0deaffa59eb1e4f25a63481cbe22d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox vs politique des outils vs Elevated

OpenClaw a trois contrôles liés (mais différents) :

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) détermine **où les outils s'exécutent** (Docker vs hôte).
2. **Politique des outils** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) détermine **quels outils sont disponibles/autorisés**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) est une **échappatoire réservée à exec** pour s'exécuter hors de la sandbox lorsque vous êtes en sandbox (`gateway` par défaut, ou `node` lorsque la cible exec est configurée sur `node`).

## Débogage rapide

Utilisez l'inspecteur pour voir ce que OpenClaw fait _réellement_ :

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Il affiche :

- le mode/la portée/l'accès à l'espace de travail effectifs de la sandbox
- si la session est actuellement en sandbox (main vs non-main)
- l'autorisation/le refus effectifs des outils en sandbox (et si cela provient de l'agent/global/par défaut)
- les contrôles Elevated et les chemins de clé de correction

## Sandbox : où les outils s'exécutent

La sandbox est contrôlée par `agents.defaults.sandbox.mode` :

- `"off"` : tout s'exécute sur l'hôte.
- `"non-main"` : seules les sessions non-main sont en sandbox (surprise fréquente pour les groupes/canaux).
- `"all"` : tout est en sandbox.

Voir [Sandboxing](/fr/gateway/sandboxing) pour la matrice complète (portée, montages d'espace de travail, images).

### Montages bind (vérification de sécurité rapide)

- `docker.binds` _perce_ le système de fichiers de la sandbox : tout ce que vous montez est visible dans le conteneur avec le mode que vous définissez (`:ro` ou `:rw`).
- Par défaut, le mode est lecture-écriture si vous l'omettez ; préférez `:ro` pour le code source/les secrets.
- `scope: "shared"` ignore les binds par agent (seuls les binds globaux s'appliquent).
- OpenClaw valide deux fois les sources de bind : d'abord sur le chemin source normalisé, puis à nouveau après résolution via l'ancêtre existant le plus profond. Les échappements par parent symlink ne contournent pas les vérifications de chemin bloqué ou de racine autorisée.
- Les chemins feuille inexistants sont toujours vérifiés de manière sûre. Si `/workspace/alias-out/new-file` se résout via un parent symlinké vers un chemin bloqué ou en dehors des racines autorisées configurées, le bind est rejeté.
- Monter `/var/run/docker.sock` donne effectivement le contrôle de l'hôte à la sandbox ; ne le faites qu'intentionnellement.
- L'accès à l'espace de travail (`workspaceAccess: "ro"`/`"rw"`) est indépendant des modes de bind.

## Politique des outils : quels outils existent/peuvent être appelés

Deux couches sont importantes :

- **Profil d'outils** : `tools.profile` et `agents.list[].tools.profile` (liste d'autorisation de base)
- **Profil d'outils par fournisseur** : `tools.byProvider[provider].profile` et `agents.list[].tools.byProvider[provider].profile`
- **Politique globale/par agent des outils** : `tools.allow`/`tools.deny` et `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Politique d'outils par fournisseur** : `tools.byProvider[provider].allow/deny` et `agents.list[].tools.byProvider[provider].allow/deny`
- **Politique d'outils de sandbox** (s'applique uniquement en sandbox) : `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` et `agents.list[].tools.sandbox.tools.*`

Règles générales :

- `deny` l'emporte toujours.
- Si `allow` n'est pas vide, tout le reste est considéré comme bloqué.
- La politique des outils est l'arrêt strict : `/exec` ne peut pas contourner un outil `exec` refusé.
- `/exec` ne modifie que les valeurs par défaut de session pour les expéditeurs autorisés ; il n'accorde pas l'accès aux outils.
  Les clés d'outils par fournisseur acceptent soit `provider` (par exemple `google-antigravity`), soit `provider/model` (par exemple `openai/gpt-5.4`).

### Groupes d'outils (raccourcis)

Les politiques d'outils (globales, par agent, sandbox) prennent en charge des entrées `group:*` qui se développent en plusieurs outils :

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

Groupes disponibles :

- `group:runtime` : `exec`, `process`, `code_execution` (`bash` est accepté comme
  alias de `exec`)
- `group:fs` : `read`, `write`, `edit`, `apply_patch`
- `group:sessions` : `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory` : `memory_search`, `memory_get`
- `group:web` : `web_search`, `x_search`, `web_fetch`
- `group:ui` : `browser`, `canvas`
- `group:automation` : `cron`, `gateway`
- `group:messaging` : `message`
- `group:nodes` : `nodes`
- `group:agents` : `agents_list`
- `group:media` : `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw` : tous les outils OpenClaw intégrés (exclut les plugins fournisseurs)

## Elevated : « s'exécuter sur l'hôte » réservé à exec

Elevated n'accorde **pas** d'outils supplémentaires ; il affecte seulement `exec`.

- Si vous êtes en sandbox, `/elevated on` (ou `exec` avec `elevated: true`) s'exécute hors de la sandbox (des approbations peuvent toujours s'appliquer).
- Utilisez `/elevated full` pour ignorer les approbations exec pour la session.
- Si vous vous exécutez déjà directement, elevated est en pratique sans effet (mais reste contrôlé).
- Elevated n'est **pas** limité à un skill et ne remplace **pas** les autorisations/refus d'outils.
- Elevated n'accorde pas de remplacements arbitraires entre hôtes à partir de `host=auto` ; il suit les règles normales de cible exec et ne conserve `node` que lorsque la cible configurée/de session est déjà `node`.
- `/exec` est distinct de elevated. Il ajuste seulement les valeurs par défaut exec par session pour les expéditeurs autorisés.

Contrôles :

- Activation : `tools.elevated.enabled` (et éventuellement `agents.list[].tools.elevated.enabled`)
- Listes d'autorisation d'expéditeurs : `tools.elevated.allowFrom.<provider>` (et éventuellement `agents.list[].tools.elevated.allowFrom.<provider>`)

Voir [Elevated Mode](/fr/tools/elevated).

## Correctifs fréquents pour la « prison sandbox »

### « Outil X bloqué par la politique d'outils de la sandbox »

Clés de correction (choisissez-en une) :

- Désactiver la sandbox : `agents.defaults.sandbox.mode=off` (ou par agent `agents.list[].sandbox.mode=off`)
- Autoriser l'outil dans la sandbox :
  - le retirer de `tools.sandbox.tools.deny` (ou par agent `agents.list[].tools.sandbox.tools.deny`)
  - ou l'ajouter à `tools.sandbox.tools.allow` (ou à l'autorisation par agent)

### « Je pensais que c'était main, pourquoi est-ce en sandbox ? »

En mode `"non-main"`, les clés de groupe/canal ne sont _pas_ main. Utilisez la clé de session main (affichée par `sandbox explain`) ou passez le mode sur `"off"`.

## Voir aussi

- [Sandboxing](/fr/gateway/sandboxing) -- référence complète de la sandbox (modes, portées, backends, images)
- [Sandbox et outils multi-agent](/fr/tools/multi-agent-sandbox-tools) -- remplacements par agent et priorité
- [Elevated Mode](/fr/tools/elevated)
