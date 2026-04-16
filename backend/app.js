const express = require("express");
const cors = require("cors");
require("dotenv").config();

const laporanRoutes = require("./routes/laporan");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/laporan", laporanRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
