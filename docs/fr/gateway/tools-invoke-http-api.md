---
read_when:
    - Appeler des outils sans exécuter un tour d’agent complet
    - Construire des automatisations qui ont besoin de l’application de la politique d’outils
summary: Invoquer directement un seul outil via le point de terminaison HTTP Gateway
title: API Tools Invoke
x-i18n:
    generated_at: "2026-04-05T12:43:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: e924f257ba50b25dea0ec4c3f9eed4c8cac8a53ddef18215f87ac7de330a37fd
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Tools Invoke (HTTP)

La Gateway d’OpenClaw expose un point de terminaison HTTP simple pour invoquer directement un seul outil. Il est toujours activé et utilise l’authentification Gateway plus la politique d’outils. Comme la surface compatible OpenAI `/v1/*`, l’authentification bearer par secret partagé est traitée comme un accès opérateur de confiance pour l’ensemble de la passerelle.

- `POST /tools/invoke`
- Même port que la Gateway (multiplexage WS + HTTP) : `http://<gateway-host>:<port>/tools/invoke`

La taille maximale par défaut de la charge utile est de 2 Mo.

## Authentification

Utilise la configuration d’authentification de la Gateway.

Chemins d’authentification HTTP courants :

- authentification par secret partagé (`gateway.auth.mode="token"` ou `"password"`) :
  `Authorization: Bearer <token-or-password>`
- authentification HTTP de confiance porteuse d’identité (`gateway.auth.mode="trusted-proxy"`) :
  passez par le proxy aware-of-identity configuré et laissez-le injecter les
  en-têtes d’identité requis
- authentification ouverte sur entrée privée (`gateway.auth.mode="none"`) :
  aucun en-tête d’authentification requis

Remarques :

- Lorsque `gateway.auth.mode="token"`, utilisez `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
- Lorsque `gateway.auth.mode="password"`, utilisez `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
- Lorsque `gateway.auth.mode="trusted-proxy"`, la requête HTTP doit provenir d’une
  source de proxy de confiance configurée hors loopback ; les proxys loopback sur le même hôte
  ne satisfont pas ce mode.
- Si `gateway.auth.rateLimit` est configuré et que trop d’échecs d’authentification surviennent, le point de terminaison renvoie `429` avec `Retry-After`.

## Frontière de sécurité (important)

Traitez ce point de terminaison comme une surface d’**accès opérateur complet** pour l’instance de passerelle.

- L’authentification bearer HTTP ici n’est pas un modèle étroit à portée par utilisateur.
- Un jeton/mot de passe Gateway valide pour ce point de terminaison doit être traité comme un identifiant de propriétaire/opérateur.
- Pour les modes d’authentification à secret partagé (`token` et `password`), le point de terminaison restaure les valeurs par défaut normales d’opérateur complet même si l’appelant envoie un en-tête `x-openclaw-scopes` plus restreint.
- L’authentification à secret partagé traite aussi les invocations directes d’outils sur ce point de terminaison comme des tours d’expéditeur propriétaire.
- Les modes HTTP de confiance porteurs d’identité (par exemple l’authentification trusted proxy ou `gateway.auth.mode="none"` sur une entrée privée) respectent `x-openclaw-scopes` lorsqu’il est présent et, sinon, se rabattent sur l’ensemble normal des portées par défaut de l’opérateur.
- Gardez ce point de terminaison uniquement sur loopback/tailnet/entrée privée ; ne l’exposez pas directement à l’internet public.

Matrice d’authentification :

- `gateway.auth.mode="token"` ou `"password"` + `Authorization: Bearer ...`
  - prouve la possession du secret opérateur partagé de la passerelle
  - ignore les `x-openclaw-scopes` plus restreints
  - restaure l’ensemble complet de portées par défaut de l’opérateur :
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traite les invocations directes d’outils sur ce point de terminaison comme des tours d’expéditeur propriétaire
- modes HTTP de confiance porteurs d’identité (par exemple trusted proxy, ou `gateway.auth.mode="none"` sur entrée privée)
  - authentifient une identité externe de confiance ou une frontière de déploiement
  - respectent `x-openclaw-scopes` lorsque l’en-tête est présent
  - se rabattent sur l’ensemble normal de portées par défaut de l’opérateur lorsque l’en-tête est absent
  - ne perdent la sémantique propriétaire que si l’appelant restreint explicitement les portées et omet `operator.admin`

## Corps de requête

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

- `tool` (chaîne, requis) : nom de l’outil à invoquer.
- `action` (chaîne, facultatif) : mappé dans args si le schéma de l’outil prend en charge `action` et que la charge utile args l’a omis.
- `args` (objet, facultatif) : arguments spécifiques à l’outil.
- `sessionKey` (chaîne, facultatif) : clé de session cible. Si omis ou égal à `"main"`, la Gateway utilise la clé de session principale configurée (respecte `session.mainKey` et l’agent par défaut, ou `global` en portée globale).
- `dryRun` (booléen, facultatif) : réservé à un usage futur ; actuellement ignoré.

## Comportement de politique + routage

La disponibilité des outils est filtrée par la même chaîne de politiques utilisée par les agents Gateway :

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- politiques de groupe (si la clé de session correspond à un groupe ou un canal)
- politique de sous-agent (lors d’une invocation avec une clé de session de sous-agent)

Si un outil n’est pas autorisé par la politique, le point de terminaison renvoie **404**.

Notes importantes de frontière :

- Les approbations exec sont des garde-fous opérateur, pas une frontière d’autorisation distincte pour ce point de terminaison HTTP. Si un outil est accessible ici via l’authentification Gateway + la politique d’outils, `/tools/invoke` n’ajoute pas d’invite d’approbation supplémentaire par appel.
- Ne partagez pas les identifiants bearer Gateway avec des appelants non fiables. Si vous avez besoin d’une séparation entre frontières de confiance, exécutez des passerelles distinctes (et idéalement des utilisateurs/hôtes OS distincts).

La Gateway HTTP applique aussi une liste de refus stricte par défaut (même si la politique de session autorise l’outil) :

- `exec` — exécution directe de commandes (surface RCE)
- `spawn` — création arbitraire de processus enfant (surface RCE)
- `shell` — exécution de commandes shell (surface RCE)
- `fs_write` — mutation arbitraire de fichiers sur l’hôte
- `fs_delete` — suppression arbitraire de fichiers sur l’hôte
- `fs_move` — déplacement/renommage arbitraire de fichiers sur l’hôte
- `apply_patch` — l’application de patchs peut réécrire arbitrairement des fichiers
- `sessions_spawn` — orchestration de session ; lancer des agents à distance est du RCE
- `sessions_send` — injection de messages intersessions
- `cron` — plan de contrôle d’automatisation persistante
- `gateway` — plan de contrôle de la passerelle ; empêche la reconfiguration via HTTP
- `nodes` — le relais de commandes de nœud peut atteindre `system.run` sur des hôtes appairés
- `whatsapp_login` — configuration interactive nécessitant un scan QR dans le terminal ; bloque sur HTTP

Vous pouvez personnaliser cette liste de refus via `gateway.tools` :

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
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
- `429` → limitation de débit d’authentification (`Retry-After` défini)
- `404` → outil indisponible (introuvable ou non autorisé par allowlist)
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
