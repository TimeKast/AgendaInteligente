/**
 * Neon Branch Utilities
 *
 * Creates and deletes temporary Neon database branches for E2E testing.
 * Uses Neon API v2: https://api-docs.neon.tech/reference/getting-started
 */

const NEON_API_BASE = 'https://console.neon.tech/api/v2';
const E2E_BRANCH_PREFIX = 'e2e-';
/** Minimum age (ms) before a branch is considered zombie. Prevents killing concurrent runs. */
const ZOMBIE_AGE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

interface NeonConfig {
  apiKey: string;
  projectId: string;
}

interface CreateBranchResponse {
  branchId: string;
  connectionUri: string;
  branchName: string;
}

function getConfig(): NeonConfig {
  const apiKey = process.env.NEON_API_KEY;
  const projectId = process.env.NEON_PROJECT_ID;

  if (!apiKey || !projectId) {
    console.error('\n❌ Missing Neon credentials for E2E testing\n');
    console.error('Required environment variables:');
    console.error(
      '  NEON_API_KEY    - Get from: https://console.neon.tech → Account Settings → API Keys'
    );
    console.error(
      '  NEON_PROJECT_ID - Get from: https://console.neon.tech → Project Settings → General\n'
    );
    console.error('Setup options:');
    console.error('  1. Run: pnpm setup:e2e (interactive setup)');
    console.error('  2. Add manually to .env.local\n');
    process.exit(1);
  }

  return { apiKey, projectId };
}

/**
 * Creates a temporary Neon branch for E2E testing.
 * Branch inherits schema and data from the main branch.
 */
export async function createE2EBranch(): Promise<CreateBranchResponse> {
  const { apiKey, projectId } = getConfig();
  const branchName = `${E2E_BRANCH_PREFIX}${Date.now()}`;

  console.log(`\n🌿 Creating Neon branch: ${branchName}`);

  const response = await fetch(`${NEON_API_BASE}/projects/${projectId}/branches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      branch: {
        name: branchName,
      },
      endpoints: [
        {
          type: 'read_write',
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`\n❌ Failed to create Neon branch: ${response.status}`);
    console.error(error);
    process.exit(1);
  }

  const data = await response.json();

  // Extract connection URI from response
  const connectionUri = data.connection_uris?.[0]?.connection_uri;
  const branchId = data.branch?.id;
  const endpointId = data.endpoints?.[0]?.id;

  if (!connectionUri || !branchId) {
    console.error('\n❌ Invalid response from Neon API');
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log(`   ✓ Branch created: ${branchId}`);

  // Wait for endpoint to be active (Neon can take a few seconds to spin up)
  if (endpointId) {
    console.log('   ⏳ Waiting for endpoint to be ready...');
    await waitForEndpoint(apiKey, projectId, endpointId);
    console.log('   ✓ Endpoint ready');
  }

  // Give it a bit more time for the connection to stabilize
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    branchId,
    connectionUri,
    branchName,
  };
}

/**
 * Waits for a Neon endpoint to be in active state
 */
async function waitForEndpoint(
  apiKey: string,
  projectId: string,
  endpointId: string,
  maxWaitMs = 60000
): Promise<void> {
  const start = Date.now();
  const checkInterval = 2000;

  while (Date.now() - start < maxWaitMs) {
    const response = await fetch(`${NEON_API_BASE}/projects/${projectId}/endpoints/${endpointId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const state = data.endpoint?.current_state;

      if (state === 'active') {
        return;
      }

      // idle is also acceptable - it will activate on first connection
      if (state === 'idle') {
        return;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  console.warn('   ⚠️  Endpoint may not be fully ready, proceeding anyway...');
}

/**
 * Deletes a Neon branch.
 */
export async function deleteE2EBranch(branchId: string): Promise<void> {
  const { apiKey, projectId } = getConfig();

  console.log(`\n🧹 Deleting Neon branch: ${branchId}`);

  const response = await fetch(`${NEON_API_BASE}/projects/${projectId}/branches/${branchId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.warn(`   ⚠️  Failed to delete branch: ${response.status}`);
    console.warn(`   Branch will auto-expire. Manual delete: Neon Console → Branches`);
    console.warn(error);
    return;
  }

  console.log(`   ✓ Branch deleted`);
}

/**
 * Validates that Neon credentials are configured.
 * Call this early to fail fast with helpful error message.
 */
export function validateNeonCredentials(): void {
  getConfig(); // Will exit if missing
  console.log('   ✓ Neon credentials validated');
}

/**
 * Detects and deletes zombie E2E branches from previous failed runs.
 *
 * A zombie branch is any branch matching the `e2e-*` naming pattern
 * that is older than ZOMBIE_AGE_THRESHOLD_MS. This prevents cleaning up
 * a branch that belongs to a concurrent E2E run.
 *
 * @returns Number of zombie branches deleted
 */
export async function cleanupZombieBranches(): Promise<number> {
  const { apiKey, projectId } = getConfig();

  // List all branches in the project
  const response = await fetch(`${NEON_API_BASE}/projects/${projectId}/branches`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    console.warn('   ⚠️  Could not list branches for zombie cleanup');
    return 0;
  }

  const data = await response.json();
  const branches: Array<{ id: string; name: string; created_at: string }> = data.branches ?? [];

  // Filter: e2e-* prefix + older than threshold
  const now = Date.now();
  const zombies = branches.filter((b) => {
    if (!b.name.startsWith(E2E_BRANCH_PREFIX)) return false;
    const createdAt = new Date(b.created_at).getTime();
    return now - createdAt > ZOMBIE_AGE_THRESHOLD_MS;
  });

  if (zombies.length === 0) return 0;

  console.log(`   🧟 Found ${zombies.length} zombie branch(es):`);

  let deleted = 0;
  for (const zombie of zombies) {
    const ageMin = Math.round((now - new Date(zombie.created_at).getTime()) / 60000);
    console.log(`      - ${zombie.name} (${ageMin}min old)`);
    try {
      const delResponse = await fetch(
        `${NEON_API_BASE}/projects/${projectId}/branches/${zombie.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json',
          },
        }
      );
      if (delResponse.ok) {
        deleted++;
      } else {
        console.warn(`      ⚠️  Failed to delete ${zombie.name}: ${delResponse.status}`);
      }
    } catch {
      console.warn(`      ⚠️  Error deleting ${zombie.name}`);
    }
  }

  console.log(`   ✓ Cleaned up ${deleted}/${zombies.length} zombie branch(es)`);
  return deleted;
}
