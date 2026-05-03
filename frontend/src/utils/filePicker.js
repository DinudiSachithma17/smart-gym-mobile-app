import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';

/**
 * Pick an image from the device gallery.
 * Returns { uri, name, type } or null if cancelled.
 */
export const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Please allow access to your photo library.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'], 
    allowsEditing: true,   // Restored crop functionality!
    quality: 0.8,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const name = asset.uri.split('/').pop();
  const type = 'image/' + name.split('.').pop().replace('jpg', 'jpeg');
  return { uri: asset.uri, name, type };
};

/**
 * Pick any file (image, PDF, doc) for complaint attachments.
 * Returns { uri, name, type } or null if cancelled.
 */
export const pickFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf', 'application/msword',
             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return null;
    const asset = result.assets[0];
    return { uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/octet-stream' };
  } catch {
    Alert.alert('Error', 'Failed to pick file');
    return null;
  }
};

/**
 * Build FormData for a file upload.
 * fieldName: the multipart field name ('file' or 'image')
 * file: { uri, name, type }
 * extraFields: { key: value } for other form fields
 */
export const buildFormData = (fieldName, file, extraFields = {}) => {
  const formData = new FormData();
  if (file) {
    formData.append(fieldName, { uri: file.uri, name: file.name, type: file.type });
  }
  Object.entries(extraFields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, String(value));
  });
  return formData;
};
