---
read_when:
    - Vous voulez analyser des PDF à partir d’agents
    - Vous avez besoin des paramètres exacts et des limites de l’outil PDF
    - Vous déboguez le mode PDF natif par rapport à la solution de repli par extraction
summary: Analyser un ou plusieurs documents PDF avec prise en charge native du fournisseur et solution de repli par extraction
title: Outil PDF
x-i18n:
    generated_at: "2026-04-05T12:57:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: d7aaaa7107d7920e7c31f3e38ac19411706e646186acf520bc02f2c3e49c0517
    source_path: tools/pdf.md
    workflow: 15
---

# Outil PDF

`pdf` analyse un ou plusieurs documents PDF et renvoie du texte.

Comportement rapide :

- Mode fournisseur natif pour les fournisseurs de modèles Anthropic et Google.
- Mode de repli par extraction pour les autres fournisseurs (extraire d’abord le texte, puis les images des pages si nécessaire).
- Prend en charge une entrée unique (`pdf`) ou multiple (`pdfs`), avec un maximum de 10 PDF par appel.

## Disponibilité

L’outil n’est enregistré que lorsque OpenClaw peut résoudre une configuration de modèle compatible PDF pour l’agent :

1. `agents.defaults.pdfModel`
2. repli sur `agents.defaults.imageModel`
3. repli sur le modèle de session/par défaut résolu de l’agent
4. si les fournisseurs PDF natifs sont adossés à une authentification, les préférer avant les candidats génériques de repli d’image

Si aucun modèle exploitable ne peut être résolu, l’outil `pdf` n’est pas exposé.

Notes sur la disponibilité :

- La chaîne de repli tient compte de l’authentification. Un `provider/model` configuré ne compte que si
  OpenClaw peut effectivement authentifier ce fournisseur pour l’agent.
- Les fournisseurs PDF natifs sont actuellement **Anthropic** et **Google**.
- Si le fournisseur de session/par défaut résolu dispose déjà d’un modèle vision/PDF
  configuré, l’outil PDF le réutilise avant de se replier sur d’autres
  fournisseurs adossés à une authentification.

## Référence des entrées

- `pdf` (`string`) : un chemin ou une URL de PDF
- `pdfs` (`string[]`) : plusieurs chemins ou URL de PDF, jusqu’à 10 au total
- `prompt` (`string`) : prompt d’analyse, par défaut `Analyze this PDF document.`
- `pages` (`string`) : filtre de pages comme `1-5` ou `1,3,7-9`
- `model` (`string`) : remplacement de modèle facultatif (`provider/model`)
- `maxBytesMb` (`number`) : limite de taille par PDF en Mo

Notes sur les entrées :

- `pdf` et `pdfs` sont fusionnés et dédupliqués avant le chargement.
- Si aucune entrée PDF n’est fournie, l’outil renvoie une erreur.
- `pages` est analysé comme des numéros de page à base 1, dédupliqués, triés et limités au nombre maximal de pages configuré.
- `maxBytesMb` a pour valeur par défaut `agents.defaults.pdfMaxBytesMb` ou `10`.

## Références PDF prises en charge

- chemin de fichier local (y compris l’expansion de `~`)
- URL `file://`
- URL `http://` et `https://`

Notes sur les références :

- Les autres schémas d’URI (par exemple `ftp://`) sont rejetés avec `unsupported_pdf_reference`.
- En mode sandbox, les URL distantes `http(s)` sont rejetées.
- Lorsque la politique de fichiers limitée au workspace est activée, les chemins de fichiers locaux en dehors des racines autorisées sont rejetés.

## Modes d’exécution

### Mode fournisseur natif

Le mode natif est utilisé pour les fournisseurs `anthropic` et `google`.
L’outil envoie directement les octets bruts du PDF aux API des fournisseurs.

Limites du mode natif :

- `pages` n’est pas pris en charge. S’il est défini, l’outil renvoie une erreur.
- L’entrée multi-PDF est prise en charge ; chaque PDF est envoyé comme bloc de document natif /
  partie PDF en ligne avant le prompt.

### Mode de repli par extraction

Le mode de repli est utilisé pour les fournisseurs non natifs.

Flux :

1. Extraire le texte des pages sélectionnées (jusqu’à `agents.defaults.pdfMaxPages`, valeur par défaut `20`).
2. Si la longueur du texte extrait est inférieure à `200` caractères, rendre les pages sélectionnées en images PNG et les inclure.
3. Envoyer le contenu extrait plus le prompt au modèle sélectionné.

Détails du repli :

- L’extraction d’images de page utilise un budget de pixels de `4,000,000`.
- Si le modèle cible ne prend pas en charge l’entrée image et qu’il n’y a pas de texte extractible, l’outil renvoie une erreur.
- Si l’extraction de texte réussit mais que l’extraction d’images nécessiterait la vision sur un
  modèle texte seul, OpenClaw supprime les images rendues et continue avec le
  texte extrait.
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

Voir la [Référence de configuration](/fr/gateway/configuration-reference) pour tous les détails des champs.

## Détails de sortie

L’outil renvoie du texte dans `content[0].text` et des métadonnées structurées dans `details`.

Champs `details` courants :

- `model` : référence du modèle résolu (`provider/model`)
- `native` : `true` pour le mode fournisseur natif, `false` pour le repli
- `attempts` : tentatives de repli ayant échoué avant le succès

Champs de chemin :

- entrée PDF unique : `details.pdf`
- entrées PDF multiples : `details.pdfs[]` avec des entrées `pdf`
- métadonnées de réécriture de chemin sandbox (le cas échéant) : `rewrittenFrom`

## Comportement en cas d’erreur

- Entrée PDF manquante : lève `pdf required: provide a path or URL to a PDF document`
- Trop de PDF : renvoie une erreur structurée dans `details.error = "too_many_pdfs"`
- Schéma de référence non pris en charge : renvoie `details.error = "unsupported_pdf_reference"`
- Mode natif avec `pages` : lève une erreur claire `pages is not supported with native PDF providers`

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

## Liens associés

- [Vue d’ensemble des outils](/tools) — tous les outils d’agent disponibles
- [Référence de configuration](/fr/gateway/configuration-reference#agent-defaults) — configuration `pdfMaxBytesMb` et `pdfMaxPages`
