---
read_when:
    - Intégrer des clients qui parlent l’API OpenResponses
    - Vous voulez des entrées basées sur des items, des appels d’outils côté client ou des événements SSE
summary: Exposer un point de terminaison HTTP `/v1/responses` compatible OpenResponses depuis Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-04-05T12:43:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3f2905fe45accf2699de8a561d15311720f249f9229d26550c16577428ea8a9
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

# API OpenResponses (HTTP)

La Gateway d’OpenClaw peut servir un point de terminaison `POST /v1/responses` compatible OpenResponses.

Ce point de terminaison est **désactivé par défaut**. Activez-le d’abord dans la configuration.

- `POST /v1/responses`
- Même port que Gateway (multiplexage WS + HTTP) : `http://<gateway-host>:<port>/v1/responses`

En interne, les requêtes sont exécutées comme une exécution normale d’agent Gateway (même chemin de code que
`openclaw agent`), donc le routage/les autorisations/la configuration correspondent à votre Gateway.

## Authentification, sécurité et routage

Le comportement opérationnel correspond à [OpenAI Chat Completions](/gateway/openai-http-api) :

- utilisez le chemin d’authentification HTTP Gateway correspondant :
  - authentification par secret partagé (`gateway.auth.mode="token"` ou `"password"`) : `Authorization: Bearer <token-or-password>`
  - authentification par proxy de confiance (`gateway.auth.mode="trusted-proxy"`) : en-têtes de proxy avec identité, provenant d’une source de proxy de confiance configurée hors loopback
  - authentification ouverte sur ingress privé (`gateway.auth.mode="none"`) : aucun en-tête d’authentification
- traitez ce point de terminaison comme un accès opérateur complet pour l’instance gateway
- pour les modes d’authentification par secret partagé (`token` et `password`), ignorez les valeurs plus étroites déclarées dans le bearer `x-openclaw-scopes` et restaurez les valeurs par défaut normales de l’opérateur complet
- pour les modes HTTP avec identité de confiance (par exemple l’authentification par proxy de confiance ou `gateway.auth.mode="none"`), respectez `x-openclaw-scopes` lorsqu’il est présent et revenez sinon à l’ensemble normal de portées par défaut de l’opérateur
- sélectionnez les agents avec `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"`, ou `x-openclaw-agent-id`
- utilisez `x-openclaw-model` lorsque vous voulez remplacer le modèle backend de l’agent sélectionné
- utilisez `x-openclaw-session-key` pour un routage explicite de session
- utilisez `x-openclaw-message-channel` lorsque vous voulez un contexte de canal d’entrée synthétique non par défaut

Matrice d’authentification :

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - prouve la possession du secret opérateur partagé de gateway
  - ignore les `x-openclaw-scopes` plus étroits
  - restaure l’ensemble complet de portées par défaut de l’opérateur :
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traite les tours de chat sur ce point de terminaison comme des tours d’expéditeur propriétaire
- modes HTTP avec identité de confiance (par exemple auth proxy de confiance, ou `gateway.auth.mode="none"` sur ingress privé)
  - respectent `x-openclaw-scopes` lorsque l’en-tête est présent
  - reviennent à l’ensemble normal de portées par défaut de l’opérateur lorsque l’en-tête est absent
  - ne perdent la sémantique propriétaire que lorsque l’appelant restreint explicitement les portées et omet `operator.admin`

Activez ou désactivez ce point de terminaison avec `gateway.http.endpoints.responses.enabled`.

Cette même surface de compatibilité inclut également :

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Pour l’explication canonique de la façon dont les modèles ciblant des agents, `openclaw/default`, le pass-through des embeddings et les remplacements de modèle backend s’articulent, voir [OpenAI Chat Completions](/gateway/openai-http-api#agent-first-model-contract) et [Liste de modèles et routage des agents](/gateway/openai-http-api#model-list-and-agent-routing).

## Comportement de session

Par défaut, ce point de terminaison est **sans état par requête** (une nouvelle clé de session est générée à chaque appel).

Si la requête inclut une chaîne OpenResponses `user`, Gateway en dérive une clé de session stable,
de sorte que des appels répétés puissent partager une session d’agent.

## Forme de requête (prise en charge)

La requête suit l’API OpenResponses avec une entrée basée sur des items. Prise en charge actuelle :

- `input` : chaîne ou tableau d’objets item.
- `instructions` : fusionné dans le prompt système.
- `tools` : définitions d’outils côté client (outils de fonction).
- `tool_choice` : filtrer ou exiger des outils côté client.
- `stream` : active le streaming SSE.
- `max_output_tokens` : limite de sortie au mieux (selon le fournisseur).
- `user` : routage de session stable.

Acceptés mais **actuellement ignorés** :

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Pris en charge :

- `previous_response_id` : OpenClaw réutilise la session de réponse précédente lorsque la requête reste dans la même portée agent/utilisateur/session demandée.

## Items (entrée)

### `message`

Rôles : `system`, `developer`, `user`, `assistant`.

- `system` et `developer` sont ajoutés au prompt système.
- L’item `user` ou `function_call_output` le plus récent devient le « message courant ».
- Les messages user/assistant antérieurs sont inclus dans l’historique pour le contexte.

### `function_call_output` (outils par tour)

Renvoyer les résultats d’outils au modèle :

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` et `item_reference`

Acceptés pour la compatibilité de schéma mais ignorés lors de la construction du prompt.

## Outils (outils de fonction côté client)

Fournissez des outils avec `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Si l’agent décide d’appeler un outil, la réponse renvoie un item de sortie `function_call`.
Vous envoyez ensuite une requête de suivi avec `function_call_output` pour continuer le tour.

## Images (`input_image`)

Prend en charge des sources base64 ou URL :

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Types MIME autorisés (actuellement) : `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Taille maximale (actuellement) : 10MB.

## Fichiers (`input_file`)

Prend en charge des sources base64 ou URL :

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

Types MIME autorisés (actuellement) : `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Taille maximale (actuellement) : 5MB.

Comportement actuel :

- Le contenu du fichier est décodé et ajouté au **prompt système**, pas au message utilisateur,
  afin qu’il reste éphémère (non persistant dans l’historique de session).
- Le texte de fichier décodé est encapsulé comme **contenu externe non fiable** avant d’être ajouté,
  de sorte que les octets du fichier soient traités comme des données, pas comme des instructions fiables.
- Le bloc injecté utilise des marqueurs de frontière explicites comme
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` et inclut une ligne de métadonnées
  `Source: External`.
- Ce chemin d’entrée de fichier omet intentionnellement la longue bannière `SECURITY NOTICE:`
  pour préserver le budget de prompt ; les marqueurs de frontière et les métadonnées restent néanmoins en place.
- Les PDF sont d’abord analysés pour le texte. Si peu de texte est trouvé, les premières pages sont
  rasterisées en images et transmises au modèle, et le bloc de fichier injecté utilise
  l’espace réservé `[PDF content rendered to images]`.

L’analyse PDF utilise le build legacy `pdfjs-dist` compatible Node (sans worker). Le build moderne
de PDF.js attend des workers navigateur/des globals DOM, il n’est donc pas utilisé dans Gateway.

Valeurs par défaut pour la récupération d’URL :

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (nombre total de parties `input_file` + `input_image` basées sur URL par requête)
- Les requêtes sont protégées (résolution DNS, blocage des IP privées, plafonds de redirection, timeouts).
- Des listes d’autorisation de noms d’hôte facultatives sont prises en charge par type d’entrée (`files.urlAllowlist`, `images.urlAllowlist`).
  - Hôte exact : `"cdn.example.com"`
  - Sous-domaines wildcard : `"*.assets.example.com"` (ne correspond pas à l’apex)
  - Les listes d’autorisation vides ou omises signifient qu’il n’y a pas de restriction de liste d’autorisation de noms d’hôte.
- Pour désactiver complètement les récupérations basées sur URL, définissez `files.allowUrl: false` et/ou `images.allowUrl: false`.

## Limites de fichiers + images (configuration)

Les valeurs par défaut peuvent être ajustées sous `gateway.http.endpoints.responses` :

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

Valeurs par défaut lorsqu’elles sont omises :

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- Les sources `input_image` HEIC/HEIF sont acceptées et normalisées en JPEG avant l’envoi au fournisseur.

Remarque de sécurité :

- Les listes d’autorisation d’URL sont appliquées avant la récupération et lors des sauts de redirection.
- Autoriser un nom d’hôte ne contourne pas le blocage des IP privées/internes.
- Pour les gateways exposées à Internet, appliquez des contrôles d’egress réseau en plus des garde-fous au niveau de l’application.
  Voir [Sécurité](/gateway/security).

## Streaming (SSE)

Définissez `stream: true` pour recevoir des événements Server-Sent Events (SSE) :

- `Content-Type: text/event-stream`
- Chaque ligne d’événement est `event: <type>` et `data: <json>`
- Le flux se termine par `data: [DONE]`

Types d’événements actuellement émis :

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (en cas d’erreur)

## Usage

`usage` est renseigné lorsque le fournisseur sous-jacent rapporte des comptes de jetons.
OpenClaw normalise les alias courants de style OpenAI avant que ces compteurs n’atteignent
les surfaces de statut/session en aval, notamment `input_tokens` / `output_tokens`
et `prompt_tokens` / `completion_tokens`.

## Erreurs

Les erreurs utilisent un objet JSON comme :

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Cas courants :

- `401` authentification manquante/invalide
- `400` corps de requête invalide
- `405` mauvaise méthode

## Exemples

Sans streaming :

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

Avec streaming :

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```
