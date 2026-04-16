const express = require("express");
const router = express.Router();
const multer = require("multer");
const AWS = require("aws-sdk");
const db = require("../db");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ✅ konfigurasi S3 (pakai ENV, aman)
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

// =====================
// POST laporan
// =====================
router.post("/", upload.single("foto"), (req, res) => {
  const file = req.file;
  const { lokasi, deskripsi } = req.body;

  // ✅ validasi input
  if (!lokasi || !deskripsi) {
    return res.status(400).send("Lokasi & deskripsi wajib diisi");
  }

  if (!file) {
    return res.status(400).send("File foto tidak ditemukan");
  }

  if (!process.env.AWS_S3_BUCKET) {
    return res.status(500).send("AWS_S3_BUCKET belum diset di .env");
  }

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: Date.now() + "-" + file.originalname,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  // upload ke S3
  s3.upload(params, (err, data) => {
    if (err) {
      console.error("S3 ERROR:", err);
      return res.status(500).send("Upload ke S3 gagal");
    }

    const sql = "INSERT INTO laporan (lokasi, deskripsi, foto_url) VALUES (?, ?, ?)";

    db.query(sql, [lokasi, deskripsi, data.Location], (err, result) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).send("Gagal simpan ke database");
      }

      res.json({
        message: "Laporan berhasil",
        data: {
          id: result.insertId,
          lokasi,
          deskripsi,
          foto_url: data.Location,
        },
      });
    });
  });
});

// =====================
// GET semua laporan
// =====================
router.get("/", (req, res) => {
  db.query("SELECT * FROM laporan ORDER BY id DESC", (err, results) => {
    if (err) {
      console.error("DB ERROR:", err);
      return res.status(500).send("Gagal ambil data");
    }

    res.json(results);
  });
});

module.exports = router;
