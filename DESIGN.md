---
name: Unbeholden Check
description: How much of a website is rented, and what open source could replace each rented piece.
colors:
  ground: "#fafaf8"
  ink: "#17181b"
  muted: "#5d5e63"
  faint: "#b9b9bd"
  rule: "rgba(23, 24, 27, 0.1)"
  field: "#ffffff"
  field-stroke: "rgba(23, 24, 27, 0.22)"
  rented-magenta: "#c2307f"
  open-cyan: "#0a85a8"
  open-cyan-text: "#077590"
typography:
  display:
    fontFamily: "Barlow Condensed, Archivo, sans-serif"
    fontSize: "clamp(32px, 4vw, 46px)"
    fontWeight: 600
    lineHeight: 1
  lane-number:
    fontFamily: "Barlow Condensed, Archivo, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1
  score:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.45
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "\"tnum\""
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  evidence:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  none: "0"
  control: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "24px"
  xl: "40px"
  lane-indent: "64px"
  gutter: "clamp(16px, 4vw, 56px)"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "36px"
  button-primary-disabled:
    backgroundColor: "{colors.faint}"
    textColor: "{colors.ground}"
  input-field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  lane-row:
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    height: "51px"
  alternative-name:
    textColor: "{colors.open-cyan-text}"
  details-block:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.none}"
    padding: "14px 20px"
---

# Design System: Unbeholden Check

## Overview

**Creative North Star: "The Normalling Schedule"**

A result reads like a jackfield schedule in a studio patch bay: numbered lanes, one per service, each showing whether its link to an open source "normal" is intact or broken. The page is a quiet, printed-feeling ledger on a near-white ground with hairline rules. Two signal colours carry the whole verdict, and everything else is ink and grey.

Density is high but calm. One sentence states the finding, a score sits beside it, and each service gets exactly one line. Evidence, licence, stars and release wait behind Details. The visitor gets the point from the lane line alone; the evidence is there to verify, never required.

Rejected by the user, and not to return: red/green pass-fail, dark or backlit themes, loud colour fields, colour used without a meaning, and information overload.

**Key Characteristics:**
- Light ground, ink text, hairline rules; no fills, no cards, no shadows.
- Two signal colours, one meaning each: magenta is rented, cyan is open source.
- The link glyph is the signature: broken, open-ended or whole.
- Condensed display face for the headline and lane numbers only.
- Mono only for evidence strings.
- Self-hosted fonts; zero third-party requests.

## Colors

A neutral ink-on-paper palette with two signal hues that each mean exactly one thing.

### Primary
- **Rented Magenta** (rented-magenta): the rented side of the verdict. Fills the source dot and strokes the broken left half of the link glyph; colours the rented count in the counts line. Never used for anything that is not rented.

### Secondary
- **Open Cyan** (open-cyan): the open source side. Strokes the intact right half of the broken glyph and the whole of the owned glyph. Glyph strokes only, never text: it misses 4.5:1 on the ground.
- **Open Cyan Text** (open-cyan-text): the same meaning set as text. Alternative names in lane rows and the alternative names in the Details table.

### Neutral
- **Paper Ground** (ground): page background, and the text colour on ink buttons.
- **Ink** (ink): headline, service names, emphasised numbers, primary buttons.
- **Muted Graphite** (muted): secondary text: scan time, "rented from", lane numbers at rest, notes, table metadata, the Details toggle.
- **Faint Grey** (faint): link underlines at rest, the dashed "no option yet" half of the link glyph, disabled buttons.
- **Hairline** (rule): every divider: lane bottoms, the top bar, the key line, the Details block border, section and footer tops.
- **Field White** (field) and **Field Stroke** (field-stroke): text inputs only.

### Named Rules
**The One Meaning Rule.** Magenta means rented. Cyan means open source. A signal colour never decorates, never marks state, never appears on anything without that meaning. If a new element is neither rented nor open source, it is ink or grey.

**The Logo Exception.** Open source options carry their own project logo, in full colour, at 20px before the name. The logo is the project's mark, not a signal colour. Logos are self-hosted PNGs in `src/icons/`, named after the option; an option without a file shows its name alone.

**The Stroke and Text Split Rule.** Open Cyan (#0A85A8) is for glyph strokes; any cyan text uses Open Cyan Text (#077590) for contrast.

**The No Pass-Fail Rule.** No red, no green, no traffic lights. The verdict is carried by the link glyph and the two signal hues, not by a grade colour.

## Typography

**Display Font:** Barlow Condensed (with Archivo, sans-serif)
**Body Font:** Archivo (with system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, monospace)

**Character:** A tall condensed face numbers the lanes and states the finding, like stencilled patch-bay labels; a sturdy grotesque does all the reading. Tabular numerals throughout so counts and scores align.

All three families are self-hosted through Fontsource packages. Archivo ships at 400, 500 and 600; Barlow Condensed at 600 and 700; JetBrains Mono at 400.

### Hierarchy
- **Display** (Barlow Condensed 600, clamp(32px, 4vw, 46px), line-height 1, balanced wrap): the one-sentence headline. Once per page.
- **Lane number** (Barlow Condensed 700, 26px, 22px under 900px): two-digit lane numbers, muted at rest, ink when the lane is open.
- **Score** (Archivo 600, 44px, -0.01em): the ownership score, with "/ 100 owned" at 20px 500 in muted.
- **Title** (Archivo 600, 16px): service names in lane rows.
- **Body** (Archivo 400, 16px, line-height 1.45): counts line, alternative names (500), form labels (500).
- **Label** (Archivo 400, 14px): "rented from", toggles, notes, table metadata, Details section headings (500, muted, sentence case). Consent text capped at 65ch.
- **Evidence** (JetBrains Mono 400, 14px, line-height 1.6): DNS records, headers and HTML snippets.

### Named Rules
**The Evidence-Only Mono Rule.** Mono is for evidence strings and nothing else: never for labels, numbers, domains in headings or decoration.

**The Two-Place Condensed Rule.** Barlow Condensed appears in the headline and lane numbers only. Everything else is Archivo.

## Layout

Full-width with a fluid side gutter (clamp(16px, 4vw, 56px)); no centred max-width container. A slim top bar (min 52px) holds name, scan time and the domain search, pushed right. The summary row puts the headline and counts left, score right, aligned to the baseline.

Lanes are a fixed column grid: number (64px), service (up to 230px), company (up to 250px), link glyph (112px), alternatives (fill, one line, ellipsis), toggle (84px). Rows are 51px. Open Details content indents 64px to align with the service column. Vertical rhythm steps 4, 8, 12, 24, 40px.

Under 900px each lane stacks: number, service and toggle on the first line; company, glyph and alternatives below, indented 44px. Details lose their indent, tables become wrapping rows, the summary stacks with the score left-aligned, and the search takes the full width.

## Elevation & Depth

Flat. No shadows, no glow, no tonal layers. Depth is only structural: hairline rules separate lanes, and an open Details block is bounded by a hairline border on the same ground.

### Named Rules
**The Hairline Only Rule.** Separation is a 1px hairline (rgba(23, 24, 27, 0.1)). No fills, no cards, no shadows, no tinted panels.

## Shapes

Square by default. The only radius is 4px on form controls; an input and its button join into one unit (input rounded on the left, button on the right). Standalone buttons take 4px all round. Blocks, rows and Details are square-cornered.

## Components

### Buttons
- **Shape:** gently squared (4px), joined to an input when paired.
- **Primary:** ink fill, paper text, Archivo 500, 36px tall, 18px side padding.
- **Disabled:** faint grey fill, not-allowed cursor, with a muted note beside it saying when it opens.
- **Focus:** 2px solid ink outline, 2px offset. Selection is a 14% ink tint. Neither uses a signal colour.

### Inputs / Fields
- **Style:** white field, 1px field stroke, 36px tall, 12px side padding, left corners 4px when joined to a button.
- **Focus:** same 2px outline as buttons.

### Navigation
- **Top bar:** name in Archivo 600 without underline, scan time in label size and muted, search form right. Hairline below.
- **Links:** inherit colour, underline offset 3px in faint grey, underline turns to the text colour on hover.

### Lane Row (signature)
One `details` element per service, hairline below. Summary line: muted lane number, service name, "rented from **Company**" in label size, the 90x20 link glyph, alternatives in Open Cyan Text 500, and a "Details" / "Hide" toggle with a small CSS chevron that darkens on hover. Owned lanes and lanes without an option show their right-hand text muted at label size. The not-scored group is a final lane with no number and no glyph, opening to a two-column list.

### Link Glyph (signature)
Inline SVG symbols, 90x20, stroke 2, round caps.
- **Broken:** magenta dot and segment ending in a bar, a gap, then a cyan segment ending in an open cyan ring. Rented, with open source options.
- **Open-ended:** the magenta half, then a dashed faint-grey half with no ring. Rented, no option listed yet.
- **Whole:** one unbroken cyan line from dot to ring. Owned.
A key line above the lanes explains each glyph in use, in plain words.

### Details Block
A hairline-bounded block on the ground (no fill), 14px 20px padding, indented to the service column. Two columns: Evidence (mono list plus "category, weight N") and Open source options (a borderless table: name in Open Cyan Text 500 linked, then licence, stars, release, and Managed / article links in muted label size).

## Do's and Don'ts

### Do:
- **Do** give every rented service its own numbered lane with its alternatives named on the same line.
- **Do** use magenta only for rented and cyan only for open source.
- **Do** set cyan text in #077590 and keep #0A85A8 for glyph strokes.
- **Do** separate with 1px hairlines and keep everything on the paper ground.
- **Do** keep mono for evidence strings only.
- **Do** self-host every font and asset; the page makes zero third-party requests.
- **Do** write copy in plain American English, without em-dashes.

### Don't:
- **Don't** use red/green or any pass-fail colouring.
- **Don't** use dark or backlit themes, glow, or loud colour fields.
- **Don't** introduce a colour that has no meaning, or reuse a signal colour for a second meaning.
- **Don't** use fills, cards, tiles or shadows; an open Details is a hairline-bounded block.
- **Don't** put more than one line per lane at rest; evidence and metadata live behind Details.
- **Don't** load fonts, scripts or images from a third party.
