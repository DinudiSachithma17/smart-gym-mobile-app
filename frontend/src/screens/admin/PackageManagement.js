import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Modal, TextInput, ScrollView, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../api/api';
import { Colors } from '../../constants/colors';
import { pickImage, buildFormData } from '../../utils/filePicker';

const PLAN_TYPES = ['Monthly', 'Quarterly', 'Annually'];
const PLAN_DURATIONS = { Monthly: '1 Month', Quarterly: '3 Months', Annually: '12 Months (1 Year)' };
const PLAN_PERIOD = { Monthly: '/month', Quarterly: '/3 months', Annually: '/year' };

const PackageCard = ({ pkg, onEdit, onDelete }) => (
  <View style={[styles.card, pkg.planType === 'Annually' && styles.cardBestValue]}>
    {pkg.badge ? (
      <View style={[styles.badge, pkg.planType === 'Annually' ? styles.badgeBest : styles.badgeSave]}>
        <Text style={styles.badgeText}>{pkg.badge}</Text>
      </View>
    ) : null}
    {pkg.imageUrl && (
      <Image source={{ uri: pkg.imageUrl }} style={styles.packageImg} resizeMode="cover" />
    )}
    <Text style={styles.planName}>{pkg.planType || pkg.planName}</Text>
    <View style={styles.priceRow}>
      <Text style={styles.price}>Rs. {pkg.price?.toLocaleString()}</Text>
      <Text style={styles.period}>{PLAN_PERIOD[pkg.planType] || '/month'}</Text>
    </View>
    <Text style={styles.duration}>⏱ {PLAN_DURATIONS[pkg.planType] || '1 Month'}</Text>
    <View style={styles.benefitsList}>
      {(pkg.benefits || []).map((b, i) => (
        <Text key={i} style={styles.benefit}>✓ {b}</Text>
      ))}
    </View>
    {pkg.notes ? <Text style={styles.notes}>📝 {pkg.notes}</Text> : null}
    <View style={styles.actions}>
      <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(pkg)}>
        <Text style={styles.editText}>✏️ Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(pkg._id)}>
        <Text style={styles.deleteText}>🗑 Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function PackageManagement({ navigation }) {
  const insets = useSafeAreaInsets();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [form, setForm] = useState({
    planName: '', planType: 'Monthly', price: '', benefits: '', badge: '', notes: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/packages');
      setPackages(res.data);
    } catch {
      Alert.alert('Error', 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPackages(); }, []);

  const openCreate = () => {
    setEditingPkg(null);
    setForm({ planName: '', planType: 'Monthly', price: '', benefits: '', badge: '', notes: '' });
    setSelectedImage(null);
    setModalVisible(true);
  };

  const openEdit = (pkg) => {
    setEditingPkg(pkg);
    setForm({
      planName: pkg.planName || '',
      planType: pkg.planType || 'Monthly',
      price: String(pkg.price || ''),
      benefits: (pkg.benefits || []).join(', '),
      badge: pkg.badge || '',
      notes: pkg.notes || '',
    });
    setSelectedImage(null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.planType || !form.price) {
      Alert.alert('Error', 'Plan Type and Price are required');
      return;
    }
    setUploading(true);
    try {
      const extraFields = {
        planName: form.planName || form.planType,
        planType: form.planType,
        price: form.price,
        benefits: form.benefits.split(',').map(b => b.trim()).filter(Boolean).join(','),
        badge: form.badge || '',
        notes: form.notes || '',
      };
      const formData = buildFormData('image', selectedImage, extraFields);
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editingPkg) {
        await api.put(`/packages/${editingPkg._id}`, formData, config);
        Alert.alert('✅ Updated', 'Package updated successfully');
      } else {
        await api.post('/packages', formData, config);
        Alert.alert('✅ Created', 'Package created successfully');
      }
      setModalVisible(false);
      fetchPackages();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save package');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Package', 'Are you sure you want to delete this package?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/packages/${id}`);
            fetchPackages();
          } catch {
            Alert.alert('Error', 'Failed to delete package');
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📦 Packages</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={packages}
          keyExtractor={item => item._id}
          renderItem={({ item }) => <PackageCard pkg={item} onEdit={openEdit} onDelete={handleDelete} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.empty}>No packages yet. Tap "+ Add" to create one!</Text>
            </View>
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { paddingBottom: insets.bottom }]}>
            {/* Modal Header — always pinned at top */}
            <View style={styles.modalHeader}>
              <View style={styles.dragHandle} />
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>{editingPkg ? '✏️ Edit Package' : '➕ New Package'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Scrollable Form Content */}
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            >
              {/* Plan Type Selector — FIRST so it's always visible */}
              <Text style={styles.label}>Plan Type *</Text>
              <View style={styles.typeRow}>
                {PLAN_TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, form.planType === t && styles.typeBtnActive]}
                    onPress={() => setForm({ ...form, planType: t })}
                  >
                    <Text style={[styles.typeBtnText, form.planType === t && styles.typeBtnTextActive]}>{t}</Text>
                    <Text style={[styles.typeDuration, form.planType === t && { color: Colors.white }]}>
                      {PLAN_DURATIONS[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Custom Plan Name (optional)</Text>
              <TextInput
                style={styles.input}
                value={form.planName}
                onChangeText={v => setForm({ ...form, planName: v })}
                placeholderTextColor={Colors.textSecondary}
                placeholder={`e.g. ${form.planType} Premium`}
              />

              <Text style={styles.label}>Price (Rs.) *</Text>
              <TextInput
                style={styles.input}
                value={form.price}
                onChangeText={v => setForm({ ...form, price: v })}
                placeholderTextColor={Colors.textSecondary}
                placeholder="e.g. 3500"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Benefits (comma separated)</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={form.benefits}
                onChangeText={v => setForm({ ...form, benefits: v })}
                placeholderTextColor={Colors.textSecondary}
                placeholder="e.g. 24/7 Gym Access, Locker Room, Free Classes"
                multiline
              />

              <Text style={styles.label}>Badge (optional)</Text>
              <TextInput
                style={styles.input}
                value={form.badge}
                onChangeText={v => setForm({ ...form, badge: v })}
                placeholderTextColor={Colors.textSecondary}
                placeholder="e.g. Save 10%  |  Best Value"
              />

              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={styles.input}
                value={form.notes}
                onChangeText={v => setForm({ ...form, notes: v })}
                placeholderTextColor={Colors.textSecondary}
                placeholder="Any additional notes"
              />

              <Text style={styles.label}>Package Image (optional)</Text>
              <TouchableOpacity style={styles.filePickerBtn} onPress={async () => { const img = await pickImage(); if (img) setSelectedImage(img); }}>
                <Text style={styles.filePickerIcon}>🖼️</Text>
                <Text style={styles.filePickerText}>{selectedImage ? selectedImage.name : 'Choose a banner image'}</Text>
              </TouchableOpacity>
              {selectedImage && (
                <>
                  <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} resizeMode="cover" />
                  <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeFile}>
                    <Text style={styles.removeFileText}>✕ Remove image</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity style={[styles.saveBtn, uploading && { opacity: 0.7 }]} onPress={handleSave} disabled={uploading}>
                {uploading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>💾 Save Package</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, backgroundColor: Colors.surface,
  },
  back: { color: Colors.primary, fontSize: 16 },
  title: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addText: { color: Colors.white, fontWeight: 'bold' },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: Colors.border,
  },
  cardBestValue: { borderColor: Colors.primary, borderWidth: 2 },
  packageImg: { width: '100%', height: 140, borderRadius: 12, marginBottom: 10 },
  badge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  badgeSave: { backgroundColor: Colors.primary },
  badgeBest: { backgroundColor: Colors.warning },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: 'bold' },
  planName: { color: Colors.text, fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 2 },
  price: { color: Colors.primary, fontSize: 26, fontWeight: 'bold' },
  period: { color: Colors.textSecondary, fontSize: 14, marginLeft: 4 },
  duration: { color: Colors.textSecondary, fontSize: 12, marginBottom: 10 },
  benefitsList: { marginBottom: 10 },
  benefit: { color: Colors.text, fontSize: 14, marginBottom: 4 },
  notes: { color: Colors.textSecondary, fontSize: 12, fontStyle: 'italic', marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  editBtn: { flex: 1, backgroundColor: Colors.primary + '20', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary },
  editText: { color: Colors.primary, fontWeight: 'bold' },
  deleteBtn: { flex: 1, backgroundColor: Colors.error + '20', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.error },
  deleteText: { color: Colors.error, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  empty: { color: Colors.textSecondary, textAlign: 'center', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '95%',
  },
  modalHeader: { padding: 20, paddingBottom: 0 },
  dragHandle: {
    width: 40, height: 4, backgroundColor: Colors.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: 12,
  },
  modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
  closeBtn: { padding: 6, backgroundColor: Colors.card, borderRadius: 20, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: Colors.textSecondary, fontSize: 16, fontWeight: 'bold' },
  label: { color: Colors.textSecondary, fontSize: 13, marginBottom: 6, marginTop: 14, paddingHorizontal: 20 },
  typeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  typeBtn: {
    flex: 1, padding: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeBtnText: { color: Colors.text, fontWeight: 'bold', fontSize: 13 },
  typeBtnTextActive: { color: Colors.white },
  typeDuration: { color: Colors.textSecondary, fontSize: 10, marginTop: 3 },
  input: {
    backgroundColor: Colors.card, color: Colors.text, borderRadius: 12,
    padding: 14, fontSize: 15, borderWidth: 1, borderColor: Colors.border,
    marginHorizontal: 20,
  },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20, marginHorizontal: 20 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8, marginBottom: 30, marginHorizontal: 20 },
  cancelBtnText: { color: Colors.textSecondary, fontSize: 15 },
  filePickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', marginHorizontal: 20 },
  filePickerIcon: { fontSize: 20, marginRight: 10 },
  filePickerText: { color: Colors.textSecondary, fontSize: 14, flex: 1 },
  previewImage: { width: '90%', height: 140, borderRadius: 12, marginTop: 10, alignSelf: 'center' },
  removeFile: { alignItems: 'center', marginTop: 6 },
  removeFileText: { color: Colors.error, fontSize: 13 },
});
