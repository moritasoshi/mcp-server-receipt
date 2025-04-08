# mcp-server-receipt

MCPプロトコル対応のLLMが領収書ファイルを自動整理するためのコンテキストを提供するサーバーです。

このツールは、LLMに対して領収書ファイルの適切な命名規則と格納場所を指示します。LLMは領収書PDFから日付・金額・会社名を抽出し、指定形式（YYYYMMDD_金額_会社名.pdf）でファイルをリネームして保存します。

## Prompts

- **gen-receipt-filename**
    * 添付された領収書ファイルから情報を抽出し、標準化されたファイル名で保管するための指示を提供
    * Arguments:
        * none

## ローカルビルド手順

リポジトリをクローンしてビルドして使用します：

```bash
# リポジトリをクローン
git clone https://github.com/soshi-morita/mcp-server-receipt.git

# ディレクトリに移動
cd mcp-server-receipt

# 依存関係をインストール
npm install

# ビルド
npm run build
```

## 動作の仕組み

1. サーバーを起動すると、LLMに領収書処理の指示を提供します
2. LLMが領収書から情報を抽出し、ファイル名を生成します
3. LLMが指定された出力先にファイルをコピーします

## MCPホスト設定例

```json5
{
  "mcpServers": {
    "mcp-server-receipt": {
      "command": "node",
      "args": [
        "/path/to/mcp-server-receipt/dist/index.js",
        "~/Downloads/receipts", // 入力ディレクトリ
        "~/Documents/Finance/Receipts" // 出力ディレクトリ
      ]
    }
  }
}
```

## Debugging

```bash
node dist/index.js <入力ディレクトリ> <出力ディレクトリ>
```

例：

```bash
node dist/index.js ~/Downloads/receipts ~/Documents/Finance/Receipts
```

## License

MIT
