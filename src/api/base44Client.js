// Re-export our local client as if it were the base44 client
// This allows us to switch backends without changing imports everywhere
import { base44 as localBase44 } from './localClient';

export const base44 = localBase44;
