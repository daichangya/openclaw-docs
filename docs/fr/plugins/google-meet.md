---
read_when:
    - Vous souhaitez qu’un agent OpenClaw rejoigne un appel Google Meet
    - Vous configurez Chrome, le node Chrome, ou Twilio comme transport Google Meet
summary: 'Plugin Google Meet : rejoindre des URL Meet explicites via Chrome ou Twilio avec des paramètres vocaux temps réel par défaut'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T07:22:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0bf06b7ab585bf2dc9dbf6d890e1954e89e4deea148380e350d2d7f4d954f5e
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Prise en charge des participants Google Meet pour OpenClaw.

Le plugin est explicite par conception :

- Il ne rejoint qu’une URL explicite `https://meet.google.com/...`.
- La voix `realtime` est le mode par défaut.
- La voix temps réel peut rappeler l’agent OpenClaw complet lorsque du
  raisonnement plus approfondi ou des outils sont nécessaires.
- L’authentification commence comme un OAuth Google personnel ou un profil Chrome déjà connecté.
- Il n’y a pas d’annonce automatique de consentement.
- Le backend audio Chrome par défaut est `BlackHole 2ch`.
- Chrome peut s’exécuter localement ou sur un hôte node appairé.
- Twilio accepte un numéro d’appel ainsi qu’un PIN ou une séquence DTMF facultatifs.
- La commande CLI est `googlemeet` ; `meet` est réservée à des workflows plus larges
  de téléconférence d’agent.

## Démarrage rapide

Installez les dépendances audio locales et assurez-vous que le fournisseur temps réel peut utiliser
OpenAI :

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

`blackhole-2ch` installe le périphérique audio virtuel `BlackHole 2ch`. L’installateur Homebrew
requiert un redémarrage avant que macOS n’expose le périphérique :

```bash
sudo reboot
```

Après le redémarrage, vérifiez les deux éléments :

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Activez le plugin :

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Vérifiez la configuration :

```bash
openclaw googlemeet setup
```

Rejoignez une réunion :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Ou laissez un agent rejoindre via l’outil `google_meet` :

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome rejoint avec le profil Chrome connecté. Dans Meet, choisissez `BlackHole 2ch` pour
le chemin micro/haut-parleur utilisé par OpenClaw. Pour un duplex audio propre, utilisez
des périphériques virtuels distincts ou un graphe de type Loopback ; un seul périphérique BlackHole suffit
pour un premier smoke test mais peut provoquer de l’écho.

### Gateway local + Chrome sous Parallels

Vous n’avez **pas** besoin d’un Gateway OpenClaw complet ni d’une clé API de modèle à l’intérieur d’une VM macOS
simplement pour que la VM héberge Chrome. Exécutez le Gateway et l’agent localement, puis exécutez un
hôte node dans la VM. Activez une fois le plugin inclus dans la VM pour que le node
annonce la commande Chrome :

Ce qui s’exécute où :

- Hôte Gateway : Gateway OpenClaw, espace de travail agent, clés de modèle/API, fournisseur temps réel
  et configuration du plugin Google Meet.
- VM macOS Parallels : CLI/node host OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  et un profil Chrome connecté à Google.
- Non nécessaire dans la VM : service Gateway, configuration d’agent, clé OpenAI/GPT, ou configuration
  de fournisseur de modèle.

Installez les dépendances de la VM :

```bash
brew install blackhole-2ch sox
```

Redémarrez la VM après l’installation de BlackHole afin que macOS expose `BlackHole 2ch` :

```bash
sudo reboot
```

Après le redémarrage, vérifiez que la VM voit le périphérique audio et les commandes SoX :

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Installez ou mettez à jour OpenClaw dans la VM, puis activez-y le plugin inclus :

```bash
openclaw plugins enable google-meet
```

Démarrez l’hôte node dans la VM :

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Si `<gateway-host>` est une IP LAN et que vous n’utilisez pas TLS, le node refuse le
WebSocket en clair sauf si vous activez explicitement ce réseau privé de confiance :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Utilisez la même variable d’environnement lorsque vous installez le node comme LaunchAgent :

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` est une variable d’environnement de processus, pas un
paramètre `openclaw.json`. `openclaw node install` l’enregistre dans l’environnement du LaunchAgent
lorsqu’elle est présente sur la commande d’installation.

Approuvez le node depuis l’hôte Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirmez que le Gateway voit le node et qu’il annonce `googlemeet.chrome` :

```bash
openclaw nodes status
```

Faites passer Meet par ce node sur l’hôte Gateway :

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Vous pouvez maintenant rejoindre normalement depuis l’hôte Gateway :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

ou demander à l’agent d’utiliser l’outil `google_meet` avec `transport: "chrome-node"`.

Si `chromeNode.node` est omis, OpenClaw ne fait une sélection automatique que lorsqu’un seul
node connecté annonce `googlemeet.chrome`. Si plusieurs nodes capables sont
connectés, définissez `chromeNode.node` sur l’identifiant du node, le nom d’affichage ou l’IP distante.

Vérifications courantes en cas d’échec :

- `No connected Google Meet-capable node` : démarrez `openclaw node run` dans la VM,
  approuvez le pairing, et assurez-vous que `openclaw plugins enable google-meet` a bien été exécuté
  dans la VM. Confirmez aussi que l’hôte Gateway autorise la commande node avec
  `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node` : installez `blackhole-2ch`
  dans la VM puis redémarrez la VM.
- Chrome s’ouvre mais ne peut pas rejoindre : connectez-vous à Chrome dans la VM et confirmez que
  ce profil peut rejoindre manuellement l’URL Meet.
- Pas de son : dans Meet, faites passer le micro/haut-parleur par le chemin du périphérique audio virtuel
  utilisé par OpenClaw ; utilisez des périphériques virtuels séparés ou un routage de type Loopback
  pour un duplex propre.

## Notes d’installation

Le mode par défaut Chrome realtime utilise deux outils externes :

- `sox` : utilitaire audio en ligne de commande. Le plugin utilise ses commandes `rec` et `play`
  pour le pont audio G.711 mu-law 8 kHz par défaut.
- `blackhole-2ch` : pilote audio virtuel macOS. Il crée le périphérique audio `BlackHole 2ch`
  par lequel Chrome/Meet peuvent être routés.

OpenClaw n’intègre ni ne redistribue aucun de ces deux packages. La documentation demande aux utilisateurs de
les installer comme dépendances hôtes via Homebrew. SoX est sous licence
`LGPL-2.0-only AND GPL-2.0-only` ; BlackHole est GPL-3.0. Si vous construisez un
installateur ou une appliance qui intègre BlackHole avec OpenClaw, examinez les
conditions de licence amont de BlackHole ou obtenez une licence séparée auprès d’Existential Audio.

## Transports

### Chrome

Le transport Chrome ouvre l’URL Meet dans Google Chrome et rejoint avec le profil
Chrome connecté. Sur macOS, le plugin vérifie la présence de `BlackHole 2ch` avant le lancement.
S’il est configuré, il exécute aussi une commande de contrôle de santé du pont audio et une commande de démarrage
avant d’ouvrir Chrome. Utilisez `chrome` lorsque Chrome/l’audio résident sur l’hôte Gateway ;
utilisez `chrome-node` lorsque Chrome/l’audio résident sur un node appairé comme une VM macOS Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Faites passer l’audio micro et haut-parleur de Chrome par le pont audio local OpenClaw.
Si `BlackHole 2ch` n’est pas installé, la jonction échoue avec une erreur de configuration
au lieu de rejoindre silencieusement sans chemin audio.

### Twilio

Le transport Twilio est un plan d’appel strict délégué au plugin Voice Call. Il
n’analyse pas les pages Meet pour extraire des numéros de téléphone.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Utilisez `--dtmf-sequence` lorsque la réunion nécessite une séquence personnalisée :

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth et préflight

L’accès à l’API Google Meet Media utilise d’abord un client OAuth personnel. Configurez
`oauth.clientId` et éventuellement `oauth.clientSecret`, puis exécutez :

```bash
openclaw googlemeet auth login --json
```

La commande affiche un bloc de configuration `oauth` avec un jeton d’actualisation. Elle utilise PKCE,
un callback localhost sur `http://localhost:8085/oauth2callback`, et un flux manuel
copier/coller avec `--manual`.

Ces variables d’environnement sont acceptées en repli :

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` ou `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` ou `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` ou `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` ou `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` ou
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` ou `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` ou `GOOGLE_MEET_PREVIEW_ACK`

Résolvez une URL Meet, un code, ou `spaces/{id}` via `spaces.get` :

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Exécutez le préflight avant tout travail média :

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Définissez `preview.enrollmentAcknowledged: true` uniquement après avoir confirmé que votre
projet Cloud, le principal OAuth et les participants à la réunion sont inscrits au Google
Workspace Developer Preview Program pour les API média Meet.

## Configuration

Le chemin Chrome realtime courant n’a besoin que du plugin activé, de BlackHole, de SoX,
et d’une clé OpenAI :

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

Définissez la configuration du plugin sous `plugins.entries.google-meet.config` :

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Valeurs par défaut :

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node` : identifiant/nom/IP de node facultatif pour `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand` : commande SoX `rec` écrivant de l’audio
  G.711 mu-law 8 kHz sur stdout
- `chrome.audioOutputCommand` : commande SoX `play` lisant de l’audio
  G.711 mu-law 8 kHz depuis stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions` : réponses parlées brèves, avec
  `openclaw_agent_consult` pour des réponses plus approfondies

Surcharges facultatives :

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    toolPolicy: "owner",
  },
}
```

Configuration Twilio uniquement :

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

## Outil

Les agents peuvent utiliser l’outil `google_meet` :

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Utilisez `transport: "chrome"` lorsque Chrome s’exécute sur l’hôte Gateway. Utilisez
`transport: "chrome-node"` lorsque Chrome s’exécute sur un node appairé comme une VM
Parallels. Dans les deux cas, le modèle temps réel et `openclaw_agent_consult` s’exécutent sur l’hôte
Gateway, donc les identifiants du modèle y restent.

Utilisez `action: "status"` pour lister les sessions actives ou inspecter un ID de session. Utilisez
`action: "leave"` pour marquer une session comme terminée.

## Consultation d’agent en temps réel

Le mode Chrome realtime est optimisé pour une boucle vocale en direct. Le fournisseur
vocal temps réel entend l’audio de la réunion et parle via le pont audio configuré.
Lorsque le modèle temps réel a besoin d’un raisonnement plus approfondi, d’informations à jour,
ou des outils OpenClaw normaux, il peut appeler `openclaw_agent_consult`.

L’outil de consultation exécute en coulisses l’agent OpenClaw ordinaire avec le contexte
récent de transcription de réunion et renvoie une réponse concise parlée à la session
vocale temps réel. Le modèle vocal peut ensuite prononcer cette réponse dans la réunion.

`realtime.toolPolicy` contrôle l’exécution de consultation :

- `safe-read-only` : expose l’outil de consultation et limite l’agent ordinaire à
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, et
  `memory_get`.
- `owner` : expose l’outil de consultation et laisse l’agent ordinaire utiliser la politique normale d’outils de l’agent.
- `none` : n’expose pas l’outil de consultation au modèle vocal temps réel.

La clé de session de consultation est limitée par session Meet, de sorte que les appels de consultation de suivi
puissent réutiliser le contexte des consultations précédentes pendant la même réunion.

## Remarques

L’API média officielle de Google Meet est orientée réception, donc parler dans un appel Meet
nécessite toujours un chemin de participant. Ce plugin garde cette frontière visible :
Chrome gère la participation via le navigateur et le routage audio local ; Twilio gère
la participation par appel téléphonique.

Le mode Chrome realtime nécessite soit :

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand` : OpenClaw possède le
  pont du modèle temps réel et fait passer l’audio G.711 mu-law 8 kHz entre ces
  commandes et le fournisseur vocal temps réel sélectionné.
- `chrome.audioBridgeCommand` : une commande de pont externe possède tout le chemin
  audio local et doit se terminer après avoir démarré ou validé son démon.

Pour un duplex propre, faites passer la sortie Meet et le microphone Meet par des
périphériques virtuels séparés ou par un graphe de périphériques virtuels de type Loopback. Un seul périphérique
BlackHole partagé peut réinjecter les autres participants dans l’appel.

`googlemeet leave` arrête le pont audio temps réel par paire de commandes pour les sessions
Chrome. Pour les sessions Twilio déléguées via le plugin Voice Call, cela
raccroche aussi l’appel vocal sous-jacent.

## Articles connexes

- [Plugin Voice Call](/fr/plugins/voice-call)
- [Mode Talk](/fr/nodes/talk)
- [Créer des plugins](/fr/plugins/building-plugins)
