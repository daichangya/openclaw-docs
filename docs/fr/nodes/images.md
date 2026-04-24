---
read_when:
    - Modification du pipeline média ou des pièces jointes
summary: Règles de gestion des images et des médias pour send, gateway et les réponses d’agent
title: Prise en charge des images et des médias
x-i18n:
    generated_at: "2026-04-24T07:18:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26fa460f7dcdac9f15c9d79c3c3370adbce526da5cfa9a6825a8ed20b41e0a29
    source_path: nodes/images.md
    workflow: 15
---

# Prise en charge des images et des médias (2025-12-05)

Le canal WhatsApp s’exécute via **Baileys Web**. Ce document capture les règles actuelles de gestion des médias pour send, gateway et les réponses d’agent.

## Objectifs

- Envoyer des médias avec des légendes facultatives via `openclaw message send --media`.
- Permettre aux réponses automatiques de la boîte de réception web d’inclure des médias en plus du texte.
- Garder des limites raisonnables et prévisibles par type.

## Surface CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` facultatif ; la légende peut être vide pour les envois média uniquement.
  - `--dry-run` affiche la charge utile résolue ; `--json` émet `{ channel, to, messageId, mediaUrl, caption }`.

## Comportement du canal WhatsApp Web

- Entrée : chemin de fichier local **ou** URL HTTP(S).
- Flux : charger dans un Buffer, détecter le type de média, et construire la charge utile correcte :
  - **Images :** redimensionnement et recompression en JPEG (côté max 2048 px) en visant `channels.whatsapp.mediaMaxMb` (par défaut : 50 MB).
  - **Audio/Voice/Vidéo :** passage direct jusqu’à 16 MB ; l’audio est envoyé comme note vocale (`ptt: true`).
  - **Documents :** tout le reste, jusqu’à 100 MB, avec nom de fichier préservé lorsqu’il est disponible.
- Lecture de style GIF dans WhatsApp : envoyez un MP4 avec `gifPlayback: true` (CLI : `--gif-playback`) afin que les clients mobiles le bouclent inline.
- La détection MIME préfère les magic bytes, puis les en-têtes, puis l’extension du fichier.
- La légende provient de `--message` ou de `reply.text` ; une légende vide est autorisée.
- Journalisation : le mode non verbose affiche `↩️`/`✅` ; le mode verbose inclut la taille et le chemin/l’URL source.

## Pipeline de réponse automatique

- `getReplyFromConfig` renvoie `{ text?, mediaUrl?, mediaUrls? }`.
- Lorsqu’un média est présent, l’expéditeur web résout les chemins locaux ou les URL en utilisant le même pipeline que `openclaw message send`.
- Plusieurs entrées média sont envoyées séquentiellement si elles sont fournies.

## Médias entrants vers les commandes (Pi)

- Lorsque des messages web entrants incluent des médias, OpenClaw les télécharge dans un fichier temporaire et expose des variables de modèle :
  - `{{MediaUrl}}` pseudo-URL pour le média entrant.
  - `{{MediaPath}}` chemin temporaire local écrit avant l’exécution de la commande.
- Lorsqu’un sandbox Docker par session est activé, le média entrant est copié dans l’espace de travail du sandbox et `MediaPath`/`MediaUrl` sont réécrits vers un chemin relatif comme `media/inbound/<filename>`.
- La compréhension des médias (si configurée via `tools.media.*` ou `tools.media.models` partagés) s’exécute avant le templating et peut insérer des blocs `[Image]`, `[Audio]` et `[Video]` dans `Body`.
  - L’audio définit `{{Transcript}}` et utilise la transcription pour l’analyse de commande afin que les commandes slash continuent à fonctionner.
  - Les descriptions vidéo et image préservent tout texte de légende pour l’analyse de commande.
  - Si le modèle d’image principal actif prend déjà en charge nativement la vision, OpenClaw ignore le bloc de résumé `[Image]` et transmet à la place l’image originale au modèle.
- Par défaut, seule la première pièce jointe image/audio/vidéo correspondante est traitée ; définissez `tools.media.<cap>.attachments` pour traiter plusieurs pièces jointes.

## Limites et erreurs

**Plafonds d’envoi sortant (envoi web WhatsApp)**

- Images : jusqu’à `channels.whatsapp.mediaMaxMb` (50 MB par défaut) après recompression.
- Audio/note vocale/vidéo : plafond de 16 MB ; documents : 100 MB.
- Média trop volumineux ou illisible → erreur claire dans les journaux et la réponse est ignorée.

**Plafonds de compréhension des médias (transcription/description)**

- Image par défaut : 10 MB (`tools.media.image.maxBytes`).
- Audio par défaut : 20 MB (`tools.media.audio.maxBytes`).
- Vidéo par défaut : 50 MB (`tools.media.video.maxBytes`).
- Un média trop volumineux ignore la compréhension, mais les réponses passent toujours avec le corps d’origine.

## Remarques pour les tests

- Couvrez les flux send + reply pour les cas image/audio/document.
- Validez la recompression des images (taille bornée) et l’indicateur de note vocale pour l’audio.
- Assurez-vous que les réponses multi-médias se répartissent en envois séquentiels.

## Lié

- [Capture caméra](/fr/nodes/camera)
- [Compréhension des médias](/fr/nodes/media-understanding)
- [Audio et notes vocales](/fr/nodes/audio)
