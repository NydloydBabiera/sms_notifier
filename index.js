const cron = require("node-cron");
const { exec } = require("child_process");
var Semaphore = require("node-semaphore-sms");
var request = require("request");
const axios = require("axios");
const { Client } = require("pg");
var numList = [];
let result = "";

let curlCommand = "";
let curfewTime = "";
let [hours, minutes] = [];
const dotenv = require("dotenv");
dotenv.config();
const message =
  "Good evening this is a reminder that curfew hour is within 1 hour";
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
cron.schedule(`${minutes} ${hours} * * *`, () => {
  // cron.schedule(`02 00 * * *`, () => {
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
        numList.push(element.contacno.match(/\d+/g).join(", "));
      });

      for (let i = 0; i < numList.length; i++) {
        result += numList[i];

        if (i < numList.length - 1) {
          result += ", ";
        }
      }

      // curlCommand = `curl --data "apikey=dd25c4a11713c958924fab687db75aba&number=${numList}&message=${msg}" https://semaphore.co/api/v4/messages`;

      sendBulkSms();
      // // To check your account status:
      // sms.status(function (error, result) {
      //   if (!error) console.log(result);
      // });
      // // To send SMS to bulk numbers:
      // // var bulk_numbers = "09179008888,09168769988";
      // sms.bulksms(numList, msg, function (error, result) {
      //   if (!error) {
      //     console.log(result);
      //   } else console.log(error);
      // });
      //   Execute the curl command
      // exec(curlCommand, (error, stdout, stderr) => {
      //   if (error) {
      //     console.error(`exec error: ${error}`);
      //     return;
      //   }
      //   console.log(`stdout: ${stdout}`);
      //   console.error(`stderr: ${stderr}`);
      // });
    }
  );
});

// cron.schedule('1 16 * * *', () => {
//     console.log('Running a job at 04:00 at PH timezone');
//   }, {
//     scheduled: true,
//     timezone: "Asia/Shanghai"
//   });

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
