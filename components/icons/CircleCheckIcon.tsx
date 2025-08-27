import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const CircleCheckIcon = ({ size = 24, stroke = 'green', fill = 'rgba(0,128,0,0.1)' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" stroke={stroke} strokeWidth="2" fill={fill} />
    <Path
      d="M16 8L10.5 13.5L8 11"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default CircleCheckIcon;
