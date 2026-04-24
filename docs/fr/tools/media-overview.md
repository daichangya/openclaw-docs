---
read_when:
    - Vous cherchez une vue d’ensemble des capacités média
    - Deciding which media provider to configure
    - Comprendre le fonctionnement de la génération média asynchrone
summary: Page d’accueil unifiée pour la génération de médias, la compréhension et les capacités vocales
title: Vue d’ensemble des médias
x-i18n:
    generated_at: "2026-04-24T07:37:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469fb173ac3853011b8cd4f89f3ab97dd7d14e12e4e1d7d87e84de05d025a593
    source_path: tools/media-overview.md
    workflow: 15
---

# Génération et compréhension des médias

OpenClaw génère des images, des vidéos et de la musique, comprend les médias entrants (images, audio, vidéo), et lit les réponses à voix haute avec la synthèse vocale. Toutes les capacités média sont pilotées par des outils : l’agent décide quand les utiliser en fonction de la conversation, et chaque outil n’apparaît que lorsqu’au moins un fournisseur de support est configuré.

## Capacités en un coup d’œil

| Capacité             | Outil            | Fournisseurs                                                                                | Ce qu’il fait                                           |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Génération d’images  | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                           | Crée ou édite des images à partir de prompts texte ou de références |
| Génération de vidéo  | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Crée des vidéos à partir de texte, d’images ou de vidéos existantes |
| Génération de musique | `music_generate` | ComfyUI, Google, MiniMax                                                                    | Crée de la musique ou des pistes audio à partir de prompts texte |
| Synthèse vocale (TTS) | `tts`           | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                 | Convertit les réponses sortantes en audio parlé         |
| Compréhension des médias | (automatique) | Tout fournisseur de modèle compatible vision/audio, plus replis CLI                         | Résume les images, l’audio et la vidéo entrants         |

## Matrice de capacités des fournisseurs

Ce tableau montre quels fournisseurs prennent en charge quelles capacités média sur la plateforme.

| Fournisseur | Image | Vidéo | Musique | TTS | STT / Transcription | Compréhension des médias |
| ----------- | ----- | ----- | ------- | --- | ------------------- | ------------------------ |
| Alibaba     |       | Yes   |         |     |                     |                          |
| BytePlus    |       | Yes   |         |     |                     |                          |
| ComfyUI     | Yes   | Yes   | Yes     |     |                     |                          |
| Deepgram    |       |       |         |     | Yes                 |                          |
| ElevenLabs  |       |       |         | Yes | Yes                 |                          |
| fal         | Yes   | Yes   |         |     |                     |                          |
| Google      | Yes   | Yes   | Yes     |     |                     | Yes                      |
| Microsoft   |       |       |         | Yes |                     |                          |
| MiniMax     | Yes   | Yes   | Yes     | Yes |                     | Yes                      |
| Mistral     |       |       |         |     | Yes                 |                          |
| OpenAI      | Yes   | Yes   |         | Yes | Yes                 | Yes                      |
| Qwen        |       | Yes   |         |     |                     |                          |
| Runway      |       | Yes   |         |     |                     |                          |
| Together    |       | Yes   |         |     |                     |                          |
| Vydra       | Yes   | Yes   |         |     |                     |                          |
| xAI         | Yes   | Yes   |         | Yes | Yes                 | Yes                      |

<Note>
La compréhension des médias utilise tout modèle compatible vision ou audio enregistré dans votre configuration de fournisseur. Le tableau ci-dessus met en avant les fournisseurs avec prise en charge dédiée de la compréhension des médias ; la plupart des fournisseurs LLM avec modèles multimodaux (Anthropic, Google, OpenAI, etc.) peuvent aussi comprendre les médias entrants lorsqu’ils sont configurés comme modèle de réponse actif.
</Note>

## Fonctionnement de la génération asynchrone

La génération de vidéo et de musique s’exécute comme tâche en arrière-plan car le traitement fournisseur prend généralement de 30 secondes à plusieurs minutes. Lorsque l’agent appelle `video_generate` ou `music_generate`, OpenClaw soumet la requête au fournisseur, renvoie immédiatement un ID de tâche et suit le travail dans le journal des tâches. L’agent continue de répondre à d’autres messages pendant l’exécution du travail. Lorsque le fournisseur a terminé, OpenClaw réveille l’agent afin qu’il puisse republier le média terminé dans le canal d’origine. La génération d’images et le TTS sont synchrones et se terminent inline avec la réponse.

Deepgram, ElevenLabs, Mistral, OpenAI et xAI peuvent tous transcrire l’audio entrant
via le chemin batch `tools.media.audio` lorsqu’ils sont configurés. Deepgram,
ElevenLabs, Mistral, OpenAI et xAI enregistrent également des fournisseurs STT en streaming pour Voice Call,
de sorte que l’audio téléphonique live peut être transmis au fournisseur sélectionné
sans attendre un enregistrement terminé.

OpenAI se mappe aux surfaces OpenClaw de génération d’images, vidéo, TTS batch, STT batch, STT
en streaming Voice Call, voix realtime et embeddings de mémoire. xAI se mappe actuellement
aux surfaces OpenClaw d’image, vidéo, recherche, exécution de code, TTS batch, STT batch,
et STT en streaming Voice Call. La voix realtime xAI est une capacité amont,
mais elle n’est pas enregistrée dans OpenClaw tant que le contrat partagé de voix realtime
ne peut pas la représenter.

## Liens rapides

- [Génération d’images](/fr/tools/image-generation) -- générer et éditer des images
- [Génération de vidéo](/fr/tools/video-generation) -- text-to-video, image-to-video et video-to-video
- [Génération de musique](/fr/tools/music-generation) -- créer de la musique et des pistes audio
- [Synthèse vocale](/fr/tools/tts) -- convertir les réponses en audio parlé
- [Compréhension des médias](/fr/nodes/media-understanding) -- comprendre les images, l’audio et la vidéo entrants

## Associé

- [Génération d’images](/fr/tools/image-generation)
- [Génération de vidéo](/fr/tools/video-generation)
- [Génération de musique](/fr/tools/music-generation)
- [Synthèse vocale](/fr/tools/tts)
