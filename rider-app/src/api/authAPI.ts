import axiosClient from './axiosClient';

export const sendOtp = async (phoneNumber: string): Promise<any> => {
  const response = await axiosClient.post('/auth/send-otp', { phoneNumber });
  return response.data;
};

export const verifyOtp = async (
  phoneNumber: string,
  otp: string,
): Promise<{ accessToken: string; isNewUser: boolean }> => {
  const response = await axiosClient.post('/auth/verify-otp', { phoneNumber, otp });
  return response.data;
};

export const loginVerified = async (phoneNumber: string, accessToken: string): Promise<{ accessToken: string; isNewUser: boolean; user?: any }> => {
  const response = await axiosClient.post('/auth/login-verified', { phoneNumber, accessToken });
  return response.data;
};

export const updateUser = async (user: { id: string; name: string }): Promise<any> => {
  const response = await axiosClient.patch(`/users/${user.id}`, { name: user.name });
  return response.data;
};

export const getMe = async (): Promise<any> => {
  const response = await axiosClient.get('/profile');
  return response.data;
};

export const getRating = async (): Promise<{ rating: number }> => {
  const response = await axiosClient.get('/users/rating');
  return response.data;
};

export const getWallet = async (): Promise<{ balance: number; currency: string; is_active: boolean }> => {
  const response = await axiosClient.get('/payments/wallet');
  return response.data;
};

export const getWalletTransactions = async (): Promise<any[]> => {
  const response = await axiosClient.get('/payments/wallet/transactions');
  return response.data;
};
