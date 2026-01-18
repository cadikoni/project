import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'info',
  size = 'md',
}) => {
  return (
    <View style={[styles.badge, styles[variant], styles[`size_${size}`]]}>
      <Text style={[styles.text, styles[`textSize_${size}`]]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  success: {
    backgroundColor: '#dcfce7',
  },
  danger: {
    backgroundColor: '#fee2e2',
  },
  warning: {
    backgroundColor: '#fef3c7',
  },
  info: {
    backgroundColor: '#dbeafe',
  },
  size_sm: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  size_md: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  text: {
    fontWeight: '600',
  },
  textSize_sm: {
    fontSize: 12,
  },
  textSize_md: {
    fontSize: 14,
  },
});
