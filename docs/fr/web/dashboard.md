---
read_when:
    - Modifier les modes d’authentification ou d’exposition du tableau de bord
summary: Accès et authentification au tableau de bord Gateway (UI de contrôle)
title: Tableau de bord
x-i18n:
    generated_at: "2026-04-24T07:40:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8753e0edf0a04e4c36b76aa6973dcd9d903a98c0b85e498bfcb05e728bb6272b
    source_path: web/dashboard.md
    workflow: 15
---

Le tableau de bord Gateway est l’UI de contrôle dans le navigateur servie à `/` par défaut
(remplaçable avec `gateway.controlUi.basePath`).

Ouverture rapide (Gateway local) :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Références clés :

- [UI de contrôle](/fr/web/control-ui) pour l’usage et les capacités de l’interface.
- [Tailscale](/fr/gateway/tailscale) pour l’automatisation Serve/Funnel.
- [Surfaces web](/fr/web) pour les modes de bind et les notes de sécurité.

L’authentification est appliquée lors du handshake WebSocket via le chemin
d’authentification gateway configuré :

- `connect.params.auth.token`
- `connect.params.auth.password`
- en-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- en-têtes d’identité proxy approuvé lorsque `gateway.auth.mode: "trusted-proxy"`

Voir `gateway.auth` dans [Configuration Gateway](/fr/gateway/configuration).

Note de sécurité : l’UI de contrôle est une **surface d’administration** (chat, config, approbations exec).
Ne l’exposez pas publiquement. L’interface conserve les jetons d’URL du tableau de bord dans `sessionStorage`
pour la session d’onglet du navigateur en cours et l’URL Gateway sélectionnée, puis les retire de l’URL après chargement.
Préférez localhost, Tailscale Serve, ou un tunnel SSH.

## Chemin rapide (recommandé)

- Après l’onboarding, la CLI ouvre automatiquement le tableau de bord et affiche un lien propre (sans jeton).
- Rouvrez-le à tout moment : `openclaw dashboard` (copie le lien, ouvre le navigateur si possible, affiche un indice SSH si headless).
- Si l’interface demande une authentification par secret partagé, collez le jeton ou
  le mot de passe configuré dans les paramètres de l’UI de contrôle.

## Bases de l’authentification (local vs distant)

- **Localhost** : ouvrez `http://127.0.0.1:18789/`.
- **Source du jeton à secret partagé** : `gateway.auth.token` (ou
  `OPENCLAW_GATEWAY_TOKEN`) ; `openclaw dashboard` peut le passer via un fragment d’URL
  pour un bootstrap unique, et l’UI de contrôle le conserve dans `sessionStorage` pour la
  session d’onglet du navigateur en cours et l’URL Gateway sélectionnée au lieu de `localStorage`.
- Si `gateway.auth.token` est géré par SecretRef, `openclaw dashboard`
  affiche/cop ie/ouvre par conception une URL sans jeton. Cela évite d’exposer
  des jetons gérés en externe dans les logs shell, l’historique du presse-papiers, ou les arguments de lancement du navigateur.
- Si `gateway.auth.token` est configuré comme SecretRef et n’est pas résolu dans votre
  shell actuel, `openclaw dashboard` affiche quand même une URL sans jeton plus
  des indications d’authentification exploitables.
- **Mot de passe à secret partagé** : utilisez le `gateway.auth.password` configuré (ou
  `OPENCLAW_GATEWAY_PASSWORD`). Le tableau de bord ne conserve pas les mots de passe entre
  les rechargements.
- **Modes avec identité** : Tailscale Serve peut satisfaire l’authentification
  de l’UI de contrôle/WebSocket via des en-têtes d’identité lorsque `gateway.auth.allowTailscale: true`, et un
  reverse proxy avec prise en charge de l’identité hors loopback peut satisfaire
  `gateway.auth.mode: "trusted-proxy"`. Dans ces modes, le tableau de bord n’a pas
  besoin d’un secret partagé collé pour le WebSocket.
- **Pas localhost** : utilisez Tailscale Serve, un bind non loopback à secret partagé, un
  reverse proxy avec prise en charge de l’identité hors loopback avec
  `gateway.auth.mode: "trusted-proxy"`, ou un tunnel SSH. Les API HTTP utilisent toujours une
  authentification par secret partagé sauf si vous exécutez intentionnellement
  `gateway.auth.mode: "none"` en ingress privé ou l’authentification HTTP trusted-proxy. Voir
  [Surfaces web](/fr/web).

<a id="if-you-see-unauthorized-1008"></a>

## Si vous voyez « unauthorized » / 1008

- Assurez-vous que le gateway est joignable (local : `openclaw status` ; distant : tunnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` puis ouvrez `http://127.0.0.1:18789/`).
- Pour `AUTH_TOKEN_MISMATCH`, les clients peuvent effectuer une nouvelle tentative approuvée avec un jeton d’appareil en cache lorsque le gateway renvoie des indices de nouvelle tentative. Cette nouvelle tentative avec jeton en cache réutilise les scopes approuvés mis en cache du jeton ; les appelants avec `deviceToken` explicite / `scopes` explicites conservent leur ensemble de scopes demandé. Si l’authentification échoue toujours après cette nouvelle tentative, résolvez manuellement la dérive du jeton.
- En dehors de ce chemin de nouvelle tentative, la priorité de l’authentification de connexion est : jeton/mot de passe partagé explicite d’abord, puis `deviceToken` explicite, puis jeton d’appareil stocké, puis jeton de bootstrap.
- Sur le chemin asynchrone Tailscale Serve de l’UI de contrôle, les tentatives échouées pour le même
  `{scope, ip}` sont sérialisées avant que le limiteur d’authentification échouée ne les enregistre, de sorte
  que la deuxième mauvaise tentative concurrente peut déjà afficher `retry later`.
- Pour les étapes de réparation de dérive de jeton, suivez [Checklist de récupération de dérive de jeton](/fr/cli/devices#token-drift-recovery-checklist).
- Récupérez ou fournissez le secret partagé depuis l’hôte du gateway :
  - Jeton : `openclaw config get gateway.auth.token`
  - Mot de passe : résolvez le `gateway.auth.password` configuré ou
    `OPENCLAW_GATEWAY_PASSWORD`
  - Jeton géré par SecretRef : résolvez le fournisseur de secrets externe ou exportez
    `OPENCLAW_GATEWAY_TOKEN` dans ce shell, puis relancez `openclaw dashboard`
  - Aucun secret partagé configuré : `openclaw doctor --generate-gateway-token`
- Dans les paramètres du tableau de bord, collez le jeton ou le mot de passe dans le champ d’authentification,
  puis connectez-vous.
- Le sélecteur de langue de l’interface se trouve dans **Overview -> Gateway Access -> Language**.
  Il fait partie de la carte d’accès, pas de la section Apparence.

## Articles connexes

- [UI de contrôle](/fr/web/control-ui)
- [WebChat](/fr/web/webchat)
