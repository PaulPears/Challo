import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Svg, Rect, Polygon, Circle } from 'react-native-svg';

const TruckIcon = ({ color, size, style }: { color: string; size: number; style?: StyleProp<ViewStyle> }) => {
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
      <Rect x="1" y="3" width="15" height="13" />
      <Polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <Circle cx="5.5" cy="18.5" r="2.5" />
      <Circle cx="18.5" cy="18.5" r="2.5" />
    </Svg>
  );
};

export default TruckIcon;
