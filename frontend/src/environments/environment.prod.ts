const runtimeApiUrl = typeof window !== 'undefined'
  ? window.SISTUR_CONFIG?.apiUrl?.trim()
  : '';

export const environment = {
  production: true,
  apiUrl: runtimeApiUrl || 'https://sistur-springboot.onrender.com/api',
  supabaseUrl: '',
  supabaseKey: '',
  googleClientId: '',
  googleMapsApiKey: ''
};
