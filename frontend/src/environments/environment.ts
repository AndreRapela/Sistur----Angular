const runtimeApiUrl = typeof window !== 'undefined'
  ? window.SISTUR_CONFIG?.apiUrl?.trim()
  : '';

export const environment = {
  production: false,
  apiUrl: runtimeApiUrl || 'http://localhost:8080/api',
  supabaseUrl: '',
  supabaseKey: '',
  googleClientId: '',
  googleMapsApiKey: ''
};
