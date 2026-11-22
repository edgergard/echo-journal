---
project: echo-journal
title: "Echo Journal"
pitch: "A web journal whose AI companion replies to each entry with memory of your past entries and sums up your week's mood and themes."
platform: web
stack: nextjs
data: managed-backend
accounts: required
payments: none
monetization: free
price: "free"
verdict: go
check: parallel
status: approved
rounds: 1
started: "2026-11-22"
date: "2026-11-22"
---

# Echo Journal

## Питч и пользователь (Pitch)
Веб-дневник, где AI-компаньон отвечает на каждую запись с учётом прошлых (память через RAG по своим же записям) и раз в неделю подводит итог настроения и тем. Для людей, которые ведут дневник и хотят видеть закономерности, а не просто архив; сейчас они пишут в заметки или платят за мобильные AI-дневники. Главный «пользователь» проекта — рекрутер и интервьюер: живое демо и открытый код.

## Цель и ограничения (Goal)
Портфолио под веб-вакансии (AI-продукт, React / Next.js, студия с Claude Code): публичный репо + живое демо. ~20 ч/нед, первая версия за ~2 недели. Интерфейс на английском, AI отвечает на языке записи. Чувствительные данные (настроение, mental health): не медицинский продукт — дисклеймер и кризисная карточка вместо AI-ответа.

## Рынок (Market)
| App | Price | Platforms | Strength | Common complaint | Source |
|---|---|---|---|---|---|
| Rosebud | $12.99/мес или $107.99/год; бесплатный план убран | iOS, Android, web | Долгая память по записям, видит паттерны | Платная стена: долгой памяти нет на базовом тарифе | [mylifenote review](https://blog.mylifenote.ai/rosebud-review/), checked 2026-11-22 (обзор конкурента) |
| Mindsera | $9.99–22.99/мес (по источникам расходится) | iOS, web | Письмо, голос и «звонок» дневнику | Цена непрозрачна, разная по регионам | [mindsera.com 2026 roundup](https://mindsera.com/articles/the-7-best-ai-journaling-apps-in-2026-tested), checked 2026-11-22 |
| Reflection | Free + in-app purchases | iOS, web | Guided journaling, AI-коуч, 4.7★ (939 оценок) | Жалоб на цену в выдаче не найдено | [App Store](https://apps.apple.com/app/id1504547616), checked 2026-11-22 |

**Наше отличие:** не конкурент на рынке, а открытый проект: механизм памяти виден пользователю — под каждым ответом «Recalled:» с цитатами прошлых записей, на которые опирался RAG; код и схема RAG — в публичном репо.

## Бизнес-модель (Business model)
- **Модель:** free — цель портфолио; альтернативная модель, комиссии, napkin math и stop criteria пропущены.
- **Цена:** free.
- **Комиссии:** нет (нет платежей).
- **Расходы:** Vercel Hobby — $0; Supabase free tier (auth, Postgres, pgvector) — $0; OpenRouter — несколько $/мес на дешёвой модели (*assumption*), ограничено лимитом расходов на ключе и дневным лимитом запросов на пользователя; домен — не нужен (vercel.app).
- **Napkin math:** skipped: goal is portfolio. Реалистично solo: да, если RAG-спайк подтвердит, что эмбеддинги + pgvector укладываются в ~1 день.

## MVP-объём (MVP scope)
### Must
1. Аккаунты и демо — регистрация/вход (email или OAuth) и кнопка «Try demo»: done when демо-вход за один клик открывает дневник с 20 заготовленными записями, а свой аккаунт видит только свои записи.
2. Записи — создание, правка, удаление, тег настроения, формы на React Hook Form + Zod: done when CRUD сохраняется, невалидная форма показывает ошибки, есть unit/component-тесты.
3. AI-ответ со streaming — Vercel AI SDK + OpenRouter в Route Handler (Node runtime): done when ответ на запись печатается потоком и сохраняется рядом с записью.
4. Память (RAG) — эмбеддинг при сохранении, векторный поиск top-k похожих записей в промпт, блок «Recalled:»: done when на демо-данных ответ ссылается минимум на одну релевантную прошлую запись, и цитата ведёт на неё.
5. Недельная сводка — настроение и темы за 7 дней: done when страница показывает график настроения и AI-сводку тем по записям недели.
6. Защиты — дисклеймер «не терапия», кризисные слова → карточка горячей линии вместо AI-ответа, дневной лимит AI-запросов на пользователя: done when все три поведения покрыты тестами.
7. Качество и подача — Vitest + React Testing Library, Playwright e2e (демо-вход → запись → AI-ответ с моком) в GitHub Actions CI, Lighthouse accessibility ≥ 90, Tailwind, README «Built with Claude Code» со схемой RAG и GIF: done when CI зелёный на main, демо на Vercel, README опубликован.

### Later
- Голосовые записи
- Экспорт записей
- Напоминания писать
- Украинский интерфейс (i18n)
- Storybook для UI-примитивов

### Never
- Монетизация и платежи
- Нативное мобильное приложение
- Терапевтические или медицинские обещания

**Stack:** nextjs · **Data:** managed backend — Supabase (Postgres + pgvector + auth); эмбеддинги и векторный поиск — новая часть, провайдер эмбеддингов выбирается на дизайне (*assumption*: OpenRouter или OpenAI embeddings) · **Accounts / payments:** accounts required (плюс демо-аккаунт), payments none · **Build size:** foundation + 2 waves, ~4 streams, ~2 недели при ~20 ч/нед

## Риски (Risks)
1. RAG и эмбеддинги — новое для тебя, могут съесть срок — главный технический риск 2-недельного плана.
2. Расходы и злоупотребления публичным демо (AI-запросы) — открытое демо без лимитов может сжечь ключ.
3. Чувствительная тема mental health — неудачный AI-ответ на тяжёлую запись испортит впечатление; нужны дисклеймер и кризисный сценарий.

**Самая дешёвая проверка риска №1:** 2-часовой спайк параллельно с дизайном — скрипт: эмбеддинг 20 записей → pgvector в Supabase → поиск 3 похожих по новой записи. Укладывается в ~2 часа и выдаёт осмысленные совпадения → план без изменений; нет → RAG упростить (поиск по тегам настроения и ключевым словам) и перенести векторы в Later.

## Вердикт (Verdict)
Go. Проект закрывает самые частые пробелы из вакансий — свои тесты, публичный код, AI-фичи (AI SDK, OpenRouter, RAG) и серверный код в Next.js — и укладывается в шаблон `template-nextjs-pet` с бесплатными тарифами.

## Следующий шаг (Next)
`/product-design` (экраны, флоу, внешний вид → docs/product/design.md), затем `/product-build` — на Gate A выбрать **публичный** репо. Параллельно — RAG-спайк; результат записать через `/product-idea` (revise → `check: done`).

*Planning aid, not legal or medical advice.*
