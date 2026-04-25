---
read_when:
    - تريد استخدام SenseAudio لتحويل الكلام إلى نص للمرفقات الصوتية
    - تحتاج إلى متغير البيئة الخاص بمفتاح API لـ SenseAudio أو مسار إعدادات الصوت
summary: SenseAudio لتحويل الكلام إلى نص على دفعات للملاحظات الصوتية الواردة
title: SenseAudio
x-i18n:
    generated_at: "2026-04-25T13:57:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c39e195458af94f710eb31e46d588a2c61ffe1e3461a9156c9638adae9943f8
    source_path: providers/senseaudio.md
    workflow: 15
---

# SenseAudio

يمكن لـ SenseAudio نسخ مرفقات الصوت/الملاحظات الصوتية الواردة عبر
مسار `tools.media.audio` المشترك في OpenClaw. يرسل OpenClaw الصوت متعدد الأجزاء
إلى نقطة نهاية النسخ المتوافقة مع OpenAI ويحقن النص المعاد
باعتباره `{{Transcript}}` بالإضافة إلى كتلة `[Audio]`.

| التفاصيل        | القيمة                                            |
| ------------- | ------------------------------------------------ |
| الموقع       | [senseaudio.cn](https://senseaudio.cn)           |
| الوثائق          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| المصادقة          | `SENSEAUDIO_API_KEY`                             |
| النموذج الافتراضي | `senseaudio-asr-pro-1.5-260319`                  |
| عنوان URL الافتراضي   | `https://api.senseaudio.cn/v1`                   |

## البدء

<Steps>
  <Step title="عيّن مفتاح API الخاص بك">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="فعّل مزود الصوت">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="أرسل ملاحظة صوتية">
    أرسل رسالة صوتية عبر أي قناة متصلة. يرفع OpenClaw الصوت إلى SenseAudio
    ويستخدم النص المنسوخ في مسار الرد.
  </Step>
</Steps>

## الخيارات

| الخيار     | المسار                                  | الوصف                         |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | معرّف نموذج ASR في SenseAudio             |
| `language` | `tools.media.audio.models[].language` | تلميح لغة اختياري              |
| `prompt`   | `tools.media.audio.prompt`            | موجّه نسخ اختياري       |
| `baseUrl`  | `tools.media.audio.baseUrl` or model  | تجاوز الأساس المتوافق مع OpenAI |
| `headers`  | `tools.media.audio.request.headers`   | رؤوس طلب إضافية               |

<Note>
يدعم SenseAudio النسخ الدفعي STT فقط في OpenClaw. ويستمر النسخ الفوري
في Voice Call باستخدام المزودين الذين يدعمون STT المتدفق.
</Note>
