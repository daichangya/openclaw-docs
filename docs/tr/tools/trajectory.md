---
read_when:
    - Bir agent'ın neden belirli şekilde yanıt verdiğini, başarısız olduğunu veya araç çağırdığını hata ayıklıyorsunuz
    - Bir OpenClaw oturumu için destek paketi dışa aktarıyorsunuz
    - Prompt bağlamını, araç çağrılarını, çalışma zamanı hatalarını veya kullanım meta verisini inceliyorsunuz
    - Trajectory yakalamayı devre dışı bırakıyor veya yeniden konumlandırıyorsunuz
summary: Bir OpenClaw agent oturumunda hata ayıklamak için redakte edilmiş trajectory paketleri dışa aktarın
title: Trajectory Paketleri
x-i18n:
    generated_at: "2026-04-23T09:12:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18f18c9b0a57fcc85624ae8592778447f61ffbd2aa455f8f92893955af744b23
    source_path: tools/trajectory.md
    workflow: 15
---

# Trajectory paketleri

Trajectory yakalama, OpenClaw'ın oturum başına uçuş kaydedicisidir. Her agent çalıştırması için
yapılandırılmış bir zaman çizelgesi kaydeder, ardından `/export-trajectory`
geçerli oturumu redakte edilmiş bir destek paketi olarak paketler.

Bunu şu gibi soruları yanıtlamanız gerektiğinde kullanın:

- Modele hangi prompt, sistem prompt'u ve araçlar gönderildi?
- Hangi transkript mesajları ve araç çağrıları bu yanıta yol açtı?
- Çalıştırma zaman aşımına mı uğradı, iptal mi edildi, Compaction mı yaptı yoksa sağlayıcı hatasına mı çarptı?
- Hangi model, plugin'ler, Skills ve çalışma zamanı ayarları etkindi?
- Sağlayıcı hangi kullanım ve prompt-cache meta verilerini döndürdü?

## Hızlı başlangıç

Etkin oturuma şunu gönderin:

```text
/export-trajectory
```

Takma ad:

```text
/trajectory
```

OpenClaw paketi çalışma alanı altında yazar:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Göreli bir çıktı dizini adı seçebilirsiniz:

```text
/export-trajectory bug-1234
```

Özel yol `.openclaw/trajectory-exports/` içinde çözülür. Mutlak
yollar ve `~` yolları reddedilir.

## Erişim

Trajectory dışa aktarımı bir sahip komutudur. Gönderenin normal komut
yetkilendirme denetimlerini ve kanal için sahip denetimlerini geçmesi gerekir.

## Neler kaydedilir

Trajectory yakalama, OpenClaw agent çalıştırmaları için varsayılan olarak açıktır.

Çalışma zamanı olayları şunları içerir:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

Transkript olayları da etkin oturum dalından yeniden oluşturulur:

- kullanıcı mesajları
- yardımcı mesajları
- araç çağrıları
- araç sonuçları
- Compaction'lar
- model değişiklikleri
- etiketler ve özel oturum girdileri

Olaylar şu şema işaretçisiyle JSON Lines olarak yazılır:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Paket dosyaları

Dışa aktarılan bir paket şunları içerebilir:

| Dosya                 | İçerikler                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `manifest.json`       | Paket şeması, kaynak dosyalar, olay sayıları ve oluşturulan dosya listesi                   |
| `events.jsonl`        | Sıralı çalışma zamanı ve transkript zaman çizelgesi                                          |
| `session-branch.json` | Redakte edilmiş etkin transkript dalı ve oturum başlığı                                     |
| `metadata.json`       | OpenClaw sürümü, OS/çalışma zamanı, model, yapılandırma anlık görüntüsü, plugin'ler, Skills ve prompt meta verileri |
| `artifacts.json`      | Nihai durum, hatalar, kullanım, prompt cache, Compaction sayısı, yardımcı metni ve araç meta verileri |
| `prompts.json`        | Gönderilen prompt'lar ve seçilmiş prompt oluşturma ayrıntıları                               |
| `system-prompt.txt`   | Yakalandıysa en son derlenmiş sistem prompt'u                                               |
| `tools.json`          | Yakalandıysa modele gönderilen araç tanımları                                               |

`manifest.json`, o pakette bulunan dosyaları listeler. Bazı dosyalar,
oturum karşılık gelen çalışma zamanı verisini yakalamadığında atlanır.

## Yakalama konumu

Varsayılan olarak çalışma zamanı trajectory olayları oturum dosyasının yanına yazılır:

```text
<session>.trajectory.jsonl
```

OpenClaw ayrıca oturumun yanına en iyi çabayla bir işaretçi dosyası da yazar:

```text
<session>.trajectory-path.json
```

Çalışma zamanı trajectory yan dosyalarını
ayrı bir dizinde saklamak için `OPENCLAW_TRAJECTORY_DIR` ayarlayın:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Bu değişken ayarlandığında OpenClaw, o
dizinde oturum kimliği başına bir JSONL dosyası yazar.

## Yakalamayı devre dışı bırakma

OpenClaw'ı başlatmadan önce `OPENCLAW_TRAJECTORY=0` ayarlayın:

```bash
export OPENCLAW_TRAJECTORY=0
```

Bu, çalışma zamanı trajectory yakalamayı devre dışı bırakır. `/export-trajectory`
yine de transkript dalını dışa aktarabilir, ancak derlenmiş bağlam,
sağlayıcı artifact'leri ve prompt meta verileri gibi yalnızca çalışma zamanına ait dosyalar eksik olabilir.

## Gizlilik ve sınırlar

Trajectory paketleri, herkese açık paylaşım için değil, destek ve hata ayıklama için tasarlanmıştır.
OpenClaw, dışa aktarma dosyalarını yazmadan önce hassas değerleri redakte eder:

- kimlik bilgileri ve secret benzeri olduğu bilinen payload alanları
- görsel verisi
- yerel durum yolları
- çalışma alanı yolları, `$WORKSPACE_DIR` ile değiştirilir
- algılandığında home dizini yolları

Dışa aktarıcı ayrıca girdi boyutunu da sınırlar:

- çalışma zamanı yan dosyaları: 50 MiB
- oturum dosyaları: 50 MiB
- çalışma zamanı olayları: 200.000
- toplam dışa aktarılan olaylar: 250.000
- tek tek çalışma zamanı olay satırları 256 KiB üstünde kırpılır

Paketleri ekibiniz dışında paylaşmadan önce gözden geçirin. Redaksiyon en iyi çabayla yapılır
ve uygulamaya özgü her secret'ı bilemez.

## Sorun giderme

Dışa aktarmada çalışma zamanı olayı yoksa:

- OpenClaw'ın `OPENCLAW_TRAJECTORY=0` olmadan başlatıldığını doğrulayın
- `OPENCLAW_TRAJECTORY_DIR` değerinin yazılabilir bir dizine işaret edip etmediğini kontrol edin
- oturumda başka bir mesaj çalıştırın, sonra yeniden dışa aktarın
- `runtimeEventCount` için `manifest.json` dosyasını inceleyin

Komut çıktı yolunu reddederse:

- `bug-1234` gibi göreli bir ad kullanın
- `/tmp/...` veya `~/...` geçmeyin
- dışa aktarmayı `.openclaw/trajectory-exports/` içinde tutun

Dışa aktarma bir boyut hatasıyla başarısız olursa, oturum veya yan dosya
dışa aktarma güvenlik sınırlarını aşmıştır. Yeni bir oturum başlatın veya daha küçük bir yeniden üretim dışa aktarın.
