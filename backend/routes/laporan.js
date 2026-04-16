const express = require("express");
const router = express.Router();
const multer = require("multer");
const AWS = require("aws-sdk");
const db = require("../db");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// konfigurasi S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

// POST laporan
router.post("/", upload.single("foto"), (req, res) => {
  const file = req.file;
  const { lokasi, deskripsi } = req.body;

  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: Date.now() + "-" + file.originalname,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  s3.upload(params, (err, data) => {
    if (err) return res.status(500).send(err);

    const sql = "INSERT INTO laporan (lokasi, deskripsi, foto_url) VALUES (?, ?, ?)";
    db.query(sql, [lokasi, deskripsi, data.Location], (err, result) => {
      if (err) throw err;
      res.send({ message: "Laporan berhasil", url: data.Location });
    });
  });
});

// GET semua laporan
router.get("/", (req, res) => {
  db.query("SELECT * FROM laporan", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

module.exports = router;
