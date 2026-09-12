import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { IntensityPicker } from '../components/IntensityPicker';
import { MAX_DESCRIPTION_LENGTH, SUGGESTED_TAGS, type Intensity, ValidationError } from '../data';
import { deletePhoto, persistPhoto, pickPhoto, type PhotoSource } from '../lib/photos';
import type { RootScreenProps } from '../navigation/types';
import { useDiary } from '../state/DiaryProvider';
import { colors, fonts, radius, spacing } from '../theme';

export function CaptureScreen({ navigation }: RootScreenProps<'Capture'>) {
  const { addEntry } = useDiary();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<Intensity | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = !saving && (description.trim().length > 0 || tags.length > 0);

  async function choosePhoto(source: PhotoSource) {
    const uri = await pickPhoto(source);
    if (uri) setPhotoUri(uri);
  }

  function toggleTag(tag: string) {
    setTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );
  }

  async function save() {
    setSaving(true);
    let storedUri: string | null = null;
    try {
      if (photoUri) storedUri = await persistPhoto(photoUri, Crypto.randomUUID());
      await addEntry({ smellDescription: description, photoUri: storedUri, tags, intensity });
      navigation.goBack();
    } catch (e) {
      deletePhoto(storedUri);
      const message =
        e instanceof ValidationError ? e.message : 'Could not save this entry. Please try again.';
      Alert.alert('Not saved', message);
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.photoBox}>
          {photoUri ? (
            <>
              <Image
                source={{ uri: photoUri }}
                style={styles.photo}
                accessibilityIgnoresInvertColors
              />
              <Pressable
                accessibilityLabel="Remove photo"
                onPress={() => setPhotoUri(null)}
                style={styles.removePhoto}
                hitSlop={8}
              >
                <Ionicons name="close" size={18} color={colors.card} />
              </Pressable>
            </>
          ) : (
            <View style={styles.photoActions}>
              <PhotoAction
                icon="camera-outline"
                label="Take photo"
                onPress={() => choosePhoto('camera')}
              />
              <PhotoAction
                icon="images-outline"
                label="Choose photo"
                onPress={() => choosePhoto('library')}
              />
            </View>
          )}
        </View>

        <Text style={styles.prompt}>What does it smell like?</Text>
        <TextInput
          accessibilityLabel="Smell description"
          value={description}
          onChangeText={setDescription}
          placeholder="In your own words. Short is fine."
          placeholderTextColor={colors.inkFaint}
          multiline
          autoFocus
          maxLength={MAX_DESCRIPTION_LENGTH}
          textAlignVertical="top"
          style={styles.input}
        />

        <Text style={styles.sectionLabel}>A few words that fit (optional)</Text>
        <View style={styles.chips}>
          {SUGGESTED_TAGS.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              selected={tags.includes(tag)}
              onPress={() => toggleTag(tag)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <IntensityPicker value={intensity} onChange={setIntensity} />
        </View>

        <View style={styles.actions}>
          <Button label="Save" onPress={save} disabled={!canSave} loading={saving} />
          <Button
            label="Cancel"
            variant="secondary"
            onPress={() => navigation.goBack()}
            disabled={saving}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PhotoAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.photoAction, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={26} color={colors.accent} />
      <Text style={styles.photoActionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  photoBox: {
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  removePhoto: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(43,38,34,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: { flex: 1, flexDirection: 'row' },
  photoAction: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  photoActionLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft },
  pressed: { opacity: 0.7 },
  prompt: { fontFamily: fonts.heading, fontSize: 24, color: colors.ink, marginTop: spacing.sm },
  input: {
    minHeight: 110,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 24,
    color: colors.ink,
  },
  sectionLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkFaint,
    marginTop: spacing.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  section: { marginTop: spacing.sm },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
