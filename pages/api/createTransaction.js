import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection, PublicKey, Transaction } from "@solana/web3.js";
import { createTransferCheckedInstruction, getAssociatedTokenAddress, getMint } from "@solana/spl-token";
import BigNumber from "bignumber.js";

const usdcAddress = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

const createTransaction = async (req, res) => {
    try {
        const { buyer, orderID, itemID } = req.body;
        if (!buyer) {
            res.status(400).json({
                message: "Missing buyer address",
            });
        }

        if (!orderID) {
            res.status(400).json({
                message: "Missing order ID",
            });
        }

        // fetch products from crudcrud
        const response = await fetch(`${process.env.CRUDCRUD_URL}/products`);
        const products = await response.json();

        const { price: itemPrice, seller: itemSeller } = products.find((product) => product.id === itemID);

        if (!itemPrice) {
            res.status(404).json({
                message: "Item not found. please check item ID",
            });
        }

        const bigAmount = BigNumber(itemPrice);
        const buyerPublicKey = new PublicKey(buyer);

        const network = WalletAdapterNetwork.Devnet;
        const endpoint = clusterApiUrl(network);
        const connection = new Connection(endpoint);

        const buyerUsdcAddress = await getAssociatedTokenAddress(usdcAddress, buyerPublicKey);
        const sellerUsdcAddress = await getAssociatedTokenAddress(usdcAddress, new PublicKey(itemSeller));
        
        const { blockhash } = await connection.getLatestBlockhash("finalized");

        // This is new, we're getting the mint address of the token we want to transfer
        const usdcMint = await getMint(connection, usdcAddress);

        const tx = new Transaction({
            recentBlockhash: blockhash,
            feePayer: buyerPublicKey,
        });

        // Here we're creating a different type of transfer instruction
        const transferInstruction = createTransferCheckedInstruction(
            buyerUsdcAddress,
            usdcAddress,     // This is the address of the token we want to transfer
            sellerUsdcAddress,
            buyerPublicKey,
            bigAmount.toNumber() * 10 ** (await usdcMint).decimals,
            usdcMint.decimals // The token could have any number of decimals
        );

        // The rest remains the same :)
        transferInstruction.keys.push({
            pubkey: new PublicKey(orderID),
            isSigner: false,
            isWritable: false,
        });

        tx.add(transferInstruction);

        const serializedTransaction = tx.serialize({
            requireAllSignatures: false,
        });

        const base64 = serializedTransaction.toString("base64");

        res.status(200).json({
            transaction: base64,
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({ error: "error creating transaction" });
        return;
    }
};

export default function handler(req, res) {
    if (req.method === "POST") {
        createTransaction(req, res);
    } else {
        res.status(405).end();
    }
}