---
read_when:
    - Appeler des outils sans exécuter un tour complet d’agent
    - Créer des automatisations qui nécessitent l’application de la politique d’outils
summary: Invoquer directement un seul outil via le point de terminaison HTTP du Gateway
title: API d’invocation des outils
x-i18n:
    generated_at: "2026-04-24T07:12:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: edae245ca8b3eb2f4bd62fb9001ddfcb3086bec40ab976b5389b291023f6205e
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Invocation d’outils (HTTP)

Le Gateway d’OpenClaw expose un point de terminaison HTTP simple pour invoquer directement un seul outil. Il est toujours activé et utilise l’authentification Gateway plus la politique d’outils. Comme pour la surface compatible OpenAI `/v1/*`, l’authentification bearer par secret partagé est traitée comme un accès opérateur de confiance pour l’ensemble du gateway.

- `POST /tools/invoke`
- Même port que le Gateway (multiplexage WS + HTTP) : `http://<gateway-host>:<port>/tools/invoke`

La taille maximale de charge utile par défaut est de 2 Mo.

## Authentification

Utilise la configuration d’authentification du Gateway.

Chemins courants d’authentification HTTP :

- authentification par secret partagé (`gateway.auth.mode="token"` ou `"password"`) :
  `Authorization: Bearer <token-or-password>`
- authentification HTTP avec identité de confiance (`gateway.auth.mode="trusted-proxy"`) :
  passez par le proxy tenant compte de l’identité configuré et laissez-le injecter les
  en-têtes d’identité requis
- authentification ouverte sur ingress privé (`gateway.auth.mode="none"`) :
  aucun en-tête d’authentification requis

Remarques :

- Lorsque `gateway.auth.mode="token"`, utilisez `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Lorsque `gateway.auth.mode="password"`, utilisez `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Lorsque `gateway.auth.mode="trusted-proxy"`, la requête HTTP doit provenir d’une
  source de proxy de confiance non loopback configurée ; les proxys loopback sur le même hôte ne
  satisfont pas ce mode.
- Si `gateway.auth.rateLimit` est configuré et que trop d’échecs d’authentification surviennent, le point de terminaison renvoie `429` avec `Retry-After`.

## Frontière de sécurité (important)

Traitez ce point de terminaison comme une surface **d’accès opérateur complet** pour l’instance gateway.

- L’authentification bearer HTTP ici n’est pas un modèle étroit de scope par utilisateur.
- Un jeton/mot de passe Gateway valide pour ce point de terminaison doit être traité comme un identifiant propriétaire/opérateur.
- Pour les modes d’authentification par secret partagé (`token` et `password`), le point de terminaison restaure les valeurs par défaut normales d’opérateur complet même si l’appelant envoie un en-tête `x-openclaw-scopes` plus étroit.
- L’authentification par secret partagé traite aussi les invocations directes d’outils sur ce point de terminaison comme des tours d’expéditeur propriétaire.
- Les modes HTTP avec identité de confiance (par exemple l’authentification par proxy de confiance ou `gateway.auth.mode="none"` sur un ingress privé) respectent `x-openclaw-scopes` lorsqu’il est présent et reviennent sinon à l’ensemble normal de scopes opérateur par défaut.
- Gardez ce point de terminaison uniquement sur loopback/tailnet/ingress privé ; ne l’exposez pas directement à l’Internet public.

Matrice d’authentification :

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - prouve la possession du secret opérateur partagé du gateway
  - ignore un `x-openclaw-scopes` plus étroit
  - restaure l’ensemble complet de scopes opérateur par défaut :
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traite les invocations directes d’outils sur ce point de terminaison comme des tours d’expéditeur propriétaire
- modes HTTP avec identité de confiance (par exemple l’authentification par proxy de confiance, ou `gateway.auth.mode="none"` sur ingress privé)
  - authentifient une identité de confiance externe ou une frontière de déploiement
  - respectent `x-openclaw-scopes` lorsque l’en-tête est présent
  - reviennent à l’ensemble normal de scopes opérateur par défaut lorsque l’en-tête est absent
  - ne perdent la sémantique propriétaire que lorsque l’appelant réduit explicitement les scopes et omet `operator.admin`

## Corps de la requête

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Champs :

- `tool` (chaîne, obligatoire) : nom de l’outil à invoquer.
- `action` (chaîne, facultatif) : mappé dans les args si le schéma de l’outil prend en charge `action` et que la charge utile args l’a omis.
- `args` (objet, facultatif) : arguments spécifiques à l’outil.
- `sessionKey` (chaîne, facultatif) : clé de session cible. Si omise ou égale à `"main"`, le Gateway utilise la clé de session principale configurée (respecte `session.mainKey` et l’agent par défaut, ou `global` en portée globale).
- `dryRun` (booléen, facultatif) : réservé pour usage futur ; actuellement ignoré.

## Comportement de politique + routage

La disponibilité des outils est filtrée à travers la même chaîne de politique que celle utilisée par les agents Gateway :

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- politiques de groupe (si la clé de session correspond à un groupe ou à un canal)
- politique de sous-agent (lors d’une invocation avec une clé de session de sous-agent)

Si un outil n’est pas autorisé par la politique, le point de terminaison renvoie **404**.

Remarques importantes sur la frontière :

- Les approbations exec sont des garde-fous opérateur, pas une frontière d’autorisation distincte pour ce point de terminaison HTTP. Si un outil est accessible ici via l’authentification Gateway + la politique d’outils, `/tools/invoke` n’ajoute pas d’invite d’approbation supplémentaire par appel.
- Ne partagez pas les identifiants bearer Gateway avec des appelants non fiables. Si vous avez besoin de séparation entre frontières de confiance, exécutez des gateways distincts (et idéalement des utilisateurs OS/hôtes distincts).

Le HTTP Gateway applique aussi par défaut une liste de refus stricte (même si la politique de session autorise l’outil) :

- `exec` — exécution directe de commande (surface RCE)
- `spawn` — création arbitraire de processus enfants (surface RCE)
- `shell` — exécution de commande shell (surface RCE)
- `fs_write` — mutation arbitraire de fichiers sur l’hôte
- `fs_delete` — suppression arbitraire de fichiers sur l’hôte
- `fs_move` — déplacement/renommage arbitraire de fichiers sur l’hôte
- `apply_patch` — l’application de patch peut réécrire des fichiers arbitraires
- `sessions_spawn` — plan de contrôle d’orchestration de session ; lancer des agents à distance est du RCE
- `sessions_send` — injection de message inter-sessions
- `cron` — plan de contrôle d’automatisation persistante
- `gateway` — plan de contrôle du gateway ; empêche la reconfiguration via HTTP
- `nodes` — le relais de commande des Nodes peut atteindre `system.run` sur les hôtes associés
- `whatsapp_login` — configuration interactive nécessitant un scan QR dans le terminal ; bloque en HTTP

Vous pouvez personnaliser cette liste de refus via `gateway.tools` :

```json5
{
  gateway: {
    tools: {
      // Outils supplémentaires à bloquer sur HTTP /tools/invoke
      deny: ["browser"],
      // Supprimer des outils de la liste de refus par défaut
      allow: ["gateway"],
    },
  },
}
```

Pour aider les politiques de groupe à résoudre le contexte, vous pouvez facultativement définir :

- `x-openclaw-message-channel: <channel>` (exemple : `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (lorsque plusieurs comptes existent)

## Réponses

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (requête invalide ou erreur d’entrée d’outil)
- `401` → non autorisé
- `429` → authentification limitée par le débit (`Retry-After` défini)
- `404` → outil non disponible (introuvable ou non autorisé par liste)
- `405` → méthode non autorisée
- `500` → `{ ok: false, error: { type, message } }` (erreur inattendue d’exécution d’outil ; message assaini)

## Exemple

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## Lié

- [Protocole Gateway](/fr/gateway/protocol)
- [Outils et Plugins](/fr/tools)
