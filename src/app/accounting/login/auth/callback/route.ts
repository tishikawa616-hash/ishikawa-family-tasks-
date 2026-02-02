// Re-export the main auth callback handler to support the incorrect path /login/auth/callback
// This fixes the 404 error for users who received links with /login/auth/callback
export { GET } from '@/app/auth/callback/route';
