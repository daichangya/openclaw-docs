---
read_when:
    - Vous maintenez un Plugin OpenClaw
    - Vous voyez un avertissement de compatibilité du Plugin
    - Vous planifiez une migration du SDK Plugin ou du manifeste
summary: Contrats de compatibilité des Plugin, métadonnées de dépréciation et attentes de migration
title: Compatibilité des Plugin
x-i18n:
    generated_at: "2026-04-25T18:20:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 511bd12cff1e72a93091cbb1ac7d75377b0b9d2f016b55f4cdc77293f6172a00
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw conserve les anciens contrats de Plugin branchés via des adaptateurs de compatibilité nommés avant de les supprimer. Cela protège les Plugins intégrés et externes existants pendant que les contrats du SDK, du manifeste, de l’installation, de la configuration et du runtime agent évoluent.

## Registre de compatibilité

Les contrats de compatibilité des Plugin sont suivis dans le registre central à
`src/plugins/compat/registry.ts`.

Chaque enregistrement comporte :

- un code de compatibilité stable
- un statut : `active`, `deprecated`, `removal-pending` ou `removed`
- un propriétaire : SDK, config, setup, canal, fournisseur, exécution du Plugin, runtime agent ou core
- des dates d’introduction et de dépréciation, le cas échéant
- des indications de remplacement
- la documentation, les diagnostics et les tests qui couvrent l’ancien et le nouveau comportement

Le registre est la source pour la planification des mainteneurs et les futures vérifications de l’inspecteur de Plugin. Si un comportement exposé aux Plugin change, ajoutez ou mettez à jour l’enregistrement de compatibilité dans la même modification que celle qui ajoute l’adaptateur.

## Package d’inspecteur de Plugin

L’inspecteur de Plugin doit vivre en dehors du dépôt central OpenClaw comme package/dépôt séparé soutenu par les contrats versionnés de compatibilité et de manifeste.

La CLI du premier jour doit être :

```sh
openclaw-plugin-inspector ./my-plugin
```

Elle doit produire :

- une validation du manifeste/schéma
- la version de compatibilité du contrat en cours de vérification
- des vérifications des métadonnées d’installation/source
- des vérifications d’import sur le chemin à froid
- des avertissements de dépréciation et de compatibilité

Utilisez `--json` pour une sortie stable lisible par machine dans les annotations CI. Le core OpenClaw doit exposer des contrats et des fixtures que l’inspecteur peut consommer, mais ne doit pas publier le binaire de l’inspecteur depuis le package principal `openclaw`.

## Politique de dépréciation

OpenClaw ne doit pas supprimer un contrat de Plugin documenté dans la même publication que celle qui introduit son remplacement.

La séquence de migration est la suivante :

1. Ajouter le nouveau contrat.
2. Conserver l’ancien comportement branché via un adaptateur de compatibilité nommé.
3. Émettre des diagnostics ou des avertissements lorsque les auteurs de Plugin peuvent agir.
4. Documenter le remplacement et le calendrier.
5. Tester à la fois l’ancien et le nouveau chemin.
6. Attendre pendant la fenêtre de migration annoncée.
7. Supprimer uniquement avec une approbation explicite de publication avec rupture.

Les enregistrements dépréciés doivent inclure une date de début d’avertissement, un remplacement, un lien vers la documentation et une date de suppression cible lorsqu’elle est connue.

## Zones de compatibilité actuelles

Les enregistrements de compatibilité actuels incluent :

- les anciens imports larges du SDK tels que `openclaw/plugin-sdk/compat`
- les anciennes formes de Plugin fondées uniquement sur des hooks et `before_agent_start`
- le comportement de liste d’autorisation et d’activation des Plugins intégrés
- les anciennes métadonnées de manifeste des variables d’environnement fournisseur/canal
- les indices d’activation en cours de remplacement par la propriété de contribution du manifeste
- les alias de nommage `embeddedHarness` et `agent-harness` pendant que le nommage public évolue vers `agentRuntime`
- le fallback des métadonnées de configuration de canal intégré générées pendant que les métadonnées `channelConfigs` orientées registre sont mises en place
- la variable d’environnement de désactivation du registre de Plugin persisté pendant que les flux de réparation font migrer les opérateurs vers `openclaw plugins registry --refresh` et `openclaw doctor --fix`

Le nouveau code de Plugin doit préférer le remplacement indiqué dans le registre et dans le guide de migration spécifique. Les Plugins existants peuvent continuer à utiliser un chemin de compatibilité jusqu’à ce que la documentation, les diagnostics et les notes de publication annoncent une fenêtre de suppression.

## Notes de publication

Les notes de publication doivent inclure les dépréciations de Plugin à venir avec les dates cibles et des liens vers la documentation de migration. Cet avertissement doit intervenir avant qu’un chemin de compatibilité passe à `removal-pending` ou `removed`.
