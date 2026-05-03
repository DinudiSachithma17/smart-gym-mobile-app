import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Alert,
  TouchableOpacity, ScrollView, Image, FlatList, TextInput, Modal
} from 'react-native';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickImage, buildFormData } from '../../utils/filePicker';

export default function FeedbackScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ type: 'Gym', rating: '5', message: '', trainerId: '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [trainers, setTrainers] = useState([]);

  useEffect(() => {
    api.get('/trainers').then(res => setTrainers(res.data)).catch(() => {});
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.get('/feedback/my');
      setFeedback(res.data);
    } catch { Alert.alert('Error', 'Failed to load feedback'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFeedback(); }, []);

  const openCreate = () => {
    setEditingItem(null);
    setForm({ type: 'Gym', rating: '5', message: '', trainerId: '' });
    setSelectedImage(null);
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      type: item.type,
      rating: String(item.rating),
      message: item.message,
      trainerId: item.trainerId?._id || item.trainerId || '',
    });
    setSelectedImage(null);
    setModalVisible(true);
  };

  const handlePickImage = async () => {
    const img = await pickImage();
    if (img) setSelectedImage(img);
  };

  const handleSave = async () => {
    if (!form.message) { Alert.alert('Error', 'Message is required'); return; }
    const rating = Number(form.rating);
    if (rating < 1 || rating > 5) { Alert.alert('Error', 'Rating must be between 1 and 5'); return; }
    if (form.type === 'Trainer' && !form.trainerId) { Alert.alert('Error', 'Please select a trainer'); return; }

    setUploading(true);
    try {
      const extraFields = { type: form.type, rating: String(rating), message: form.message };
      if (form.type === 'Trainer') extraFields.trainerId = form.trainerId;
      const formData = buildFormData('image', selectedImage, extraFields);

      if (editingItem) {
        await api.put(`/feedback/${editingItem._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        Alert.alert('Success', 'Feedback updated!');
      } else {
        await api.post('/feedback', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setModalVisible(false);
      fetchFeedback();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save feedback');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (f) => {
    Alert.alert('Delete Feedback', 'Are you sure you want to delete this feedback?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await api.delete(`/feedback/${f._id}`); fetchFeedback(); }
          catch (err) { Alert.alert('Error', err.response?.data?.message || 'Failed to delete'); }
        }
      }
    ]);
  };

  const renderStars = (r) => '⭐'.repeat(r) + '☆'.repeat(5 - r);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.feedbackId}>{item.feedbackId}</Text>
        <View style={[styles.badge, {
          backgroundColor: item.status === 'Reviewed' ? Colors.success + '30' : Colors.warning + '30',
          borderColor: item.status === 'Reviewed' ? Colors.success : Colors.warning,
        }]}>
          <Text style={[styles.badgeText, { color: item.status === 'Reviewed' ? Colors.success : Colors.warning }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.type}>
        {item.type === 'Trainer' ? `🏋️ Trainer (${item.trainerId?.name || 'Unknown'})` : '🏢 Gym'}
      </Text>
      <Text style={styles.stars}>{renderStars(item.rating)}</Text>
      <Text style={styles.message}>{item.message}</Text>

      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.feedbackImage} resizeMode="cover" />
      )}

      {/* Lock message when admin has viewed */}
      {item.viewedByAdmin && (
        <View style={styles.lockedBadge}>
          <Text style={styles.lockedText}>👁 Reviewed by Admin — editing locked</Text>
        </View>
      )}

      {/* Edit & Delete only if NOT yet viewed by admin */}
      {!item.viewedByAdmin && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
            <Text style={styles.editText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Text style={styles.deleteText}>🗑 Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>My Feedback</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}><Text style={styles.addText}>+ Add</Text></TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={feedback}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No feedback submitted yet</Text>}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modal, { paddingBottom: insets.bottom }]} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Feedback' : 'New Feedback'}</Text>

            <Text style={styles.label}>Type</Text>
            <View style={styles.optionRow}>
              {['Gym', 'Trainer'].map(t => (
                <TouchableOpacity key={t} style={[styles.option, form.type === t && styles.optionSelected]} onPress={() => setForm({ ...form, type: t })}>
                  <Text style={[styles.optionText, form.type === t && styles.optionTextSelected]}>{t === 'Gym' ? '🏢 Gym' : '🏋️ Trainer'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {form.type === 'Trainer' && (
              <>
                <Text style={styles.label}>Select Trainer *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {trainers.map(t => (
                    <TouchableOpacity key={t._id} style={[styles.option, form.trainerId === t._id && styles.optionSelected, { marginRight: 8 }]} onPress={() => setForm({ ...form, trainerId: t._id })}>
                      <Text style={[styles.optionText, form.trainerId === t._id && styles.optionTextSelected]}>{t.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.label}>Rating</Text>
            <View style={styles.optionRow}>
              {['1', '2', '3', '4', '5'].map(r => (
                <TouchableOpacity key={r} style={[styles.ratingOption, form.rating === r && styles.ratingSelected]} onPress={() => setForm({ ...form, rating: r })}>
                  <Text style={[styles.ratingText, form.rating === r && styles.ratingTextSelected]}>{r} ⭐</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              value={form.message}
              onChangeText={v => setForm({ ...form, message: v })}
              placeholder="Share your experience..."
              placeholderTextColor={Colors.textSecondary}
              multiline
            />

            <Text style={styles.label}>Attach Photo (optional)</Text>
            <TouchableOpacity style={styles.filePickerBtn} onPress={handlePickImage}>
              <Text style={styles.filePickerIcon}>📷</Text>
              <Text style={styles.filePickerText}>{selectedImage ? selectedImage.name : 'Choose a photo'}</Text>
            </TouchableOpacity>
            {selectedImage && (
              <>
                <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} resizeMode="cover" />
                <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeFile}>
                  <Text style={styles.removeFileText}>✕ Remove photo</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={[styles.saveBtn, uploading && { opacity: 0.7 }]} onPress={handleSave} disabled={uploading}>
              {uploading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>{editingItem ? 'Update Feedback' : 'Submit Feedback'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: Colors.surface },
  back: { color: Colors.primary, fontSize: 16 },
  title: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addText: { color: Colors.white, fontWeight: 'bold' },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },

  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  feedbackId: { color: Colors.primary, fontWeight: 'bold', fontSize: 13 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  type: { color: Colors.textSecondary, fontSize: 13, marginBottom: 4 },
  stars: { fontSize: 16, marginBottom: 6 },
  message: { color: Colors.text, fontSize: 14, marginBottom: 10 },
  feedbackImage: { width: '100%', height: 160, borderRadius: 12, marginBottom: 10 },

  lockedBadge: { backgroundColor: Colors.info + '15', borderRadius: 8, padding: 8, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: Colors.info },
  lockedText: { color: Colors.info, fontSize: 12, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: 10 },
  editBtn: { flex: 1, backgroundColor: Colors.primary + '20', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary },
  editText: { color: Colors.primary, fontWeight: 'bold' },
  deleteBtn: { flex: 1, backgroundColor: Colors.error + '20', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.error },
  deleteText: { color: Colors.error, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '95%' },
  modalTitle: { color: Colors.text, fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  label: { color: Colors.textSecondary, fontSize: 13, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: Colors.card, color: Colors.text, borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: Colors.border },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  optionSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { color: Colors.textSecondary, fontSize: 13 },
  optionTextSelected: { color: Colors.white, fontWeight: 'bold' },
  ratingOption: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  ratingSelected: { backgroundColor: Colors.warning, borderColor: Colors.warning },
  ratingText: { color: Colors.textSecondary, fontSize: 13 },
  ratingTextSelected: { color: Colors.white, fontWeight: 'bold' },
  filePickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  filePickerIcon: { fontSize: 20, marginRight: 10 },
  filePickerText: { color: Colors.textSecondary, fontSize: 14, flex: 1 },
  previewImage: { width: '100%', height: 160, borderRadius: 12, marginTop: 10 },
  removeFile: { alignItems: 'center', marginTop: 6 },
  removeFileText: { color: Colors.error, fontSize: 13 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  cancelBtnText: { color: Colors.textSecondary, fontSize: 15 },
});
