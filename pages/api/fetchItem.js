export default async function handler(req, res) {
    if (req.method === "POST") {
        const response = await fetch(`${process.env.CRUDCRUD_URL}/products`);
        const products = await response.json();

        const { itemID } = req.body;

        if (!itemID) {
            res.status(400).send('Missing itemID');
        }

        for (let i = 0; i < products.length; i++) {
            let found = false;
            if (products[i].id === itemID) {
                const { hash, filename } = products[i];
                found = true;
                res.status(200).send({ hash, filename });
                break;
            }
            if (i === products.length - 1 && !found) {
                res.status(404).send('Item not found');
            }
        }
    }
    else {
        res.status(405).send(`Method ${req.method} not allowed`);
    }
}