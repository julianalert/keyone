# keyone-cli

Routes a codebase's AI calls through [key.one](https://getkeyone.com) with one project key.

```bash
npx keyone-cli setup           # asks for the key (hidden), writes env, finds SDK call sites, test call
npx keyone-cli setup --apply   # also edits the constructor calls it recognises
npx keyone-cli test            # one test call with the key already in the env file
```

The key is read from `--key`, `KEYONE_API_KEY`, the env file, the clipboard (`--from-clipboard`) or a hidden prompt. It is never printed.

Without npm: `curl -fsSL https://getkeyone.com/setup.js | node - setup`
