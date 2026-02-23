Skip to main content
Augment home pagedark logo
Search...


Navigation
Auggie CLI
Using Auggie with Automation
Auggie CLI
Using Auggie with Automation
Auggie was designed to not just be a powerful agent to write code, but to automate all the tasks that are needed to build software at scale.

​
About automation
Auggie was purpose built to integrate into your software development stack. From using Auggie in your local development workflows to automatically running Auggie in your CI/CD pipelines, Auggie can help you build better software faster.
​
Example use cases
Code reviews: Review code changes and provide feedback.
Issue triage: Triage incoming issues and route them to the appropriate team or individual.
Automate on-call: Respond to incoming alerts and create an assessment plan.
Exception management: Analyze incoming exceptions and create tickets.
​
Integrating with your workflows
In order to use Auggie in your systems, like a CI/CD pipeline, you’ll need to install Auggie CLI, provide a session token, and write an instruction that will be used alongside any data from your system you want to include.
​
Installation
Auggie can be installed directly from npm anywhere you can run Node 22 or later including VMs, serverless functions, and containers. You will also need to install any dependencies for defined MCP servers in those environments.

Copy

Ask AI
npm install -g @augmentcode/auggie
​
Authentication
Session tokens are associated with the user that created it, and Auggie will run with integration configurations from that user. See Authentication for full details. You can override the user’s GitHub configuration by passing --github-api-token <token>.

Copy

Ask AI
# First, login to Augment with the CLI
auggie --login

# Next, output your token
auggie --print-augment-token

# Then, pass your token to auggie
AUGMENT_SESSION_AUTH='<token>' auggie --print "Summarize the build failure"
​
Scripts and pipes
Auggie runs as a subprocess, so it can be used in any shell script. It can be used just like any command-line tool that follows the Unix philosophy. You can pipe data into Auggie and then pipe the response to another command. Data passed into Auggie through stdin will be used as context in addition to the instruction.

Copy

Ask AI
# Pipe data through stdin
cat build.log | auggie --print "Summarize the failure and open a Linear ticket"

# Provide input from a file
auggie --compact --instruction /path/to/instruction.md < build.log
​
GitHub Actions
GitHub Actions makes it easy to connect Auggie to other parts of your software development pipeline, from linting, testing, build, and deploy. We’ve built a simple wrapper for Auggie that enables you to integrate with GitHub Action workflows and build custom tooling around Auggie.
Follow the instructions to configure Augment Agent in GitHub Actions and explore the example-workflows directory to get started.
​
Ready to use workflows
Get started using Auggie in GitHub Actions immediately by following the instructions for setup and deploy in one of the following workflows, or use the /github-workflow wizard in Auggie to have the workflows generated for you.
PR Description: This action automatically analyzes your PR changes and generates comprehensive, informative descriptions.
PR Review: This action automatically analyzes your PR changes and generates comprehensive, informative reviews
Need even more help building GitHub Actions? May we suggest asking Auggie.

Copy

Ask AI
auggie "Help me build a GitHub Action to..."
Rules & Guidelines
Permissions
Ask a question...

x
github
linkedin
Powered by Mintlify
Using Auggie with Automation - Augment
