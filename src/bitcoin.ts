import { TipAPIBodySchema, type TipAPIBody } from "./schemas"

const toEur = async (satoshi: string) => {
    const bitcoin = parseFloat(satoshi)/100000000
    const req = new Request(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur`, {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'x-cg-demo-api-key': `${Bun.env.COINGECKOAPI}`
        }
    })
    const resp = await (await fetch(req)).json()
    return bitcoin * resp.bitcoin.eur
}

const socket = new WebSocket("wss://ws.blockchain.info/inv")

socket.addEventListener("message", async event => {
    const resp = await JSON.parse(event.data)
    for (const recipient of resp.x.out) {
        if (!recipient.addr) continue;
        if (recipient.addr == Bun.env.BITCOINADDRESS) {
            const reqBody: TipAPIBody = {
                user: {
                    username: `${recipient.addr.slice(0, 5)}...${recipient.addr.slice(-5)}`,
                    email: "crypto@provider.com"
                },
                currency: "EUR",
                imported: true,
                provider: "bitcoin",
                amount: await toEur(recipient.value)
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
});

socket.addEventListener("open", event => {
    socket.send(JSON.stringify({"op": "unconfirmed_sub"}))
});