---
read_when:
    - Vous souhaitez rechercher dans la documentation OpenClaw en direct depuis le terminal
summary: Référence CLI pour `openclaw docs` (rechercher dans l’index de documentation en direct)
title: Docs
x-i18n:
    generated_at: "2026-04-24T07:04:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d208f5b9a3576ce0597abca600df109db054d20068359a9f2070ac30b1a8f69
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

Rechercher dans l’index de documentation en direct.

Arguments :

- `[query...]` : termes de recherche à envoyer à l’index de documentation en direct

Exemples :

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Remarques :

- Sans requête, `openclaw docs` ouvre le point d’entrée de recherche de la documentation en direct.
- Les requêtes de plusieurs mots sont transmises comme une seule requête de recherche.

## Associé

- [Référence CLI](/fr/cli)
