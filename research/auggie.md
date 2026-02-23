Skip to main content
Augment home pagedark logo
Search...


Navigation
Auggie CLI
CLI Flags and Options
Auggie CLI
CLI Flags and Options
A comprehensive reference for all command-line flags available in the Auggie CLI.

​
CLI flags
Command	Description
auggie	Start Auggie in interactive mode
auggie --print (-p)	Output simple text for one instruction and exit
auggie --quiet	Output only the final response for one instruction and exit
auggie --compact	Output tool calls, results, and final response as one line each and exit
auggie -p --output-format json	Output the response in structured JSON format. Must be used with --print (-p) mode. Useful for parsing Auggie’s output programmatically in automation workflows.
​
Input
Command	Description
auggie "Fix the typescript errors"	Provide an initial instruction in interactive mode
auggie --print "Summarize the staged changes"	Provide an instruction and exit
cat file | auggie --print "Summarize this data"	Pipe content through stdin
auggie --print "Summarize this data" < file.txt	Provide input from a file
auggie --instruction "Fix the errors"	Provide an initial instruction in interactive mode
auggie --instruction-file /path/to/file.txt	Provide an instruction by file in interactive mode
​
Custom Commands
Command	Description
auggie command <command-name>	Execute a custom command from .augment/commands/ or ~/.augment/commands/
Custom commands are reusable instructions stored as markdown files. They can be placed in:
~/.augment/commands/<name>.md - Global commands (user-wide)
./.augment/commands/<name>.md - Project commands (workspace-specific)
~/.claude/commands/<name>.md - Claude Code user commands
./.claude/commands/<name>.md - Claude Code workspace commands
Commands are resolved in order of precedence, with Auggie-specific locations taking priority over Claude Code locations.
Examples:

Copy

Ask AI
# Execute a custom deployment command
auggie command deploy-staging

# Execute a code review command
auggie command security-review

# List available commands (shown in help output)
auggie command help
See Custom Commands for detailed information on creating and managing custom commands.
​
Sessions
Command	Description
auggie --continue (-c)	Resumes the previous conversation
auggie --dont-save-session	Do not save the conversation to the local history
auggie --delete-saved-sessions	Delete all saved sessions from disk
​
Configuration
Command	Description
auggie --workspace-root /path/to/project	Specify the root of the workspace
auggie --rules /path/to/rules.md	Additional rules to append to workspace guidelines
auggie --model "name"	Select the model to use (accepts long or short names from the model list)
​
Models
List out available models and their short names to be passed into the --model flag
Command	Description
auggie --list-models	List available models
auggie -lm	Shorthand for --list-models
Tool permissions can be configured in settings.json files. See Permissions for detailed configuration.
​
MCP and integrations
Command	Description
auggie mcp add [options] <name>	Create or update a named MCP server configuration
auggie mcp add-json <name> <json>	Add an MCP server from JSON configuration
auggie mcp list	Display all configured MCP servers
auggie mcp remove <name>	Remove a named MCP server configuration
Command	Description
auggie --mcp-config {key: value}	MCP configuration as a JSON string
auggie --mcp-config /path/to/mcp.json	MCP configuration from a JSON file
You can define MCP servers persistently in the settings files: ~/.augment/settings.json. Any --mcp-config flags are applied last and override settings.
For detailed usage examples, options, settings.json format, and precedence rules, see Integrations and MCP.
​
Authentication
Command	Description
auggie --login	Login to Augment and store the token locally
auggie --logout	Remove the locally stored token
auggie --print-augment-token	Print the locally stored token
​
Additional commands
Command	Description
auggie --help	Show help
auggie --version	Show version
​
Environment Variables
Variable	Description
AUGMENT_SESSION_AUTH	Authentication JSON.
AUGMENT_API_URL	Backend API endpoint
AUGMENT_API_TOKEN	Authentication token
GITHUB_API_TOKEN	GitHub API token
AUGMENT_DISABLE_AUTO_UPDATE	Disable automatic CLI updates
​
See Also
Custom Rules and Guidelines - Configure custom rules for project-specific guidance
Custom Commands - Create reusable command templates
Permissions - Configure tool permissions and security
Integrations - Connect external tools and services
Integrations and MCP
Automatic Updates
Ask a question...

x
github
linkedin
Powered by Mintlify

