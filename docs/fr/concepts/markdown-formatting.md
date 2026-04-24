---
read_when:
    - Vous modifiez le formatage Markdown ou le découpage pour les canaux sortants
    - Vous ajoutez un nouveau formateur de canal ou un nouveau mapping de style
    - Vous déboguez des régressions de formatage entre canaux
summary: Pipeline de formatage Markdown pour les canaux sortants
title: Formatage Markdown
x-i18n:
    generated_at: "2026-04-24T07:06:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf052e11fe9fd075a4337ffa555391c7003a346240b57bb65054c3f08401dfd9
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

OpenClaw formate le Markdown sortant en le convertissant dans une représentation
intermédiaire (IR) partagée avant de générer une sortie spécifique au canal. L’IR conserve le
texte source intact tout en transportant les plages de style/liens, afin que le découpage et le rendu restent
cohérents entre les canaux.

## Objectifs

- **Cohérence :** une étape d’analyse, plusieurs moteurs de rendu.
- **Découpage sûr :** diviser le texte avant le rendu pour que le formatage en ligne ne
  soit jamais cassé entre les segments.
- **Adaptation au canal :** mapper la même IR vers le mrkdwn Slack, le HTML Telegram et les
  plages de style Signal sans réanalyser le Markdown.

## Pipeline

1. **Analyser le Markdown -> IR**
   - L’IR est du texte brut plus des plages de style (gras/italique/barré/code/spoiler) et des plages de liens.
   - Les offsets sont en unités de code UTF-16 afin que les plages de style Signal soient alignées avec son API.
   - Les tableaux ne sont analysés que lorsqu’un canal active la conversion des tableaux.
2. **Découper l’IR (format d’abord)**
   - Le découpage s’effectue sur le texte de l’IR avant le rendu.
   - Le formatage en ligne ne se divise pas entre segments ; les plages sont découpées par segment.
3. **Rendre par canal**
   - **Slack :** jetons mrkdwn (gras/italique/barré/code), liens sous la forme `<url|label>`.
   - **Telegram :** balises HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal :** texte brut + plages `text-style` ; les liens deviennent `label (url)` lorsque le libellé diffère.

## Exemple d’IR

Markdown d’entrée :

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR (schématique) :

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Où c’est utilisé

- Les adaptateurs sortants Slack, Telegram et Signal effectuent le rendu à partir de l’IR.
- Les autres canaux (WhatsApp, iMessage, Microsoft Teams, Discord) utilisent toujours du texte brut ou
  leurs propres règles de formatage, avec conversion des tableaux Markdown appliquée avant
  le découpage lorsqu’elle est activée.

## Gestion des tableaux

Les tableaux Markdown ne sont pas pris en charge de manière cohérente selon les clients de discussion. Utilisez
`markdown.tables` pour contrôler la conversion par canal (et par compte).

- `code` : rendre les tableaux sous forme de blocs de code (par défaut pour la plupart des canaux).
- `bullets` : convertir chaque ligne en puces (par défaut pour Signal + WhatsApp).
- `off` : désactiver l’analyse et la conversion des tableaux ; le texte brut du tableau est transmis tel quel.

Clés de configuration :

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## Règles de découpage

- Les limites de découpage proviennent des adaptateurs/configurations de canal et sont appliquées au texte de l’IR.
- Les blocs de code délimités sont conservés comme un bloc unique avec un saut de ligne final afin que les canaux
  les rendent correctement.
- Les préfixes de liste et de citation font partie du texte de l’IR, de sorte que le découpage
  ne coupe pas au milieu d’un préfixe.
- Les styles en ligne (gras/italique/barré/code en ligne/spoiler) ne sont jamais divisés entre
  les segments ; le moteur de rendu rouvre les styles dans chaque segment.

Si vous avez besoin de plus d’informations sur le comportement du découpage entre canaux, voir
[Diffusion + découpage](/fr/concepts/streaming).

## Politique de liens

- **Slack :** `[label](url)` -> `<url|label>` ; les URL brutes restent brutes. L’autolink
  est désactivé pendant l’analyse pour éviter les doubles liens.
- **Telegram :** `[label](url)` -> `<a href="url">label</a>` (mode d’analyse HTML).
- **Signal :** `[label](url)` -> `label (url)` sauf si le libellé correspond à l’URL.

## Spoilers

Les marqueurs de spoiler (`||spoiler||`) ne sont analysés que pour Signal, où ils sont mappés vers
des plages de style SPOILER. Les autres canaux les traitent comme du texte brut.

## Comment ajouter ou mettre à jour un formateur de canal

1. **Analyser une seule fois :** utilisez le helper partagé `markdownToIR(...)` avec les options
   appropriées au canal (autolink, style des titres, préfixe de citation).
2. **Rendre :** implémentez un moteur de rendu avec `renderMarkdownWithMarkers(...)` et une
   table de correspondance des marqueurs de style (ou des plages de style Signal).
3. **Découper :** appelez `chunkMarkdownIR(...)` avant le rendu ; effectuez le rendu de chaque segment.
4. **Brancher l’adaptateur :** mettez à jour l’adaptateur sortant du canal pour utiliser le nouveau découpeur
   et le nouveau moteur de rendu.
5. **Tester :** ajoutez ou mettez à jour les tests de formatage et un test de livraison sortante si le
   canal utilise le découpage.

## Pièges courants

- Les jetons Slack entre chevrons (`<@U123>`, `<#C123>`, `<https://...>`) doivent être
  préservés ; échappez le HTML brut en toute sécurité.
- Le HTML Telegram exige d’échapper le texte hors balises afin d’éviter un balisage cassé.
- Les plages de style Signal dépendent d’offsets UTF-16 ; n’utilisez pas d’offsets en points de code.
- Préservez les sauts de ligne finaux pour les blocs de code délimités afin que les marqueurs de fermeture tombent
  sur leur propre ligne.

## Articles connexes

- [Diffusion et découpage](/fr/concepts/streaming)
- [Prompt système](/fr/concepts/system-prompt)
