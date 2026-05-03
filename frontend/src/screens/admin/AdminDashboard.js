import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const StatCard = ({ icon, label, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Ionicons name={icon} size={24} color={color} style={styles.statIcon} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MenuButton = ({ icon, label, onPress, color }) => (
  <TouchableOpacity style={[styles.menuBtn, { backgroundColor: color + '20', borderColor: color }]} onPress={onPress}>
    <Ionicons name={icon} size={32} color={color} style={styles.menuIcon} />
    <Text style={[styles.menuLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);

export default function AdminDashboard({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        logout();
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back 👋</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.role}>Administrator</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
        <StatCard icon="barbell-outline" label="Trainers" value="—" color={Colors.primary} />
        <StatCard icon="people-outline" label="Members" value="—" color={Colors.secondary} />
        <StatCard icon="cube-outline" label="Packages" value="—" color={Colors.success} />
        <StatCard icon="card-outline" label="Memberships" value="—" color={Colors.warning} />
      </ScrollView>

      {/* Management Menu */}
      <Text style={styles.sectionTitle}>Management</Text>
      <View style={styles.menuGrid}>
        <MenuButton icon="barbell-outline" label="Trainers" color={Colors.primary} onPress={() => navigation.navigate('TrainerManagement')} />
        <MenuButton icon="cube-outline" label="Packages" color={Colors.success} onPress={() => navigation.navigate('PackageManagement')} />
        <MenuButton icon="card-outline" label="Memberships" color={Colors.warning} onPress={() => navigation.navigate('MembershipManagement')} />
        <MenuButton icon="calendar-outline" label="Classes" color="#10B981" onPress={() => navigation.navigate('ClassManagement')} />
        <MenuButton icon="notifications-outline" label="Notifications" color={Colors.info} onPress={() => navigation.navigate('NotificationManagement')} />
        <MenuButton icon="alert-circle-outline" label="Complaints" color={Colors.secondary} onPress={() => navigation.navigate('ComplaintManagement')} />
        <MenuButton icon="star-outline" label="Feedback" color="#A855F7" onPress={() => navigation.navigate('FeedbackManagement')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: Colors.surface, borderRadius: 20, padding: 20, marginBottom: 24, marginTop: 50,
  },
  greeting: { color: Colors.textSecondary, fontSize: 14 },
  name: { color: Colors.text, fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  role: { color: Colors.primary, fontSize: 13, marginTop: 4, fontWeight: '600' },
  logoutBtn: { backgroundColor: Colors.error + '20', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.error },
  logoutText: { color: Colors.error, fontWeight: 'bold', fontSize: 13 },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  statsRow: { marginBottom: 24 },
  statCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    marginRight: 12, minWidth: 100, borderLeftWidth: 3,
  },
  statIcon: { marginBottom: 8 },
  statValue: { color: Colors.text, fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
  menuBtn: {
    width: '47%', borderRadius: 16, padding: 20, alignItems: 'center',
    borderWidth: 1,
  },
  menuIcon: { marginBottom: 8 },
  menuLabel: { fontSize: 14, fontWeight: '600' },
});
