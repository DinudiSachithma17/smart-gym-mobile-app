import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Modal, TextInput, ScrollView, Linking
} from 'react-native';
import api from '../../api/api';
import { Colors } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const statusColor = {
  Pending: '#F59E0B',
  'In Progress': '#38BDF8',
  Resolved: '#10B981',
};

export default function ComplaintManagement({ navigation }) {
  const insets = useSafeAreaInsets();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);   // complaint being viewed
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.get('/complaints');
      setComplaints(res.data);
    } catch { Alert.alert('Error', 'Failed to load complaints'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, []);

  // Open complaint → auto marks In Progress
  const openComplaint = async (item) => {
    setSelected(item);
    setReplyText('');
    if (item.status === 'Pending') {
      try {
        const res = await api.patch(`/complaints/${item._id}/view`);
        setSelected(res.data);
        setComplaints(prev => prev.map(c => c._id === res.data._id ? res.data : c));
      } catch {}
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) { Alert.alert('Error', 'Please enter a reply message'); return; }
    setReplying(true);
    try {
      const res = await api.patch(`/complaints/${selected._id}/reply`, { adminReply: replyText });
      setSelected(res.data);
      setComplaints(prev => prev.map(c => c._id === res.data._id ? res.data : c));
      Alert.alert('Success', 'Reply sent! Complaint marked as Resolved.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const priorityColor = { Low: '#10B981', Medium: '#F59E0B', High: '#EF4444' };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openComplaint(item)}>
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.complaintId}>{item.complaintId}</Text>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor[item.status] + '20', borderColor: statusColor[item.status] }]}>
          <Text style={[styles.statusText, { color: statusColor[item.status] }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <View style={[styles.priorityDot, { backgroundColor: priorityColor[item.priority] }]} />
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.priorityLabel}>[{item.priority}]</Text>
      </View>

      <Text style={styles.memberName}>👤 {item.name} · {item.email}</Text>
      <Text style={styles.preview} numberOfLines={2}>{item.description}</Text>

      {item.status !== 'Resolved' && (
        <View style={styles.tapHint}>
          <Ionicons name="eye-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.tapHintText}> Tap to {item.status === 'Pending' ? 'view & move to In Progress' : 'reply'}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Complaints</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Filter summary */}
      <View style={styles.summary}>
        {['Pending', 'In Progress', 'Resolved'].map(s => (
          <View key={s} style={[styles.summaryChip, { borderColor: statusColor[s] }]}>
            <Text style={[styles.summaryChipText, { color: statusColor[s] }]}>
              {complaints.filter(c => c.status === s).length} {s}
            </Text>
          </View>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No complaints found</Text>}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        />
      )}

      {/* Detail / Reply Modal */}
      <Modal visible={!!selected} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { paddingBottom: insets.bottom + 16 }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalId}>{selected?.complaintId}</Text>
                  <View style={[styles.statusBadge, { borderColor: statusColor[selected?.status], backgroundColor: statusColor[selected?.status] + '20', marginTop: 4 }]}>
                    <Text style={[styles.statusText, { color: statusColor[selected?.status] }]}>{selected?.status}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelected(null)}>
                  <Ionicons name="close-circle" size={28} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Category & Priority */}
              <View style={styles.detailRow}>
                <View style={[styles.priorityDot, { backgroundColor: priorityColor[selected?.priority] }]} />
                <Text style={styles.detailCategory}>{selected?.category}</Text>
                <Text style={styles.detailPriority}>[{selected?.priority} Priority]</Text>
              </View>

              {/* Member info */}
              <View style={styles.memberBox}>
                <Ionicons name="person-circle-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.memberInfo}> {selected?.name} · {selected?.email}</Text>
              </View>

              {/* Description */}
              <Text style={styles.sectionLabel}>Complaint</Text>
              <View style={styles.descBox}>
                <Text style={styles.descText}>{selected?.description}</Text>
              </View>

              {/* Attachment */}
              {selected?.fileUrl && (
                <TouchableOpacity style={styles.attachBtn} onPress={() => Linking.openURL(selected.fileUrl)}>
                  <Ionicons name="attach" size={16} color={Colors.primary} />
                  <Text style={styles.attachText}> View Attachment</Text>
                </TouchableOpacity>
              )}

              {/* Admin Reply (if already replied) */}
              {selected?.adminReply ? (
                <View style={styles.replyBox}>
                  <Text style={styles.sectionLabel}>Your Reply</Text>
                  <Text style={styles.replyText}>{selected.adminReply}</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.sectionLabel}>Reply to Member</Text>
                  <TextInput
                    style={styles.replyInput}
                    placeholder="Type your response..."
                    placeholderTextColor={Colors.textSecondary}
                    multiline
                    value={replyText}
                    onChangeText={setReplyText}
                  />
                  <TouchableOpacity style={[styles.replyBtn, replying && { opacity: 0.7 }]} onPress={handleReply} disabled={replying}>
                    {replying
                      ? <ActivityIndicator color={Colors.white} />
                      : <Text style={styles.replyBtnText}>Send Reply & Resolve</Text>}
                  </TouchableOpacity>
                </>
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

  summary: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  summaryChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  summaryChipText: { fontSize: 12, fontWeight: '700' },

  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  complaintId: { color: Colors.primary, fontWeight: 'bold', fontSize: 14 },
  date: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  category: { color: Colors.text, fontWeight: '700', fontSize: 15, flex: 1 },
  priorityLabel: { color: Colors.textSecondary, fontSize: 12 },
  memberName: { color: Colors.textSecondary, fontSize: 12, marginBottom: 6 },
  preview: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  tapHint: { flexDirection: 'row', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8 },
  tapHintText: { color: Colors.textSecondary, fontSize: 12 },

  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalId: { color: Colors.primary, fontWeight: 'bold', fontSize: 18 },

  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  detailCategory: { color: Colors.text, fontWeight: '700', fontSize: 17, flex: 1 },
  detailPriority: { color: Colors.textSecondary, fontSize: 13 },

  memberBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: Colors.card, padding: 10, borderRadius: 10 },
  memberInfo: { color: Colors.textSecondary, fontSize: 13 },

  sectionLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  descBox: { backgroundColor: Colors.card, borderRadius: 12, padding: 14 },
  descText: { color: Colors.text, fontSize: 15, lineHeight: 22 },

  attachBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  attachText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },

  replyBox: { backgroundColor: '#10B98115', borderRadius: 12, padding: 14, borderLeftWidth: 4, borderLeftColor: '#10B981', marginTop: 8 },
  replyText: { color: Colors.text, fontSize: 14, lineHeight: 22 },

  replyInput: { backgroundColor: Colors.card, color: Colors.text, borderRadius: 12, padding: 14, fontSize: 15, height: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  replyBtn: { backgroundColor: '#10B981', borderRadius: 12, padding: 16, alignItems: 'center' },
  replyBtnText: { color: Colors.white, fontWeight: '900', fontSize: 15 },
});
