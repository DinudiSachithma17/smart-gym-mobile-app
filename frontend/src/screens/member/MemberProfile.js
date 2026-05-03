import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Alert,
  TouchableOpacity, ScrollView, Image
} from 'react-native';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickImage, buildFormData } from '../../utils/filePicker';
import { Ionicons } from '@expo/vector-icons';

export default function MemberProfile({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadProfile = () => {
    api.get('/profile/me')
      .then(res => setProfile(res.data))
      .catch(() => Alert.alert('Error', 'Failed to load profile'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProfile(); }, []);

  const handlePickAndUpload = async () => {
    const img = await pickImage();
    if (!img) return;
    setUploading(true);
    try {
      const formData = buildFormData('image', img, {});
      const res = await api.post('/profile/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(prev => ({ ...prev, profileImage: res.data.profileImage }));
      Alert.alert('Success', 'Profile picture updated!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
  );

  const info = profile || {};
  const initials = (info.name || user?.name || 'M').charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Profile Header */}
      <View style={styles.headerBg}>
        <TouchableOpacity onPress={handlePickAndUpload} disabled={uploading} style={styles.avatarWrapper}>
          {info.profileImage ? (
            <Image source={{ uri: info.profileImage }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.cameraOverlay}>
            {uploading
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Ionicons name="camera" size={16} color={Colors.white} />}
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{info.name || user?.name}</Text>
        <Text style={styles.role}>
          <Ionicons name="person" size={14} color={Colors.primary} /> Member
        </Text>
        <Text style={styles.uploadHint}>Tap photo to update</Text>
      </View>

      {/* Info Card */}
      <View style={styles.card}>
        {[
          { label: 'Email', value: info.email, icon: 'mail-outline' },
          { label: 'Member ID', value: info.userId, icon: 'id-card-outline' },
          { label: 'Member Since', value: info.createdAt ? new Date(info.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—', icon: 'calendar-outline' },
        ].map(item => (
          <View key={item.label} style={styles.row}>
            <Ionicons name={item.icon} size={22} color={Colors.primary} style={styles.rowIcon} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowValue}>{item.value || '—'}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: Colors.surface },
  back: { color: Colors.primary, fontSize: 16 }, title: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
  headerBg: { alignItems: 'center', padding: 32, backgroundColor: Colors.surface, marginBottom: 12 },
  avatarWrapper: { position: 'relative', marginBottom: 14 },
  avatarImg: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: Colors.primary },
  avatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: Colors.primary + 'AA', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: Colors.primary },
  avatarText: { color: Colors.white, fontSize: 44, fontWeight: 'bold' },
  cameraOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.primary, borderRadius: 16, width: 32, height: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.background },
  name: { color: Colors.text, fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  role: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  uploadHint: { color: Colors.textSecondary, fontSize: 12, marginTop: 8 },
  card: { backgroundColor: Colors.surface, borderRadius: 20, margin: 16, padding: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon: { marginRight: 14 },
  rowText: { flex: 1 },
  rowLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 2 },
  rowValue: { color: Colors.text, fontSize: 15, fontWeight: '500' },
});
