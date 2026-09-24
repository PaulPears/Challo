declare module '@msg91comm/sendotp-react-native' {
  export const OTPWidget: {
    initializeWidget: (widgetId: string, tokenAuth: string) => void;
    sendOTP: (
      params: { identifier: string; [key: string]: any },
      successCallback?: (response: any) => void,
      failureCallback?: (error: any) => void
    ) => Promise<any> | void;
    retryOTP: (
      params: { reqId: string; retryChannel?: number | string; [key: string]: any },
      successCallback?: (response: any) => void,
      failureCallback?: (error: any) => void
    ) => Promise<any> | void;
    verifyOTP: (
      params: { reqId: string; otp: string; [key: string]: any },
      successCallback?: (response: any) => void,
      failureCallback?: (error: any) => void
    ) => Promise<any> | void;
    [key: string]: any;
  };
  export default OTPWidget;
}
