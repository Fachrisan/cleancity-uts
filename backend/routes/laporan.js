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
  const bucketName = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET;

  // ✅ validasi input
  if (!lokasi || !deskripsi) {
    return res.status(400).json({ message: "Lokasi & deskripsi wajib diisi" });
  }

  if (!file) {
    return res.status(400).json({ message: "File foto tidak ditemukan" });
  }

  if (!bucketName) {
    return res.status(500).json({ message: "S3 bucket belum diset (AWS_S3_BUCKET/S3_BUCKET)" });
  }

  const params = {
    Bucket: bucketName,
    Key: Date.now() + "-" + file.originalname,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  // upload ke S3
  s3.upload(params, (err, data) => {
    if (err) {
      console.error("S3 ERROR:", err);
      return res.status(500).json({ message: "Upload ke S3 gagal" });
    }

    const sql = "INSERT INTO laporan (lokasi, deskripsi, foto_url) VALUES (?, ?, ?)";

    db.query(sql, [lokasi, deskripsi, data.Location], (err, result) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({ message: "Gagal simpan ke database" });
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
      return res.status(500).json({ message: "Gagal ambil data" });
    }

    res.json(results);
  });
});

module.exports = router;
