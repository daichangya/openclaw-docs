---
read_when:
    - Ajout de la prise en charge de la localisation pour les nœuds ou de l’interface des autorisations
    - Conception des autorisations de localisation Android ou du comportement au premier plan
summary: Commande de localisation pour les nœuds (`location.get`), modes d’autorisation et comportement Android au premier plan
title: Commande de localisation
x-i18n:
    generated_at: "2026-04-05T12:47:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c691cfe147b0b9b16b3a4984d544c168a46b37f91d55b82b2507407d2011529
    source_path: nodes/location-command.md
    workflow: 15
---

# Commande de localisation (nœuds)

## TL;DR

- `location.get` est une commande de nœud (via `node.invoke`).
- Désactivée par défaut.
- Les paramètres de l’application Android utilisent un sélecteur : Off / While Using.
- Bascule distincte : Precise Location.

## Pourquoi un sélecteur (et pas seulement un interrupteur)

Les autorisations de l’OS ont plusieurs niveaux. Nous pouvons exposer un sélecteur dans l’application, mais l’OS décide toujours de l’autorisation réellement accordée.

- iOS/macOS peuvent exposer **While Using** ou **Always** dans les invites/paramètres système.
- L’application Android ne prend actuellement en charge que la localisation au premier plan.
- La localisation précise est une autorisation distincte (iOS 14+ « Precise », Android « fine » vs « coarse »).

Le sélecteur de l’interface pilote le mode que nous demandons ; l’autorisation réelle se trouve dans les paramètres de l’OS.

## Modèle de paramètres

Par appareil nœud :

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Comportement de l’interface :

- Sélectionner `whileUsing` demande l’autorisation de premier plan.
- Si l’OS refuse le niveau demandé, revenir au niveau le plus élevé accordé et afficher l’état.

## Mappage des autorisations (`node.permissions`)

Facultatif. Le nœud macOS signale `location` via la map des autorisations ; iOS/Android peuvent l’omettre.

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
- `LOCATION_PERMISSION_REQUIRED` : autorisation manquante pour le mode demandé.
- `LOCATION_BACKGROUND_UNAVAILABLE` : l’application est en arrière-plan mais seule l’autorisation While Using est accordée.
- `LOCATION_TIMEOUT` : aucun point obtenu à temps.
- `LOCATION_UNAVAILABLE` : échec du système / aucun fournisseur.

## Comportement en arrière-plan

- L’application Android refuse `location.get` lorsqu’elle est en arrière-plan.
- Gardez OpenClaw ouvert lorsque vous demandez la localisation sur Android.
- Les autres plateformes de nœud peuvent différer.

## Intégration au modèle/à l’outillage

- Surface d’outil : l’outil `nodes` ajoute l’action `location_get` (nœud requis).
- CLI : `openclaw nodes location get --node <id>`.
- Consignes pour l’agent : ne l’appeler que lorsque l’utilisateur a activé la localisation et comprend la portée.

## Texte d’interface (suggéré)

- Off : « Le partage de localisation est désactivé. »
- While Using : « Uniquement lorsque OpenClaw est ouvert. »
- Precise : « Utiliser la localisation GPS précise. Désactivez cette option pour partager une localisation approximative. »
