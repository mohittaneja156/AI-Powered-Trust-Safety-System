import React, { forwardRef } from 'react';
import Webcam from 'react-webcam';

const AnyWebcam = Webcam as any;

const CameraWebcam = forwardRef<any, any>((props, ref) => (
  <AnyWebcam ref={ref} {...props} />
));

CameraWebcam.displayName = 'CameraWebcam';

export default CameraWebcam; 