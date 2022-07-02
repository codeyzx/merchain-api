import express from "express";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  query,
  updateDoc,
  where,
  getDocs,
} from "firebase/firestore";
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import midtransClient from "midtrans-client";
import cors from "cors";
import morgan from "morgan";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

dotenv.config();

let app = express();

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Merchain API",
      version: "1.0.0",
      description: "A simple Express Library API",
    },
    servers: [
      {
        url: "https://merchain-api-production.up.railway.app/",
      },
    ],
  },
  apis: ["./app.js"],
};

const specs = swaggerJsDoc(options);

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
const apiKey = process.env.apiKey;
const authDomain = process.env.authDomain;
const projectId = process.env.projectId;
const storageBucket = process.env.storageBucket;
const messagingSenderId = process.env.messagingSenderId;
const appId = process.env.appId;

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

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.SERVER_KEY,
  clientKey: process.env.CLIENT_KEY,
});

app.use(express.urlencoded({ extended: true })); // to support URL-encoded POST body
app.use(express.json()); // to support parsing JSON POST body
app.use(cors());
app.use(morgan("dev"));
app.use(function (req, res, next) {
  // Website you wish to allow to connect restart pls
  res.setHeader("Access-Control-Allow-Origin", "*");

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

// app.get("/", function (req, res) {
//   res.status(200).send({ jon: process.env.project_id, asd: "ok" });
// });

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

app.get("/", (rqe, res) => {
  res.redirect("/api-docs");
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - customers
 *         - items
 *       properties:
 *         customers:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             first_name:
 *               type: string
 *             last_name:
 *               type: string
 *             phone:
 *               type: string
 *         items:
 *           type: array
 *           properties:
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               price:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               name:
 *                 type: string
 *         callbacks:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *         order_id:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Transaction
 *   description: Managing transaction merchain API
 */

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Managing user API
 */

/**
 * @swagger
 * /charge:
 *   post:
 *     summary: Create a new transaction token
 *     tags: [Transaction]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transaction'
 *     responses:
 *       200:
 *         description: The transaction token was successfully created
 *       500:
 *         description: Some server error
 */

app.post("/charge", function (req, res) {
  let body = req.body;

  let gross_amount = 0;
  let items = body.items;
  let customers = body.customers;
  let url = body.url;

  items.forEach(function (item) {
    gross_amount += item.price * item.quantity;
  });

  // let orderIdRand = "order-id-" + Math.round(new Date().getTime() / 1000);
  // let orderIdRand = "order-id-" + Math.round(new Date().getTime() / 1000);
  let orderIdRand = body.order_id;
  let parameter = {
    transaction_details: {
      order_id: "order-id-" + orderIdRand,
      gross_amount: gross_amount,
    },
    customer_details: customers,
    item_details: items,
    callbacks: {
      finish: url,
    },
  };

  // create snap transaction token
  try {
    snap
      .createTransactionToken(parameter)
      .then((transactionToken) => {
        res.status(200).json({ token: transactionToken });
      })
      .catch((e) => {
        res.status(404).json({
          status_code: "404",
          error_message: e,
        });
      });
  } catch (error) {
    console.log(error);
  }
});
//swagger lagi
/**
 * @swagger
 * /det/{transaction_id}:
 *   get:
 *     summary: Get a transaction detail by transaction_id
 *     tags: [Transaction]
 *     parameters:
 *       - in: path
 *         name: transaction_id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: an transaction detail
 *       404:
 *         description: transaction_id was not found
 */
app.get("/det/:transaction_id", function (req, res) {
  let transaction_id = {
    transaction_id: req.params.transaction_id,
  };
  snap.transaction
    .notification(transaction_id)
    .then((transactionStatusObject) => {
      // let orderId = transactionStatusObject.order_id;
      // let transactionStatus = transactionStatusObject.transaction_status;
      // let fraudStatus = transactionStatusObject.fraud_status;

      let summary = transactionStatusObject;

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

      res.status(200).send(summary);
    })
    .catch(() => {
      res.status(404).json({
        status_code: "404",
        status_message: "Transaction id not found",
      });
    });
});

app.post("/notification_handler", function (req, res) {
  let receivedJson = req.body;
  snap.transaction
    .notification(receivedJson)
    .then(async (transactionStatusObject) => {
      const app = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(app);

      let orderId = transactionStatusObject.order_id;
      let transactionStatus = transactionStatusObject.transaction_status;

      const q = query(
        collection(firestoreDb, "orders"),
        where("orderId", "==", orderId)
      );
      const docSnap = await getDocs(q);
      const id = docSnap.docs[0].id;

      if (transactionStatus == "capture") {
        if (fraudStatus == "challenge") {
          await updateDoc(doc(firestoreDb, "orders", id), {
            status: "challenge",
          });
          // TODO: set transaction status on your databaase to 'challenge'
        } else if (fraudStatus == "accept") {
          await updateDoc(doc(firestoreDb, "orders", id), {
            status: "accept",
          });
          // TODO: set transaction status on your databaase to 'success'
        }
      } else if (transactionStatus == "settlement") {
        await updateDoc(doc(firestoreDb, "orders", id), {
          status: "settlement",
        });
        // TODO: set transaction status on your databaase to 'success'
        // Note: Non-card transaction will become 'settlement' on payment success
        // Card transaction will also become 'settlement' D+1, which you can ignore
        // because most of the time 'capture' is enough to be considered as success
      } else if (
        transactionStatus == "cancel" ||
        transactionStatus == "deny" ||
        transactionStatus == "expire"
      ) {
        // TODO: set transaction status on your databaase to 'failure'
        await updateDoc(doc(firestoreDb, "orders", id), {
          status: "failure",
        });
      } else if (transactionStatus == "pending") {
        await updateDoc(doc(firestoreDb, "orders", id), {
          status: "pending",
        });
        // TODO: set transaction status on your databaase to 'pending' / waiting payment
      } else if (transactionStatus == "refund") {
        await updateDoc(doc(firestoreDb, "orders", id), {
          status: "refund",
        });
        // TODO: set transaction status on your databaase to 'refund'
      }

      res.status(200).send(transactionStatusObject);
    })
    .catch(() => {
      res.status(404).json({
        status_code: "404",
        status_message: "Transaction id not found",
      });
    });
});

/**
 * @swagger
 * /status/{uid}:
 *   get:
 *     summary: Get a email status by uid
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: an email status user
 *       404:
 *         description: uid was not found
 */

app.get("/status/:uid", function (req, res) {
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
      res
        .status(200)
        .json({ status_code: "200", emailVerified: userRecord.emailVerified });
    })
    .catch((error) => {
      res
        .status(404)
        .json({ status_code: "404", error_message: error.message });
    });
});

app.listen(PORT, () => {
  console.log("Server started on " + PORT);
});
