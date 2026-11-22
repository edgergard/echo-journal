---
project: echo-journal
stack: nextjs
theme: system
ui-language: en
screens: 7
status: approved
rounds: 1
date: "2026-11-22"
---

# Echo Journal — design

## Направление (Direction)
- **Настроение:** calm, warm, literary — дневник на тёплой бумаге, написанный сине-чёрными чернилами. Отличие от шаблонного «крем + терракота»: акцент — синие чернила перьевой ручки, а главный запоминающийся элемент один — цитаты «Recalled» стоят **на полях** рядом с ответом AI, как заметки карандашом, и ведут на прошлые записи.
- **Шрифты:** Literata (засечки, для текста записей, заголовков и ответа AI — читается как книга) + Geist из шаблона для интерфейса. Literata подключается через `next/font/google` в `src/app/layout.tsx` как переменная `--font-literata`; в `globals.css` `--font-heading: var(--font-literata)` и утилита `font-serif` для тела записи. Тело записи — 18px, межстрочный 1.7, ширина колонки ≤ 68ch.
- **Изображения и иконки:** без фото и иллюстраций; lucide-иконки тонкой линией; настроение — слово + маленький символ (не только цвет).
- **Тон текста:** дружеский, тёплый, без пафоса — «What's on your mind today?».
- **Prototype:** variant A chosen (see prototype.md)
- **Вне скоупа:** голосовые записи, экспорт, напоминания, украинский интерфейс, Storybook (Later); монетизация, мобильное приложение, терапевтические обещания (Never).

## Навигация (Navigation)
~~~text
public: / (landing) | /sign-in
app header (auth): /journal | /week | /settings   + button "New entry" → /journal/new
  stack: /journal/[id]
route handler: /auth/callback (not a screen)
~~~
**Авторизация:** всё под `/journal`, `/week`, `/settings` требует сессию (проверка в `src/proxy.ts` через `@supabase/ssr` + повторная проверка на сервере); без сессии → `/sign-in?next=<path>`. Залогиненный на `/` или `/sign-in` → `/journal`. Paywall нет.
**Маршруты шаблона:** `src/app/page.tsx` — заменить на landing; `src/app/readme/route.ts` — удалить; `not-found.tsx`, `error.tsx`, `global-error.tsx`, `loading.tsx` — оставить (в стиле палитры).

## Маршруты (Routes)
| screen-id | Route file | Type | Tab label / icon | Must feature | Auth required |
|---|---|---|---|---|---|
| landing | src/app/page.tsx | page | — | #1 Accounts and demo | no |
| sign-in | src/app/sign-in/page.tsx | page | — | #1 Accounts and demo | no |
| journal | src/app/journal/page.tsx | page | Journal / lucide: book-open | #2 Entries | yes |
| new-entry | src/app/journal/new/page.tsx | page | — (header button "New entry", lucide: pen-line) | #2 Entries, #6 Guards | yes |
| entry | src/app/journal/[id]/page.tsx | page | — | #2, #3 AI reply, #4 Memory, #6 Guards | yes |
| week | src/app/week/page.tsx | page | Week / lucide: calendar-range | #5 Weekly summary | yes |
| settings | src/app/settings/page.tsx | page | Settings / lucide: settings | #1, #6 Guards | yes |

Не экраны: `src/app/auth/callback/route.ts` (обмен кода Supabase на сессию), `src/app/api/reflect/route.ts` (streaming AI-ответа, `runtime = "nodejs"`), `src/app/api/week/route.ts` (AI-сводка недели).

## Флоу (Flows)
### demo — Первый визит через демо
1. landing: «Try the demo» → вход в общий демо-аккаунт с заготовленными записями (демо-данные сбрасываются раз в сутки — *assumption*)
2. journal: 20 записей за ~3 недели → открыть верхнюю
3. entry: готовый ответ Echo + 2–3 цитаты «Recalled» на полях → клик по цитате
4. entry (старая запись) → header «Week»
5. week: график настроения + темы недели
**Первая ценность:** шаг 3, < 10 секунд от лендинга · **Риск ухода:** лендинг без понятной кнопки — «Try the demo» первичная, регистрация вторичная.

### loop — Основной цикл
1. journal: «New entry»
2. new-entry: пишет, выбирает настроение → «Save entry»
3. entry: запись сохранена (role=status «Entry saved»), ответ Echo печатается потоком, после него появляются цитаты на полях
4. entry: клик по цитате → прошлая запись
**Первая ценность:** шаг 3 · **Риск ухода:** долгий ответ — сначала мгновенно видна сохранённая запись, затем поток; ошибка AI не теряет запись.

### guards — Кризис и лимит
1. new-entry: текст с кризисными словами → «Save entry»
2. entry: вместо ответа — CrisisCard (горячая линия, «Echo isn't a therapist»), запись сохранена
3. Лимит исчерпан: entry сохраняется, в зоне ответа — «You've used today's 10 replies. Echo will be back tomorrow.» (10 — *assumption*)
**Первая ценность:** — · **Риск ухода:** резкий тон — карточка спокойная, без красного.

### signup — Своя регистрация
1. landing: «Sign in» → sign-in: email (magic link) или GitHub
2. auth/callback → journal: пустое состояние
3. journal: «Write your first entry» → new-entry → entry (без цитат: «Echo starts recalling after a few entries.»)
**Первая ценность:** шаг 3 · **Риск ухода:** ожидание письма — экран «Check your inbox» с адресом и «Use a different email».

## Экраны (Screens)
### landing — Echo Journal
- **Назначение:** объяснить за 5 секунд и пустить в демо (Must #1)
- **Элементы:** логотип-слово «Echo» (Literata) · заголовок · подзаголовок · превью: фрагмент записи и ответ с одной цитатой на полях (статичная разметка, тот же компонент RecalledNote) · кнопки · строка «Not a therapist. Not medical advice.» · ссылка на GitHub-репо
- **Главное действие:** «Try the demo» · **Второстепенное:** «Sign in», ссылка на исходники
- **Состояния:** content; loading: кнопка демо в состоянии загрузки (disabled + spinner, aria-busy); error: «Couldn't open the demo. Try again in a moment.» под кнопкой (role=alert); empty — неприменимо
- **Текст** (en): title «A journal that remembers.», subtitle «Write a few lines. Echo replies — and points back to the days you've already written about.», button «Try the demo», secondary «Sign in»
- **Доступность:** один h1; превью помечено `aria-label="Example entry and reply"`.

### sign-in — Sign in
- **Назначение:** вход/регистрация (Must #1)
- **Элементы:** заголовок · поле email · «Email me a link» · разделитель «or» · «Continue with GitHub» · ссылка «Try the demo instead»
- **Главное действие:** «Email me a link» · **Второстепенное:** GitHub, демо
- **Состояния:** content; loading: кнопка disabled + «Sending…»; sent: «Check your inbox — we sent a link to {email}.» + «Use a different email»; error: невалидный email — ошибка у поля (Zod), ошибка сервиса — «Couldn't send the link. Check the address and try again.»; empty — неприменимо
- **Текст** (en): title «Sign in to Echo», button «Email me a link»
- **Доступность:** label у поля, ошибка связана `aria-describedby`, результат отправки — role=status.

### journal — Journal
- **Назначение:** лента записей (Must #2)
- **Элементы:** header · h1 «Journal» · кнопка «New entry» · список EntryCard по датам (дата, настроение, первые 2 строки, отметка «Echo replied») · пагинация «Show older entries»
- **Главное действие:** «New entry» · **Второстепенное:** открыть запись, «Show older entries»
- **Состояния:** content; empty: «Your journal is empty. What's on your mind today?» + «Write your first entry»; loading: 5 скелетонов карточек (`loading.tsx`); error: «Couldn't load your entries.» + «Try again» (`error.tsx`)
- **Текст** (en): title «Journal», empty «Your journal is empty. What's on your mind today?», button «New entry»
- **Доступность:** список `<ol>`, каждая карточка — одна ссылка с понятным именем «{date}, {mood}: {first line}».

### new-entry — New entry
- **Назначение:** написать запись (Must #2, #6)
- **Элементы:** h1 с сегодняшней датой · большое поле текста (Literata, без рамки-коробки, линия снизу) · MoodPicker (5 вариантов: rough, low, okay, good, great) · подпись «Echo replies after you save. Not a therapist.» · кнопки
- **Главное действие:** «Save entry» · **Второстепенное:** «Cancel» (назад в journal; при несохранённом тексте — подтверждение)
- **Состояния:** content; validation error: пустой текст или > 5000 символов, не выбрано настроение — ошибки у полей (RHF + Zod); saving: кнопка disabled + «Saving…»; error: «Couldn't save your entry. Your text is still here — try again.»; empty — это исходное состояние (placeholder «What's on your mind today?»)
- **Текст** (en): title «{Weekday, Month D}», placeholder «What's on your mind today?», button «Save entry»
- **Доступность:** textarea с видимым label (визуально — дата, `aria-label="Entry text"`), MoodPicker — радиогруппа с подписями, счётчик символов `aria-live="polite"` только у лимита.

### entry — Entry
- **Назначение:** запись + ответ Echo с памятью; правка и удаление (Must #2, #3, #4, #6)
- **Элементы:** «← Journal» · дата и настроение · текст записи (Literata) · меню «Edit» / «Delete» · ReflectionPanel «Echo» с ответом · справа на полях (на мобильном — под ответом) RecalledNote ×1–3: дата + короткая цитата + ссылка · при правке — EntryEditor на месте текста, «Save changes» / «Cancel»
- **Главное действие:** читать ответ; при ответе с ошибкой — «Try again» · **Второстепенное:** Edit, Delete (DeleteEntryDialog), перейти по цитате, «Regenerate reply» после правки
- **Состояния:** content: ответ + цитаты; streaming: текст ответа печатается, цитаты появляются после завершения, `aria-busy`; no memory: ответ без цитат + «Echo starts recalling after a few entries.»; crisis: CrisisCard вместо ответа; limit: «You've used today's 10 replies. Echo will be back tomorrow.»; error: «Echo couldn't reply right now. Your entry is saved.» + «Try again»; loading страницы: скелетон; not found: стандартный `not-found` «This entry doesn't exist or was deleted.»
- **Текст** (en): title — дата записи, reply heading «Echo», recalled label «Recalled from {Mon D}», delete «Delete entry?» / «This removes the entry and Echo's reply. You can't undo this.» / «Delete entry»
- **Доступность:** ответ — регион `aria-live="polite"` только для статуса («Echo is replying…» / «Reply ready»), а не для каждого токена; цитаты — `<aside aria-label="Recalled entries">`; меню — кнопка с `aria-label="Entry actions"`; после удаления — переход в journal и role=status «Entry deleted».

### week — This week
- **Назначение:** итог недели (Must #5)
- **Элементы:** h1 «This week» + диапазон дат · переключатель «← Previous week» / «Next week →» · MoodChart (линия настроения по дням) + текстовая альтернатива · AI-сводка «Themes» (3–5 тем с короткой фразой и ссылками на записи) · «Refresh summary»
- **Главное действие:** читать сводку · **Второстепенное:** соседние недели, «Refresh summary»
- **Состояния:** content; empty: < 2 записей за неделю — «Write at least two entries this week to see a summary.» + «New entry»; loading: скелетон графика + «Echo is reading your week…»; error: «Couldn't build this week's summary.» + «Try again»; limit: сводка считается в общий дневной лимит — тот же текст лимита
- **Текст** (en): title «This week», empty «Write at least two entries this week to see a summary.», button «Refresh summary»
- **Доступность:** график с `role="img"` и `aria-label` («Mood this week: Mon okay, Tue low…») + видимая таблица по кнопке «Show as table»; настроение не только цветом.

### settings — Settings
- **Назначение:** аккаунт, лимит, правила (Must #1, #6)
- **Элементы:** h1 · аккаунт (email или «Demo account») · «Replies left today: {n} of 10» · блок «About Echo»: дисклеймер и горячая линия · «Sign out» · «Delete account» (не для демо) · в демо — «Reset demo data»
- **Главное действие:** «Sign out» · **Второстепенное:** «Delete account» (alert-dialog с подтверждением), «Reset demo data»
- **Состояния:** content; loading: скелетон; error: «Couldn't load your settings.» + «Try again»; deleting: кнопка disabled + «Deleting…»; empty — неприменимо
- **Текст** (en): title «Settings», delete «Delete your account?» / «All entries and replies will be removed. You can't undo this.» / «Delete account»
- **Доступность:** опасные действия — с подтверждением и понятным именем кнопки; результат — role=status.

## Токены (Tokens)
### Colors
| Token | Light | Dark | Use |
|---|---|---|---|
| --background | #F5F1E8 | #16181F | бумага / стол под лампой |
| --foreground | #1F2430 | #ECE6D8 | текст — сине-чёрные чернила |
| --card | #FBF8F2 | #1E212A | лист записи, ответ |
| --card-foreground | #1F2430 | #ECE6D8 | текст на листе |
| --popover | #FBF8F2 | #1E212A | меню, диалоги |
| --popover-foreground | #1F2430 | #ECE6D8 | |
| --primary | #2A4A7F | #9DB7E8 | синие чернила: кнопки, ссылки, линия цитат |
| --primary-foreground | #FBF8F2 | #16181F | текст на кнопке |
| --secondary | #E9E3D6 | #2A2E39 | вторичные кнопки |
| --secondary-foreground | #1F2430 | #ECE6D8 | |
| --muted | #ECE6DA | #2A2E39 | скелетоны, фон цитат |
| --muted-foreground | #5A5D6B | #A9A79F | даты, подписи |
| --accent | #E9E3D6 | #2A2E39 | hover/selected (нейтральный) |
| --accent-foreground | #1F2430 | #ECE6D8 | |
| --destructive | #B3261E | #F2827A | удаление |
| --border | #D9D1C1 | #343846 | разделители |
| --input | #8A8272 | #6B6F7E | граница полей |
| --ring | #2A4A7F | #9DB7E8 | фокус |

sidebar: template · chart: `--chart-1` = #2A4A7F / #9DB7E8 (линия настроения), `--chart-2..5` — template.

### Contrast (WCAG AA)
| Pair | Light | Dark | Pass |
|---|---|---|---|
| --foreground / --background | 13.77:1 | 14.25:1 | yes |
| --card-foreground / --card | 14.64:1 | 12.92:1 | yes |
| --popover-foreground / --popover | 14.64:1 | 12.92:1 | yes |
| --muted-foreground / --background | 5.80:1 | 7.36:1 | yes |
| --muted-foreground / --muted | 5.26:1 | 5.63:1 | yes |
| --muted-foreground / --card | 6.17:1 | 6.67:1 | yes |
| --primary-foreground / --primary | 8.31:1 | 8.76:1 | yes |
| --secondary-foreground / --secondary | 12.14:1 | 10.90:1 | yes |
| --destructive / --background | 5.80:1 | 6.96:1 | yes |
| --ring / --background | 7.81:1 | 8.76:1 | yes |
| --input / --background (UI boundary) | 3.38:1 | 3.55:1 | yes |
| --primary / --background (links) | 7.81:1 | 8.76:1 | yes |
| --primary / --card (links) | 8.31:1 | 7.94:1 | yes |

### Scales
`--radius: 0.375rem` (template 0.625rem) — бумажные листы с почти прямыми углами.

### Theme wiring
`system`: в `src/app/globals.css` заменить `@custom-variant dark (&:is(.dark *));` на `@custom-variant dark (@media (prefers-color-scheme: dark));` и перенести тёмные значения из `.dark { … }` в `@media (prefers-color-scheme: dark) { :root { … } }`. Цвета можно писать hex. Шрифт: добавить Literata в `src/app/layout.tsx` (`variable: "--font-literata"`), `--font-heading: var(--font-literata)` в `@theme inline` и `--font-serif: var(--font-literata)`.

## Компоненты (Components)
| Component | Screens | Variants / states | Base |
|---|---|---|---|
| AppHeader | journal, new-entry, entry, week, settings | current page (`aria-current`), mobile menu | new |
| EntryCard | journal | default, hover, focus, «Echo replied» mark | new |
| EntryEditor | new-entry, entry (edit) | idle, invalid, saving, error | shadcn add textarea label; packages react-hook-form @hookform/resolvers |
| MoodPicker | new-entry, entry (edit) | 5 moods, selected, invalid | shadcn add toggle-group |
| ReflectionPanel | entry | streaming, done, no-memory, crisis, limit, error | new; packages ai @ai-sdk/react @openrouter/ai-sdk-provider |
| RecalledNote | entry, landing (static preview) | margin (≥ lg), inline (mobile), focus | new |
| CrisisCard | entry | default | shadcn add alert |
| MoodChart | week | content, empty, table view | shadcn add chart |
| DeleteEntryDialog / DeleteAccountDialog | entry, settings | open, deleting | shadcn add alert-dialog |
| AuthForm | sign-in | idle, sending, sent, error | shadcn add input; packages @supabase/supabase-js @supabase/ssr |

Также в фундаменте: `shadcn add skeleton dropdown-menu`.

## Доступность (Accessibility)
- Контраст посчитан выше (AA в обеих темах), фокус — видимый `--ring`, у ссылок — правило шаблона.
- Один h1 на странице, landmarks `header` / `main` / `nav`; иконки-кнопки с `aria-label`.
- Настроение — всегда слово, не только цвет; график с текстовой альтернативой.
- Асинхронные результаты (сохранено, удалено, ответ готов) — `role="status"`, без переноса фокуса; streaming не объявляется по токенам.
- `prefers-reduced-motion`: без анимации появления цитат.

## Следующий шаг (Next)
`/product-prototype` — 2–3 визуальных варианта ключевых экранов (по желанию); затем `/product-build` — собирает Must-фичи по этому дизайну (на Gate A — **публичный** репо).
