import React, { useState, useEffect } from 'react';
import {
  Button,
  Image,
  View,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Text,
  FlatList,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
// SDK 54: use legacy API on native, provide web fallback below
// Korrektur: In SDK 54 kein '/legacy' Suffix verwenden, stattdessen das Hauptmodul.
import * as FileSystem from 'expo-file-system';
import Ionicons from '@expo/vector-icons/Ionicons';

const isWeb = Platform.OS === 'web';
const imgDir = (FileSystem as any).documentDirectory
  ? (FileSystem as any).documentDirectory + 'images/'
  : 'images/';

const WEB_STORAGE_KEY = 'images';

const ensureDirExists = async () => {
  if (isWeb) return; // no-op on web
  const dirInfo = await (FileSystem as any).getInfoAsync(imgDir);
  if (!dirInfo.exists) {
    await (FileSystem as any).makeDirectoryAsync(imgDir, { intermediates: true });
  }
};

export default function App() {
	const [uploading, setUploading] = useState(false);
	const [images, setImages] = useState<any[]>([]);

	// Load images on startup
	useEffect(() => {
		loadImages();
	}, []);

	// Load images from file system
  const loadImages = async () => {
    if (isWeb) {
      try {
        const stored = localStorage.getItem(WEB_STORAGE_KEY);
        if (stored) {
          const arr = JSON.parse(stored);
          if (Array.isArray(arr)) setImages(arr);
        }
      } catch {}
      return;
    }
    await ensureDirExists();
    const files = await (FileSystem as any).readDirectoryAsync(imgDir);
    if (files.length > 0) {
      setImages(files.map((f: string) => imgDir + f));
    }
  };

	// Select image from library or camera
	const selectImage = async (useLibrary: boolean) => {
		let result;
		const options: ImagePicker.ImagePickerOptions = {
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.75,
      base64: isWeb, // use base64 on web to persist/reload
		};

		if (useLibrary) {
			result = await ImagePicker.launchImageLibraryAsync(options);
		} else {
			await ImagePicker.requestCameraPermissionsAsync();
			result = await ImagePicker.launchCameraAsync(options);
		}

		// Save image if not cancelled
		if (!result.canceled) {
      const asset = result.assets[0];
      if (isWeb) {
        // Prefer base64 data URL for persistence across reloads
        const dataUrl = asset.base64
          ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        saveImage(dataUrl);
      } else {
        saveImage(asset.uri);
      }
		}
	};
// Save image to file system
const saveImage = async (uri: string) => {
  if (isWeb) {
    const next = [...images, uri];
    setImages(next);
    try {
      localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(next));
    } catch {}
    return;
  }
  await ensureDirExists();
  const filename = new Date().getTime() + '.jpeg';
  const dest = imgDir + filename;
  await (FileSystem as any).copyAsync({ from: uri, to: dest });
  setImages([...images, dest]);
};

// Upload image to server
const uploadImage = async (uri: string) => {
  setUploading(true);
  try {
    if (isWeb) {
      // Handle data URL or remote blob URL
      let blob: Blob;
      if (uri.startsWith('data:')) {
        // convert data URL to Blob
        const res = await fetch(uri);
        blob = await res.blob();
      } else {
        const res = await fetch(uri);
        blob = await res.blob();
      }
      const resp = await fetch('http://keepitnative.xyz:4000/image', {
        method: 'POST',
        headers: { 'content-type': 'image/jpeg' },
        body: blob,
      });
      const text = await resp.text();
      alert(text);
    } else {
      const response = await (FileSystem as any).uploadAsync(
        'http://keepitnative.xyz:4000/image',
        uri,
        {
          headers: { 'content-type': 'image/jpeg' },
          httpMethod: 'POST',
          uploadType: (FileSystem as any).FileSystemUploadType.BINARY_CONTENT,
        }
      );
      alert(response.body);
    }
  } finally {
    setUploading(false);
  }
};

// Delete image from file system
const deleteImage = async (uri: string) => {
  if (isWeb) {
    const next = images.filter((i) => i !== uri);
    setImages(next);
    try {
      localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(next));
    } catch {}
    return;
  }
  await (FileSystem as any).deleteAsync(uri);
  setImages(images.filter((i) => i !== uri));
};
// Render image list item
const renderItem = ({ item }: { item: any }) => {
	const filename = item.split('/').pop();
	return (
		<View style={{ flexDirection: 'row', margin: 1, alignItems: 'center', gap: 5 }}>
			<Image style={{ width: 80, height: 80 }} source={{ uri: item }} />
			<Text style={{ flex: 1 }}>{filename}</Text>
			<Ionicons.Button name="cloud-upload" onPress={() => uploadImage(item)} />
			<Ionicons.Button name="trash" onPress={() => deleteImage(item)} />
		</View>
	);
};

return (
	<SafeAreaView style={{ flex: 1, gap: 20 }}>
		<View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 20 }}>
			<Button title="Photo Library" onPress={() => selectImage(true)} />
			<Button title="Capture Image" onPress={() => selectImage(false)} />
		</View>

		<Text style={{ textAlign: 'center', fontSize: 20, fontWeight: '500' }}>My Images</Text>
		<FlatList data={images} renderItem={renderItem} />

		{uploading && (
			<View
				style={[
					StyleSheet.absoluteFill,
					{
						backgroundColor: 'rgba(0,0,0,0.4)',
						alignItems: 'center',
						justifyContent: 'center'
					}
				]}
			>
				<ActivityIndicator color="#fff" animating size="large" />
			</View>
		)}
	</SafeAreaView>
);
}
