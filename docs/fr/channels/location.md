---
read_when:
    - Ajout ou modification de l’analyse des localisations des canaux
    - Utilisation des champs de contexte de localisation dans les prompts ou outils d’agent
summary: Analyse des localisations entrantes des canaux (Telegram/WhatsApp/Matrix) et champs de contexte
title: Analyse des localisations des canaux
x-i18n:
    generated_at: "2026-04-05T12:35:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 10061f0c109240a9e0bcab649b17f03b674e8bdf410debf3669b7b6da8189d96
    source_path: channels/location.md
    workflow: 15
---

# Analyse des localisations des canaux

OpenClaw normalise les localisations partagées depuis les canaux de chat en :

- texte lisible par l’humain ajouté au corps entrant, et
- champs structurés dans la charge utile de contexte de réponse automatique.

Actuellement pris en charge :

- **Telegram** (épingles de localisation + lieux + localisations en direct)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`m.location` avec `geo_uri`)

## Formatage du texte

Les localisations sont rendues sous forme de lignes conviviales sans crochets :

- Épingle :
  - `📍 48.858844, 2.294351 ±12m`
- Lieu nommé :
  - `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- Partage en direct :
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

Si le canal inclut une légende/un commentaire, il est ajouté à la ligne suivante :

```
📍 48.858844, 2.294351 ±12m
Meet here
```

## Champs de contexte

Lorsqu’une localisation est présente, ces champs sont ajoutés à `ctx` :

- `LocationLat` (nombre)
- `LocationLon` (nombre)
- `LocationAccuracy` (nombre, mètres ; facultatif)
- `LocationName` (chaîne ; facultatif)
- `LocationAddress` (chaîne ; facultatif)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (booléen)

## Remarques sur les canaux

- **Telegram** : les lieux sont mappés vers `LocationName/LocationAddress` ; les localisations en direct utilisent `live_period`.
- **WhatsApp** : `locationMessage.comment` et `liveLocationMessage.caption` sont ajoutés comme ligne de légende.
- **Matrix** : `geo_uri` est analysé comme une localisation de type épingle ; l’altitude est ignorée et `LocationIsLive` est toujours false.
