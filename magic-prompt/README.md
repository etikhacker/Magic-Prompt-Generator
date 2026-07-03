# Magic Prompt — Türkcə Prompt Generator

Qısa istəyi (məs. "email yazmaq istəyirəm") optimizə edilmiş, yerli konteksə uyğun
bir promota çevirən sadə alət. **Pulsuz OpenRouter modelləri** ilə işləyir, ödənişli
Anthropic API açarına ehtiyac yoxdur.

## Struktur

```
magic-prompt/
├── index.html          ← ön interfeys (statik, Vercel avtomatik serve edir)
├── api/
│   └── generate.js     ← serverless function, OpenRouter-ə sorğu göndərir
├── package.json
├── vercel.json
└── .env.example
```

## 1. Lokal quraşdırma

```bash
cd magic-prompt
npm install -g vercel      # bir dəfə qurulur
```

## 2. OpenRouter API açarı al (PULSUZ)

1. https://openrouter.ai ünvanına get, e-poçtla qeydiyyatdan keç (kredit kartı **lazım deyil**)
2. Dashboard → **Keys** → **Create Key**
3. Açarı kopyala

## 3. .env faylı yarat

```bash
cp .env.example .env
```

`.env` faylını aç və `OPENROUTER_API_KEY` sahəsinə açarını yapışdır.

`OPENROUTER_MODEL` sahəsini olduğu kimi saxlaya bilərsən (`openrouter/free` — avtomatik
mövcud pulsuz modeldən istifadə edir), və ya konkret bir pulsuz model seçə bilərsən.
Pulsuz modellərin siyahısı tez-tez dəyişir, güncəl siyahı üçün:
https://openrouter.ai/models?max_price=0

> ⚠️ Qeyd: pulsuz modellərin sürəti/keyfiyyəti tarixə görə dəyişə bilər, adətən limit
> dəqiqədə ~20 sorğudur. Prototip və şəxsi istifadə üçün kifayət qədərdir.

## 4. Lokal test

```bash
vercel dev
```

Sonra brauzerdə `http://localhost:3000` aç, bir kateqoriya seç, istəyini yaz, "Prompt
Yarat" düyməsinə bas.

## 5. Vercel-ə deploy

```bash
vercel
```

Sual verdikdə default seçimləri qəbul et. Deploy bitdikdə env dəyişənini production-a
əlavə et:

```bash
vercel env add OPENROUTER_API_KEY
```

(Açarı yapışdır, "Production" mühitini seç.) Sonra:

```bash
vercel --prod
```

Bununla pulsuz, ictimai bir link alacaqsan (`https://magic-prompt-xxx.vercel.app`).

## 6. Kateqoriyaları genişləndirmək

`api/generate.js` faylındakı `CATEGORY_GUIDES` obyektinə yeni açar əlavə et, sonra
`index.html`-dəki `.categories` bölməsinə uyğun düymə əlavə et. Məsələn "iş elanı",
"sosial media postu", "CV" kimi yeni kateqoriyalar asanlıqla əlavə oluna bilər.

## 7. Gələcək üçün fikirlər

- Nəticələri Supabase-də saxlayıb istifadəçi tarixçəsi göstərmək
- Anonim istifadə limiti (məs. IP başına gündə 10 sorğu) əlavə etmək
- Pulsuz model limitinə çatanda avtomatik başqa pulsuz modelə keçid (fallback) əlavə etmək
- SaaS kimi satmaq istəsən: Stripe ilə ödənişli plan (limitsiz sorğu + GPT-4/Claude
  keyfiyyətində model seçimi) əlavə edə bilərsən
