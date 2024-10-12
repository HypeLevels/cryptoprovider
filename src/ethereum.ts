import { WebSocketProvider, formatEther } from "ethers"
import { TipAPIBodySchema, type TipAPIBody } from "./schemas"

const toEur = async (wei: bigint) => {
    const ether = parseFloat(formatEther(wei))
    const req = new Request(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur`, {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'x-cg-demo-api-key': `${Bun.env.COINGECKOAPI}`
        }
    })
    const resp = await (await fetch(req)).json()
    return ether * resp.ethereum.eur
}

const provider = new WebSocketProvider(`wss://ethereum-sepolia-rpc.publicnode.com`)

provider.on("block", async (blockNumber) => {
    const block = await provider.getBlock(blockNumber)
    for (const txHash of block?.transactions!) {
        const tx = await provider.getTransaction(txHash)
        if (tx?.to == Bun.env.ETHADDRESS) {
            const reqBody: TipAPIBody = {
                user: {
                    username: `${tx?.from.slice(0, 5)}...${tx?.from.slice(-5)}`,
                    email: "crypto@provider.com"
                },
                currency: "EUR",
                imported: true,
                provider: tx?.chainId.toString()!,
                amount: await toEur(tx?.value!)
            }
            try {
                TipAPIBodySchema.parse(reqBody)
            } catch (err) {
                return console.log("Failed parsing requestBody, aborting transaction;");
            }
            const req = new Request(`https://api.streamelements.com/kappa/v2/tips/${Bun.env.ACCOUNTID}`, {
                method: "POST",
                body: JSON.stringify(reqBody),
                headers: {
                    "Accept": "application/json; charset=utf-8, application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Bun.env.JWT}`
                }
            })

            const resp = await fetch(req)
            console.log(resp.ok ? "Successfully triggered donation alert" : "Request failed to send")
        }
    }
})