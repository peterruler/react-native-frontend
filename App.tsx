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
// Dateisystemzugriffe über Adapter kapseln
import { FSAdapter } from './src/filesystemAdapter';
import Ionicons from '@expo/vector-icons/Ionicons';

const isWeb = Platform.OS === 'web';

export default function App() {
	const [uploading, setUploading] = useState(false);
	const [images, setImages] = useState<any[]>([]);

	// Load images on startup
	useEffect(() => {
		loadImages();
	}, []);

  // Load images via adapter
  const loadImages = async () => {
    const list = await FSAdapter.listImages();
    setImages(list);
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
// Save image abstraction
const saveImage = async (uri: string) => {
  const stored = await FSAdapter.saveImage(uri);
  if (stored) {
    setImages(prev => [...prev, stored]);
  }
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
      const body = await FSAdapter.uploadImage(uri, 'http://keepitnative.xyz:4000/image');
      if (body) alert(body);
    }
  } finally {
    setUploading(false);
  }
};

// Delete image from file system
const deleteImage = async (uri: string) => {
  await FSAdapter.removeImage(uri);
  setImages(prev => prev.filter(i => i !== uri));
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
