// utils/logger.ts
export const logEvent = (message: string) => {
  const timestamp = new Date().toISOString();
  console.log(`[LOG ${timestamp}] ${message}`);
};
