const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "cleancity.cqxscy2m4s5o.us-east-1.rds.amazonaws.com",
  user: "admin",
  password: "Dimas222",
  database: "cleancity", // <-- ini diubah
});

db.connect((err) => {
  if (err) throw err;
  console.log("Database connected");
});

module.exports = db;
