import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import { GardenText } from "@/components/ui/garden-primitives";
import { GardenColors, GardenSpacing } from "@/constants/design-system";
import privacyPolicyMarkdown from "../../../../PRIVACY.md";

type PrivacyPolicyModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function PrivacyPolicyModal({
  visible,
  onClose,
}: PrivacyPolicyModalProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || content) return;

    let mounted = true;
    const loadPolicy = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const asset = Asset.fromModule(privacyPolicyMarkdown);
        await asset.downloadAsync();
        const uri = asset.localUri ?? asset.uri;
        const text =
          Platform.OS === "web"
            ? await fetch(uri).then((response) => response.text())
            : await FileSystem.readAsStringAsync(uri);
        if (mounted) {
          setContent(text);
        }
      } catch (error) {
        console.error("Failed to load privacy policy", error);
        if (mounted) {
          setLoadError("Unable to load privacy policy.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPolicy();
    return () => {
      mounted = false;
    };
  }, [content, visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons
                name="close"
                size={22}
                color={GardenColors.forest}
              />
            </Pressable>
            <GardenText variant="section">Privacy Policy</GardenText>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator color={GardenColors.sage} />
                <GardenText variant="meta" color="#6A7868">
                  Loading privacy policy...
                </GardenText>
              </View>
            ) : null}
            {!loading && loadError ? (
              <GardenText variant="meta" color="#8A4D45">
                {loadError}
              </GardenText>
            ) : null}
            {!loading && !loadError ? (
              <GardenText
                variant="meta"
                color={GardenColors.forest}
                style={styles.body}
              >
                {content}
              </GardenText>
            ) : null}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(44,54,43,0.34)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "92%",
    minHeight: "72%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: GardenColors.cream,
    paddingHorizontal: GardenSpacing.md,
    paddingTop: GardenSpacing.sm,
    paddingBottom: GardenSpacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: GardenSpacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GardenColors.white,
    borderWidth: 1,
    borderColor: GardenColors.border,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  content: {
    paddingBottom: GardenSpacing.sm,
    gap: 10,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 24,
  },
  body: {
    lineHeight: 22,
  },
});
