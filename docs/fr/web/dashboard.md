---
read_when:
    - Modification de l’authentification du tableau de bord ou des modes d’exposition
summary: Accès et authentification du tableau de bord Gateway (Control UI)
title: Tableau de bord
x-i18n:
    generated_at: "2026-04-05T12:58:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 316e082ae4759f710b457487351e30c53b34c7c2b4bf84ad7b091a50538af5cc
    source_path: web/dashboard.md
    workflow: 15
---

# Tableau de bord (Control UI)

Le tableau de bord Gateway est la Control UI dans le navigateur, servie à `/` par défaut
(personnalisable avec `gateway.controlUi.basePath`).

Ouverture rapide (Gateway locale) :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Références clés :

- [Control UI](/web/control-ui) pour l’utilisation et les capacités de l’interface.
- [Tailscale](/fr/gateway/tailscale) pour l’automatisation Serve/Funnel.
- [Surfaces web](/web) pour les modes de liaison et les notes de sécurité.

L’authentification est appliquée lors de l’établissement de la liaison WebSocket via le chemin
d’authentification Gateway configuré :

- `connect.params.auth.token`
- `connect.params.auth.password`
- En-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- En-têtes d’identité de proxy de confiance lorsque `gateway.auth.mode: "trusted-proxy"`

Consultez `gateway.auth` dans la [Configuration Gateway](/fr/gateway/configuration).

Note de sécurité : la Control UI est une **surface d’administration** (chat, configuration, approbations d’exécution).
Ne l’exposez pas publiquement. L’interface conserve les jetons d’URL du tableau de bord dans `sessionStorage`
pour la session courante de l’onglet du navigateur et l’URL Gateway sélectionnée, puis les retire de l’URL après chargement.
Privilégiez localhost, Tailscale Serve ou un tunnel SSH.

## Chemin rapide (recommandé)

- Après l’onboarding, la CLI ouvre automatiquement le tableau de bord et affiche un lien propre (sans jeton).
- Pour le rouvrir à tout moment : `openclaw dashboard` (copie le lien, ouvre le navigateur si possible, affiche une indication SSH en mode headless).
- Si l’interface demande une authentification par secret partagé, collez le jeton ou le
  mot de passe configuré dans les paramètres de la Control UI.

## Bases de l’authentification (local vs distant)

- **Localhost** : ouvrez `http://127.0.0.1:18789/`.
- **Source de jeton à secret partagé** : `gateway.auth.token` (ou
  `OPENCLAW_GATEWAY_TOKEN`) ; `openclaw dashboard` peut le transmettre via le fragment d’URL
  pour un bootstrap unique, et la Control UI le conserve dans `sessionStorage` pour la
  session courante de l’onglet du navigateur et l’URL Gateway sélectionnée au lieu de `localStorage`.
- Si `gateway.auth.token` est géré par SecretRef, `openclaw dashboard`
  affiche/copie/ouvre volontairement une URL sans jeton. Cela évite d’exposer
  des jetons gérés de manière externe dans les journaux du shell, l’historique du presse-papiers ou les arguments de lancement du navigateur.
- Si `gateway.auth.token` est configuré comme SecretRef et n’est pas résolu dans votre
  shell actuel, `openclaw dashboard` affiche quand même une URL sans jeton accompagnée
  d’indications exploitables pour configurer l’authentification.
- **Mot de passe à secret partagé** : utilisez le `gateway.auth.password` configuré (ou
  `OPENCLAW_GATEWAY_PASSWORD`). Le tableau de bord ne conserve pas les mots de passe après
  rechargement.
- **Modes avec identité** : Tailscale Serve peut satisfaire l’authentification de la Control UI/WebSocket
  via des en-têtes d’identité lorsque `gateway.auth.allowTailscale: true`, et un
  proxy inverse sensible à l’identité non loopback peut satisfaire
  `gateway.auth.mode: "trusted-proxy"`. Dans ces modes, le tableau de bord n’a pas
  besoin d’un secret partagé collé pour le WebSocket.
- **Pas localhost** : utilisez Tailscale Serve, une liaison non loopback avec secret partagé, un
  proxy inverse sensible à l’identité non loopback avec
  `gateway.auth.mode: "trusted-proxy"`, ou un tunnel SSH. Les API HTTP utilisent toujours
  une authentification par secret partagé sauf si vous exécutez intentionnellement un accès privé
  avec `gateway.auth.mode: "none"` ou une authentification HTTP de proxy de confiance. Consultez
  [Surfaces web](/web).

<a id="if-you-see-unauthorized-1008"></a>

## Si vous voyez « unauthorized » / 1008

- Assurez-vous que la gateway est joignable (local : `openclaw status` ; distant : tunnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` puis ouvrez `http://127.0.0.1:18789/`).
- Pour `AUTH_TOKEN_MISMATCH`, les clients peuvent effectuer une nouvelle tentative de confiance avec un jeton d’appareil en cache lorsque la gateway renvoie des indications de nouvelle tentative. Cette nouvelle tentative avec le jeton en cache réutilise les portées approuvées en cache du jeton ; les appelants avec `deviceToken` explicite / `scopes` explicites conservent l’ensemble de portées demandé. Si l’authentification échoue encore après cette nouvelle tentative, résolvez manuellement la dérive du jeton.
- En dehors de ce chemin de nouvelle tentative, la priorité de l’authentification de connexion est explicite : jeton partagé/mot de passe partagé d’abord, puis `deviceToken` explicite, puis jeton d’appareil stocké, puis jeton de bootstrap.
- Sur le chemin asynchrone de la Control UI Tailscale Serve, les tentatives échouées pour le même
  `{scope, ip}` sont sérialisées avant que le limiteur d’échecs d’authentification ne les enregistre, de sorte que la deuxième mauvaise tentative concurrente peut déjà afficher `retry later`.
- Pour les étapes de réparation de dérive de jeton, suivez la [Liste de contrôle de récupération de dérive de jeton](/cli/devices#token-drift-recovery-checklist).
- Récupérez ou fournissez le secret partagé depuis l’hôte de la gateway :
  - Jeton : `openclaw config get gateway.auth.token`
  - Mot de passe : résolvez le `gateway.auth.password` configuré ou
    `OPENCLAW_GATEWAY_PASSWORD`
  - Jeton géré par SecretRef : résolvez le fournisseur de secrets externe ou exportez
    `OPENCLAW_GATEWAY_TOKEN` dans ce shell, puis réexécutez `openclaw dashboard`
  - Aucun secret partagé configuré : `openclaw doctor --generate-gateway-token`
- Dans les paramètres du tableau de bord, collez le jeton ou le mot de passe dans le champ d’authentification,
  puis connectez-vous.
