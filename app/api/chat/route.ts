import { NextRequest, NextResponse } from 'next/server';

const BLOCKSCOUT_MCP_URL = 'https://mcp.blockscout.com/v1';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are ChainLens AI, a blockchain data assistant powered by Blockscout MCP. You help users explore blockchain data through natural language conversations.

COMPREHENSIVE BLOCKSCOUT MCP TOOLS:

1. get_chains_list - Get list of all supported blockchain networks
   Parameters: none
   Returns: List of chains with IDs, names, and details

2. get_address_info - Get comprehensive address information
   Parameters: { chain_id: string, address: string }
   Returns: Balance, ENS name, contract status, verification status, proxy info, token details

3. get_address_by_ens_name - Resolve ENS name to Ethereum address
   Parameters: { name: string }
   Returns: resolved_address (ONLY works on Ethereum mainnet)

4. get_transactions_by_address - Get transaction history for an address
   Parameters: { chain_id: string, address: string, age_from?: string, age_to?: string, methods?: string, cursor?: string }
   Returns: Native currency transfers and smart contract interactions (excludes token transfers)

5. get_token_transfers_by_address - Get ERC-20 token transfer history
   Parameters: { chain_id: string, address: string, age_from?: string, age_to?: string, token?: string, cursor?: string }
   Returns: All token transfers to/from address with detailed token metadata

6. get_tokens_by_address - Get ALL token balances for an address
   Parameters: { chain_id: string, address: string, cursor?: string }
   Returns: Complete token portfolio with balances, prices, and metadata

7. nft_tokens_by_address - Get NFT holdings for an address
   Parameters: { chain_id: string, address: string, cursor?: string }
   Returns: NFT collections and individual tokens owned

8. get_transaction_info - Get detailed transaction information
   Parameters: { chain_id: string, transaction_hash: string, include_raw_input?: boolean }
   Returns: Comprehensive tx data with decoded inputs, token transfers, fees

9. get_transaction_logs - Get transaction event logs
   Parameters: { chain_id: string, transaction_hash: string, cursor?: string }
   Returns: Decoded event logs with parameters

10. transaction_summary - Get human-readable transaction summary
    Parameters: { chain_id: string, transaction_hash: string }
    Returns: Natural language description with action type, amounts, addresses

11. get_block_info - Get block information
    Parameters: { chain_id: string, number_or_hash: string, include_transactions?: boolean }
    Returns: Block details including timestamp, gas, fees, transactions

12. get_latest_block - Get the most recent block
    Parameters: { chain_id: string }
    Returns: Latest block number and timestamp

13. lookup_token_by_symbol - Search for tokens by symbol or name
    Parameters: { chain_id: string, symbol: string }
    Returns: Matching token addresses and metadata

14. get_contract_abi - Get smart contract ABI
    Parameters: { chain_id: string, address: string }
    Returns: Contract ABI for function calls and events

15. inspect_contract_code - View verified contract source code
    Parameters: { chain_id: string, address: string, file_name?: string }
    Returns: Contract source code and metadata

16. read_contract - Call a smart contract view function
    Parameters: { chain_id: string, address: string, abi: object, function_name: string, args?: string, block?: string }
    Returns: Decoded function return value

COMMON CHAIN IDs (as strings):
- Ethereum: "1"
- Optimism: "10"
- Base: "8453"
- Arbitrum: "42161"
- Polygon: "137"
- Gnosis: "100"
- Use get_chains_list for the complete list

CONVERSATION GUIDELINES:
- You maintain conversation context and remember what was discussed
- When you need clarification (like which chain), ASK the user naturally
- Reference previous messages in the conversation when relevant
- If user says just "ethereum" or "base", understand it's answering your previous question
- Be conversational and helpful, not robotic

IMPORTANT RULES:
- ALL chain_id values MUST be strings, not numbers
- For ENS names (.eth), first call get_address_by_ens_name (no chain_id needed)
- ENS resolution returns "resolved_address" field in data object
- For token balances, use get_tokens_by_address which returns ALL tokens
- For token transfers history, use get_token_transfers_by_address (more detailed than transactions)
- For specific token queries, filter results or use lookup_token_by_symbol first
- dates in age_from/age_to use ISO format: "2025-10-26T00:00:00.00Z"
- If pagination exists in response, mention "more data available"
- Always explain what you found in clear, simple language

RESPONSE FORMAT:
Respond with JSON:
{
  "tool": "tool_name",
  "params": { "chain_id": "1", ... },
  "explanation": "What you're looking up"
}

For clarification:
{
  "clarification_needed": true,
  "message": "Your question to the user"
}

For ENS resolution first:
{
  "needs_resolution": true,
  "resolution_tool": "get_address_by_ens_name",
  "resolution_params": { "name": "vitalik.eth" },
  "next_tool": "get_tokens_by_address",
  "next_params": { "chain_id": "1" },
  "explanation": "Resolving ENS name, then fetching tokens"
}`;

async function callBlockscoutMCP(tool: string, params: Record<string, any>) {
  try {
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    }

    const url = `${BLOCKSCOUT_MCP_URL}/${tool}?${queryParams.toString()}`;
    console.log('Blockscout MCP:', tool, params);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Blockscout error:', response.status, errorText);
      throw new Error(`Blockscout error ${response.status}: ${errorText.substring(0, 200)}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Blockscout MCP error:', error);
    throw new Error(`Failed to fetch from Blockscout: ${error.message}`);
  }
}

async function callOpenAI(messages: Array<{ role: string; content: string }>) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI error: ${error.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function formatResponse(data: any, tool: string): string {
  if (tool === 'get_token_transfers_by_address') {
    const items = data.data || [];
    if (items.length === 0) return 'No token transfers found.';

    let response = 'Recent Token Transfers:\n\n';
    items.slice(0, 8).forEach((transfer: any, i: number) => {
      const token = transfer.token;
      const decimals = parseInt(token.decimals) || 18;
      const amount = parseFloat(transfer.total.value) / Math.pow(10, decimals);

      response += `${i + 1}. ${token.symbol || 'Unknown Token'}\n`;
      response += `   Amount: ${amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${token.symbol}\n`;
      if (token.exchange_rate && parseFloat(token.exchange_rate) > 0) {
        const usdValue = amount * parseFloat(token.exchange_rate);
        response += `   Value: $${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}\n`;
      }
      response += `   From: ${transfer.from_address.substring(0, 10)}...\n`;
      response += `   To: ${transfer.to_address.substring(0, 10)}...\n`;
      if (transfer.method) response += `   Method: ${transfer.method}\n`;
      if (transfer.timestamp) {
        const date = new Date(transfer.timestamp);
        response += `   Time: ${date.toLocaleString()}\n`;
      }
      response += `\n`;
    });

    if (items.length > 8) response += `Showing 8 of ${items.length} transfers\n`;
    if (data.pagination?.next_call) response += `\nMore transfers available - ask me to show more!`;
    return response;
  }

  if (tool === 'get_tokens_by_address') {
    const items = data.data || data.items || [];
    if (items.length === 0) return 'No tokens found for this address.';

    let response = 'Token Holdings:\n\n';
    let totalValue = 0;

    items.slice(0, 15).forEach((item: any, i: number) => {
      const token = item.token || item;
      const value = item.value || '0';
      const decimals = token.decimals || 18;
      const balance = parseFloat(value) / Math.pow(10, decimals);

      if (balance > 0.000001) {
        response += `${i + 1}. ${token.name || 'Unknown'} (${token.symbol || 'N/A'})\n`;
        response += `   Balance: ${balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}\n`;
        if (token.exchange_rate && parseFloat(token.exchange_rate) > 0) {
          const usdValue = balance * parseFloat(token.exchange_rate);
          totalValue += usdValue;
          response += `   Value: $${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}\n`;
        }
        response += `\n`;
      }
    });

    if (totalValue > 0) {
      response += `Total Portfolio Value: $${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}\n\n`;
    }

    if (items.length > 15) response += `Showing top 15 of ${items.length} tokens\n`;
    return response;
  }

  if (tool === 'get_transactions_by_address') {
    const items = data.data || data.items || [];
    if (items.length === 0) return 'No transactions found.';

    let response = 'Recent Transactions:\n\n';
    items.slice(0, 5).forEach((tx: any, i: number) => {
      response += `${i + 1}. Tx ${tx.hash?.substring(0, 10)}...\n`;
      response += `   From: ${tx.from_address?.substring(0, 10)}...\n`;
      response += `   To: ${tx.to_address?.substring(0, 10)}...\n`;
      response += `   Value: ${(parseFloat(tx.value || 0) / 1e18).toFixed(6)} ETH\n`;
      if (tx.method) response += `   Method: ${tx.method}\n`;
      if (tx.timestamp) response += `   Time: ${new Date(tx.timestamp).toLocaleString()}\n`;
      response += `\n`;
    });

    if (items.length > 5) response += `Showing 5 of ${items.length} transactions\n`;
    if (data.pagination?.next_call) response += `\nMore transactions available - ask me to show more!`;
    return response;
  }

  if (tool === 'get_address_info') {
    const d = data.data || data;
    let response = 'Address Information:\n\n';
    if (d.name) response += `Name: ${d.name}\n`;
    if (d.ens_domain_name) response += `ENS: ${d.ens_domain_name}\n`;
    if (d.coin_balance !== undefined) {
      const ethBalance = parseFloat(d.coin_balance) / 1e18;
      response += `ETH Balance: ${ethBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })} ETH\n`;
    }
    response += `Type: ${d.is_contract ? 'Smart Contract' : 'Wallet (EOA)'}\n`;
    if (d.is_verified) response += `Verified: Yes\n`;
    if (d.transactions_count !== undefined) response += `Total Transactions: ${d.transactions_count.toLocaleString()}\n`;
    return response;
  }

  if (tool === 'transaction_summary') {
    const summaryArray = data.data?.summary || [];
    if (summaryArray.length === 0) return 'Transaction summary not available for this transaction.';

    let response = 'Transaction Summary:\n\n';
    summaryArray.forEach((item: any) => {
      const template = item.summary_template;
      const vars = item.summary_template_variables || {};

      let summary = template;
      for (const [key, value] of Object.entries(vars)) {
        const varData: any = value;
        let replacement = '';

        if (varData.type === 'address') {
          const addr = varData.value?.hash || varData.value;
          replacement = varData.value?.name || varData.value?.ens_domain_name || `${addr?.substring(0, 10)}...` || 'Unknown';
        } else if (varData.type === 'currency') {
          const rawValue = parseFloat(varData.value?.toString() || '0');
          replacement = rawValue.toFixed(8);
        } else if (varData.type === 'string') {
          replacement = varData.value?.toString() || '';
        } else {
          replacement = varData.value?.toString() || '';
        }

        summary = summary.replace(`{${key}}`, replacement);
      }

      response += `${summary}\n`;
    });

    return response;
  }

  if (tool === 'get_transaction_info') {
    const tx = data.data || data;
    let response = '**Transaction Details:**\n\n';
    if (tx.hash) response += `**Hash:** ${tx.hash}\n`;
    if (tx.from?.hash) response += `**From:** ${tx.from.hash}\n`;
    if (tx.to?.hash) response += `**To:** ${tx.to.hash}\n`;
    if (tx.value) response += `**Value:** ${parseFloat(tx.value) / 1e18} ETH\n`;
    if (tx.gas_used) response += `**Gas Used:** ${tx.gas_used}\n`;
    if (tx.status) response += `**Status:** ${tx.status}\n`;
    if (tx.block) response += `**Block:** ${tx.block}\n`;
    if (tx.timestamp) response += `**Time:** ${new Date(tx.timestamp).toLocaleString()}\n`;

    if (tx.token_transfers && tx.token_transfers.length > 0) {
      response += `\n**Token Transfers (${tx.token_transfers.length}):**\n`;
      tx.token_transfers.slice(0, 5).forEach((transfer: any, i: number) => {
        const token = transfer.token;
        const amount = parseFloat(transfer.total?.value || 0) / Math.pow(10, token.decimals || 18);
        response += `${i + 1}. ${amount.toFixed(6)} ${token.symbol}\n`;
      });
    }

    return response;
  }

  if (tool === 'get_latest_block') {
    const block = data.data || data;
    let response = 'Latest Block Information:\n\n';
    if (block.height) response += `Block Number: ${block.height.toLocaleString()}\n`;
    if (block.timestamp) response += `Timestamp: ${new Date(block.timestamp).toLocaleString()}\n`;
    return response;
  }

  if (tool === 'get_chains_list') {
    const chains = data.data || data.items || [];
    let response = 'Supported Blockchains:\n\n';
    chains.slice(0, 20).forEach((chain: any) => {
      response += `- ${chain.name} (ID: ${chain.id})\n`;
    });
    return response;
  }

  if (tool === 'nft_tokens_by_address') {
    const items = data.data || data.items || [];
    if (items.length === 0) return 'No NFTs found.';
    let response = 'NFT Holdings:\n\n';
    items.slice(0, 10).forEach((nft: any, i: number) => {
      const token = nft.token || nft;
      response += `${i + 1}. ${token.name || 'Unknown NFT'}\n`;
      response += `   Collection: ${token.symbol || 'N/A'}\n`;
      response += `   Type: ${token.type || 'NFT'}\n\n`;
    });
    if (items.length > 10) response += `Showing 10 of ${items.length} NFTs\n`;
    return response;
  }

  return JSON.stringify(data, null, 2);
}

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const conversationMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    const queryAnalysis = await callOpenAI(conversationMessages);

    let parsedAnalysis;
    try {
      const jsonMatch = queryAnalysis.match(/\{[\s\S]*\}/);
      parsedAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(queryAnalysis);
    } catch (e) {
      return NextResponse.json({
        response: queryAnalysis,
        data: null,
        type: 'text',
      });
    }

    if (parsedAnalysis.clarification_needed) {
      return NextResponse.json({
        response: parsedAnalysis.message,
        data: null,
        type: 'clarification',
      });
    }

    let finalTool = parsedAnalysis.tool;
    let finalParams = parsedAnalysis.params;

    if (parsedAnalysis.needs_resolution && parsedAnalysis.resolution_tool === 'get_address_by_ens_name') {
      try {
        const resolutionResult = await callBlockscoutMCP(
          'get_address_by_ens_name',
          parsedAnalysis.resolution_params
        );

        if (resolutionResult.data?.resolved_address) {
          finalParams = {
            ...parsedAnalysis.next_params,
            address: resolutionResult.data.resolved_address
          };
          finalTool = parsedAnalysis.next_tool;
        } else {
          return NextResponse.json({
            response: `Could not resolve ENS name "${parsedAnalysis.resolution_params.name}". Please provide the Ethereum address directly.`,
            data: null,
            type: 'error',
          });
        }
      } catch (error: any) {
        const ensName = parsedAnalysis.resolution_params.name;
        return NextResponse.json({
          response: `ENS resolution service is currently unavailable. Common addresses:\n\nvitalik.eth = 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\n\nPlease provide the Ethereum address directly, or try again later.`,
          data: null,
          type: 'error',
        });
      }
    }

    const mcpResult = await callBlockscoutMCP(finalTool, finalParams);
    const formattedResponse = formatResponse(mcpResult, finalTool);

    return NextResponse.json({
      response: formattedResponse,
      data: mcpResult.data || mcpResult,
      type: finalTool,
      tool: finalTool,
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
