import { StyleSheet, View } from 'react-native';

import { Chip, Text, spacing } from '../../ui';
import type { Template } from './logic';

type Props = {
  templates: readonly Template[];
  onPick: (template: Template) => void;
};

/** A row of starting points shown above a blank page. */
export function TemplatePicker({ templates, onPick }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text variant="caption" muted>
        Start from a template (optional)
      </Text>
      <View style={styles.chips}>
        {templates.map((template) => (
          <Chip
            key={template.id}
            label={template.label}
            accessibilityLabel={`Start with the ${template.label} template`}
            onPress={() => onPick(template)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
