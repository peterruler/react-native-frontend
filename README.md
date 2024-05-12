# Intro and prerequisites
- Tutorial with source code: https://galaxies.dev/react-native-image-upload

- have nodejs installed -> https://nodejs.org/en/#download
- install expo cli on your machine: `npm install --global expo-cli`
- old version: `expo init .`

# initialize a new empty project (optional - migrate to new expo version) replace generates files with content of App.tsx and app json and add compileroption in package.json in this repo.
```
npx create-expo-app frontend -t expo-template-blank-typescript
cd frontend
npx expo install expo-image-picker
npx expo install expo-file-system
```
# install
- `npm install` or with yarn installed `yarn`

# Run
- start using npm `npm start` or:
- to start app `yarn start` then scan qr code with Expo Go App (previously installed from app / play store)

![Screenshot 1](proof.jpg)
![Screenshot 2](load_mobileapp.jpg)

# Demo
- https://snack.expo.dev/@petethegreat/react-native-frontend have Expo Go App installed, it is the standard for react native app development and staging
