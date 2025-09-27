# React Native Image Upload with Cross-Platform Storage

A cross-platform image picker and upload app built with Expo, supporting both mobile (iOS/Android) and web platforms. Uses a custom storage adapter that works without expo-file-system dependencies.

## ✨ Features

- 📸 Camera capture and photo library selection
- 🌐 Cross-platform (iOS, Android, Web)
- 📤 Image upload to server
- 💾 Persistent image storage (AsyncStorage + localStorage)
- 🔄 Platform-agnostic file system adapter

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/en/#download) (LTS version recommended)
- Expo CLI: `npm install --global @expo/cli`
- For mobile testing: [Expo Go](https://expo.dev/expo-go) app from App Store/Play Store

### Installation

1. Clone and install dependencies:
```bash
git clone https://github.com/peterruler/react-native-frontend
cd my-frontend
yarn install
```

2. Start the development server:
```bash
# For all platforms
yarn start

# Web only
yarn start --web

# Mobile only  
yarn start --tunnel  # for physical devices
```

3. **Web**: Open http://localhost:8081 in your browser
4. **Mobile**: Scan QR code with Expo Go app

## 📱 Demo

- **Live Web Demo**: [https://snack.expo.dev/@petethegreat/github.com-peterruler-react-native-frontend?platform=web](https://snack.expo.dev/@petethegreat/github.com-peterruler-react-native-frontend?platform=web)
- **Expo Snack**: [https://snack.expo.dev/@petethegreat/github.com-peterruler-react-native-frontend](https://snack.expo.dev/@petethegreat/github.com-peterruler-react-native-frontend)

## 📷 Screenshots

![Mobile App](proof.jpg)
![Web Interface](load_mobileapp.jpg)

## 🏗️ Architecture

### Storage Adapter (no expo-file-system dependency)

The app uses a custom storage adapter (`src/filesystemAdapter.ts`) that provides cross-platform image persistence:

- **Web**: `localStorage` with Data URLs under the key `images`
- **Native**: `AsyncStorage` (`@react-native-async-storage/async-storage`)

No files are copied to the device filesystem anymore – we only store URI references or Data URLs. This simplifies platform compatibility but has limitations with large files.

**API Functions:**
```typescript
FSAdapter.listImages(): Promise<string[]>
FSAdapter.saveImage(uri: string): Promise<string | undefined>  
FSAdapter.removeImage(uri: string): Promise<void>
FSAdapter.uploadImage(uri: string, endpoint: string): Promise<string | undefined>
```

**Benefits:**
- ✅ No expo-file-system dependency issues
- ✅ Unified codebase across platforms
- ✅ Easy to extend (IndexedDB, Cache Storage, etc.)

**Limitations:**
- ⚠️ Data URLs increase memory usage (~35% overhead)
- ⚠️ AsyncStorage has size limits for large datasets
- ⚠️ Upload re-fetches resources (less efficient than direct file upload)

### Migration from expo-file-system

If you need real filesystem access later:
- Replace native branches in the adapter with `expo-file-system`
- Use `FileSystem.uploadAsync` for efficient uploads  
- Consider IndexedDB for web binary data handling

## 🔧 Development Tools

### Expo Version Upgrade Helper

The project includes a script (`scripts/upgrade-expo.js`) that checks core package versions against Expo SDK targets.

```bash
# Check version differences
yarn upgrade:check

# Auto-update package.json (doesn't run install)
yarn upgrade:write
```

After version updates:
```bash
rm -rf node_modules yarn.lock
yarn install
yarn start --clear
```

### Troubleshooting Cache Issues

If you encounter module resolution errors (like `module://expo-file-system.js`):

```bash
# Clear all caches
watchman watch-del-all 2>/dev/null || true
rm -rf "$TMPDIR"/metro-* "$TMPDIR"/haste-map-*
rm -rf .expo/.web-cache .expo/web .cache dist

# Start with cleared cache
yarn start --clear
```

**Browser:** Hard reload (Cmd+Shift+R) and unregister service workers  
**Mobile:** Force-close Expo Go and rescan QR code

## 🛠️ Project Setup (Advanced)

### Creating a New Project

To start fresh with the latest Expo version:

```bash
npx create-expo-app MyImageApp -t expo-template-blank-typescript
cd MyImageApp
npx expo install expo-image-picker @react-native-async-storage/async-storage
```

Then copy over `src/filesystemAdapter.ts` and the relevant parts of `App.tsx`.

### Node.js Version

Recommended: Node.js LTS (v20.x). Very recent versions (v23+) may show TypeScript warnings with certain node_modules, but these don't affect Metro builds.

## 📚 References

- **Tutorial**: [React Native Image Upload Tutorial](https://galaxies.dev/react-native-image-upload)
- **Expo Docs**: [Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) | [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- **Platform Support**: [Expo Platform Support](https://docs.expo.dev/workflow/platform-support/)

