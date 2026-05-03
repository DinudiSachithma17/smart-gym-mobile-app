import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TrainerClasses({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    api.get(`/classes/trainer/${user._id}`)
      .then(res => setClasses(res.data))
      .catch(() => Alert.alert('Error', 'Failed to load classes'))
      .finally(() => setLoading(false));
  }, [user]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.className}>{item.className}</Text>
        <Text style={styles.classId}>{item.classId}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.detail}>📅 {new Date(item.date).toLocaleDateString()}</Text>
        <Text style={styles.detail}>⏰ {item.time}</Text>
      </View>
      <View style={styles.membersCount}>
        <Text style={styles.membersIcon}>👥</Text>
        <Text style={styles.membersText}>{item.members?.length || 0} Members enrolled</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>My Classes</Text>
        <View style={{ width: 60 }} />
      </View>
      {loading ? <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} /> : (
        <FlatList data={classes} keyExtractor={item => item._id} renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No classes assigned yet</Text>}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: Colors.surface },
  back: { color: Colors.primary, fontSize: 16 }, title: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: Colors.secondary },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  className: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  classId: { color: Colors.secondary, fontSize: 12 },
  row: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  detail: { color: Colors.textSecondary, fontSize: 14 },
  membersCount: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.card, borderRadius: 10, padding: 8, alignSelf: 'flex-start' },
  membersIcon: { fontSize: 16 }, membersText: { color: Colors.textSecondary, fontSize: 13 },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },
});
