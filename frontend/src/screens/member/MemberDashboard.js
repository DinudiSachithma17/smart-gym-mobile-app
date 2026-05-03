import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../api/api';
import { Ionicons } from '@expo/vector-icons';

const MenuCard = ({ icon, label, onPress, color }) => (
  <TouchableOpacity style={[styles.card, { borderLeftColor: color }]} onPress={onPress}>
    <Ionicons name={icon} size={24} color={color} style={styles.cardIcon} />
    <Text style={styles.cardLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
  </TouchableOpacity>
);

export default function MemberDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    api.get('/profile/me').then(res => setProfileImage(res.data.profileImage)).catch(() => {});
  }, []);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        logout();
      }
    } else {
      Alert.alert('Logout', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { marginTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.navigate('MemberProfile')}>
          {profileImage
            ? <Image source={{ uri: profileImage }} style={styles.avatarImg} />
            : <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text></View>
          }
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Hello</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.memberId}>ID: {user?.userId}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Stay Fit, Stay Strong</Text>
        <Text style={styles.bannerSub}>Manage your gym journey here</Text>
      </View>

      {/* Menu */}
      <Text style={styles.sectionTitle}>My Services</Text>
      <MenuCard icon="cube-outline" label="Browse Packages" color={Colors.success} onPress={() => navigation.navigate('Packages')} />
      <MenuCard icon="card-outline" label="My Memberships" color={Colors.warning} onPress={() => navigation.navigate('Memberships')} />
      <MenuCard icon="notifications-outline" label="Notifications" color={Colors.info} onPress={() => navigation.navigate('Notifications')} />
      <MenuCard icon="alert-circle-outline" label="My Complaints" color={Colors.secondary} onPress={() => navigation.navigate('Complaints')} />
      <MenuCard icon="star-outline" label="My Feedback" color="#A855F7" onPress={() => navigation.navigate('Feedback')} />
      <MenuCard icon="barbell-outline" label="View Trainers" color={Colors.primary} onPress={() => navigation.navigate('Trainers')} />
      <MenuCard icon="person-outline" label="My Profile" color="#6366F1" onPress={() => navigation.navigate('MemberProfile')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 20, padding: 16, marginBottom: 16, gap: 12,
  },
  avatarImg: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: Colors.primary },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: Colors.white, fontSize: 22, fontWeight: 'bold' },
  headerText: { flex: 1 },
  greeting: { color: Colors.textSecondary, fontSize: 12 },
  name: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  memberId: { color: Colors.primary, fontSize: 12, marginTop: 2 },
  logoutBtn: { backgroundColor: Colors.error + '20', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: Colors.error },
  logoutText: { color: Colors.error, fontWeight: 'bold', fontSize: 12 },
  banner: {
    backgroundColor: Colors.primary, borderRadius: 20, padding: 24, marginBottom: 24,
  },
  bannerTitle: { color: Colors.white, fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  bannerSub: { color: Colors.white + 'CC', fontSize: 14 },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 18,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderLeftWidth: 4,
  },
  cardIcon: { marginRight: 14 },
  cardLabel: { color: Colors.text, fontSize: 16, fontWeight: '500', flex: 1 },
});
