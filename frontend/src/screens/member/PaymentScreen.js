import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

const PLAN_PERIOD = { Monthly: '1 Month', Quarterly: '3 Months', Annually: '12 Months (1 Year)' };

/* ── Animated card preview ── */
const CardPreview = ({ number, name, expiry }) => {
  const formatDisplay = (n) => {
    const cleaned = n.replace(/\s/g, '').padEnd(16, '•');
    return cleaned.match(/.{1,4}/g).join('  ');
  };
  return (
    <View style={card.wrap}>
      <View style={card.card}>
        {/* Gradient circles */}
        <View style={card.circle1} />
        <View style={card.circle2} />

        {/* Chip */}
        <View style={card.chip} />

        {/* Card number */}
        <Text style={card.number}>{formatDisplay(number)}</Text>

        {/* Bottom row */}
        <View style={card.bottomRow}>
          <View>
            <Text style={card.label}>CARDHOLDER NAME</Text>
            <Text style={card.value}>{name.toUpperCase() || 'YOUR NAME'}</Text>
          </View>
          <View>
            <Text style={card.label}>EXPIRES</Text>
            <Text style={card.value}>{expiry || 'MM/YY'}</Text>
          </View>
          {/* Visa logo */}
          <View style={card.visa}>
            <Text style={card.visaText}>VISA</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function PaymentScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { pkg } = route.params;          // Package passed from PackagesScreen

  const [cardName, setCardName]   = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry]       = useState('');
  const [cvv, setCvv]             = useState('');
  const [paying, setPaying]       = useState(false);
  const [expiryError, setExpiryError] = useState('');  // inline error

  /* ── Formatters ── */
  const formatCardNumber = (text) => {
    const clean = text.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (text) => {
    const clean = text.replace(/\D/g, '').slice(0, 4);
    const formatted = clean.length >= 3 ? clean.slice(0, 2) + '/' + clean.slice(2) : clean;
    validateExpiry(formatted);   // live check while typing
    return formatted;
  };

  /* ── Live expiry checker ── */
  const validateExpiry = (value) => {
    setExpiryError('');
    if (value.length < 5) return;  // wait until fully typed

    const [mmStr, yyStr] = value.split('/');
    const mm = parseInt(mmStr, 10);
    const yy = parseInt(yyStr, 10);

    if (isNaN(mm) || mm < 1 || mm > 12) {
      setExpiryError('Invalid month — must be 01 to 12');
      return;
    }

    const now = new Date();
    const currentYear  = now.getFullYear() % 100;  // last 2 digits
    const currentMonth = now.getMonth() + 1;        // 1-12

    if (yy < currentYear || (yy === currentYear && mm < currentMonth)) {
      setExpiryError('Card has expired');
      return;
    }

    // Too far in the future (> 20 years)
    if (yy > currentYear + 20) {
      setExpiryError('Expiry year seems invalid');
      return;
    }

    setExpiryError('');  // all good
  };

  /* ── Validation (on submit) ── */
  const validate = () => {
    if (!cardName.trim()) {
      Alert.alert('Missing Info', 'Please enter the cardholder name'); return false;
    }
    if (cardNumber.replace(/\s/g, '').length < 16) {
      Alert.alert('Invalid Card', 'Please enter a valid 16-digit card number'); return false;
    }
    if (expiry.length < 5) {
      Alert.alert('Invalid Expiry', 'Please enter the expiry date in MM/YY format'); return false;
    }
    // Re-run expiry logic
    const [mmStr, yyStr] = expiry.split('/');
    const mm = parseInt(mmStr, 10);
    const yy = parseInt(yyStr, 10);
    if (isNaN(mm) || mm < 1 || mm > 12) {
      Alert.alert('Invalid Expiry', 'Month must be between 01 and 12'); return false;
    }
    const now = new Date();
    const currentYear  = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    if (yy < currentYear || (yy === currentYear && mm < currentMonth)) {
      Alert.alert('Card Expired', 'Your card has expired. Please use a different card.'); return false;
    }
    if (yy > currentYear + 20) {
      Alert.alert('Invalid Expiry', 'The expiry year looks incorrect'); return false;
    }
    if (cvv.length < 3) {
      Alert.alert('Invalid CVV', 'Please enter a valid 3 or 4 digit CVV'); return false;
    }
    return true;
  };

  /* ── Pay handler ── */
  const handlePay = async () => {
    if (!validate()) return;
    setPaying(true);
    try {
      await api.post('/memberships', {
        packageId: pkg._id,
        cardLast4: cardNumber.replace(/\s/g, '').slice(-4),
        cardHolderName: cardName,
      });
      Alert.alert(
        '✅ Payment Submitted!',
        `Your ${pkg.planType} membership payment of Rs. ${pkg.price?.toLocaleString()} has been received.\n\nYour membership will be activated once the admin approves your payment.`,
        [{ text: 'View My Memberships', onPress: () => navigation.navigate('Memberships') }]
      );
    } catch (err) {
      Alert.alert('Payment Failed', err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const subtotal = pkg.price || 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Top Bar ── */}
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Checkout</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* ── Package Summary ── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>MEMBERSHIP PACKAGE</Text>
          <Text style={styles.summaryPlan}>{pkg.planType} Membership</Text>
          <Text style={styles.summaryDuration}>{PLAN_PERIOD[pkg.planType]}</Text>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Subtotal</Text>
            <Text style={styles.summaryVal}>Rs. {subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Tax</Text>
            <Text style={styles.summaryVal}>Rs. 0</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalKey}>Total</Text>
            <Text style={styles.totalVal}>Rs. {subtotal.toLocaleString()}</Text>
          </View>

          <View style={styles.divider} />

          {/* Benefits */}
          {(pkg.benefits || []).map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Text style={styles.benefitCheck}>✓</Text>
              <Text style={styles.benefit}>{b}</Text>
            </View>
          ))}

          {/* SSL Badge */}
          <View style={styles.sslRow}>
            <Text style={styles.sslIcon}>🔒</Text>
            <Text style={styles.sslText}>Secure 256-bit SSL Encryption</Text>
          </View>
        </View>

        {/* ── Card Preview ── */}
        <Text style={styles.sectionTitle}>Provide Payment Details</Text>
        <Text style={styles.sectionSub}>Complete your transaction to activate your membership.</Text>

        <CardPreview number={cardNumber} name={cardName} expiry={expiry} />

        {/* ── Accepted Methods ── */}
        <View style={styles.methodsRow}>
          <Text style={styles.methodsLabel}>ACCEPTED METHODS</Text>
          <View style={styles.methodBadges}>
            {['VISA', 'Mastercard', 'Amex'].map(m => (
              <View key={m} style={styles.methodBadge}>
                <Text style={styles.methodBadgeText}>{m}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Card Form ── */}
        <View style={styles.form}>
          <Text style={styles.fieldLabel}>CARDHOLDER NAME</Text>
          <TextInput
            style={styles.input}
            value={cardName}
            onChangeText={setCardName}
            placeholder="John Silva"
            placeholderTextColor={Colors.textSecondary}
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>CARD NUMBER</Text>
          <TextInput
            style={styles.input}
            value={cardNumber}
            onChangeText={t => setCardNumber(formatCardNumber(t))}
            placeholder="0000 0000 0000 0000"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="numeric"
            maxLength={19}
          />

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={styles.fieldLabel}>EXPIRY DATE</Text>
              <TextInput
                style={[styles.input, expiryError ? styles.inputError : null]}
                value={expiry}
                onChangeText={t => setExpiry(formatExpiry(t))}
                placeholder="MM/YY"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                maxLength={5}
              />
              {expiryError ? (
                <Text style={styles.fieldError}>⚠ {expiryError}</Text>
              ) : expiry.length === 5 ? (
                <Text style={styles.fieldValid}>✓ Valid</Text>
              ) : null}
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.fieldLabel}>CVV</Text>
              <TextInput
                style={styles.input}
                value={cvv}
                onChangeText={t => setCvv(t.replace(/\D/g, '').slice(0, 4))}
                placeholder="•••"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
              />
            </View>
          </View>
        </View>

        {/* ── Pay Button ── */}
        <TouchableOpacity
          style={[styles.payBtn, paying && { opacity: 0.7 }]}
          onPress={handlePay}
          disabled={paying}
        >
          {paying
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.payBtnText}>🔒  Pay Rs. {subtotal.toLocaleString()}</Text>}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By tapping Pay, you agree to our Terms. Payment is subject to admin approval before membership activation.
        </Text>

        <View style={{ height: insets.bottom + 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ── Card styles ── */
const card = StyleSheet.create({
  wrap: { paddingHorizontal: 20, marginBottom: 20 },
  card: {
    backgroundColor: '#1a2e4a',
    borderRadius: 20,
    padding: 24,
    height: 190,
    overflow: 'hidden',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  circle1: {
    position: 'absolute', right: -30, top: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  circle2: {
    position: 'absolute', right: 60, top: -80,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chip: {
    width: 42, height: 32, backgroundColor: '#d4af37',
    borderRadius: 6,
  },
  number: {
    color: '#fff', fontSize: 18, letterSpacing: 2,
    fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  bottomRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  label: { color: 'rgba(255,255,255,0.55)', fontSize: 9, letterSpacing: 1, marginBottom: 3 },
  value: { color: '#fff', fontSize: 13, fontWeight: '600', letterSpacing: 1 },
  visa: {
    backgroundColor: '#1a1f71', borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  visaText: { color: '#fff', fontSize: 14, fontStyle: 'italic', fontWeight: 'bold' },
});

/* ── Screen styles ── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, backgroundColor: Colors.surface,
  },
  back: { color: Colors.primary, fontSize: 16 },
  title: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },

  summaryCard: {
    backgroundColor: Colors.surface, margin: 16, borderRadius: 20, padding: 20,
  },
  summaryLabel: { color: Colors.textSecondary, fontSize: 11, letterSpacing: 1.5, fontWeight: '600', marginBottom: 6 },
  summaryPlan: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
  summaryDuration: { color: Colors.textSecondary, fontSize: 13, marginBottom: 14 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryKey: { color: Colors.textSecondary, fontSize: 14 },
  summaryVal: { color: Colors.text, fontSize: 14 },
  totalRow: { marginTop: 4 },
  totalKey: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
  totalVal: { color: Colors.primary, fontSize: 18, fontWeight: 'bold' },
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  benefitCheck: { color: Colors.success, fontSize: 14, marginRight: 8 },
  benefit: { color: Colors.textSecondary, fontSize: 13 },
  sslRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  sslIcon: { fontSize: 13, marginRight: 6 },
  sslText: { color: Colors.textSecondary, fontSize: 12 },

  sectionTitle: { color: Colors.text, fontSize: 20, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 4 },
  sectionSub: { color: Colors.textSecondary, fontSize: 13, paddingHorizontal: 20, marginBottom: 16 },

  methodsRow: { paddingHorizontal: 20, marginBottom: 16 },
  methodsLabel: { color: Colors.textSecondary, fontSize: 11, letterSpacing: 1.5, marginBottom: 8 },
  methodBadges: { flexDirection: 'row', gap: 8 },
  methodBadge: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.card,
  },
  methodBadgeText: { color: Colors.text, fontSize: 12, fontWeight: '600' },

  form: { paddingHorizontal: 20 },
  fieldLabel: { color: Colors.textSecondary, fontSize: 11, letterSpacing: 1.5, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: Colors.card, color: Colors.text, borderRadius: 12,
    padding: 14, fontSize: 15, borderWidth: 1, borderColor: Colors.border,
  },
  inputError: { borderColor: Colors.error, borderWidth: 1.5 },
  fieldError: { color: Colors.error, fontSize: 11, marginTop: 4 },
  fieldValid: { color: Colors.success, fontSize: 11, marginTop: 4 },
  rowInputs: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },

  payBtn: {
    backgroundColor: Colors.primary, borderRadius: 16, margin: 20,
    padding: 18, alignItems: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  payBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },

  disclaimer: {
    color: Colors.textSecondary, fontSize: 11, textAlign: 'center',
    paddingHorizontal: 30, lineHeight: 16,
  },
});
