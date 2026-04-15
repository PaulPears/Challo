import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Svg, Polygon } from 'react-native-svg';

const StarIcon = ({ color, size, style }: { color: string; size: number; style?: StyleProp<ViewStyle> }) => {
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
      <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </Svg>
  );
};

export default StarIcon;
