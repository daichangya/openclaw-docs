---
x-i18n:
    generated_at: "2026-04-05T12:34:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: adff26fa8858af2759b231ea48bfc01f89c110cd9b3774a8f783e282c16f77fb
    source_path: .i18n/README.md
    workflow: 15
---

# Ressources i18n de la documentation OpenClaw

Ce dossier stocke la configuration de traduction pour le dépôt source de la documentation.

Les arborescences de langues générées et la mémoire de traduction active se trouvent désormais dans le dépôt de publication :

- dépôt : `openclaw/docs`
- extraction locale : `~/Projects/openclaw-docs`

## Source de vérité

- La documentation anglaise est rédigée dans `openclaw/openclaw`.
- L’arborescence source de la documentation se trouve sous `docs/`.
- Le dépôt source ne conserve plus d’arborescences de langues générées validées, telles que `docs/zh-CN/**`, `docs/ja-JP/**`, `docs/es/**`, `docs/pt-BR/**`, `docs/ko/**`, `docs/de/**`, `docs/fr/**` ou `docs/ar/**`.

## Flux de bout en bout

1. Modifiez la documentation anglaise dans `openclaw/openclaw`.
2. Poussez vers `main`.
3. `openclaw/openclaw/.github/workflows/docs-sync-publish.yml` réplique l’arborescence de la documentation dans `openclaw/docs`.
4. Le script de synchronisation réécrit le `docs/docs.json` de publication afin que les blocs générés du sélecteur de langue y existent même s’ils ne sont plus validés dans le dépôt source.
5. `openclaw/docs/.github/workflows/translate-zh-cn.yml` actualise `docs/zh-CN/**` une fois par jour, à la demande et après les envois de publication du dépôt source.
6. `openclaw/docs/.github/workflows/translate-ja-jp.yml` fait de même pour `docs/ja-JP/**`.
7. `openclaw/docs/.github/workflows/translate-es.yml`, `translate-pt-br.yml`, `translate-ko.yml`, `translate-de.yml`, `translate-fr.yml` et `translate-ar.yml` font de même pour `docs/es/**`, `docs/pt-BR/**`, `docs/ko/**`, `docs/de/**`, `docs/fr/**` et `docs/ar/**`.

## Pourquoi cette séparation existe

- Garder la sortie de langues générées hors du dépôt principal du produit.
- Garder Mintlify sur une seule arborescence de documentation publiée.
- Préserver le sélecteur de langue intégré en laissant le dépôt de publication posséder les arborescences de langues générées.

## Fichiers dans ce dossier

- `glossary.<lang>.json` — mappages de termes préférés utilisés comme guide dans les prompts.
- `ar-navigation.json`, `de-navigation.json`, `es-navigation.json`, `fr-navigation.json`, `ja-navigation.json`, `ko-navigation.json`, `pt-BR-navigation.json`, `zh-Hans-navigation.json` — blocs du sélecteur de langue Mintlify réinsérés dans le dépôt de publication pendant la synchronisation.
- `<lang>.tm.jsonl` — mémoire de traduction indexée par workflow + modèle + hachage du texte.

Dans ce dépôt, les fichiers TM de langues générés, tels que `docs/.i18n/zh-CN.tm.jsonl`, `docs/.i18n/ja-JP.tm.jsonl`, `docs/.i18n/es.tm.jsonl`, `docs/.i18n/pt-BR.tm.jsonl`, `docs/.i18n/ko.tm.jsonl`, `docs/.i18n/de.tm.jsonl`, `docs/.i18n/fr.tm.jsonl` et `docs/.i18n/ar.tm.jsonl`, ne sont intentionnellement plus validés.

## Format du glossaire

`glossary.<lang>.json` est un tableau d’entrées :

```json
{
  "source": "troubleshooting",
  "target": "故障排除"
}
```

Champs :

- `source` : expression anglaise (ou source) à privilégier.
- `target` : sortie de traduction préférée.

## Mécanique de traduction

- `scripts/docs-i18n` reste responsable de la génération des traductions.
- Le mode documentation écrit `x-i18n.source_hash` dans chaque page traduite.
- Chaque workflow de publication précalcule une liste de fichiers en attente en comparant le hachage actuel de la source anglaise au `x-i18n.source_hash` de la langue stocké.
- Si le nombre en attente est `0`, l’étape coûteuse de traduction est entièrement ignorée.
- S’il y a des fichiers en attente, le workflow traduit uniquement ces fichiers.
- Le workflow de publication réessaie en cas d’échecs transitoires du format de modèle, mais les fichiers inchangés restent ignorés, car la même vérification de hachage s’exécute à chaque nouvelle tentative.
- Le dépôt source déclenche également des actualisations zh-CN, ja-JP, es, pt-BR, ko, de, fr et ar après les publications GitHub publiées, afin que la documentation de version puisse se mettre à jour sans attendre le cron quotidien.

## Notes opérationnelles

- Les métadonnées de synchronisation sont écrites dans `.openclaw-sync/source.json` dans le dépôt de publication.
- Secret du dépôt source : `OPENCLAW_DOCS_SYNC_TOKEN`
- Secret du dépôt de publication : `OPENCLAW_DOCS_I18N_OPENAI_API_KEY`
- Si la sortie d’une langue semble obsolète, vérifiez d’abord le workflow `Translate <locale>` correspondant dans `openclaw/docs`.
