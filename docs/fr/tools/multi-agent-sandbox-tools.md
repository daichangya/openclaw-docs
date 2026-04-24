---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: « Sandbox par agent + restrictions d’outils, ordre de priorité et exemples »
title: Sandbox multi-agent et outils
x-i18n:
    generated_at: "2026-04-24T07:37:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7239e28825759efb060b821f87f5ebd9a7f3b720b30ff16dc076b186e47fcde9
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Configuration du sandbox multi-agent et des outils

Chaque agent dans une configuration multi-agent peut remplacer la politique globale de sandbox et d’outils.
Cette page couvre la configuration par agent, les règles de priorité et des exemples.

- **Backends et modes de sandbox** : voir [Sandboxing](/fr/gateway/sandboxing).
- **Déboguer les outils bloqués** : voir [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) et `openclaw sandbox explain`.
- **Exec elevated** : voir [Mode Elevated](/fr/tools/elevated).

L’authentification est par agent : chaque agent lit depuis son propre store d’authentification `agentDir` à
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Les identifiants **ne sont pas** partagés entre agents. Ne réutilisez jamais `agentDir` entre agents.
Si vous voulez partager des identifiants, copiez `auth-profiles.json` dans le `agentDir` de l’autre agent.

---

## Exemples de configuration

### Exemple 1 : agent personnel + agent familial restreint

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

**Résultat :**

- agent `main` : s’exécute sur l’hôte, accès complet aux outils
- agent `family` : s’exécute dans Docker (un conteneur par agent), uniquement l’outil `read`

---

### Exemple 2 : agent professionnel avec sandbox partagé

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

### Exemple 2b : profil de codage global + agent réservé à la messagerie

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

**Résultat :**

- les agents par défaut obtiennent les outils de codage
- l’agent `support` est réservé à la messagerie (+ outil Slack)

---

### Exemple 3 : modes de sandbox différents par agent

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Global default
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Override: main never sandboxed
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Override: public always sandboxed
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

## Priorité de configuration

Lorsque des configurations globales (`agents.defaults.*`) et spécifiques à l’agent (`agents.list[].*`) existent toutes deux :

### Configuration du sandbox

Les paramètres spécifiques à l’agent remplacent les paramètres globaux :

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Remarques :**

- `agents.list[].sandbox.{docker,browser,prune}.*` remplace `agents.defaults.sandbox.{docker,browser,prune}.*` pour cet agent (ignoré lorsque la portée du sandbox se résout à `"shared"`).

### Restrictions d’outils

L’ordre de filtrage est le suivant :

1. **Profil d’outils** (`tools.profile` ou `agents.list[].tools.profile`)
2. **Profil d’outils du fournisseur** (`tools.byProvider[provider].profile` ou `agents.list[].tools.byProvider[provider].profile`)
3. **Politique globale des outils** (`tools.allow` / `tools.deny`)
4. **Politique des outils du fournisseur** (`tools.byProvider[provider].allow/deny`)
5. **Politique d’outils spécifique à l’agent** (`agents.list[].tools.allow/deny`)
6. **Politique fournisseur de l’agent** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Politique d’outils du sandbox** (`tools.sandbox.tools` ou `agents.list[].tools.sandbox.tools`)
8. **Politique d’outils de sous-agent** (`tools.subagents.tools`, si applicable)

Chaque niveau peut restreindre davantage les outils, mais ne peut pas réautoriser des outils refusés par des niveaux précédents.
Si `agents.list[].tools.sandbox.tools` est défini, il remplace `tools.sandbox.tools` pour cet agent.
Si `agents.list[].tools.profile` est défini, il remplace `tools.profile` pour cet agent.
Les clés d’outils par fournisseur acceptent soit `provider` (par ex. `google-antigravity`) soit `provider/model` (par ex. `openai/gpt-5.4`).

Les politiques d’outils prennent en charge les raccourcis `group:*` qui se développent en plusieurs outils. Voir [Groupes d’outils](/fr/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) pour la liste complète.

Les remplacements elevated par agent (`agents.list[].tools.elevated`) peuvent restreindre encore davantage exec elevated pour des agents spécifiques. Voir [Mode Elevated](/fr/tools/elevated) pour les détails.

---

## Migration depuis un agent unique

**Avant (agent unique) :**

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

**Après (multi-agent avec profils différents) :**

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

Les anciennes configurations `agent.*` sont migrées par `openclaw doctor` ; préférez `agents.defaults` + `agents.list` à l’avenir.

---

## Exemples de restrictions d’outils

### Agent en lecture seule

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Agent d’exécution sûre (sans modification de fichiers)

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

Dans ce profil, `sessions_history` renvoie toujours une vue de rappel bornée et nettoyée plutôt qu’un dump brut de transcription. Le rappel assistant retire les balises de réflexion, l’échafaudage `<relevant-memories>`, les charges XML d’appel d’outil en texte brut
(y compris `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, et les blocs d’appel d’outil tronqués),
l’échafaudage d’appel d’outil rétrogradé, les jetons de contrôle de modèle ASCII/pleine largeur divulgués,
et le XML d’appel d’outil MiniMax mal formé avant la rédaction/troncature.

---

## Piège fréquent : `non-main`

`agents.defaults.sandbox.mode: "non-main"` est basé sur `session.mainKey` (par défaut `"main"`),
pas sur l’identifiant de l’agent. Les sessions de groupe/canal obtiennent toujours leurs propres clés, elles
sont donc traitées comme non principales et seront mises dans le sandbox. Si vous voulez qu’un agent ne soit jamais
mis dans le sandbox, définissez `agents.list[].sandbox.mode: "off"`.

---

## Tests

Après avoir configuré le sandbox multi-agent et les outils :

1. **Vérifiez la résolution des agents :**

   ```exec
   openclaw agents list --bindings
   ```

2. **Vérifiez les conteneurs sandbox :**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Testez les restrictions d’outils :**
   - Envoyez un message nécessitant des outils restreints
   - Vérifiez que l’agent ne peut pas utiliser les outils refusés

4. **Surveillez les journaux :**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Dépannage

### L’agent n’est pas mis dans le sandbox malgré `mode: "all"`

- Vérifiez s’il existe un `agents.defaults.sandbox.mode` global qui le remplace
- La configuration spécifique à l’agent est prioritaire, donc définissez `agents.list[].sandbox.mode: "all"`

### Les outils restent disponibles malgré la liste de refus

- Vérifiez l’ordre de filtrage des outils : global → agent → sandbox → sous-agent
- Chaque niveau ne peut que restreindre davantage, pas réautoriser
- Vérifiez avec les journaux : `[tools] filtering tools for agent:${agentId}`

### Le conteneur n’est pas isolé par agent

- Définissez `scope: "agent"` dans la configuration sandbox spécifique à l’agent
- La valeur par défaut est `"session"`, ce qui crée un conteneur par session

---

## Voir aussi

- [Sandboxing](/fr/gateway/sandboxing) -- référence complète du sandbox (modes, portées, backends, images)
- [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) -- déboguer « pourquoi ceci est bloqué ? »
- [Mode Elevated](/fr/tools/elevated)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Configuration du sandbox](/fr/gateway/config-agents#agentsdefaultssandbox)
- [Gestion de session](/fr/concepts/session)
