/**
 * Configuration management for the workflow system
 */

import * as dotenv from 'dotenv';

// Load environment variables from .env file in development
dotenv.config();

export interface Config {
  aoai: {
    baseUrl: string;
    deployment: string;
    apiKey: string;
    apiVersion: string;
  };
  mockTools: {
    baseUrl: string;
  };
  workflow: {
    maxRetries: number;
    pollingInterval: number; // in seconds
    pollingMaxAttempts: number;
    humanFixTimeout: number; // in seconds
    draftApprovalTimeout: number; // in seconds
  };
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
}

export const config: Config = {
  aoai: {
    baseUrl: getEnvVar('AOAI_BASE_URL'),
    deployment: getEnvVar('AOAI_DEPLOYMENT'),
    apiKey: getEnvVar('AOAI_API_KEY'),
    apiVersion: process.env.AOAI_API_VERSION || '2024-08-01-preview',
  },
  mockTools: {
    baseUrl: getEnvVar('MOCK_TOOLS_BASE_URL'),
  },
  workflow: {
    maxRetries: 3,
    pollingInterval: 10, // 10 seconds
    pollingMaxAttempts: 30, // 5 minutes total
    humanFixTimeout: 3600, // 1 hour
    draftApprovalTimeout: 3600, // 1 hour
  },
};
