import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface AdhesionStatusModalProps {
  open: boolean;
  onClose: () => void;
  status: 'pending' | 'rejected' | null;
  rejectionReason?: string;
  onGoToRegister: () => void;
}

export default function AdhesionStatusModal({
  open,
  onClose,
  status,
  rejectionReason,
  onGoToRegister,
}: AdhesionStatusModalProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'rejected':
        return 'close-circle-outline';
      default:
        return 'help-outline';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'rejected':
        return '#FF0000';
      default:
        return '#666666';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'pending':
        return 'Adhésion en attente';
      case 'rejected':
        return 'Adhésion rejetée';
      default:
        return 'Statut d\'adhésion';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        return 'Votre demande d\'adhésion est actuellement en cours d\'examen. Vous serez notifié une fois qu\'elle sera validée.';
      case 'rejected':
        return 'Votre demande d\'adhésion a été rejetée. Vous pouvez soumettre une nouvelle demande en corrigeant les points mentionnés.';
      default:
        return 'Statut d\'adhésion non disponible.';
    }
  };

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
              name={getStatusIcon()}
              size={48}
              color={getStatusColor()}
            />
            <Text style={styles.title}>{getStatusTitle()}</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.message}>{getStatusMessage()}</Text>
            
            {status === 'rejected' && rejectionReason && (
              <View style={styles.rejectionContainer}>
                <Text style={styles.rejectionTitle}>Raison du rejet :</Text>
                <Text style={styles.rejectionReason}>{rejectionReason}</Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            {status === 'rejected' && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  onClose();
                  onGoToRegister();
                }}
              >
                <Text style={styles.primaryButtonText}>
                  Nouvelle demande
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onClose}
            >
              <Text style={styles.secondaryButtonText}>Fermer</Text>
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
  rejectionContainer: {
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF0000',
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF0000',
    marginBottom: 8,
  },
  rejectionReason: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
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
  secondaryButton: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
