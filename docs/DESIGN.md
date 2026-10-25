# Design

How Ace Notes should look and feel. Tokens live in `src/ui/tokens.ts`; screens never hard-code colours or spacing.

## Aim

A calm, premium, private planner. It should feel like a well-made native app: quiet surfaces, one clear action at a time, gentle wording. It must never make a person feel behind.

## Choices

- **Colour.** Brand navy `#2D3684` is the only strong colour. The page is Apple's soft light grey (`#F5F5F7`) with flat white tiles; dark mode is true black with lifted charcoal tiles (`#1C1C1E`), so the logo and navy stand out. Green means "done". Red is kept for deleting things. Cards have no shadows or borders: the tile against the page does the work. Every text pair is tested for contrast (see `tokens.test.ts`).
- **Type.** Inter (Regular, Medium, SemiBold, Bold), loaded at start-up. Big semibold titles (40 pt on the Home greeting) with tight letter spacing, as on apple.com; body text is 17 pt with generous line height. Inter is an open font; it is not Apple's own font, which is not licensed for other platforms.
- **Shape.** Buttons are pills; text fields and the segmented control 16 pt radius, cards 24, the main card 32. Screens use 24 pt side margins and more space between blocks. Three card kinds: raised (flat tile), inset (quiet tinted panel) and hero (larger tile).
- **Buttons.** Primary (filled navy), secondary (tinted), ghost (text) and danger (filled red). They squeeze slightly when pressed and give a light vibration. Ticking something complete gives a confirming buzz.
- **The memorable part.** The vertical time rail on the Today screen: blocks sit on a line, with a green "now" marker and the free time between blocks written out ("1 h 30 min free").
- **Wording.** Plain, active, kind. Older tasks are "From earlier", never "Overdue". Empty screens say what to do next.

## Not done yet

- Rich notes and a place for long texts and Bible verses (Phase 2).
- App lock and encrypted backup (Phase 3).
