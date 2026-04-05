---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: « Sandbox et restrictions d'outils par agent, priorité et exemples »
title: Sandbox et outils multi-agents
x-i18n:
    generated_at: "2026-04-05T12:57:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07985f7c8fae860a7b9bf685904903a4a8f90249e95e4179cf0775a1208c0597
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Configuration du sandbox et des outils multi-agents

Chaque agent dans une configuration multi-agents peut remplacer la politique
globale de sandbox et d'outils. Cette page couvre la configuration par agent, les règles de priorité et des
exemples.

- **Backends et modes de sandbox** : voir [Sandboxing](/fr/gateway/sandboxing).
- **Débogage des outils bloqués** : voir [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) et `openclaw sandbox explain`.
- **Exec élevé** : voir [Elevated Mode](/tools/elevated).

L'authentification est propre à chaque agent : chaque agent lit depuis son propre stockage d'authentification `agentDir` à l'emplacement
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Les identifiants **ne sont pas** partagés entre les agents. Ne réutilisez jamais `agentDir` entre agents.
Si vous voulez partager des identifiants, copiez `auth-profiles.json` dans le `agentDir` de l'autre agent.

---

## Exemples de configuration

### Exemple 1 : agent personnel + agent familial restreint

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Personal Assistant",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**Résultat :**

- agent `main` : s'exécute sur l'hôte, accès complet aux outils
- agent `family` : s'exécute dans Docker (un conteneur par agent), outil `read` uniquement

---

### Exemple 2 : agent de travail avec sandbox partagé

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### Exemple 2b : profil global de développement + agent réservé à la messagerie

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**Résultat :**

- les agents par défaut obtiennent les outils de développement
- l'agent `support` est limité à la messagerie (+ outil Slack)

---

### Exemple 3 : modes de sandbox différents par agent

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Valeur globale par défaut
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Remplacement : main n'est jamais sandboxé
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Remplacement : public est toujours sandboxé
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## Priorité de la configuration

Lorsque des configurations globales (`agents.defaults.*`) et spécifiques à l'agent (`agents.list[].*`) existent :

### Configuration du sandbox

Les paramètres spécifiques à l'agent remplacent les paramètres globaux :

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Remarques :**

- `agents.list[].sandbox.{docker,browser,prune}.*` remplace `agents.defaults.sandbox.{docker,browser,prune}.*` pour cet agent (ignoré lorsque la portée du sandbox se résout à `"shared"`).

### Restrictions d'outils

L'ordre de filtrage est :

1. **Profil d'outils** (`tools.profile` ou `agents.list[].tools.profile`)
2. **Profil d'outils du fournisseur** (`tools.byProvider[provider].profile` ou `agents.list[].tools.byProvider[provider].profile`)
3. **Politique globale d'outils** (`tools.allow` / `tools.deny`)
4. **Politique d'outils du fournisseur** (`tools.byProvider[provider].allow/deny`)
5. **Politique d'outils spécifique à l'agent** (`agents.list[].tools.allow/deny`)
6. **Politique de fournisseur de l'agent** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Politique d'outils du sandbox** (`tools.sandbox.tools` ou `agents.list[].tools.sandbox.tools`)
8. **Politique d'outils du subagent** (`tools.subagents.tools`, le cas échéant)

Chaque niveau peut restreindre davantage les outils, mais ne peut pas réaccorder des outils refusés par des niveaux précédents.
Si `agents.list[].tools.sandbox.tools` est défini, il remplace `tools.sandbox.tools` pour cet agent.
Si `agents.list[].tools.profile` est défini, il remplace `tools.profile` pour cet agent.
Les clés d'outils du fournisseur acceptent soit `provider` (par ex. `google-antigravity`), soit `provider/model` (par ex. `openai/gpt-5.4`).

Les politiques d'outils prennent en charge les raccourcis `group:*` qui se développent en plusieurs outils. Voir [Tool groups](/fr/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) pour la liste complète.

Les remplacements élevés par agent (`agents.list[].tools.elevated`) peuvent restreindre davantage l'exec élevé pour des agents spécifiques. Voir [Elevated Mode](/tools/elevated) pour les détails.

---

## Migration depuis un agent unique

**Avant (agent unique) :**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**Après (multi-agents avec profils différents) :**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

Les anciennes configurations `agent.*` sont migrées par `openclaw doctor` ; préférez désormais `agents.defaults` + `agents.list`.

---

## Exemples de restriction d'outils

### Agent en lecture seule

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Agent d'exécution sûre (sans modification de fichiers)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Agent réservé à la communication

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

`sessions_history` dans ce profil renvoie toujours une vue de rappel limitée et assainie
plutôt qu'un dump brut de transcription. Le rappel assistant supprime les balises de réflexion,
l'échafaudage `<relevant-memories>`, les charges utiles XML d'appel d'outil en texte brut
(y compris `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` et les blocs d'appel d'outil tronqués),
l'échafaudage d'appel d'outil dégradé, les jetons de contrôle de modèle ASCII/pleine largeur divulgués,
et le XML d'appel d'outil MiniMax mal formé avant la rédaction/troncature.

---

## Piège courant : "non-main"

`agents.defaults.sandbox.mode: "non-main"` repose sur `session.mainKey` (valeur par défaut `"main"`),
et non sur l'id de l'agent. Les sessions de groupe/canal obtiennent toujours leurs propres clés, elles
sont donc traitées comme non-main et seront sandboxées. Si vous voulez qu'un agent ne soit jamais
sandboxé, définissez `agents.list[].sandbox.mode: "off"`.

---

## Tests

Après avoir configuré le sandbox et les outils multi-agents :

1. **Vérifiez la résolution des agents :**

   ```exec
   openclaw agents list --bindings
   ```

2. **Vérifiez les conteneurs de sandbox :**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Testez les restrictions d'outils :**
   - Envoyez un message nécessitant des outils restreints
   - Vérifiez que l'agent ne peut pas utiliser les outils refusés

4. **Surveillez les journaux :**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Dépannage

### L'agent n'est pas sandboxé malgré `mode: "all"`

- Vérifiez s'il existe un `agents.defaults.sandbox.mode` global qui le remplace
- La configuration spécifique à l'agent a priorité, donc définissez `agents.list[].sandbox.mode: "all"`

### Les outils restent disponibles malgré la liste deny

- Vérifiez l'ordre de filtrage des outils : global → agent → sandbox → subagent
- Chaque niveau ne peut que restreindre davantage, pas réaccorder
- Vérifiez avec les journaux : `[tools] filtering tools for agent:${agentId}`

### Le conteneur n'est pas isolé par agent

- Définissez `scope: "agent"` dans la configuration de sandbox spécifique à l'agent
- La valeur par défaut est `"session"`, ce qui crée un conteneur par session

---

## Voir aussi

- [Sandboxing](/fr/gateway/sandboxing) -- référence complète du sandbox (modes, portées, backends, images)
- [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) -- déboguer « pourquoi est-ce bloqué ? »
- [Elevated Mode](/tools/elevated)
- [Routage multi-agents](/fr/concepts/multi-agent)
- [Configuration du sandbox](/fr/gateway/configuration-reference#agentsdefaultssandbox)
- [Gestion des sessions](/fr/concepts/session)
