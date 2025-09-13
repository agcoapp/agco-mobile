import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface ImageViewerProps {
  imageUri: string;
  onClose?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ImageViewer({ imageUri, onClose }: ImageViewerProps) {
  const [scaleValue, setScaleValue] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [lastTap, setLastTap] = useState(0);
  const instructionsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Variables pour le zoom au pincement
  const [pinchDistance, setPinchDistance] = useState<number | null>(null);
  const [baseScale, setBaseScale] = useState(1);
  
  // Variables pour le pan
  const [panStartX, setPanStartX] = useState(0);
  const [panStartY, setPanStartY] = useState(0);

  // Fermer automatiquement les instructions après 3 secondes
  useEffect(() => {
    instructionsTimeout.current = setTimeout(() => {
      setShowInstructions(false);
    }, 3000);

    return () => {
      if (instructionsTimeout.current) {
        clearTimeout(instructionsTimeout.current);
      }
    };
  }, []);

  const hideInstructions = () => {
    setShowInstructions(false);
    if (instructionsTimeout.current) {
      clearTimeout(instructionsTimeout.current);
      instructionsTimeout.current = null;
    }
  };

  const getDistance = (touch1: any, touch2: any) => {
    return Math.sqrt(
      Math.pow(touch2.pageX - touch1.pageX, 2) + 
      Math.pow(touch2.pageY - touch1.pageY, 2)
    );
  };

  const getCenter = (touch1: any, touch2: any) => {
    return {
      x: (touch1.pageX + touch2.pageX) / 2,
      y: (touch1.pageY + touch2.pageY) / 2,
    };
  };

  // Gestion des événements de touch natifs
  const handleTouchStart = (evt: any) => {
    hideInstructions();
    const touches = evt.nativeEvent.touches;
    console.log('🖱️ Touch Start - Touches:', touches.length);
    
    if (touches.length === 2) {
      // Début du zoom au pincement
      const touch1 = touches[0];
      const touch2 = touches[1];
      const distance = getDistance(touch1, touch2);
      console.log('🔍 Début zoom - Distance:', distance, 'Scale actuel:', scaleValue);
      setPinchDistance(distance);
      setBaseScale(scaleValue);
    } else if (touches.length === 1) {
      // Gestion du double-tap pour fermer et du pan
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      
      if (now - lastTap < DOUBLE_TAP_DELAY) {
        if (onClose) {
          onClose();
        }
      } else if (scaleValue > 1) {
        // Début du pan
        setPanStartX(translateX);
        setPanStartY(translateY);
      }
      setLastTap(now);
    }
  };

  const handleTouchMove = (evt: any) => {
    const touches = evt.nativeEvent.touches;
    console.log('🖱️ Touch Move - Touches:', touches.length);
    
    if (touches.length === 2 && pinchDistance !== null) {
      // Zoom au pincement
      const touch1 = touches[0];
      const touch2 = touches[1];
      const currentDistance = getDistance(touch1, touch2);
      
      const scaleFactor = currentDistance / pinchDistance;
      const newScale = Math.max(0.5, Math.min(4, baseScale * scaleFactor));
      
      console.log('🔍 Zoom - Distance actuelle:', currentDistance, 'Facteur:', scaleFactor.toFixed(2), 'Nouveau scale:', newScale.toFixed(2));
      setScaleValue(newScale);
    } else if (touches.length === 1 && scaleValue > 1) {
      // Pan avec un doigt (seulement si zoomé)
      const touch = touches[0];
      const deltaX = touch.pageX - (panStartX + screenWidth / 2);
      const deltaY = touch.pageY - (panStartY + screenHeight / 2);
      setTranslateX(panStartX + deltaX * 0.5);
      setTranslateY(panStartY + deltaY * 0.5);
    }
  };

  const handleTouchEnd = (evt: any) => {
    const touches = evt.nativeEvent.touches;
    console.log('🖱️ Touch End - Touches restantes:', touches.length);
    
    if (touches.length === 0) {
      if (pinchDistance !== null) {
        // Fin du zoom au pincement
        setPinchDistance(null);
        setBaseScale(scaleValue);
      }
    }
  };

  const resetImage = () => {
    setScaleValue(1);
    setTranslateX(0);
    setTranslateY(0);
    setBaseScale(1);
    setPinchDistance(null);
  };

  return (
    <View style={styles.container}>
      {/* Instructions d'utilisation */}
      {showInstructions && (
        <TouchableOpacity 
          style={styles.instructionsContainer} 
          onPress={hideInstructions}
          activeOpacity={1}
        >
          <View style={styles.instructionsBox}>
            <Ionicons name="hand-left-outline" size={32} color="white" />
            <Text style={styles.instructionsTitle}>Zoom et Navigation</Text>
            <Text style={styles.instructionsText}>
              • Pincez avec 2 doigts pour zoomer{'\n'}
              • Glissez avec 1 doigt pour naviguer{'\n'}
              • Double-tap pour fermer{'\n'}
              • Appuyez pour fermer cette aide
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Bouton de fermeture */}
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      )}
      
      {/* Bouton de reset */}
      <TouchableOpacity style={styles.resetButton} onPress={resetImage}>
        <Ionicons name="refresh" size={20} color="white" />
      </TouchableOpacity>

      {/* Indicateur de zoom */}
      {scaleValue !== 1 && (
        <View style={styles.zoomIndicator}>
          <Text style={styles.zoomText}>Zoom: {(scaleValue * 100).toFixed(0)}%</Text>
        </View>
      )}

      <View 
        style={styles.gestureContainer}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <View
          style={[
            styles.image,
            {
              transform: [
                { scale: scaleValue },
                { translateX: translateX },
                { translateY: translateY },
              ],
            },
          ]}
        >
          <Image
            source={{ uri: imageUri }}
            style={styles.imageContent}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gestureContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
  imageContent: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
  resetButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
  instructionsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  instructionsBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 300,
    marginHorizontal: 20,
  },
  instructionsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionsText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  zoomIndicator: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 1,
  },
  zoomText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
