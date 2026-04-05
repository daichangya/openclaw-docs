---
read_when:
    - Vous souhaitez rechercher dans la documentation OpenClaw en direct depuis le terminal
summary: Référence CLI pour `openclaw docs` (rechercher dans l’index en direct de la documentation)
title: docs
x-i18n:
    generated_at: "2026-04-05T12:37:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfcceed872d7509b9843af3fae733a136bc5e26ded55c2ac47a16489a1636989
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

Recherchez dans l’index en direct de la documentation.

Arguments :

- `[query...]` : termes de recherche à envoyer à l’index en direct de la documentation

Exemples :

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Remarques :

- Sans requête, `openclaw docs` ouvre le point d’entrée de recherche de la documentation en direct.
- Les requêtes composées de plusieurs mots sont transmises comme une seule requête de recherche.
