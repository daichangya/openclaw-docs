---
read_when:
    - Vous modifiez le formatage Markdown ou le découpage pour les canaux sortants
    - Vous ajoutez un nouveau formateur de canal ou un nouveau mappage de style
    - Vous déboguez des régressions de formatage entre les canaux
summary: Pipeline de formatage Markdown pour les canaux sortants
title: Formatage Markdown
x-i18n:
    generated_at: "2026-04-05T12:39:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3794674e30e265208d14a986ba9bdc4ba52e0cb69c446094f95ca6c674e4566
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

# Formatage Markdown

OpenClaw formate le Markdown sortant en le convertissant vers une représentation intermédiaire partagée
(IR) avant de produire la sortie spécifique au canal. L’IR conserve le
texte source intact tout en transportant les plages de style/lien, afin que le
découpage et le rendu restent cohérents entre les canaux.

## Objectifs

- **Cohérence :** une étape d’analyse, plusieurs moteurs de rendu.
- **Découpage sûr :** découper le texte avant le rendu afin que le formatage inline ne
  se rompe jamais entre les fragments.
- **Adaptation au canal :** mapper le même IR vers Slack mrkdwn, Telegram HTML et les
  plages de style Signal sans réanalyser le Markdown.

## Pipeline

1. **Analyser le Markdown -> IR**
   - L’IR est constitué de texte brut plus des plages de style (gras/italique/barré/code/spoiler) et des plages de lien.
   - Les offsets sont en unités de code UTF-16 afin que les plages de style Signal s’alignent avec son API.
   - Les tableaux ne sont analysés que lorsqu’un canal active explicitement la conversion de tableaux.
2. **Découper l’IR (format d’abord)**
   - Le découpage s’effectue sur le texte IR avant le rendu.
   - Le formatage inline ne se coupe pas entre les fragments ; les plages sont découpées par fragment.
3. **Rendu par canal**
   - **Slack :** jetons mrkdwn (gras/italique/barré/code), liens au format `<url|label>`.
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

## Où il est utilisé

- Les adaptateurs sortants Slack, Telegram et Signal produisent le rendu à partir de l’IR.
- Les autres canaux (WhatsApp, iMessage, Microsoft Teams, Discord) utilisent encore du texte brut ou
  leurs propres règles de formatage, avec la conversion des tableaux Markdown appliquée avant
  le découpage lorsqu’elle est activée.

## Gestion des tableaux

Les tableaux Markdown ne sont pas pris en charge de manière cohérente selon les clients de chat. Utilisez
`markdown.tables` pour contrôler la conversion par canal (et par compte).

- `code` : rend les tableaux sous forme de blocs de code (par défaut pour la plupart des canaux).
- `bullets` : convertit chaque ligne en puces (par défaut pour Signal + WhatsApp).
- `off` : désactive l’analyse et la conversion des tableaux ; le texte brut du tableau est transmis tel quel.

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

- Les limites de découpage proviennent des adaptateurs/configurations de canal et sont appliquées au texte IR.
- Les blocs de code délimités sont conservés comme un seul bloc avec un saut de ligne final afin que les canaux
  les rendent correctement.
- Les préfixes de liste et de citation font partie du texte IR, donc le découpage
  ne coupe pas au milieu d’un préfixe.
- Les styles inline (gras/italique/barré/code inline/spoiler) ne sont jamais coupés entre
  les fragments ; le moteur de rendu rouvre les styles à l’intérieur de chaque fragment.

Si vous avez besoin de plus d’informations sur le comportement de découpage entre les canaux, consultez
[Streaming + chunking](/concepts/streaming).

## Politique des liens

- **Slack :** `[label](url)` -> `<url|label>` ; les URL nues restent nues. L’autolink
  est désactivé pendant l’analyse pour éviter les doubles liens.
- **Telegram :** `[label](url)` -> `<a href="url">label</a>` (mode d’analyse HTML).
- **Signal :** `[label](url)` -> `label (url)` sauf si le libellé correspond à l’URL.

## Spoilers

Les marqueurs spoiler (`||spoiler||`) ne sont analysés que pour Signal, où ils sont mappés vers
des plages de style SPOILER. Les autres canaux les traitent comme du texte brut.

## Comment ajouter ou mettre à jour un formateur de canal

1. **Analyser une seule fois :** utilisez l’assistant partagé `markdownToIR(...)` avec des
   options adaptées au canal (autolink, style de titre, préfixe de citation).
2. **Rendre :** implémentez un moteur de rendu avec `renderMarkdownWithMarkers(...)` et une
   table de mappage des marqueurs de style (ou les plages de style Signal).
3. **Découper :** appelez `chunkMarkdownIR(...)` avant le rendu ; rendez chaque fragment.
4. **Raccorder l’adaptateur :** mettez à jour l’adaptateur sortant du canal pour utiliser le nouveau découpeur
   et le nouveau moteur de rendu.
5. **Tester :** ajoutez ou mettez à jour les tests de formatage et un test de livraison sortante si le
   canal utilise le découpage.

## Pièges fréquents

- Les jetons Slack entre chevrons (`<@U123>`, `<#C123>`, `<https://...>`) doivent être
  préservés ; échappez le HTML brut en toute sécurité.
- Le HTML Telegram nécessite d’échapper le texte en dehors des balises pour éviter un balisage cassé.
- Les plages de style Signal dépendent des offsets UTF-16 ; n’utilisez pas d’offsets par point de code.
- Conservez les sauts de ligne finaux pour les blocs de code délimités afin que les marqueurs de fermeture tombent
  sur leur propre ligne.
