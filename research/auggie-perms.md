# Tool Permissions

> Control what tools Auggie CLI can execute with granular permission settings for security and compliance. Tool permissions configured will only work inside the CLI and not in the Augment code extension.

export const Command = ({text}) => <span className="font-bold">{text}</span>;

export const Keyboard = ({shortcut}) => <span className="inline-block border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-gray-800 rounded-md text-xs text-gray font-bold px-1 py-0.5">
    {shortcut}
  </span>;

## About Tool Permissions

Auggie CLIs tool permission system provides fine-grained control over what actions the agent can perform in your environment. This security layer ensures that Auggie only executes approved operations, protecting your codebase and system from unintended changes.

Tool permissions are especially important when:

* Running Auggie in production environments
* Working with sensitive codebases
* Enforcing organizational security policies
* Using Auggie in automated workflows

## How Permissions Work

When Auggie attempts to use a tool, the permission system:

1. **Checks for matching rules** in your configuration
2. **Applies the first matching rule** based on tool name and optional patterns
3. **Rules are evaluated top-down** - first match wins
4. **Prompts for approval** when set to ask-user mode (interactive only)

### Permission Flow

```
Tool Request → Check Rules → Apply Permission → Execute/Deny → Log Decision
```

### Notes on Unmatched Tools

* Rules are evaluated in order from top to bottom
* The first matching rule determines the permission
* If no rules match, the CLI follows its implicit runtime behavior
* Configure explicit rules for all tools you want to control

## Configuration Files

Tool permissions are configured through `settings.json` files with clear precedence:

### File Locations

1. **User settings**: `~/.augment/settings.json`
   * Personal preferences that apply to all your projects
   * Ideal for your default security stance

2. **Project settings**: `<workspace>/.augment/settings.json`
   * Repository-specific rules shared with your team
   * Perfect for project-specific security requirements

<Note>Settings are merged with later files taking precedence. Project settings override user settings.</Note>

## Basic Configuration

### Creating Rules

Rules define permissions for specific tools. Each rule can specify:

* **Tool name** - The specific tool to control
* **Permission type** - `allow`, `deny`, or `ask-user`
* **Optional patterns** - For shell commands, use regex matching

### Basic Rule Structure

```json  theme={null}
{
  "tool-permissions": [
    { "toolName": "launch-process", "permission": { "type": "deny" } },
    { "toolName": "view", "permission": { "type": "allow" } }
  ]
}
```

### Allow List Configuration

Create an explicit allow list by only allowing specific tools:

```json  theme={null}
{
  "tool-permissions": [
    { "toolName": "view", "permission": { "type": "allow" } },
    { "toolName": "codebase-retrieval", "permission": { "type": "allow" } },
    { "toolName": "grep-search", "permission": { "type": "allow" } },
    { "toolName": "github-api", "permission": { "type": "allow" } }
  ]
}
```

<Note>This configuration explicitly allows only the listed tools. Tools not in this list will follow the CLI's implicit behavior.</Note>

### Block List Configuration

Create a block list by explicitly denying specific dangerous tools:

```json  theme={null}
{
  "tool-permissions": [
    { "toolName": "remove-files", "permission": { "type": "deny" } },
    { "toolName": "kill-process", "permission": { "type": "deny" } },
    { "toolName": "launch-process", "shellInputRegex": "^(rm|sudo|shutdown|reboot)", "permission": { "type": "deny" } }
  ]
}
```

<Note>This configuration blocks specific dangerous operations. Tools not explicitly denied will follow the CLI's implicit behavior.</Note>

### Mix and Match Configuration

Combine allow, deny, and ask-user rules for fine-grained control:

```json  theme={null}
{
  "tool-permissions": [
    { "toolName": "view", "permission": { "type": "allow" } },
    { "toolName": "codebase-retrieval", "permission": { "type": "allow" } },
    { "toolName": "grep-search", "permission": { "type": "allow" } },

    { "toolName": "str-replace-editor", "permission": { "type": "ask-user" } },
    { "toolName": "save-file", "permission": { "type": "ask-user" } },

    { "toolName": "launch-process", "shellInputRegex": "^(npm test|npm run lint|git status|git diff)", "permission": { "type": "allow" } },
    { "toolName": "launch-process", "shellInputRegex": "^(rm -rf|sudo|chmod 777)", "permission": { "type": "deny" } },
    { "toolName": "launch-process", "permission": { "type": "ask-user" } },

    { "toolName": "remove-files", "permission": { "type": "deny" } }
  ]
}
```

This configuration provides fine-grained control with different permission levels based on tool risk and usage patterns.

## Available Tools

### Process Management

| Tool             | Description                        |
| :--------------- | :--------------------------------- |
| `launch-process` | Execute shell commands and scripts |
| `read-process`   | Read output from running processes |
| `write-process`  | Send input to running processes    |
| `list-processes` | List all active processes          |
| `kill-process`   | Terminate running processes        |

### File Operations

| Tool                 | Description                         |
| :------------------- | :---------------------------------- |
| `view`               | Read file contents                  |
| `str-replace-editor` | Edit files with find/replace        |
| `save-file`          | Create or overwrite files           |
| `remove-files`       | Delete files from the filesystem    |
| `codebase-retrieval` | Search codebase with context engine |
| `grep-search`        | Search files with regex patterns    |

### External Services

| Tool         | Description                  |
| :----------- | :--------------------------- |
| `github-api` | GitHub API operations        |
| `linear`     | Linear issue tracking        |
| `notion`     | Notion workspace access      |
| `supabase`   | Supabase database operations |
| `web-search` | Web search queries           |
| `web-fetch`  | Fetch web page content       |

### MCP Server Tools

MCP tools follow the pattern `{tool-name}_{server-name}`:

* Example: `query_database-mcp`
* Truncated to 64 characters if longer
* Treated like any other tool for permissions

## Advanced Rules

### Shell Command Filtering

Control which shell commands can be executed using regex patterns:

```json  theme={null}
{
  "tool-permissions": [
    { "toolName": "launch-process", "shellInputRegex": "^(ls|pwd|echo|cat|grep)\\s", "permission": { "type": "allow" } },
    { "toolName": "launch-process", "permission": { "type": "deny" } }
  ]
}
```

This configuration:

1. Allows only safe commands (ls, pwd, echo, cat, grep)
2. Denies all other shell commands
3. Rules are evaluated in order - first match wins

### Event-Based Permissions

Control when permission checks occur:

```json  theme={null}
{
  "tool-permissions": [
    { "toolName": "github-api", "eventType": "tool-response", "permission": { "type": "allow" } }
  ]
}
```

**Event types:**

* **`tool-call`** (default) - Check before tool execution
* **`tool-response`** - Check after execution but before returning results to agent

## Interactive Approval

When using `ask-user` mode in interactive sessions, Auggie displays approval prompts:

```
🔒 Tool Approval Required
─────────────────────────
Tool: launch-process
Command: npm install express

[A]llow once  [D]eny  [Always allow]  [Never allow]
```

### Keyboard Shortcuts

| Key   | Action                      |
| :---- | :-------------------------- |
| `A`   | Allow this specific request |
| `D`   | Deny this specific request  |
| `Y`   | Always allow this tool      |
| `N`   | Never allow this tool       |
| `Esc` | Cancel and deny request     |

<Note>In non-interactive mode (--print), ask-user permissions default to deny for security.</Note>

## Common Configurations

### Read-Only Mode

Allow only read operations, perfect for code review and analysis:

```json  theme={null}
{
  "tool-permissions": [
    { "toolName": "view", "permission": { "type": "allow" } },
    { "toolName": "codebase-retrieval", "permission": { "type": "allow" } },
    { "toolName": "grep-search", "permission": { "type": "allow" } },
    { "toolName": "web-search", "permission": { "type": "allow" } },
    { "toolName": "web-fetch", "permission": { "type": "allow" } },
    { "toolName": "str-replace-editor", "permission": { "type": "deny" } },
    { "toolName": "save-file", "permission": { "type": "deny" } },
    { "toolName": "remove-files", "permission": { "type": "deny" } },
    { "toolName": "launch-process", "permission": { "type": "deny" } }
  ]
}
```

### Development Mode

Add safety guards for potentially dangerous operations:

```json  theme={null}
{
  "tool-permissions": [
    { "toolName": "remove-files", "permission": { "type": "ask-user" } },
    {
      "toolName": "launch-process",
      "shellInputRegex": "^(rm|sudo|chmod)\\s",
      "permission": { "type": "ask-user" }
    }
  ]
}
```

### CI/CD Pipeline

Restrictive settings for automated workflows:

```json  theme={null}
{
  "tool-permissions": [
    { "toolName": "view", "permission": { "type": "allow" } },
    { "toolName": "str-replace-editor", "permission": { "type": "allow" } },
    { "toolName": "save-file", "permission": { "type": "allow" } },
    {
      "toolName": "launch-process",
      "shellInputRegex": "^(npm test|npm run lint|jest)\\s",
      "permission": { "type": "allow" }
    },
    { "toolName": "remove-files", "permission": { "type": "deny" } },
    { "toolName": "launch-process", "permission": { "type": "deny" } }
  ]
}
```

## Custom Policies

### Webhook Validation

Use external services to validate tool requests:

```json  theme={null}
{
  "tool-permissions": [
    { "toolName": "github-api", "permission": { "type": "webhook-policy", "webhookUrl": "https://api.company.com/validate-tool" } }
  ]
}
```

The webhook receives:

```json  theme={null}
{
  "toolName": "github-api",
  "eventType": "tool-call",
  "details": { /* tool-specific data */ },
  "timestamp": "2025-01-01T02:41:40.580Z"
}
```

Expected response:

```json  theme={null}
{
  "allow": true,
  "output": "Optional message to include in agent response"
}
```

### Script Validation

Use local scripts for complex validation logic:

```json  theme={null}
{
  "tool-permissions": [
    { "toolName": "launch-process", "permission": { "type": "script-policy", "script": "/path/to/validate-command.sh" } }
  ]
}
```

## Best Practices

1. **Be Explicit**: Define clear rules for all tools you want to control
2. **Layer Settings**: Use user settings for defaults, project settings for team rules
3. **Test Configurations**: Verify permissions work as expected before automation
4. **Log Decisions**: Monitor which tools are being allowed/denied for audit trails
5. **Regular Reviews**: Periodically review and update permission rules
6. **Order Matters**: Remember that rules are evaluated top-down, first match wins

## Troubleshooting

**Ask-User Mode in Automation:**

* Ask-user permissions automatically deny in non-interactive mode
* Use explicit allow/deny rules for automation scenarios
* Consider webhook or script policies for dynamic decisions

**MCP Tools Not Recognized:**

* Ensure MCP server name follows `{tool}_{server}` pattern
* Check for 64-character truncation on long names
* Verify MCP server is properly configured and running

## Security Considerations

* **Never commit sensitive webhook URLs** to version control
* **Use `.augment/settings.local.json`** for personal security overrides
* **Regularly audit** tool usage in production environments
* **Implement defense in depth** with multiple permission layers
* **Test permission changes** in isolated environments first

## Related Features

* [Authentication](/cli/setup-auggie/authentication) - Secure access to Auggie
* [Custom Rules](/cli/rules) - Project-specific guidelines
* [MCP Integrations](/cli/integrations) - External tool configuration
* [Automation](/cli/automation) - Using permissions in CI/CD

