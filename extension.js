const vscode = require('vscode');

const PRESET_FEEDS = {
  tiktok: {
    id: 'tiktok',
    title: 'TikTok',
    label: '$(device-camera-video) TikTok',
    description: 'For You / Following feed',
    url: 'https://www.tiktok.com/',
    command: 'doomcoding.openTikTok'
  },
  instagram: {
    id: 'instagram',
    title: 'Instagram Reels',
    label: '$(device-camera) Instagram Reels',
    description: 'Reels feed',
    url: 'https://www.instagram.com/reels/',
    command: 'doomcoding.openInstagramReels'
  },
  youtubeShorts: {
    id: 'youtubeShorts',
    title: 'YouTube Shorts',
    label: '$(play-circle) YouTube Shorts',
    description: 'Shorts feed',
    url: 'https://www.youtube.com/shorts',
    command: 'doomcoding.openYouTubeShorts'
  },
  x: {
    id: 'x',
    title: 'X Explore',
    label: '$(comment-discussion) X Explore',
    description: 'Trending posts, video, and discourse',
    url: 'https://x.com/explore',
    command: 'doomcoding.openX'
  },
  redditPopular: {
    id: 'redditPopular',
    title: 'Reddit Popular',
    label: '$(flame) Reddit Popular',
    description: 'Popular posts and infinite-comment rabbit holes',
    url: 'https://www.reddit.com/r/popular/',
    command: 'doomcoding.openRedditPopular'
  },
  twitch: {
    id: 'twitch',
    title: 'Twitch',
    label: '$(broadcast) Twitch',
    description: 'Live streams and clips',
    url: 'https://www.twitch.tv/directory',
    command: 'doomcoding.openTwitch'
  }
};

const LAST_FEED_KEY = 'doomcoding.lastFeed';
let statusBarItem;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  registerCommands(context);
  createStatusBarButton(context);

  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('doomcoding.showStatusBarButton')) {
      updateStatusBarVisibility();
    }
  }));

  if (getConfiguration().get('openOnStartup')) {
    vscode.commands.executeCommand('doomcoding.open');
  }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function registerCommands(context) {
  const presetCommands = getPresetFeeds().map((feed) => (
    vscode.commands.registerCommand(feed.command, () => openFeed(context, feed))
  ));

  context.subscriptions.push(
    vscode.commands.registerCommand('doomcoding.open', () => openDefaultFeed(context)),
    vscode.commands.registerCommand('doomcoding.openBrainrotRoulette', () => openRandomFeed(context)),
    vscode.commands.registerCommand('doomcoding.openCustomFeed', async () => {
      const feed = await promptForCustomFeed(context);
      if (feed) {
        openFeed(context, feed);
      }
    }),
    vscode.commands.registerCommand('doomcoding.pickFeed', () => pickFeed(context)),
    ...presetCommands
  );
}

/**
 * @param {vscode.ExtensionContext} context
 */
function createStatusBarButton(context) {
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 90);
  statusBarItem.name = 'Doomcoding';
  statusBarItem.text = '$(play) Doomcoding';
  statusBarItem.tooltip = 'Open your configured doomscroll feed beside the current editor';
  statusBarItem.command = 'doomcoding.open';
  context.subscriptions.push(statusBarItem);
  updateStatusBarVisibility();
}

function updateStatusBarVisibility() {
  if (!statusBarItem) {
    return;
  }

  if (getConfiguration().get('showStatusBarButton')) {
    statusBarItem.show();
  } else {
    statusBarItem.hide();
  }
}

/**
 * @param {vscode.ExtensionContext} context
 */
async function openDefaultFeed(context) {
  const defaultFeed = getConfiguration().get('defaultFeed');

  if (defaultFeed === 'random') {
    return openRandomFeed(context);
  }

  if (defaultFeed === 'custom') {
    return openFeed(context, createCustomFeed(getConfiguredCustomUrl()));
  }

  if (defaultFeed === 'last') {
    const lastFeed = context.globalState.get(LAST_FEED_KEY);
    if (isStoredFeed(lastFeed)) {
      return openFeed(context, lastFeed);
    }
  }

  const feed = PRESET_FEEDS[defaultFeed];
  return openFeed(context, feed || PRESET_FEEDS.tiktok);
}

/**
 * @param {vscode.ExtensionContext} context
 */
function openRandomFeed(context) {
  const feeds = getPresetFeeds();
  const feed = feeds[Math.floor(Math.random() * feeds.length)];
  return openFeed(context, feed);
}

/**
 * @param {vscode.ExtensionContext} context
 */
async function pickFeed(context) {
  const lastFeed = context.globalState.get(LAST_FEED_KEY);
  const items = [
    {
      label: '$(play) Start default feed',
      description: 'Opens instantly using doomcoding.defaultFeed',
      feed: undefined
    },
    {
      label: '$(sparkle) Brainrot Roulette',
      description: 'Randomly opens one preset feed',
      random: true
    },
    ...getPresetFeeds().map((feed) => ({
      label: feed.label,
      description: feed.description,
      detail: feed.url,
      feed
    })),
    {
      label: '$(link) Custom feed URL…',
      description: 'Paste once; Doomcoding remembers it for next time',
      custom: true
    }
  ];

  if (isStoredFeed(lastFeed)) {
    items.splice(1, 0, {
      label: '$(history) Last feed',
      description: lastFeed.title,
      detail: lastFeed.url,
      feed: lastFeed
    });
  }

  const selected = await vscode.window.showQuickPick(items, {
    title: 'Doomcoding',
    placeHolder: 'Pick your brainrot feed'
  });

  if (!selected) {
    return;
  }

  if (selected.random) {
    return openRandomFeed(context);
  }

  if (selected.custom) {
    const feed = await promptForCustomFeed(context);
    if (feed) {
      return openFeed(context, feed);
    }
    return;
  }

  if (!selected.feed) {
    return openDefaultFeed(context);
  }

  return openFeed(context, selected.feed);
}

/**
 * @param {vscode.ExtensionContext} context
 */
async function promptForCustomFeed(context) {
  const lastFeed = context.globalState.get(LAST_FEED_KEY);
  const defaultValue = isStoredFeed(lastFeed) && lastFeed.id === 'custom'
    ? lastFeed.url
    : getConfiguredCustomUrl();
  const url = await vscode.window.showInputBox({
    title: 'Open a doomscroll feed beside your agent',
    prompt: 'Paste any brainrot URL. You only need to do this for custom feeds.',
    value: defaultValue,
    validateInput(value) {
      return isValidHttpUrl(value) ? undefined : 'Enter a valid http:// or https:// URL.';
    }
  });

  return url ? createCustomFeed(url) : undefined;
}

/**
 * @param {vscode.ExtensionContext} context
 * @param {{ id: string, title: string, url: string }} feed
 */
async function openFeed(context, feed) {
  await context.globalState.update(LAST_FEED_KEY, feed);

  if (getConfiguration().get('openMode') === 'embeddedWebview') {
    openEmbeddedWebview(context, feed.title, feed.url);
    return;
  }

  await openSimpleBrowser(context, feed.title, feed.url);
}

/**
 * VS Code's built-in Simple Browser is less work for users than a custom iframe:
 * it keeps browser-like state inside VS Code, supports normal links/popups better,
 * and lets users sign in once without learning extension-specific controls.
 *
 * @param {vscode.ExtensionContext} context
 * @param {string} title
 * @param {string} url
 */
async function openSimpleBrowser(context, title, url) {
  try {
    await vscode.commands.executeCommand('simpleBrowser.show', url);
    await vscode.commands.executeCommand('workbench.action.moveEditorToNextGroup');
  } catch {
    openEmbeddedWebview(context, title, url);
    vscode.window.showInformationMessage('Doomcoding could not open VS Code Simple Browser, so it used the embedded webview instead.');
  }
}

/**
 * @param {vscode.ExtensionContext} context
 * @param {string} title
 * @param {string} url
 */
function openEmbeddedWebview(context, title, url) {
  const panel = vscode.window.createWebviewPanel(
    'doomcoding.feed',
    `Doomcoding: ${title}`,
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'icon.svg');
  panel.webview.html = getWebviewContent(title, url);
}

function getConfiguration() {
  return vscode.workspace.getConfiguration('doomcoding');
}

function getPresetFeeds() {
  return Object.values(PRESET_FEEDS);
}

function getConfiguredCustomUrl() {
  const configuredUrl = getConfiguration().get('customFeedUrl');
  return typeof configuredUrl === 'string' && isValidHttpUrl(configuredUrl)
    ? configuredUrl
    : PRESET_FEEDS.youtubeShorts.url;
}

/**
 * @param {string} url
 */
function createCustomFeed(url) {
  return {
    id: 'custom',
    title: getHostTitle(url),
    label: `$(link) ${getHostTitle(url)}`,
    description: 'Custom doomscroll feed',
    url
  };
}

/**
 * @param {unknown} value
 * @returns {value is { id: string, title: string, url: string }}
 */
function isStoredFeed(value) {
  return Boolean(
    value
    && typeof value === 'object'
    && typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof value.url === 'string'
    && isValidHttpUrl(value.url)
  );
}

/**
 * @param {string} url
 */
function getHostTitle(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Custom Feed';
  }
}

/**
 * @param {string} title
 * @param {string} url
 */
function getWebviewContent(title, url) {
  const nonce = getNonce();
  const safeTitle = escapeHtml(title);
  const safeUrl = escapeAttribute(url);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src https:; img-src https: data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>Doomcoding: ${safeTitle}</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0d1117;
      --panel: #161b22;
      --text: #f0f6fc;
      --muted: #8b949e;
      --accent: #ff3b5c;
      --accent-2: #00f2ea;
      --border: #30363d;
    }

    * { box-sizing: border-box; }

    html, body {
      height: 100%;
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: var(--vscode-font-family, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
    }

    body {
      display: grid;
      grid-template-rows: auto 1fr;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.7rem 0.85rem;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(90deg, rgba(255, 59, 92, 0.18), rgba(0, 242, 234, 0.14)), var(--panel);
    }

    h1 {
      margin: 0;
      font-size: 0.95rem;
      letter-spacing: 0.01em;
    }

    .actions {
      display: flex;
      gap: 0.45rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    button, a.button {
      border: 1px solid var(--border);
      border-radius: 999px;
      background: #21262d;
      color: var(--text);
      cursor: pointer;
      font: inherit;
      font-size: 0.78rem;
      padding: 0.35rem 0.65rem;
      text-decoration: none;
    }

    button:hover, a.button:hover {
      border-color: var(--accent-2);
    }

    main {
      min-height: 0;
      position: relative;
    }

    iframe {
      width: 100%;
      height: 100%;
      border: 0;
      background: #000;
    }

    .fallback {
      position: absolute;
      inset: auto 0 0 0;
      margin: 0.75rem;
      padding: 0.8rem;
      border: 1px solid var(--border);
      border-radius: 0.8rem;
      background: rgba(13, 17, 23, 0.92);
      color: var(--muted);
      font-size: 0.82rem;
      line-height: 1.45;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.28);
    }

    .fallback strong { color: var(--text); }
    .fallback code { color: var(--accent-2); }
  </style>
</head>
<body>
  <header>
    <h1>🌀 Doomcoding · ${safeTitle}</h1>
    <div class="actions">
      <button id="reload" type="button">Reload</button>
      <a class="button" href="${safeUrl}">Open browser</a>
    </div>
  </header>
  <main>
    <iframe id="feed" src="${safeUrl}" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" title="${safeTitle}"></iframe>
    <aside class="fallback">
      <strong>Tip:</strong> The default Doomcoding mode uses VS Code Simple Browser because it is the lowest-friction way to sign in and keep scrolling inside VS Code. This embedded panel is available as a fallback, but some services may block iframe playback.
    </aside>
  </main>
  <script nonce="${nonce}">
    const iframe = document.getElementById('feed');
    document.getElementById('reload').addEventListener('click', () => {
      iframe.src = iframe.src;
    });
  </script>
</body>
</html>`;
}

/**
 * @param {string} value
 */
function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * @param {string} value
 */
function escapeHtml(value) {
  return value.replace(/[&<>]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
  }[character]));
}

/**
 * @param {string} value
 */
function escapeAttribute(value) {
  return escapeHtml(value).replace(/["']/g, (character) => ({
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function getNonce() {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let index = 0; index < 32; index += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
