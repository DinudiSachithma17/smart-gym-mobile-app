import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Modal, TextInput, ScrollView,
  Clipboard, Image,
} from 'react-native';
import api from '../../api/api';
import { Colors } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TrainerManagement({ navigation }) {
  const insets = useSafeAreaInsets();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formModal, setFormModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', specialization: '', age: '', phone: '', address: '', city: '',
  });

  const [credModal, setCredModal] = useState(false);
  const [credentials, setCredentials] = useState(null); // { email, password }

  const [feedbackModal, setFeedbackModal] = useState(false);
  const [trainerFeedback, setTrainerFeedback] = useState([]);
  const [viewingTrainer, setViewingTrainer] = useState(null);

  /* ── Data ── */
  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trainers');
      setTrainers(res.data);
    } catch {
      Alert.alert('Error', 'Failed to load trainers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrainers(); }, []);

  /* ── Form helpers ── */
  const openCreate = () => {
    setEditingTrainer(null);
    setForm({ name: '', email: '', specialization: '', age: '', phone: '', address: '', city: '' });
    setFormModal(true);
  };

  const openEdit = (t) => {
    setEditingTrainer(t);
    setForm({
      name: t.name, email: t.email, specialization: t.specialization,
      age: String(t.age), phone: t.phone, address: t.address, city: t.city,
    });
    setFormModal(true);
  };

  const validate = () => {
    if (!form.name || !form.email || !form.specialization || !form.age || !form.phone || !form.address || !form.city) {
      Alert.alert('Error', 'All fields are required'); return false;
    }
    if (form.name.length < 5) { Alert.alert('Error', 'Name must be at least 5 characters'); return false; }
    if (!/^\d{10}$/.test(form.phone)) { Alert.alert('Error', 'Phone must be exactly 10 digits'); return false; }
    const age = Number(form.age);
    if (age < 18 || age > 60) { Alert.alert('Error', 'Age must be between 18 and 60'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingTrainer) {
        await api.put(`/trainers/${editingTrainer._id}`, { ...form, age: Number(form.age) });
        Alert.alert('✅ Updated', 'Trainer info updated successfully');
        setFormModal(false);
        fetchTrainers();
      } else {
        const res = await api.post('/trainers', { ...form, age: Number(form.age) });
        setFormModal(false);
        fetchTrainers();
        // Show credentials popup
        setCredentials(res.data.credentials);
        setCredModal(true);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save trainer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Trainer', 'This will also delete their login account. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await api.delete(`/trainers/${id}`); fetchTrainers(); }
          catch { Alert.alert('Error', 'Failed to delete trainer'); }
        }
      }
    ]);
  };

  const handleResetPassword = async (trainer) => {
    Alert.alert('Reset Password', `Generate a new password for ${trainer.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', onPress: async () => {
          try {
            const res = await api.post(`/trainers/${trainer._id}/reset-password`);
            setCredentials(res.data.credentials);
            setCredModal(true);
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to reset password');
          }
        }
      }
    ]);
  };

  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', 'Copied to clipboard');
  };

  const viewFeedback = async (trainer) => {
    setViewingTrainer(trainer);
    try {
      const res = await api.get(`/feedback/trainer/${trainer._id}`);
      setTrainerFeedback(res.data);
      setFeedbackModal(true);
    } catch {
      Alert.alert('Error', 'Failed to load feedback');
    }
  };

  /* ── Card ── */
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {item.profileImage
            ? <Image source={{ uri: item.profileImage }} style={styles.avatarImg} />
            : <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>}
        </View>
        <View style={styles.info}>
          <Text style={styles.trainerName}>{item.name}</Text>
          <Text style={styles.trainerId}>{item.trainerId}</Text>
          <Text style={styles.spec}>🎯 {item.specialization}</Text>
        </View>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detail}>📞 {item.phone}</Text>
        <Text style={styles.detail}>🏙️ {item.city}</Text>
        <Text style={styles.detail}>🎂 Age: {item.age}</Text>
        <Text style={styles.detail}>📧 {item.email}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
          <Text style={styles.editText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetBtn} onPress={() => viewFeedback(item)}>
          <Text style={styles.resetText}>⭐ Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.resetBtn, item.passwordChanged && { backgroundColor: Colors.textSecondary + '20', borderColor: Colors.textSecondary }]}
          onPress={() => item.passwordChanged ? Alert.alert('Privacy Protection', 'This trainer has updated their own password. For security, admins can no longer reset it.') : handleResetPassword(item)}
        >
          <Text style={[styles.resetText, item.passwordChanged && { color: Colors.textSecondary }]}>
            {item.passwordChanged ? '🔒 Secure' : '🔑 Reset'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
          <Text style={styles.deleteText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /* ── Render ── */
  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>👨‍🏫 Trainers</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={trainers}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No trainers yet. Tap "+ Add" to create one.</Text>}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        />
      )}

      {/* ── Add / Edit Trainer Modal ── */}
      <Modal visible={formModal} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modal, { paddingBottom: insets.bottom }]} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>{editingTrainer ? '✏️ Edit Trainer' : '➕ Add New Trainer'}</Text>



            {[
              { label: 'Full Name * (min 5 chars)', key: 'name', placeholder: 'e.g. John Smith' },
              { label: 'Email *', key: 'email', placeholder: 'trainer@email.com', keyboard: 'email-address', lower: true },
              { label: 'Specialization *', key: 'specialization', placeholder: 'e.g. Yoga, CrossFit, Weight Training' },
              { label: 'Age * (18–60)', key: 'age', placeholder: 'e.g. 28', keyboard: 'numeric' },
              { label: 'Phone * (10 digits)', key: 'phone', placeholder: 'e.g. 0771234567', keyboard: 'phone-pad' },
              { label: 'Address *', key: 'address', placeholder: 'e.g. 123 Main Street' },
              { label: 'City *', key: 'city', placeholder: 'e.g. Colombo' },
            ].map(field => (
              <View key={field.key}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  value={form[field.key]}
                  onChangeText={v => setForm({ ...form, [field.key]: v })}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType={field.keyboard || 'default'}
                  autoCapitalize={field.lower ? 'none' : 'words'}
                />
              </View>
            ))}

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.saveBtnText}>{editingTrainer ? '💾 Save Changes' : '✅ Create Trainer'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setFormModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Credentials Display Modal ── */}
      <Modal visible={credModal} animationType="fade" transparent statusBarTranslucent>
        <View style={styles.credOverlay}>
          <View style={[styles.credBox, { paddingBottom: insets.bottom + 20 }]}>
            {/* Header */}
            <View style={styles.credIconRow}>
              <Text style={styles.credIcon}>🔑</Text>
            </View>
            <Text style={styles.credTitle}>Trainer Login Credentials</Text>
            <Text style={styles.credSubtitle}>
              Share these details with the trainer. The password is shown only once.
            </Text>

            {/* Email row */}
            <View style={styles.credRow}>
              <View style={styles.credLabelRow}>
                <Text style={styles.credLabel}>📧  Email</Text>
                <TouchableOpacity onPress={() => copyToClipboard(credentials?.email)} style={styles.copyBtn}>
                  <Text style={styles.copyBtnText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.credValueBox}>
                <Text style={styles.credValue} selectable>{credentials?.email}</Text>
              </View>
            </View>

            {/* Password row */}
            <View style={styles.credRow}>
              <View style={styles.credLabelRow}>
                <Text style={styles.credLabel}>🔒  Password</Text>
                <TouchableOpacity onPress={() => copyToClipboard(credentials?.password)} style={styles.copyBtn}>
                  <Text style={styles.copyBtnText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.credValueBox, { borderColor: Colors.primary }]}>
                <Text style={[styles.credValue, { color: Colors.primary, fontSize: 22, letterSpacing: 2 }]} selectable>
                  {credentials?.password}
                </Text>
              </View>
            </View>

            <View style={styles.warningRow}>
              <Text style={styles.warningText}>
                ⚠️ Save this password now — it will not be shown again!
              </Text>
            </View>

            <TouchableOpacity style={styles.credDoneBtn} onPress={() => setCredModal(false)}>
              <Text style={styles.credDoneBtnText}>✓  I've noted the credentials</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Feedback Modal ── */}
      <Modal visible={feedbackModal} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { paddingBottom: insets.bottom, height: '80%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.modalTitle}>Feedback: {viewingTrainer?.name}</Text>
              <TouchableOpacity onPress={() => setFeedbackModal(false)}><Text style={{ color: Colors.primary, fontSize: 16 }}>Close</Text></TouchableOpacity>
            </View>
            <ScrollView>
              {trainerFeedback.length === 0 ? (
                <Text style={{ color: Colors.textSecondary, textAlign: 'center', marginTop: 40 }}>No feedback for this trainer yet.</Text>
              ) : (
                trainerFeedback.map(f => (
                  <View key={f._id} style={{ backgroundColor: Colors.card, padding: 16, borderRadius: 16, marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: Colors.text, fontWeight: 'bold' }}>{f.memberId?.name || 'Member'}</Text>
                      <Text>{'⭐'.repeat(f.rating)}</Text>
                    </View>
                    <Text style={{ color: Colors.textSecondary, fontSize: 12, marginBottom: 8 }}>{new Date(f.createdAt).toLocaleDateString()}</Text>
                    <Text style={{ color: Colors.text, fontSize: 14 }}>{f.message}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
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
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 60, fontSize: 16 },

  /* Card */
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  avatarImg: { width: 52, height: 52, borderRadius: 26 },
  avatarText: { color: Colors.white, fontSize: 22, fontWeight: 'bold' },
  info: { flex: 1 },
  trainerName: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
  trainerId: { color: Colors.primary, fontSize: 12 },
  spec: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  detailRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  detail: { color: Colors.textSecondary, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  editBtn: { flex: 2, backgroundColor: Colors.primary + '20', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary },
  editText: { color: Colors.primary, fontWeight: 'bold', fontSize: 13 },
  resetBtn: { flex: 2, backgroundColor: Colors.warning + '20', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.warning },
  resetText: { color: Colors.warning, fontWeight: 'bold', fontSize: 13 },
  deleteBtn: { flex: 1, backgroundColor: Colors.error + '20', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.error },
  deleteText: { color: Colors.error, fontWeight: 'bold' },

  /* Form Modal */
  modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '95%' },
  modalTitle: { color: Colors.text, fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  label: { color: Colors.textSecondary, fontSize: 13, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: Colors.card, color: Colors.text, borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: Colors.border },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  cancelBtnText: { color: Colors.textSecondary, fontSize: 15 },

  /* Credentials Modal */
  credOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  credBox: { backgroundColor: Colors.surface, borderRadius: 24, padding: 24, width: '100%', maxWidth: 400 },
  credIconRow: { alignItems: 'center', marginBottom: 8 },
  credIcon: { fontSize: 48 },
  credTitle: { color: Colors.text, fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  credSubtitle: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  credRow: { marginBottom: 14 },
  credLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  credLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  copyBtn: { backgroundColor: Colors.primary + '20', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary },
  copyBtnText: { color: Colors.primary, fontSize: 12, fontWeight: 'bold' },
  credValueBox: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: Colors.border },
  credValue: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  warningRow: { backgroundColor: Colors.warning + '20', borderRadius: 10, padding: 12, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: Colors.warning },
  warningText: { color: Colors.warning, fontSize: 13, fontWeight: '600' },
  credDoneBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  credDoneBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
});
