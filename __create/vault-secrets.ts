/**
 * HashiCorp Vault Secrets Manager
 * 
 * Fetches secrets from Vault on application startup.
 * Application will fail to start if Vault is unreachable.
 */

interface VaultSecrets {
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  shopee: {
    apiKey: string;
    apiSecret: string;
  };
  tiktok: {
    apiKey: string;
    apiSecret: string;
  };
  jwt: {
    secret: string;
  };
}

class VaultClient {
  private vaultAddr: string;
  private vaultToken: string;
  private secrets: VaultSecrets | null = null;

  constructor() {
    this.vaultAddr = process.env.VAULT_ADDR || 'http://localhost:8200';
    this.vaultToken = process.env.VAULT_TOKEN || '';
  }

  /**
   * Initialize Vault connection and fetch all secrets.
   * When VAULT_TOKEN is not set, use env vars (local dev) and skip Vault.
   */
  async initialize(): Promise<VaultSecrets> {
    if (!this.vaultToken) {
      console.log('[Vault] VAULT_TOKEN not set — using DATABASE_URL / POSTGRES_* / AUTH_SECRET from env');
      this.secrets = this.getLocalSecrets();
      return this.secrets;
    }

    try {
      console.log(`[Vault] Connecting to Vault at ${this.vaultAddr}...`);
      await this.healthCheck();

      // Fetch secrets from Vault
      // In dev mode, secrets are stored at secret/data/app
      const secretsPath = process.env.VAULT_SECRETS_PATH || 'secret/data/app';

      const response = await fetch(`${this.vaultAddr}/v1/${secretsPath}`, {
        method: 'GET',
        headers: {
          'X-Vault-Token': this.vaultToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If secret path doesn't exist, try to create it with default values
        if (response.status === 404) {
          console.warn(
            `[Vault] Secret path ${secretsPath} not found. Creating with default values...`
          );
          await this.createDefaultSecrets(secretsPath);
          // Retry fetching
          return this.initialize();
        }

        const errorText = await response.text();
        throw new Error(
          `Failed to fetch secrets from Vault: ${response.status} ${response.statusText}. ${errorText}`
        );
      }

      const data = await response.json();
      const secrets = data.data?.data || data.data || {};

      // Validate required secrets
      this.validateSecrets(secrets);

      // Map secrets to our structure
      this.secrets = {
        database: {
          host: secrets.database_host || process.env.POSTGRES_HOST || 'db',
          port: parseInt(secrets.database_port || process.env.POSTGRES_PORT || '5432'),
          user: secrets.database_user || process.env.POSTGRES_USER || 'postgres',
          password: secrets.database_password || process.env.POSTGRES_PASSWORD || '',
          database: secrets.database_name || process.env.POSTGRES_DB || 'sales_financial',
        },
        shopee: {
          apiKey: secrets.shopee_api_key || '',
          apiSecret: secrets.shopee_api_secret || '',
        },
        tiktok: {
          apiKey: secrets.tiktok_api_key || '',
          apiSecret: secrets.tiktok_api_secret || '',
        },
        jwt: {
          secret: secrets.jwt_secret || process.env.AUTH_SECRET || '',
        },
      };

      console.log('[Vault] Successfully fetched secrets from Vault');
      return this.secrets;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('[Vault] CRITICAL: Failed to initialize Vault connection:', errorMessage);
      console.error(
        '[Vault] Application cannot start without access to secrets. Please ensure:'
      );
      console.error('  1. Vault is running and accessible');
      console.error(`  2. VAULT_ADDR is set correctly (current: ${this.vaultAddr})`);
      console.error('  3. VAULT_TOKEN is valid');
      console.error('  4. Network connectivity to Vault is available');
      process.exit(1);
    }
  }

  private getLocalSecrets(): VaultSecrets {
    const url = process.env.DATABASE_URL;
    let db = {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'sales_financial',
    };
    if (url) {
      try {
        const u = new URL(url.replace('postgresql://', 'http://'));
        db = {
          host: u.hostname,
          port: parseInt(u.port || '5432'),
          user: u.username || 'postgres',
          password: u.password || 'postgres',
          database: (u.pathname || '/sales_financial').replace(/^\/+/, '') || 'sales_financial',
        };
      } catch {
        /* keep POSTGRES_* */
      }
    }
    return {
      database: db,
      shopee: { apiKey: process.env.SHOPEE_API_KEY || '', apiSecret: process.env.SHOPEE_API_SECRET || '' },
      tiktok: { apiKey: process.env.TIKTOK_API_KEY || '', apiSecret: process.env.TIKTOK_API_SECRET || '' },
      jwt: { secret: process.env.AUTH_SECRET || 'dev-jwt-secret-change-in-production' },
    };
  }

  /**
   * Health check to verify Vault connectivity
   */
  private async healthCheck(): Promise<void> {
    try {
      const response = await fetch(`${this.vaultAddr}/v1/sys/health`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(
          `Vault health check failed: ${response.status} ${response.statusText}`
        );
      }

      const health = await response.json();
      console.log(`[Vault] Health check passed. Vault initialized: ${health.initialized}`);
    } catch (error) {
      throw new Error(
        `Cannot connect to Vault at ${this.vaultAddr}. Is Vault running?`
      );
    }
  }

  /**
   * Create default secrets in Vault (for development)
   */
  private async createDefaultSecrets(secretsPath: string): Promise<void> {
    const defaultSecrets = {
      database_host: process.env.POSTGRES_HOST || 'db',
      database_port: process.env.POSTGRES_PORT || '5432',
      database_user: process.env.POSTGRES_USER || 'postgres',
      database_password: process.env.POSTGRES_PASSWORD || 'postgres',
      database_name: process.env.POSTGRES_DB || 'sales_financial',
      shopee_api_key: process.env.SHOPEE_API_KEY || 'dev-shopee-key',
      shopee_api_secret: process.env.SHOPEE_API_SECRET || 'dev-shopee-secret',
      tiktok_api_key: process.env.TIKTOK_API_KEY || 'dev-tiktok-key',
      tiktok_api_secret: process.env.TIKTOK_API_SECRET || 'dev-tiktok-secret',
      jwt_secret: process.env.AUTH_SECRET || 'dev-jwt-secret-change-in-production',
    };

    try {
      const response = await fetch(`${this.vaultAddr}/v1/${secretsPath}`, {
        method: 'POST',
        headers: {
          'X-Vault-Token': this.vaultToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: defaultSecrets }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create default secrets: ${response.status} ${response.statusText}. ${errorText}`
        );
      }

      console.log('[Vault] Created default secrets in Vault');
    } catch (error) {
      console.warn(
        '[Vault] Could not create default secrets. Using environment variables as fallback.'
      );
    }
  }

  /**
   * Validate that required secrets are present
   */
  private validateSecrets(secrets: Record<string, unknown>): void {
    const required = [
      'database_user',
      'database_password',
      'database_name',
    ];

    const missing = required.filter((key) => !secrets[key]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required secrets in Vault: ${missing.join(', ')}`
      );
    }
  }

  /**
   * Get cached secrets (must call initialize() first)
   */
  getSecrets(): VaultSecrets {
    if (!this.secrets) {
      throw new Error(
        'Secrets not initialized. Call initialize() first.'
      );
    }
    return this.secrets;
  }

  /**
   * Get database connection string from Vault secrets
   */
  getDatabaseUrl(): string {
    const db = this.getSecrets().database;
    return `postgresql://${db.user}:${db.password}@${db.host}:${db.port}/${db.database}`;
  }
}

// Singleton instance
let vaultClient: VaultClient | null = null;

/**
 * Initialize Vault and fetch secrets
 * Call this at application startup
 */
export async function initializeVault(): Promise<VaultSecrets> {
  if (!vaultClient) {
    vaultClient = new VaultClient();
  }
  return vaultClient.initialize();
}

/**
 * Get Vault secrets (must initialize first)
 */
export function getVaultSecrets(): VaultSecrets {
  if (!vaultClient) {
    throw new Error(
      'Vault not initialized. Call initializeVault() at application startup.'
    );
  }
  return vaultClient.getSecrets();
}

/**
 * Get database URL from Vault
 */
export function getDatabaseUrlFromVault(): string {
  if (!vaultClient) {
    throw new Error(
      'Vault not initialized. Call initializeVault() at application startup.'
    );
  }
  return vaultClient.getDatabaseUrl();
}

export default VaultClient;
