# MyLinked

## How theming works

The app uses a global `ThemeProvider` and daisyUI themes. On load the provider
fetches the current user via `/api/user`, applies the saved theme to the root
`<html>` element, and stores the value in `localStorage` for early paints. Users
can update their theme and it is persisted with `/api/profile` using an
optimistic UI update.

To add a new theme, ensure the theme name is available in `tailwind.config.ts`
under the `daisyui.themes` array and then call `setTheme('<themeName>')` from
components using `useTheme()`.
