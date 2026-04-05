---
read_when:
    - Intégration d’outils qui attendent OpenAI Chat Completions
summary: Exposer un point de terminaison HTTP /v1/chat/completions compatible OpenAI depuis la passerelle
title: OpenAI Chat Completions
x-i18n:
    generated_at: "2026-04-05T12:42:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: c374b2f32ce693a8c752e2b0a2532c5f0299ed280f9a0e97b1a9d73bcec37b95
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# OpenAI Chat Completions (HTTP)

La passerelle d’OpenClaw peut servir un petit point de terminaison Chat Completions compatible OpenAI.

Ce point de terminaison est **désactivé par défaut**. Activez-le d’abord dans la configuration.

- `POST /v1/chat/completions`
- Même port que la passerelle (multiplexage WS + HTTP) : `http://<gateway-host>:<port>/v1/chat/completions`

Lorsque la surface HTTP compatible OpenAI de la passerelle est activée, elle sert également :

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

En coulisses, les requêtes sont exécutées comme une exécution normale d’agent de la passerelle (même chemin de code que `openclaw agent`), donc le routage/les autorisations/la configuration correspondent à votre passerelle.

## Authentification

Utilise la configuration d’authentification de la passerelle.

Chemins d’auth HTTP courants :

- auth par secret partagé (`gateway.auth.mode="token"` ou `"password"`) :
  `Authorization: Bearer <token-or-password>`
- auth HTTP approuvée portant l’identité (`gateway.auth.mode="trusted-proxy"`) :
  faites transiter par le proxy sensible à l’identité configuré et laissez-le injecter les en-têtes d’identité requis
- auth ouverte en entrée privée (`gateway.auth.mode="none"`) :
  aucun en-tête d’auth requis

Remarques :

- Lorsque `gateway.auth.mode="token"`, utilisez `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Lorsque `gateway.auth.mode="password"`, utilisez `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Lorsque `gateway.auth.mode="trusted-proxy"`, la requête HTTP doit provenir d’une source trusted-proxy non loopback configurée ; les proxys loopback sur le même hôte ne satisfont pas ce mode.
- Si `gateway.auth.rateLimit` est configuré et qu’un trop grand nombre d’échecs d’auth survient, le point de terminaison renvoie `429` avec `Retry-After`.

## Frontière de sécurité (important)

Traitez ce point de terminaison comme une surface d’**accès opérateur complet** pour l’instance de passerelle.

- L’auth bearer HTTP ici n’est pas un modèle étroit de portée par utilisateur.
- Un jeton/mot de passe de passerelle valide pour ce point de terminaison doit être traité comme un identifiant de propriétaire/opérateur.
- Les requêtes passent par le même chemin d’agent du plan de contrôle que les actions d’opérateur approuvées.
- Il n’existe pas de frontière d’outils distincte non propriétaire/par utilisateur sur ce point de terminaison ; une fois l’authentification de passerelle passée ici, OpenClaw traite cet appelant comme un opérateur approuvé pour cette passerelle.
- Pour les modes d’auth à secret partagé (`token` et `password`), le point de terminaison restaure les valeurs par défaut normales d’opérateur complet même si l’appelant envoie un en-tête `x-openclaw-scopes` plus étroit.
- Les modes HTTP approuvés portant l’identité (par exemple l’auth trusted-proxy ou `gateway.auth.mode="none"`) respectent `x-openclaw-scopes` lorsqu’il est présent et retombent sinon sur l’ensemble normal de portées d’opérateur par défaut.
- Si la politique de l’agent cible autorise des outils sensibles, ce point de terminaison peut les utiliser.
- Gardez ce point de terminaison uniquement sur loopback/tailnet/entrée privée ; ne l’exposez pas directement à l’Internet public.

Matrice d’authentification :

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - prouve la possession du secret partagé d’opérateur de la passerelle
  - ignore un `x-openclaw-scopes` plus étroit
  - restaure l’ensemble complet des portées d’opérateur par défaut :
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traite les tours de chat sur ce point de terminaison comme des tours expéditeur-propriétaire
- modes HTTP approuvés portant l’identité (par exemple l’auth trusted-proxy, ou `gateway.auth.mode="none"` sur une entrée privée)
  - authentifient une identité approuvée externe ou une frontière de déploiement
  - respectent `x-openclaw-scopes` lorsque l’en-tête est présent
  - retombent sur l’ensemble normal de portées d’opérateur par défaut lorsque l’en-tête est absent
  - ne perdent la sémantique propriétaire que si l’appelant restreint explicitement les portées et omet `operator.admin`

Consultez [Sécurité](/gateway/security) et [Accès distant](/gateway/remote).

## Contrat de modèle centré sur l’agent

OpenClaw traite le champ OpenAI `model` comme une **cible d’agent**, et non comme un identifiant brut de modèle fournisseur.

- `model: "openclaw"` achemine vers l’agent par défaut configuré.
- `model: "openclaw/default"` achemine également vers l’agent par défaut configuré.
- `model: "openclaw/<agentId>"` achemine vers un agent spécifique.

En-têtes de requête facultatifs :

- `x-openclaw-model: <provider/model-or-bare-id>` remplace le modèle backend pour l’agent sélectionné.
- `x-openclaw-agent-id: <agentId>` reste pris en charge comme remplacement de compatibilité.
- `x-openclaw-session-key: <sessionKey>` contrôle entièrement le routage de session.
- `x-openclaw-message-channel: <channel>` définit le contexte synthétique du canal entrant pour les prompts et politiques sensibles aux canaux.

Alias de compatibilité toujours acceptés :

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Activer le point de terminaison

Définissez `gateway.http.endpoints.chatCompletions.enabled` sur `true` :

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## Désactiver le point de terminaison

Définissez `gateway.http.endpoints.chatCompletions.enabled` sur `false` :

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Comportement de session

Par défaut, le point de terminaison est **sans état par requête** (une nouvelle clé de session est générée à chaque appel).

Si la requête inclut une chaîne OpenAI `user`, la passerelle en dérive une clé de session stable, de sorte que des appels répétés puissent partager une session d’agent.

## Pourquoi cette surface est importante

Il s’agit de l’ensemble de compatibilité le plus utile pour les frontends et outils auto-hébergés :

- La plupart des configurations Open WebUI, LobeChat et LibreChat attendent `/v1/models`.
- De nombreux systèmes RAG attendent `/v1/embeddings`.
- Les clients de chat OpenAI existants peuvent généralement démarrer avec `/v1/chat/completions`.
- Les clients plus natifs agent préfèrent de plus en plus `/v1/responses`.

## Liste des modèles et routage d’agent

<AccordionGroup>
  <Accordion title="Que renvoie `/v1/models` ?">
    Une liste de cibles d’agent OpenClaw.

    Les identifiants renvoyés sont `openclaw`, `openclaw/default` et les entrées `openclaw/<agentId>`.
    Utilisez-les directement comme valeurs OpenAI `model`.

  </Accordion>
  <Accordion title="Est-ce que `/v1/models` liste des agents ou des sous-agents ?">
    Il liste des cibles d’agent de niveau supérieur, pas des modèles backend de fournisseur ni des sous-agents.

    Les sous-agents restent une topologie d’exécution interne. Ils n’apparaissent pas comme pseudo-modèles.

  </Accordion>
  <Accordion title="Pourquoi `openclaw/default` est-il inclus ?">
    `openclaw/default` est l’alias stable de l’agent par défaut configuré.

    Cela signifie que les clients peuvent continuer à utiliser un identifiant prévisible même si le véritable identifiant d’agent par défaut change selon les environnements.

  </Accordion>
  <Accordion title="Comment remplacer le modèle backend ?">
    Utilisez `x-openclaw-model`.

    Exemples :
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.4`

    Si vous l’omettez, l’agent sélectionné s’exécute avec son choix de modèle normal configuré.

  </Accordion>
  <Accordion title="Comment les embeddings s’intègrent-ils à ce contrat ?">
    `/v1/embeddings` utilise les mêmes identifiants `model` de cible d’agent.

    Utilisez `model: "openclaw/default"` ou `model: "openclaw/<agentId>"`.
    Lorsque vous avez besoin d’un modèle d’embedding spécifique, envoyez-le dans `x-openclaw-model`.
    Sans cet en-tête, la requête passe à travers vers la configuration normale d’embedding de l’agent sélectionné.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Définissez `stream: true` pour recevoir des événements envoyés par le serveur (SSE) :

- `Content-Type: text/event-stream`
- Chaque ligne d’événement est `data: <json>`
- Le flux se termine par `data: [DONE]`

## Configuration rapide Open WebUI

Pour une connexion Open WebUI de base :

- URL de base : `http://127.0.0.1:18789/v1`
- URL de base Docker sur macOS : `http://host.docker.internal:18789/v1`
- Clé API : votre jeton bearer de passerelle
- Modèle : `openclaw/default`

Comportement attendu :

- `GET /v1/models` doit lister `openclaw/default`
- Open WebUI doit utiliser `openclaw/default` comme identifiant de modèle de chat
- Si vous voulez un fournisseur/modèle backend spécifique pour cet agent, définissez le modèle par défaut normal de l’agent ou envoyez `x-openclaw-model`

Smoke test rapide :

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Si cela renvoie `openclaw/default`, la plupart des configurations Open WebUI peuvent se connecter avec la même URL de base et le même jeton.

## Exemples

Sans streaming :

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Avec streaming :

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Lister les modèles :

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Récupérer un modèle :

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Créer des embeddings :

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

Remarques :

- `/v1/models` renvoie des cibles d’agent OpenClaw, pas des catalogues bruts de fournisseurs.
- `openclaw/default` est toujours présent afin qu’un identifiant stable fonctionne d’un environnement à l’autre.
- Les remplacements de fournisseur/modèle backend appartiennent à `x-openclaw-model`, pas au champ OpenAI `model`.
- `/v1/embeddings` prend en charge `input` comme chaîne ou tableau de chaînes.
