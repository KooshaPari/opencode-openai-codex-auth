# Configuration Examples

This directory contains example opencode configuration files for the OpenAI Codex OAuth plugin.

## Files

### minimal-opencode.json
The simplest possible configuration using plugin defaults.

```bash
cp config/minimal-opencode.json ~/.config/opencode/opencode.json
```

This uses default settings:
- `reasoningEffort`: "medium"
- `reasoningSummary`: "auto"
- `textVerbosity`: "medium"
- `include`: ["reasoning.encrypted_content"]
- `store`: false (required for AI SDK 2.0.50+ compatibility)

### full-opencode.json
Complete configuration example showing all model variants with custom settings.

```bash
cp config/full-opencode.json ~/.config/opencode/opencode.json
```

This demonstrates:
- Global options for all models
- Per-model configuration overrides
- All supported OpenAI models (gpt-5-codex, gpt-5, gpt-5-mini, gpt-5-nano)
- Cursor CLI models (auto, gpt-4, sonnet-4.5, gemini-2.5-pro, claude-4.5-thinking, deepseek-v3.1, grok-3-beta)
- Augment CLI models (default, gpt-4, claude-4.5, claude-4.5-thinking, sonnet-4.5, opus-4.1)

### plugin-config-example.json
Example plugin configuration for multi-provider setup (cursor/augment support).

```bash
cp config/plugin-config-example.json ~/.opencode/openai-codex-auth-config.json
```

This configures:
- Provider priority and fallback behavior
- Codex, Cursor, and Augment CLI settings
- Auto-fallback between providers

## Usage

1. Choose a configuration file based on your needs
2. Copy it to your opencode config directory:
   - Global: `~/.config/opencode/opencode.json`
   - Project: `<project>/.opencode.json`
3. Modify settings as needed
4. Run opencode: `opencode run "your prompt"`

## Configuration Options

See the main [README.md](../README.md#configuration) for detailed documentation of all configuration options.
