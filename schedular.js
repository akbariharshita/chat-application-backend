import cron from "node-cron";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMBINED_LOG_PATH = path.join(__dirname, "logs", "combined.log");

const filterLogsForLast30Days = (logs) => {
  const currentDate = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(currentDate.getDate() - 30);

  return logs.filter((log) => {
    const logDate = new Date(log.timestamp);
    return logDate >= thirtyDaysAgo;
  });
};

const filterLogsTask = () => {
  try {
    const logsData = fs.readFileSync(COMBINED_LOG_PATH, "utf-8").trim();

    if (!logsData) {
      console.log("No logs found to filter.");
      return;
    }

    const logs = logsData
      .split("\n")
      .map((log) => {
        try {
          return JSON.parse(log);
        } catch (e) {
          console.warn("Skipping invalid log entry:", log);
          return null;
        }
      })
      .filter(Boolean);

    if (logs.length === 0) {
      console.log("No valid logs to filter.");
      return;
    }

    const filteredLogs = filterLogsForLast30Days(logs);

    fs.writeFileSync(
      COMBINED_LOG_PATH,
      filteredLogs.map((log) => JSON.stringify(log)).join("\n") + "\n",
      "utf-8"
    );

    console.log(
      "Logs filtered and saved. Only the last 30 days of logs are retained."
    );
  } catch (error) {
    console.error("Error during log filtering:", error.message);
  }
};

cron.schedule("0 0 * * *", filterLogsTask);
