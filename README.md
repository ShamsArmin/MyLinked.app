# MyLinked Theming

## How theming works
The application uses [daisyUI](https://daisyui.com/) themes. The current user's theme is loaded on start and applied by setting the `data-theme` attribute on the `<html>` element. The theme value is stored in `localStorage` for an early paint and persisted on the server.

A small inline script in `index.html` reads the last theme from `localStorage` and applies it immediately to avoid a flash of the wrong theme. The `ThemeProvider` then fetches the user via `/api/user` and synchronises any updates with `/api/profile`.

## Adding a new theme
1. Add the theme name to the `daisyui.themes` array in `tailwind.config.ts`.
2. Update any components as needed to use semantic classes such as `bg-base-100`, `bg-base-200`, `text-base-content`, and `border-base-200`.
3. Use the `useTheme()` hook to change the theme with `setTheme("<theme>")`.
