const { storage } = require("./config/firebase");
const Jimp = require("jimp");
const stripe = require("stripe")(
  "sk_test_51JQ8tTGxcWcA0yogyKKfOhLnuYSA9pyVP5DuN8hFo0IWThLJDpuK5MhzOpgK1xiJtazvwBdkPBB5xSTi2WU6EvHA00XNUNVVGg"
);
const express = require("express");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const app = express();
global.__basedir = __dirname;
const fileupload = require("express-fileupload");
let PORT = process.env.PORT || 5002;
// File uploading
app.use(fileupload({ useTempFiles: true }));
// Set static folder
app.use(express.static(path.join(__basedir + "public")));

app.get("/", (req, res) => {
  res.send("Welcome");
});

app.get("/test", async (req, res) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: "test-mail@nextpak.org",
      pass: "Demopass@1",
    },
  });

  const message = {
    from: "test-mail@nextpak.org",
    to: "muhammad_qadeer@nextpak.org",
    subject: "Testing Email",
    text: "This is a Testing Email",
  };

  const info = await transporter.sendMail(message);

  res.status(200).json({ message: "Email Sent SuccessFully" });
});

app.post("/upload", async (req, res) => {
  if (req.files == undefined) {
    return res
      .status(404)
      .json({ success: false, message: "Please Upload a File" });
  } else {
    let signedUrl;
    Jimp.read(req.files.file?.tempFilePath, async (error, file) => {
      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      } else {
        let name = `${uuidv4()}.png`;
        await file.write(__basedir + "/uploads/" + name);
        var filePath = `test/${name}`;
        await storage
          .bucket("gs://react-todolist-3fd5a.appspot.com")
          .upload(__basedir + "/uploads/" + name, {
            destination: filePath,
            // gzip: true,
            resumable: false,
            metadata: {
              metadata: {
                contentType: file._originalMime,
              },
            },
          });

        signedUrl = `https://firebasestorage.googleapis.com/v0/b/react-todolist-3fd5a.appspot.com/o/test%2F${name}?alt=media&token=dbe4ff0f-93cc-484c-9c29-84ee66cbc385`;

        res.status(200).json({
          success: true,
          data: signedUrl,
        });
      }
    });
  }
});

// app.get("/test", async (req, res) => {
//   const session = await stripe.checkout.sessions.create({
//     mode: "payment",
//     payment_method_types: ["card", "us_bank_account"],
//     payment_method_options: {
//       us_bank_account: {
//         financial_connections: { permissions: ["payment_method"] },
//       },
//     },
//     line_items: [
//       {
//         price_data: {
//           currency: "usd",
//           unit_amount: 2000,
//           product_data: { name: "T-shirt" },
//         },
//         quantity: 1,
//       },
//     ],
//     success_url: "http://localhost:8080/success",
//     cancel_url: "http://localhost:8080/cancel",
//   });
//   res.send(session);
// });
const endpointSecret =
  "whsec_5915e1a8c0608ca426e4106e7c3b2522f3edd9e39079e557bf7309e3b6d0896d";

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (request, response) => {
    const sig = request.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    console.log(`Unhandled event type ${event.type}`);

    // Return a 200 response to acknowledge receipt of the event
    response.send(event);
  }
);

app.post("/create", async (req, res) => {
  // let data = {
  //   object: "bank_account",
  //   account_holder_name: "test",
  //   account_holder_type: "individual",
  //   country: "US",
  //   currency: "usd",
  //   routing_number: "110000000",
  //   account_number: "000123456789",
  // };
  // console.log(data);
  // try {
  //   const bankAccount = await stripe.customers.createSource(
  //     "cus_MymTga7ENTcS81",
  //     { source: data }
  //   );
  //   res.send(bankAccount);
  // } catch (err) {
  //   console.log(err.message);
  // }
  // const token = await stripe.tokens.create({
  //   bank_account: {
  //     country: "US",
  //     currency: "usd",
  //     account_holder_name: "Test",
  //     account_holder_type: "individual",
  //     routing_number: "110000000",
  //     account_number: "000123456789",
  //   },
  // });
  // const customer = await stripe.customers.create({
  //   email: "test@gmail.com",
  //   source: token?.id,
  // });
  // res.send(customer);
  await stripe.paymentIntents
    .confirm("pi_3MFBfQGxcWcA0yog1ifvYVap", {
      payment_method: "ba_1MFB40GxcWcA0yogS5kc9TT3",
    })
    .then((paymentIntent) => {
      res.send(paymentIntent);
    })
    .catch((err) => {
      console.log(err?.message);
    });
});

app.post("/transfer", async (req, res) => {
  let data = await stripe.paymentIntents.create({
    customer: "cus_Mz9MCRz57X6TrM",
    currency: "usd",
    amount: 50,
    confirm: true,
    payment_method_types: ["us_bank_account"],
    payment_method: "ba_1MFB40GxcWcA0yogS5kc9TT3",
    mandate_data: {
      customer_acceptance: {
        accepted_at: 123456789,
        online: {
          ip_address: "127.0.0.0",
          user_agent: "device",
        },
        type: "online",
      },
    },
  });
  res.send(data);
  // try {
  //   const payout = await stripe.payouts.create(
  //     { amount: 2, currency: "usd" },
  //     { stripeAccount: "cus_MymTga7ENTcS81" }
  //   );
  //   res.send(payout);
  // } catch (err) {
  //   console.log("Error", err.message);
  // }
});

app.listen(PORT, () => {
  console.log("App listening on port 5002!");
});
