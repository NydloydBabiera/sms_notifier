const cron = require("node-cron");
const { exec } = require("child_process");

const { Client } = require("pg");
var numList = [];
let result = "";
let msg = "";
let curlCommand = "";
const dotenv = require("dotenv");
dotenv.config();

const client = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

client
  .connect()
  .then(() => console.log("Connected to PostgreSQL database"))
  .catch((err) =>
    console.error("Error connecting to PostgreSQL database:", err)
  );

// Schedule the curl command to execute every minute
cron.schedule("12 17 * * *", () => {
  client.query(
    "SELECT contacno FROM user_information where contacno is not null",
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
      msg = "Good evening this is a reminder that curfew hour is within 1 hour";
      curlCommand = `curl --data "apikey=dd25c4a11713c958924fab687db75aba&number=09353389536&message=test" https://semaphore.co/api/v4/messages`;

      console.log("curlCommand:", curlCommand);
      //   Execute the curl command
      exec(curlCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
      });
    }
  );
});

// cron.schedule('1 16 * * *', () => {
//     console.log('Running a job at 04:00 at PH timezone');
//   }, {
//     scheduled: true,
//     timezone: "Asia/Shanghai"
//   });
