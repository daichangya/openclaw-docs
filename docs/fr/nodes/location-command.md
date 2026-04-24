---
read_when:
    - Ajouter la prise en charge du node de localisation ou l’interface des permissions
    - Concevoir les permissions de localisation Android ou le comportement au premier plan
summary: Commande de localisation pour les nodes (`location.get`), modes d’autorisation et comportement Android au premier plan
title: Commande de localisation
x-i18n:
    generated_at: "2026-04-24T07:18:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd7ae3bf411be4331d62494a5d5263e8cda345475c5f849913122c029377f06
    source_path: nodes/location-command.md
    workflow: 15
---

## En bref

- `location.get` est une commande node (via `node.invoke`).
- Désactivée par défaut.
- Les paramètres de l’app Android utilisent un sélecteur : Désactivé / Pendant l’utilisation.
- Commutateur séparé : Localisation précise.

## Pourquoi un sélecteur (et pas juste un interrupteur)

Les permissions de l’OS ont plusieurs niveaux. Nous pouvons exposer un sélecteur dans l’app, mais l’OS décide toujours de l’autorisation effective.

- iOS/macOS peuvent exposer **Pendant l’utilisation** ou **Toujours** dans les invites système/Paramètres.
- L’app Android ne prend actuellement en charge que la localisation au premier plan.
- La localisation précise est une autorisation séparée (iOS 14+ « Precise », Android « fine » vs « coarse »).

Le sélecteur dans l’interface pilote notre mode demandé ; l’autorisation effective vit dans les paramètres de l’OS.

## Modèle de paramètres

Par appareil node :

- `location.enabledMode` : `off | whileUsing`
- `location.preciseEnabled` : bool

Comportement de l’interface :

- Sélectionner `whileUsing` demande l’autorisation de premier plan.
- Si l’OS refuse le niveau demandé, revenir au plus haut niveau accordé et afficher l’état.

## Correspondance des permissions (`node.permissions`)

Facultatif. Le node macOS signale `location` via la carte des permissions ; iOS/Android peuvent l’omettre.

## Commande : `location.get`

Appelée via `node.invoke`.

Paramètres (suggérés) :

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Charge utile de réponse :

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

Erreurs (codes stables) :

- `LOCATION_DISABLED` : le sélecteur est désactivé.
- `LOCATION_PERMISSION_REQUIRED` : permission manquante pour le mode demandé.
- `LOCATION_BACKGROUND_UNAVAILABLE` : l’app est en arrière-plan mais seule l’autorisation Pendant l’utilisation est accordée.
- `LOCATION_TIMEOUT` : aucun point obtenu à temps.
- `LOCATION_UNAVAILABLE` : échec système / aucun fournisseur.

## Comportement en arrière-plan

- L’app Android refuse `location.get` lorsqu’elle est en arrière-plan.
- Gardez OpenClaw ouvert lorsque vous demandez la localisation sur Android.
- Les autres plateformes node peuvent se comporter différemment.

## Intégration modèle/outillage

- Surface d’outil : l’outil `nodes` ajoute l’action `location_get` (node requis).
- CLI : `openclaw nodes location get --node <id>`.
- Recommandations pour l’agent : n’appeler que lorsque l’utilisateur a activé la localisation et comprend la portée.

## Texte UX (suggéré)

- Désactivé : « Le partage de position est désactivé. »
- Pendant l’utilisation : « Uniquement lorsque OpenClaw est ouvert. »
- Précise : « Utiliser la position GPS précise. Désactivez pour partager une position approximative. »

## Articles connexes

- [Analyse des positions de canal](/fr/channels/location)
- [Capture caméra](/fr/nodes/camera)
- [Mode Talk](/fr/nodes/talk)
