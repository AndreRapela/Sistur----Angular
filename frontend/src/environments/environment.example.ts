const runtimeApiUrl = typeof window !== 'undefined'
  ? window.SISTUR_CONFIG?.apiUrl?.trim()
  : '';

export const environment = {
  production: true,
  apiUrl: runtimeApiUrl || 'https://<backend>/api',
  supabaseUrl: 'https://<projeto>.supabase.co',
  supabaseKey: '<publishable-key-quando-o-frontend-usar-supabase-direto>',
  googleClientId: '<client-id-google-ou-vazio>',
  googleMapsApiKey: '<google-maps-browser-key>'
};
