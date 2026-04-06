---
x-i18n:
    generated_at: "2026-04-06T03:05:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e1cf417b0c04d001bc494fbe03ac2fcb66866f759e21646dbfd1a9c3a968bff
    source_path: .i18n/README.md
    workflow: 15
---

# Ressources i18n de la documentation OpenClaw

Ce dossier stocke la configuration de traduction pour le dépôt source de la documentation.

Les pages de langue générées et la mémoire de traduction active des langues se trouvent désormais dans le dépôt de publication (`openclaw/docs`, extraction locale sœur `~/Projects/openclaw-docs`).

## Fichiers

- `glossary.<lang>.json` — correspondances de termes préférées (utilisées dans les instructions du prompt).
- `<lang>.tm.jsonl` — mémoire de traduction (cache) indexée par workflow + modèle + hachage de texte. Dans ce dépôt, les fichiers TM des langues sont générés à la demande.

## Format du glossaire

`glossary.<lang>.json` est un tableau d'entrées :

```json
{
  "source": "troubleshooting",
  "target": "故障排除",
  "ignore_case": true,
  "whole_word": false
}
```

Champs :

- `source` : expression anglaise (ou source) à privilégier.
- `target` : sortie de traduction préférée.

## Remarques

- Les entrées du glossaire sont transmises au modèle comme **instructions de prompt** (sans réécritures déterministes).
- `scripts/docs-i18n` conserve la responsabilité de la génération des traductions.
- Le dépôt source synchronise la documentation anglaise vers le dépôt de publication ; la génération des langues s'y exécute par langue lors des envois, des planifications et des déclenchements de publication.
