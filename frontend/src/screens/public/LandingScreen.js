import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ImageBackground, Dimensions, FlatList, Platform
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../api/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    api.get('/feedback/public')
      .then(res => setFeedbacks(res.data))
      .catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
        {/* --- HERO SECTION --- */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop' }}
          style={styles.heroWrapper}
        >
          <View style={[styles.heroOverlay, { paddingTop: insets.top + 20 }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="barbell" size={24} color={THEME.amber} />
                <Text style={styles.logoText}>Royal Gym</Text>
              </View>
              <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginBtnText}>Login</Text>
              </TouchableOpacity>
            </View>

            {/* Hero Content */}
            <View style={styles.heroContent}>
              <View style={styles.badge}>
                <Text style={styles.heroSubtitle}>PREMIUM FITNESS EXPERIENCE</Text>
              </View>
              <Text style={styles.heroTitle}>Sculpted by Discipline.</Text>
              <Text style={styles.heroTitleAccent}>Defined by Greatness.</Text>
              <Text style={styles.heroDesc}>
                Welcome to Royal Gym. A dedicated space for serious training, exceptional coaching, and true results. Begin your fitness journey with us today.
              </Text>
              <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('Register')}>
                <Text style={styles.ctaText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.black} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.trainerLink} onPress={() => navigation.navigate('TrainerRegister')}>
                <Text style={styles.trainerLinkText}>Are you a trainer? <Text style={{ color: THEME.skyBlue }}>Join our team</Text></Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        {/* --- FACILITIES SECTION --- */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>WORLD-CLASS FACILITIES</Text>
          <Text style={styles.sectionTitle}>Built for <Text style={styles.sectionTitleAccent}>Peak Performance</Text></Text>
          <Text style={styles.sectionDesc}>Four floors of elite equipment and recovery spaces designed to push every limit, every day.</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.facilityScroll}>
            {[
              { title: 'Power Zone', desc: 'Olympic barbells, squat racks, and free weights.', icon: 'barbell-outline' },
              { title: 'Cardio Deck', desc: 'Latest treadmills, assault bikes, rowers.', icon: 'walk-outline' },
              { title: 'Aqua Centre', desc: 'Olympic-length pool for lap swimming.', icon: 'water-outline' },
              { title: 'Recovery Suite', desc: 'Infrared sauna, steam room, and ice baths.', icon: 'leaf-outline' },
            ].map((item, idx) => (
              <View key={idx} style={styles.facilityCard}>
                <View style={styles.iconWrapper}>
                  <Ionicons name={item.icon} size={32} color={THEME.skyBlue} />
                </View>
                <Text style={styles.facilityCardTitle}>{item.title}</Text>
                <Text style={styles.facilityCardDesc}>{item.desc}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* --- FEEDBACK SECTION --- */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>MEMBER FEEDBACK</Text>
          <Text style={styles.sectionTitle}>Real <Text style={styles.sectionTitleAccent}>Results</Text></Text>
          
          {feedbacks.length > 0 ? (
            <FlatList
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              data={feedbacks}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <View style={styles.feedbackCard}>
                  <View style={styles.starsContainer}>
                    {[...Array(item.rating)].map((_, i) => (
                      <Ionicons key={i} name="star" size={20} color={THEME.amber} style={{ marginHorizontal: 2 }} />
                    ))}
                  </View>
                  <Text style={styles.feedbackMsg}>"{item.message}"</Text>
                  <Text style={styles.feedbackAuthor}>{item.memberId?.name?.toUpperCase()}</Text>
                </View>
              )}
            />
          ) : (
            <Text style={{ color: Colors.textSecondary, textAlign: 'center', marginTop: 20 }}>No feedback available yet.</Text>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const THEME = {
  skyBlue: '#38BDF8',
  amber: '#F59E0B',
  darkOverlay: 'rgba(10, 14, 23, 0.85)',
  cardBg: 'rgba(255, 255, 255, 0.03)',
  border: 'rgba(255, 255, 255, 0.08)'
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050B14' }, // Deep navy background
  
  heroWrapper: { width: '100%', minHeight: 650 },
  heroOverlay: { flex: 1, backgroundColor: THEME.darkOverlay, paddingBottom: 60 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 40 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { color: Colors.white, fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  
  loginBtn: { borderColor: Colors.white, borderWidth: 1, borderRadius: 24, paddingHorizontal: 24, paddingVertical: 8, backgroundColor: 'transparent' },
  loginBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14, textTransform: 'uppercase' },
  
  heroContent: { paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', flex: 1 },
  badge: { borderTopWidth: 2, borderTopColor: THEME.skyBlue, paddingTop: 12, marginBottom: 24 },
  heroSubtitle: { color: THEME.skyBlue, letterSpacing: 3, fontSize: 12, fontWeight: '800' },
  
  heroTitle: { color: Colors.white, fontSize: 42, fontWeight: '900', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  heroTitleAccent: { color: THEME.amber, fontSize: 42, fontWeight: '900', textAlign: 'center', marginBottom: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  heroDesc: { color: Colors.textSecondary, textAlign: 'center', fontSize: 16, lineHeight: 26, paddingHorizontal: 10, marginBottom: 40, fontWeight: '500' },
  
  ctaBtn: { backgroundColor: THEME.amber, paddingHorizontal: 36, paddingVertical: 16, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 10 },
  ctaText: { color: Colors.black, fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 },
  trainerLink: { marginTop: 24, padding: 10 },
  trainerLinkText: { color: Colors.white, fontSize: 14, fontWeight: '600' },

  section: { paddingVertical: 50, alignItems: 'center', backgroundColor: '#050B14' },
  sectionSubtitle: { color: THEME.skyBlue, letterSpacing: 3, fontSize: 13, fontWeight: '900', marginBottom: 12 },
  sectionTitle: { color: Colors.white, fontSize: 34, fontWeight: '900', textAlign: 'center', marginBottom: 16, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  sectionTitleAccent: { color: THEME.skyBlue },
  sectionDesc: { color: Colors.textSecondary, textAlign: 'center', fontSize: 16, paddingHorizontal: 40, marginBottom: 40, lineHeight: 24 },
  
  facilityScroll: { paddingHorizontal: 24, gap: 20 },
  facilityCard: { backgroundColor: THEME.cardBg, width: 260, padding: 30, borderRadius: 16, borderWidth: 1, borderColor: THEME.border, marginRight: 20 },
  iconWrapper: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  facilityCardTitle: { color: Colors.white, fontSize: 22, fontWeight: 'bold', marginBottom: 10, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  facilityCardDesc: { color: Colors.textSecondary, fontSize: 15, lineHeight: 24 },

  feedbackCard: { width: width, paddingHorizontal: 40, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  starsContainer: { flexDirection: 'row', marginBottom: 24 },
  feedbackMsg: { color: Colors.white, fontSize: 24, fontStyle: 'italic', textAlign: 'center', marginBottom: 30, lineHeight: 36, fontWeight: '500', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  feedbackAuthor: { color: THEME.skyBlue, fontWeight: '900', letterSpacing: 2, fontSize: 16, textTransform: 'uppercase' },
});
