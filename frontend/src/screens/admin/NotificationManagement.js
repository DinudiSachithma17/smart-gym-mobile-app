import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Modal, TextInput, ScrollView
} from 'react-native';
import api from '../../api/api';
import { Colors } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationManagement({ navigation }) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ title: '', message: '', type: 'Announcement', target: 'All Members', specificUserId: '' });

  const fetchNotifications = async () => {
    try { 
      setLoading(true); 
      const res = await api.get('/notifications'); setNotifications(res.data); 
      const membersRes = await api.get('/auth/users?role=Member'); setUsers(membersRes.data);
      const trainersRes = await api.get('/auth/users?role=Trainer'); setTrainers(trainersRes.data);
    }
    catch { Alert.alert('Error', 'Failed to load notifications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const openCreate = () => { setEditingItem(null); setForm({ title: '', message: '', type: 'Announcement', target: 'All', specificUserId: '' }); setModalVisible(true); };
  const openEdit = (n) => { setEditingItem(n); setForm({ title: n.title, message: n.message, type: n.type, target: n.target, specificUserId: n.specificUserId || '' }); setModalVisible(true); };

  const handleSave = async () => {
    if (!form.title || !form.message) { Alert.alert('Error', 'Title and message are required'); return; }
    if ((form.target === 'Single Member' || form.target === 'Single Trainer') && !form.specificUserId) {
      Alert.alert('Error', `Please select a ${form.target.split(' ')[1]}`);
      return;
    }

    const payload = { ...form };
    if (!payload.specificUserId) {
      delete payload.specificUserId;
    }

    try {
      if (editingItem) { await api.put(`/notifications/${editingItem._id}`, payload); }
      else { await api.post('/notifications', payload); }
      setModalVisible(false); fetchNotifications();
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Failed to save notification'); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await api.delete(`/notifications/${id}`); fetchNotifications(); } catch { Alert.alert('Error', 'Failed to delete'); } } }
    ]);
  };

  const typeColor = { Alert: Colors.error, Announcement: Colors.primary, Information: Colors.info };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.badge, { backgroundColor: typeColor[item.type] + '30', borderColor: typeColor[item.type] }]}>
          <Text style={[styles.badgeText, { color: typeColor[item.type] }]}>{item.type}</Text>
        </View>
        <Text style={styles.target}>{item.target}</Text>
      </View>
      <Text style={styles.notifTitle}>{item.title}</Text>
      <Text style={styles.message}>{item.message}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}><Text style={styles.editText}>Edit</Text></TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}><Text style={styles.addText}>+ Add</Text></TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} /> : (
        <FlatList data={notifications} keyExtractor={item => item._id} renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No notifications yet</Text>}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }} />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modal}>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Notification' : 'New Notification'}</Text>

            <Text style={styles.label}>Title *</Text>
            <TextInput style={styles.input} value={form.title} onChangeText={v => setForm({ ...form, title: v })} placeholder="Notification title" placeholderTextColor={Colors.textSecondary} />

            <Text style={styles.label}>Message *</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={form.message} onChangeText={v => setForm({ ...form, message: v })} placeholder="Notification message" placeholderTextColor={Colors.textSecondary} multiline />

            <Text style={styles.label}>Type</Text>
            <View style={styles.optionRow}>
              {['Alert', 'Announcement', 'Information'].map(t => (
                <TouchableOpacity key={t} style={[styles.option, form.type === t && styles.optionSelected]} onPress={() => setForm({ ...form, type: t })}>
                  <Text style={[styles.optionText, form.type === t && styles.optionTextSelected]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Target</Text>
            <View style={styles.optionRow}>
              {['All', 'All Members', 'All Trainers', 'Single Member', 'Single Trainer'].map(t => (
                <TouchableOpacity key={t} style={[styles.option, form.target === t && styles.optionSelected]} onPress={() => setForm({ ...form, target: t, specificUserId: '' })}>
                  <Text style={[styles.optionText, form.target === t && styles.optionTextSelected]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {form.target === 'Single Member' && (
              <>
                <Text style={styles.label}>Select Member</Text>
                <ScrollView style={styles.selectBox} nestedScrollEnabled>
                  {users.map(u => (
                    <TouchableOpacity key={u._id} style={[styles.selectOption, form.specificUserId === u._id && styles.selectOptionActive]} onPress={() => setForm({ ...form, specificUserId: u._id })}>
                      <Text style={[styles.selectOptionText, form.specificUserId === u._id && { color: Colors.primary }]}>{u.userId || `M00${u._id.substring(u._id.length - 2)}`} - {u.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {form.target === 'Single Trainer' && (
              <>
                <Text style={styles.label}>Select Trainer</Text>
                <ScrollView style={styles.selectBox} nestedScrollEnabled>
                  {trainers.map(t => (
                    <TouchableOpacity key={t._id} style={[styles.selectOption, form.specificUserId === t._id && styles.selectOptionActive]} onPress={() => setForm({ ...form, specificUserId: t._id })}>
                      <Text style={[styles.selectOptionText, form.specificUserId === t._id && { color: Colors.primary }]}>{t.userId || `M00${t._id.substring(t._id.length - 2)}`} - {t.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>Send Notification</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
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
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  target: { color: Colors.textSecondary, fontSize: 12 },
  notifTitle: { color: Colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  message: { color: Colors.textSecondary, fontSize: 14, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  editBtn: { flex: 1, backgroundColor: Colors.primary + '20', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary },
  editText: { color: Colors.primary, fontWeight: 'bold' },
  deleteBtn: { flex: 1, backgroundColor: Colors.error + '20', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.error },
  deleteText: { color: Colors.error, fontWeight: 'bold' },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalTitle: { color: Colors.text, fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  label: { color: Colors.textSecondary, fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: Colors.card, color: Colors.text, borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: Colors.border },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  optionSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { color: Colors.textSecondary, fontSize: 13 },
  optionTextSelected: { color: Colors.white, fontWeight: 'bold' },
  selectBox: { maxHeight: 150, backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, marginTop: 4 },
  selectOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  selectOptionActive: { backgroundColor: Colors.primary + '20' },
  selectOptionText: { color: Colors.text, fontSize: 14 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  cancelBtnText: { color: Colors.textSecondary, fontSize: 15 },
});
