import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useAuth } from './context/AuthContext';

const { width } = Dimensions.get('window');

// --- THEME CONFIGURATION ---
const THEME = {
  primary: "#059669",       // Emerald Green
  primaryLight: "#D1FAE5",  // Light tint for badges
  white: "#FFFFFF",
  black: "#000000",
  gray: "#F5F7FA",
  textGray: "#666666"
};

// --- TYPES ---
interface Assignment {
  id: string;
  clientName: string;
  service: string;
  status?: string;
  time?: string;
  address?: string;
  image?: string;
  pay?: string; // Pre-formatted string
}

interface Request {
  id: string;
  clientName: string;
  service: string;
  badge?: string | null;
  price: number;
  duration: string;
  distance: string;
  hasMap: boolean;
  image?: string;
}

const CaregiverDashboard = ({ navigation }: { navigation: any }) => {
  const { user } = useAuth();
  const route = useRoute<any>();
  const displayName = user?.full_name || "Caregiver";
  
  // Helper to determine if a tab is active
  const isActive = (screenName: string) => route?.name === screenName;
  
  // --- MOCK DATA ---
  const upcomingAssignments: Assignment[] = [
    {
      id: '1',
      clientName: 'Mrs. Johnson',
      service: 'Physiotherapy',
      status: 'Confirmed',
      time: 'Today, 2:00 PM - 4:00 PM',
      address: '123 Maple Ave, Westside',
      image: undefined, // No placeholder image
      pay: '₹1,500' 
    },
    {
      id: '2',
      clientName: 'Mr. Davis',
      service: 'Mobility Assist',
      status: 'Confirmed',
      time: 'Tomorrow, 10:00 AM',
      address: '45 Oak St, Eastside',
      image: undefined, // No placeholder image
      pay: '₹1,200'
    }
  ];

  const openRequests: Request[] = [
    {
      id: '101',
      clientName: 'Mrs. Thompson',
      service: 'Daily Assistance',
      badge: 'NEW',
      price: 350,
      duration: '4 hours',
      distance: '3.2 mi away',
      hasMap: true,
      image: undefined // No placeholder image
    },
    {
      id: '102',
      clientName: 'Mr. Richards',
      service: 'Elderly Care',
      badge: null,
      price: 400,
      duration: '2 hours',
      distance: '5.1 mi away',
      hasMap: false,
      image: undefined // No placeholder image
    }
  ];

  // Helper to normalize data for the Detail Screen
  const navigateToDetails = (item: any) => {
    navigation.navigate('CaregiverAppointmentDetailScreen', {
      appointment: {
        id: item.id,
        recipient: item.clientName, // Mapping clientName to recipient for the detail view
        service: item.service,
        status: item.status || 'Pending',
        date: 'Oct 24, 2023', // Mock date
        time: item.time || item.duration,
        location: item.address || item.distance,
        image: item.image,
        pay: item.pay || `₹${item.price}` // Handle pre-formatted string vs raw number
      }
    });
  };

  return (
    <RNSafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
           {(user && (user as any).profile_photo_url) ? (
             <Image 
               source={{
                 uri: (user as any).profile_photo_url,
               }}
               style={styles.avatar} 
             />
           ) : (
             <View style={styles.avatarPlaceholder}>
               <Icon name="account" size={24} color="#6B7280" />
             </View>
           )}
           <View>
             <Text style={styles.welcomeText}>Welcome back,</Text>
             <Text style={styles.userName}>{displayName}</Text>
           </View>
        </View>
        <TouchableOpacity 
           style={styles.bellBtn}
           onPress={() => navigation.navigate('Notifications')}
        >
           <Icon name="bell-outline" size={24} color="#333" />
           <View style={styles.bellBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Stats */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsRow}>
           <View style={styles.statCard}>
              <View style={styles.statIconRow}>
                <Icon name="cash" size={20} color={THEME.primary} />
                <Text style={styles.statLabel}>Earnings</Text>
              </View>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>₹24,500</Text>
                <Text style={styles.statGrowth}>+12%</Text>
              </View>
           </View>
           <View style={styles.statCard}>
              <View style={styles.statIconRow}>
                <Icon name="star" size={20} color={THEME.primary} />
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>4.9</Text>
                <Text style={styles.statSub}>(128)</Text>
              </View>
           </View>
        </View>

        {/* Upcoming */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Upcoming Assignments</Text>
          {/* Linked "See All" to ScheduleScreen2 */}
          <TouchableOpacity onPress={() => navigation.navigate('ScheduleScreen2')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
           {upcomingAssignments.map((item) => (
             <TouchableOpacity 
                key={item.id} 
                style={styles.assignmentCard}
                // --- INTEGRATION: Navigate to Details ---
                onPress={() => navigateToDetails(item)}
             >
                <View style={styles.assignmentHeader}>
                   {item.image ? (
                     <Image source={{ uri: item.image }} style={styles.clientAvatar} />
                   ) : (
                     <View style={styles.clientAvatarPlaceholder}>
                       <Icon name="account" size={20} color="#6B7280" />
                     </View>
                   )}
                   <View style={styles.assignmentInfo}>
                      <Text style={styles.clientName}>{item.clientName}</Text>
                      <Text style={styles.serviceText}>{item.service}</Text>
                   </View>
                   <View style={styles.confirmedBadge}>
                      <Text style={styles.confirmedText}>{item.status}</Text>
                   </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.assignmentDetailRow}>
                   <Icon name="clock-outline" size={14} color="#666" />
                   <Text style={styles.detailText}>{item.time}</Text>
                </View>
                <View style={styles.assignmentDetailRow}>
                   <Icon name="map-marker" size={14} color="#666" />
                   <Text style={styles.detailText}>{item.address}</Text>
                </View>
             </TouchableOpacity>
           ))}
        </ScrollView>

        {/* Requests */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Open Requests</Text>
          <View style={styles.requestCountBadge}>
             <Text style={styles.requestCountText}>3</Text>
          </View>
        </View>
        {openRequests.map((req) => (
           <View key={req.id} style={styles.requestCard}>
              <View style={styles.reqHeader}>
                 <View>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                       {req.badge && (
                         <View style={styles.newBadge}>
                           <Text style={styles.newBadgeText}>{req.badge}</Text>
                         </View>
                       )}
                       <Text style={styles.reqService}>{req.service}</Text>
                    </View>
                    <Text style={styles.reqClientName}>{req.clientName}</Text>
                 </View>
                 <View style={{alignItems: 'flex-end'}}>
                    <Text style={styles.reqPrice}>₹{req.price}<Text style={styles.perHour}>/hr</Text></Text>
                    <Text style={styles.reqDuration}>{req.duration}</Text>
                 </View>
              </View>
              <View style={styles.reqLocationRow}>
                 <Icon name="navigation" size={14} color="#333" />
                 <Text style={styles.reqDistance}>{req.distance}</Text>
              </View>
              {req.hasMap && (
                <View style={styles.mapPlaceholder}>
                   <Text style={styles.mapText}>Map Preview Area</Text>
                </View>
              )}
              <View style={styles.actionRow}>
                 <TouchableOpacity style={styles.declineBtn}>
                    <Text style={styles.declineText}>Decline</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                    style={styles.acceptBtn}
                    // --- INTEGRATION: Navigate to Details to accept ---
                    onPress={() => navigateToDetails(req)}
                 >
                    <Text style={styles.acceptText}>Accept Request</Text>
                 </TouchableOpacity>
              </View>
           </View>
        ))}
      </ScrollView>

      {/* Bottom Nav */}
      <RNSafeAreaView style={styles.bottomNavSafeArea} edges={['bottom']}>
        <View style={styles.bottomNav}>
         <TouchableOpacity 
           style={styles.navItem}
           onPress={() => navigation.navigate('CaregiverDashboard')}
         >
            <Icon 
              name={isActive('CaregiverDashboard') ? "home" : "home-outline"} 
              size={28} 
              color={isActive('CaregiverDashboard') ? THEME.primary : "#666"} 
            />
            <Text style={[styles.navText, isActive('CaregiverDashboard') && styles.activeNavText]}>Home</Text>
         </TouchableOpacity>
         
         <TouchableOpacity 
           style={styles.navItem}
           onPress={() => navigation.navigate('ScheduleScreen2')}
         >
            <Icon 
              name={isActive('ScheduleScreen2') ? "calendar-clock" : "calendar-clock-outline"} 
              size={28} 
              color={isActive('ScheduleScreen2') ? THEME.primary : "#666"} 
            />
            <Text style={[styles.navText, isActive('ScheduleScreen2') && styles.activeNavText]}>Schedule</Text>
         </TouchableOpacity>
         
         <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => navigation.navigate('ChatList2')}
         >
            <Icon 
              name={isActive('ChatList2') ? "message-text" : "message-text-outline"} 
              size={28} 
              color={isActive('ChatList2') ? THEME.primary : "#666"} 
            />
            <Text style={[styles.navText, isActive('ChatList2') && styles.activeNavText]}>Messages</Text>
         </TouchableOpacity>

         <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('ProfileScreen2')} 
         >
            <Icon 
              name={isActive('ProfileScreen2') ? "account-circle" : "account-circle-outline"} 
              size={28} 
              color={isActive('ProfileScreen2') ? THEME.primary : "#666"} 
            />
            <Text style={[styles.navText, isActive('ProfileScreen2') && styles.activeNavText]}>Profile</Text>
         </TouchableOpacity>
        </View>
      </RNSafeAreaView>
    </RNSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20, paddingTop: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12, borderWidth: 2, borderColor: '#FFF' },
  avatarPlaceholder: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    marginRight: 12, 
    borderWidth: 2, 
    borderColor: '#FFF',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: { fontSize: 12, color: '#666' },
  userName: { fontSize: 18, fontWeight: '800', color: '#000' },
  bellBtn: { padding: 8 },
  bellBadge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: 'red' },
  
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15, color: '#333' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { flex: 0.48, backgroundColor: '#FFF', padding: 15, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  statIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statLabel: { marginLeft: 8, color: '#666', fontWeight: '600' },
  statValueRow: { flexDirection: 'row', alignItems: 'flex-end' },
  statValue: { fontSize: 24, fontWeight: '800' },
  statGrowth: { color: THEME.primary, fontWeight: '700', marginLeft: 8, fontSize: 12, marginBottom: 4 },
  statSub: { color: '#999', fontSize: 12, marginLeft: 6, marginBottom: 4 },
  
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  seeAllText: { color: THEME.primary, fontWeight: '700' },
  
  horizontalList: { overflow: 'visible', marginBottom: 25 },
  assignmentCard: { backgroundColor: '#FFF', width: width * 0.75, padding: 15, borderRadius: 16, marginRight: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  assignmentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  clientAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  clientAvatarPlaceholder: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginRight: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignmentInfo: { flex: 1 },
  clientName: { fontWeight: '800', fontSize: 15 },
  serviceText: { fontSize: 12, color: '#666' },
  confirmedBadge: { backgroundColor: THEME.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  confirmedText: { color: THEME.primary, fontSize: 10, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 10 },
  assignmentDetailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  detailText: { marginLeft: 6, color: '#555', fontSize: 12 },
  
  requestCountBadge: { backgroundColor: THEME.primary, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  requestCountText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  
  requestCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  newBadge: { backgroundColor: '#E6F0FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
  newBadgeText: { color: '#0066FF', fontSize: 10, fontWeight: '800' },
  reqService: { fontSize: 12, color: '#666' },
  reqClientName: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  reqPrice: { fontSize: 18, fontWeight: '800' },
  perHour: { fontSize: 12, color: '#666', fontWeight: '400' },
  reqDuration: { fontSize: 11, color: '#999', textAlign: 'right' },
  reqLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reqDistance: { marginLeft: 5, fontSize: 12, color: '#333' },
  mapPlaceholder: { height: 100, backgroundColor: '#E0E0E0', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  mapText: { color: '#888', fontWeight: '600' },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  declineBtn: { flex: 0.48, paddingVertical: 12, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, alignItems: 'center' },
  declineText: { fontWeight: '700', color: '#333' },
  acceptBtn: { flex: 0.48, backgroundColor: THEME.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  acceptText: { fontWeight: '700', color: '#FFF' },
  
  bottomNavSafeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
  },
  bottomNav: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1, 
    borderTopColor: '#EEE',
    minHeight: 70,
    paddingBottom: Platform.OS === 'android' ? 8 : 10,
  },
  navItem: { alignItems: 'center', justifyContent: 'center', width: 60 },
  navText: { fontSize: 10, marginTop: 4, color: '#666' },
  activeNavText: { color: THEME.primary, fontWeight: 'bold' },
});

export default CaregiverDashboard;