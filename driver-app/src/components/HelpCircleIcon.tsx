import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Svg, Circle, Path, Line } from 'react-native-svg';

const HelpCircleIcon = ({ color, size, style }: { color: string; size: number; style?: StyleProp<ViewStyle> }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <Circle cx="12" cy="12" r="10" />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <Line x1="12" y1="17" x2="12.01" y2="17" />
    </Svg>
  );
};

export default HelpCircleIcon;
