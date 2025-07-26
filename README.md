# GAZE

A bad solo RPG chatbot

## Philosophy

- Sharp knives
- Always an escape hatch

## Advantages over using a chatbot directly:

Maintaining state

- Store a character sheet and have the LLM maintain it with tool calls
- Have separate lists of characters, scenes, etc.

The AI can keep secrets

- A planning tool that lets it maintain state not visible to the user
- Better for coherent experiences that aren't just made up on the fly

A specialized experience

- Selection of a ruleset (or no ruleset at all for a more freeform experience)
- Solid system prompts that take into account all the current game state
- Access to the full rulebooks and reference materials via file upload
- [Later] Adaptive prompts for different phases of play, e.g. character creation

Multimedia experience and more affordances

- Auto-generating images for new characters, new locations

Context management

- Store key memories in a separate vector database, find relevant ones with semantic search, attach to prompt
- Compact context into a summary when it gets too long to avoid it dropping off

Other stuff

- Easy to use different LLMs for different things, e.g. BFL for modifying images, cheaper model for summaries

Things it opens up in future that we may or may not do

- Multiplayer
