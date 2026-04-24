---
read_when:
    - Arbeiten an der Auflösung von Authentifizierungsprofilen oder am Routing von Anmeldedaten
    - Debuggen von Modell-Authentifizierungsfehlern oder der Profilreihenfolge
summary: Semantik der kanonischen Berechtigungsfähigkeit von Anmeldedaten und ihrer Auflösung für Authentifizierungsprofile
title: Semantik von Authentifizierungs-Anmeldedaten
x-i18n:
    generated_at: "2026-04-24T06:26:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: b45da872b9ab177acbac08ce353b6ee31b6a068477ace52e5e5eda32a848d8bb
    source_path: auth-credential-semantics.md
    workflow: 15
---

Dieses Dokument definiert die kanonische Semantik für die Berechtigungsfähigkeit von Anmeldedaten und ihre Auflösung, die in folgenden Bereichen verwendet wird:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Ziel ist es, das Verhalten bei der Auswahl und zur Laufzeit aufeinander abzustimmen.

## Stabile Probe-Reason-Codes

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Token-Anmeldedaten

Token-Anmeldedaten (`type: "token"`) unterstützen ein Inline-`token` und/oder `tokenRef`.

### Regeln für die Berechtigungsfähigkeit

1. Ein Token-Profil ist nicht berechtigungsfähig, wenn sowohl `token` als auch `tokenRef` fehlen.
2. `expires` ist optional.
3. Wenn `expires` vorhanden ist, muss es eine endliche Zahl größer als `0` sein.
4. Wenn `expires` ungültig ist (`NaN`, `0`, negativ, nicht endlich oder vom falschen Typ), ist das Profil mit `invalid_expires` nicht berechtigungsfähig.
5. Wenn `expires` in der Vergangenheit liegt, ist das Profil mit `expired` nicht berechtigungsfähig.
6. `tokenRef` umgeht die `expires`-Validierung nicht.

### Regeln für die Auflösung

1. Die Semantik des Resolvers für `expires` entspricht der Semantik für die Berechtigungsfähigkeit.
2. Für berechtigungsfähige Profile kann das Token-Material aus dem Inline-Wert oder aus `tokenRef` aufgelöst werden.
3. Nicht auflösbare Referenzen erzeugen `unresolved_ref` in der Ausgabe von `models status --probe`.

## Explizite Filterung der Auth-Reihenfolge

- Wenn `auth.order.<provider>` oder die Auth-Store-Reihenfolgenüberschreibung für einen
  Provider gesetzt ist, prüft `models status --probe` nur Profil-IDs, die in der
  aufgelösten Auth-Reihenfolge für diesen Provider verbleiben.
- Ein gespeichertes Profil für diesen Provider, das in der expliziten Reihenfolge fehlt,
  wird später nicht stillschweigend versucht. Die Probe-Ausgabe meldet es mit
  `reasonCode: excluded_by_auth_order` und dem Detail
  `Von auth.order für diesen Provider ausgeschlossen.`

## Auflösung des Probe-Ziels

- Probe-Ziele können aus Authentifizierungsprofilen, Umgebungs-Anmeldedaten oder
  `models.json` stammen.
- Wenn ein Provider Anmeldedaten hat, OpenClaw dafür aber kein prüfbares Modell
  als Kandidaten auflösen kann, meldet `models status --probe` `status: no_model` mit
  `reasonCode: no_model`.

## SecretRef-Richtlinien-Guard für OAuth

- SecretRef-Eingaben sind nur für statische Anmeldedaten vorgesehen.
- Wenn eine Profil-Anmeldedatei `type: "oauth"` ist, werden SecretRef-Objekte für dieses Anmeldedatenmaterial des Profils nicht unterstützt.
- Wenn `auth.profiles.<id>.mode` `"oauth"` ist, werden SecretRef-gestützte `keyRef`-/`tokenRef`-Eingaben für dieses Profil abgelehnt.
- Verstöße sind harte Fehler in den Start-/Neuladepfaden der Auth-Auflösung.

## Legacy-kompatible Meldungen

Für die Skriptkompatibilität bleibt bei Probe-Fehlern diese erste Zeile unverändert:

`Auth profile credentials are missing or expired.`

Benutzerfreundliche Details und stabile Reason-Codes können in den nachfolgenden Zeilen hinzugefügt werden.

## Verwandt

- [Verwaltung von Secrets](/de/gateway/secrets)
- [Auth-Speicherung](/de/concepts/oauth)
