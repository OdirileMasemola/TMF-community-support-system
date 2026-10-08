import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronDown, ChevronUp, Mail, MapPin, Phone } from "lucide-react-native";
import { useAuth } from "@/auth/AuthProvider";
import { ChipSelect, PageHeading, Screen, SectionCard } from "@/components/ui";
import { HELP_CONTACT, helpSectionFor, helpSections, type HelpTopic } from "@/data/helpContent";
import { useTheme, useThemedStyles } from "@/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "@/theme/tokens";

/** Help and FAQ, open to everyone. Signed-in users start on the section for their role. */
export default function HelpScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [topic, setTopic] = useState<HelpTopic>(profile?.role ?? "general");
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  // Administrator help is only useful to administrators.
  const topics = helpSections
    .filter((section) => section.topic !== "administrator" || profile?.role === "administrator")
    .map((section) => ({ label: section.label, value: section.topic }));
  const section = helpSectionFor(topic);

  return (
    <Screen>
      <PageHeading eyebrow="Help" title="How can we help?" subtitle="Step-by-step guides and answers to common questions." />

      <ChipSelect
        label="Topic"
        options={topics}
        value={topic}
        onChange={(next) => {
          setTopic(next);
          setOpenQuestion(null);
        }}
      />

      <SectionCard title={section.title}>
        <Text style={styles.summary}>{section.summary}</Text>
        {section.howTo.map((step, index) => (
          <View key={step} style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Frequently asked questions">
        {section.faqs.map((item) => {
          const isOpen = openQuestion === item.question;
          const Chevron = isOpen ? ChevronUp : ChevronDown;
          return (
            <View key={item.question} style={styles.faq}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                onPress={() => setOpenQuestion(isOpen ? null : item.question)}
                style={({ pressed }) => [styles.question, pressed && styles.pressed]}
              >
                <Text style={styles.questionText}>{item.question}</Text>
                <Chevron size={18} color={colors.mutedForeground} />
              </Pressable>
              {isOpen ? <Text style={styles.answer}>{item.answer}</Text> : null}
            </View>
          );
        })}
      </SectionCard>

      <SectionCard title="Contact the foundation">
        <Text style={styles.summary}>Reach the foundation directly for questions about your account or the app.</Text>
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(`tel:${HELP_CONTACT.phone.replace(/\s+/g, "")}`)}
          style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
        >
          <Phone size={17} color={colors.primary} />
          <Text style={styles.contactText}>{HELP_CONTACT.phone}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(`mailto:${HELP_CONTACT.email}`)}
          style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
        >
          <Mail size={17} color={colors.primary} />
          <Text style={styles.contactText}>{HELP_CONTACT.email}</Text>
        </Pressable>
        <View style={styles.contactRow}>
          <MapPin size={17} color={colors.primary} />
          <Text style={styles.contactText}>{HELP_CONTACT.area}</Text>
        </View>
      </SectionCard>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    summary: {
      ...typography.caption,
      color: colors.mutedForeground,
      marginBottom: spacing.xs,
    },
    step: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
      paddingVertical: spacing.xs,
    },
    stepNumber: {
      width: 24,
      height: 24,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primarySurface,
    },
    stepNumberText: {
      ...typography.label,
      color: colors.primary,
    },
    stepText: {
      ...typography.body,
      color: colors.foreground,
      flex: 1,
      lineHeight: 21,
    },
    faq: {
      borderBottomColor: colors.borderSubtle,
      borderBottomWidth: 1,
      paddingVertical: spacing.sm,
      gap: spacing.xs,
    },
    question: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      paddingVertical: spacing.xs,
    },
    questionText: {
      ...typography.bodyStrong,
      color: colors.foreground,
      flex: 1,
    },
    answer: {
      ...typography.body,
      color: colors.mutedForeground,
      lineHeight: 21,
    },
    contactRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    contactText: {
      ...typography.body,
      color: colors.foreground,
      flexShrink: 1,
    },
    pressed: {
      opacity: 0.7,
    },
  });
