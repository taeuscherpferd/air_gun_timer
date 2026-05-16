# Gun Timer

Gun Timer is a Tauri 2 + React MVP for running configurable timer steps. When a
timer completes, the app randomly selects one enabled option from the configured
list and records the result. Timer steps can use fixed durations or randomized
intervals, which makes it useful for multi-step drills, prompts, or training
flows.

## Features

- Mobile-first React UI built with Vite, TypeScript, SCSS modules, Redux Toolkit,
  and lucide-react icons.
- Tauri 2 shell with Rust commands for random timer duration and option
  selection.
- Configurable options with weights and enabled/disabled states.
- Optional spoken results with per-option audio file overrides.
- Configurable timer steps with fixed or random duration ranges.
- Collapsible timer and option sections for a compact running view.
- Run, pause, reset, skip, and loop controls.
- Local storage persistence for timer and option configuration.
- Browser fallback for development preview before launching through Tauri.

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the browser development server:

```bash
pnpm run dev
```

Run the desktop Tauri app:

```bash
pnpm run tauri dev
```

Run tests:

```bash
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
```

## Android

Tauri mobile support requires Android Studio, Android SDK tools, an NDK, and the
Android Rust targets. The current Tauri prerequisites list these Android setup
steps:

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export NDK_HOME="$ANDROID_HOME/ndk/$(ls -1 $ANDROID_HOME/ndk)"
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

After Android tooling is installed, initialize and run the Android project:

```bash
pnpm run android:init
pnpm run android:dev
```

Build an Android artifact:

```bash
pnpm run android:build
```

## Project Structure

- `src/components` contains small UI components with local SCSS modules.
- `src/domain` contains shared TypeScript domain types.
- `src/services` contains persistence and Tauri command adapters.
- `src/store` contains Redux Toolkit state management.
- `src-tauri/src/session.rs` contains the Rust session business logic and tests.

## Notes

- The app can be previewed in a browser, but Tauri builds use Rust for the core
  randomization logic.
- Attached option audio is stored in browser/Tauri web storage as a data URL, so
  short sound effects or voice clips are a better fit than large audio tracks.
- `src-tauri/gen` is intentionally ignored because `tauri android init` generates
  platform-specific Android project files there.
