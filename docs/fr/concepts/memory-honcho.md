---
read_when:
    - Vous voulez une mémoire persistante qui fonctionne entre les sessions et les canaux
    - Vous voulez un rappel alimenté par l’IA et une modélisation utilisateur
summary: Mémoire inter-sessions native IA via le plugin Honcho
title: Mémoire Honcho
x-i18n:
    generated_at: "2026-04-05T12:39:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ae3561152519a23589f754e0625f1e49c43e38f85de07686b963170a6cf229
    source_path: concepts/memory-honcho.md
    workflow: 15
---

# Mémoire Honcho

[Honcho](https://honcho.dev) ajoute une mémoire native IA à OpenClaw. Il persiste les
conversations dans un service dédié et construit au fil du temps des modèles utilisateur et agent,
donnant à votre agent un contexte inter-sessions qui va au-delà des fichiers Markdown
du workspace.

## Ce qu’il fournit

- **Mémoire inter-sessions** -- les conversations sont persistées après chaque tour, de sorte que
  le contexte est conservé entre les réinitialisations de session, le compactage et les changements de canal.
- **Modélisation utilisateur** -- Honcho maintient un profil pour chaque utilisateur (préférences,
  faits, style de communication) et pour l’agent (personnalité, comportements
  appris).
- **Recherche sémantique** -- recherche dans les observations issues des conversations passées, et pas
  seulement dans la session actuelle.
- **Conscience multi-agent** -- les agents parents suivent automatiquement les
  sous-agents lancés, les parents étant ajoutés comme observateurs dans les sessions enfants.

## Outils disponibles

Honcho enregistre des outils que l’agent peut utiliser pendant la conversation :

**Récupération de données (rapide, sans appel LLM) :**

| Tool                        | Ce qu’il fait                                        |
| --------------------------- | ---------------------------------------------------- |
| `honcho_context`            | Représentation complète de l’utilisateur entre les sessions |
| `honcho_search_conclusions` | Recherche sémantique dans les conclusions stockées   |
| `honcho_search_messages`    | Trouver des messages entre les sessions (filtrer par expéditeur, date) |
| `honcho_session`            | Historique et résumé de la session actuelle          |

**Q&R (alimenté par LLM) :**

| Tool         | Ce qu’il fait                                                              |
| ------------ | -------------------------------------------------------------------------- |
| `honcho_ask` | Poser une question sur l’utilisateur. `depth='quick'` pour les faits, `'thorough'` pour la synthèse |

## Premiers pas

Installez le plugin et lancez la configuration :

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

La commande de configuration vous demande vos identifiants API, écrit la configuration et
migre éventuellement les fichiers mémoire existants du workspace.

<Info>
Honcho peut fonctionner entièrement en local (auto-hébergé) ou via l’API gérée sur
`api.honcho.dev`. Aucune dépendance externe n’est requise pour l’option
auto-hébergée.
</Info>

## Configuration

Les paramètres se trouvent sous `plugins.entries["openclaw-honcho"].config` :

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // omit for self-hosted
          workspaceId: "openclaw", // memory isolation
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Pour les instances auto-hébergées, pointez `baseUrl` vers votre serveur local (par exemple
`http://localhost:8000`) et omettez la clé API.

## Migrer la mémoire existante

Si vous avez des fichiers mémoire existants du workspace (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), `openclaw honcho setup` les détecte et
propose de les migrer.

<Info>
La migration n’est pas destructive -- les fichiers sont envoyés vers Honcho. Les originaux ne sont
jamais supprimés ni déplacés.
</Info>

## Fonctionnement

Après chaque tour IA, la conversation est persistée dans Honcho. Les messages utilisateur et
agent sont tous deux observés, ce qui permet à Honcho de construire et d’affiner ses modèles au fil du
temps.

Pendant la conversation, les outils Honcho interrogent le service dans la phase `before_prompt_build`,
injectant le contexte pertinent avant que le modèle ne voie le prompt. Cela garantit
des frontières de tour précises et un rappel pertinent.

## Honcho vs mémoire intégrée

|                   | Intégrée / QMD               | Honcho                              |
| ----------------- | ---------------------------- | ----------------------------------- |
| **Stockage**      | Fichiers Markdown du workspace | Service dédié (local ou hébergé)   |
| **Inter-sessions** | Via des fichiers mémoire     | Automatique, intégré                |
| **Modélisation utilisateur** | Manuelle (écrire dans MEMORY.md) | Profils automatiques      |
| **Recherche**     | Vectorielle + mot-clé (hybride) | Sémantique sur les observations   |
| **Multi-agent**   | Non suivi                    | Conscience parent/enfant            |
| **Dépendances**   | Aucune (intégrée) ou binaire QMD | Installation d’un plugin         |

Honcho et le système de mémoire intégré peuvent fonctionner ensemble. Lorsque QMD est configuré,
des outils supplémentaires deviennent disponibles pour rechercher dans les fichiers Markdown locaux en parallèle
de la mémoire inter-sessions de Honcho.

## Commandes CLI

```bash
openclaw honcho setup                        # Configure API key and migrate files
openclaw honcho status                       # Check connection status
openclaw honcho ask <question>               # Query Honcho about the user
openclaw honcho search <query> [-k N] [-d D] # Semantic search over memory
```

## Pour aller plus loin

- [Code source du plugin](https://github.com/plastic-labs/openclaw-honcho)
- [Documentation Honcho](https://docs.honcho.dev)
- [Guide d’intégration Honcho OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Memory](/concepts/memory) -- vue d’ensemble de la mémoire OpenClaw
- [Context Engines](/concepts/context-engine) -- fonctionnement des moteurs de contexte de plugin
