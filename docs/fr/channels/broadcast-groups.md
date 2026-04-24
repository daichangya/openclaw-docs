---
read_when:
    - Configurer les listes de diffusion
    - Déboguer les réponses multi-agents dans WhatsApp
status: experimental
summary: Diffuser un message WhatsApp à plusieurs agents
title: Listes de diffusion
x-i18n:
    generated_at: "2026-04-24T06:59:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f3991348570170855158e82089fa073ca62b98855f443d4a227829d7c945ee
    source_path: channels/broadcast-groups.md
    workflow: 15
---

**Statut :** Expérimental  
**Version :** Ajouté dans 2026.1.9

## Vue d’ensemble

Les listes de diffusion permettent à plusieurs agents de traiter et de répondre simultanément au même message. Cela vous permet de créer des équipes d’agents spécialisées qui travaillent ensemble dans un seul groupe WhatsApp ou un DM — le tout en utilisant un seul numéro de téléphone.

Portée actuelle : **WhatsApp uniquement** (canal web).

Les listes de diffusion sont évaluées après les listes d’autorisation du canal et les règles d’activation du groupe. Dans les groupes WhatsApp, cela signifie que les diffusions se produisent lorsque OpenClaw répondrait normalement (par exemple : sur mention, selon les paramètres de votre groupe).

## Cas d’utilisation

### 1. Équipes d’agents spécialisées

Déployez plusieurs agents avec des responsabilités atomiques et ciblées :

```
Group: "Development Team"
Agents:
  - CodeReviewer (reviews code snippets)
  - DocumentationBot (generates docs)
  - SecurityAuditor (checks for vulnerabilities)
  - TestGenerator (suggests test cases)
```

Chaque agent traite le même message et fournit sa perspective spécialisée.

### 2. Prise en charge multilingue

```
Group: "International Support"
Agents:
  - Agent_EN (responds in English)
  - Agent_DE (responds in German)
  - Agent_ES (responds in Spanish)
```

### 3. Workflows d’assurance qualité

```
Group: "Customer Support"
Agents:
  - SupportAgent (provides answer)
  - QAAgent (reviews quality, only responds if issues found)
```

### 4. Automatisation des tâches

```
Group: "Project Management"
Agents:
  - TaskTracker (updates task database)
  - TimeLogger (logs time spent)
  - ReportGenerator (creates summaries)
```

## Configuration

### Configuration de base

Ajoutez une section `broadcast` au niveau supérieur (à côté de `bindings`). Les clés sont des ID de pair WhatsApp :

- conversations de groupe : JID du groupe (par ex. `120363403215116621@g.us`)
- DM : numéro de téléphone E.164 (par ex. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Résultat :** lorsque OpenClaw devrait répondre dans cette conversation, il exécutera les trois agents.

### Stratégie de traitement

Contrôlez la façon dont les agents traitent les messages :

#### Parallèle (par défaut)

Tous les agents traitent simultanément :

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Séquentielle

Les agents traitent dans l’ordre (l’un attend que le précédent ait terminé) :

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### Exemple complet

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## Fonctionnement

### Flux des messages

1. **Un message entrant** arrive dans un groupe WhatsApp
2. **Vérification de diffusion** : le système vérifie si l’ID du pair est présent dans `broadcast`
3. **S’il figure dans la liste de diffusion** :
   - Tous les agents listés traitent le message
   - Chaque agent dispose de sa propre clé de session et d’un contexte isolé
   - Les agents traitent en parallèle (par défaut) ou séquentiellement
4. **S’il ne figure pas dans la liste de diffusion** :
   - Le routage normal s’applique (première liaison correspondante)

Remarque : les listes de diffusion ne contournent pas les listes d’autorisation du canal ni les règles d’activation du groupe (mentions/commandes/etc.). Elles modifient uniquement _quels agents s’exécutent_ lorsqu’un message est éligible au traitement.

### Isolation des sessions

Chaque agent d’une liste de diffusion conserve des éléments totalement séparés :

- **Clés de session** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Historique des conversations** (l’agent ne voit pas les messages des autres agents)
- **Espace de travail** (sandboxes distinctes si configurées)
- **Accès aux outils** (listes d’autorisation/refus différentes)
- **Mémoire/contexte** (`IDENTITY.md`, `SOUL.md`, etc. distincts)
- **Tampon de contexte de groupe** (messages récents du groupe utilisés comme contexte), partagé par pair, afin que tous les agents de diffusion voient le même contexte lorsqu’ils sont déclenchés

Cela permet à chaque agent d’avoir :

- Des personnalités différentes
- Un accès aux outils différent (par ex., lecture seule vs lecture-écriture)
- Des modèles différents (par ex., opus vs sonnet)
- Des Skills différents installés

### Exemple : sessions isolées

Dans le groupe `120363403215116621@g.us` avec les agents `["alfred", "baerbel"]` :

**Contexte d’Alfred :**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [user message, alfred's previous responses]
Workspace: /Users/user/openclaw-alfred/
Tools: read, write, exec
```

**Contexte de Bärbel :**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [user message, baerbel's previous responses]
Workspace: /Users/user/openclaw-baerbel/
Tools: read only
```

## Bonnes pratiques

### 1. Garder les agents ciblés

Concevez chaque agent avec une responsabilité unique et claire :

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **Bien :** chaque agent a une seule tâche  
❌ **À éviter :** un agent générique « dev-helper »

### 2. Utiliser des noms descriptifs

Faites en sorte qu’il soit clair ce que fait chaque agent :

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. Configurer un accès aux outils différent

Donnez aux agents uniquement les outils dont ils ont besoin :

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // Lecture seule
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // Lecture-écriture
    }
  }
}
```

### 4. Surveiller les performances

Avec de nombreux agents, pensez à :

- Utiliser `"strategy": "parallel"` (par défaut) pour la rapidité
- Limiter les listes de diffusion à 5-10 agents
- Utiliser des modèles plus rapides pour les agents plus simples

### 5. Gérer les échecs avec souplesse

Les agents échouent indépendamment. L’erreur d’un agent ne bloque pas les autres :

```
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A and C respond, Agent B logs error
```

## Compatibilité

### Fournisseurs

Les listes de diffusion fonctionnent actuellement avec :

- ✅ WhatsApp (implémenté)
- 🚧 Telegram (prévu)
- 🚧 Discord (prévu)
- 🚧 Slack (prévu)

### Routage

Les listes de diffusion fonctionnent avec le routage existant :

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A` : seul alfred répond (routage normal)
- `GROUP_B` : agent1 ET agent2 répondent (diffusion)

**Priorité :** `broadcast` est prioritaire sur `bindings`.

## Dépannage

### Les agents ne répondent pas

**Vérifiez :**

1. Les ID des agents existent dans `agents.list`
2. Le format de l’ID du pair est correct (par ex. `120363403215116621@g.us`)
3. Les agents ne figurent pas dans des listes de refus

**Débogage :**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### Un seul agent répond

**Cause :** l’ID du pair est peut-être dans `bindings` mais pas dans `broadcast`.

**Correction :** ajoutez-le à la configuration de diffusion ou supprimez-le de `bindings`.

### Problèmes de performances

**En cas de lenteur avec de nombreux agents :**

- Réduisez le nombre d’agents par groupe
- Utilisez des modèles plus légers (`sonnet` au lieu de `opus`)
- Vérifiez le temps de démarrage de la sandbox

## Exemples

### Exemple 1 : équipe de revue de code

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": [
      "code-formatter",
      "security-scanner",
      "test-coverage",
      "docs-checker"
    ]
  },
  "agents": {
    "list": [
      {
        "id": "code-formatter",
        "workspace": "~/agents/formatter",
        "tools": { "allow": ["read", "write"] }
      },
      {
        "id": "security-scanner",
        "workspace": "~/agents/security",
        "tools": { "allow": ["read", "exec"] }
      },
      {
        "id": "test-coverage",
        "workspace": "~/agents/testing",
        "tools": { "allow": ["read", "exec"] }
      },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**L’utilisateur envoie :** extrait de code  
**Réponses :**

- code-formatter : « Indentation corrigée et annotations de type ajoutées »
- security-scanner : « ⚠️ Vulnérabilité d’injection SQL à la ligne 12 »
- test-coverage : « La couverture est de 45 %, il manque des tests pour les cas d’erreur »
- docs-checker : « Docstring manquante pour la fonction `process_data` »

### Exemple 2 : prise en charge multilingue

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+15555550123": ["detect-language", "translator-en", "translator-de"]
  },
  "agents": {
    "list": [
      { "id": "detect-language", "workspace": "~/agents/lang-detect" },
      { "id": "translator-en", "workspace": "~/agents/translate-en" },
      { "id": "translator-de", "workspace": "~/agents/translate-de" }
    ]
  }
}
```

## Référence API

### Schéma de configuration

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Champs

- `strategy` (facultatif) : comment traiter les agents
  - `"parallel"` (par défaut) : tous les agents traitent simultanément
  - `"sequential"` : les agents traitent dans l’ordre du tableau
- `[peerId]` : JID de groupe WhatsApp, numéro E.164 ou autre ID de pair
  - Valeur : tableau des ID d’agents qui doivent traiter les messages

## Limitations

1. **Nombre maximal d’agents :** aucune limite stricte, mais plus de 10 agents peut être lent
2. **Contexte partagé :** les agents ne voient pas les réponses des autres (par conception)
3. **Ordre des messages :** les réponses parallèles peuvent arriver dans n’importe quel ordre
4. **Limites de débit :** tous les agents comptent dans les limites de débit de WhatsApp

## Améliorations futures

Fonctionnalités prévues :

- [ ] Mode de contexte partagé (les agents voient les réponses des autres)
- [ ] Coordination des agents (les agents peuvent se signaler mutuellement)
- [ ] Sélection dynamique des agents (choisir les agents selon le contenu du message)
- [ ] Priorités des agents (certains agents répondent avant les autres)

## Articles connexes

- [Groupes](/fr/channels/groups)
- [Routage des canaux](/fr/channels/channel-routing)
- [Pairing](/fr/channels/pairing)
- [Outils sandbox multi-agents](/fr/tools/multi-agent-sandbox-tools)
- [Gestion des sessions](/fr/concepts/session)
