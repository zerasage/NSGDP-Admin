# NSGDP Admin UI Design Guide

## Purpose

This guide defines the visual structure for the NSGDP admin console. It is inspired by the strongest density and consistency patterns in the TalentNG admin, then adapted to NSGDP's existing components and information-heavy government workflows.

This guide deliberately does **not** define colors. Continue to use NSGDP's existing semantic tokens (`background`, `foreground`, `card`, `muted`, `border`, `primary`, `destructive`, and status tokens). Do not copy TalentNG hex values or add page-specific colors.

The target character is:

- compact without feeling crowded;
- border-led rather than shadow-led;
- consistent across dashboards, tables, forms, and review workflows;
- optimized for repeated administrative work;
- responsive without hiding essential actions.

## 1. Core rules

1. Use existing shared primitives from `components/ui` before adding page-local styling.
2. Use a 4px spacing grid. Prefer 4, 8, 12, 16, 20, 24, and 32px.
3. Use one 1px border to define a surface. Do not combine a border, ring, and shadow on the same static card.
4. Reserve shadows for overlays: menus, popovers, dialogs, and temporary floating UI.
5. Keep the page title at 24px or below. Admin hierarchy should come from spacing and weight, not oversized text.
6. Use 14px as the default interface body size. Use 13px only for dense tables and supporting metadata.
7. Every page must support loading, empty, error, and populated states with the same outer geometry.
8. On mobile, controls must remain at least 44px high even when desktop controls are more compact.

## 2. Foundations

### 2.1 Spacing scale

| Token | Size | Use |
| --- | ---: | --- |
| `space-1` | 4px | Icon-to-label micro gap, closely related metadata |
| `space-2` | 8px | Button content, label-to-input, compact row content |
| `space-3` | 12px | Card internals, list items, toolbar groups |
| `space-4` | 16px | Default card padding, grid gaps, section rhythm |
| `space-5` | 20px | Comfortable section-card padding |
| `space-6` | 24px | Desktop page padding, major section separation |
| `space-8` | 32px | Separation between distinct page regions only |

Rules:

- Do not introduce arbitrary values when a scale value is within 2px of the intended result.
- Use `gap` or `space-y` on the parent instead of margins on many children.
- A page should normally use one vertical rhythm: 16px for dense pages or 24px for overview pages. Avoid mixing 16, 24, and 32px gaps without a hierarchy reason.

### 2.2 Typography

Use the existing application sans-serif family. Do not add a new font solely for the admin redesign.

| Role | Size / line height | Weight | Notes |
| --- | --- | --- | --- |
| Page title | 24px / 32px | 700 | One `h1` per page |
| Dialog title | 18px / 26px | 600-700 | Keep concise |
| Section title | 16px / 24px | 600 | Card and panel headings |
| Metric value | 24px / 28px | 700 | May be 20px on narrow cards |
| Body | 14px / 20px | 400 | Default UI copy |
| Dense body | 13px / 18px | 400-500 | Table cells and compact activity rows |
| Label | 12px / 16px | 500-600 | Inputs, metadata, column headers |
| Eyebrow | 11px / 16px | 600 | Uppercase, with modest letter spacing |
| Helper text | 12px / 16px | 400 | Hints, timestamps, secondary metadata |

Rules:

- Use sentence case for page titles, section titles, buttons, tabs, and field labels.
- Uppercase is limited to short eyebrows, table headings, and compact metric labels.
- Use no more than three weights on a screen: regular, medium/semibold, and bold.
- Numeric values in aligned tables should use tabular numerals.
- Truncate only when the full value is available through a detail view, tooltip, or accessible label.

### 2.3 Borders and elevation

| Pattern | Specification |
| --- | --- |
| Standard surface | 1px solid semantic border |
| Table rows | 1px bottom separator; no boxed cell borders |
| Selected/active item | Existing border plus a 2px active edge or semantic state treatment |
| Inputs | 1px border; focused state uses the shared focus ring |
| Dividers | 1px line; use only between meaningful groups |
| Static cards | No drop shadow by default |
| Floating overlays | One restrained shadow plus a 1px border |

Avoid nested boxes. If a card contains repeated items, use row dividers or subtle grouped regions before placing a bordered card inside another bordered card.

### 2.4 Corner radius

| Radius | Use |
| --- | --- |
| 6-8px | Inputs, buttons, compact icon containers, tooltips |
| 12px | Mobile record cards, dropdowns, compact panels |
| 16px | Primary cards, tables, chart panels, desktop dialogs |
| Full/pill | Status badges, count badges, segmented controls only |

Do not use pill shapes for ordinary action buttons. Do not mix 8, 12, and 16px cards at the same hierarchy level.

### 2.5 Icons

- Use 16px icons in buttons, navigation, table actions, and inputs.
- Use 20px icons in metric cards and section-leading controls.
- Use 24-32px icons only in empty states or prominent feedback.
- Pair an icon with visible text for unfamiliar or consequential actions.
- Icon-only buttons require an accessible name and a minimum 32px desktop hit area / 44px mobile hit area.
- Keep icon stroke weight visually consistent by using the existing Lucide set.

## 3. Admin shell

### Sidebar

- Desktop width: 256px.
- Outer padding: 16px.
- Navigation group gap: 4px.
- Item height: 40px desktop and 44px touch layouts.
- Item padding: 12px horizontal.
- Icon-to-label gap: 12px.
- Item radius: 8px.
- Navigation label: 14px, medium.
- Group eyebrow: 11px, semibold, uppercase.
- Use one active treatment consistently. Do not combine a filled background, bold text, border edge, and shadow.
- Keep identity/profile information compact and separate it from navigation with one divider.

### Header

- Height: 56px.
- Horizontal padding: 16px mobile, 24px desktop.
- Use a 1px bottom border and no default shadow.
- The header identifies the current section; the page body owns the full page title and description.
- Header controls use 8px gaps and compact button sizes on desktop.

### Main content

- Mobile padding: 16px.
- Desktop padding: 24px.
- Maximum content width: none for data tables; 1280-1440px for forms and narrative settings pages.
- Default vertical page gap: 24px.
- Dense table/list pages may use 16px after the page header.

## 4. Standard page anatomy

Every admin page should follow this order:

```text
Page header
  Title + concise description
  Primary action(s)

Optional summary metrics

Toolbar
  Search + filters/tabs + sort + secondary actions

Primary content surface
  Table / cards / chart / form

Pagination or footer actions
```

### Page header

- Use a 24px bold title and a 14px description with 4px between them.
- Actions align right on desktop and stack below the title on mobile.
- Use 12px between related actions.
- Do not wrap the page header in a decorative card unless it contains operational content beyond title and description.

### Section header

- Use a 16px semibold title.
- Optional description: 13-14px, 4px below the title.
- Header-to-content gap: 16px.
- If the section has an action, align it opposite the title rather than placing it in an unrelated toolbar.

## 5. Surfaces and cards

### Standard card

- Radius: 16px.
- Border: 1px.
- Padding: 16px mobile, 20px desktop.
- Internal gap: 12-16px.
- No default shadow or hover movement.
- Add hover treatment only when the entire card is interactive.

### Metric card

- Grid: 1 column mobile, 2 columns small screens, 4 columns desktop. A 5-card dashboard may use 5 columns only when each card remains at least 180px wide.
- Gap: 12px.
- Padding: 16px.
- Label: 11-12px semibold, optionally uppercase.
- Value: 20px mobile, 24px desktop, bold.
- Supporting text: 12px.
- Icon container: 36px mobile, 40px desktop; 8px radius or circular, but use one shape throughout the dashboard.
- Metric cards should have a consistent order: label, value, context. Do not alternate label/value placement between cards.

### Activity/list card

- Item padding: 12px.
- Item gap: 12px.
- Prefer dividers for a continuous list; use 8px-radius item borders only when each row is independently actionable.
- Primary text: 13-14px.
- Timestamp/supporting text: 12px, 4px below.

### Chart panel

- Use standard-card geometry.
- Header-to-chart gap: 16-20px.
- Chart height: 224px for compact dashboard charts; 280-320px for analysis pages.
- Axis labels: 11-12px.
- Keep period and metric selectors in the panel header and allow horizontal scrolling on mobile.
- Skeletons must match the final chart height to prevent layout shift.

## 6. Controls and forms

### Buttons

| Size | Desktop height | Horizontal padding | Text |
| --- | ---: | ---: | ---: |
| Compact | 32px | 10-12px | 12-13px |
| Default | 36px | 12-16px | 14px |
| Touch/mobile | 44px minimum | 16px | 14px |

- Radius: 8px.
- Icon gap: 6-8px.
- Primary action labels should be verbs: “Approve dataset”, “Invite staff”, “Save changes”.
- A page should normally have one visually primary action.
- Destructive actions must not rely on icon or color alone; include explicit text in dialogs.

### Inputs, selects, and search

- Desktop height: 36-40px; standardize on 40px for form fields and 36px for dense table toolbars.
- Mobile height: at least 44px.
- Radius: 8px.
- Horizontal padding: 12px.
- Input text: 14px.
- Label: 13px medium, 8px above the field.
- Helper/error text: 12px, 6px below the field.
- Form field gap: 16px; section gap: 24px.
- Search icon: 16px. Clear action must have a proper button hit area.
- Do not encode required fields only with punctuation; expose required state accessibly.

### Tabs and segmented filters

- Tabs use a 14px medium label and 12-16px horizontal padding.
- Underline tabs are preferred for page-level sections.
- Compact pills/segments are appropriate for short period filters such as 7D / 30D / 90D.
- Mobile tab rows scroll horizontally without wrapping.
- The active state must remain understandable without color alone.

### Status badges

- Height: 22-24px.
- Horizontal padding: 8-10px.
- Text: 11-12px semibold.
- Radius: full/pill.
- Keep labels short and human-readable.
- Use a shared mapping component; do not define status geometry in individual pages.

## 7. Data tables

### Desktop table

- Place the table in one 16px-radius, 1px-border surface.
- Header height: 44px.
- Header text: 11-12px semibold, optionally uppercase with restrained tracking.
- Row height: 52-56px for ordinary records; up to 64px for two-line identity cells.
- Cell horizontal padding: 16px. Use 12px only for very dense tables.
- Cell text: 13-14px.
- Use row separators, not zebra stripes and not full cell grids.
- Left-align text, right-align numeric values, and center only compact statuses or icon actions.
- Keep primary identity in the first meaningful column; place secondary metadata below it at 12px.
- Action buttons should not wrap. Collapse excess actions into a menu.
- A clickable row must still allow keyboard access and must not interfere with buttons inside the row.

### Toolbar

- Gap: 12px.
- Search should be 280-360px desktop and full width mobile.
- Filters and sort controls use the same height as search.
- Stack into logical rows on tablet; stack full-width on mobile.
- Show active filter count and provide a clear/reset action when filters are applied.

### Mobile record view

Below 768px, replace wide administrative tables with record cards when horizontal scrolling would hide context or actions.

- Radius: 12px.
- Border: 1px.
- Padding: 16px.
- Gap between cards: 12px.
- Put identity and status in the top row.
- Show only decision-relevant fields by default.
- Place actions in a full-width footer or clearly separated final row.
- Do not mechanically render every desktop column as a label/value pair.

### Pagination

- Separate pagination from rows with a top border when it is inside the table surface.
- Padding: 12px mobile, 16px desktop.
- Summary text: 13px.
- Controls: 32-36px desktop, 44px mobile.
- On mobile, prioritize Previous/Next and the current page; hide nonessential numbered pages if space is limited.

## 8. Dialogs, drawers, and review workflows

### Dialogs

- Full screen or bottom sheet on narrow mobile screens; centered on desktop.
- Desktop radius: 16px.
- Desktop width tiers: 480px small, 672px medium, 896px large.
- Maximum height: 90vh.
- Header and footer: 16px vertical / 20-24px horizontal padding, separated by 1px borders.
- Body: 20-24px padding and independently scrollable.
- Title: 18px semibold/bold.
- Footer actions align right on desktop and become full-width or stacked on mobile.
- Closing restores focus to the trigger; Escape closes non-blocking dialogs.

### Review and approval pages

- Keep the reviewed artifact and the decision controls visually distinct.
- Use a sticky action footer or side panel only when it reduces long-page scrolling.
- Group validation checks in one section with row separators.
- Show the decision consequence close to the action.
- Destructive or irreversible actions require a confirmation step and clear object name.

## 9. Feedback states

### Loading

- Skeleton geometry must match final content geometry.
- Use the same card radius, padding, row count, and chart height as the loaded state.
- Avoid replacing a whole page with a centered spinner.
- Preserve the page header when refreshing existing content.

### Empty

- Padding: 48px vertical, 16px horizontal.
- Icon container: 56-64px.
- Title: 16-18px semibold.
- Description: 14px, max width about 448px, 8px below.
- Optional action: 20-24px below the description.
- Distinguish “no records exist” from “no results match these filters”.

### Errors

- Keep page-level errors inside the content width rather than as floating toasts alone.
- Use a short 16px heading, 14px explanation, and a retry action when appropriate.
- Field errors appear directly below their field without changing unrelated layout.

## 10. Responsive behavior

| Width | Behavior |
| --- | --- |
| `< 640px` | 16px page padding; single-column cards; stacked toolbars; mobile record cards; 44px controls |
| `640-767px` | Two-column metric cards where space permits; stacked primary content |
| `768-1023px` | Desktop tables for moderate column counts; wrapped toolbars; two-column content selectively |
| `>= 1024px` | Fixed sidebar; multi-column dashboard grids; full toolbars |
| `>= 1280px` | Four-column metrics; 2:1 or 1:1 analytical panels where useful |

Test at minimum: 375px, 768px, 1024px, 1280px, and 1440px.

Responsive rules:

- Never shrink controls below readable/touchable sizes to preserve a desktop row.
- Prefer reflow over hiding. Hide only redundant metadata.
- Maintain document order so keyboard and screen-reader navigation follows the visual layout.
- Prevent page-level horizontal scrolling. A table may scroll only as a fallback when a mobile card representation would lose essential meaning.

## 11. Accessibility and interaction

- Maintain one visible focus treatment through shared primitives.
- All controls must be reachable and operable by keyboard.
- Use semantic headings in order: one `h1`, then `h2`, then `h3`.
- Icon-only controls need `aria-label`; decorative icons use `aria-hidden`.
- Dialogs trap focus and restore it when closed.
- Loading and saved states that do not move focus should be announced through an appropriate live region.
- Status, selection, and validation cannot depend on color alone; pair them with text, icon, shape, or position.
- Mobile interactive targets are at least 44 by 44px with adequate separation.

## 12. NSGDP component alignment

Apply this guide through shared components rather than repeating classes in each page.

### Components to standardize first

1. `components/ui/card.tsx`
   - Make the standard admin card 16px radius with a 1px border.
   - Remove default static-card shadow/ring layering.
   - Normalize mobile/desktop padding to 16/20px.
2. `components/ui/button.tsx`
   - Keep 8px radius.
   - Normalize desktop heights to the compact/default scale and add explicit touch sizing where needed.
3. `components/ui/input.tsx`, select, and textarea
   - Align field heights, radius, label spacing, and error spacing.
4. `components/ui/table.tsx`
   - Normalize 44px headers, 52-56px rows, and 16px cell padding.
5. `components/data/pagination.tsx`
   - Add table-surface separation and mobile simplification.
6. `components/feedback/empty-state.tsx` and skeletons
   - Align typography and geometry with final content surfaces.
7. Admin sidebar and header
   - Preserve their current 256px / 56px shell dimensions while aligning navigation density and active treatment.

Do not create page-specific card, button, input, or status styles when a shared primitive can own the rule.

## 13. First implementation target: Admin Dashboard

Use the dashboard as the reference screen before changing every admin page.

1. Reduce the dashboard's outer vertical rhythm from 32px to 24px.
2. Keep the page title at 24px and body description at 14px.
3. Change metric layout to 1 / 2 / 4 columns unless five columns can maintain the minimum useful card width.
4. Normalize metric cards to 16px padding, 16px radius, 1px border, 11-12px labels, and 20/24px values.
5. Use a consistent icon-container shape and 36/40px size.
6. Normalize analytical panels to the same card geometry and 16px section titles.
7. Convert repeated text rows inside panels to 12px-spaced lists with separators where scanning benefits.
8. Make loading skeletons exactly match the final grid and panel dimensions.
9. Verify dashboard layouts at all required widths before using it as the template for datasets, organisations, users, and audit logs.

## 14. Established NSGDP admin conventions

These are project-level decisions established while refining the admin console. Treat them as defaults on every subsequent page unless a workflow has a clear reason to differ.

### Shell and navigation

- Do not render a global desktop header above page content. The sidebar owns global navigation and utilities; each page owns its title, description, context, and primary actions.
- Do not repeat the current section in both a shell header and a page header.
- Keep theme, notification bell/unread count, and logout in the sidebar utility area. Notifications must remain visible without requiring users to scroll to the end of the navigation list.
- Keep the administrator identity block compact and clearly separate the display name from the role. Avoid excess space beneath its divider.
- Logout always includes its icon.
- Use the reusable `.scrollbar-slim` treatment for constrained navigation or tab scrollers. Its thumb must remain visible against the sidebar surface without becoming visually dominant.
- Do not add promotional or public-portal cards/links to operational dashboard content. Keep administrative pages focused on administrative work.

### Page headers and actions

- Use one page header only: a 24px-or-smaller title, one concise supporting line, and right-aligned contextual actions where needed.
- Detail-page back controls should name the destination (for example, `Datasets`) rather than using an ambiguous `Back` label.
- Place numerous detail actions in one bordered action toolbar below the page header instead of crowding the title row.
- Use one primary action per state. Review or publish may be primary; view, download, unpublish, archive, and restore remain secondary.
- Familiar table-row actions may be icon-only when space is constrained, but they must have an `aria-label` and hover title. Consequential detail-page actions retain visible labels.
- Archived dataset rows use the restore icon without the word `Restore`; dataset detail pages use the icon and visible `Restore` label.
- Archive and restore use the same permission boundary and a confirmation dialog whose title, explanation, label, icon, and tone match the operation.

### Dashboards and information layout

- Avoid pages made entirely from equal cards or uninterrupted text. Use purposeful asymmetry, bento-style grouping, varied spans, compact metrics, and clear operational focal points.
- Every chart must plot real values rather than acting as decoration. Use restrained grid lines, compact axes, tooltips, meaningful empty states, and the shared semantic tokens.
- Recent activity should be a scan-friendly timeline/list with an action or entity icon, strong primary description, useful supporting context, timestamp, and clear affordance.
- Internal admin links must use app-relative routes such as `/datasets`; never leak legacy `/admin/...` prefixes into client navigation. Normalize links at the API boundary when legacy notification records may still contain them.

### Data lists and tables

- Do not show selection checkboxes unless the page provides a real bulk action.
- Desktop tables emphasize record identity first: icon, strong title, one useful secondary line, then compact metadata and actions.
- Replace squeezed tables with purpose-built record cards below the table breakpoint. Preserve status, ownership/organisation, essential metadata, and primary actions.
- Use shared status, visibility, and age badges instead of page-specific badge colors.
- Search inputs that call the server are debounced (300ms by default), trim surrounding whitespace, reset to page 1, and announce `Searching`/`Updating` without blanking existing results.
- Search placeholders must describe only fields the backend really searches. Search behavior is case-insensitive where users reasonably expect it, including dataset format values such as CSV/JSON.
- Lists use API-backed pagination metadata (`page`, `limit`, `total`, and `totalPages`), not a fixed request for an arbitrary large result set.
- Changing a tab, filter, search, or page size resets pagination appropriately. Preserve previous page data during fetches to prevent flicker.
- Initial loading uses geometry-matched skeletons; background refetches keep content visible with a compact progress indicator.
- Distinguish an empty collection from a filtered search with no matches, and provide a clear-filter action for the latter.

### Detail pages

- Put identity and current state first: title, organisation/context, updated date, status, visibility, and format.
- Use a responsive 2:1 content/information layout when the primary artifact benefits from width. The information rail may be sticky on desktop but returns to document flow on smaller screens.
- Metadata should use compact labelled rows with icons and dividers rather than a loose sequence of similarly styled text.
- File lists use a strong filename, compact format/size/date metadata, row dividers, and accessible view/download actions.
- Keep view and download semantics distinct. `View file` opens the parsed dataset preview in a full-screen modal so behavior is consistent across browsers and file formats; only an explicit `Download` action should request the raw file with attachment disposition.
- Keep workflow feedback, archive information, preview content, files, tags, geography, and version history in semantically separate sections without introducing nested decorative boxes.
- Detail loading skeletons must represent the header, action toolbar, main content, and information rail—not a single generic rectangle.

### Dataset review workflows

- Keep the reviewed artifact and QA checklist in the main column; place submission context and decision controls in a sticky supporting rail on wide screens.
- Present QA dimensions as one continuous bordered checklist with row dividers rather than a stack of independent cards. Preserve a restrained semantic tint across each row for Pass, Fail, N/A, and Pending so reviewers can scan outcomes quickly.
- Each QA row keeps its label, concise explanation, Pass/Fail/N/A controls, optional notes, and expandable guidance together. Selected states must remain identifiable without relying on color alone.
- Show checklist counts and completion progress near the checklist and decision controls. Explain why the primary approval action is disabled instead of leaving reviewers to infer the requirement.
- The decision panel has one primary action (`Send for director approval`), one corrective action (`Request revision`), and a lower-emphasis archive action.
- Revision feedback is explicitly required, has a visible minimum-length indicator, and explains that the submitter receives it. Archive reasons are explicitly optional.

### Multi-step dataset forms

- Put the stepper in one bordered surface above a focused form card. Distribute steps across the available width and retain slim horizontal scrolling on narrow screens.
- On mobile, supplement the scrollable stepper with a compact `Step n of total` indicator.
- Each step starts with a 16px section title, one concise explanation, and a divider before its fields.
- Keep form content to a readable maximum width while allowing wider controls such as coverage selectors and file lists enough room.
- Mark required and optional fields with visible words, not an asterisk alone. Field errors use compact text directly below the relevant control.
- Separate Back/Next/Save/Submit controls from fields with one top divider. Use 44px touch targets on mobile and sentence-case action labels.
- Selecting files stages them locally; label them `Ready to upload` rather than simulating progress or claiming the upload completed. Show real progress only during a real network upload.
- In the final step, keep `Submit for review` primary, `Save as draft` secondary, and Back visually separate.

### Implementation and validation

- Extend shared primitives and reusable utilities before introducing repeated page-local treatments.
- Preserve permissions and server-side workflow behavior while changing presentation.
- For routine UI iterations, run targeted ESLint and `git diff --check`. Do not run a production build after every visual change; reserve broader validation for shared contracts, risky refactors, or release readiness.

## 15. Review checklist

Before considering an admin screen complete, verify:

- [ ] Page uses 16px mobile and 24px desktop outer padding.
- [ ] Page uses a consistent 16px or 24px vertical rhythm.
- [ ] There is one 24px-or-smaller `h1` and a clear heading hierarchy.
- [ ] Body copy is normally 14px; dense metadata is no smaller than 12px.
- [ ] Static surfaces use one 1px border and no unnecessary shadow.
- [ ] Same-level cards use the same radius and padding.
- [ ] Inputs and toolbar controls align in height.
- [ ] Mobile controls are at least 44px high.
- [ ] Tables have a purposeful mobile representation.
- [ ] Loading, empty, error, and populated states preserve layout.
- [ ] Focus, hover, active, disabled, and destructive states are clear without relying only on color.
- [ ] No page-specific color value was introduced as part of the UI cleanup.
- [ ] No shared primitive was bypassed by duplicated local styling.

## Source reference

The structural inspiration was taken from TalentNG's `docs/DASHBOARD_STYLING_GUIDE.md`, `.kiro/specs/admin-pages-redesign/requirements.md`, and implemented dashboard/shared components. Only layout, typography, spacing, border, radius, responsive, and interaction patterns were carried forward. TalentNG's colors and brand styling are intentionally excluded.
