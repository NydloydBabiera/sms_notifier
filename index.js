const cron = require("node-cron");
const { exec } = require("child_process");
var Semaphore = require("node-semaphore-sms");
var request = require("request");
const axios = require("axios");
const { Client } = require("pg");
var numList = [];
var parentNum = [];
let result = "";

let curlCommand = "";
let curfewTime = "";
let [hours, minutes] = [];
const dotenv = require("dotenv");
dotenv.config();
const message =
  "Good evening this is a reminder that curfew hour is within 1 hour";
const msgParent = "Good evening your son/daughter is not yet in the premises";
const API_KEY = "dd25c4a11713c958924fab687db75aba";
const senderName = "USMDorm";
const client = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: true,
});

client
  .connect()
  .then(() => console.log("Connected to PostgreSQL database"))
  .catch((err) =>
    console.error("Error connecting to PostgreSQL database:", err)
  );

// cron.schedule('*/2 * * * *', () => {
console.log("Retrieve time schedule..");
client.query(
  "SELECT TO_CHAR(curfew_time, 'HH:MI') as curfew_time from curfew_schedule",
  (err, res) => {
    if (err) {
      console.error("Error executing query:", err);
      return;
    }

    console.log("res:", res.rows[0].curfew_time);
    curfewTime = res.rows[0].curfew_time;
    console.log(curfewTime);
  }
);
// })

[hours, minutes] = curfewTime.split(":");
console.log(`schedule: ${minutes}, ${hours}`);
// Schedule the curl command to execute every minute
// cron.schedule(`${minutes} ${hours} * * *`, () => {
//task ara sa sms sa tenant
cron.schedule(`03 09 * * *`, () => {
  //diri ichange ang time 30 - minutes, 21- hours
  client.query(
    `select contacno from activity_logs logs
  inner join user_information inf on inf.user_id =logs.user_id
  where logs.time_out is null and logs.time_in is not null`,
    (err, res) => {
      if (err) {
        console.error("Error executing query:", err);
        return;
      }
      //   console.log("Query results:", res.rows);
      res.rows.forEach((element) => {
        parentNum.push(element.contacno.match(/\d+/g).join(", "));
      });

      for (let i = 0; i < parentNum.length; i++) {
        parentNum += parentNum[i];

        if (i < numList.length - 1) {
          parentNum += ", ";
        }
      }

      sendBulkSms();
    }
  );
});

cron.schedule(`05 09 * * *`, () => {
  //diri ichange ang time 30 - minutes, 22- hours (10:30PM)
  console.log("Sending to parents...");
  client.query(
    `select gi.contactno from activity_logs logs
    inner join user_information inf on inf.user_id =logs.user_id
    inner join public.guardian_information gi on inf.user_id = gi.user_id
    where logs.time_out is null and logs.time_in is not null`,
    (err, res) => {
      if (err) {
        console.error("Error executing query:", err);
        return;
      }
      res.rows.forEach((element) => {
        console.log(element);
        parentNum.push(element.contactno.match(/\d+/g).join(", "));
      });

      for (let i = 0; i < parentNum.length; i++) {
        result += parentNum[i];

        if (i < parentNum.length - 1) {
          result += ", ";
        }
      }

      sendBulkSmsParent();
    }
  );
});

async function sendSms(number) {
  const url = "https://semaphore.co/api/v4/messages";

  const params = {
    apikey: API_KEY,
    number,
    message,
  };

  try {
    const response = await axios.post(url, null, { params });
    console.log(`SMS sent successfully to ${number}:`, response.data);
  } catch (error) {
    console.error(
      `Error sending SMS to ${number}:`,
      error.response ? error.response.data : error.message
    );
  }
}

async function sendBulkSms() {
  for (const number of numList) {
    await sendSms(number);
  }
}
async function sendBulkSmsParent() {
  for (const number of parentNum) {
    await sendSmsParent(number);
  }
}

async function sendSmsParent(number) {
  const url = "https://semaphore.co/api/v4/messages";

  const params = {
    apikey: API_KEY,
    number,
    message: msgParent,
  };

  try {
    const response = await axios.post(url, null, { params });
    console.log(`SMS sent successfully to ${number}:`, response.data);
  } catch (error) {
    console.error(
      `Error sending SMS to ${number}:`,
      error.response ? error.response.data : error.message
    );
  }
}
