import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from './context/AuthContext';
import { api } from './api/client';
import { useFocusEffect } from '@react-navigation/native';

// --- THEME COLORS (Light Theme) ---
const THEME = {
  bg: "#F7F8FA",        // Light gray background
  card: "#FFFFFF",      // White card background
  primary: "#2196F3",   // Bright Blue (Brand color)
  text: "#1F2937",      // Dark Gray/Black for main text
  subText: "#6B7280",   // Medium Gray for secondary info
  danger: "#EF4444",    // Red for Logout
  iconBg: "#F3F4F6",    // Light gray for icon circles
  divider: "#E5E7EB"    // Light gray separator
};

export default function ProfileScreen2({ navigation }: any) {
  // State for toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'busy' | 'unavailable'>('available');
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const { user, logout, refreshUser } = useAuth();

  const fullName = profile?.full_name || user?.full_name || 'Caregiver';
  const roleLabel =
    user?.role === 'caregiver'
      ? 'Caregiver'
      : user?.role === 'care_recipient'
      ? 'Care Recipient'
      : 'Member';

  // Load profile data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
      if (user?.role === 'caregiver') {
        loadAvailabilityStatus();
      }
    }, [user?.role])
  );

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profileData = await api.getProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailabilityStatus = async () => {
    try {
      const profile = await api.getCaregiverProfile();
      if (profile?.availability_status) {
        setAvailabilityStatus(profile.availability_status);
      }
    } catch (e: any) {
      console.error("Failed to load availability status:", e);
    }
  };

  const updateAvailabilityStatus = async (newStatus: 'available' | 'busy' | 'unavailable') => {
    if (loadingAvailability) return;
    
    try {
      setLoadingAvailability(true);
      await api.updateCaregiverProfile({ availability_status: newStatus });
      setAvailabilityStatus(newStatus);
    } catch (e: any) {
      console.error("Failed to update availability status:", e);
      alert("Failed to update availability status. Please try again.");
    } finally {
      setLoadingAvailability(false);
    }
  };

  // --- REUSABLE COMPONENT: Settings List Item ---
  const SettingsItem = ({ icon, iconColor, label, rightElement, onPress, isLast }: any) => (
    <TouchableOpacity 
      style={[styles.itemContainer, isLast && { borderBottomWidth: 0 }]} 
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress} 
    >
      <View style={styles.itemLeft}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={styles.itemLabel}>{label}</Text>
      </View>
      <View style={styles.itemRight}>
        {rightElement}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Light Theme Status Bar */}
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity>
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- PROFILE INFO SECTION --- */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('EditProfile')}
          >
            {(profile?.profile_photo_url || (user as any)?.profile_photo_url) ? (
              <Image 
                source={{
                  uri: profile?.profile_photo_url || (user as any)?.profile_photo_url,
                }}
                style={styles.avatar} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="account" size={40} color={THEME.subText} />
              </View>
            )}
            <View style={styles.editBadge}>
              <MaterialCommunityIcons name="pencil" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.name}>{fullName}</Text>
          
          <View style={styles.roleContainer}>
            <MaterialCommunityIcons name="check-decagram" size={16} color={THEME.primary} style={{ marginRight: 4 }} />
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>

          <TouchableOpacity 
            style={styles.editProfileBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* --- ACCOUNT SECTION --- */}
        <Text style={styles.sectionHeader}>ACCOUNT</Text>
        <View style={styles.sectionCard}>
          <SettingsItem 
            icon="account" iconColor="#4299E1" label="Personal Information"
            rightElement={<MaterialCommunityIcons name="chevron-right" size={24} color={THEME.subText} />}
            onPress={() => navigation.navigate('EditProfile')}
          />
          <SettingsItem 
            icon="medical-bag" iconColor="#48BB78" label="Qualifications"
            rightElement={<MaterialCommunityIcons name="chevron-right" size={24} color={THEME.subText} />}
            onPress={() => {}}
          />
          <SettingsItem 
            icon="lock" iconColor="#ED8936" label="Change Password"
            rightElement={<MaterialCommunityIcons name="chevron-right" size={24} color={THEME.subText} />}
            isLast={true}
            onPress={() => {}}
          />
        </View>

        {/* --- PREFERENCES SECTION --- */}
        <Text style={styles.sectionHeader}>PREFERENCES</Text>
        <View style={styles.sectionCard}>
          <SettingsItem 
            icon="bell" iconColor="#9F7AEA" label="Push Notifications"
            rightElement={
              <Switch 
                value={pushEnabled} 
                onValueChange={setPushEnabled} 
                trackColor={{ false: "#D1D5DB", true: THEME.primary }} 
                thumbColor={"#FFF"} 
              />
            }
          />
          {user?.role === 'caregiver' && (
            <SettingsItem 
              icon="account-check" iconColor="#48BB78" label="Availability Status"
              rightElement={
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <TouchableOpacity
                    style={[
                      styles.availabilityBtn,
                      availabilityStatus === 'available' && styles.availabilityBtnActive,
                      availabilityStatus === 'available' && { backgroundColor: '#10B981' }
                    ]}
                    onPress={() => updateAvailabilityStatus('available')}
                    disabled={loadingAvailability}
                  >
                    <Text style={[
                      styles.availabilityBtnText,
                      availabilityStatus === 'available' && styles.availabilityBtnTextActive
                    ]}>Available</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.availabilityBtn,
                      availabilityStatus === 'busy' && styles.availabilityBtnActive,
                      availabilityStatus === 'busy' && { backgroundColor: '#F59E0B' }
                    ]}
                    onPress={() => updateAvailabilityStatus('busy')}
                    disabled={loadingAvailability}
                  >
                    <Text style={[
                      styles.availabilityBtnText,
                      availabilityStatus === 'busy' && styles.availabilityBtnTextActive
                    ]}>Busy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.availabilityBtn,
                      availabilityStatus === 'unavailable' && styles.availabilityBtnActive,
                      availabilityStatus === 'unavailable' && { backgroundColor: '#EF4444' }
                    ]}
                    onPress={() => updateAvailabilityStatus('unavailable')}
                    disabled={loadingAvailability}
                  >
                    <Text style={[
                      styles.availabilityBtnText,
                      availabilityStatus === 'unavailable' && styles.availabilityBtnTextActive
                    ]}>Unavailable</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
          {/* Face ID Login removed here */}
          <SettingsItem 
            icon="web" iconColor="#38B2AC" label="Language"
            rightElement={
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.valueText}>English (US)</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color={THEME.subText} />
              </View>
            }
            isLast={true}
            onPress={() => {}}
          />
        </View>

        {/* --- SUPPORT SECTION --- */}
        <Text style={styles.sectionHeader}>SUPPORT</Text>
        <View style={styles.sectionCard}>
          <SettingsItem 
            icon="help-circle" iconColor="#F56565" label="Help Center"
            rightElement={<MaterialCommunityIcons name="open-in-new" size={20} color={THEME.subText} />}
            onPress={() => {}}
          />
          <SettingsItem 
            icon="file-document" iconColor="#A0AEC0" label="Terms of Service"
            rightElement={<MaterialCommunityIcons name="chevron-right" size={24} color={THEME.subText} />}
            isLast={true}
            onPress={() => {}}
          />
        </View>

        {/* --- LOG OUT BUTTON --- */}
        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={async () => {
            try {
              await logout();
            } catch (error) {
              console.error("Logout error:", error);
              // Force logout even if there's an error
            }
          }}
        >
          <MaterialCommunityIcons name="logout" size={20} color={THEME.danger} style={{marginRight: 8}} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>VERSION 2.4.0 (BUILD 302)</Text>
        <View style={{height: 80}} /> 

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.text,
  },
  helpText: {
    color: THEME.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#FFF', 
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#FFF',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: THEME.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF', 
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleText: {
    color: THEME.subText,
    fontSize: 14,
  },
  editProfileBtn: {
    backgroundColor: '#FFFFFF', 
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  editProfileText: {
    color: THEME.text,
    fontWeight: '600',
    fontSize: 14,
  },
  sectionHeader: {
    color: THEME.subText,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: 1,
  },
  sectionCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    overflow: 'hidden', 
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.divider,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: THEME.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemLabel: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '500',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    color: THEME.subText,
    fontSize: 14,
    marginRight: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2', 
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    color: THEME.danger,
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  availabilityBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  availabilityBtnActive: {
    borderWidth: 2,
    borderColor: '#FFF',
  },
  availabilityBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  availabilityBtnTextActive: {
    color: '#FFF',
  },
});