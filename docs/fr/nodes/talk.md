---
read_when:
    - Implémenter le mode Talk sur macOS/iOS/Android
    - Modifier le comportement de la voix/TTS/des interruptions
summary: 'Mode Talk : conversations vocales continues avec ElevenLabs TTS'
title: Mode Talk
x-i18n:
    generated_at: "2026-04-24T07:19:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49286cd39a104d4514eb1df75627a2f64182313b11792bb246f471178a702198
    source_path: nodes/talk.md
    workflow: 15
---

Le mode Talk est une boucle continue de conversation vocale :

1. Écouter la parole
2. Envoyer la transcription au modèle (session principale, `chat.send`)
3. Attendre la réponse
4. La prononcer via le fournisseur Talk configuré (`talk.speak`)

## Comportement (macOS)

- **Overlay toujours actif** tant que le mode Talk est activé.
- Transitions de phase **Écoute → Réflexion → Parole**.
- Lors d’une **courte pause** (fenêtre de silence), la transcription actuelle est envoyée.
- Les réponses sont **écrites dans WebChat** (comme si elles étaient saisies).
- **Interruption à la parole** (activée par défaut) : si l’utilisateur commence à parler pendant que l’assistant parle, nous arrêtons la lecture et notons l’horodatage d’interruption pour le prompt suivant.

## Directives vocales dans les réponses

L’assistant peut préfixer sa réponse avec une **ligne JSON unique** pour contrôler la voix :

```json
{ "voice": "<voice-id>", "once": true }
```

Règles :

- Première ligne non vide uniquement.
- Les clés inconnues sont ignorées.
- `once: true` s’applique uniquement à la réponse actuelle.
- Sans `once`, la voix devient la nouvelle valeur par défaut du mode Talk.
- La ligne JSON est supprimée avant la lecture TTS.

Clés prises en charge :

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (MPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Configuration (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Valeurs par défaut :

- `interruptOnSpeech`: true
- `silenceTimeoutMs` : lorsqu’il n’est pas défini, Talk conserve la fenêtre de pause par défaut de la plateforme avant d’envoyer la transcription (`700 ms sur macOS et Android, `900 ms sur iOS`)
- `voiceId` : repli sur `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` (ou la première voix ElevenLabs lorsqu’une clé API est disponible)
- `modelId` : vaut `eleven_v3` par défaut lorsqu’il n’est pas défini
- `apiKey` : repli sur `ELEVENLABS_API_KEY` (ou le profil shell du gateway s’il est disponible)
- `outputFormat` : vaut par défaut `pcm_44100` sur macOS/iOS et `pcm_24000` sur Android (définissez `mp3_*` pour forcer le streaming MP3)

## Interface macOS

- Bascule de barre de menus : **Talk**
- Onglet de configuration : groupe **Mode Talk** (ID de voix + bascule d’interruption)
- Overlay :
  - **Écoute** : le nuage pulse avec le niveau du micro
  - **Réflexion** : animation descendante
  - **Parole** : anneaux rayonnants
  - Clic sur le nuage : arrêter la parole
  - Clic sur X : quitter le mode Talk

## Remarques

- Nécessite les permissions Speech + Microphone.
- Utilise `chat.send` avec la clé de session `main`.
- Le gateway résout la lecture Talk via `talk.speak` en utilisant le fournisseur Talk actif. Android revient au TTS système local uniquement lorsque ce RPC n’est pas disponible.
- `stability` pour `eleven_v3` est validé à `0.0`, `0.5` ou `1.0` ; les autres modèles acceptent `0..1`.
- `latency_tier` est validé à `0..4` lorsqu’il est défini.
- Android prend en charge les formats de sortie `pcm_16000`, `pcm_22050`, `pcm_24000` et `pcm_44100` pour le streaming AudioTrack à faible latence.

## Lié

- [Voice wake](/fr/nodes/voicewake)
- [Audio et notes vocales](/fr/nodes/audio)
- [Compréhension des médias](/fr/nodes/media-understanding)
