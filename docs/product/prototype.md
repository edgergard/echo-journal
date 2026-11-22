---
project: echo-journal
canvas: "https://claude.ai/artifact/VaptyTGza1ZXvWNf2oiEu7"
variants: 3
chosen: a
design-updated: yes
status: approved
rounds: 1
date: "2026-11-22"
---

# Echo Journal — prototypes

## Варианты (Variants)
| Variant | Idea (what it changes) | Row on canvas |
|---|---|---|
| A | As designed: бумага, синие чернила, цитаты «Recalled» на полях | [A · journal](https://claude.ai/artifact/VaptyTGza1ZXvWNf2oiEu7#artboard-Main) |
| B | Цитаты — нумерованные сноски под ответом; крупнее шкала шрифтов | [B · journal](https://claude.ai/artifact/VaptyTGza1ZXvWNf2oiEu7#artboard-b-journal) |
| C | Зелёно-чёрные чернила (#2F5D50 / #8FC7B5); плотная раскладка | [C · journal](https://claude.ai/artifact/VaptyTGza1ZXvWNf2oiEu7#artboard-c-journal) |

**Кликабельный флоу:** [journal → entry → week](https://claude.ai/artifact/VaptyTGza1ZXvWNf2oiEu7#play-Main)

## Экраны (Screens)
| screen-id | Chosen artboard | Local reference |
|---|---|---|
| journal | [A · journal](https://claude.ai/artifact/VaptyTGza1ZXvWNf2oiEu7#artboard-Main) | docs/product/prototype/journal.dc.html |
| journal (dark) | [A · journal · dark](https://claude.ai/artifact/VaptyTGza1ZXvWNf2oiEu7#artboard-a-journal-dark) | docs/product/prototype/journal-dark.dc.html |
| entry | [A · entry](https://claude.ai/artifact/VaptyTGza1ZXvWNf2oiEu7#artboard-a-entry) | docs/product/prototype/entry.dc.html |
| week | [A · week](https://claude.ai/artifact/VaptyTGza1ZXvWNf2oiEu7#artboard-a-week) | docs/product/prototype/week.dc.html |

## Выбор (Choice)
Вариант A без изменений — цитаты на полях остаются главной запоминающейся деталью, палитра и шрифты как в design.md.

## Изменения в design.md (Changes)
- applied: строка Direction «Prototype: variant A chosen (see prototype.md)»
- none otherwise: variant A unchanged

## Следующий шаг (Next)
`/product-build` — собирает приложение по design.md; агенты стримов берут docs/product/prototype/ как визуальный образец своих экранов.
