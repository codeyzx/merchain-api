import express from "express";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import midtransClient from "midtrans-client";

dotenv.config();

let app = express();

const type = process.env.type;
const project_id = process.env.project_id;
const private_key_id = process.env.private_key_id;
const private_key = process.env.private_key;
const client_email = process.env.client_email;
const client_id = process.env.client_id;
const auth_uri = process.env.auth_uri;
const token_uri = process.env.token_uri;
const auth_provider_x509_cert_url = process.env.auth_provider_x509_cert_url;
const client_x509_cert_url = process.env.client_x509_cert_url;

const PORT = process.env.PORT || 3000;

const firebase = {
  type,
  project_id,
  private_key_id,
  private_key,
  client_email,
  client_id,
  auth_uri,
  token_uri,
  auth_provider_x509_cert_url,
  client_x509_cert_url,
};

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.SERVER_KEY,
  clientKey: process.env.CLIENT_KEY,
});

app.use(express.urlencoded({ extended: true })); // to support URL-encoded POST body
app.use(express.json()); // to support parsing JSON POST body
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

app.get("/", function (req, res) {
  res.status(200).send({ jon: process.env.project_id, asd: "ok" });
});

app.get("/verification/:uid", function (req, res) {
  if (!admin.apps.length) {
    admin.initializeApp({
      databaseURL: process.env.databaseURL,
      projectId: process.env.projectId,
      credential: admin.credential.cert(firebase),
    });
  }

  getAuth()
    .getUser(req.params.uid)
    .then((userRecord) => {
      res.status(200).json({ emailVerified: userRecord.emailVerified });
    })
    .catch((error) => {
      res.status(400).json({ error: error });
    });
});

app.post("/charge", function (req, res) {
  let body = req.body;

  let gross_amount = 0;
  let items = body.items;
  let customers = body.customers;

  items.forEach(function (item) {
    gross_amount += item.price * item.quantity;
  });

  let parameter = {
    transaction_details: {
      order_id: "order-id-" + Math.round(new Date().getTime() / 1000),
      gross_amount: gross_amount,
    },
    customer_details: customers,
    item_details: items,
  };

  // create snap transaction token
  snap.createTransactionToken(parameter).then((transactionToken) => {
    res.status(200).json({ token: transactionToken });
  });
});

app.post("/status", function (req, res) {
  let receivedJson = req.body;
  snap.transaction
    .notification(receivedJson)
    .then((transactionStatusObject) => {
      // let orderId = transactionStatusObject.order_id;
      // let transactionStatus = transactionStatusObject.transaction_status;
      // let fraudStatus = transactionStatusObject.fraud_status;

      let summary = transactionStatusObject;

      // let summary = `Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}.<br>Raw notification object:<pre>${JSON.stringify(
      //   transactionStatusObject,
      //   null,
      //   2
      // )}</pre>`;

      // [5.B] Handle transaction status on your backend via notification alternatively
      // Sample transactionStatus handling logic
      // if (transactionStatus == "capture") {
      //   if (fraudStatus == "challenge") {
      //     // TODO: set transaction status on your databaase to 'challenge'
      //   } else if (fraudStatus == "accept") {
      //     // TODO: set transaction status on your databaase to 'success'
      //   }
      // } else if (transactionStatus == "settlement") {
      //   // TODO: set transaction status on your databaase to 'success'
      //   // Note: Non-card transaction will become 'settlement' on payment success
      //   // Card transaction will also become 'settlement' D+1, which you can ignore
      //   // because most of the time 'capture' is enough to be considered as success
      // } else if (
      //   transactionStatus == "cancel" ||
      //   transactionStatus == "deny" ||
      //   transactionStatus == "expire"
      // ) {
      //   // TODO: set transaction status on your databaase to 'failure'
      // } else if (transactionStatus == "pending") {
      //   // TODO: set transaction status on your databaase to 'pending' / waiting payment
      // } else if (transactionStatus == "refund") {
      //   // TODO: set transaction status on your databaase to 'refund'
      // }

      res.send(summary);
    })
    .catch(() => {
      res.status(404).json({
        status_code: "404",
        status_message: "Transaction id not found",
      });
    });
});

app.listen(PORT, () => {
  console.log("Server started on " + PORT);
});
