---
read_when:
    - Modification du rendu de la sortie de l’assistant dans l’interface de contrôle
    - Débogage des directives de présentation `[embed ...]`, `MEDIA:`, reply ou audio
summary: Protocole de shortcodes de sortie enrichie pour les embeds, médias, indices audio et réponses
title: Protocole de sortie enrichie
x-i18n:
    generated_at: "2026-04-24T07:31:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 688d60c97180b4ba250e731d765e8469a01c68588c149b760c32eab77955f69b
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

La sortie de l’assistant peut contenir un petit ensemble de directives de livraison/rendu :

- `MEDIA:` pour la livraison de pièces jointes
- `[[audio_as_voice]]` pour les indices de présentation audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` pour les métadonnées de réponse
- `[embed ...]` pour le rendu enrichi de l’interface de contrôle

Ces directives sont distinctes. `MEDIA:` et les balises de réponse/voix restent des métadonnées de livraison ; `[embed ...]` est le chemin de rendu enrichi web uniquement.

## `[embed ...]`

`[embed ...]` est la seule syntaxe de rendu enrichi orientée agent pour l’interface de contrôle.

Exemple autofermant :

```text
[embed ref="cv_123" title="Status" /]
```

Règles :

- `[view ...]` n’est plus valide pour les nouvelles sorties.
- Les shortcodes embed sont rendus uniquement dans la surface de message de l’assistant.
- Seuls les embeds adossés à une URL sont rendus. Utilisez `ref="..."` ou `url="..."`.
- Les shortcodes embed inline HTML de forme bloc ne sont pas rendus.
- L’interface web retire le shortcode du texte visible et rend l’embed inline.
- `MEDIA:` n’est pas un alias embed et ne doit pas être utilisé pour le rendu enrichi d’embed.

## Forme de rendu stockée

Le bloc de contenu assistant normalisé/stocké est un élément `canvas` structuré :

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

Les blocs enrichis stockés/rendus utilisent directement cette forme `canvas`. `present_view` n’est pas reconnu.

## Lié

- [Adaptateurs RPC](/fr/reference/rpc)
- [Typebox](/fr/concepts/typebox)
