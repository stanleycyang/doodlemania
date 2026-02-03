import React, { useState, useRef } from 'react';
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
  Keyboard,
} from 'react-native';

interface JoinRoomScreenProps {
  onJoinRoom: (code: string, playerName: string) => Promise<boolean>;
  onBack: () => void;
  onJoined: () => void;
}

export const JoinRoomScreen: React.FC<JoinRoomScreenProps> = ({
  onJoinRoom,
  onBack,
  onJoined,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const codeInputRef = useRef<TextInput>(null);

  const handleJoin = async () => {
    if (!playerName.trim()) {
      Alert.alert('Name Required', 'Please enter your name');
      return;
    }

    if (roomCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-character room code');
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);
    
    const success = await onJoinRoom(roomCode.toUpperCase(), playerName.trim());
    setIsLoading(false);

    if (success) {
      onJoined();
    } else {
      Alert.alert('Error', 'Could not join room. Check the code and try again.');
    }
  };

  const handleCodeChange = (text: string) => {
    // Only allow alphanumeric, uppercase
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRoomCode(cleaned.slice(0, 6));
  };

  const isValid = playerName.trim().length > 0 && roomCode.length === 6;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.form}>
            <Text style={styles.title}>Join Game</Text>
            <Text style={styles.subtitle}>Enter the room code to play!</Text>

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
                returnKeyType="next"
                onSubmitEditing={() => codeInputRef.current?.focus()}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Room Code</Text>
              <TextInput
                ref={codeInputRef}
                style={[styles.input, styles.codeInput]}
                value={roomCode}
                onChangeText={handleCodeChange}
                placeholder="XXXXXX"
                placeholderTextColor="rgba(255,255,255,0.3)"
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
                keyboardType="default"
                returnKeyType="go"
                onSubmitEditing={handleJoin}
              />
            </View>

            <TouchableOpacity
              style={[styles.joinButton, !isValid && styles.disabledButton]}
              onPress={handleJoin}
              disabled={isLoading || !isValid}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.joinButtonText}>Join Room</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              💡 Ask the host for the 6-character room code
            </Text>
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
    marginTop: -80,
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
  codeInput: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  joinButton: {
    backgroundColor: '#4ECDC4',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  joinButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  helpContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
});

export default JoinRoomScreen;
