

## Replace Dashboard Greeting with "Studio Overview"

**File:** `src/pages/Dashboard.tsx`

**Change:** Remove the dynamic greeting logic (`Good Morning/Afternoon/Evening, {studioName}`) and replace it with a static "Studio Overview" heading.

### Details

- Remove the `greeting()` function (lines 34-38)
- Replace the `<h1>` text from `{greeting()}, {studioName}` to `Studio Overview`
- Keep the existing subtitle "Your studio at a glance" and all typography classes (`font-serif text-[24px] font-semibold...`) intact
- The `studioName` import from `useAuth` can remain since it may be used elsewhere or for future use

