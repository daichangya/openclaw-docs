---
read_when:
    - Appairer ou reconnecter le nœud iOS
    - Exécuter l’application iOS depuis les sources
    - Déboguer la découverte de gateway ou les commandes canvas
summary: 'Application de nœud iOS : connexion à Gateway, appairage, canvas et dépannage'
title: Application iOS
x-i18n:
    generated_at: "2026-04-05T12:48:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e9d9cec58afd4003dff81d3e367bfbc6a634c1b229e433e08fd78fbb5f2e5a9
    source_path: platforms/ios.md
    workflow: 15
---

# Application iOS (nœud)

Disponibilité : aperçu interne. L’application iOS n’est pas encore distribuée publiquement.

## Ce qu’elle fait

- Se connecte à une Gateway via WebSocket (LAN ou tailnet).
- Expose les capacités du nœud : Canvas, capture d’écran, capture caméra, localisation, mode Talk, réveil vocal.
- Reçoit les commandes `node.invoke` et rapporte les événements d’état du nœud.

## Prérequis

- Gateway en cours d’exécution sur un autre appareil (macOS, Linux ou Windows via WSL2).
- Chemin réseau :
  - Même LAN via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (exemple de domaine : `openclaw.internal.`), **ou**
  - Hôte/port manuels (repli).

## Démarrage rapide (appairer + connecter)

1. Démarrez Gateway :

```bash
openclaw gateway --port 18789
```

2. Dans l’application iOS, ouvrez Réglages et choisissez une gateway découverte (ou activez Hôte manuel et saisissez l’hôte/le port).

3. Approuvez la demande d’appairage sur l’hôte gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si l’application réessaie l’appairage avec des détails d’authentification modifiés (rôle/portées/clé publique),
la demande en attente précédente est remplacée et un nouveau `requestId` est créé.
Exécutez à nouveau `openclaw devices list` avant l’approbation.

4. Vérifiez la connexion :

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push via relais pour les builds officiels

Les builds iOS officiels distribués utilisent le relais push externe au lieu de publier le jeton APNs brut
vers la gateway.

Prérequis côté gateway :

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Fonctionnement du flux :

- L’application iOS s’enregistre auprès du relais en utilisant App Attest et le reçu de l’application.
- Le relais renvoie un handle de relais opaque ainsi qu’une autorisation d’envoi limitée à l’enregistrement.
- L’application iOS récupère l’identité de la gateway appairée et l’inclut dans l’enregistrement auprès du relais, de sorte que l’enregistrement basé sur le relais soit délégué à cette gateway spécifique.
- L’application transmet cet enregistrement basé sur le relais à la gateway appairée avec `push.apns.register`.
- La gateway utilise ce handle de relais stocké pour `push.test`, les réveils en arrière-plan et les sollicitations de réveil.
- Le `baseUrl` du relais côté gateway doit correspondre à l’URL du relais intégrée au build iOS officiel/TestFlight.
- Si l’application se connecte ensuite à une autre gateway ou à un build avec un autre `baseUrl` de relais, elle actualise l’enregistrement du relais au lieu de réutiliser l’ancienne liaison.

Ce dont la gateway **n’a pas** besoin pour ce chemin :

- Aucun jeton de relais déployé à l’échelle du déploiement.
- Aucune clé APNs directe pour les envois via relais officiels/TestFlight.

Flux opérateur attendu :

1. Installez le build iOS officiel/TestFlight.
2. Définissez `gateway.push.apns.relay.baseUrl` sur la gateway.
3. Appairez l’application à la gateway et laissez-la terminer la connexion.
4. L’application publie automatiquement `push.apns.register` une fois qu’elle dispose d’un jeton APNs, que la session opérateur est connectée et que l’enregistrement auprès du relais réussit.
5. Ensuite, `push.test`, les réveils de reconnexion et les sollicitations de réveil peuvent utiliser l’enregistrement stocké basé sur le relais.

Remarque de compatibilité :

- `OPENCLAW_APNS_RELAY_BASE_URL` fonctionne toujours comme remplacement temporaire via variable d’environnement pour la gateway.

## Flux d’authentification et de confiance

Le relais existe pour imposer deux contraintes que l’APNs direct sur gateway ne peut pas fournir pour
les builds iOS officiels :

- Seuls les véritables builds iOS OpenClaw distribués via Apple peuvent utiliser le relais hébergé.
- Une gateway ne peut envoyer des push via relais que pour les appareils iOS qui se sont appairés avec cette
  gateway spécifique.

Étape par étape :

1. `iOS app -> gateway`
   - L’application s’appaire d’abord avec la gateway via le flux normal d’auth Gateway.
   - Cela donne à l’application une session node authentifiée ainsi qu’une session operator authentifiée.
   - La session operator est utilisée pour appeler `gateway.identity.get`.

2. `iOS app -> relay`
   - L’application appelle les points de terminaison d’enregistrement du relais en HTTPS.
   - L’enregistrement inclut une preuve App Attest ainsi que le reçu de l’application.
   - Le relais valide le bundle ID, la preuve App Attest et le reçu Apple, et exige le
     chemin de distribution officiel/de production.
   - C’est ce qui empêche les builds locaux Xcode/dev d’utiliser le relais hébergé. Un build local peut être
     signé, mais il ne satisfait pas à la preuve de distribution Apple officielle attendue par le relais.

3. `gateway identity delegation`
   - Avant l’enregistrement auprès du relais, l’application récupère l’identité de la gateway appairée via
     `gateway.identity.get`.
   - L’application inclut cette identité de gateway dans la charge utile d’enregistrement auprès du relais.
   - Le relais renvoie un handle de relais et une autorisation d’envoi limitée à l’enregistrement, délégués à
     cette identité de gateway.

4. `gateway -> relay`
   - La gateway stocke le handle de relais et l’autorisation d’envoi issus de `push.apns.register`.
   - Lors de `push.test`, des réveils de reconnexion et des sollicitations de réveil, la gateway signe la demande d’envoi avec sa
     propre identité d’appareil.
   - Le relais vérifie à la fois l’autorisation d’envoi stockée et la signature de la gateway par rapport à l’identité
     de gateway déléguée lors de l’enregistrement.
   - Une autre gateway ne peut pas réutiliser cet enregistrement stocké, même si elle obtient d’une manière ou d’une autre le handle.

5. `relay -> APNs`
   - Le relais possède les identifiants APNs de production et le jeton APNs brut du build officiel.
   - La gateway ne stocke jamais le jeton APNs brut pour les builds officiels via relais.
   - Le relais envoie le push final à APNs au nom de la gateway appairée.

Pourquoi cette conception a été créée :

- Pour garder les identifiants APNs de production hors des gateways utilisateur.
- Pour éviter de stocker les jetons APNs bruts des builds officiels sur la gateway.
- Pour autoriser l’usage du relais hébergé uniquement pour les builds OpenClaw officiels/TestFlight.
- Pour empêcher une gateway d’envoyer des push de réveil à des appareils iOS appartenant à une autre gateway.

Les builds locaux/manuels restent en APNs direct. Si vous testez ces builds sans le relais, la
gateway a toujours besoin d’identifiants APNs directs :

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

## Chemins de découverte

### Bonjour (LAN)

L’application iOS parcourt `_openclaw-gw._tcp` sur `local.` et, lorsqu’il est configuré, le même
domaine de découverte DNS-SD large zone. Les gateways sur le même LAN apparaissent automatiquement depuis `local.` ;
la découverte inter-réseaux peut utiliser le domaine large zone configuré sans changer le type de balise.

### Tailnet (inter-réseaux)

Si mDNS est bloqué, utilisez une zone DNS-SD unicast (choisissez un domaine ; exemple :
`openclaw.internal.`) et le split DNS Tailscale.
Voir [Bonjour](/gateway/bonjour) pour l’exemple CoreDNS.

### Hôte/port manuels

Dans Réglages, activez **Hôte manuel** et saisissez l’hôte gateway + le port (par défaut `18789`).

## Canvas + A2UI

Le nœud iOS affiche un canvas WKWebView. Utilisez `node.invoke` pour le piloter :

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Remarques :

- L’hôte canvas Gateway sert `/__openclaw__/canvas/` et `/__openclaw__/a2ui/`.
- Il est servi depuis le serveur HTTP Gateway (même port que `gateway.port`, par défaut `18789`).
- Le nœud iOS navigue automatiquement vers A2UI à la connexion lorsqu’une URL d’hôte canvas est annoncée.
- Revenez au scaffold intégré avec `canvas.navigate` et `{"url":""}`.

### Évaluation / capture du canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Réveil vocal + mode Talk

- Le réveil vocal et le mode Talk sont disponibles dans Réglages.
- iOS peut suspendre l’audio en arrière-plan ; considérez les fonctionnalités vocales comme best-effort lorsque l’application n’est pas active.

## Erreurs courantes

- `NODE_BACKGROUND_UNAVAILABLE` : mettez l’application iOS au premier plan (les commandes canvas/caméra/écran l’exigent).
- `A2UI_HOST_NOT_CONFIGURED` : Gateway n’a pas annoncé d’URL d’hôte canvas ; vérifiez `canvasHost` dans [Configuration de Gateway](/gateway/configuration).
- L’invite d’appairage n’apparaît jamais : exécutez `openclaw devices list` et approuvez manuellement.
- La reconnexion échoue après réinstallation : le jeton d’appairage du Trousseau a été effacé ; réappairez le nœud.

## Documents associés

- [Appairage](/channels/pairing)
- [Découverte](/gateway/discovery)
- [Bonjour](/gateway/bonjour)
