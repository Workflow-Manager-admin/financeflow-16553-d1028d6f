# vue-kavia

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Common Development & Preview Issues

### Port Conflicts / Blank Preview

If your app does not appear in the preview, or your dev server fails to start with a message like `Port 3000 is already in use`:

- The dev server will automatically try the next free port (e.g., 3001, 3002...) if 3000 is unavailable.
- Make sure your preview browser/iframe is pointed to the correct port shown when running `npm run dev`.
- If you see nothing in the preview, double-check you are accessing the correct port.

### SIGTERM / Exit Code 143 in Builds

If you see a build error with code 143/SIGTERM in CI or scripts (not in local dev):

- This is not a problem with your code or configuration. It means the environment or runner terminated your command (timeout, kill, CI resource limits).
- Try increasing the timeout for your build/lint in your environment/CI runner, or re-run.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
