---
read_when:
    - Jumelage ou reconnexion du nœud iOS
    - Exécuter l’application iOS depuis la source
    - Débogage de la découverte gateway ou des commandes canvas
summary: 'Application de nœud iOS : connexion au Gateway, jumelage, canvas et dépannage'
title: Application iOS
x-i18n:
    generated_at: "2026-04-24T07:20:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87eaa706993bec9434bf22e18022af711b8398efff11c7fba4887aba46041ed3
    source_path: platforms/ios.md
    workflow: 15
---

Disponibilité : aperçu interne. L’application iOS n’est pas encore distribuée publiquement.

## Ce qu’elle fait

- Se connecte à un Gateway via WebSocket (LAN ou tailnet).
- Expose des capacités de nœud : Canvas, instantané d’écran, capture caméra, localisation, mode Talk, réveil vocal.
- Reçoit les commandes `node.invoke` et remonte les événements d’état du nœud.

## Exigences

- Gateway en cours d’exécution sur un autre appareil (macOS, Linux ou Windows via WSL2).
- Chemin réseau :
  - Même LAN via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (exemple de domaine : `openclaw.internal.`), **ou**
  - Hôte/port manuel (repli).

## Démarrage rapide (jumelage + connexion)

1. Démarrer le Gateway :

```bash
openclaw gateway --port 18789
```

2. Dans l’application iOS, ouvrez Réglages et choisissez un gateway découvert (ou activez Hôte manuel et saisissez l’hôte/le port).

3. Approuvez la demande de jumelage sur l’hôte gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si l’application réessaie le jumelage avec des détails d’authentification modifiés (rôle/portées/clé publique),
la demande en attente précédente est remplacée et un nouveau `requestId` est créé.
Exécutez à nouveau `openclaw devices list` avant d’approuver.

4. Vérifiez la connexion :

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push adossé à un relay pour les builds officiels

Les builds iOS officiels distribués utilisent le relay push externe au lieu de publier le jeton APNs brut
au gateway.

Exigence côté gateway :

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

- L’application iOS s’enregistre auprès du relay à l’aide d’App Attest et du reçu de l’application.
- Le relay renvoie un handle de relay opaque plus une autorisation d’envoi limitée à l’enregistrement.
- L’application iOS récupère l’identité du gateway jumelé et l’inclut dans l’enregistrement auprès du relay, afin que l’enregistrement adossé au relay soit délégué à ce gateway spécifique.
- L’application transmet cet enregistrement adossé au relay au gateway jumelé avec `push.apns.register`.
- Le gateway utilise ce handle relay stocké pour `push.test`, les réveils en arrière-plan et les wake nudges.
- L’URL de base du relay sur le gateway doit correspondre à l’URL du relay intégrée au build iOS officiel/TestFlight.
- Si l’application se connecte plus tard à un autre gateway ou à un build avec une URL de base de relay différente, elle actualise l’enregistrement relay au lieu de réutiliser l’ancienne liaison.

Ce dont le gateway **n’a pas** besoin pour ce chemin :

- Aucun jeton de relay à l’échelle du déploiement.
- Aucune clé APNs directe pour les envois officiels/TestFlight adossés au relay.

Flux opérateur attendu :

1. Installez le build iOS officiel/TestFlight.
2. Définissez `gateway.push.apns.relay.baseUrl` sur le gateway.
3. Jumelez l’application au gateway et laissez-la terminer la connexion.
4. L’application publie automatiquement `push.apns.register` une fois qu’elle dispose d’un jeton APNs, que la session opérateur est connectée et que l’enregistrement relay réussit.
5. Après cela, `push.test`, les réveils de reconnexion et les wake nudges peuvent utiliser l’enregistrement adossé au relay stocké.

Remarque de compatibilité :

- `OPENCLAW_APNS_RELAY_BASE_URL` fonctionne toujours comme remplacement env temporaire pour le gateway.

## Flux d’authentification et de confiance

Le relay existe pour imposer deux contraintes qu’un APNs direct sur le gateway ne peut pas fournir pour
les builds iOS officiels :

- Seuls les véritables builds iOS OpenClaw distribués par Apple peuvent utiliser le relay hébergé.
- Un gateway ne peut envoyer des push adossés au relay que pour les appareils iOS qui ont été jumelés à ce gateway spécifique.

Saut par saut :

1. `application iOS -> gateway`
   - L’application se jumelle d’abord au gateway via le flux normal d’authentification Gateway.
   - Cela donne à l’application une session de nœud authentifiée ainsi qu’une session opérateur authentifiée.
   - La session opérateur est utilisée pour appeler `gateway.identity.get`.

2. `application iOS -> relay`
   - L’application appelle les points de terminaison d’enregistrement du relay via HTTPS.
   - L’enregistrement inclut une preuve App Attest ainsi que le reçu de l’application.
   - Le relay valide l’identifiant de bundle, la preuve App Attest et le reçu Apple, et exige le
     chemin officiel/de production de distribution.
   - C’est ce qui empêche les builds locaux Xcode/dev d’utiliser le relay hébergé. Un build local peut être
     signé, mais il ne satisfait pas à la preuve officielle de distribution Apple attendue par le relay.

3. `délégation d’identité du gateway`
   - Avant l’enregistrement relay, l’application récupère l’identité du gateway jumelé depuis
     `gateway.identity.get`.
   - L’application inclut cette identité de gateway dans la charge utile d’enregistrement relay.
   - Le relay renvoie un handle de relay et une autorisation d’envoi limitée à l’enregistrement, délégués à
     cette identité de gateway.

4. `gateway -> relay`
   - Le gateway stocke le handle de relay et l’autorisation d’envoi reçus de `push.apns.register`.
   - Lors de `push.test`, des réveils de reconnexion et des wake nudges, le gateway signe la requête d’envoi avec sa
     propre identité d’appareil.
   - Le relay vérifie à la fois l’autorisation d’envoi stockée et la signature du gateway par rapport à l’identité
     de gateway déléguée issue de l’enregistrement.
   - Un autre gateway ne peut pas réutiliser cet enregistrement stocké, même s’il obtenait d’une manière ou d’une autre le handle.

5. `relay -> APNs`
   - Le relay possède les identifiants APNs de production et le jeton APNs brut pour le build officiel.
   - Le gateway ne stocke jamais le jeton APNs brut pour les builds officiels adossés au relay.
   - Le relay envoie le push final à APNs au nom du gateway jumelé.

Pourquoi cette conception a été créée :

- Pour garder les identifiants APNs de production hors des gateways utilisateurs.
- Pour éviter de stocker sur le gateway les jetons APNs bruts des builds officiels.
- Pour permettre l’usage du relay hébergé uniquement aux builds OpenClaw officiels/TestFlight.
- Pour empêcher un gateway d’envoyer des push de réveil vers des appareils iOS appartenant à un autre gateway.

Les builds locaux/manuels restent en APNs direct. Si vous testez ces builds sans relay, le
gateway a toujours besoin d’identifiants APNs directs :

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ce sont des variables d’environnement runtime de l’hôte gateway, pas des réglages Fastlane. `apps/ios/fastlane/.env` stocke uniquement
l’authentification App Store Connect / TestFlight comme `ASC_KEY_ID` et `ASC_ISSUER_ID` ; il ne configure pas
la livraison APNs directe pour les builds iOS locaux.

Stockage recommandé sur l’hôte gateway :

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Ne validez pas le fichier `.p8` et ne le placez pas dans le dépôt.

## Chemins de découverte

### Bonjour (LAN)

L’application iOS parcourt `_openclaw-gw._tcp` sur `local.` et, lorsqu’il est configuré, le même
domaine de découverte DNS-SD étendue. Les gateways sur le même LAN apparaissent automatiquement via `local.` ;
la découverte inter-réseaux peut utiliser le domaine étendu configuré sans modifier le type de balise.

### Tailnet (inter-réseaux)

Si mDNS est bloqué, utilisez une zone DNS-SD unicast (choisissez un domaine ; exemple :
`openclaw.internal.`) et Tailscale split DNS.
Voir [Bonjour](/fr/gateway/bonjour) pour l’exemple CoreDNS.

### Hôte/port manuel

Dans Réglages, activez **Hôte manuel** et saisissez l’hôte + le port du gateway (par défaut `18789`).

## Canvas + A2UI

Le nœud iOS affiche un canvas WKWebView. Utilisez `node.invoke` pour le piloter :

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Remarques :

- L’hôte canvas du Gateway sert `/__openclaw__/canvas/` et `/__openclaw__/a2ui/`.
- Il est servi par le serveur HTTP du Gateway (même port que `gateway.port`, `18789` par défaut).
- Le nœud iOS navigue automatiquement vers A2UI à la connexion lorsqu’une URL d’hôte canvas est annoncée.
- Revenez à l’échafaudage intégré avec `canvas.navigate` et `{"url":""}`.

### Canvas eval / snapshot

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

- `NODE_BACKGROUND_UNAVAILABLE` : mettez l’application iOS au premier plan (les commandes canvas/camera/screen l’exigent).
- `A2UI_HOST_NOT_CONFIGURED` : le Gateway n’a pas annoncé d’URL d’hôte canvas ; vérifiez `canvasHost` dans [Configuration du Gateway](/fr/gateway/configuration).
- L’invite de jumelage n’apparaît jamais : exécutez `openclaw devices list` et approuvez manuellement.
- La reconnexion échoue après réinstallation : le jeton de jumelage stocké dans le trousseau a été effacé ; jumelez à nouveau le nœud.

## Documentation associée

- [Pairing](/fr/channels/pairing)
- [Discovery](/fr/gateway/discovery)
- [Bonjour](/fr/gateway/bonjour)
