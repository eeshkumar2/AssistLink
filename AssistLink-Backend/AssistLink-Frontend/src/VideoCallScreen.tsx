import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const VideoCallScreen = ({ route }: any) => {
  const navigation = useNavigation();
  const [timeRemaining, setTimeRemaining] = useState(15);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Countdown timer
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Auto-close after 15 seconds with fade out
          timeoutRef.current = setTimeout(() => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              navigation.goBack();
            });
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fadeAnim, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar hidden />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Blank screen - can be customized later */}
        <View style={styles.blankScreen}>
          <Text style={styles.timerText}>{timeRemaining}</Text>
          {timeRemaining > 0 && (
            <Text style={styles.statusText}>Video Call in Progress...</Text>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blankScreen: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  timerText: {
    fontSize: 72,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 18,
    color: '#CCCCCC',
    fontWeight: '500',
  },
});

export default VideoCallScreen;

