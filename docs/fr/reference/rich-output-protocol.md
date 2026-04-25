---
read_when:
    - Modification du rendu de la sortie de l’assistant dans l’interface de contrôle
    - Débogage des directives de présentation `[embed ...]`, `MEDIA:`, reply ou audio
summary: Protocole de shortcode de sortie enrichie pour les embeds, médias, indices audio et réponses
title: Protocole de sortie enrichie
x-i18n:
    generated_at: "2026-04-25T18:21:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e01037a8cb80c9de36effd4642701dcc86131a2b8fb236d61c687845e64189
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

La sortie de l’assistant peut contenir un petit ensemble de directives de remise/rendu :

- `MEDIA:` pour la remise de pièces jointes
- `[[audio_as_voice]]` pour les indices de présentation audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` pour les métadonnées de réponse
- `[embed ...]` pour le rendu enrichi dans l’interface de contrôle

Ces directives sont distinctes. `MEDIA:` et les balises de réponse/voix restent des métadonnées de remise ; `[embed ...]` est le chemin de rendu enrichi réservé au web.
Les médias fiables issus de résultats d’outils utilisent le même parseur `MEDIA:` / `[[audio_as_voice]]` avant la remise, de sorte que les sorties textuelles d’outils peuvent toujours marquer une pièce jointe audio comme note vocale.

Lorsque le streaming par blocs est activé, `MEDIA:` reste une métadonnée de remise unique pour un tour. Si la même URL média est envoyée dans un bloc diffusé puis répétée dans la charge utile finale de l’assistant, OpenClaw remet la pièce jointe une seule fois et retire le doublon de la charge utile finale.

## `[embed ...]`

`[embed ...]` est la seule syntaxe de rendu enrichi exposée à l’agent pour l’interface de contrôle.

Exemple autofermant :

```text
[embed ref="cv_123" title="Status" /]
```

Règles :

- `[view ...]` n’est plus valide pour les nouvelles sorties.
- Les shortcodes d’embed se rendent uniquement dans la surface de message assistant.
- Seuls les embeds adossés à une URL sont rendus. Utilisez `ref="..."` ou `url="..."`.
- Les shortcodes d’embed HTML inline au format bloc ne sont pas rendus.
- L’interface web retire le shortcode du texte visible et rend l’embed inline.
- `MEDIA:` n’est pas un alias d’embed et ne doit pas être utilisé pour le rendu d’embed enrichi.

## Forme de rendu stockée

Le bloc de contenu assistant normalisé/stocké est un élément `canvas` structuré :

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
