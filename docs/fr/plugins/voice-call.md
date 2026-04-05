---
read_when:
    - Vous voulez passer un appel vocal sortant depuis OpenClaw
    - Vous configurez ou développez le plugin voice-call
summary: 'Plugin Voice Call : appels sortants + entrants via Twilio/Telnyx/Plivo (installation du plugin + configuration + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-05T12:51:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e6d10c9fde6ce1f51637af285edc0c710e9cb7702231c0a91b527b721eaddc1
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (plugin)

Les appels vocaux pour OpenClaw via un plugin. Prend en charge les notifications sortantes et
les conversations à plusieurs tours avec des politiques d’appels entrants.

Fournisseurs actuels :

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transfert XML + parole GetInput)
- `mock` (dev/sans réseau)

Modèle mental rapide :

- Installez le plugin
- Redémarrez la Gateway
- Configurez sous `plugins.entries.voice-call.config`
- Utilisez `openclaw voicecall ...` ou l’outil `voice_call`

## Où il s’exécute (local vs distant)

Le plugin Voice Call s’exécute **dans le processus Gateway**.

Si vous utilisez une Gateway distante, installez/configurez le plugin sur la **machine qui exécute la Gateway**, puis redémarrez la Gateway pour le charger.

## Installation

### Option A : installer depuis npm (recommandé)

```bash
openclaw plugins install @openclaw/voice-call
```

Redémarrez ensuite la Gateway.

### Option B : installer depuis un dossier local (dev, sans copie)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Redémarrez ensuite la Gateway.

## Configuration

Définissez la configuration sous `plugins.entries.voice-call.config` :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Telnyx Mission Control Portal
            // (Base64 string; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // optional; first registered realtime transcription provider when unset
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },
        },
      },
    },
  },
}
```

Remarques :

- Twilio/Telnyx exigent une URL de webhook **publiquement joignable**.
- Plivo exige une URL de webhook **publiquement joignable**.
- `mock` est un fournisseur de développement local (sans appels réseau).
- Si des configurations plus anciennes utilisent encore `provider: "log"`, `twilio.from` ou les anciennes clés OpenAI `streaming.*`, exécutez `openclaw doctor --fix` pour les réécrire.
- Telnyx exige `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`) sauf si `skipSignatureVerification` vaut true.
- `skipSignatureVerification` est réservé aux tests locaux.
- Si vous utilisez le niveau gratuit de ngrok, définissez `publicUrl` sur l’URL ngrok exacte ; la vérification de signature est toujours appliquée.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` autorise les webhooks Twilio avec des signatures invalides **uniquement** lorsque `tunnel.provider="ngrok"` et `serve.bind` est en loopback (agent local ngrok). À utiliser uniquement pour le développement local.
- Les URL ngrok du niveau gratuit peuvent changer ou ajouter un comportement interstitiel ; si `publicUrl` dérive, les signatures Twilio échoueront. En production, préférez un domaine stable ou Tailscale funnel.
- Valeurs de sécurité par défaut du streaming :
  - `streaming.preStartTimeoutMs` ferme les sockets qui n’envoient jamais de trame `start` valide.
- `streaming.maxPendingConnections` plafonne le total des sockets pré-start non authentifiés.
- `streaming.maxPendingConnectionsPerIp` plafonne les sockets pré-start non authentifiés par IP source.
- `streaming.maxConnections` plafonne le total des sockets ouverts de flux média (en attente + actifs).
- Le repli runtime accepte encore pour l’instant ces anciennes clés voice-call, mais le chemin de réécriture est `openclaw doctor --fix` et le shim de compatibilité est temporaire.

## Transcription en streaming

`streaming` sélectionne un fournisseur de transcription temps réel pour l’audio d’appel en direct.

Comportement actuel du runtime :

- `streaming.provider` est facultatif. S’il n’est pas défini, Voice Call utilise le premier
  fournisseur de transcription temps réel enregistré.
- Aujourd’hui, le fournisseur intégré est OpenAI, enregistré par le plugin intégré `openai`.
- La configuration brute possédée par le fournisseur se trouve sous `streaming.providers.<providerId>`.
- Si `streaming.provider` pointe vers un fournisseur non enregistré, ou si aucun fournisseur
  de transcription temps réel n’est enregistré, Voice Call journalise un avertissement et
  ignore le streaming média au lieu de faire échouer tout le plugin.

Valeurs par défaut de la transcription OpenAI en streaming :

- Clé API : `streaming.providers.openai.apiKey` ou `OPENAI_API_KEY`
- modèle : `gpt-4o-transcribe`
- `silenceDurationMs` : `800`
- `vadThreshold` : `0.5`

Exemple :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

Les anciennes clés sont toujours migrées automatiquement par `openclaw doctor --fix` :

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Nettoyeur d’appels obsolètes

Utilisez `staleCallReaperSeconds` pour terminer les appels qui ne reçoivent jamais de webhook terminal
(par exemple, les appels en mode notify qui ne se terminent jamais). La valeur par défaut est `0`
(désactivé).

Plages recommandées :

- **Production :** `120`–`300` secondes pour les flux de style notify.
- Gardez cette valeur **supérieure à `maxDurationSeconds`** afin que les appels normaux puissent
  se terminer. Un bon point de départ est `maxDurationSeconds + 30–60` secondes.

Exemple :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Sécurité du webhook

Lorsqu’un proxy ou un tunnel se trouve devant la Gateway, le plugin reconstruit l’URL
publique pour la vérification de signature. Ces options contrôlent les en-têtes transférés
considérés comme fiables.

`webhookSecurity.allowedHosts` définit une liste d’autorisation des hôtes provenant des en-têtes de forwarding.

`webhookSecurity.trustForwardingHeaders` fait confiance aux en-têtes transférés sans liste d’autorisation.

`webhookSecurity.trustedProxyIPs` ne fait confiance aux en-têtes transférés que lorsque l’IP
distante de la requête correspond à la liste.

La protection contre la relecture de webhook est activée pour Twilio et Plivo. Les requêtes de webhook
valides rejouées sont reconnues mais ignorées pour les effets de bord.

Les tours de conversation Twilio incluent un jeton par tour dans les callbacks `<Gather>`, de sorte que
les callbacks vocaux obsolètes/rejoués ne peuvent pas satisfaire un tour de transcription plus récent en attente.

Les requêtes webhook non authentifiées sont rejetées avant la lecture du corps lorsque les
en-têtes de signature requis du fournisseur sont absents.

Le webhook voice-call utilise le profil partagé de corps pré-auth (64 KB / 5 secondes)
plus un plafond d’opérations en vol par IP avant la vérification de signature.

Exemple avec un hôte public stable :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS pour les appels

Voice Call utilise la configuration cœur `messages.tts` pour la
synthèse vocale en streaming sur les appels. Vous pouvez la surcharger sous la configuration du plugin avec la
**même forme** — elle est fusionnée en profondeur avec `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

Remarques :

- Les anciennes clés `tts.<provider>` dans la configuration du plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) sont automatiquement migrées vers `tts.providers.<provider>` au chargement. Préférez la forme `providers` dans la configuration commitée.
- **Microsoft speech est ignoré pour les appels vocaux** (l’audio téléphonique a besoin de PCM ; le transport Microsoft actuel n’expose pas de sortie PCM téléphonique).
- Le TTS cœur est utilisé lorsque le streaming média Twilio est activé ; sinon les appels se replient sur les voix natives du fournisseur.
- Si un flux média Twilio est déjà actif, Voice Call ne se replie pas sur TwiML `<Say>`. Si le TTS téléphonique n’est pas disponible dans cet état, la demande de lecture échoue au lieu de mélanger deux chemins de lecture.
- Lorsque le TTS téléphonique se replie sur un fournisseur secondaire, Voice Call journalise un avertissement avec la chaîne de fournisseurs (`from`, `to`, `attempts`) pour le débogage.

### Plus d’exemples

Utiliser uniquement le TTS cœur (pas de surcharge) :

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

Surcharger vers ElevenLabs juste pour les appels (garder la valeur par défaut cœur ailleurs) :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

Surcharger uniquement le modèle OpenAI pour les appels (exemple de fusion profonde) :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## Appels entrants

La politique des appels entrants est par défaut `disabled`. Pour activer les appels entrants, définissez :

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` est un filtrage de l’identifiant appelant à faible assurance. Le plugin
normalise la valeur `From` fournie par le fournisseur et la compare à `allowFrom`.
La vérification du webhook authentifie la remise par le fournisseur et l’intégrité de la charge utile, mais
elle ne prouve pas la propriété du numéro appelant PSTN/VoIP. Traitez `allowFrom` comme
un filtrage d’identifiant appelant, pas comme une identité forte de l’appelant.

Les réponses automatiques utilisent le système d’agent. Réglez-les avec :

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Contrat de sortie parlée

Pour les réponses automatiques, Voice Call ajoute un contrat strict de sortie parlée au prompt système :

- `{"spoken":"..."}`

Voice Call extrait ensuite le texte parlé de manière défensive :

- Ignore les charges utiles marquées comme contenu de raisonnement/erreur.
- Analyse le JSON direct, le JSON fenced ou les clés `"spoken"` inline.
- Se replie sur le texte brut et supprime les paragraphes initiaux probables de planification/métadonnées.

Cela permet de garder la lecture audio centrée sur un texte destiné à l’appelant et d’éviter que du texte de planification ne fuite dans l’audio.

### Comportement de démarrage de conversation

Pour les appels sortants `conversation`, la gestion du premier message est liée à l’état de lecture live :

- La suppression de file en cas d’interruption et la réponse automatique ne sont supprimées que pendant la lecture active du message d’accueil initial.
- Si la lecture initiale échoue, l’appel retourne à l’état `listening` et le message initial reste en file d’attente pour une nouvelle tentative.
- La lecture initiale pour le streaming Twilio démarre à la connexion du flux sans délai supplémentaire.

### Délai de grâce de déconnexion du flux Twilio

Lorsqu’un flux média Twilio se déconnecte, Voice Call attend `2000ms` avant de terminer automatiquement l’appel :

- Si le flux se reconnecte pendant cette fenêtre, la fin automatique est annulée.
- Si aucun flux n’est réenregistré après la période de grâce, l’appel est terminé pour éviter les appels actifs bloqués.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` lit `calls.jsonl` depuis le chemin de stockage voice-call par défaut. Utilisez
`--file <path>` pour pointer vers un autre journal et `--last <n>` pour limiter l’analyse
aux N derniers enregistrements (200 par défaut). La sortie inclut p50/p90/p99 pour la
latence par tour et les temps d’attente d’écoute.

## Outil d’agent

Nom de l’outil : `voice_call`

Actions :

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

Ce dépôt fournit une documentation de Skill correspondante à `skills/voice-call/SKILL.md`.

## RPC Gateway

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
