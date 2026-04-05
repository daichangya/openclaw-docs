---
read_when:
    - Implémentation du mode Talk sur macOS/iOS/Android
    - Modification du comportement de voix/TTS/interruption
summary: 'Mode Talk : conversations vocales continues avec la synthèse vocale ElevenLabs'
title: Mode Talk
x-i18n:
    generated_at: "2026-04-05T12:47:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f10a3e9ee8fc2b4f7a89771d6e7b7373166a51ef9e9aa2d8c5ea67fc0729f9d
    source_path: nodes/talk.md
    workflow: 15
---

# Mode Talk

Le mode Talk est une boucle continue de conversation vocale :

1. Écouter la parole
2. Envoyer la transcription au modèle (session principale, `chat.send`)
3. Attendre la réponse
4. La prononcer via le fournisseur Talk configuré (`talk.speak`)

## Comportement (macOS)

- **Overlay toujours actif** tant que le mode Talk est activé.
- Transitions de phase **Écoute → Réflexion → Parole**.
- Lors d’une **courte pause** (fenêtre de silence), la transcription en cours est envoyée.
- Les réponses sont **écrites dans WebChat** (comme si elles étaient tapées).
- **Interruption sur parole** (activée par défaut) : si l’utilisateur commence à parler pendant que l’assistant parle, nous arrêtons la lecture et notons l’horodatage de l’interruption pour le prompt suivant.

## Directives vocales dans les réponses

L’assistant peut préfixer sa réponse avec une **unique ligne JSON** pour contrôler la voix :

```json
{ "voice": "<voice-id>", "once": true }
```

Règles :

- Première ligne non vide uniquement.
- Les clés inconnues sont ignorées.
- `once: true` s’applique uniquement à la réponse en cours.
- Sans `once`, la voix devient la nouvelle valeur par défaut du mode Talk.
- La ligne JSON est supprimée avant la lecture TTS.

Clés prises en charge :

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
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
- `silenceTimeoutMs` : lorsqu’il n’est pas défini, Talk conserve la fenêtre de pause par défaut de la plateforme avant d’envoyer la transcription (`700 ms sur macOS et Android, 900 ms sur iOS`)
- `voiceId` : se rabat sur `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` (ou la première voix ElevenLabs lorsqu’une clé API est disponible)
- `modelId` : par défaut `eleven_v3` lorsqu’il n’est pas défini
- `apiKey` : se rabat sur `ELEVENLABS_API_KEY` (ou le profil shell de la passerelle s’il est disponible)
- `outputFormat` : par défaut `pcm_44100` sur macOS/iOS et `pcm_24000` sur Android (définissez `mp3_*` pour forcer le streaming MP3)

## Interface macOS

- Bascule dans la barre de menus : **Talk**
- Onglet de configuration : groupe **Mode Talk** (identifiant de voix + bascule d’interruption)
- Overlay :
  - **Écoute** : nuage qui pulse avec le niveau du micro
  - **Réflexion** : animation d’enfoncement
  - **Parole** : anneaux rayonnants
  - Clic sur le nuage : arrêter la parole
  - Clic sur X : quitter le mode Talk

## Remarques

- Nécessite les permissions Parole + Microphone.
- Utilise `chat.send` contre la clé de session `main`.
- La passerelle résout la lecture Talk via `talk.speak` en utilisant le fournisseur Talk actif. Android se rabat sur le TTS système local uniquement lorsque cette RPC n’est pas disponible.
- `stability` pour `eleven_v3` est validé à `0.0`, `0.5`, ou `1.0` ; les autres modèles acceptent `0..1`.
- `latency_tier` est validé à `0..4` lorsqu’il est défini.
- Android prend en charge les formats de sortie `pcm_16000`, `pcm_22050`, `pcm_24000`, et `pcm_44100` pour le streaming AudioTrack à faible latence.
