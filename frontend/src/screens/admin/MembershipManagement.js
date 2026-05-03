import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, Modal, TextInput, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../api/api';
import { Colors } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MembershipManagement({ navigation }) {
  const insets = useSafeAreaInsets();
  const [memberships, setMemberships] = useState([]);
  const [packages, setPackages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingFilter, setPendingFilter] = useState(true); // true = Pending Only
  const [statusModal, setStatusModal] = useState(null);     // membership being updated
  const [updatingStatus, setUpdatingStatus] = useState('');

  const [createModal, setCreateModal] = useState(false);
  const [validatingId, setValidatingId] = useState(null);
  const [newMem, setNewMem] = useState({ userId: '', packageId: '', startDate: '', endDate: '', status: 'Paid' });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  /* ── Fetch ── */
  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const res = await api.get('/memberships');
      setMemberships(res.data);
      const pkgsRes = await api.get('/packages');
      setPackages(pkgsRes.data);
      const usersRes = await api.get('/auth/users');
      setUsers(usersRes.data);
    } catch (error) {
      console.log('Fetch error:', error.response?.data || error.message);
      Alert.alert('Error', `Failed to load data: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMemberships(); }, []);

  /* ── Computed stats ── */
  const pending = memberships.filter(m => m.paymentStatus === 'Pending');
  const active  = memberships.filter(m => m.paymentStatus === 'Paid');
  const paymentRequests = pendingFilter ? pending : memberships;

  /* ── Actions ── */
  const handleApprove = (item) => {
    Alert.alert('Validate Payment', `Approve payment from ${item.userId?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: '✓ Validate', onPress: async () => {
          try {
            // Validate the payment first
            await api.put(`/memberships/${item._id}/approve`);
            
            // Then open the modal to assign dates
            const p = packages.find(pkg => pkg._id === (item.packageId?._id || item.packageId));
            const start = new Date().toISOString().split('T')[0];
            let end = start;
            if (p) {
              const d = new Date();
              d.setMonth(d.getMonth() + (p.durationMonths || 1));
              end = d.toISOString().split('T')[0];
            }
            
            setValidatingId(item._id);
            setNewMem({
              userId: item.userId?._id || item.userId,
              packageId: p ? p._id : '',
              startDate: start,
              endDate: end,
              status: 'Paid'
            });
            setCreateModal(true);
          } catch {
            Alert.alert('Error', 'Failed to validate payment');
          }
        }
      }
    ]);
  };

  const handleReject = (id, name) => {
    Alert.alert('Reject Payment', `Reject membership for ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          try { await api.put(`/memberships/${id}/reject`); fetchMemberships(); }
          catch { Alert.alert('Error', 'Failed to reject'); }
        }
      }
    ]);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Delete this membership?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await api.delete(`/memberships/${id}`); fetchMemberships(); }
          catch { Alert.alert('Error', 'Failed to delete'); }
        }
      }
    ]);
  };

  const handleUpdateStatus = async () => {
    if (!updatingStatus || !statusModal) return;
    try {
      if (updatingStatus === 'Paid') await api.put(`/memberships/${statusModal._id}/approve`);
      else await api.put(`/memberships/${statusModal._id}/reject`);
      setStatusModal(null);
      fetchMemberships();
    } catch { Alert.alert('Error', 'Failed to update status'); }
  };

  const handleCreate = async () => {
    if (!newMem.userId || !newMem.packageId || !newMem.startDate || !newMem.endDate) {
      return Alert.alert('Error', 'Please fill all fields');
    }
    try {
      if (validatingId) {
        // We are validating an existing payment
        await api.put(`/memberships/${validatingId}/approve`, {
          startDate: newMem.startDate,
          endDate: newMem.endDate
        });
        Alert.alert('Success', 'Membership Package Saved!');
      } else {
        // Creating a brand new one manually
        await api.post('/memberships/admin', {
          userId: newMem.userId,
          packageId: newMem.packageId,
          startDate: newMem.startDate,
          endDate: newMem.endDate,
          paymentStatus: newMem.status
        });
        Alert.alert('Success', 'Membership created successfully');
      }
      
      setCreateModal(false);
      setValidatingId(null);
      setNewMem({ userId: '', packageId: '', startDate: '', endDate: '', status: 'Paid' });
      fetchMemberships();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save membership');
    }
  };

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      const startStr = selectedDate.toISOString().split('T')[0];
      let endStr = startStr;
      
      if (newMem.packageId) {
        const p = packages.find(pkg => pkg._id === newMem.packageId);
        if (p) {
          const d = new Date(selectedDate);
          d.setMonth(d.getMonth() + (p.durationMonths || 1));
          endStr = d.toISOString().split('T')[0];
        }
      }
      
      setNewMem({ ...newMem, startDate: startStr, endDate: endStr });
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setNewMem({ ...newMem, endDate: selectedDate.toISOString().split('T')[0] });
    }
  };

  /* ── Helpers ── */
  const fmtDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '—';
  const fmtDateTime = (d) => d ? new Date(d).toLocaleString() : '—';

  const statusBg  = { Pending: '#f59e0b', Paid: '#10b981', Failed: '#ef4444' };
  const statusLbl = { Pending: 'Pending', Paid: 'Active', Failed: 'Rejected' };

  return (
    <View style={styles.container}>
      {/* ── Top Bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📋 Membership Management</Text>
        <TouchableOpacity onPress={fetchMemberships}>
          <Text style={styles.refreshBtn}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* ── Sub-header ── */}
      <View style={styles.subHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subTitle}>Membership Management</Text>
          <Text style={styles.subDesc}>Review payment requests and manage active memberships</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setValidatingId(null); setCreateModal(true); }}>
          <Text style={styles.addBtnText}>+ Create Membership</Text>
        </TouchableOpacity>
      </View>

      {/* ── Stats Bar ── */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#f59e0b22', borderColor: '#f59e0b' }]}>
          <Text style={styles.statIcon}>🔔</Text>
          <Text style={[styles.statNum, { color: '#f59e0b' }]}>{pending.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#3b82f622', borderColor: '#3b82f6' }]}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={[styles.statNum, { color: '#3b82f6' }]}>{memberships.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#10b98122', borderColor: '#10b981' }]}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={[styles.statNum, { color: '#10b981' }]}>{active.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>

          {/* ── Payment Verification Requests ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔔 Payment Verification Requests</Text>
              <View style={styles.sectionActions}>
                <TouchableOpacity
                  style={[styles.filterPill, pendingFilter && styles.filterPillActive]}
                  onPress={() => setPendingFilter(!pendingFilter)}
                >
                  <Text style={[styles.filterPillText, pendingFilter && styles.filterPillTextActive]}>
                    {pendingFilter ? 'Pending Only' : 'All'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.refreshPill} onPress={fetchMemberships}>
                  <Text style={styles.refreshPillText}>↻ Refresh</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.th, { flex: 1.2 }]}>MEMBER</Text>
              <Text style={[styles.th, { flex: 1.6 }]}>EMAIL</Text>
              <Text style={[styles.th, { flex: 0.9 }]}>PKG</Text>
              <Text style={[styles.th, { flex: 0.9 }]}>AMOUNT</Text>
            </View>

            {paymentRequests.length === 0 ? (
              <Text style={styles.emptyText}>No pending requests</Text>
            ) : (
              paymentRequests.map(item => (
                <View key={item._id} style={styles.verifyCard}>
                  <View style={styles.verifyTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.verifyName}>{item.userId?.name || '—'}</Text>
                      <Text style={styles.verifyEmail}>{item.userId?.email || '—'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.verifyPkg}>{item.packageId?.planName || item.packageId?.planType || '—'}</Text>
                      <Text style={styles.verifyAmount}>Rs. {item.packageId?.price?.toLocaleString() || '—'}</Text>
                    </View>
                  </View>
                  <Text style={styles.verifyDate}>📅 Submitted: {fmtDateTime(item.createdAt)}</Text>
                  {item.paymentStatus === 'Pending' && (
                    <View style={styles.verifyActions}>
                      <TouchableOpacity
                        style={styles.validateBtn}
                        onPress={() => handleApprove(item)}
                      >
                        <Text style={styles.validateBtnText}>✓ Validate</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleReject(item._id, item.userId?.name)}
                      >
                        <Text style={styles.rejectBtnText}>✕ Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {item.paymentStatus !== 'Pending' && (
                    <View style={[styles.statusBadge, { backgroundColor: statusBg[item.paymentStatus] + '30' }]}>
                      <Text style={[styles.statusBadgeText, { color: statusBg[item.paymentStatus] }]}>
                        {statusLbl[item.paymentStatus]}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          {/* ── Current Memberships ── */}
          <View style={[styles.section, { marginTop: 16 }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💳 Current Memberships</Text>
              <TouchableOpacity style={styles.refreshPill} onPress={fetchMemberships}>
                <Text style={styles.refreshPillText}>↻ Refresh</Text>
              </TouchableOpacity>
            </View>

            {/* Column headers */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.th, { flex: 0.6 }]}>ID</Text>
              <Text style={[styles.th, { flex: 1.2 }]}>NAME</Text>
              <Text style={[styles.th, { flex: 0.9 }]}>TYPE</Text>
              <Text style={[styles.th, { flex: 1 }]}>START</Text>
              <Text style={[styles.th, { flex: 1 }]}>END</Text>
              <Text style={[styles.th, { flex: 0.9 }]}>STATUS</Text>
            </View>

            {memberships.length === 0 ? (
              <Text style={styles.emptyText}>No memberships found</Text>
            ) : (
              memberships.map((item, index) => (
                <View key={item._id} style={styles.membershipCard}>
                  {/* Row info */}
                  <View style={styles.membershipTopRow}>
                    <View style={styles.rowNum}>
                      <Text style={styles.rowNumText}>{item.membershipId || `M00${index + 1}`}</Text>
                    </View>
                    <View style={{ flex: 1, paddingLeft: 5 }}>
                      <Text style={styles.membershipName}>{item.userId?.name || '—'}</Text>
                      <Text style={styles.membershipEmail}>{item.userId?.email || ''}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg[item.paymentStatus] + '25' }]}>
                      <Text style={[styles.statusBadgeText, { color: statusBg[item.paymentStatus] }]}>
                        {statusLbl[item.paymentStatus]}
                      </Text>
                    </View>
                  </View>

                  {/* Details row */}
                  <View style={styles.membershipDetails}>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>Type</Text>
                      <Text style={styles.detailValue}>{item.packageId?.planType || '—'}</Text>
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>Start</Text>
                      <Text style={styles.detailValue}>{fmtDate(item.startDate)}</Text>
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>End</Text>
                      <Text style={styles.detailValue}>{fmtDate(item.endDate)}</Text>
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>Amount</Text>
                      <Text style={styles.detailValue}>Rs. {item.packageId?.price?.toLocaleString() || '—'}</Text>
                    </View>
                  </View>

                  {/* Action buttons */}
                  <View style={styles.membershipActions}>
                    <TouchableOpacity
                      style={styles.updateBtn}
                      onPress={() => { setStatusModal(item); setUpdatingStatus(item.paymentStatus); }}
                    >
                      <Text style={styles.updateBtnText}>↺ Update Status</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteSmallBtn}
                      onPress={() => handleDelete(item._id)}
                    >
                      <Text style={styles.deleteSmallBtnText}>🗑 Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* ── Update Status Modal ── */}
      <Modal visible={!!statusModal} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.modalTitle}>Update Membership Status</Text>
            <Text style={styles.modalSub}>Member: {statusModal?.userId?.name}</Text>

            {['Paid', 'Pending', 'Failed'].map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.statusOption, updatingStatus === s && { borderColor: statusBg[s], backgroundColor: statusBg[s] + '20' }]}
                onPress={() => setUpdatingStatus(s)}
              >
                <View style={[styles.statusDot, { backgroundColor: statusBg[s] }]} />
                <Text style={[styles.statusOptionText, updatingStatus === s && { color: statusBg[s], fontWeight: 'bold' }]}>
                  {statusLbl[s]}
                </Text>
                {updatingStatus === s && <Text style={{ color: statusBg[s], marginLeft: 'auto' }}>✓</Text>}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleUpdateStatus}>
              <Text style={styles.modalSaveBtnText}>Save Status</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setStatusModal(null)}>
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Create Membership Modal ── */}
      <Modal visible={createModal} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { paddingBottom: insets.bottom + 20, maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Create Membership</Text>
              <Text style={styles.modalSub}>Assign a package to a member</Text>

              <Text style={styles.inputLabel}>MEMBER</Text>
              <ScrollView style={[styles.selectBox, validatingId && { opacity: 0.5 }]} nestedScrollEnabled>
                {users.map(u => (
                  <TouchableOpacity
                    key={u._id}
                    disabled={!!validatingId}
                    style={[styles.selectOption, newMem.userId === u._id && styles.selectOptionActive]}
                    onPress={() => setNewMem({ ...newMem, userId: u._id })}
                  >
                    <Text style={[styles.selectOptionText, newMem.userId === u._id && { color: Colors.primary }]}>
                      {u.name} ({u.userId || 'M001'})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>PACKAGE</Text>
              <ScrollView style={[styles.selectBox, validatingId && { opacity: 0.5 }]} nestedScrollEnabled>
                {packages.map(p => (
                  <TouchableOpacity
                    key={p._id}
                    disabled={!!validatingId}
                    style={[styles.selectOption, newMem.packageId === p._id && styles.selectOptionActive]}
                    onPress={() => {
                      const startStr = newMem.startDate || new Date().toISOString().split('T')[0];
                      const d = new Date(startStr);
                      d.setMonth(d.getMonth() + (p.durationMonths || 1));
                      const endStr = d.toISOString().split('T')[0];
                      
                      setNewMem({ 
                        ...newMem, 
                        packageId: p._id, 
                        startDate: startStr, 
                        endDate: endStr 
                      });
                    }}
                  >
                    <Text style={[styles.selectOptionText, newMem.packageId === p._id && { color: Colors.primary }]}>
                      {p.planName || p.planType || 'Package'} - Rs. {p.price}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>START DATE</Text>
              {Platform.OS === 'web' ? (
                <TextInput
                  {...{ type: 'date' }}
                  style={styles.webDateInput}
                  value={newMem.startDate}
                  onChangeText={t => {
                    let endStr = t;
                    if (newMem.packageId && t) {
                      const p = packages.find(pkg => pkg._id === newMem.packageId);
                      if (p) {
                        const d = new Date(t);
                        d.setMonth(d.getMonth() + (p.durationMonths || 1));
                        endStr = d.toISOString().split('T')[0];
                      }
                    }
                    setNewMem({ ...newMem, startDate: t, endDate: endStr });
                  }}
                />
              ) : (
                <TouchableOpacity onPress={() => setShowStartPicker(true)}>
                  <View style={styles.input}>
                    <Text style={{ color: newMem.startDate ? '#fff' : '#64748b' }}>
                      {newMem.startDate || 'YYYY-MM-DD'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              {showStartPicker && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={newMem.startDate ? new Date(newMem.startDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={handleStartDateChange}
                />
              )}

              <Text style={styles.inputLabel}>END DATE</Text>
              {Platform.OS === 'web' ? (
                <TextInput
                  {...{ type: 'date' }}
                  style={styles.webDateInput}
                  value={newMem.endDate}
                  onChangeText={t => setNewMem({ ...newMem, endDate: t })}
                />
              ) : (
                <TouchableOpacity onPress={() => setShowEndPicker(true)}>
                  <View style={styles.input}>
                    <Text style={{ color: newMem.endDate ? '#fff' : '#64748b' }}>
                      {newMem.endDate || 'YYYY-MM-DD'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              {showEndPicker && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={newMem.endDate ? new Date(newMem.endDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={handleEndDateChange}
                />
              )}

              {validatingId ? null : (
                <>
                  <Text style={styles.inputLabel}>STATUS</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                    {['Paid', 'Pending'].map(s => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.filterPill, newMem.status === s && styles.filterPillActive, { flex: 1, alignItems: 'center' }]}
                        onPress={() => setNewMem({ ...newMem, status: s })}
                      >
                        <Text style={[styles.filterPillText, newMem.status === s && styles.filterPillTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCreate}>
                <Text style={styles.modalSaveBtnText}>{validatingId ? 'Save & Validate' : 'Save Package'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setCreateModal(false); setValidatingId(null); }}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#1e293b',
  },
  back: { color: Colors.primary, fontSize: 15 },
  title: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  refreshBtn: { color: Colors.primary, fontSize: 22 },

  subHeader: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#1e293b', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#334155' },
  subTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  subDesc: { color: '#94a3b8', fontSize: 12, marginTop: 3 },
  addBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#000', fontWeight: 'bold', fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: '#1e293b' },
  statCard: {
    flex: 1, borderRadius: 12, borderWidth: 1, padding: 12,
    alignItems: 'center',
  },
  statIcon: { fontSize: 18, marginBottom: 4 },
  statNum: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#94a3b8', fontSize: 11, marginTop: 2 },

  section: { backgroundColor: '#1e293b', borderRadius: 16, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#334155' },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', flex: 1 },
  sectionActions: { flexDirection: 'row', gap: 8 },

  filterPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#475569', backgroundColor: '#334155' },
  filterPillActive: { backgroundColor: Colors.primary + '30', borderColor: Colors.primary },
  filterPillText: { color: '#94a3b8', fontSize: 11 },
  filterPillTextActive: { color: Colors.primary, fontWeight: 'bold' },
  refreshPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#475569', backgroundColor: '#334155' },
  refreshPillText: { color: '#94a3b8', fontSize: 11 },

  tableRow: { flexDirection: 'row', paddingHorizontal: 14 },
  tableHeader: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155', backgroundColor: '#0f172a' },
  th: { color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  emptyText: { color: '#64748b', textAlign: 'center', padding: 20, fontSize: 14 },

  /* Verification cards */
  verifyCard: { margin: 10, backgroundColor: '#0f172a', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#334155' },
  verifyTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  verifyName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  verifyEmail: { color: '#94a3b8', fontSize: 11 },
  verifyPkg: { color: Colors.primary, fontWeight: '600', fontSize: 13, textAlign: 'right' },
  verifyAmount: { color: '#f59e0b', fontWeight: 'bold', fontSize: 13, textAlign: 'right' },
  verifyDate: { color: '#64748b', fontSize: 11, marginBottom: 10 },
  verifyActions: { flexDirection: 'row', gap: 8 },
  validateBtn: { flex: 1, backgroundColor: '#10b98120', borderWidth: 1, borderColor: '#10b981', borderRadius: 8, padding: 9, alignItems: 'center' },
  validateBtnText: { color: '#10b981', fontWeight: 'bold', fontSize: 13 },
  rejectBtn: { flex: 1, backgroundColor: '#ef444420', borderWidth: 1, borderColor: '#ef4444', borderRadius: 8, padding: 9, alignItems: 'center' },
  rejectBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 13 },

  /* Status badge */
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold' },

  /* Membership cards */
  membershipCard: { margin: 10, backgroundColor: '#0f172a', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#334155' },
  membershipTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  rowNum: { paddingHorizontal: 8, height: 30, borderRadius: 6, backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center' },
  rowNumText: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  membershipName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  membershipEmail: { color: '#94a3b8', fontSize: 11 },
  membershipDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  detailCol: { minWidth: '22%' },
  detailLabel: { color: '#64748b', fontSize: 10, letterSpacing: 0.5, marginBottom: 2 },
  detailValue: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
  membershipActions: { flexDirection: 'row', gap: 8 },
  updateBtn: { flex: 1, backgroundColor: Colors.primary + '20', borderWidth: 1, borderColor: Colors.primary, borderRadius: 8, padding: 8, alignItems: 'center' },
  updateBtnText: { color: Colors.primary, fontWeight: 'bold', fontSize: 12 },
  deleteSmallBtn: { backgroundColor: '#ef444420', borderWidth: 1, borderColor: '#ef4444', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  deleteSmallBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },

  /* Status modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  modalSub: { color: '#94a3b8', fontSize: 13, marginBottom: 20 },
  statusOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 10, backgroundColor: '#0f172a' },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusOptionText: { color: '#cbd5e1', fontSize: 15 },
  modalSaveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 10 },
  modalSaveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalCancelBtn: { padding: 14, alignItems: 'center' },
  modalCancelBtnText: { color: '#64748b', fontSize: 15 },

  /* Form */
  inputLabel: { color: '#94a3b8', fontSize: 11, letterSpacing: 1, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0f172a', color: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#334155' },
  selectBox: { maxHeight: 120, backgroundColor: '#0f172a', borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  selectOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  selectOptionActive: { backgroundColor: '#1e293b' },
  selectOptionText: { color: '#cbd5e1', fontSize: 14 },
  webDateInput: {
    backgroundColor: '#0f172a', color: '#fff', borderRadius: 10, padding: 14, 
    borderWidth: 1, borderColor: '#334155', fontSize: 15, outline: 'none', width: '100%'
  }
});
