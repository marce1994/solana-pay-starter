export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            console.log("body is ", req.body)
            
            var response = await fetch(`${process.env.CRUDCRUD_URL}/products`);
            const products = await response.json();
            
            const { name, price, image_url, description, filename, hash, seller } = req.body;

            // Create new product ID based on last product ID
            const maxID = products.reduce((max, product) => Math.max(max, product.id), 0);

            const newProduct = {
                id: maxID + 1,
                name,
                price,
                image_url,
                description,
                filename,
                hash,
                seller
            };

            response = await fetch(`${process.env.CRUDCRUD_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newProduct)
            });

            const data = await response.json();
            
            if (response.status === 201) {
                res.status(200).send({ status: "ok" });
            }
            else {
                res.status(400).send({ error: data.error });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "error adding product" });
            return;
        }
    }
    else {
        res.status(405).send(`Method ${req.method} not allowed`);
    }
}