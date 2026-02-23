Using Agent in CLI
Prompting
Stating intent clearly is recommended for the best results. For example, you can use the prompt "do not write any code" to ensure that the agent won't edit any files. This is generally helpful when planning tasks before implementing them.

Agent currently has tools for file operations, searching, and running shell commands. More tools are being added, similar to the IDE agent.

MCP
Agent supports MCP (Model Context Protocol) for extended functionality and integrations. The CLI will automatically detect and respect your mcp.json configuration file, enabling the same MCP servers and tools that you've configured for the IDE.

Rules
The CLI agent supports the same rules system as the IDE. You can create rules in the .cursor/rules directory to provide context and guidance to the agent. These rules will be automatically loaded and applied based on their configuration, allowing you to customize the agent's behavior for different parts of your project or specific file types.

The CLI also reads AGENTS.md and CLAUDE.md at the project root (if present) and applies them as rules alongside .cursor/rules.

Working with Agent
Navigation
Previous messages can be accessed using arrow up (ArrowUp) where you can cycle through them.

Review
Review changes with Ctrl+R. Press i to add follow-up instructions. Use ArrowUp/ArrowDown to scroll, and ArrowLeft/ArrowRight to switch files.

Selecting context
Select files and folders to include in context with @. Free up space in the context window by running /compress. See Summarization for details.

History
Continue from an existing thread with --resume [thread id] to load prior context.

To resume the most recent conversation, use cursor-agent resume.

You can also run cursor-agent ls to see a list of previous conversations.

Command approval
Before running terminal commands, CLI will ask you to approve (y) or reject (n) execution.

Non-interactive mode
Use -p or --print to run Agent in non-interactive mode. This will print the response to the console.

With non-interactive mode, you can invoke Agent in a non-interactive way. This allows you to integrate it in scripts, CI pipelines, etc.

You can combine this with --output-format to control how the output is formatted. For example, use --output-format json for structured output that's easier to parse in scripts, or --output-format text for plain text output of the agent's final response.


Using Headless CLI | Cursor Docs
Skip to main content
Docs
CLI
Learn

Search docs...
⌘K
Ask AI⌘I
Sign in
Command Palette
Search for a command to run...


Get Started
Overview
Installation
Using Agent in CLI
Shell Mode
MCP
Headless
Using Headless CLI
GitHub Actions

Cookbook
Reference
Slash commands
Parameters
Authentication
Permissions
Configuration
Output Format
Headless
Using Headless CLI
Use Cursor CLI in scripts and automation workflows for code analysis, generation, and refactoring tasks.

How it works
Use print mode (-p, --print) for non-interactive scripting and automation.

File modification in scripts
Combine --print with --force to modify files in scripts:


# Enable file modifications in print mode
cursor-agent -p --force "Refactor this code to use modern ES6+ syntax"
# Without --force, changes are only proposed, not applied
cursor-agent -p "Add JSDoc comments to this file"  # Won't modify files
# Batch processing with actual file changes
find src/ -name "*.js" | while read file; do
  cursor-agent -p --force "Add comprehensive JSDoc comments to $file"
done
The --force flag allows the agent to make direct file changes without confirmation

Setup
See Installation and Authentication for complete setup details.


# Install Cursor CLI
curl https://cursor.com/install -fsS | bash
# Set API key for scripts
export CURSOR_API_KEY=your_api_key_here
cursor-agent -p "Analyze this code"
Example scripts
Use different output formats for different script needs. See Output format for details.

Searching the codebase
By default, --print uses text format for clean, final-answer-only responses:


#!/bin/bash
# Simple codebase question - uses text format by default
cursor-agent -p "What does this codebase do?"
Automated code review
Use --output-format json for structured analysis:


#!/bin/bash
# simple-code-review.sh - Basic code review script
echo "Starting code review..."
# Review recent changes
cursor-agent -p --force --output-format text \
  "Review the recent code changes and provide feedback on:
  - Code quality and readability
  - Potential bugs or issues
  - Security considerations
  - Best practices compliance
  Provide specific suggestions for improvement and write to review.txt"
if [ $? -eq 0 ]; then
  echo "✅ Code review completed successfully"
else
  echo "❌ Code review failed"
  exit 1
fi
Real-time progress tracking
Use --output-format stream-json for message-level progress tracking, or add --stream-partial-output for incremental streaming of deltas:


#!/bin/bash
# stream-progress.sh - Track progress in real-time
echo "🚀 Starting stream processing..."
# Track progress in real-time
accumulated_text=""
tool_count=0
start_time=$(date +%s)
cursor-agent -p --force --output-format stream-json --stream-partial-output \
  "Analyze this project structure and create a summary report in analysis.txt" | \
  while IFS= read -r line; do
    
    type=$(echo "$line" | jq -r '.type // empty')
    subtype=$(echo "$line" | jq -r '.subtype // empty')
    
    case "$type" in
      "system")
        if [ "$subtype" = "init" ]; then
          model=$(echo "$line" | jq -r '.model // "unknown"')
          echo "🤖 Using model: $model"
        fi
        ;;
        
      "assistant")
        # Accumulate incremental text deltas for smooth progress
        content=$(echo "$line" | jq -r '.message.content[0].text // empty')
        accumulated_text="$accumulated_text$content"
        
        # Show live progress (updates with each character delta)
        printf "\r📝 Generating: %d chars" ${#accumulated_text}
        ;;
      "tool_call")
        if [ "$subtype" = "started" ]; then
          tool_count=$((tool_count + 1))
          # Extract tool information
          if echo "$line" | jq -e '.tool_call.writeToolCall' > /dev/null 2>&1; then
            path=$(echo "$line" | jq -r '.tool_call.writeToolCall.args.path // "unknown"')
            echo -e "\n🔧 Tool #$tool_count: Creating $path"
          elif echo "$line" | jq -e '.tool_call.readToolCall' > /dev/null 2>&1; then
            path=$(echo "$line" | jq -r '.tool_call.readToolCall.args.path // "unknown"')
            echo -e "\n📖 Tool #$tool_count: Reading $path"
          fi
        elif [ "$subtype" = "completed" ]; then
          # Extract and show tool results
          if echo "$line" | jq -e '.tool_call.writeToolCall.result.success' > /dev/null 2>&1; then
            lines=$(echo "$line" | jq -r '.tool_call.writeToolCall.result.success.linesCreated // 0')
            size=$(echo "$line" | jq -r '.tool_call.writeToolCall.result.success.fileSize // 0')
            echo "   ✅ Created $lines lines ($size bytes)"
          elif echo "$line" | jq -e '.tool_call.readToolCall.result.success' > /dev/null 2>&1; then
            lines=$(echo "$line" | jq -r '.tool_call.readToolCall.result.success.totalLines // 0')
            echo "   ✅ Read $lines lines"
          fi
        fi
        ;;
      "result")
        duration=$(echo "$line" | jq -r '.duration_ms // 0')
        end_time=$(date +%s)
        total_time=$((end_time - start_time))
        echo -e "\n\n🎯 Completed in ${duration}ms (${total_time}s total)"
        echo "📊 Final stats: $tool_count tools, ${#accumulated_text} chars generated"
        ;;
    esac
  done
How it works
File modification in scripts
Setup
Example scripts
Searching the codebase
Automated code review
Real-time progress tracking

Copy page

Share feedback

Explain more


Ask questions about the docs
Agent

claude-sonnet-4.5

Tokenizer Off
Context: 0/200k (0%)

