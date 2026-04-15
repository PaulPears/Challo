import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';

const MapPinIcon = ({ color, size, style }: { color: string; size: number; style?: StyleProp<ViewStyle> }) => {
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
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <Circle cx="12" cy="10" r="3" />
    </Svg>
  );
};

export default MapPinIcon;
