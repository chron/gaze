NEXT

- Chunk summaries, store in table, show in the UI
- New LLM call to brainstorm ideas, pass systems available, have clickable links to start new campaign
- Track tool-results for all the tool executions, not just dice rolls
- Auth
- Store which memories were recalled against the message, show in UI

SPEECH
- Different prompt for user messages that gets char info from the character sheet
- Look into whether we can do all the utterances in one call if we don't use the AI SDK
- Progress indicator on the FE?

OTHER STUFF

- Automate an initial welcome message once you create a campaign
- Fix up data (or reset DB?) so we can turn `schemaValidation: true` back on
- Claude + tool use is broken, it wants result messages for ALL tool calls
- Disable text input when there's an active roll to do (maybe?)
- Look into Gemini implicit caching — not sure it's being applied
  - possibly the system prompt is too dynamic, move that to a user message or something?
- If we're going to take JSON directly in the modal, need some friendly errors
- Also the modal is too long with long JSON and files
- Tidy up old images from convex storage before regenerating
- Drop chat messages out of the pagination so you don't have to hard refresh to go back to 10.
- Track age of memories in case that's useful for tapering their importance off over time
- CMD+K
- Move LLM models to their own table with a bool for tool use
- A way to not have to name/describe the campaign upfront (and even AI-name it later once it's locked in?)
- Some indicator of progress when files are being uploaded
- validation messages or errors when saving forms (form lib?)
- Scrape the content at https://charsmith.com/wildsea-compendium to make a Wildsea doc?
- Add options, including whether reasoning shows collapsed by default (or hidden completely)
- Also maybe turning reasoning on and off per model or setting limits
- Try out other image gen (Higgsfield? Midjourney? Gemini?)
- Different dice display stuff: diff shapes for number of sides (SVG?), maybe cool rolling animations
  - Also: for dice pool thresholds show number of successes instead of total somehow?
- <Wiggly /> animation resets as new text streams in
- Character sheet JSON doesn't maintain the original order
- Order campaigns in sidebar by recently updated, show a subset (5?) with a link to view more
- Editing previous messages (UI is done, but need to actually save the changes)
- "End of session" tool that adds a summary to the UI somewhere?
- z.describe("...") for tool params
- edit character descriptions (and prompt? maybe an expandable section for it?)
- when tool message is the last message it prevents the usage info from showing

PROMPT THINGS

- It's not that reliable at introducing characters (always works when you ask if specifically though)
- Sometimes a tool call (like updating character sheet) comes at the natural end of a message, and then the new message after kind of doubles things up
- model specific tweaks maybe
  - Claude uses A/B/C lists instead of markdown lists which don't render properly

DONE

- store tool calls along with other messages (string -> string[]? or more structured?)
- figure out if there's a better way to get the files in context
- Allow regenerating the last message
- Edit campaign upfront, navigate to it after creating
- BUG: <SidebarTrigger /> isn't floating, adds extra whitespace below
- Moves reference, esp for TSL
- Sum up tokens for a whole campaign
- Show reasoning text for models that provide it
- nested list formatting is still a bit weird
- Go back to the gap-based spacing for messages, margins are too annoying
- Sometimes it asks you to describe your action and then roll, but the UI kinda makes you roll first
- Do something different with the scene background colours (and scenes in general)
- If the LLM produces multiple dice-roll tool calls at once we need to wait until they're ALL rolled before reporting back (and then report them all at once)
- disable dice roll buttons after usage
- maybe don't send old reasoning to LLM on every message?
- re-add the summary thing
- Try out having the LLM plan a few steps ahead and store it secretly
- Look into the DB bandwidth. Not sure if it's just HMR that's refreshing stuff too much?
  - maybe when streaming we need to not get the whole paginated list endpoint?
- and add images for scenes maybe?
- fix the autoscroll behaviour (add back a check for manual scroll thing?)
- Hume or some other TTS provider
- Add characters to activeCharacters when introducing them
- Compress older context using the summarisation action
- BUG: When you use newlines in your message the ReactMarkdown component doesn't render them
- Have a concept of "active" vs "inactive" characters, maybe scene_change updates the list?
