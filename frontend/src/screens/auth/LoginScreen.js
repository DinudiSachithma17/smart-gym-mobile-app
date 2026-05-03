import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';

const SAVED_ACCOUNTS_KEY = 'savedAccounts';
const obfuscate   = (t) => t.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 5)).join('');
const deobfuscate = (t) => t.split('').map(c => String.fromCharCode(c.charCodeAt(0) - 5)).join('');

export default function LoginScreen({ navigation }) {
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [loading, setLoading]             = useState(false);
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [emailFocused, setEmailFocused]   = useState(false);
  const { login } = useAuth();

  /* ── Load saved accounts on mount ─────────────────────────── */
  useEffect(() => {
    const init = async () => {
      try {
        await AsyncStorage.removeItem('savedCredentials'); // purge old format
        const raw = await AsyncStorage.getItem(SAVED_ACCOUNTS_KEY);
        if (raw) setSavedAccounts(JSON.parse(raw));
      } catch (_) {}
    };
    init();
  }, []);

  /* ── Save account after successful login ───────────────────── */
  const saveAccount = async (emailVal, passwordVal) => {
    try {
      const raw = await AsyncStorage.getItem(SAVED_ACCOUNTS_KEY);
      let accounts = raw ? JSON.parse(raw) : [];
      const idx = accounts.findIndex(a => a.email === emailVal);
      const entry = { email: emailVal, password: obfuscate(passwordVal) };
      if (idx >= 0) accounts[idx] = entry;
      else accounts.unshift(entry);
      accounts = accounts.slice(0, 5);
      await AsyncStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
      setSavedAccounts(accounts);
    } catch (_) {}
  };

  /* ── Tap a suggestion ──────────────────────────────────────── */
  const handleSelectSuggestion = (account) => {
    setEmail(account.email);
    setPassword(deobfuscate(account.password));
    setEmailFocused(false);
  };

  /* ── Which accounts to show (all when empty, filtered when typing) */
  const suggestions = savedAccounts.filter(a =>
    email.trim() === '' || a.email.toLowerCase().includes(email.toLowerCase())
  );

  const showSuggestions = emailFocused && suggestions.length > 0;

  /* ── Login ─────────────────────────────────────────────────── */
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      await saveAccount(email.trim(), password);
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.logo}>💪</Text>
          <Text style={styles.title}>Royal Gym</Text>
          <Text style={styles.subtitle}>Welcome back! Log in to continue</Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.form}>

          {/* Email field */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, emailFocused && styles.inputFocused]}
            placeholder="Enter your email"
            placeholderTextColor={Colors.textSecondary}
            value={email}
            onChangeText={(text) => { setEmail(text); setEmailFocused(true); }}
            onFocus={() => setEmailFocused(true)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* ── Suggestion list (inline, no clipping) ── */}
          {showSuggestions && (
            <View style={styles.suggestionBox}>
              <Text style={styles.suggestionHeader}>💾 Saved Accounts</Text>
              {suggestions.map((account) => (
                <TouchableOpacity
                  key={account.email}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(account)}
                  activeOpacity={0.7}
                >
                  <View style={styles.suggestionAvatar}>
                    <Text style={styles.suggestionAvatarText}>
                      {account.email[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.suggestionInfo}>
                    <Text style={styles.suggestionEmail}>{account.email}</Text>
                    <Text style={styles.suggestionDots}>•••••••••</Text>
                  </View>
                  <Text style={styles.suggestionArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Password field */}
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={Colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setEmailFocused(false)}
            secureTextEntry
          />

          {/* Login button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.buttonText}>Login</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.link}
          >
            <Text style={styles.linkText}>
              Don{"'"}t have an account?{' '}
              <Text style={styles.linkBold}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  header: { alignItems: 'center', marginBottom: 40 },
  logo:   { fontSize: 60, marginBottom: 8 },
  title:  { fontSize: 32, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
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
  inputFocused: {
    borderColor: Colors.primary,
  },

  /* Suggestion list */
  suggestionBox: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: 6,
    overflow: 'hidden',
  },
  suggestionHeader: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  suggestionAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionAvatarText: { color: Colors.white, fontWeight: 'bold', fontSize: 15 },
  suggestionInfo: { flex: 1 },
  suggestionEmail: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  suggestionDots:  { color: Colors.textSecondary, fontSize: 12, letterSpacing: 2, marginTop: 2 },
  suggestionArrow: { color: Colors.primary, fontSize: 22, fontWeight: 'bold' },

  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  link:       { alignItems: 'center', marginTop: 20 },
  linkText:   { color: Colors.textSecondary, fontSize: 14 },
  linkBold:   { color: Colors.primary, fontWeight: 'bold' },
});
