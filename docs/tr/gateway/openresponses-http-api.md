---
read_when:
    - OpenResponses API konuşan istemcileri entegre etme
    - Öğe tabanlı girdiler, istemci araç çağrıları veya SSE olayları istiyorsunuz
summary: Gateway üzerinden OpenResponses uyumlu bir `/v1/responses` HTTP uç noktası sunun
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-25T13:48:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: b48685ab42d6f031849990b60a57af9501c216f058dc38abce184b963b05cedb
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

OpenClaw'ın Gateway'i, OpenResponses uyumlu bir `POST /v1/responses` uç noktası sunabilir.

Bu uç nokta varsayılan olarak **devre dışıdır**. Önce yapılandırmada etkinleştirin.

- `POST /v1/responses`
- Gateway ile aynı port (WS + HTTP çoklama): `http://<gateway-host>:<port>/v1/responses`

Arka planda istekler normal bir Gateway agent çalıştırması olarak yürütülür (`openclaw agent` ile aynı kod yolu), bu nedenle yönlendirme/izinler/yapılandırma Gateway'inizle eşleşir.

## Kimlik doğrulama, güvenlik ve yönlendirme

Operasyonel davranış [OpenAI Chat Completions](/tr/gateway/openai-http-api) ile eşleşir:

- eşleşen Gateway HTTP auth yolunu kullanın:
  - paylaşılan gizli anahtar auth (`gateway.auth.mode="token"` veya `"password"`): `Authorization: Bearer <token-or-password>`
  - trusted-proxy auth (`gateway.auth.mode="trusted-proxy"`): yapılandırılmış loopback olmayan güvenilir bir proxy kaynağından gelen kimlik farkında proxy üstbilgileri
  - private-ingress açık auth (`gateway.auth.mode="none"`): auth üstbilgisi yok
- bu uç noktayı Gateway örneği için tam operatör erişimi olarak değerlendirin
- paylaşılan gizli anahtar auth modlarında (`token` ve `password`), daha dar bearer bildirimi `x-openclaw-scopes` değerlerini yok sayın ve normal tam operatör varsayılanlarını geri yükleyin
- güvenilir, kimlik taşıyan HTTP modlarında (örneğin trusted proxy auth veya `gateway.auth.mode="none"`), varsa `x-openclaw-scopes` değerini dikkate alın, yoksa normal operatör varsayılan kapsam kümesine geri dönün
- agent seçmek için `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` veya `x-openclaw-agent-id` kullanın
- seçili agent'ın backend modelini geçersiz kılmak istiyorsanız `x-openclaw-model` kullanın
- açık oturum yönlendirmesi için `x-openclaw-session-key` kullanın
- varsayılan olmayan sentetik giriş kanalı bağlamı istediğinizde `x-openclaw-message-channel` kullanın

Auth matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan Gateway operatör gizli anahtarına sahip olunduğunu kanıtlar
  - daha dar `x-openclaw-scopes` değerlerini yok sayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu uç noktadaki sohbet turlarını owner-sender turları olarak ele alır
- güvenilir, kimlik taşıyan HTTP modları (örneğin trusted proxy auth veya private ingress üzerinde `gateway.auth.mode="none"`)
  - üstbilgi varsa `x-openclaw-scopes` değerini dikkate alır
  - üstbilgi yoksa normal operatör varsayılan kapsam kümesine geri döner
  - yalnızca çağıran taraf kapsamları açıkça daraltır ve `operator.admin` değerini çıkarırsa owner semantiğini kaybeder

Bu uç noktayı `gateway.http.endpoints.responses.enabled` ile etkinleştirin veya devre dışı bırakın.

Aynı uyumluluk yüzeyi ayrıca şunları da içerir:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Agent hedefli modellerin, `openclaw/default` değerinin, embeddings pass-through davranışının ve backend model geçersiz kılmalarının nasıl birlikte çalıştığına dair standart açıklama için bkz. [OpenAI Chat Completions](/tr/gateway/openai-http-api#agent-first-model-contract) ve [Model list and agent routing](/tr/gateway/openai-http-api#model-list-and-agent-routing).

## Oturum davranışı

Varsayılan olarak uç nokta istek başına **durumsuzdur** (her çağrıda yeni bir oturum anahtarı üretilir).

İstek bir OpenResponses `user` dizesi içeriyorsa, Gateway bundan kararlı bir oturum anahtarı türetir; böylece yinelenen çağrılar aynı agent oturumunu paylaşabilir.

## İstek biçimi (desteklenen)

İstek, öğe tabanlı girdilerle OpenResponses API biçimini izler. Mevcut destek:

- `input`: dize veya öğe nesneleri dizisi.
- `instructions`: sistem istemine birleştirilir.
- `tools`: istemci araç tanımları (function araçları).
- `tool_choice`: istemci araçlarını filtreler veya zorunlu kılar.
- `stream`: SSE akışını etkinleştirir.
- `max_output_tokens`: en iyi çabayla çıktı sınırı (sağlayıcıya bağlı).
- `user`: kararlı oturum yönlendirmesi.

Kabul edilir ancak **şu anda yok sayılır**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Desteklenir:

- `previous_response_id`: İstek aynı agent/user/requested-session kapsamı içinde kaldığında OpenClaw önceki yanıt oturumunu yeniden kullanır.

## Öğeler (`input`)

### `message`

Roller: `system`, `developer`, `user`, `assistant`.

- `system` ve `developer`, sistem istemine eklenir.
- En son `user` veya `function_call_output` öğesi “geçerli mesaj” olur.
- Daha önceki user/assistant mesajları, bağlam için geçmişe dahil edilir.

### `function_call_output` (tur tabanlı araçlar)

Araç sonuçlarını modele geri gönderin:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` ve `item_reference`

Şema uyumluluğu için kabul edilir ancak istem oluşturulurken yok sayılır.

## Araçlar (istemci tarafı function araçları)

Araçları şu biçimde sağlayın: `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Agent bir araç çağırmaya karar verirse, yanıt bir `function_call` çıktı öğesi döndürür.
Daha sonra turu sürdürmek için `function_call_output` içeren bir takip isteği gönderirsiniz.

## Görseller (`input_image`)

Base64 veya URL kaynaklarını destekler:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

İzin verilen MIME türleri (şu anda): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Maksimum boyut (şu anda): 10MB.

## Dosyalar (`input_file`)

Base64 veya URL kaynaklarını destekler:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

İzin verilen MIME türleri (şu anda): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Maksimum boyut (şu anda): 5MB.

Geçerli davranış:

- Dosya içeriği, kullanıcı mesajına değil **sistem istemine** çözülerek eklenir; böylece geçici kalır (oturum geçmişinde kalıcı olmaz).
- Çözümlenen dosya metni, eklenmeden önce **güvenilmeyen harici içerik** olarak sarılır; böylece dosya baytları güvenilir talimatlar olarak değil veri olarak değerlendirilir.
- Enjekte edilen blok, şu gibi açık sınır işaretleyicileri kullanır:
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` ve bir
  `Source: External` meta veri satırı içerir.
- Bu dosya girdi yolu, istem bütçesini korumak için uzun `SECURITY NOTICE:` başlığını bilerek eklemez; sınır işaretleyicileri ve meta veriler yine de yerinde kalır.
- PDF'ler önce metin için ayrıştırılır. Az metin bulunursa ilk sayfalar
  görsellere rasterize edilir ve modele iletilir; enjekte edilen dosya bloğu da
  `[PDF content rendered to images]` yer tutucusunu kullanır.

PDF ayrıştırma, Node dostu `pdfjs-dist` legacy derlemesini (worker yok) kullanan paketlenmiş `document-extract` plugin'i tarafından sağlanır. Modern PDF.js derlemesi tarayıcı worker'ları/DOM global'leri beklediği için Gateway içinde kullanılmaz.

URL getirme varsayılanları:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (istek başına URL tabanlı toplam `input_file` + `input_image` parçası)
- İstekler korunur (DNS çözümleme, özel IP engelleme, yönlendirme sınırları, zaman aşımları).
- İsteğe bağlı ana makine adı izin listeleri, giriş türü başına desteklenir (`files.urlAllowlist`, `images.urlAllowlist`).
  - Tam ana makine: `"cdn.example.com"`
  - Joker alt alan adları: `"*.assets.example.com"` (tepe alanı eşleşmez)
  - Boş veya atlanmış izin listeleri, ana makine adı izin listesi kısıtlaması olmadığı anlamına gelir.
- URL tabanlı getirmeleri tamamen devre dışı bırakmak için `files.allowUrl: false` ve/veya `images.allowUrl: false` ayarlayın.

## Dosya + görsel sınırları (yapılandırma)

Varsayılanlar `gateway.http.endpoints.responses` altında ayarlanabilir:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

Atlandığında varsayılanlar:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- HEIC/HEIF `input_image` kaynakları kabul edilir ve sağlayıcıya iletilmeden önce JPEG'e normalize edilir.

Güvenlik notu:

- URL izin listeleri getirme öncesinde ve yönlendirme adımlarında uygulanır.
- Bir ana makine adını izin listesine almak özel/iç IP engellemesini atlatmaz.
- İnternete açık Gateway'ler için uygulama düzeyi korumalara ek olarak ağ çıkış denetimleri uygulayın.
  Bkz. [Security](/tr/gateway/security).

## Akış (SSE)

SSE (Server-Sent Events) almak için `stream: true` ayarlayın:

- `Content-Type: text/event-stream`
- Her olay satırı `event: <type>` ve `data: <json>` biçimindedir
- Akış `data: [DONE]` ile biter

Şu anda gönderilen olay türleri:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (hata durumunda)

## Kullanım

Alttaki sağlayıcı token sayılarını bildirirse `usage` doldurulur.
OpenClaw, bu sayaçlar aşağı akış durum/oturum yüzeylerine ulaşmadan önce yaygın OpenAI tarzı takma adları normalize eder; buna `input_tokens` / `output_tokens`
ve `prompt_tokens` / `completion_tokens` dahildir.

## Hatalar

Hatalar şu biçimde bir JSON nesnesi kullanır:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Yaygın durumlar:

- `401` eksik/geçersiz auth
- `400` geçersiz istek gövdesi
- `405` yanlış yöntem

## Örnekler

Akışsız:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

Akışlı:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## İlgili

- [OpenAI chat completions](/tr/gateway/openai-http-api)
- [OpenAI](/tr/providers/openai)
