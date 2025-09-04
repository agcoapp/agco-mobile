import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface AdhesionPendingModalProps {
  open: boolean;
  onClose: () => void;
  message: string;
}

export default function AdhesionPendingModal({
  open,
  onClose,
  message,
}: AdhesionPendingModalProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Ionicons
              name="time-outline"
              size={48}
              color="#FFA500"
            />
            <Text style={styles.title}>Adhésion en attente</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.message}>{message}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onClose}
            >
              <Text style={styles.primaryButtonText}>Compris</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
    color: '#333',
  },
  content: {
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoText: {
    color: '#007AFF',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
