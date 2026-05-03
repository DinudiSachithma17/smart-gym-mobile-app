import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Modal, ScrollView
} from 'react-native';
import api from '../../api/api';
import { Colors } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PLAN_PERIOD = { Monthly: '/month', Quarterly: '/3 months', Annually: '/year' };

export default function PackagesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMembership, setActiveMembership] = useState(null);

  const fetchPackagesAndMemberships = async () => {
    try {
      setLoading(true);
      // Fetch user's memberships
      const memRes = await api.get('/memberships/my');
      const memberships = memRes.data;
      
      // Check if any membership is active or pending
      const current = memberships.find(m => 
        (m.paymentStatus === 'Paid' || m.paymentStatus === 'Pending') &&
        new Date(m.endDate) > new Date()
      );

      if (current) {
        setActiveMembership(current);
      } else {
        const pkgRes = await api.get('/packages');
        setPackages(pkgRes.data);
      }
    } catch (error) {
      console.log('Fetch error:', error.response?.data || error.message);
      Alert.alert('Error', `Failed to load data: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPackagesAndMemberships(); }, []);

  const handleActivate = (pkg) => {
    navigation.navigate('Payment', { pkg });
  };

  const handleConfirmPayment = async () => {
    if (!selectedPkg) return;
    setEnrolling(true);
    try {
      await api.post('/memberships', { packageId: selectedPkg._id });
      setSelectedPkg(null);
      Alert.alert(
        '⏳ Payment Submitted',
        `Your ${selectedPkg.planType} membership payment of Rs. ${selectedPkg.price?.toLocaleString()} has been securely received and is awaiting admin validation.\n\nYou will be notified once it's approved.`,
        [{ text: 'View My Membership', onPress: () => navigation.navigate('Memberships') }]
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Enrollment failed. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const renderItem = ({ item }) => {
    const period = PLAN_PERIOD[item.planType] || '/month';
    const isBest = item.planType === 'Annually';
    const isSave = item.planType === 'Quarterly';

    return (
      <View style={[styles.card, isBest && styles.cardHighlight]}>
        {item.badge ? (
          <View style={[styles.badgeContainer, isBest ? styles.badgeBest : styles.badgeSave]}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        ) : null}

        <Text style={styles.planType}>{item.planType}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>Rs. {item.price?.toLocaleString()}</Text>
          <Text style={styles.period}>{period}</Text>
        </View>

        <View style={styles.benefitsList}>
          {(item.benefits || []).map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.benefit}>{b}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.activateBtn, isBest && styles.activateBtnHighlight]}
          onPress={() => handleActivate(item)}
        >
          <Text style={styles.activateBtnText}>ACTIVATE</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose a Plan</Text>
        <View style={{ width: 50 }} />
      </View>

      <Text style={styles.subtitle}>Select the membership package that suits you best</Text>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
      ) : activeMembership ? (
        <View style={styles.activeContainer}>
          <Text style={styles.activeIcon}>🎉</Text>
          <Text style={styles.activeTitle}>You have an active package!</Text>
          <Text style={styles.activeDesc}>
            Your {activeMembership.packageId?.planName || activeMembership.packageId?.planType} membership is currently {activeMembership.paymentStatus}. 
            You can purchase a new package once this one expires on {new Date(activeMembership.endDate).toLocaleDateString()}.
          </Text>
          <TouchableOpacity style={styles.viewMemBtn} onPress={() => navigation.navigate('Memberships')}>
            <Text style={styles.viewMemBtnText}>View My Memberships</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={packages}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.empty}>No packages available yet.</Text>
            </View>
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
        />
      )}

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
  subtitle: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', marginVertical: 12, paddingHorizontal: 20 },

  // Package Cards (2-col grid like screenshot)
  card: {
    flex: 1, backgroundColor: '#0d1b2a', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#1e3a5f',
  },
  cardHighlight: { borderColor: Colors.primary, borderWidth: 2 },
  badgeContainer: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  badgeSave: { backgroundColor: Colors.primary },
  badgeBest: { backgroundColor: Colors.warning },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: 'bold' },
  planType: { color: Colors.white, fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  price: { color: Colors.primary, fontSize: 20, fontWeight: 'bold' },
  period: { color: Colors.textSecondary, fontSize: 12, marginLeft: 3 },
  benefitsList: { marginBottom: 14 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 },
  checkmark: { color: Colors.primary, fontSize: 13, marginRight: 6, marginTop: 1 },
  benefit: { color: '#a0b4c8', fontSize: 12, flex: 1 },
  activateBtn: {
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 8,
    padding: 10, alignItems: 'center', marginTop: 4,
  },
  activateBtnHighlight: { backgroundColor: Colors.primary + '30' },
  activateBtnText: { color: Colors.primary, fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  empty: { color: Colors.textSecondary, fontSize: 16, textAlign: 'center' },

  activeContainer: { alignItems: 'center', justifyContent: 'center', padding: 24, marginTop: 40, backgroundColor: Colors.surface, marginHorizontal: 20, borderRadius: 16, borderWidth: 1, borderColor: Colors.primary },
  activeIcon: { fontSize: 50, marginBottom: 12 },
  activeTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  activeDesc: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  viewMemBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  viewMemBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%' },
  modalTitle: { color: Colors.text, fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  confirmBox: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 16 },
  confirmPlan: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
  confirmPrice: { color: Colors.primary, fontSize: 30, fontWeight: 'bold', marginTop: 4 },
  confirmPeriod: { color: Colors.textSecondary, fontSize: 16 },
  paymentDetails: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 16 },
  paymentLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 10, fontWeight: '600', textTransform: 'uppercase' },
  paymentMethodRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  paymentMethodIcon: { fontSize: 28 },
  paymentMethodName: { color: Colors.text, fontWeight: 'bold', fontSize: 14 },
  paymentMethodNote: { color: Colors.textSecondary, fontSize: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryKey: { color: Colors.textSecondary, fontSize: 13 },
  summaryVal: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  paymentNote: { color: Colors.textSecondary, fontSize: 12, fontStyle: 'italic', marginTop: 12, lineHeight: 18 },
  confirmBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
  confirmBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { padding: 14, alignItems: 'center', marginBottom: 10 },
  cancelBtnText: { color: Colors.textSecondary, fontSize: 15 },
});
