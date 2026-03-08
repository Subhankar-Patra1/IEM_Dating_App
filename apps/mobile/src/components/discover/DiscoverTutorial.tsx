import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface DiscoverTutorialProps {
  visible: boolean;
  onClose: () => void;
}

const DiscoverTutorial: React.FC<DiscoverTutorialProps> = ({ visible, onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Swipe Right to Like',
      description: 'Found someone interesting? Swipe their card to the right to like them.',
      icon: '👉'
    },
    {
      title: 'Swipe Left to Pass',
      description: 'Not a vibe? Swipe to the left to see the next person.',
      icon: '👈'
    },
    {
      title: 'Safety First',
      description: 'You can easily report any inappropriate profiles. We keep IEM dating safe.',
      icon: '🛡️'
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.icon}>{steps[step].icon}</Text>
          <Text style={styles.title}>{steps[step].title}</Text>
          <Text style={styles.description}>{steps[step].description}</Text>
          
          <View style={styles.dots}>
            {steps.map((_, i) => (
              <View 
                key={i} 
                style={[styles.dot, step === i && styles.activeDot]} 
              />
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {step === steps.length - 1 ? "Got It!" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: width * 0.85,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  icon: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  activeDot: {
    backgroundColor: '#FF4B4B',
    width: 20,
  },
  button: {
    backgroundColor: '#FF4B4B',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default DiscoverTutorial;
