---
read_when:
    - Ajanlardan PDF’leri analiz etmek istiyorsunuz
    - Tam PDF aracı parametrelerine ve sınırlarına ihtiyacınız var
    - Yerel PDF modu ile çıkarma fallback’ini hata ayıklıyorsunuz
summary: Bir veya daha fazla PDF belgesini yerel sağlayıcı desteği ve çıkarma fallback’i ile analiz etme
title: PDF aracı
x-i18n:
    generated_at: "2026-04-25T13:59:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89bbc675f2b87729e283659f9604724be7a827b50b11edc853a42c448bbaaf6e
    source_path: tools/pdf.md
    workflow: 15
---

`pdf`, bir veya daha fazla PDF belgesini analiz eder ve metin döndürür.

Hızlı davranış özeti:

- Anthropic ve Google model sağlayıcıları için yerel sağlayıcı modu.
- Diğer sağlayıcılar için çıkarma fallback modu (önce metni çıkarır, gerektiğinde sayfa görsellerini kullanır).
- Tek (`pdf`) veya çoklu (`pdfs`) girdi destekler; çağrı başına en fazla 10 PDF.

## Kullanılabilirlik

Araç yalnızca OpenClaw, ajan için PDF destekli bir model yapılandırmasını çözümleyebildiğinde kaydedilir:

1. `agents.defaults.pdfModel`
2. fallback olarak `agents.defaults.imageModel`
3. fallback olarak ajanın çözülmüş oturum/varsayılan modeli
4. yerel PDF sağlayıcıları auth destekliyse, genel görsel fallback adaylarının önünde tercih edilir

Kullanılabilir bir model çözümlenemezse `pdf` aracı sunulmaz.

Kullanılabilirlik notları:

- Fallback zinciri auth farkındalıklıdır. Yapılandırılmış bir `provider/model`, yalnızca OpenClaw ajan için o sağlayıcıda gerçekten kimlik doğrulaması yapabiliyorsa sayılır.
- Yerel PDF sağlayıcıları şu anda **Anthropic** ve **Google**’dır.
- Çözülmüş oturum/varsayılan sağlayıcı zaten yapılandırılmış bir vision/PDF modeline sahipse, PDF aracı diğer auth destekli sağlayıcılara fallback yapmadan önce bunu yeniden kullanır.

## Girdi başvurusu

<ParamField path="pdf" type="string">
Bir PDF yolu veya URL’si.
</ParamField>

<ParamField path="pdfs" type="string[]">
Birden fazla PDF yolu veya URL’si, toplam en fazla 10 adet.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Analiz istemi.
</ParamField>

<ParamField path="pages" type="string">
`1-5` veya `1,3,7-9` gibi sayfa filtresi.
</ParamField>

<ParamField path="model" type="string">
`provider/model` biçiminde isteğe bağlı model geçersiz kılması.
</ParamField>

<ParamField path="maxBytesMb" type="number">
PDF başına MB cinsinden boyut üst sınırı. Varsayılan `agents.defaults.pdfMaxBytesMb` veya `10` değeridir.
</ParamField>

Girdi notları:

- `pdf` ve `pdfs`, yüklemeden önce birleştirilir ve yinelenenler kaldırılır.
- Hiç PDF girdisi verilmezse araç hata verir.
- `pages`, 1 tabanlı sayfa numaraları olarak ayrıştırılır; yinelenenler kaldırılır, sıralanır ve yapılandırılmış en fazla sayfa sayısına göre sınırlandırılır.
- `maxBytesMb`, varsayılan olarak `agents.defaults.pdfMaxBytesMb` veya `10` değerini kullanır.

## Desteklenen PDF başvuruları

- yerel dosya yolu (`~` genişletmesi dahil)
- `file://` URL
- `http://` ve `https://` URL
- `media://inbound/<id>` gibi OpenClaw tarafından yönetilen gelen başvurular

Başvuru notları:

- Diğer URI şemaları (`ftp://` gibi) `unsupported_pdf_reference` ile reddedilir.
- Sandbox modunda uzak `http(s)` URL’leri reddedilir.
- Yalnızca çalışma alanı dosya politikası etkinse izin verilen köklerin dışındaki yerel dosya yolları reddedilir.
- Yönetilen gelen başvurular ve OpenClaw’ın gelen medya deposu altındaki yeniden oynatılmış yollar, yalnızca çalışma alanı dosya politikası ile izinlidir.

## Yürütme modları

### Yerel sağlayıcı modu

Yerel mod, `anthropic` ve `google` sağlayıcısı için kullanılır.
Araç ham PDF baytlarını doğrudan sağlayıcı API’lerine gönderir.

Yerel mod sınırları:

- `pages` desteklenmez. Ayarlanırsa araç hata döndürür.
- Çoklu PDF girdisi desteklenir; her PDF, istemden önce yerel belge bloğu / satır içi PDF parçası olarak gönderilir.

### Çıkarma fallback modu

Fallback modu, yerel olmayan sağlayıcılar için kullanılır.

Akış:

1. Seçilen sayfalardan metni çıkarır (`agents.defaults.pdfMaxPages` değerine kadar, varsayılan `20`).
2. Çıkarılan metin uzunluğu `200` karakterin altındaysa seçilen sayfaları PNG görsellerine dönüştürür ve dahil eder.
3. Çıkarılan içeriği ve istemi seçilen modele gönderir.

Fallback ayrıntıları:

- Sayfa görseli çıkarma, `4,000,000` piksellik bir bütçe kullanır.
- Hedef model görsel girdisini desteklemiyorsa ve çıkarılabilir metin yoksa araç hata verir.
- Metin çıkarma başarılı olur ancak görsel çıkarma, yalnızca metin destekleyen bir modelde vision gerektirirse OpenClaw işlenmiş görselleri bırakır ve çıkarılmış metinle devam eder.
- Çıkarma fallback’i paketlenmiş `document-extract` Plugin’ini kullanır. Plugin, `pdfjs-dist` sahipliğini üstlenir; `@napi-rs/canvas` yalnızca görsel işleme fallback’i mevcut olduğunda kullanılır.

## Yapılandırma

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Tam alan ayrıntıları için [Configuration Reference](/tr/gateway/configuration-reference) bölümüne bakın.

## Çıktı ayrıntıları

Araç, `content[0].text` içinde metin ve `details` içinde yapılandırılmış meta veri döndürür.

Yaygın `details` alanları:

- `model`: çözümlenmiş model başvurusu (`provider/model`)
- `native`: yerel sağlayıcı modu için `true`, fallback için `false`
- `attempts`: başarıdan önce başarısız olan fallback denemeleri

Yol alanları:

- tek PDF girdisi: `details.pdf`
- çoklu PDF girdileri: `pdf` girdileriyle `details.pdfs[]`
- sandbox yol yeniden yazma meta verisi (uygulanabiliyorsa): `rewrittenFrom`

## Hata davranışı

- Eksik PDF girdisi: `pdf required: provide a path or URL to a PDF document` hatasını fırlatır
- Çok fazla PDF: `details.error = "too_many_pdfs"` içinde yapılandırılmış hata döndürür
- Desteklenmeyen başvuru şeması: `details.error = "unsupported_pdf_reference"` döndürür
- `pages` ile yerel mod: açık `pages is not supported with native PDF providers` hatasını fırlatır

## Örnekler

Tek PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Birden fazla PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Sayfa filtreli fallback modeli:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## İlgili

- [Araçlara Genel Bakış](/tr/tools) — kullanılabilir tüm ajan araçları
- [Configuration Reference](/tr/gateway/config-agents#agent-defaults) — `pdfMaxBytesMb` ve `pdfMaxPages` yapılandırması
