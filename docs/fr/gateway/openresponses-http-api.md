---
read_when:
    - Intégrer des clients qui utilisent l’API OpenResponses
    - Vous souhaitez des entrées basées sur des éléments, des appels d’outils côté client ou des événements SSE
summary: Exposer un endpoint HTTP `/v1/responses` compatible OpenResponses depuis le Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-04-24T07:12:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73f2e075b78e5153633af17c3f59cace4516e5aaa88952d643cfafb9d0df8022
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

# API OpenResponses (HTTP)

Le Gateway d’OpenClaw peut servir un endpoint `POST /v1/responses` compatible OpenResponses.

Cet endpoint est **désactivé par défaut**. Activez-le d’abord dans la configuration.

- `POST /v1/responses`
- Même port que le Gateway (multiplexage WS + HTTP) : `http://<gateway-host>:<port>/v1/responses`

En coulisses, les requêtes sont exécutées comme une exécution d’agent Gateway normale (même chemin de code que
`openclaw agent`), de sorte que le routage/les permissions/la configuration correspondent à votre Gateway.

## Authentification, sécurité et routage

Le comportement opérationnel correspond à [OpenAI Chat Completions](/fr/gateway/openai-http-api) :

- utiliser le chemin d’authentification HTTP Gateway correspondant :
  - authentification par secret partagé (`gateway.auth.mode="token"` ou `"password"`) : `Authorization: Bearer <token-or-password>`
  - authentification trusted-proxy (`gateway.auth.mode="trusted-proxy"`) : en-têtes de proxy sensibles à l’identité provenant d’une source de proxy de confiance configurée non loopback
  - authentification ouverte private-ingress (`gateway.auth.mode="none"`) : aucun en-tête d’authentification
- traiter l’endpoint comme un accès operator complet pour l’instance du gateway
- pour les modes d’authentification à secret partagé (`token` et `password`), ignorer les valeurs `x-openclaw-scopes` déclarées par bearer plus étroites et restaurer les valeurs par défaut operator complètes normales
- pour les modes HTTP à identité de confiance (par exemple l’authentification trusted proxy ou `gateway.auth.mode="none"`), respecter `x-openclaw-scopes` lorsqu’il est présent et sinon revenir à l’ensemble normal de portées operator par défaut
- sélectionner les agents avec `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"`, ou `x-openclaw-agent-id`
- utiliser `x-openclaw-model` lorsque vous souhaitez surcharger le modèle backend de l’agent sélectionné
- utiliser `x-openclaw-session-key` pour un routage explicite de session
- utiliser `x-openclaw-message-channel` lorsque vous souhaitez un contexte de canal d’entrée synthétique non par défaut

Matrice d’authentification :

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - prouve la possession du secret operator partagé du gateway
  - ignore les `x-openclaw-scopes` plus étroits
  - restaure l’ensemble complet de portées operator par défaut :
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traite les tours de chat sur cet endpoint comme des tours d’expéditeur propriétaire
- modes HTTP à identité de confiance (par exemple trusted proxy auth, ou `gateway.auth.mode="none"` sur une ingress privée)
  - respectent `x-openclaw-scopes` lorsque l’en-tête est présent
  - reviennent à l’ensemble normal de portées operator par défaut lorsque l’en-tête est absent
  - ne perdent la sémantique propriétaire que lorsque l’appelant restreint explicitement les portées et omet `operator.admin`

Activez ou désactivez cet endpoint avec `gateway.http.endpoints.responses.enabled`.

La même surface de compatibilité inclut également :

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Pour l’explication canonique de la façon dont les modèles ciblant l’agent, `openclaw/default`, le pass-through des embeddings et les surcharges de modèles backend s’articulent, voir [OpenAI Chat Completions](/fr/gateway/openai-http-api#agent-first-model-contract) et [Liste des modèles et routage des agents](/fr/gateway/openai-http-api#model-list-and-agent-routing).

## Comportement des sessions

Par défaut, l’endpoint est **sans état par requête** (une nouvelle clé de session est générée à chaque appel).

Si la requête inclut une chaîne OpenResponses `user`, le Gateway dérive une clé de session stable
à partir de celle-ci, afin que des appels répétés puissent partager une session d’agent.

## Forme de requête (prise en charge)

La requête suit l’API OpenResponses avec une entrée basée sur des éléments. Prise en charge actuelle :

- `input` : chaîne ou tableau d’objets item.
- `instructions` : fusionné dans le prompt système.
- `tools` : définitions d’outils côté client (outils de fonction).
- `tool_choice` : filtrer ou exiger des outils côté client.
- `stream` : active la diffusion SSE.
- `max_output_tokens` : limite de sortie au mieux (dépend du fournisseur).
- `user` : routage stable de session.

Accepté mais **actuellement ignoré** :

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Pris en charge :

- `previous_response_id` : OpenClaw réutilise la session de réponse précédente lorsque la requête reste dans le même périmètre agent/utilisateur/session demandée.

## Éléments (`input`)

### `message`

Rôles : `system`, `developer`, `user`, `assistant`.

- `system` et `developer` sont ajoutés au prompt système.
- L’élément `user` ou `function_call_output` le plus récent devient le « message courant ».
- Les messages utilisateur/assistant antérieurs sont inclus comme historique pour le contexte.

### `function_call_output` (outils par tour)

Renvoyez les résultats d’outils au modèle :

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

Fournissez les outils avec `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Si l’agent décide d’appeler un outil, la réponse renvoie un item de sortie `function_call`.
Vous envoyez ensuite une requête de suivi avec `function_call_output` pour poursuivre le tour.

## Images (`input_image`)

Prend en charge les sources base64 ou URL :

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Types MIME autorisés (actuels) : `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Taille maximale (actuelle) : 10 Mo.

## Fichiers (`input_file`)

Prend en charge les sources base64 ou URL :

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

Types MIME autorisés (actuels) : `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Taille maximale (actuelle) : 5 Mo.

Comportement actuel :

- Le contenu du fichier est décodé et ajouté au **prompt système**, et non au message utilisateur,
  afin qu’il reste éphémère (non persisté dans l’historique de session).
- Le texte de fichier décodé est encapsulé comme **contenu externe non fiable** avant d’être ajouté,
  de sorte que les octets du fichier soient traités comme des données, et non comme des instructions de confiance.
- Le bloc injecté utilise des marqueurs explicites de frontière comme
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` et inclut une ligne de métadonnées
  `Source: External`.
- Ce chemin d’entrée de fichier omet intentionnellement la longue bannière `SECURITY NOTICE:`
  afin de préserver le budget du prompt ; les marqueurs de frontière et les métadonnées restent toutefois en place.
- Les PDF sont d’abord analysés pour en extraire le texte. Si peu de texte est trouvé, les premières pages sont
  rasterisées en images et transmises au modèle, et le bloc de fichier injecté utilise
  l’espace réservé `[PDF content rendered to images]`.

L’analyse des PDF utilise la build legacy `pdfjs-dist` compatible Node (sans worker). La build
moderne de PDF.js attend des workers navigateur/des globals DOM, elle n’est donc pas utilisée dans le Gateway.

Valeurs par défaut de récupération par URL :

- `files.allowUrl` : `true`
- `images.allowUrl` : `true`
- `maxUrlParts` : `8` (nombre total de parties `input_file` + `input_image` basées sur URL par requête)
- Les requêtes sont protégées (résolution DNS, blocage des IP privées, plafonds de redirections, délais).
- Des listes d’autorisation de noms d’hôte facultatives sont prises en charge par type d’entrée (`files.urlAllowlist`, `images.urlAllowlist`).
  - Hôte exact : `"cdn.example.com"`
  - Sous-domaines joker : `"*.assets.example.com"` (ne correspond pas à l’apex)
  - Des listes d’autorisation vides ou omises signifient aucune restriction de liste d’autorisation de noms d’hôte.
- Pour désactiver entièrement les récupérations basées sur URL, définissez `files.allowUrl: false` et/ou `images.allowUrl: false`.

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

- `maxBodyBytes` : 20 Mo
- `maxUrlParts` : 8
- `files.maxBytes` : 5 Mo
- `files.maxChars` : 200 k
- `files.maxRedirects` : 3
- `files.timeoutMs` : 10 s
- `files.pdf.maxPages` : 4
- `files.pdf.maxPixels` : 4 000 000
- `files.pdf.minTextChars` : 200
- `images.maxBytes` : 10 Mo
- `images.maxRedirects` : 3
- `images.timeoutMs` : 10 s
- Les sources `input_image` HEIC/HEIF sont acceptées et normalisées en JPEG avant livraison au fournisseur.

Remarque de sécurité :

- Les listes d’autorisation d’URL sont appliquées avant la récupération et lors des sauts de redirection.
- Mettre un nom d’hôte sur liste d’autorisation ne contourne pas le blocage des IP privées/internes.
- Pour les gateways exposés à Internet, appliquez des contrôles d’egress réseau en plus des gardes au niveau applicatif.
  Voir [Sécurité](/fr/gateway/security).

## Diffusion (SSE)

Définissez `stream: true` pour recevoir des événements Server-Sent Events (SSE) :

- `Content-Type: text/event-stream`
- Chaque ligne d’événement est `event: <type>` et `data: <json>`
- Le flux se termine avec `data: [DONE]`

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

`usage` est renseigné lorsque le fournisseur sous-jacent rapporte des compteurs de jetons.
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

Sans diffusion :

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

Avec diffusion :

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

## Articles connexes

- [OpenAI chat completions](/fr/gateway/openai-http-api)
- [OpenAI](/fr/providers/openai)
