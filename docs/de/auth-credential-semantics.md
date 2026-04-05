---
read_when:
    - Bei der Arbeit an der Auflösung von Auth-Profilen oder der Weiterleitung von Anmeldeinformationen
    - Beim Debuggen von Auth-Fehlern bei Modellen oder der Profilreihenfolge
summary: Kanonische Berechtigungs- und Auflösungssemantik für Anmeldeinformationsprofile
title: Semantik von Auth-Anmeldeinformationen
x-i18n:
    generated_at: "2026-04-05T12:34:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4cd3e16cd25eb22c5e707311d06a19df1a59747ee3261c2d32c534a245fd7fb
    source_path: auth-credential-semantics.md
    workflow: 15
---

# Semantik von Auth-Anmeldeinformationen

Dieses Dokument definiert die kanonische Berechtigungs- und Auflösungssemantik für Anmeldeinformationen, die verwendet wird in:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Ziel ist es, das Verhalten zur Auswahlzeit und zur Laufzeit aufeinander abzustimmen.

## Stabile Probe-Reason-Codes

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Token-Anmeldeinformationen

Token-Anmeldeinformationen (`type: "token"`) unterstützen inline `token` und/oder `tokenRef`.

### Berechtigungsregeln

1. Ein Token-Profil ist nicht berechtigt, wenn sowohl `token` als auch `tokenRef` fehlen.
2. `expires` ist optional.
3. Wenn `expires` vorhanden ist, muss es eine endliche Zahl größer als `0` sein.
4. Wenn `expires` ungültig ist (`NaN`, `0`, negativ, nicht endlich oder falscher Typ), ist das Profil mit `invalid_expires` nicht berechtigt.
5. Wenn `expires` in der Vergangenheit liegt, ist das Profil mit `expired` nicht berechtigt.
6. `tokenRef` umgeht die Validierung von `expires` nicht.

### Auflösungsregeln

1. Die Semantik des Resolvers entspricht der Berechtigungssemantik für `expires`.
2. Für berechtigte Profile kann Token-Material aus dem Inline-Wert oder aus `tokenRef` aufgelöst werden.
3. Nicht auflösbare Refs erzeugen `unresolved_ref` in der Ausgabe von `models status --probe`.

## Explizite Filterung der Auth-Reihenfolge

- Wenn `auth.order.<provider>` oder die Auth-Store-Reihenfolgenüberschreibung für einen
  Provider gesetzt ist, prüft `models status --probe` nur Profil-IDs, die in der
  aufgelösten Auth-Reihenfolge für diesen Provider verbleiben.
- Ein gespeichertes Profil für diesen Provider, das in der expliziten Reihenfolge ausgelassen wird,
  wird nicht stillschweigend später versucht. Die Probe-Ausgabe meldet es mit
  `reasonCode: excluded_by_auth_order` und dem Detail
  `Durch auth.order für diesen Provider ausgeschlossen.`

## Auflösung des Probe-Ziels

- Probe-Ziele können aus Auth-Profilen, Umgebungs-Anmeldeinformationen oder
  `models.json` stammen.
- Wenn ein Provider Anmeldeinformationen hat, OpenClaw dafür aber kein prüfbares Modell
  als Kandidaten auflösen kann, meldet `models status --probe` `status: no_model` mit
  `reasonCode: no_model`.

## OAuth-SecretRef-Richtlinienschutz

- SecretRef-Eingaben sind nur für statische Anmeldeinformationen vorgesehen.
- Wenn die Anmeldeinformationen eines Profils `type: "oauth"` sind, werden SecretRef-Objekte für das Material dieser Profil-Anmeldeinformationen nicht unterstützt.
- Wenn `auth.profiles.<id>.mode` `"oauth"` ist, werden SecretRef-gestützte `keyRef`-/`tokenRef`-Eingaben für dieses Profil abgelehnt.
- Verstöße sind harte Fehler in den Startup-/Reload-Pfaden der Auth-Auflösung.

## Legacy-kompatible Meldungen

Für die Kompatibilität mit Skripten bleibt diese erste Zeile von Probe-Fehlern unverändert:

`Auth profile credentials are missing or expired.`

Benutzerfreundliche Details und stabile Reason-Codes können in nachfolgenden Zeilen hinzugefügt werden.
