NEXT

- Do something different with the scene background colours
- Automate an initial welcome message once you create a campaign
- Show reasoning text for models that provide it

OTHER STUFF

- Claude + tool use is broken, it wants result messages?
- Disable text input when there's an active roll to do (maybe?)
- Look into Gemini implicit caching — not sure it's being applied
- BUG: When you use newlines in your message the ReactMarkdown component doesn't render them
- If we're going to take JSON directly in the modal, need some friendly errors
- Also the modal is too long with long JSON and files
- Tidy up old images from convex storage before regenerating
- Drop chat messages out of the pagination so you don't have to hard refresh to go back to 10.
- Compress older context using the summarisation action
- Track age of memories in case that's useful for tapering their importance off over time
- CMD+K
- Move LLM models to their own table with a bool for tool use
- A way to not have to name/describe the campaign upfront (and even AI-name it later once it's locked in?)
- If the LLM produces multiple dice-roll tool calls at once we need to wait until they're ALL rolled before reporting back (and then report them all at once)
- Some indicator of progress when files are being uploaded
- validation messages or errors when saving forms (form lib?)
- nested list formatting is still a bit weird
- Scrape the content at https://charsmith.com/wildsea-compendium to make a Wildsea doc?
- Add options, including whether reasoning shows collapsed by default (or hidden completely)
- Also maybe turning reasoning on and off per model or setting limits

PROMPT THINGS

- It's not that reliable at introducing characters (always works when you ask if specifically though)
- Sometimes it asks you to describe your action and then roll, but the UI kinda makes you roll first
- Sometimes a tool call (like updating character sheet) comes at the natural end of a message, and then the new message after kind of doubles things up

DONE

- store tool calls along with other messages (string -> string[]? or more structured?)
- figure out if there's a better way to get the files in context
- Allow regenerating the last message
- Edit campaign upfront, navigate to it after creating
- BUG: <SidebarTrigger /> isn't floating, adds extra whitespace below
- Moves reference, esp for TSL
- Sum up tokens for a whole campaign
