const { Client } = require("@elastic/enterprise-search");

function create_batches(objects, size) {
    const batches = [];
    for (let i = 0; i < objects.length; i += size) {
        const batch = [];
        for (let j = 0; j < size; j++) {
            if (objects[i + j]) {
                batch.push(objects[i + j]);
            }
        }

        batches.push(batch);
    }

    return batches;
}

async function index_documents(documents) {
    const client = new Client({
        url: process.env.ES_URL,
        auth: {
            token: process.env.ES_TOKEN,
        },
    });

    const batches = create_batches(documents, 50);
    for (const batch of batches) {
        let success = false;
        let start_time = new Date();
        console.log(`Indexing ${batch.length} documents...`);

        while (!success) {
            try {
                const response = await client.app.indexDocuments(
                    {
                        engine_name: process.env.ES_ENGINE,
                        documents: batch,
                    },
                    {
                        requestTimeout: 1000 * 60 * 10,
                    }
                );
                console.log(response);

                success = true;
            } catch (e) {
                console.log(e);
                console.log("Retrying in 10 seconds...");
                await new Promise((resolve) => setTimeout(resolve, 1000 * 10));
            }
        }

        let end_time = new Date();
        let seconds = Math.round((end_time - start_time) / 1000);
        console.log(`Took ${seconds} seconds`);
    }

    console.log("Done");
}

module.exports = {
    create_batches,
    index_documents,
};