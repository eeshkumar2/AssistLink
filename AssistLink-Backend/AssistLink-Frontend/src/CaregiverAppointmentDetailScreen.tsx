import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const THEME = {
  primary: "#059669",
  bg: "#F9FAFB",
  card: "#FFFFFF",
  text: "#111827",
  subText: "#6B7280",
  danger: "#EF4444",
  divider: "#E5E7EB"
};

// Default Mock Data in case navigation fails
const MOCK_APPOINTMENT = {
    status: 'Pending', 
    recipient: 'New Patient', 
    service: 'Initial Assessment',
    location: '123 Maple Ave',
    time: '09:00 AM',
    pay: '$45.00',
    date: 'Oct 24, 2023',
    image: 'https://i.pravatar.cc/150?u=fake'
};

export default function CaregiverAppointmentDetailScreen({ route, navigation }: any) {
  // Safer param extraction
  const appointment = route.params?.appointment || MOCK_APPOINTMENT;
  
  const [status, setStatus] = useState(appointment.status);

  // --- ACTIONS ---
  const handleAccept = () => {
    Alert.alert("Confirm", "Accept this appointment?", [
      { text: "Cancel", style: "cancel" },
      { text: "Accept", onPress: () => setStatus('Confirmed') }
    ]);
  };

  const handleStartCare = () => {
    setStatus('In-Progress');
  };

  const handleComplete = () => {
    Alert.alert("Complete Job", "Have you finished all required tasks?", [
        { text: "No", style: "cancel" },
        { text: "Yes, Complete", onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <TouchableOpacity>
           <MaterialCommunityIcons name="dots-horizontal" size={24} color={THEME.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* MAP PLACEHOLDER */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
             <Ionicons name="map" size={32} color={THEME.primary} />
             <Text style={styles.mapText}>Navigation Preview</Text>
             <Text style={styles.distanceText}>12 mins • 5.2 miles</Text>
          </View>
        </View>

        {/* STATUS BAR */}
        <View style={styles.statusStrip}>
           <Text style={styles.statusLabel}>Status:</Text>
           <View style={[
               styles.statusBadge, 
               status === 'Pending' ? styles.bgOrange : styles.bgGreen
           ]}>
              <Text style={[
                  styles.statusText, 
                  status === 'Pending' ? styles.textOrange : styles.textGreen
              ]}>
                {status ? status.toUpperCase() : 'UNKNOWN'}
              </Text>
           </View>
        </View>

        {/* PATIENT CARD */}
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <Image 
                source={{ uri: appointment.image || 'https://i.pravatar.cc/150?u=fake' }} 
                style={styles.avatar} 
            />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{appointment.recipient}</Text>
              <Text style={styles.subDetail}>Age 78 • Mobility Issues</Text>
            </View>
            {status !== 'Pending' && (
                <TouchableOpacity style={styles.chatBtn}>
                    <Ionicons name="chatbubble-ellipses-outline" size={22} color={THEME.primary} />
                </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.grid}>
             <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Date</Text>
                <Text style={styles.gridValue}>{appointment.date}</Text>
             </View>
             <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Time</Text>
                <Text style={styles.gridValue}>{appointment.time ? appointment.time.split('-')[0] : 'TBD'}</Text>
             </View>
             <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Service</Text>
                <Text style={styles.gridValue}>{appointment.service}</Text>
             </View>
          </View>
        </View>

        {/* TASKS / NOTES */}
        <Text style={styles.sectionHeader}>CARE PLAN & NOTES</Text>
        <View style={styles.card}>
            <View style={styles.taskRow}>
                <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={20} color={THEME.primary} />
                <Text style={styles.taskText}>Assist with morning medication</Text>
            </View>
            <View style={styles.taskRow}>
                <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={20} color={THEME.subText} />
                <Text style={styles.taskText}>Light stretching exercises (15 mins)</Text>
            </View>
            <View style={styles.taskRow}>
                <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={20} color={THEME.subText} />
                <Text style={styles.taskText}>Meal preparation (Lunch)</Text>
            </View>
        </View>

        {/* ACTION BUTTONS LOGIC */}
        <View style={styles.footerAction}>
            {status === 'Pending' ? (
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.btnDecline} onPress={() => navigation.goBack()}>
                        <Text style={styles.btnDeclineText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnAccept} onPress={handleAccept}>
                        <Text style={styles.btnAcceptText}>Accept Request</Text>
                    </TouchableOpacity>
                </View>
            ) : status === 'Confirmed' ? (
                 <TouchableOpacity style={styles.btnPrimary} onPress={handleStartCare}>
                    <MaterialCommunityIcons name="play-circle" size={20} color="#FFF" style={{marginRight:8}} />
                    <Text style={styles.btnPrimaryText}>Start Care Session</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={styles.btnSuccess} onPress={handleComplete}>
                    <MaterialCommunityIcons name="check-all" size={20} color="#FFF" style={{marginRight:8}} />
                    <Text style={styles.btnPrimaryText}>Mark as Complete</Text>
                </TouchableOpacity>
            )}
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: THEME.text },
  backBtn: { padding: 4 },
  scrollContent: { paddingHorizontal: 20 },
  
  mapContainer: { height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 20, marginTop: 10 },
  mapPlaceholder: {
    flex: 1, backgroundColor: '#E0F2F1', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#B2DFDB',
  },
  mapText: { marginTop: 8, color: THEME.primary, fontWeight: '700' },
  distanceText: { marginTop: 4, color: THEME.subText, fontSize: 12 },

  statusStrip: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statusLabel: { marginRight: 10, color: THEME.subText },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '700' },
  
  // Status Colors
  bgOrange: { backgroundColor: '#FEF3C7' },
  bgGreen: { backgroundColor: '#D1FAE5' },
  textOrange: { color: '#D97706' },
  textGreen: { color: '#059669' },

  card: {
    backgroundColor: THEME.card, borderRadius: 16, padding: 16, marginBottom: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2,
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  profileInfo: { flex: 1, marginLeft: 16 },
  name: { fontSize: 18, fontWeight: 'bold', color: THEME.text },
  subDetail: { fontSize: 13, color: THEME.subText, marginTop: 2 },
  chatBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 20 },

  divider: { height: 1, backgroundColor: THEME.divider, marginBottom: 16 },

  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  gridItem: { flex: 1 },
  gridLabel: { fontSize: 12, color: THEME.subText, marginBottom: 4 },
  gridValue: { fontSize: 14, fontWeight: '600', color: THEME.text },

  sectionHeader: { fontSize: 12, color: THEME.subText, fontWeight: 'bold', marginBottom: 10, marginLeft: 4, letterSpacing: 1 },
  taskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  taskText: { marginLeft: 12, color: THEME.text, fontSize: 15 },

  footerAction: { marginTop: 10 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  btnDecline: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: THEME.danger, alignItems: 'center' },
  btnDeclineText: { color: THEME.danger, fontWeight: '700' },
  btnAccept: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: THEME.primary, alignItems: 'center' },
  btnAcceptText: { color: '#FFF', fontWeight: '700' },
  
  btnPrimary: { flexDirection: 'row', padding: 16, borderRadius: 12, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center' },
  btnSuccess: { flexDirection: 'row', padding: 16, borderRadius: 12, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});