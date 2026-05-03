import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import api from '../../api/api';
import { Colors } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FeedbackManagement({ navigation }) {
  const insets = useSafeAreaInsets();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    try { setLoading(true); const res = await api.get('/feedback'); setFeedback(res.data); }
    catch { Alert.alert('Error', 'Failed to load feedback'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFeedback(); }, []);

  const markReviewed = async (id) => {
    try { await api.patch(`/feedback/${id}/view`); fetchFeedback(); }
    catch { Alert.alert('Error', 'Failed to mark as reviewed'); }
  };

  const renderStars = (rating) => '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.feedbackId}>{item.feedbackId}</Text>
        <View style={[styles.badge, { backgroundColor: item.status === 'Reviewed' ? Colors.success + '30' : Colors.warning + '30', borderColor: item.status === 'Reviewed' ? Colors.success : Colors.warning }]}>
          <Text style={[styles.badgeText, { color: item.status === 'Reviewed' ? Colors.success : Colors.warning }]}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.typeBadge}>
        <Text style={styles.typeText}>{item.type === 'Trainer' ? '🏋️ Trainer Feedback' : '🏢 Gym Feedback'}</Text>
      </View>
      <Text style={styles.stars}>{renderStars(item.rating)}</Text>
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.member}>👤 {item.memberId?.name || 'Member'} · {item.memberId?.email || ''}</Text>
      {item.type === 'Trainer' && item.trainerId && (
        <Text style={styles.trainerRef}>🏋️ For: {item.trainerId?.name || 'Trainer'}</Text>
      )}
      {!item.viewedByAdmin ? (
        <TouchableOpacity style={styles.reviewBtn} onPress={() => markReviewed(item._id)}>
          <Text style={styles.reviewText}>👁 Mark as Reviewed — locks member editing</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.viewedBadge}>
          <Text style={styles.viewedText}>✅ Reviewed — member can no longer edit this</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>All Feedback</Text>
        <View style={{ width: 60 }} />
      </View>
      {loading ? <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} /> : (
        <FlatList data={feedback} keyExtractor={item => item._id} renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No feedback found</Text>}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: Colors.surface },
  back: { color: Colors.primary, fontSize: 16 },
  title: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  feedbackId: { color: Colors.primary, fontWeight: 'bold', fontSize: 13 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  typeBadge: { backgroundColor: Colors.card, borderRadius: 8, padding: 6, alignSelf: 'flex-start', marginBottom: 8 },
  typeText: { color: Colors.textSecondary, fontSize: 13 },
  stars: { fontSize: 16, marginBottom: 6 },
  message: { color: Colors.text, fontSize: 14, marginBottom: 8 },
  member: { color: Colors.textSecondary, fontSize: 12, marginBottom: 10 },
  reviewBtn: { backgroundColor: Colors.success + '20', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.success },
  reviewText: { color: Colors.success, fontWeight: 'bold', fontSize: 13 },
  viewedBadge: { backgroundColor: Colors.info + '15', borderRadius: 8, padding: 8, borderLeftWidth: 3, borderLeftColor: Colors.info },
  viewedText: { color: Colors.info, fontSize: 12, fontWeight: '600' },
  trainerRef: { color: Colors.secondary, fontSize: 12, marginBottom: 6 },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },
});
