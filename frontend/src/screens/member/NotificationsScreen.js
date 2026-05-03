import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import api from '../../api/api';
import { Colors } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try { setLoading(true); const res = await api.get('/notifications/my'); setNotifications(res.data); }
    catch { Alert.alert('Error', 'Failed to load notifications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const typeColor = { Alert: Colors.error, Announcement: Colors.primary, Information: Colors.info };
  const typeIcon = { Alert: '🚨', Announcement: '📣', Information: 'ℹ️' };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { borderLeftColor: typeColor[item.type], borderLeftWidth: 4 }]}>
      <View style={styles.cardTop}>
        <Text style={styles.typeIcon}>{typeIcon[item.type]}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.target}>{item.target}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: typeColor[item.type] + '30', borderColor: typeColor[item.type] }]}>
          <Text style={[styles.badgeText, { color: typeColor[item.type] }]}>{item.type}</Text>
        </View>
      </View>
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 60 }} />
      </View>
      {loading ? <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} /> : (
        <FlatList data={notifications} keyExtractor={item => item._id} renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No notifications yet</Text>}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: Colors.surface },
  back: { color: Colors.primary, fontSize: 16 }, title: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  typeIcon: { fontSize: 24 },
  notifTitle: { color: Colors.text, fontSize: 15, fontWeight: 'bold' },
  target: { color: Colors.textSecondary, fontSize: 11 },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  message: { color: Colors.textSecondary, fontSize: 14, marginBottom: 6 },
  date: { color: Colors.textSecondary, fontSize: 11 },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },
});
