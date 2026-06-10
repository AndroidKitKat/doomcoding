# Doomcoding

A VS Code extension that lets you doomscroll from inside VS Code while Claude Code or another AI coding agent works next to it.

## One-click flow

1. Install/open the extension in VS Code.
2. Click `$(play) Doomcoding` in the status bar, or run `Doomcoding: Start Scrolling` from the Command Palette.
3. Sign in if the feed asks you to.
4. Keep the feed open beside your AI agent while it works.

By default Doomcoding opens TikTok in VS Code's built-in Simple Browser and moves it beside your current editor. That keeps the user flow intentionally low-effort: click once, sign in if needed, scroll.

## Brainrot feeds

Doomcoding includes presets for:

- TikTok
- Instagram Reels
- YouTube Shorts
- X Explore
- Reddit Popular
- Twitch

Run `Doomcoding: Brainrot Roulette` when you do not even want to pick. It randomly opens one of the preset feeds.

## Commands

- `Doomcoding: Start Scrolling` opens your configured default feed immediately.
- `Doomcoding: Pick Feed` shows the full preset list, the last feed you used, Brainrot Roulette, and a custom URL option.
- `Doomcoding: Brainrot Roulette` opens a random preset feed.
- `Doomcoding: Open TikTok` opens TikTok directly.
- `Doomcoding: Open Instagram Reels` opens Reels directly.
- `Doomcoding: Open YouTube Shorts` opens Shorts directly.
- `Doomcoding: Open X Explore` opens X Explore directly.
- `Doomcoding: Open Reddit Popular` opens Reddit Popular directly.
- `Doomcoding: Open Twitch` opens Twitch directly.
- `Doomcoding: Open Custom Feed` prompts for a URL and remembers it as your last feed.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `doomcoding.defaultFeed` | `tiktok` | Feed opened by `Doomcoding: Start Scrolling` and the status bar button. Use `instagram`, `youtubeShorts`, `x`, `redditPopular`, `twitch`, `random`, `custom`, or `last` if preferred. |
| `doomcoding.openMode` | `simpleBrowser` | Uses VS Code's built-in Simple Browser for the easiest sign-in/cookie flow. Set to `embeddedWebview` for Doomcoding's custom fallback panel. |
| `doomcoding.customFeedUrl` | `https://www.youtube.com/shorts` | URL opened when the default feed is `custom` or by `Doomcoding: Open Custom Feed`. |
| `doomcoding.showStatusBarButton` | `true` | Shows or hides the one-click status bar launcher. |
| `doomcoding.openOnStartup` | `false` | Opens the configured feed automatically after VS Code starts. |

## Notes

Social sites can change their embed, sign-in, autoplay, and playback restrictions at any time. Doomcoding defaults to VS Code Simple Browser instead of a raw iframe because it is less work for users and behaves more like a normal browser tab inside the editor. If a service blocks playback there too, use that panel's normal browser controls or switch `doomcoding.openMode` to `embeddedWebview` for the lightweight fallback panel.

## Development

This extension intentionally uses plain JavaScript and no runtime dependencies.

```bash
npm test
```

To try it locally, open this folder in VS Code and press `F5` to launch an Extension Development Host.

## Release packaging

Build a VSIX package with:

```bash
npm run package
```

The generated `doomcoding-<version>.vsix` file can be uploaded to a GitHub release or installed locally with VS Code's `Extensions: Install from VSIX...` command.
