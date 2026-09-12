import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, radius, spacing } from '../theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  small?: boolean;
}

export function Chip({ label, selected = false, onPress, small = false }: ChipProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected }}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.chip,
        small && styles.small,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, small && styles.smallLabel, selected && styles.selectedLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  small: { paddingHorizontal: spacing.sm + 2, paddingVertical: 3 },
  selected: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  pressed: { opacity: 0.7 },
  label: { fontFamily: fonts.body, fontSize: 15, color: colors.inkSoft },
  smallLabel: { fontSize: 12 },
  selectedLabel: { color: colors.accent, fontWeight: '600' },
});
