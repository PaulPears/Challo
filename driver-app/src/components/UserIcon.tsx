import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';

const UserIcon = ({ color, size, style }: { color: string; size: number; style?: StyleProp<ViewStyle> }) => {
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
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
};

export default UserIcon;
