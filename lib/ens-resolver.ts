const ENS_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/ensdomains/ens';

interface ENSResolutionResult {
  address: string | null;
  error?: string;
}

export async function resolveENSName(ensName: string): Promise<ENSResolutionResult> {
  if (!ensName.endsWith('.eth')) {
    return { address: null, error: 'Not an ENS name' };
  }

  try {
    const query = {
      query: `
        query($name: String!) {
          domains(where: { name: $name }) {
            name
            id
            resolvedAddress {
              id
            }
          }
        }
      `,
      variables: {
        name: ensName.toLowerCase()
      }
    };

    const response = await fetch(ENS_SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      throw new Error(`Graph API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'GraphQL error');
    }

    const domains = data.data?.domains;

    if (!domains || domains.length === 0) {
      return { address: null, error: 'ENS name not found' };
    }

    const domain = domains[0];
    const address = domain.resolvedAddress?.id;

    if (!address || address === '0x0000000000000000000000000000000000000000') {
      return { address: null, error: 'ENS name not resolved to an address' };
    }

    return { address };
  } catch (error: any) {
    console.error('ENS resolution error:', error);
    return { address: null, error: error.message || 'Failed to resolve ENS name' };
  }
}

export function extractENSNames(text: string): string[] {
  const ensPattern = /\b[a-zA-Z0-9-]+\.eth\b/g;
  const matches = text.match(ensPattern);
  if (!matches) return [];

  const uniqueMatches: string[] = [];
  const seen = new Set<string>();
  for (const match of matches) {
    if (!seen.has(match)) {
      seen.add(match);
      uniqueMatches.push(match);
    }
  }
  return uniqueMatches;
}

export async function replaceENSNamesInText(text: string): Promise<{
  text: string;
  replacements: Array<{ ens: string; address: string }>;
  errors: Array<{ ens: string; error: string }>;
}> {
  const ensNames = extractENSNames(text);

  if (ensNames.length === 0) {
    return { text, replacements: [], errors: [] };
  }

  const replacements: Array<{ ens: string; address: string }> = [];
  const errors: Array<{ ens: string; error: string }> = [];
  let modifiedText = text;

  for (const ensName of ensNames) {
    const result = await resolveENSName(ensName);

    if (result.address) {
      modifiedText = modifiedText.replace(new RegExp(ensName, 'g'), result.address);
      replacements.push({ ens: ensName, address: result.address });
    } else if (result.error) {
      errors.push({ ens: ensName, error: result.error });
    }
  }

  return { text: modifiedText, replacements, errors };
}
