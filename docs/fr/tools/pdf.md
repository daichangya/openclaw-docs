---
read_when:
    - Vous souhaitez analyser des PDF depuis des agents
    - Vous avez besoin des paramètres et limites exacts de l’outil PDF
    - Vous déboguez le mode PDF natif par rapport au repli par extraction
summary: Analyser un ou plusieurs documents PDF avec prise en charge native du fournisseur et repli par extraction
title: Outil PDF
x-i18n:
    generated_at: "2026-04-24T07:38:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 945838d1e1164a15720ca76eb156f9f299bf7f603f4591c8fa557b43e4cc93a8
    source_path: tools/pdf.md
    workflow: 15
---

`pdf` analyse un ou plusieurs documents PDF et renvoie du texte.

Comportement rapide :

- Mode fournisseur natif pour les fournisseurs de modèles Anthropic et Google.
- Mode de repli par extraction pour les autres fournisseurs (extraire d’abord le texte, puis les images de pages si nécessaire).
- Prend en charge une entrée simple (`pdf`) ou multiple (`pdfs`), max 10 PDF par appel.

## Disponibilité

L’outil n’est enregistré que lorsqu’OpenClaw peut résoudre une configuration de modèle capable de traiter des PDF pour l’agent :

1. `agents.defaults.pdfModel`
2. repli vers `agents.defaults.imageModel`
3. repli vers le modèle de session/par défaut résolu de l’agent
4. si les fournisseurs PDF natifs sont adossés à une authentification, les préférer avant les candidats de repli d’image générique

Si aucun modèle exploitable ne peut être résolu, l’outil `pdf` n’est pas exposé.

Remarques sur la disponibilité :

- La chaîne de repli dépend de l’authentification. Un `provider/model` configuré ne compte que si
  OpenClaw peut effectivement authentifier ce fournisseur pour l’agent.
- Les fournisseurs PDF natifs sont actuellement **Anthropic** et **Google**.
- Si le fournisseur de session/par défaut résolu dispose déjà d’un modèle vision/PDF configuré, l’outil PDF le réutilise avant de revenir à d’autres fournisseurs adossés à une authentification.

## Référence des entrées

<ParamField path="pdf" type="string">
Un chemin ou une URL de PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Plusieurs chemins ou URL de PDF, jusqu’à 10 au total.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Prompt d’analyse.
</ParamField>

<ParamField path="pages" type="string">
Filtre de pages comme `1-5` ou `1,3,7-9`.
</ParamField>

<ParamField path="model" type="string">
Surcharge facultative du modèle au format `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Plafond de taille par PDF en Mo. Par défaut sur `agents.defaults.pdfMaxBytesMb` ou `10`.
</ParamField>

Remarques sur l’entrée :

- `pdf` et `pdfs` sont fusionnés et dédupliqués avant le chargement.
- Si aucune entrée PDF n’est fournie, l’outil renvoie une erreur.
- `pages` est analysé comme des numéros de pages indexés à partir de 1, dédupliqués, triés, et bornés au nombre maximal de pages configuré.
- `maxBytesMb` vaut par défaut `agents.defaults.pdfMaxBytesMb` ou `10`.

## Références PDF prises en charge

- chemin de fichier local (y compris l’expansion de `~`)
- URL `file://`
- URL `http://` et `https://`

Remarques sur les références :

- Les autres schémas URI (par exemple `ftp://`) sont rejetés avec `unsupported_pdf_reference`.
- En mode sandbox, les URL distantes `http(s)` sont rejetées.
- Lorsque la politique de fichiers limitée à l’espace de travail est activée, les chemins de fichiers locaux hors des racines autorisées sont rejetés.

## Modes d’exécution

### Mode fournisseur natif

Le mode natif est utilisé pour les fournisseurs `anthropic` et `google`.
L’outil envoie directement les octets bruts du PDF aux API des fournisseurs.

Limites du mode natif :

- `pages` n’est pas pris en charge. S’il est défini, l’outil renvoie une erreur.
- Les entrées multi-PDF sont prises en charge ; chaque PDF est envoyé comme bloc de document natif / partie PDF inline avant le prompt.

### Mode de repli par extraction

Le mode de repli est utilisé pour les fournisseurs non natifs.

Flux :

1. Extraire le texte des pages sélectionnées (jusqu’à `agents.defaults.pdfMaxPages`, par défaut `20`).
2. Si la longueur du texte extrait est inférieure à `200` caractères, rendre les pages sélectionnées en images PNG et les inclure.
3. Envoyer le contenu extrait plus le prompt au modèle sélectionné.

Détails du repli :

- L’extraction d’images de pages utilise un budget de pixels de `4,000,000`.
- Si le modèle cible ne prend pas en charge l’entrée image et qu’il n’y a aucun texte extractible, l’outil renvoie une erreur.
- Si l’extraction de texte réussit mais que l’extraction d’images nécessiterait la vision sur un modèle limité au texte, OpenClaw supprime les images rendues et continue avec le texte extrait.
- Le repli par extraction nécessite `pdfjs-dist` (et `@napi-rs/canvas` pour le rendu d’image).

## Configuration

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Voir [Référence de configuration](/fr/gateway/configuration-reference) pour les détails complets des champs.

## Détails de sortie

L’outil renvoie du texte dans `content[0].text` et des métadonnées structurées dans `details`.

Champs `details` communs :

- `model` : référence de modèle résolue (`provider/model`)
- `native` : `true` pour le mode fournisseur natif, `false` pour le repli
- `attempts` : tentatives de repli ayant échoué avant le succès

Champs de chemin :

- entrée PDF unique : `details.pdf`
- entrées PDF multiples : `details.pdfs[]` avec des entrées `pdf`
- métadonnées de réécriture de chemin sandbox (lorsque applicable) : `rewrittenFrom`

## Comportement en cas d’erreur

- Entrée PDF manquante : déclenche `pdf required: provide a path or URL to a PDF document`
- Trop de PDF : renvoie une erreur structurée dans `details.error = "too_many_pdfs"`
- Schéma de référence non pris en charge : renvoie `details.error = "unsupported_pdf_reference"`
- Mode natif avec `pages` : déclenche une erreur claire `pages is not supported with native PDF providers`

## Exemples

PDF unique :

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

PDF multiples :

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Modèle de repli avec filtre de pages :

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Articles connexes

- [Vue d’ensemble des outils](/fr/tools) — tous les outils d’agent disponibles
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) — configuration `pdfMaxBytesMb` et `pdfMaxPages`
