# Intro and Prerequisites

- Tutorial with source code: [React Native Image Upload Tutorial](https://galaxies.dev/react-native-image-upload)
- Have Node.js installed: [Download Node.js](https://nodejs.org/en/#download)
- Install Expo CLI on your machine: `npm install --global expo-cli`

# Initialize a New Project (Optional)

To migrate to a new Expo version, initialize a new empty project and replace the generated files with the content of `App.tsx` and `app.json` from this repository. Also, add the compiler options in `package.json`.

```sh
npx create-expo-app frontend -t expo-template-blank-typescript
cd frontend
npx expo install expo-image-picker
npx expo install expo-file-system
```

# Installation

Install the necessary dependencies using npm or yarn:

```sh
npm install
# or
yarn
```

# Run the Application

Start the application using npm or yarn:

```sh
npm start
# or
yarn start
```

Then, scan the QR code with the Expo Go App (previously installed from the App Store or Play Store).

# Screenshots

![Screenshot 1](proof.jpg)
![Screenshot 2](load_mobileapp.jpg)

# Demo

Try the demo on Snack: [React Native Frontend Demo](https://snack.expo.dev/@petethegreat/react-native-frontend). Make sure you have the Expo Go App installed, as it is the standard for React Native app development and staging.
