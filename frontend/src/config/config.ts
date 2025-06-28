const config = {
  BackendUrl: String(import.meta.env.VITE_BACKEND_URL),
  StoreSecret: String(import.meta.env.VITE_STORE_SECRET),
  ConfirmKey: String(import.meta.env.VITE_CONFIRM_KEY),
  StripeKey: String(import.meta.env.VITE_STRIPE_SECRET),
  BaseImageUrl: String(import.meta.env.VITE_BASE_IMAGE_URL),
};
export default config;
