import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { Colors } from '../../constants/colors';
import api from '../../api/api';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ClassManagement() {
  const insets = useSafeAreaInsets();
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  // New Class Form
  const [className, setClassName] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classRes, trainerRes, memberRes] = await Promise.all([
        api.get('/classes'),
        api.get('/trainers'),
        api.get('/auth/users?role=Member')
      ]);
      setClasses(classRes.data);
      setTrainers(trainerRes.data);
      setMembers(memberRes.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!className || !selectedTrainer || !time) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      await api.post('/classes', {
        className,
        trainerId: selectedTrainer._id,
        date: date.toISOString(),
        time
      });
      setModalVisible(false);
      fetchData();
      Alert.alert('Success', 'Class created successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create class');
    }
  };

  const handleAssignMember = async (memberId) => {
    try {
      await api.post(`/classes/${selectedClass._id}/assign`, { memberId });
      setAssignModalVisible(false);
      fetchData();
      Alert.alert('Success', 'Member assigned to class');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to assign member');
    }
  };

  const handleDeleteClass = (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', onPress: async () => {
        try {
          await api.delete(`/classes/${id}`);
          fetchData();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete class');
        }
      }}
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Class Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={classes}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.className}>{item.className}</Text>
              <Text style={styles.cardInfo}>ID: {item.classId}</Text>
              <Text style={styles.cardInfo}>Trainer: {item.trainerId?.name}</Text>
              <Text style={styles.cardInfo}>Date: {new Date(item.date).toLocaleDateString()}</Text>
              <Text style={styles.cardInfo}>Time: {item.time}</Text>
              <Text style={styles.cardInfo}>Members: {item.members?.length || 0}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => { setSelectedClass(item); setAssignModalVisible(true); }}>
                <Ionicons name="person-add" size={24} color={Colors.primary} style={styles.actionIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteClass(item._id)}>
                <Ionicons name="trash" size={24} color={Colors.error} style={styles.actionIcon} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Create Class Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Class</Text>
            <TextInput
              placeholder="Class Name"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
              value={className}
              onChangeText={setClassName}
            />
            <Text style={styles.label}>Select Trainer:</Text>
            <ScrollView horizontal style={styles.trainerSelector}>
              {trainers.map(t => (
                <TouchableOpacity
                  key={t._id}
                  style={[styles.trainerBtn, selectedTrainer?._id === t._id && styles.selectedTrainer]}
                  onPress={() => setSelectedTrainer(t)}
                >
                  <Text style={styles.trainerBtnText}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
              <Text style={{ color: Colors.text }}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); }}
              />
            )}

            <TextInput
              placeholder="Time (e.g. 10:00 AM)"
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
              value={time}
              onChangeText={setTime}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateClass}>
                <Text style={styles.btnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign Member Modal */}
      <Modal visible={assignModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Member</Text>
            <FlatList
              data={members}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.memberItem} onPress={() => handleAssignMember(item._id)}>
                  <Text style={styles.memberName}>{item.name}</Text>
                  <Text style={styles.memberEmail}>{item.email}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setAssignModalVisible(false)}>
              <Text style={styles.btnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { color: Colors.text, fontSize: 24, fontWeight: 'bold' },
  addBtn: { backgroundColor: Colors.primary, padding: 10, borderRadius: 10 },
  card: { backgroundColor: Colors.surface, margin: 10, borderRadius: 10, padding: 15, flexDirection: 'row', justifyContent: 'space-between' },
  className: { color: Colors.primary, fontSize: 18, fontWeight: 'bold' },
  cardInfo: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
  actions: { justifyContent: 'space-around' },
  actionIcon: { padding: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: Colors.background, color: Colors.text, padding: 15, borderRadius: 10, marginBottom: 15 },
  label: { color: Colors.text, marginBottom: 10 },
  trainerSelector: { flexDirection: 'row', marginBottom: 15 },
  trainerBtn: { backgroundColor: Colors.background, padding: 10, borderRadius: 10, marginRight: 10, borderWidth: 1, borderColor: Colors.border },
  selectedTrainer: { borderColor: Colors.primary, backgroundColor: Colors.primary + '20' },
  trainerBtnText: { color: Colors.text },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn: { backgroundColor: Colors.error, padding: 15, borderRadius: 10, flex: 1, marginRight: 10, alignItems: 'center' },
  submitBtn: { backgroundColor: Colors.primary, padding: 15, borderRadius: 10, flex: 1, alignItems: 'center' },
  btnText: { color: Colors.white, fontWeight: 'bold' },
  memberItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: Colors.border },
  memberName: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
  memberEmail: { color: Colors.textSecondary, fontSize: 12 },
  closeBtn: { backgroundColor: Colors.secondary, padding: 15, borderRadius: 10, marginTop: 15, alignItems: 'center' },
});
