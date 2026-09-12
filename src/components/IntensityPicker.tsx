import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { INTENSITY_VALUES, type Intensity } from '../data';
import { INTENSITY_LABELS } from '../lib/format';
import { colors, fonts, radius, spacing } from '../theme';

interface IntensityPickerProps {
  value: Intensity | null;
  onChange: (value: Intensity | null) => void;
}

/** Five dots, from faint to intense. Tap the selected one again to clear. */
export function IntensityPicker({ value, onChange }: IntensityPickerProps) {
  return (
    <View>
      <View style={styles.row}>
        {INTENSITY_VALUES.map((level) => {
          const active = value !== null && level <= value;
          return (
            <Pressable
              key={level}
              accessibilityRole="button"
              accessibilityLabel={`Intensity ${level}, ${INTENSITY_LABELS[level]}`}
              accessibilityState={{ selected: value === level }}
              onPress={() => onChange(value === level ? null : level)}
              hitSlop={6}
              style={[styles.dot, active && styles.dotActive, value === level && styles.dotCurrent]}
            />
          );
        })}
      </View>
      <Text style={styles.caption}>
        {value === null ? 'Intensity (optional)' : `Intensity ${value} · ${INTENSITY_LABELS[value]}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm + 4, alignItems: 'center' },
  dot: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  dotActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  dotCurrent: { backgroundColor: colors.accent },
  caption: { marginTop: spacing.sm, fontFamily: fonts.body, fontSize: 13, color: colors.inkFaint },
});
