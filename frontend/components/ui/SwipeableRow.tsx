import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  disabled?: boolean;
  deleteLabel?: string;
}

export function SwipeableRow({
  children,
  onDelete,
  disabled = false,
  deleteLabel = 'Delete',
}: SwipeableRowProps) {
  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={onDelete}
      disabled={disabled}
    >
      <Ionicons name="trash-outline" size={24} color="#fff" />
      <Text style={styles.deleteLabel}>{deleteLabel}</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable
      renderRightActions={disabled ? undefined : renderRightActions}
      friction={2}
      rightThreshold={40}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  deleteAction: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginLeft: 8,
  },
  deleteLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
});
