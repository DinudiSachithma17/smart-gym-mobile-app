import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Modal, TextInput, ScrollView, Image
} from 'react-native';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickFile, buildFormData } from '../../utils/filePicker';

export default function ComplaintsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ category: '', priority: 'Medium', description: '' });
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchComplaints = async () => {
    try { setLoading(true); const res = await api.get('/complaints/my'); setComplaints(res.data); }
    catch { Alert.alert('Error', 'Failed to load complaints'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const openCreate = () => {
    setEditingItem(null);
    setForm({ category: '', priority: 'Medium', description: '' });
    setAttachedFile(null);
    setModalVisible(true);
  };

  const openEdit = (c) => {
    if (c.status !== 'Pending') { Alert.alert('Cannot Edit', 'You can only edit Pending complaints'); return; }
    setEditingItem(c);
    setForm({ category: c.category, priority: c.priority, description: c.description });
    setAttachedFile(null);
    setModalVisible(true);
  };

  const handlePickFile = async () => {
    const file = await pickFile();
    if (file) setAttachedFile(file);
  };

  const CATEGORIES = [
    'Trainer Behaviour', 'Training Issue', 'Equipment Issues',
    'Payment Issues', 'Cleanliness', 'Facilities', 'Safety', 'Other'
  ];

  const handleSave = async () => {
    if (!form.category) { Alert.alert('Validation Error', 'Please select a category'); return; }
    if (!form.description || form.description.trim().length < 20) {
      Alert.alert('Validation Error', 'Description is required and must be at least 20 characters');
      return;
    }
    if (form.description.length > 500) { Alert.alert('Error', 'Description cannot exceed 500 characters'); return; }

    setUploading(true);
    try {
      const formData = buildFormData('file', attachedFile, {
        name: user.name,
        email: user.email,
        category: form.category,
        priority: form.priority,
        description: form.description,
      });

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (editingItem) {
        await api.put(`/complaints/${editingItem._id}`, formData, config);
      } else {
        await api.post('/complaints', formData, config);
      }
      setModalVisible(false);
      fetchComplaints();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save complaint');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (c) => {
    Alert.alert('Delete Complaint', 'Are you sure you want to delete this complaint?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await api.delete(`/complaints/${c._id}`); fetchComplaints(); } catch { Alert.alert('Error', 'Failed to delete'); } } }
    ]);
  };

  const statusColor = { Pending: Colors.warning, 'In Progress': Colors.info, Resolved: Colors.success };
  const priorityColor = { Low: Colors.success, Medium: Colors.warning, High: Colors.error };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.complaintId}>{item.complaintId}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor[item.status] + '30', borderColor: statusColor[item.status] }]}>
          <Text style={[styles.badgeText, { color: statusColor[item.status] }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.category}>{item.category}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <View style={[styles.priorityBadge, { backgroundColor: priorityColor[item.priority] + '20' }]}>
        <Text style={[styles.priorityText, { color: priorityColor[item.priority] }]}>Priority: {item.priority}</Text>
      </View>
      {/* Show attachment if exists */}
      {item.fileUrl && (
        <View style={styles.attachmentRow}>
          <Text style={styles.attachmentIcon}>📎</Text>
          <Text style={styles.attachmentLabel}>Attachment included</Text>
        </View>
      )}
      {item.viewedByAdmin && item.status !== 'Resolved' && (
        <View style={styles.viewedBadge}>
          <Text style={styles.viewedBadgeText}>👁 Admin is reviewing this complaint</Text>
        </View>
      )}
      {item.adminReply && (
        <View style={styles.replyBox}>
          <Text style={styles.replyLabel}>Admin Reply:</Text>
          <Text style={styles.replyText}>{item.adminReply}</Text>
        </View>
      )}
      <View style={styles.actions}>
        {item.status === 'Pending' && !item.viewedByAdmin && (
          <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>My Complaints</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}><Text style={styles.addText}>+ New</Text></TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} /> : (
        <FlatList data={complaints} keyExtractor={item => item._id} renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No complaints submitted yet</Text>}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }} />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modal, { paddingBottom: insets.bottom }]} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Complaint' : 'New Complaint'}</Text>

            <Text style={styles.label}>Your Name (auto-filled)</Text>
            <View style={styles.disabledInput}><Text style={styles.disabledText}>{user?.name}</Text></View>

            <Text style={styles.label}>Email (auto-filled)</Text>
            <View style={styles.disabledInput}><Text style={styles.disabledText}>{user?.email}</Text></View>

            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setDropdownOpen(o => !o)}
            >
              <Text style={[styles.dropdownTriggerText, !form.category && { color: Colors.textSecondary }]}>
                {form.category || '-- Select a Category --'}
              </Text>
              <Text style={styles.dropdownArrow}>{dropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {dropdownOpen && (
              <View style={styles.dropdownList}>
                <TouchableOpacity
                  style={[styles.dropdownItem, styles.dropdownItemFirst]}
                  onPress={() => { setForm({ ...form, category: '' }); setDropdownOpen(false); }}
                >
                  <Text style={[styles.dropdownItemText, { color: Colors.textSecondary }]}>-- Select a Category --</Text>
                </TouchableOpacity>
                {CATEGORIES.map((cat, idx) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.dropdownItem,
                      form.category === cat && styles.dropdownItemSelected,
                      idx === CATEGORIES.length - 1 && styles.dropdownItemLast,
                    ]}
                    onPress={() => { setForm({ ...form, category: cat }); setDropdownOpen(false); }}
                  >
                    <Text style={[styles.dropdownItemText, form.category === cat && styles.dropdownItemTextSelected]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Priority</Text>
            <View style={styles.optionRow}>
              {['Low', 'Medium', 'High'].map(p => (
                <TouchableOpacity key={p} style={[styles.option, form.priority === p && styles.optionSelected]} onPress={() => setForm({ ...form, priority: p })}>
                  <Text style={[styles.optionText, form.priority === p && styles.optionTextSelected]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Description * (min 20, max 500 chars)</Text>
            <TextInput style={[styles.input, { height: 120, textAlignVertical: 'top' }]} value={form.description} onChangeText={v => setForm({ ...form, description: v })} placeholder="Describe your complaint in detail..." placeholderTextColor={Colors.textSecondary} multiline maxLength={500} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={[styles.charCount, form.description.length < 20 && form.description.length > 0 && { color: Colors.error }]}>
                {form.description.length < 20 ? `${20 - form.description.length} more chars needed` : '✓ Good'}
              </Text>
              <Text style={styles.charCount}>{form.description.length}/500</Text>
            </View>

            {/* File Attachment */}
            <Text style={styles.label}>Attachment (optional)</Text>
            <TouchableOpacity style={styles.filePickerBtn} onPress={handlePickFile}>
              <Text style={styles.filePickerIcon}>📎</Text>
              <Text style={styles.filePickerText}>
                {attachedFile ? attachedFile.name : 'Attach image, PDF or document'}
              </Text>
            </TouchableOpacity>
            {attachedFile && attachedFile.type?.startsWith('image/') && (
              <Image source={{ uri: attachedFile.uri }} style={styles.previewImage} resizeMode="cover" />
            )}
            {attachedFile && (
              <TouchableOpacity onPress={() => setAttachedFile(null)} style={styles.removeFile}>
                <Text style={styles.removeFileText}>✕ Remove attachment</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.saveBtn, uploading && { opacity: 0.7 }]} onPress={handleSave} disabled={uploading}>
              {uploading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Submit Complaint</Text>}
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
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  complaintId: { color: Colors.primary, fontWeight: 'bold', fontSize: 13 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  category: { color: Colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  description: { color: Colors.textSecondary, fontSize: 14, marginBottom: 10 },
  priorityBadge: { borderRadius: 8, padding: 6, alignSelf: 'flex-start', marginBottom: 10 },
  priorityText: { fontSize: 12, fontWeight: '600' },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  attachmentIcon: { fontSize: 14, marginRight: 6 },
  attachmentLabel: { color: Colors.textSecondary, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  editBtn: { flex: 1, backgroundColor: Colors.primary + '20', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary },
  editText: { color: Colors.primary, fontWeight: 'bold' },
  deleteBtn: { flex: 1, backgroundColor: Colors.error + '20', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.error },
  deleteText: { color: Colors.error, fontWeight: 'bold' },
  viewedBadge: { backgroundColor: Colors.info + '15', borderRadius: 8, padding: 8, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: Colors.info },
  viewedBadgeText: { color: Colors.info, fontSize: 12, fontWeight: '600' },
  replyBox: { backgroundColor: Colors.success + '15', borderRadius: 10, padding: 12, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: Colors.success },
  replyLabel: { color: Colors.success, fontSize: 12, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase' },
  replyText: { color: Colors.text, fontSize: 14, lineHeight: 20 },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '95%' },
  modalTitle: { color: Colors.text, fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  label: { color: Colors.textSecondary, fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: Colors.card, color: Colors.text, borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: Colors.border },
  disabledInput: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  disabledText: { color: Colors.textSecondary, fontSize: 15 },
  optionRow: { flexDirection: 'row', gap: 8 },
  option: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  optionSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { color: Colors.textSecondary, fontSize: 13 },
  optionTextSelected: { color: Colors.white, fontWeight: 'bold' },

  /* Dropdown Picker */
  dropdownTrigger: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  dropdownTriggerText: { color: Colors.text, fontSize: 14, flex: 1 },
  dropdownArrow: { color: Colors.primary, fontSize: 11, marginLeft: 8 },
  dropdownList: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.primary,
    borderRadius: 8, marginTop: 2, overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12, paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  dropdownItemFirst: {},
  dropdownItemLast: { borderBottomWidth: 0 },
  dropdownItemSelected: { backgroundColor: Colors.primary },
  dropdownItemText: { color: Colors.text, fontSize: 14 },
  dropdownItemTextSelected: { color: Colors.white, fontWeight: '700' },
  charCount: { color: Colors.textSecondary, fontSize: 12, textAlign: 'right', marginTop: 4 },
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
