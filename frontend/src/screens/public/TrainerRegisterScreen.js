import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Modal, Clipboard, Alert
} from 'react-native';
import { Colors } from '../../constants/colors';
import api from '../../api/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const FIELDS = [
  {
    key: 'name', label: 'Full Name', placeholder: 'e.g. John Smith',
    keyboard: 'default', autoCapitalize: 'words',
    validate: v => {
      if (!v.trim()) return 'Name is required';
      if (v.trim().length < 5) return 'Name must be at least 5 characters';
      return null;
    },
  },
  {
    key: 'email', label: 'Email Address', placeholder: 'e.g. john@example.com',
    keyboard: 'email-address', autoCapitalize: 'none',
    validate: v => {
      if (!v.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address';
      return null;
    },
  },
  {
    key: 'specialization', label: 'Specialization', placeholder: 'e.g. Yoga, Bodybuilding',
    keyboard: 'default', autoCapitalize: 'words',
    validate: v => (!v.trim() ? 'Specialization is required' : null),
  },
  {
    key: 'age', label: 'Age', placeholder: 'e.g. 25',
    keyboard: 'numeric', autoCapitalize: 'none',
    validate: v => {
      if (!v.trim()) return 'Age is required';
      const n = Number(v);
      if (isNaN(n) || !Number.isInteger(n)) return 'Age must be a whole number';
      if (n < 18) return 'Trainer must be at least 18 years old';
      if (n > 60) return 'Age must not exceed 60 years';
      return null;
    },
  },
  {
    key: 'phone', label: 'Phone Number', placeholder: 'e.g. 0712345678',
    keyboard: 'phone-pad', autoCapitalize: 'none',
    validate: v => {
      if (!v.trim()) return 'Phone number is required';
      if (!/^\d+$/.test(v)) return 'Phone must contain digits only';
      if (v.length < 10) return `Phone must be exactly 10 digits (${v.length}/10 entered)`;
      if (v.length > 10) return `Phone must be exactly 10 digits (${v.length}/10 — too many digits)`;
      return null;
    },
  },
  {
    key: 'address', label: 'Address', placeholder: 'e.g. 123 Main Street',
    keyboard: 'default', autoCapitalize: 'words',
    validate: v => (!v.trim() ? 'Address is required' : null),
  },
  {
    key: 'city', label: 'City', placeholder: 'e.g. Colombo',
    keyboard: 'default', autoCapitalize: 'words',
    validate: v => (!v.trim() ? 'City is required' : null),
  },
];

export default function TrainerRegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', specialization: '', age: '', phone: '', address: '', city: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [credModal, setCredModal] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const validateField = (key, value) => {
    const field = FIELDS.find(f => f.key === key);
    return field ? field.validate(value) : null;
  };

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (touched[key]) {
      setErrors(prev => ({ ...prev, [key]: validateField(key, value) }));
    }
  };

  const handleBlur = (key) => {
    setTouched(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: validateField(key, form[key]) }));
  };

  const validateAll = () => {
    const newErrors = {};
    const newTouched = {};
    let valid = true;
    FIELDS.forEach(f => {
      const err = f.validate(form[f.key]);
      newErrors[f.key] = err;
      newTouched[f.key] = true;
      if (err) valid = false;
    });
    setErrors(newErrors);
    setTouched(newTouched);
    return valid;
  };

  const handleRegister = async () => {
    if (!validateAll()) return;
    setLoading(true);
    try {
      const res = await api.post('/trainers/apply', { ...form, age: Number(form.age) });
      setCredentials(res.data.credentials);
      setCredModal(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      if (msg.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: 'This email is already registered' }));
        setTouched(prev => ({ ...prev, email: true }));
      } else {
        setErrors(prev => ({ ...prev, _general: msg }));
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', 'Copied to clipboard');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Trainer Registration</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>Join our team and help members reach their fitness goals.</Text>

        {errors._general && (
          <View style={styles.generalError}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.generalErrorText}> {errors._general}</Text>
          </View>
        )}

        {FIELDS.map(f => {
          const hasError = touched[f.key] && errors[f.key];
          const isValid = touched[f.key] && !errors[f.key] && form[f.key].trim().length > 0;
          return (
            <View key={f.key} style={styles.inputGroup}>
              <Text style={styles.label}>{f.label}</Text>
              <View style={[
                styles.inputWrapper,
                hasError && styles.inputWrapperError,
                isValid && styles.inputWrapperValid,
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder={f.placeholder}
                  placeholderTextColor="#4B5563"
                  value={form[f.key]}
                  onChangeText={v => handleChange(f.key, v)}
                  onBlur={() => handleBlur(f.key)}
                  keyboardType={f.keyboard}
                  autoCapitalize={f.autoCapitalize}
                  maxLength={f.key === 'phone' ? 10 : undefined}
                />
                {isValid && <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.fieldIcon} />}
                {hasError && <Ionicons name="close-circle" size={20} color="#EF4444" style={styles.fieldIcon} />}
              </View>

              {/* Live digit counter for phone */}
              {f.key === 'phone' && form.phone.length > 0 && (
                <View style={styles.phoneCounter}>
                  <View style={styles.digitBar}>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <View key={i} style={[
                        styles.digitDot,
                        i < form.phone.length && form.phone.length <= 10 ? styles.digitDotFilled : null,
                        form.phone.length > 10 && i < form.phone.length ? styles.digitDotOver : null,
                      ]} />
                    ))}
                  </View>
                  <Text style={[styles.digitCount, form.phone.length === 10 ? styles.digitCountOk : styles.digitCountWarn]}>
                    {form.phone.length}/10
                  </Text>
                </View>
              )}

              {hasError && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
                  <Text style={styles.errorText}> {errors[f.key]}</Text>
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.submitBtnText}>Submit Application →</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLinkText}>Already registered? Log in</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Success / Credentials Modal */}
      <Modal visible={credModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" style={{ alignSelf: 'center' }} />
            <Text style={styles.modalTitle}>Application Successful!</Text>
            <Text style={styles.modalText}>Your account is pending admin approval. Use these credentials to log in once approved.</Text>

            {[
              { label: 'Email', value: credentials?.email },
              { label: 'Temporary Password', value: credentials?.password },
            ].map(({ label, value }) => (
              <View key={label} style={styles.credBox}>
                <Text style={styles.credLabel}>{label}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.credValue}>{value}</Text>
                  <TouchableOpacity onPress={() => copyToClipboard(value)} style={styles.copyBtn}>
                    <Ionicons name="copy-outline" size={16} color="#F59E0B" />
                    <Text style={styles.copyText}> Copy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.doneBtn} onPress={() => { setCredModal(false); navigation.navigate('Login'); }}>
              <Text style={styles.doneBtnText}>Go to Login →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050B14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#0A1118' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scroll: { padding: 24, paddingBottom: 60 },
  subtitle: { color: '#6B7280', fontSize: 14, marginBottom: 28, lineHeight: 22 },

  generalError: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF444420', borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#EF4444' },
  generalErrorText: { color: '#EF4444', fontSize: 13 },

  inputGroup: { marginBottom: 20 },
  label: { color: '#38BDF8', fontSize: 13, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#101725', borderRadius: 12, borderWidth: 1.5, borderColor: '#1F2937' },
  inputWrapperError: { borderColor: '#EF4444', backgroundColor: '#EF444408' },
  inputWrapperValid: { borderColor: '#10B981', backgroundColor: '#10B98108' },
  input: { flex: 1, color: '#fff', padding: 16, fontSize: 15 },
  fieldIcon: { paddingRight: 12 },

  phoneCounter: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  digitBar: { flexDirection: 'row', gap: 4 },
  digitDot: { width: 14, height: 6, borderRadius: 3, backgroundColor: '#1F2937' },
  digitDotFilled: { backgroundColor: '#10B981' },
  digitDotOver: { backgroundColor: '#EF4444' },
  digitCount: { fontSize: 12, fontWeight: '700' },
  digitCountOk: { color: '#10B981' },
  digitCountWarn: { color: '#F59E0B' },

  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  errorText: { color: '#EF4444', fontSize: 12, flex: 1 },

  submitBtn: { backgroundColor: '#F59E0B', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { color: '#38BDF8', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#0A1118', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1F2937' },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginTop: 12, marginBottom: 8 },
  modalText: { color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  credBox: { backgroundColor: '#101725', padding: 16, borderRadius: 14, marginBottom: 14, borderWidth: 1, borderColor: '#1F2937' },
  credLabel: { color: '#38BDF8', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  credValue: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1 },
  copyBtn: { flexDirection: 'row', alignItems: 'center' },
  copyText: { color: '#F59E0B', fontSize: 13, fontWeight: '700' },
  doneBtn: { backgroundColor: '#38BDF8', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  doneBtnText: { color: '#000', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
});
