# Auto-updating the Copaw desktop app

The app uses **Tauri’s built-in updater** (cross-platform). On macOS you can optionally use **Sparkle** for a native update experience (e.g. sandboxed builds).

---

## 1. Official Tauri updater (current setup)

### Generate signing keys

```bash
cd apps/desktop
pnpm tauri signer generate -- -w ~/.tauri/cowork.key
```

- **Private key** (`~/.tauri/cowork.key`): keep secret; used when building to sign update artifacts.
- **Public key**: paste the *contents* into `src-tauri/tauri.conf.json` under `plugins.updater.pubkey` (replace `REPLACE_WITH_PUBLIC_KEY_CONTENT`).

### Configure update endpoint

In `src-tauri/tauri.conf.json`, set `plugins.updater.endpoints` to your update URL(s), e.g.:

- **GitHub Releases** (static JSON):
  ```json
  "endpoints": [
    "https://github.com/YOUR_ORG/cowork/releases/latest/download/latest.json"
  ]
  ```
  You must add a `latest.json` (and per-platform assets) to each release. Format:

  ```json
  {
    "version": "1.4.1",
    "notes": "Bug fixes",
    "pub_date": "2025-03-15T12:00:00Z",
    "platforms": {
      "darwin-x86_64": { "signature": "<.sig content>", "url": "https://..." },
      "darwin-aarch64": { "signature": "<.sig content>", "url": "https://..." },
      "windows-x86_64": { "signature": "<.sig content>", "url": "https://..." }
    }
  }
  ```

- **Custom server**: return 204 No Content when no update, or 200 + JSON with `version`, `url`, `signature`, etc. See [Tauri updater docs](https://v2.tauri.app/plugin/updater/).

### Build with signing

```bash
export TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.tauri/cowork.key)"
# or: export TAURI_SIGNING_PRIVATE_KEY="content of private key"
pnpm tauri build
```

Updater artifacts (e.g. `Copaw.app.tar.gz` + `.sig` on macOS) are generated next to your app bundle. Upload them and the `latest.json` (with correct `signature` values from the `.sig` files) to your release or server.

### Frontend

Use the `useUpdater` hook from `src/hooks/useUpdater.ts`: call `checkForUpdates()`, then `downloadAndInstall()` and `restart()` when the user confirms.

---

## 2. Sparkle (macOS-only alternative)

For a **native macOS update flow** (Sparkle UI, better behavior in sandboxed apps), you can use [tauri-plugin-sparkle-updater](https://github.com/ahonn/tauri-plugin-sparkle-updater) on macOS and keep the official updater on Windows/Linux.

### Steps (macOS)

1. **Add dependency** (macOS only):
   ```toml
   # Cargo.toml
   [target.'cfg(target_os = "macos")'.dependencies]
   tauri-plugin-sparkle-updater = "0.2"
   ```
   And install the JS API: `pnpm add tauri-plugin-sparkle-updater-api`.

2. **Download Sparkle and generate keys**:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/ahonn/tauri-plugin-sparkle-updater/refs/heads/master/scripts/download-sparkle.sh | bash
   ./src-tauri/sparkle-bin/generate_keys
   ```

3. **Configure** `Info.plist` with `SUFeedURL` (appcast URL) and `SUPublicEDKey` (public key), and bundle the Sparkle framework (see the plugin’s [Quick Start](https://lib.rs/crates/tauri-plugin-sparkle-updater)).

4. **Register plugin** in `lib.rs`:
   ```rust
   #[cfg(target_os = "macos")]
   builder = builder.plugin(tauri_plugin_sparkle_updater::init());
   #[cfg(not(target_os = "macos"))]
   builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
   ```

5. **Publish** an appcast (XML) and signed update archives as required by [Sparkle](https://sparkle-project.org/documentation/).

This replaces the built-in Tauri updater on macOS only; Windows/Linux continue to use the official updater and the same release pipeline (e.g. GitHub Releases) with platform-specific artifacts.
