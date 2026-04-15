import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface DocumentUploadCardProps {
  label: string;
  description?: string;
  imageUri?: string | null;
  onPress: () => void;
  icon?: string;
  isValid?: boolean;
}

const { width } = Dimensions.get('window');

const DocumentUploadCard = ({
  label,
  description,
  imageUri,
  onPress,
  icon = 'camera-outline',
  isValid,
}: DocumentUploadCardProps) => {
  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        imageUri && styles.cardActive,
        isValid && styles.cardValid
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {imageUri ? (
        <View style={styles.imageWrapper}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <View style={styles.editOverlay}>
            <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
            <Text style={styles.editText}>Change</Text>
          </View>
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name={icon as any} size={32} color="#fe7009" />
          </View>
          <Text style={styles.label}>{label}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
          <View style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>Tap to Capture</Text>
          </View>
        </View>
      )}
      
      {isValid && (
        <View style={styles.validBadge}>
          <MaterialCommunityIcons name="check-circle" size={20} color="#4bb543" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
    width: '100%',
    minHeight: 180,
    marginBottom: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActive: {
    borderStyle: 'solid',
    borderColor: '#fe7009',
  },
  cardValid: {
    borderColor: '#4bb543',
  },
  imageWrapper: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  editText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  placeholderContainer: {
    padding: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff5ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  uploadButton: {
    backgroundColor: '#fe7009',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  validBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default DocumentUploadCard;
