// Optional delay helper to simulate loading states
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Simulate network delay (300-800ms range for realism)
export const simulateDelay = () => sleep(Math.random() * 500 + 300);
