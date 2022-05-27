export default async function handler(req, res) {
    // If get request
    if (req.method === "GET") {
        const response = await fetch(`${process.env.CRUDCRUD_URL}/products`);
        const products = await response.json();

        console.log(response, products);

        // Create a copy of products without the hashes and filenames
        const productsNoHashes = products.map((product) => {

            const { hash, filename, ...rest } = product;
            return rest;
        });

        res.status(200).json(productsNoHashes);
    }
    else {
        res.status(405).send(`Method ${req.method} not allowed`);
    }
}