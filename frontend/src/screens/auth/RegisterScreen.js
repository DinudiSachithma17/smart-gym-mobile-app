import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';

const SAVED_ACCOUNTS_KEY = 'savedAccounts';
const obfuscate = (t) => t.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 5)).join('');

export default function RegisterScreen({ navigation }) {
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingEmail, setPendingEmail]   = useState('');
  const [pendingPass, setPendingPass]     = useState('');
  const { register } = useAuth();

  /* Save credentials to AsyncStorage */
  const saveCredentials = async (emailVal, passwordVal) => {
    try {
      const raw = await AsyncStorage.getItem(SAVED_ACCOUNTS_KEY);
      let accounts = raw ? JSON.parse(raw) : [];
      const idx = accounts.findIndex(a => a.email === emailVal);
      const entry = { email: emailVal, password: obfuscate(passwordVal) };
      if (idx >= 0) accounts[idx] = entry;
      else accounts.unshift(entry);
      accounts = accounts.slice(0, 5);
      await AsyncStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (_) {}
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      // Store for the save prompt
      setPendingEmail(email.trim());
      setPendingPass(password);
      // Show "Save password?" modal before going to login
      setShowSaveModal(true);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Unknown error';
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveYes = async () => {
    await saveCredentials(pendingEmail, pendingPass);
    setShowSaveModal(false);
    navigation.navigate('Login');
  };

  const handleSaveNo = () => {
    setShowSaveModal(false);
    navigation.navigate('Login');
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

          {/* Back Button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.backText}>← Back to Login</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.logo}>🏋️</Text>
            <Text style={styles.title}>Join Royal Gym</Text>
            <Text style={styles.subtitle}>Create your member account</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={Colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={Colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Min 6 characters"
              placeholderTextColor={Colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.buttonText}>Create Account</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkBold}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── "Save Password?" Modal ───────────────────────────── */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={handleSaveNo}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {/* Top icon bar */}
            <View style={styles.modalTopBar}>
              <Text style={styles.modalKeyIcon}>🔑</Text>
            </View>

            <Text style={styles.modalTitle}>Save password?</Text>
            <Text style={styles.modalSubtitle}>
              Save your login details to Royal Gym so you can sign in quickly next time.
            </Text>

            {/* Credential preview */}
            <View style={styles.credentialRow}>
              <View style={styles.credentialAvatar}>
                <Text style={styles.credentialAvatarText}>
                  {pendingEmail ? pendingEmail[0].toUpperCase() : '?'}
                </Text>
              </View>
              <View style={styles.credentialInfo}>
                <Text style={styles.credentialEmail}>{pendingEmail}</Text>
                <Text style={styles.credentialDots}>•••••••••</Text>
              </View>
            </View>

            {/* Buttons */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveYes}>
              <Text style={styles.saveBtnText}>💾  Save Password</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={handleSaveNo}>
              <Text style={styles.skipBtnText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  backBtn: { paddingVertical: 10, paddingBottom: 16 },
  backText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },

  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 60, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary },

  form: { backgroundColor: Colors.surface, borderRadius: 20, padding: 24 },
  label: { color: Colors.textSecondary, fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: Colors.card,
    color: Colors.text,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  link: { alignItems: 'center', marginTop: 20 },
  linkText: { color: Colors.textSecondary, fontSize: 14 },
  linkBold: { color: Colors.primary, fontWeight: 'bold' },

  /* ── Save modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 40,
    alignItems: 'center',
  },
  modalTopBar: {
    width: 48,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 20,
    alignSelf: 'center',
  },
  modalKeyIcon: { fontSize: 40, marginBottom: 4 },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 12,
  },

  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  credentialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  credentialAvatarText: { color: Colors.white, fontWeight: 'bold', fontSize: 18 },
  credentialInfo: { flex: 1 },
  credentialEmail: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  credentialDots: { color: Colors.textSecondary, fontSize: 13, letterSpacing: 3, marginTop: 2 },

  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },

  skipBtn: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  skipBtnText: { color: Colors.textSecondary, fontSize: 15 },
});
