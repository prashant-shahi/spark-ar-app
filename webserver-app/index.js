const bodyParser = require('body-parser')
const dgraph = require("dgraph-js");
const express = require('express');
const fs = require("fs");
const grpc = require("grpc");
const http = require("https");
const request = require('request');

// Creating express server
const app = express();

// Web server port
const port = process.env.PORT || "8888";
const msg91authkey = process.env.MSG91AUTHKEY || null;

// Creating dgraph client
const dgraph_address = process.env.DGRAPH_SERVER || "localhost:9080";
const clientStub = new dgraph.DgraphClientStub(dgraph_address, grpc.credentials.createInsecure());
const dgraphClient = new dgraph.DgraphClient(clientStub);

app.use(express.static('public'));
app.use(bodyParser.json())

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

// Query All Companies - list all companies.
app.use('/get-companies', async (req, res) => {
    var query = `{
        all(func: has(company.name)) {
            uid
            company.name
            image_url
        }
    }`;
    var responseData = await queryData(query);
    res.json({
        status: "success",
        response: "Success while fetching all companies",
        data: responseData
    })
});

// Query All Products - list all products.
app.use('/get-products', async (req, res) => {
    var body = req.body;
    if(!body.hasOwnProperty("uid") && !body.hasOwnProperty("name")) {
        res.status(400)
        res.json({
            status: "error",
            response: "Error occured while getting products..",
            error: new Error('Unable to get products list. This endpoint requires uid or name attributes passed in request body.')
        })
    }
    if(body.hasOwnProperty("uid")) {
        var company_uid = body["uid"];
        var vars = { "$company_uid": company_uid };
        var query = `query querywithvars($company_uid: string) {
            all(func: uid($company_uid)) {
                uid
                company.name
                location
                company
                image_url
                products (orderasc: product.name) {
                    uid
                    product.name
                    price
                    description
                    image_url
                }
            }
        }`;
        var resp = `uid as ${company_uid}`;
    } else if(body.hasOwnProperty("name")) {
        var company_name = body["name"];
        var vars = { "$company_name": company_name };
        var query = `query querywithvars($company_name: string) {
            all(func: eq(company.name, $company_name)) {
                uid
                company.name
                location
                company
                image_url
                products (orderasc: product.name) {
                    uid
                    product.name
                    price
                    description
                    image_url
                }
            }
        }`;
        var resp = `company name as ${company_name}`;
    }

    var responseData = await queryData(query, vars);
    res.json({
        status: "success",
        response: `Success while fetching all products of the company with ${resp}.`,
        data: responseData
    })
});

// Query All Products of a Company - list all companies.
app.use('/get-product', async (req, res) => {
    var body = req.body;
    if(!body.hasOwnProperty("uid") && !body.hasOwnProperty("name")) {
        res.status(400)
        res.json({
            status: "error",
            response: "Error occured while fetching the product node",
            error: new Error('Unable to get product node. This endpoint requires uid or name attributes passed in request body.')
        })
    }
    if(body.hasOwnProperty("uid")) {
        var product_uid = body["uid"];
        var vars = { "$product_uid": product_uid };
        var query = `query querywithvars($product_uid: string) {
            all(func: uid($product_uid), orderasc: company.name) {
                uid
                product.name
                price
                description
                image_url
            }
        }`;
        var resp = `uid as ${product_uid}`;
    } else if(body.hasOwnProperty("name")) {
        var product_name = body["name"];
        var vars = { "$product_name": product_name };
        var query = `query querywithvars($product_name: string) {
            all(func: eq(product.name, $product_name, orderasc: company.name)) {
                uid
                product.name
                price
                description
                image_url
            }
        }`;
        var resp = `product name as ${product_name}`;
    }

    var responseData = await queryData(query, vars);
    res.json({
        status: "success",
        response: `Success while fetching the product node with ${resp}.`,
        data: responseData
    })
});

app.use('/send-sms', (req, res) => {
    var body = req.body;
    // if(!body.hasOwnProperty("authkey") || body["authkey"]!=msg91authkey) {
    //     res.status(401)
    //     res.json({
    //         status: "error",
    //         response: "Error: Unauthorized access. Try again with valid authentication key.",
    //         error: new Error('Unauthorized access.')
    //     })
    // }
    // if(!body.hasOwnProperty("message") || !body.hasOwnProperty("receiver")) {
    //     res.status(400)
    //     res.json({
    //         status: "error",
    //         response: "Error: message and/or receiver must be passed as well.",
    //         error: new Error('Message and/or Receiver is missing.')
    //     })
    // }
    //var message = body["message"];

    // if(!body.hasOwnProperty("message") || !body.hasOwnProperty("receiver")) {
    //     res.status(400)
    //     res.json({
    //         status: "error",
    //         response: "Error: message and/or receiver must be passed as well.",
    //         error: new Error('Message and/or Receiver is missing.')
    //     })
    // }

    var message = `Hey Folks! Wondering what's trending?\nBe sure to check out the link below for an eye-candy surprise: \n\n`+fetchSparkVRLink();
    var receiver = "7760579605";
    //var receiver = "9740210236";
    //var receiver = "8880517895";
    var options = {
        "method": "POST",
        "hostname": "api.msg91.com",
        "port": null,
        "path": "/api/v2/sendsms?country=91",
        "headers": {
          "authkey": msg91authkey,
          "content-type": "application/json"
        }
      };

    var request = http.request(options, function (response) {
        var chunks = [];
        response.on("data", function (chunk) {
            chunks.push(chunk);
        });
        response.on("end", function () {
            var body = Buffer.concat(chunks);
            console.log(body.toString());
            if(body["type"]!="success") {
                res.status = 500;
                res.json({
                    status: "error",
                    response: "Error while sending sms to "+receiver.toString(),
                    e: body.toString()
                })
            } else {
                res.json({
                    status: "success",
                    response: "Successfully sent sms to "+receiver.toString(),
                    data: body.toString()
                })
            }
        });
    });

    request.on("error", function (e) {
        console.log("ERROR: ", e);
        res.status(500)
        res.json({
            status: "error",
            response: "Error while sending data.",
            error: e
        })
    });

    request.write(JSON.stringify({ sender: 'ITACHI',
    route: '4',
    country: '91',
    sms: [{
        message: message,
        to: [receiver]
    }]
    }));
    request.end();
});

app.use('/send-whatsapp', (req, res) => {
    sendWhatsAppMsg().then(()=>{
        res.json({
            status: "success",
            response: "Successfully sent message to the whatsapp number",
        })
    }).catch((e)=>{
        console.log("Error: ",e);
        res.status(500)
        res.json({
            status: "error",
            response: "Error while sending message to the whatsapp number",
            error: e
        })
    });    
});

app.use('/', (req, res) => res.json({
    status: "success",
    response: "server up"
}));

var vr_url_counter = 0;

function fetchSparkVRLink() {
    var urls=["https://www.facebook.com/fbcameraeffects/testit/358025891811326/MWUxMTkzMjZkOTJlMzhkYjQyMGVhMWI4OTcyZWJhYTE=/", 
        "https://www.facebook.com/fbcameraeffects/testit/365467284392204/ZmFhMWIwYTZiM2MxMTViODE2NmM3MTRkZDIxZjNmZGE=/", 
        "https://www.facebook.com/fbcameraeffects/testit/358025891811326/MWUxMTkzMjZkOTJlMzhkYjQyMGVhMWI4OTcyZWJhYTE=/", 
        "https://www.facebook.com/fbcameraeffects/testit/365467284392204/ZmFhMWIwYTZiM2MxMTViODE2NmM3MTRkZDIxZjNmZGE=/"]

    if(vr_url_counter >= urls.length)  {
        vr_url_counter = 0;
    }
    return urls[vr_url_counter++];
}

// Sending whatsapp message.
async function sendWhatsAppMsg() {
    // URL for request POST /message
    var url = 'https://eu52.chat-api.com/instance61302/message?token=nlgi3t0coxe6imrq';
    var receiver = "+917760579605";
    //var receiver = "+919740210236";
    var message = `Hey Folks! Wondering what's trending?\n\nBe sure to check out the link below for an eye-candy surprise: \n\n`+fetchSparkVRLink();
    var data = {
        phone: receiver, // Receivers phone
        body: message, // Message
    };
    // Send a request
    req = request({
        url: url,
        method: "POST",
        json: data
    });
}

// Clearing data, setting schema, and loading sample data.
async function loadData() {
    console.log(`dropAll()`);
    await dropAll();
    console.log(`setSchema()`);
    await setSchema();
    console.log(`createData()`);
    await createData()
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
async function queryData(query, vars) {
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
    if(typeof(vars) === 'undefined') {
        var res = await dgraphClient.newTxn().query(query);
    } else {
        var res = await dgraphClient.newTxn().queryWithVars(query, vars);
    }
    return res.getJson();
}

// listen for requests :)
const listener = app.listen(port, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
