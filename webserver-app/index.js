const dgraph = require("dgraph-js");
const express = require('express');
const fs = require("fs");
const grpc = require("grpc");

// Creating express server
const app = express();

// Web server port
const port = process.env.PORT || "8888";

// Creating dgraph client
const dgraph_address = process.env.DGRAPH_SERVER || "localhost:9080";
const clientStub = new dgraph.DgraphClientStub(dgraph_address, grpc.credentials.createInsecure());
const dgraphClient = new dgraph.DgraphClient(clientStub);

app.use(express.static('public'));

const sample_json = fs.readFileSync('./sample.json');
const schema_data = fs.readFileSync('./schema.gql', {encoding: 'utf8'});

// Clear Data - clears all data.
app.get('/clear', (req, res) => {
    dropAll().then(() => {
        console.log("\nDONE!");
        res.json({
            status: "success",
            response: "Successfully cleared all data"
        })
    }).catch((e) => {
        console.log("ERROR: ", e);
        res.json({
            status: "error",
            response: "Error while clearing data",
            error: e
        })
    });
});

// Set Schema - sets Dgraph schema.
app.get('/set-schema', (req, res) => {
    setSchema().then(() => {
        console.log("\nDONE!");
        res.json({
            status: "success",
            response: "Successfully set Dgraph schema"
        })
    }).catch((e) => {
        console.log("ERROR: ", e);
        res.json({
            status: "error",
            response: "Error while setting Dgraph schema",
            error: e
        })
    });
});

// Load Data - loads data from the file.
app.get('/load-data', (req, res) => {
    loadData().then(() => {
        console.log("\nSuccessfully loaded the sample data");
        res.json({
            status: "success",
            response: "Successfully loaded the sample data"
        })
    }).catch((e) => {
        console.log("ERROR: ", e);
        res.json({
            status: "error",
            response: "Error occured while loading data",
            error: e
        })
    });
});

// Create Data - loads data from the file.
app.get('/create-data', (req, res) => {
    createData().then(() => {
        console.log("\nSuccessfully created the sample data");
        res.json({
            status: "success",
            response: "Successfully created the sample data"
        })
    }).catch((e) => {
        console.log("ERROR: ", e);
        res.json({
            status: "error",
            response: "Error occured while creating sample data",
            error: e
        })
    });
});

// Query Data - queries data in Dgraph.
app.use('/query', async (req, res) => {
        var responseData = await queryData();
        res.json({
            status: "success",
            response: "Success while querying the sample data",
            data: responseData
        })
});

app.use('/', (req, res) => res.json({
    status: "success",
    response: "server up"
}));

// Clearing data, setting schema, and loading sample data.
async function loadData() {
    console.log(`dropAll()`);
    await dropAll();
    console.log(`setSchema()`);
    await setSchema();
    console.log(`createData()`);
    await createData();
    console.log(`end of loadData`);
}

// Drop All - discard all data and start from a clean slate.
async function dropAll() {
    const op = new dgraph.Operation();
    op.setDropAll(true);
    await dgraphClient.alter(op);
}

// Set schema.
async function setSchema(schema) {
    if(typeof(schema) === 'undefined') {
        schema = schema_data;
    }
    const op = new dgraph.Operation();
    op.setSchema(schema);
    await dgraphClient.alter(op);
}

// Create data using JSON.
async function createData(JSONdata) {
    // Create a new transaction.
    const txn = dgraphClient.newTxn();
    try {
        // If JSONdata is undefined then pick the sample data from file.
        if(typeof(JSONdata) === 'undefined') {
            JSONdata = sample_json;
        }

        // Run mutation.
        const mu = new dgraph.Mutation();
        mu.setSetJson(JSONdata);
        const assigned = await txn.mutate(mu);

        // Commit transaction.
        await txn.commit();

        // Get list of all nodes created with blank nodes and uids.
        console.log("All created nodes (map from blank node names to uids):");
        assigned.getUidsMap().forEach((uid, key) => console.log(`${key} => ${uid}`));
        console.log();
    } finally {
        // Clean up. Calling this after txn.commit() is a no-op
        // and hence safe.
        await txn.discard();
    }
}

// Query for data.
async function queryData(query) {
    if(typeof(query) === 'undefined') {
        query = `{
            all(func: has(company.name)) {
                  uid
                  company.name
                  location
                  company
                      image_url
                  products { expand(_all_) }
              }
          }`;
    }
    const res = await dgraphClient.newTxn().query(query);
    return res.getJson();
}

// listen for requests :)
const listener = app.listen(port, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
