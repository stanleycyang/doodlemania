import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface HomeScreenProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onLocalPlay: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
  onLocalPlay,
}) => {
  // Animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(-50)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(50)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const button1Slide = useRef(new Animated.Value(100)).current;
  const button2Slide = useRef(new Animated.Value(100)).current;
  const button3Slide = useRef(new Animated.Value(100)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const emojiRotate = useRef(new Animated.Value(0)).current;

  // Button press animations
  const button1Scale = useRef(new Animated.Value(1)).current;
  const button2Scale = useRef(new Animated.Value(1)).current;
  const button3Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered entrance animation
    Animated.sequence([
      // Logo bounces in
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
      // Title slides down
      Animated.parallel([
        Animated.timing(titleSlide, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Subtitle slides up
      Animated.parallel([
        Animated.timing(subtitleSlide, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Buttons slide in with stagger
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.stagger(100, [
          Animated.spring(button1Slide, {
            toValue: 0,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.spring(button2Slide, {
            toValue: 0,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.spring(button3Slide, {
            toValue: 0,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Footer fades in
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous emoji rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(emojiRotate, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(emojiRotate, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleButtonPress = (scale: Animated.Value, callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const emojiRotateInterpolate = emojiRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Title */}
        <View style={styles.header}>
          <Animated.Text 
            style={[
              styles.title,
              { 
                transform: [
                  { scale: logoScale },
                  { rotate: emojiRotateInterpolate },
                ]
              }
            ]}
          >
            🎨
          </Animated.Text>
          <Animated.Text 
            style={[
              styles.titleText,
              { 
                opacity: titleOpacity,
                transform: [{ translateY: titleSlide }]
              }
            ]}
          >
            Pictionary
          </Animated.Text>
          <Animated.Text 
            style={[
              styles.subtitleText,
              {
                opacity: subtitleOpacity,
                transform: [{ translateY: subtitleSlide }]
              }
            ]}
          >
            Party
          </Animated.Text>
        </View>

        {/* Menu Buttons */}
        <Animated.View style={[styles.menu, { opacity: buttonOpacity }]}>
          <Animated.View style={{ transform: [{ translateX: button1Slide }, { scale: button1Scale }] }}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => handleButtonPress(button1Scale, onCreateRoom)}
              activeOpacity={1}
            >
              <Text style={styles.buttonIcon}>🎮</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonText}>Create Game</Text>
                <Text style={styles.buttonSubtext}>Host a new room</Text>
              </View>
              <Text style={styles.buttonArrow}>→</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ translateX: button2Slide }, { scale: button2Scale }] }}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => handleButtonPress(button2Scale, onJoinRoom)}
              activeOpacity={1}
            >
              <Text style={styles.buttonIcon}>🔗</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonText}>Join Game</Text>
                <Text style={styles.buttonSubtext}>Enter room code</Text>
              </View>
              <Text style={styles.buttonArrow}>→</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ translateX: button3Slide }, { scale: button3Scale }] }}>
            <TouchableOpacity
              style={[styles.button, styles.tertiaryButton]}
              onPress={() => handleButtonPress(button3Scale, onLocalPlay)}
              activeOpacity={1}
            >
              <Text style={styles.buttonIcon}>📱</Text>
              <View style={styles.buttonTextContainer}>
                <Text style={[styles.buttonText, styles.darkText]}>Local Play</Text>
                <Text style={[styles.buttonSubtext, styles.darkSubtext]}>Same device</Text>
              </View>
              <Text style={[styles.buttonArrow, styles.darkText]}>→</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
          <Text style={styles.footerText}>Draw. Guess. Win!</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6B4EE6',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 90,
    marginBottom: 8,
  },
  titleText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  subtitleText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFB347',
    marginTop: -8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  menu: {
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
  },
  secondaryButton: {
    backgroundColor: '#4ECDC4',
  },
  tertiaryButton: {
    backgroundColor: '#FFE66D',
  },
  buttonIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  darkText: {
    color: '#333',
  },
  buttonSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  darkSubtext: {
    color: 'rgba(0,0,0,0.6)',
  },
  buttonArrow: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.8)',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    fontWeight: '500',
  },
});

export default HomeScreen;
