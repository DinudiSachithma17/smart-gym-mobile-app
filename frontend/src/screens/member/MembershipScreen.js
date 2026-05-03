import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import api from '../../api/api';
import { Colors } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MembershipScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMemberships = async () => {
    try { setLoading(true); const res = await api.get('/memberships/my'); setMemberships(res.data); }
    catch { Alert.alert('Error', 'Failed to load memberships'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMemberships(); }, []);

  const statusColor = { Pending: Colors.warning, Paid: Colors.success, Failed: Colors.error };

  const renderItem = ({ item }) => {
    const start = new Date(item.startDate).toLocaleDateString();
    const end = new Date(item.endDate).toLocaleDateString();
    const isActive = new Date(item.endDate) > new Date() && item.paymentStatus === 'Paid';

    return (
      <View style={[styles.card, isActive && styles.activeCard]}>
        {isActive && <View style={styles.activeBanner}><Text style={styles.activeBannerText}>✓ ACTIVE</Text></View>}
        <View style={styles.cardTop}>
          <Text style={styles.membershipId}>{item.membershipId}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor[item.paymentStatus] + '30', borderColor: statusColor[item.paymentStatus] }]}>
            <Text style={[styles.badgeText, { color: statusColor[item.paymentStatus] }]}>{item.paymentStatus}</Text>
          </View>
        </View>
        <Text style={styles.planName}>{item.packageId?.planName || 'Package'}</Text>
        <Text style={styles.price}>LKR {item.packageId?.price?.toLocaleString() || '—'}</Text>
        <View style={styles.dates}>
          <Text style={styles.date}>📅 Start: {start}</Text>
          <Text style={styles.date}>📅 End: {end}</Text>
        </View>
        
        {item.paymentStatus === 'Pending' && (
          <View style={styles.pendingContainer}>
            <Text style={styles.pendingTitle}>⏳ Payment Under Review</Text>
            <Text style={styles.pendingText}>
              Your Monthly membership payment has been securely received and is awaiting admin validation. You will be notified once it's approved.
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>My Memberships</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('Packages')}><Text style={styles.addText}>+ Enroll</Text></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} /> : (
        <FlatList data={memberships} keyExtractor={item => item._id} renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.empty}>No memberships yet</Text>
              <TouchableOpacity style={styles.enrollBtn} onPress={() => navigation.navigate('Packages')}>
                <Text style={styles.enrollText}>Browse Packages</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: Colors.surface },
  back: { color: Colors.primary, fontSize: 16 }, title: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
  addBtn: { backgroundColor: Colors.success, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addText: { color: Colors.white, fontWeight: 'bold' },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, overflow: 'hidden' },
  activeCard: { borderWidth: 1, borderColor: Colors.success },
  activeBanner: { backgroundColor: Colors.success, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8 },
  activeBannerText: { color: Colors.white, fontWeight: 'bold', fontSize: 11 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  membershipId: { color: Colors.primary, fontWeight: 'bold', fontSize: 13 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  planName: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  price: { color: Colors.success, fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  dates: { gap: 4 }, date: { color: Colors.textSecondary, fontSize: 13 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  empty: { color: Colors.textSecondary, textAlign: 'center', fontSize: 16, marginBottom: 20 },
  enrollBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  enrollText: { color: Colors.white, fontWeight: 'bold', fontSize: 15 },
  pendingContainer: { backgroundColor: Colors.warning + '15', borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1, borderColor: Colors.warning + '50' },
  pendingTitle: { color: Colors.warning, fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  pendingText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
});
