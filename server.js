const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 1337;

app.use(cors());
app.use(express.static(__dirname)); // отдаём index.html и статику

// Папка для вирусов
const uploadDir = path.join(__dirname, 'viruses');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer — сохранение файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Загрузка вируса + метаданных
app.post('/upload', upload.single('file'), (req, res) => {
  const { name, desc, tags, author } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: 'Файл не загружен' });

  const metadata = {
    name: name || file.originalname,
    desc: desc || 'Нет описания',
    tags: tags || '',
    author: author || 'Кошкерот',
    filename: file.filename,
    size: file.size,
    date: new Date().toLocaleString()
  };

  const jsonPath = path.join(uploadDir, file.filename + '.json');
  fs.writeFileSync(jsonPath, JSON.stringify(metadata, null, 2));

  res.json({ success: true, metadata });
});

// Получение списка всех вирусов
app.get('/viruses', (req, res) => {
  const files = fs.readdirSync(uploadDir);
  const viruses = [];

  files.forEach(f => {
    if (f.endsWith('.json')) {
      const data = JSON.parse(fs.readFileSync(path.join(uploadDir, f), 'utf8'));
      viruses.push(data);
    }
  });

  res.json(viruses);
});

// Скачивание файла
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('Файл не найден');
  }
});

app.listen(PORT, () => {
  console.log(`КОШКЕРОТВИРУСОВ запущен на http://localhost:${PORT}`);
  console.log('Введи в браузере: http://localhost:1337');
});