# Login and authentication

> You will need an active account and valid session token to use Auggie CLI which you can get by following the instructions below.

## About authentication

Before you can use Auggie, you will need to login to create a session token that can be used by Auggie in both interactive and automation modes.

<Note>Augment authentication tokens are secrets and should be protected with the same level of security you'd use for any sensitive credential. Tokens are tied to the user who logged in, not to your team or enterprise account, so each user has a unique augment token.</Note>

## Logging in

You can login by running the following command and following the prompts.

```sh  theme={null}
auggie --login
```

## Logging out

You can logout by running the following command. This will remove the local token from your machine and you will need to login again to use Auggie.

```sh  theme={null}
auggie --logout
```

## Getting your token

For automation, you will need to provide your token each time you run Auggie. After you have logged in above, you can get your token by running the following command.

```sh  theme={null}
auggie --print-augment-token
```

## Using your token

After you have your token, you can pass it to Auggie through a number of methods depending on your use case and environment.

### Environment variables

You can set the `AUGMENT_SESSION_AUTH` environment variable to your token before running Auggie. Pass it before you run the command, add it to your environment, or add it to your shell's rc file to persist it.

```sh  theme={null}
AUGMENT_SESSION_AUTH='<token>'
```

### Token file

You can store the token as plaintext in a file and then use the `--token-file` flag to pass it to Auggie. We do not recommend checking your token into version control.

```sh  theme={null}
auggie --token-file /path/to/token
```

## Revoking your tokens

You can expire all the tokens for the current logged in user by running the following command. Using `--logout` will only remove the local token from your machine.

```sh  theme={null}
auggie --revoke-all-augment-tokens
```

