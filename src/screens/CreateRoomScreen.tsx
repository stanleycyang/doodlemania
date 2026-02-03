import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Share,
  Keyboard,
} from 'react-native';

interface CreateRoomScreenProps {
  onCreateRoom: (playerName: string) => Promise<string | null>;
  onBack: () => void;
  onRoomCreated: (code: string) => void;
}

export const CreateRoomScreen: React.FC<CreateRoomScreenProps> = ({
  onCreateRoom,
  onBack,
  onRoomCreated,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!playerName.trim()) {
      Alert.alert('Name Required', 'Please enter your name');
      return;
    }

    setIsLoading(true);
    const code = await onCreateRoom(playerName.trim());
    setIsLoading(false);

    if (code) {
      setRoomCode(code);
    } else {
      Alert.alert('Error', 'Failed to create room. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!roomCode) return;
    
    try {
      await Share.share({
        message: `Join my Pictionary Party! 🎨\n\nRoom Code: ${roomCode}\n\nDownload the app and enter this code to play!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleContinue = () => {
    if (roomCode) {
      onRoomCreated(roomCode);
    }
  };

  // Show room code after creation
  if (roomCode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>← Cancel</Text>
          </TouchableOpacity>

          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successTitle}>Room Created!</Text>
            
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Share this code:</Text>
              <Text style={styles.code}>{roomCode}</Text>
            </View>

            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Text style={styles.shareButtonText}>📤 Share Code</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue to Lobby →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.form}>
            <Text style={styles.title}>Create Game</Text>
            <Text style={styles.subtitle}>You'll be the host!</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                value={playerName}
                onChangeText={setPlayerName}
                placeholder="Enter your name"
                placeholderTextColor="rgba(255,255,255,0.5)"
                maxLength={20}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            <TouchableOpacity
              style={[styles.createButton, !playerName.trim() && styles.disabledButton]}
              onPress={handleCreate}
              disabled={isLoading || !playerName.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>Create Room</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
  },
  backText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    marginTop: -60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  createButton: {
    backgroundColor: '#FF6B6B',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 32,
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  codeLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  code: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFE66D',
    letterSpacing: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  shareButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  shareButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  continueButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 8,
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default CreateRoomScreen;
