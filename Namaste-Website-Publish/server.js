const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
require("dotenv").config();
const nodemailer = require("nodemailer");

const app = express();
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const PORT = process.env.PORT || 5000;


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors());

app.use(express.json());


/* =========================================================
   TEST ROUTE
========================================================= */

app.get("/", (req, res) => {

    res.json({
        message: "Namaste Nutritive Backend is Running!"
    });

});


/* =========================================================
   GET ALL ORDERS
========================================================= */

app.get("/orders", (req, res) => {

    try {

        const ordersFile =
            path.join(__dirname, "orders.json");

        if (!fs.existsSync(ordersFile)) {

            return res.json([]);

        }

        const fileData =
            fs.readFileSync(
                ordersFile,
                "utf8"
            );

        const orders =
            fileData.trim()
                ? JSON.parse(fileData)
                : [];

        res.json(orders);

    } catch (error) {

        console.error(
            "Orders loading error:",
            error
        );

        res.status(500).json({
            message: "Orders could not be loaded."
        });

    }

});


/* =========================================================
   RECEIVE CUSTOMER ORDERS
========================================================= */

app.post("/orders", (req, res) => {

    try {

        const order = req.body;

        console.log("\n=================================");
        console.log("       NEW ORDER RECEIVED");
        console.log("=================================");

        console.log(
            "Order ID:",
            order.orderId
        );

        console.log(
            "Customer:",
            order.customer?.name
        );

        console.log(
            "Mobile:",
            order.customer?.mobile
        );

        console.log(
            "Email:",
            order.customer?.email
        );

        console.log(
            "Address:",
            order.customer?.address
        );

        console.log(
            "City:",
            order.customer?.city
        );

        console.log(
            "State:",
            order.customer?.state
        );

        console.log(
            "Pincode:",
            order.customer?.pincode
        );

        console.log(
            "Payment:",
            order.paymentMethod
        );

        console.log(
            "Total:",
            order.total
        );

        console.log(
            "Products:",
            order.products
        );

        console.log(
            "=================================\n"
        );


        const ordersFile =
            path.join(
                __dirname,
                "orders.json"
            );


        let orders = [];


        if (
            fs.existsSync(
                ordersFile
            )
        ) {

            const fileData =
                fs.readFileSync(
                    ordersFile,
                    "utf8"
                );

            if (
                fileData.trim()
            ) {

                orders =
                    JSON.parse(
                        fileData
                    );

            }

        }


        orders.push(order);


        fs.writeFileSync(

            ordersFile,

            JSON.stringify(
                orders,
                null,
                2
            )

        );


        console.log(
            "Orders saved to:",
            ordersFile
        );

        console.log(
            "Total orders saved:",
            orders.length
        );


        res.json({

            success: true,

            message:
                "Order received and saved successfully!",

            orderId:
                order.orderId

        });


    } catch (error) {

        console.error(
            "Order receiving error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Order could not be saved."

        });

    }

});

/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

app.put("/orders/:orderId/status", (req, res) => {

    try {

        const orderId = req.params.orderId;
        const newStatus = req.body.status;

        const ordersFile =
            path.join(
                __dirname,
                "orders.json"
            );

        if (!fs.existsSync(ordersFile)) {

            return res.status(404).json({
                success: false,
                message: "Orders file not found."
            });

        }

        const fileData =
            fs.readFileSync(
                ordersFile,
                "utf8"
            );

        let orders =
            fileData.trim()
                ? JSON.parse(fileData)
                : [];

        const orderIndex =
            orders.findIndex(
                order =>
                    order.orderId === orderId
            );

        if (orderIndex === -1) {

            return res.status(404).json({
                success: false,
                message: "Order not found."
            });

        }

        orders[orderIndex].status =
            newStatus;

        fs.writeFileSync(
            ordersFile,
            JSON.stringify(
                orders,
                null,
                2
            )
        );

        console.log(
            "Order status updated:",
            orderId,
            "→",
            newStatus
        );

        res.json({

            success: true,

            message:
                "Order status updated successfully.",

            order:
                orders[orderIndex]

        });

    } catch (error) {

        console.error(
            "Status update error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Order status could not be updated."

        });

    }

});

/* =========================================================
   CANCEL ORDER
========================================================= */

app.put("/orders/:orderId/cancel", (req, res) => {

    try {

        const orderId = req.params.orderId;

        const ordersFile =
            path.join(
                __dirname,
                "orders.json"
            );

        if (!fs.existsSync(ordersFile)) {

            return res.status(404).json({
                success: false,
                message: "Orders file not found."
            });

        }

        const fileData =
            fs.readFileSync(
                ordersFile,
                "utf8"
            );

        let orders =
            fileData.trim()
                ? JSON.parse(fileData)
                : [];

        const orderIndex =
            orders.findIndex(
                order =>
                    order.orderId === orderId
            );

        if (orderIndex === -1) {

            return res.status(404).json({
                success: false,
                message: "Order not found."
            });

        }

        orders[orderIndex].status =
            "Cancelled";

        fs.writeFileSync(
            ordersFile,
            JSON.stringify(
                orders,
                null,
                2
            )
        );

        console.log(
            "Order cancelled:",
            orderId
        );

        res.json({

            success: true,

            message:
                "Order cancelled successfully.",

            order:
                orders[orderIndex]

        });

    } catch (error) {

        console.error(
            "Cancel order error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Order could not be cancelled."

        });

    }

});


/* =========================================================
   RAZORPAY CREATE ORDER
========================================================= */

app.post(
    "/create-order",
    async (req, res) => {

        try {

            const options = {

                amount:
                    req.body.amount * 100,

                currency:
                    "INR",

                receipt:
                    "order_" +
                    Date.now()

            };


            const order =
                await razorpay.orders.create(
                    options
                );


            res.json(order);


        } catch (error) {

            console.error(error);

            res.status(500).json({

                message:
                    "Order creation failed"

            });

        }

    }
);


/* =========================================================
   START SERVER
========================================================= */

app.listen(
    PORT,
    () => {

        console.log(
            `Server running at http://localhost:${PORT}`
        );

    }
);
