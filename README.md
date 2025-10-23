# GAZE INTO THE ABYSS

An AI-powered solo tabletop RPG platform with persistent state, intelligent context management, and immersive multimedia features.

## Philosophy

- Sharp knives
- Always an escape hatch

## Key Features

### State Management & Character System

- **Character Sheets**: Persistent character data maintained by the AI with tool calls
- **Character Outfits**: Dynamically change character outfits with automatic image generation. Outfits are saved and reusable without regenerating images
- **Character Updates**: Track character development, personality changes, and story notes
- **NPC Introduction**: Automatically introduce new characters with AI-generated images
- **Active Character Tracking**: Know which characters are present in the current scene

### Game Mechanics

- **Multiple Rulesets**: Support for different RPG systems with custom prompts and character sheets
- **Rulebook Access**: Upload and reference full rulebooks and game materials
- **Dice Rolling**: Interactive dice roll requests from the AI
- **Progress Clocks**: Forged in the Dark style progress tracking
- **Quest Logs**: Track objectives with active/completed/failed states
- **Scene Management**: Dynamic scene changes with AI-generated location images
- **Temporal Tracking**: Track in-game date, time of day, and time-sensitive events

### AI Intelligence

**The AI Can Keep Secrets**

- A planning tool that maintains hidden state not visible to the user
- Better for coherent experiences that aren't just improvised

**Smart Context Management**

- Vector database with semantic search for relevant game memories (3072-dimensional embeddings)
- Automatic campaign summarization when conversations grow long
- Background job tracking for long-running operations

**Interactive Tools**

- `chooseName`: Ask players for names with AI-generated suggestions
- `requestDiceRoll`: Request specific dice rolls from players
- `updateCharacter`: Update character descriptions and development notes
- `updateCharacterOutfit`: Change or create new outfits with automatic image generation
- `updateCharacterSheet`: Modify stats, inventory, and game-specific data
- `introduceCharacter`: Introduce new NPCs with descriptions and images
- `changeScene`: Transition to new locations with scene descriptions and images
- `updateTemporal`: Track passage of time and time-sensitive events
- `setCampaignInfo`: Update campaign metadata
- `updateQuestLog`: Manage quest objectives and status
- `updateClock`: Track progress with segmented clocks
- `updatePlan`: Maintain AI planning notes (hidden from player)

### Multimedia Experience

- **AI-Generated Images**: Automatic image generation for characters, outfits, and scenes
- **Voice Narration**: Emotion-aware voice synthesis via Hume AI
- **Sequential Audio Playback**: Queue multiple voice segments for continuous narration
- **Character-Specific Voices**: Assign unique voice IDs to characters

### Multi-Provider AI Support

Seamlessly switch between AI providers for different use cases:
- **OpenAI**: Primary conversations and embeddings
- **Anthropic**: Advanced reasoning with Claude
- **Google AI**: Multi-modal capabilities with Gemini
- **Groq**: Fast inference for select models
- **OpenRouter**: Access to diverse model options

## Architecture Highlights

### Real-Time Everything

Built on Convex for real-time database updates and serverless functions. Changes sync instantly across all game elements.

### Outfit System

Characters maintain a collection of outfits (formal, casual, combat gear, etc.) with:
- Persistent outfit storage (outfit name → description + image)
- Current outfit tracking
- Automatic image generation for new outfits
- Instant switching between existing outfits without regeneration
- Seamless outfit changes during gameplay

### Context Management Strategy

1. **Vector Memories**: Semantic search retrieves relevant past events
2. **Campaign Summaries**: Automatic summarization manages context window limits
3. **Active State Tracking**: Current scene, characters, time, and quests
4. **Background Jobs**: Long-running operations with real-time progress updates

### Temporal System

Track the passage of time with:
- Flexible date formats (fits any campaign setting)
- Granular time of day (dawn, morning, midday, afternoon, dusk, evening, night, midnight)
- Notes field for time-sensitive events and countdowns
- History of temporal changes for reference

## Advantages Over Using a Chatbot Directly

**Better State Management**
- Persistent character sheets, inventory, and game data
- Separate tracking for characters, scenes, quests, and progress
- Outfit system with reusable image assets

**Coherent Long-Term Play**
- AI maintains hidden planning notes for better story coherence
- Memory system prevents forgetting important events
- Automatic summarization for unlimited campaign length

**Specialized RPG Experience**
- Purpose-built prompts optimized for tabletop gameplay
- Rulebook integration via file upload
- Game-system-specific character sheets and mechanics

**Rich Multimedia**
- Auto-generating images for characters, outfits, and locations
- Voice narration with emotional awareness
- Visual progress tracking with clocks and quest logs

**Flexible AI Backend**
- Use different models for different tasks (cheap models for summaries, best models for key decisions)
- Easy provider switching for cost/quality trade-offs

## Future Possibilities

- Multiplayer support
- Adaptive prompts for different play phases (character creation, combat, exploration)
- Enhanced memory retrieval and story callbacks
- Campaign templates and starter scenarios
