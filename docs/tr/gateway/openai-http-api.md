---
read_when:
    - OpenAI sohbet completions'larını bekleyen araçları entegre etme
summary: Gateway'den OpenAI uyumlu bir `/v1/chat/completions` HTTP uç noktası açığa çıkarın
title: OpenAI sohbet completions'ları
x-i18n:
    generated_at: "2026-04-25T13:48:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a2f45abfc0aef8f73ab909bc3007de4078177214e5e0e5cf27a4c6ad0918172
    source_path: gateway/openai-http-api.md
    workflow: 15
---

OpenClaw'ın Gateway'i küçük bir OpenAI uyumlu Chat Completions uç noktası sunabilir.

Bu uç nokta **varsayılan olarak devre dışıdır**. Önce config içinde etkinleştirin.

- `POST /v1/chat/completions`
- Gateway ile aynı port (WS + HTTP çoklama): `http://<gateway-host>:<port>/v1/chat/completions`

Gateway'in OpenAI uyumlu HTTP yüzeyi etkinleştirildiğinde ayrıca şunları da sunar:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Arka planda istekler normal bir Gateway ajan çalıştırması olarak yürütülür (`openclaw agent` ile aynı kod yolu), bu nedenle yönlendirme/izinler/config Gateway'inizle eşleşir.

## Kimlik doğrulama

Gateway kimlik doğrulama yapılandırmasını kullanır.

Yaygın HTTP kimlik doğrulama yolları:

- paylaşılan sır kimlik doğrulaması (`gateway.auth.mode="token"` veya `"password"`):
  `Authorization: Bearer <token-or-password>`
- güvenilir kimlik taşıyan HTTP kimlik doğrulaması (`gateway.auth.mode="trusted-proxy"`):
  yapılandırılmış kimlik farkındalığı olan proxy üzerinden yönlendirin ve bunun gerekli
  kimlik üst bilgilerini eklemesine izin verin
- özel giriş için açık kimlik doğrulama (`gateway.auth.mode="none"`):
  kimlik doğrulama üst bilgisi gerekmez

Notlar:

- `gateway.auth.mode="token"` olduğunda `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) kullanın.
- `gateway.auth.mode="password"` olduğunda `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) kullanın.
- `gateway.auth.mode="trusted-proxy"` olduğunda HTTP isteği,
  yapılandırılmış loopback olmayan güvenilir bir proxy kaynağından gelmelidir; aynı ana makinedeki loopback proxy'ler bu kipi
  karşılamaz.
- `gateway.auth.rateLimit` yapılandırılmışsa ve çok fazla kimlik doğrulama hatası oluşursa, uç nokta `Retry-After` ile birlikte `429` döndürür.

## Güvenlik sınırı (önemli)

Bu uç noktayı, Gateway örneği için **tam operatör erişimli** bir yüzey olarak değerlendirin.

- Buradaki HTTP bearer kimlik doğrulaması, dar kapsamlı kullanıcı başına bir model değildir.
- Bu uç nokta için geçerli bir Gateway token/password değeri, sahip/operatör kimlik bilgisi gibi değerlendirilmelidir.
- İstekler, güvenilir operatör eylemleriyle aynı kontrol düzlemi ajan yolu üzerinden çalışır.
- Bu uç noktada ayrı bir sahip olmayan/kullanıcı başına araç sınırı yoktur; çağıran taraf burada Gateway kimlik doğrulamasını geçtiğinde OpenClaw onu bu Gateway için güvenilir bir operatör olarak değerlendirir.
- Paylaşılan sır kimlik doğrulama kiplerinde (`token` ve `password`), çağıran taraf daha dar bir `x-openclaw-scopes` üst bilgisi gönderse bile uç nokta normal tam operatör varsayılanlarını geri yükler.
- Güvenilir kimlik taşıyan HTTP kipleri (`trusted-proxy` kimlik doğrulaması veya `gateway.auth.mode="none"` gibi), varsa `x-openclaw-scopes` değerine uyar ve yoksa normal operatör varsayılan kapsam kümesine geri döner.
- Hedef ajan ilkesi hassas araçlara izin veriyorsa, bu uç nokta bunları kullanabilir.
- Bu uç noktayı yalnızca loopback/tailnet/özel giriş üzerinde tutun; herkese açık internete doğrudan açmayın.

Kimlik doğrulama matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan Gateway operatör sırrına sahip olunduğunu kanıtlar
  - daha dar `x-openclaw-scopes` değerlerini yok sayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu uç noktadaki sohbet dönüşlerini sahip-gönderen dönüşleri olarak değerlendirir
- güvenilir kimlik taşıyan HTTP kipleri (`trusted-proxy` kimlik doğrulaması örneği veya özel girişte `gateway.auth.mode="none"`)
  - bazı dış güvenilir kimlik veya dağıtım sınırlarını doğrular
  - üst bilgi mevcut olduğunda `x-openclaw-scopes` değerine uyar
  - üst bilgi yoksa normal operatör varsayılan kapsam kümesine geri döner
  - yalnızca çağıran taraf kapsamları açıkça daraltır ve `operator.admin` alanını çıkarırsa sahip semantiğini kaybeder

Bkz. [Güvenlik](/tr/gateway/security) ve [Uzaktan erişim](/tr/gateway/remote).

## Ajan öncelikli model sözleşmesi

OpenClaw, OpenAI `model` alanını ham sağlayıcı model kimliği olarak değil, bir **ajan hedefi** olarak ele alır.

- `model: "openclaw"` yapılandırılmış varsayılan ajana yönlendirilir.
- `model: "openclaw/default"` de yapılandırılmış varsayılan ajana yönlendirilir.
- `model: "openclaw/<agentId>"` belirli bir ajana yönlendirilir.

İsteğe bağlı istek üst bilgileri:

- `x-openclaw-model: <provider/model-or-bare-id>`, seçilen ajan için arka uç modeli geçersiz kılar.
- `x-openclaw-agent-id: <agentId>`, uyumluluk geçersiz kılması olarak desteklenmeye devam eder.
- `x-openclaw-session-key: <sessionKey>`, oturum yönlendirmesini tam olarak kontrol eder.
- `x-openclaw-message-channel: <channel>`, kanal farkındalığı olan istemler ve ilkeler için sentetik giriş kanal bağlamını ayarlar.

Uyumluluk takma adları hâlâ kabul edilir:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Uç noktayı etkinleştirme

`gateway.http.endpoints.chatCompletions.enabled` değerini `true` olarak ayarlayın:

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

## Uç noktayı devre dışı bırakma

`gateway.http.endpoints.chatCompletions.enabled` değerini `false` olarak ayarlayın:

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

## Oturum davranışı

Varsayılan olarak bu uç nokta **istek başına durumsuzdur** (her çağrıda yeni bir oturum anahtarı oluşturulur).

İstek bir OpenAI `user` dizesi içeriyorsa, Gateway bundan kararlı bir oturum anahtarı türetir; böylece tekrarlanan çağrılar bir ajan oturumunu paylaşabilir.

## Bu yüzey neden önemlidir

Bu, self-hosted ön yüzler ve araçlar için en yüksek kaldıraçlı uyumluluk kümesidir:

- Çoğu Open WebUI, LobeChat ve LibreChat kurulumu `/v1/models` bekler.
- Birçok RAG sistemi `/v1/embeddings` bekler.
- Mevcut OpenAI sohbet istemcileri genellikle `/v1/chat/completions` ile başlayabilir.
- Daha yerel ajan istemcileri giderek daha fazla `/v1/responses` tercih ediyor.

## Model listesi ve ajan yönlendirmesi

<AccordionGroup>
  <Accordion title="`/v1/models` ne döndürür?">
    Bir OpenClaw ajan hedef listesi.

    Döndürülen kimlikler `openclaw`, `openclaw/default` ve `openclaw/<agentId>` girdileridir.
    Bunları doğrudan OpenAI `model` değerleri olarak kullanın.

  </Accordion>
  <Accordion title="`/v1/models` ajanları mı yoksa alt ajanları mı listeler?">
    Arka uç sağlayıcı modellerini veya alt ajanları değil, üst düzey ajan hedeflerini listeler.

    Alt ajanlar iç yürütme topolojisi olarak kalır. Sözde model olarak görünmezler.

  </Accordion>
  <Accordion title="Neden `openclaw/default` dahil ediliyor?">
    `openclaw/default`, yapılandırılmış varsayılan ajan için kararlı takma addır.

    Bu, istemcilerin gerçek varsayılan ajan kimliği ortamlar arasında değişse bile tek bir öngörülebilir kimliği kullanmayı sürdürebileceği anlamına gelir.

  </Accordion>
  <Accordion title="Arka uç modeli nasıl geçersiz kılınır?">
    `x-openclaw-model` kullanın.

    Örnekler:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Bunu atlayırsanız, seçilen ajan normal yapılandırılmış model seçimiyle çalışır.

  </Accordion>
  <Accordion title="Embeddings bu sözleşmeye nasıl uyar?">
    `/v1/embeddings`, aynı ajan hedefi `model` kimliklerini kullanır.

    `model: "openclaw/default"` veya `model: "openclaw/<agentId>"` kullanın.
    Belirli bir embedding modeli gerektiğinde bunu `x-openclaw-model` içinde gönderin.
    Bu üst bilgi olmadan istek, seçilen ajanın normal embedding kurulumuna iletilir.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Server-Sent Events (SSE) almak için `stream: true` ayarlayın:

- `Content-Type: text/event-stream`
- Her olay satırı `data: <json>` şeklindedir
- Akış `data: [DONE]` ile biter

## Hızlı Open WebUI kurulumu

Temel bir Open WebUI bağlantısı için:

- Temel URL: `http://127.0.0.1:18789/v1`
- macOS üzerinde Docker temel URL'si: `http://host.docker.internal:18789/v1`
- API anahtarı: Gateway bearer token'ınız
- Model: `openclaw/default`

Beklenen davranış:

- `GET /v1/models`, `openclaw/default` listelemelidir
- Open WebUI, sohbet modeli kimliği olarak `openclaw/default` kullanmalıdır
- Bu ajan için belirli bir arka uç sağlayıcı/model istiyorsanız, ajanın normal varsayılan modelini ayarlayın veya `x-openclaw-model` gönderin

Hızlı smoke testi:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Bu `openclaw/default` döndürüyorsa, çoğu Open WebUI kurulumu aynı temel URL ve token ile bağlanabilir.

## Örnekler

Streaming olmayan:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Streaming:

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

Modelleri listeleme:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Tek bir modeli getirme:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Embeddings oluşturma:

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

Notlar:

- `/v1/models`, ham sağlayıcı kataloglarını değil, OpenClaw ajan hedeflerini döndürür.
- `openclaw/default` her zaman bulunur; böylece tek bir kararlı kimlik ortamlar arasında çalışır.
- Arka uç sağlayıcı/model geçersiz kılmaları OpenAI `model` alanına değil, `x-openclaw-model` alanına aittir.
- `/v1/embeddings`, `input` değerini bir dize veya dize dizisi olarak destekler.

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [OpenAI](/tr/providers/openai)
