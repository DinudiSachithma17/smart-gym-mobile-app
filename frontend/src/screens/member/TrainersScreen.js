import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import api from '../../api/api';
import { Colors } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TrainersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/trainers').then(res => setTrainers(res.data)).catch(() => Alert.alert('Error', 'Failed to load trainers')).finally(() => setLoading(false));
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text></View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.trainerId}>{item.trainerId}</Text>
        <Text style={styles.spec}>🎯 {item.specialization}</Text>
        <Text style={styles.detail}>📞 {item.phone} · 🏙️ {item.city}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Our Trainers</Text>
        <View style={{ width: 60 }} />
      </View>
      {loading ? <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} /> : (
        <FlatList data={trainers} keyExtractor={item => item._id} renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No trainers available</Text>}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: Colors.surface },
  back: { color: Colors.primary, fontSize: 16 }, title: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: Colors.white, fontSize: 22, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
  trainerId: { color: Colors.primary, fontSize: 12, marginBottom: 2 },
  spec: { color: Colors.textSecondary, fontSize: 13, marginBottom: 2 },
  detail: { color: Colors.textSecondary, fontSize: 12 },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },
});
