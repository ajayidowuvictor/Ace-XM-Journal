# Design

How ACE XM JOURNAL should look and feel. Tokens live in `src/ui/tokens.ts`; screens never hard-code colours or spacing.

## Aim

A calm, premium, private planner. It should feel like a well-made native app: quiet surfaces, one clear action at a time, gentle wording. It must never make a person feel behind.

## Choices

- **Colour.** Brand navy `#2D3684` is the only strong colour. The page is a cool, slightly blue-grey mist (`#F4F5FA`) with white cards, so the navy and the logo stand out. Green means "done". Red is kept for deleting things. Dark mode uses a deep blue-black with hairline borders instead of shadows. Every text pair is tested for contrast (see `tokens.test.ts`).
- **Type.** Inter (Regular, Medium, SemiBold, Bold), loaded at start-up. Large bold titles with slightly tight spacing; body text is 17 pt with generous line height. Inter is an open font; it is not Apple's own font, which is not licensed for other platforms.
- **Shape.** Buttons and fields 16 pt radius, cards 20, the main card 28. Three card kinds: raised (soft shadow), inset (quiet tinted panel) and hero (larger raised card).
- **Buttons.** Primary (filled navy), secondary (tinted), ghost (text) and danger (filled red). They squeeze slightly when pressed and give a light vibration. Ticking something complete gives a confirming buzz.
- **The memorable part.** The vertical time rail on the Today screen: blocks sit on a line, with a green "now" marker and the free time between blocks written out ("1 h 30 min free").
- **Wording.** Plain, active, kind. Older tasks are "From earlier", never "Overdue". Empty screens say what to do next.

## Not done yet

- Rich notes and a place for long texts and Bible verses (Phase 2).
- App lock and encrypted backup (Phase 3).
