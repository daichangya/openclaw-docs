---
read_when:
    - Modification du pipeline média ou des pièces jointes
summary: Règles de gestion des images et des médias pour send, Gateway et les réponses d’agent
title: Prise en charge des images et des médias
x-i18n:
    generated_at: "2026-04-05T12:47:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3bb372b45a3bae51eae03b41cb22c4cde144675a54ddfd12e01a96132e48a8a
    source_path: nodes/images.md
    workflow: 15
---

# Prise en charge des images et des médias (2025-12-05)

Le canal WhatsApp fonctionne via **Baileys Web**. Ce document capture les règles actuelles de gestion des médias pour send, Gateway et les réponses d’agent.

## Objectifs

- Envoyer des médias avec des légendes facultatives via `openclaw message send --media`.
- Permettre aux réponses automatiques de la boîte de réception web d’inclure des médias en plus du texte.
- Garder des limites par type raisonnables et prévisibles.

## Surface CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` facultatif ; la légende peut être vide pour des envois contenant uniquement un média.
  - `--dry-run` affiche la charge utile résolue ; `--json` émet `{ channel, to, messageId, mediaUrl, caption }`.

## Comportement du canal WhatsApp Web

- Entrée : chemin de fichier local **ou** URL HTTP(S).
- Flux : charger dans un Buffer, détecter le type de média et construire la charge utile correcte :
  - **Images :** redimensionnement et recompression en JPEG (côté max 2048 px) en visant `channels.whatsapp.mediaMaxMb` (par défaut : 50 MB).
  - **Audio/Voice/Video :** transmission directe jusqu’à 16 MB ; l’audio est envoyé comme note vocale (`ptt: true`).
  - **Documents :** tout le reste, jusqu’à 100 MB, avec conservation du nom de fichier lorsque disponible.
- Lecture de type GIF dans WhatsApp : envoyez un MP4 avec `gifPlayback: true` (CLI : `--gif-playback`) pour que les clients mobiles le lisent en boucle en ligne.
- La détection MIME privilégie les magic bytes, puis les en-têtes, puis l’extension du fichier.
- La légende provient de `--message` ou de `reply.text` ; une légende vide est autorisée.
- Journalisation : en mode non verbeux affiche `↩️`/`✅` ; en mode verbeux inclut la taille et le chemin/URL source.

## Pipeline de réponse automatique

- `getReplyFromConfig` renvoie `{ text?, mediaUrl?, mediaUrls? }`.
- Lorsqu’un média est présent, l’expéditeur web résout les chemins locaux ou les URL en utilisant le même pipeline que `openclaw message send`.
- Plusieurs entrées média sont envoyées séquentiellement si elles sont fournies.

## Médias entrants vers les commandes (Pi)

- Lorsque les messages web entrants incluent des médias, OpenClaw les télécharge dans un fichier temporaire et expose des variables de template :
  - `{{MediaUrl}}` pseudo-URL pour le média entrant.
  - `{{MediaPath}}` chemin local temporaire écrit avant l’exécution de la commande.
- Lorsqu’une sandbox Docker par session est activée, le média entrant est copié dans l’espace de travail sandbox et `MediaPath`/`MediaUrl` sont réécrits vers un chemin relatif comme `media/inbound/<filename>`.
- La compréhension des médias (si configurée via `tools.media.*` ou `tools.media.models` partagé) s’exécute avant le templating et peut insérer des blocs `[Image]`, `[Audio]` et `[Video]` dans `Body`.
  - L’audio définit `{{Transcript}}` et utilise la transcription pour l’analyse des commandes afin que les slash commands continuent de fonctionner.
  - Les descriptions de vidéo et d’image conservent tout texte de légende pour l’analyse des commandes.
  - Si le modèle d’image principal actif prend déjà en charge la vision de manière native, OpenClaw ignore le bloc de résumé `[Image]` et transmet l’image d’origine au modèle à la place.
- Par défaut, seule la première pièce jointe image/audio/video correspondante est traitée ; définissez `tools.media.<cap>.attachments` pour traiter plusieurs pièces jointes.

## Limites et erreurs

**Limites d’envoi sortant (envoi web WhatsApp)**

- Images : jusqu’à `channels.whatsapp.mediaMaxMb` (par défaut : 50 MB) après recompression.
- Audio/notes vocales/vidéo : limite de 16 MB ; documents : 100 MB.
- Média trop volumineux ou illisible → erreur explicite dans les journaux et la réponse est ignorée.

**Limites de compréhension des médias (transcription/description)**

- Image par défaut : 10 MB (`tools.media.image.maxBytes`).
- Audio par défaut : 20 MB (`tools.media.audio.maxBytes`).
- Vidéo par défaut : 50 MB (`tools.media.video.maxBytes`).
- Les médias trop volumineux ignorent l’étape de compréhension, mais les réponses passent quand même avec le corps d’origine.

## Remarques pour les tests

- Couvrir les flux send + reply pour les cas image/audio/document.
- Valider la recompression pour les images (borne de taille) et l’indicateur de note vocale pour l’audio.
- S’assurer que les réponses multi-médias sont distribuées en envois séquentiels.
