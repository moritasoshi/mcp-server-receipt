#!/usr/bin/env node

import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import {GetPromptRequestSchema, ListPromptsRequestSchema, Prompt} from "@modelcontextprotocol/sdk/types.js";
import path from "path"
import os from "os";

// Command line argument parsing
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error("Usage: mcp-server-receipt <allowed-directory> [additional-directories...]");
    process.exit(1);
}

// Normalize all paths consistently
function normalizePath(p: string): string {
    return path.normalize(p);
}

function expandHome(filepath: string): string {
    if (filepath.startsWith('~/') || filepath === '~') {
        return path.join(os.homedir(), filepath.slice(1));
    }
    return filepath;
}

const directories = args
    .map(dir => normalizePath(path.resolve(expandHome(dir))))
;

const PROMPTS: Prompt = {
    "gen-receipt-filename": {
        name: "gen-receipt-filename",
        description: "Generate a receipt filename according to specific naming conventions.",
    },
};

const server = new Server(
    {
        name: "mcp-server-receipt",
        version: "0.1.0",
    },
    {
        capabilities: {
            tools: {},
            prompts: {},
        },
    },
);

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    // List all available prompts
    return {
        prompts: Object.values(PROMPTS)
    };
});

// Handle prompt requests
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const prompt = PROMPTS[request.params.name];
    if (!prompt) {
        throw new Error(`Prompt not found: ${request.params.name}`);
    }

    if (request.params.name === "gen-receipt-filename") {
        const inputPath = directories[0];
        const outputPath = directories[1];
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `
特定の命名規則に従って領収書のファイル名を生成します。
以下の手順に従ってください：
1. ユーザーにより添付されたPDF形式の領収書ファイルの内容を取得してください。
2. 以下の情報を抽出してください。
    - 領収日
        - 実際に金銭のやり取りが行われた日付. 支払日, 引き落とし日, クレジットカードの請求日など.
    - 金額
    - 会社名
3. 抽出した情報を元に、以下の命名規則に従ってファイル名を生成してください。
    - 命名規則: 領収日_金額_会社名.pdf
        - 例 20250401_580円_スターバックス.pdf
`
                    }
                },
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `
次に、生成したファイル名を利用してファイル名の変更およびファイル移動を実施します
以下の手順に従ってください：
1. 生成したファイル名が命名規則に則っているか再度確認してください
2. ファイル移動を実施してください
    - 添付されたファイルは ${inputPath} 配下に存在します
    - 移動先は ${outputPath} です
    - 単純な移動ではなくファイルコピーにより移動を実現してください（元のファイルは残してください）
    - mcp-server-commands の run_command を利用して実施してください
3. ファイル名を変更してください
    - ファイル名が完全に重複した場合は、末尾に連番を追加して区別してください（例：領収日_金額_会社名_001.pdf）
      - 領収日、金額、会社名の3項目全てが重複した場合にのみ、この処理を実施してください
    - mcp-server-commands の run_command を利用して実施してください
`
                    }
                }
            ]
        };
    }

    throw new Error("Prompt implementation not found");
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("mcp-server-receipt running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
