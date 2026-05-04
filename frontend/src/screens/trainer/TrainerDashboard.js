import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function TrainerDashboard({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.greeting}>Trainer Dashboard</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.role}>Certified Trainer</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Welcome, Coach!</Text>
        <Text style={styles.bannerSub}>View your schedule and profile below</Text>
      </View>

      <Text style={styles.sectionTitle}>Quick Access</Text>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('TrainerProfile')}>
        <Ionicons name="person-outline" size={28} color={Colors.primary} style={styles.cardIcon} />
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>My Profile</Text>
          <Text style={styles.cardSub}>View your trainer profile details</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('TrainerClasses')}>
        <Ionicons name="calendar-outline" size={28} color={Colors.success} style={styles.cardIcon} />
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>My Classes</Text>
          <Text style={styles.cardSub}>View your assigned class schedule</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Notifications')}>
        <Ionicons name="notifications-outline" size={28} color={Colors.info} style={styles.cardIcon} />
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>Notifications</Text>
          <Text style={styles.cardSub}>Check your latest alerts</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 20, padding: 16, marginTop: 50, marginBottom: 16, gap: 12,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.secondary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: Colors.white, fontSize: 22, fontWeight: 'bold' },
  headerInfo: { flex: 1 },
  greeting: { color: Colors.textSecondary, fontSize: 12 },
  name: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  role: { color: Colors.secondary, fontSize: 12, marginTop: 2 },
  logoutBtn: { backgroundColor: Colors.error + '20', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: Colors.error },
  logoutText: { color: Colors.error, fontWeight: 'bold', fontSize: 12 },
  banner: { backgroundColor: Colors.secondary, borderRadius: 20, padding: 24, marginBottom: 24 },
  bannerTitle: { color: Colors.white, fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  bannerSub: { color: Colors.white + 'CC', fontSize: 14 },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 18, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center',
  },
  cardIcon: { marginRight: 14 },
  cardText: { flex: 1 },
  cardTitle: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  cardSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
});
