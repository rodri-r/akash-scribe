## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4
- **Build Tool**: Vite with optimized Tailwind plugin
- **Desktop**: Electron 36 with context isolation
- **UI Components**: shadcn/ui with Radix primitives
- **Database**: better-sqlite3 with FTS5 for local storage (transcriptions, notes, agents, calendar)
- **Speech-to-Text**: OpenAI Whisper (whisper.cpp) + NVIDIA Parakeet (sherpa-onnx) for local, OpenAI API for cloud
- **Live Transcription**: OpenAI Realtime API over WebSocket for meeting transcription
- **AI Processing**: Multi-provider streaming (OpenAI, Anthropic, Gemini, Groq, local llama.cpp)
- **Calendar**: Google Calendar API with OAuth 2.0 PKCE
- **Icons**: Lucide React for consistent iconography

## Development

### Scripts

- `npm run dev` - Start development with hot reload
- `npm run start` - Start production build
- `npm run setup` - First-time setup (creates .env file)
- `npm run build:renderer` - Build the React app only
- `npm run download:whisper-cpp` - Download whisper.cpp for the current platform
- `npm run download:whisper-cpp:all` - Download whisper.cpp for all platforms
- `npm run download:llama-server` - Download llama.cpp server for local LLM inference
- `npm run download:llama-server:all` - Download llama.cpp server for all platforms
- `npm run download:sherpa-onnx` - Download sherpa-onnx for Parakeet local transcription
- `npm run download:sherpa-onnx:all` - Download sherpa-onnx for all platforms
- `npm run compile:native` - Compile native helpers (Globe key listener and media remote for macOS, key listener and fast paste for Windows, fast paste for Linux, text monitor for auto-learn)
- `npm run build` - Full build with signing (requires certificates)
- `npm run build:mac` - macOS build with signing
- `npm run build:win` - Windows build with signing
- `npm run build:linux` - Linux build
- `npm run pack` - Build without signing (for personal use)
- `npm run dist` - Build and package with signing
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run clean` - Clean build artifacts
- `npm run preview` - Preview production build

### Architecture

The app consists of two main windows:

1. **Main Window**: Minimal overlay for dictation controls
2. **Control Panel**: Full settings and history interface

Both use the same React codebase but render different components based on URL parameters.

### Key Components

- **main.js**: Electron main process, IPC handlers, database operations
- **preload.js**: Secure bridge between main and renderer processes
- **App.jsx**: Main dictation interface with recording controls
- **ControlPanel.tsx**: Settings, history, notes, integrations, and model management
- **AgentOverlay.tsx**: Agent mode chat overlay with streaming AI responses
- **CommandSearch.tsx**: Cmd+K command palette for searching notes and transcripts
- **IntegrationsView.tsx**: Google Calendar connection and meeting settings
- **src/helpers/whisper.js**: whisper.cpp integration for local processing
- **src/helpers/googleCalendarManager.js**: Calendar sync and event management
- **src/helpers/meetingDetectionEngine.js**: Smart meeting detection orchestrator
- **src/helpers/audioStorage.js**: Audio file retention and management
- **src/helpers/mediaPlayer.js**: Cross-platform media pause/resume
- **src/services/ReasoningService.ts**: Multi-provider AI processing with streaming
- **better-sqlite3**: Local database for transcriptions, notes, agents, and calendar data

### Tailwind CSS v4 Setup

This project uses the latest Tailwind CSS v4 with:

- CSS-first configuration using `@theme` directive
- Vite plugin for optimal performance
- Custom design tokens for consistent theming
- Dark mode support with `@variant`

## Building

The build process creates a single executable for your platform:

```bash
# Development build
npm run pack

# Production builds
npm run dist           # Current platform
npm run build:mac      # macOS DMG + ZIP
npm run build:win      # Windows NSIS + Portable
npm run build:linux    # AppImage + DEB
```

Note: build/pack/dist scripts automatically download whisper.cpp, llama-server, and sherpa-onnx for the current platform. For multi-platform packaging from one host, run the `:all` variants first (`npm run download:whisper-cpp:all`, `npm run download:llama-server:all`, `npm run download:sherpa-onnx:all`).

## Configuration

### Environment Variables

Create a `.env` file in the root directory (or use `npm run setup`):

```env
# OpenAI API Configuration (optional - only needed for cloud processing)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Customize the Whisper model
WHISPER_MODEL=whisper-1

# Optional: Set language for better transcription accuracy
LANGUAGE=

# Optional: Anthropic API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: Google Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Groq API Configuration (ultra-fast inference)
GROQ_API_KEY=your_groq_api_key_here

# Optional: Mistral API Configuration (Voxtral transcription)
MISTRAL_API_KEY=your_mistral_api_key_here

# Optional: Debug mode
DEBUG=false
```

### Local Whisper Setup

For local processing, Akash Scribe uses OpenAI's Whisper model via whisper.cpp - a high-performance C++ implementation:

1. **Bundled Binary**: whisper.cpp is bundled with the app for all platforms
2. **GGML Models**: Downloads optimized GGML models on first use to `~/.cache/akash-scribe/whisper-models/`
3. **No Dependencies**: No Python or other runtime required

**System Fallback**: If the bundled binary fails, install via package manager:

- macOS: `brew install whisper-cpp`
- Linux: Build from source at https://github.com/ggml-org/whisper.cpp

**From Source**: When running locally (not a packaged build), download the binary with `npm run download:whisper-cpp` so `resources/bin/` has your platform executable.

**Requirements**:

- Sufficient disk space for models (75MB - 3GB depending on model)

**Upgrading from Python-based version**: If you previously used the Python-based Whisper, you'll need to re-download models in GGML format. You can safely delete the old Python environment (`~/.akash-scribe/python/`) and PyTorch models (`~/.cache/whisper/`) to reclaim disk space.

### Local Parakeet Setup (Alternative)

Akash Scribe also supports NVIDIA Parakeet models via sherpa-onnx - a fast alternative to Whisper:

1. **Bundled Binary**: sherpa-onnx is bundled with the app for all platforms
2. **INT8 Quantized Models**: Efficient CPU inference
3. **Models stored in**: `~/.cache/akash-scribe/parakeet-models/`

**Available Models**:

- `parakeet-tdt-0.6b-v3`: Multilingual (25 languages), ~680MB

**When to use Parakeet vs Whisper**:

- **Parakeet**: Best for speed-critical use cases or lower-end hardware
- **Whisper**: Best for quality-critical use cases or when you need specific model sizes

### Customization

- **Hotkey**: Change in the Control Panel (default: backtick `) - fully customizable
- **Panel Position**: Drag the dictation panel to any location on your screen
- **Processing Method**: Choose local or cloud in Control Panel
- **Whisper Model**: Select quality vs speed in Control Panel
- **UI Theme**: Edit CSS variables in `src/index.css`
- **Window Size**: Adjust dimensions in `main.js`
- **Database**: Transcriptions stored in user data directory

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Run `npm run lint` before committing
- Follow the existing code style
- Update documentation as needed
- Test on your target platform before submitting

## Security

Akash Scribe is designed with privacy and security in mind:

- **Local Processing Option**: Keep your voice data completely private
- **No Analytics**: We don't collect any usage data or telemetry
- **Open Source**: All code is available for review
- **Secure Storage**: API keys are stored securely in your system's keychain/credential manager
- **Minimal Permissions**: Only requests necessary permissions (microphone, accessibility, screen recording for meetings)
- **OAuth 2.0 PKCE**: Google Calendar uses secure PKCE flow — no client secrets stored
- **Local-First Notes**: Notes are stored locally in SQLite; cloud sync is optional

## Troubleshooting

### Common Issues

1. **Microphone permissions**: Grant permissions in System Preferences/Settings
2. **Accessibility permissions (macOS)**: Required for automatic text pasting
   - Go to System Settings → Privacy & Security → Accessibility
   - Add Akash Scribe and enable the checkbox
   - Use "Fix Permission Issues" in Control Panel if needed
3. **API key errors** (cloud processing only): Ensure your API key is valid and has credits
   - Set key through Control Panel or .env file
   - Check logs for "API Key present: Yes/No"
4. **Local Whisper issues**:
   - whisper.cpp is bundled with the app
   - If bundled binary fails, install via `brew install whisper-cpp` (macOS)
   - Check available disk space for models
5. **Global hotkey conflicts**: Change the hotkey in the Control Panel - any key can be used
   - GNOME Wayland: Hotkeys are registered via gsettings; check Settings → Keyboard → Shortcuts for conflicts
6. **Text not pasting**:
   - macOS: Check accessibility permissions (System Settings → Privacy & Security → Accessibility)
   - Linux X11: Install `xdotool`
   - Linux Wayland: Install `wtype` or `ydotool` for paste simulation (ensure `ydotoold` daemon is running)
   - All platforms: Text is always copied to clipboard - use Ctrl+V (Cmd+V on macOS) to paste manually
7. **Panel position**: If the panel appears off-screen, restart the app to reset position
8. **Meeting detection not working**:
   - macOS: Grant screen recording permission in System Settings → Privacy & Security → Screen Recording
   - Ensure Google Calendar is connected in Integrations
   - Check that meeting detection is enabled in settings
9. **Agent Mode issues**:
   - Ensure Agent Mode is enabled in Settings → Agent Mode
   - Verify you have a valid API key for your selected AI provider
   - Check that the agent hotkey doesn't conflict with other shortcuts

### Getting Help

- Check the [Issues](https://github.com/akash-network/akash-scribe/issues) page
- Review the console logs for debugging information
- For local processing: Ensure whisper.cpp is accessible and models are downloaded
- For cloud processing: Verify your API key and billing status
- Check the Control Panel for system status and diagnostics

### Performance Tips

- **Local Processing**: Use "base" model for best balance of speed and accuracy
- **Cloud Processing**: Generally faster but requires internet connection
- **Model Selection**: tiny (fastest) → base (recommended) → small → medium → large (best quality)
- **Permissions**: Ensure all required permissions are granted for smooth operation

## FAQ

**Q: Is Akash Scribe really free?**
A: Yes! Akash Scribe is open source and free to use. The free plan includes 60 minutes/month of cloud transcription, and local processing is completely free with no limits. Pro plans offer unlimited transcription.

**Q: Which processing method should I use?**
A: Use local processing for privacy and offline use. Use cloud processing for speed and convenience.

**Q: Can I use this commercially?**
A: Yes! The MIT license allows commercial use.

**Q: How do I change the hotkey?**
A: Open the Control Panel (right-click tray icon) and go to Settings. You can set any key as your hotkey.

**Q: Is my data secure?**
A: With local processing, your audio never leaves your device. With cloud processing, audio is processed on Akash Network infrastructure.

**Q: What languages are supported?**
A: Akash Scribe supports 58 languages including English, Spanish, French, German, Chinese, Japanese, and more. Set your preferred language in the .env file or use auto-detect.

**Q: What is Agent Mode?**
A: Agent Mode opens a chat overlay where you can have interactive AI conversations using voice. It supports streaming responses from all providers (OpenAI, Anthropic, Gemini, Groq, local) and saves conversation history.

**Q: How does meeting transcription work?**
A: Connect your Google Calendar in Integrations. When a meeting starts (Zoom, Teams, FaceTime), Akash Scribe detects it and offers to record. Audio is transcribed in real-time via OpenAI Realtime API. On macOS, screen recording permission is required to capture meeting audio.

**Q: Where are my notes stored?**
A: Notes are stored locally in SQLite with optional cloud sync. They support full-text search (FTS5), folder organization, and AI-powered enhancement actions.

**Q: Does Akash Scribe require Input Monitoring on macOS?**
A: No. As of v1.6.0, Akash Scribe uses NSEvent monitors instead of CGEvent taps, eliminating the Input Monitoring permission requirement. Only Microphone and Accessibility permissions are needed (plus Screen Recording for meeting features).

## Project Status

Akash Scribe is actively maintained and ready for production use.

- ✅ Core dictation with local and cloud processing
- ✅ Cross-platform support (macOS, Windows, Linux)
- ✅ Akash Scribe Cloud with account system, usage tracking, and subscription management
- ✅ Multi-provider AI (OpenAI, Anthropic, Gemini, Groq, Mistral, Local)
- ✅ Agent Mode with streaming chat overlay and conversation history
- ✅ Google Calendar integration with automatic meeting detection
- ✅ Live meeting transcription via OpenAI Realtime API
- ✅ Notes system with FTS5 search, cloud sync, folders, and AI actions
- ✅ Audio retention with playback and retry for failed transcriptions
- ✅ Cmd+K command search across notes and transcripts
- ✅ Auto-pause media playback during dictation
- ✅ Custom dictionary with auto-learn correction monitoring
- ✅ NVIDIA Parakeet support via sherpa-onnx
- ✅ Compound hotkeys and Windows Push-to-Talk
- ✅ GNOME Wayland native global shortcuts
- ✅ Referral program with shareable invite cards

## Acknowledgments

- **[Akash Network](https://akash.network/)** - Decentralized cloud infrastructure powering Akash Scribe Cloud
- **[OpenAI Whisper](https://github.com/openai/whisper)** - The speech recognition model that powers both local and cloud transcription
- **[whisper.cpp](https://github.com/ggerganov/whisper.cpp)** - High-performance C++ implementation of Whisper for local processing
- **[NVIDIA Parakeet](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3)** - Fast ASR model for efficient local transcription
- **[sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx)** - Cross-platform ONNX runtime for Parakeet model inference
- **[Electron](https://www.electronjs.org/)** - Cross-platform desktop application framework
- **[React](https://react.dev/)** - UI component library
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful UI components built on Radix primitives
- **[Hugging Face](https://huggingface.co/)** - Model hosting platform for our local speech recognition and language models
- **[llama.cpp](https://github.com/ggerganov/llama.cpp)** - Local LLM inference for AI-powered text processing
