import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, fontWeights } from '../theme';

interface ProgressBarProps {
  progress: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  showText?: boolean;
  label?: string;
}

export const ProgressBar = ({
  progress,
  color,
  backgroundColor,
  height = 8,
  showText = false,
  label,
}: ProgressBarProps) => {
  const { colors } = useTheme();
  const barColor = color || colors.primary;
  const bgColor = backgroundColor || colors.backgroundInput;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View>
      {(showText || label) && (
        <View style={styles.labelRow}>
          {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
          {showText && (
            <Text style={[styles.percent, { color: colors.text }]}>{Math.round(clampedProgress * 100)}%</Text>
          )}
        </View>
      )}
      <View style={[styles.background, { backgroundColor: bgColor, height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress * 100}%`,
              backgroundColor: barColor,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
};

interface CircularProgressProps {
  size: number;
  progress: number;
  color?: string;
  backgroundColor?: string;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export const CircularProgress = ({
  size,
  progress,
  color,
  backgroundColor,
  strokeWidth = 10,
  children,
}: CircularProgressProps) => {
  const { colors } = useTheme();
  const barColor = color || colors.primary;
  const bgColor = backgroundColor || colors.backgroundInput;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  const firstHalfDeg = clampedProgress > 0.5 ? 180 : clampedProgress * 360;
  const secondHalfDeg = clampedProgress > 0.5 ? (clampedProgress - 0.5) * 360 : 0;

  return (
    <View style={[styles.circularContainer, { width: size, height: size }]}>
      <View style={[styles.halfCircle, styles.leftHalf, { backgroundColor: bgColor }]} />
      <View style={[styles.halfCircle, styles.rightHalf, { backgroundColor: bgColor }]} />
      
      <View style={[styles.halfCircle, styles.leftHalf, { backgroundColor: barColor }]} />
      <View
        style={[
          styles.halfCircle,
          styles.rightHalf,
          { backgroundColor: barColor },
          { transform: [{ rotate: `${firstHalfDeg}deg` }], opacity: clampedProgress > 0 ? 1 : 0 },
        ]}
      />
      
      <View
        style={[
          styles.halfCircle,
          styles.leftHalf,
          { backgroundColor: bgColor },
          { transform: [{ rotate: `${secondHalfDeg}deg` }], opacity: clampedProgress > 0.5 ? 1 : 0 },
        ]}
      />
      
      <View
        style={[
          styles.innerCircle,
          {
            width: size - strokeWidth * 2,
            height: size - strokeWidth * 2,
            borderRadius: (size - strokeWidth * 2) / 2,
            backgroundColor: 'transparent',
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    borderRadius: 9999,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 9999,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
  },
  percent: {
    fontSize: fontSize.sm,
    fontWeight: fontWeights.bold,
  },
  circularContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  halfCircle: {
    position: 'absolute',
    top: 0,
    width: '50%',
    height: '100%',
  },
  leftHalf: {
    left: 0,
    borderTopLeftRadius: 9999,
    borderBottomLeftRadius: 9999,
  },
  rightHalf: {
    right: 0,
    borderTopRightRadius: 9999,
    borderBottomRightRadius: 9999,
  },
  innerCircle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
});
