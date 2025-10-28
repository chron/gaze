NEXT
- [AUTH] make campaigns owned by a user id, enforce it in backend - users table? accounts?
- [FEAT] A way to replay a story easily — paginated, from the start, different UI affordances?

LATER
- [SPEECH] Different prompt for user messages that gets char info from the character sheet
- [SPEECH] Progress indicator on the FE?
- [LLM] New LLM call to brainstorm ideas, pass systems available, have clickable links to start new campaign
- [LLM] Automate an initial welcome message once you create a campaign
- [LLM] Add options, including whether reasoning shows collapsed by default (or hidden completely)
- [LLM] Also maybe turning reasoning on and off per model or setting limits
- [BUG] Claude + tool use is broken, it wants result messages for ALL tool calls
- [UI] Disable text input when there's an active roll to do (maybe?)
- [UI] If we're going to take JSON directly in the modal, need some friendly errors
- [UI] Also the modal is too long with long JSON and files
- [UI] Some indicator of progress when files are being uploaded
- [UI] validation messages or errors when saving forms (form lib?)
- [CONTENT] Scrape the content at https://charsmith.com/wildsea-compendium to make a Wildsea doc?
- [UI] Different dice display stuff: diff shapes for number of sides (SVG?), maybe cool rolling animations
  - Also: for dice pool thresholds show number of successes instead of total somehow?
- [POLISH] <Wiggly /> animation resets as new text streams in (negative offsets probably?)
- [POLISH] Character sheet JSON doesn't maintain the original order
- [OTHER] Use tanstack-query + Convex integration so local navigation is snappier
- [BUG] Date badges pulse on page load, should only happen when it changes
- [UI] Handle `error` message finishReason better, when messages get cut off part way
- [UI] Colors for clocks. Either get AI to choose, or just hash the name or something?
- [LLM] Don't let it reintroduce clocks at max ticks (which would normally be deleted)
- [IMAGES] Use an image edit LLM for outfits so the characters stay more consistent. Fal.ai? (After AI SDK v6)
