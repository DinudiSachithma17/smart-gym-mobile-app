import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Alert,
  TouchableOpacity, ScrollView, Image, Modal, TextInput
} from 'react-native';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickImage, buildFormData } from '../../utils/filePicker';
import { Ionicons } from '@expo/vector-icons';

export default function TrainerProfile({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [classes, setClasses] = useState([]);
  const [passwordModal, setPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changing, setChanging] = useState(false);

  const loadProfile = () => {
    api.get('/profile/me')
      .then(res => {
        setProfile(res.data);
        // Use User _id — backend resolves to Trainer doc automatically
        const userId = res.data._id;
        api.get(`/feedback/trainer/${res.data.trainerDocId || userId}`).then(fRes => setFeedback(fRes.data)).catch(() => {});
        api.get(`/classes/trainer/${userId}`).then(cRes => {
          setClasses(cRes.data);
        }).catch(err => {
          console.log('Classes fetch error:', err.response?.data || err.message);
        });
      })
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

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return Alert.alert('Error', 'Please fill all fields');
    if (newPassword.length < 6) return Alert.alert('Error', 'New password must be at least 6 characters');

    setChanging(true);
    try {
      await api.put('/profile/change-password', { currentPassword, newPassword });
      Alert.alert('Success', 'Password updated successfully!');
      setPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update password');
    } finally {
      setChanging(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;

  const info = profile || {};
  const initials = (info.name || user?.name || 'T').charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.avatarContainer}>
        {/* Profile Picture */}
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
        <Text style={styles.trainerId}>{info.trainerId?.replace('TR', 'M') || info.trainerId}</Text>
        <TouchableOpacity style={styles.passwordBtn} onPress={() => setPasswordModal(true)}>
          <Ionicons name="key-outline" size={16} color={Colors.primary} />
          <Text style={styles.passwordBtnText}>Change Password</Text>
        </TouchableOpacity>
        <Text style={styles.uploadHint}>Tap photo to change</Text>
      </View>

      <View style={styles.card}>
        {[
          { label: 'Specialization', value: info.specialization, icon: 'fitness-outline' },
          { label: 'Email', value: info.email, icon: 'mail-outline' },
          { label: 'Phone', value: info.phone, icon: 'call-outline' },
          { label: 'Age', value: info.age, icon: 'calendar-outline' },
          { label: 'Address', value: info.address, icon: 'home-outline' },
          { label: 'City', value: info.city, icon: 'business-outline' },
        ].map(item => (
          <View key={item.label} style={styles.row}>
            <Ionicons name={item.icon} size={20} color={Colors.primary} style={styles.rowIcon} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowValue}>{item.value || '—'}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <Text style={{ color: Colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>My Class Schedule ({classes.length})</Text>
        {classes.length === 0 ? (
          <Text style={{ color: Colors.textSecondary }}>No classes assigned yet.</Text>
        ) : (
          classes.map(item => (
            <View key={item._id} style={{ backgroundColor: Colors.surface, padding: 16, borderRadius: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 16 }}>{item.className}</Text>
                <Text style={{ color: Colors.textSecondary }}>{item.time}</Text>
              </View>
              <Text style={{ color: Colors.text, fontSize: 14, marginBottom: 4 }}>Date: {new Date(item.date).toLocaleDateString()}</Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>Members Assigned: {item.members?.length || 0}</Text>
            </View>
          ))
        )}
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text style={{ color: Colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>My Feedback ({feedback.length})</Text>
        {feedback.length === 0 ? (
          <Text style={{ color: Colors.textSecondary }}>No feedback received yet.</Text>
        ) : (
          feedback.map(f => (
            <View key={f._id} style={{ backgroundColor: Colors.surface, padding: 16, borderRadius: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: Colors.text, fontWeight: 'bold' }}>{f.memberId?.name || 'Member'}</Text>
                <Text>{'⭐'.repeat(f.rating)}</Text>
              </View>
              <Text style={{ color: Colors.textSecondary, fontSize: 13, marginBottom: 8 }}>{new Date(f.createdAt).toLocaleDateString()}</Text>
              <Text style={{ color: Colors.text, fontSize: 14 }}>{f.message}</Text>
            </View>
          ))
        )}
      </View>

      <Modal visible={passwordModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              placeholder="Current Password"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TextInput
              placeholder="New Password"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setPasswordModal(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.submitBtn]} onPress={handleChangePassword} disabled={changing}>
                {changing ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: Colors.surface },
  back: { color: Colors.primary, fontSize: 16 }, title: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
  avatarContainer: { alignItems: 'center', padding: 32 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatarImg: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: Colors.primary },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.secondary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: Colors.primary },
  avatarText: { color: Colors.white, fontSize: 40, fontWeight: 'bold' },
  cameraOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.primary, borderRadius: 16, width: 32, height: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.background },
  name: { color: Colors.text, fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  trainerId: { color: Colors.secondary, fontSize: 14, fontWeight: '600' },
  passwordBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: Colors.primary + '10', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  passwordBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '600', marginLeft: 6 },
  uploadHint: { color: Colors.textSecondary, fontSize: 12, marginTop: 10 },
  card: { backgroundColor: Colors.surface, borderRadius: 20, margin: 16, padding: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon: { marginRight: 14 },
  rowText: { flex: 1 },
  rowLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 2 },
  rowValue: { color: Colors.text, fontSize: 15, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: Colors.surface, borderRadius: 24, padding: 24 },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: Colors.background, color: Colors.text, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: Colors.border },
  submitBtn: { backgroundColor: Colors.primary },
  btnText: { color: Colors.white, fontWeight: 'bold' },
});
