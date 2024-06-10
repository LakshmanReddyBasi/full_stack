const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const multer = require('multer');
const admin = require("firebase-admin");
const ILovePDFApi = require('@ilovepdf/ilovepdf-nodejs');
const ILovePDFFile = require('@ilovepdf/ilovepdf-nodejs/ILovePDFFile');
const fs = require('fs');


const app = express();
const port = 1010;
// Set up Multer for file upload handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });



// Initialize Firebase Admin SDK
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();


const instance = new ILovePDFApi('project_public_783c62bbfd949442ce7e19c8a2f10709_B38Ex3bf5c310c69e174bc6cc34273e62b645', 'secret_key_632c0259f2aeef1993c12d001ac4c622_TeLqVd1a9325e0b0e4ae4958f65e6c040e94d');


// Set up middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
  res.render('signup');
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userSnapshot = await db.collection("users").where("email", "==", email).limit(1).get();
    if (userSnapshot.empty) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    const user = userSnapshot.docs[0].data();
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      // Redirect to dashboard
      res.redirect('/dashboard');
    } else {
      return res.render('login', { error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

app.post('/signup', async (req, res) => {
  const { username, email, phone, password, confirm_password } = req.body;
  if (password !== confirm_password) {
    return res.render('signup', { error: 'Passwords do not match' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection("users").add({
      username,
      email,
      phone,
      password: hashedPassword
    });
    res.redirect('/login');
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/dashboard', (req, res) => {
  // Render dashboard view
  res.render('dashboard');
});

app.get('/features', (req, res) => {
  res.render('features');
});


app.get('/compresspdf', (req, res) => res.render('compresspdf'));
app.get('/extractpdf', (req, res) => res.render('extractpdf'));

app.get('/imagetopdf', (req, res) => res.render('imagetopdf'));
app.get('/officetopdf', (req, res) => res.render('officetopdf'));

app.get('/pdftopdfa', (req, res) => res.render('pdftopdfa'));
// Start the server
// Handle merge PDF operation

app.post('/compresspdf', upload.single('pdfFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const filePath = req.file.path;
  const outputFilePath = path.join(__dirname, 'converted', `${path.parse(req.file.originalname).name}.pdf`);

  try {
    const instance = new ILovePDFApi('project_public_783c62bbfd949442ce7e19c8a2f10709_B38Ex3bf5c310c69e174bc6cc34273e62b645', 'secret_key_632c0259f2aeef1993c12d001ac4c622_TeLqVd1a9325e0b0e4ae4958f65e6c040e94d');
    const task = instance.newTask('compress');

    await task.start();
    const file = new ILovePDFFile(filePath);
    await task.addFile(file);
    await task.process();
    const data = await task.download();

    // Ensure the directory exists
    fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
    fs.writeFileSync(outputFilePath, data);

    res.download(outputFilePath);
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send('Error processing file.');
  }
});

app.post('/officetopdf', upload.single('officeDoc'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const filePath = req.file.path;
  const outputFilePath = path.join(__dirname, 'converted', `${path.parse(req.file.originalname).name}.pdf`);

  try {
    const instance = new ILovePDFApi('project_public_783c62bbfd949442ce7e19c8a2f10709_B38Ex3bf5c310c69e174bc6cc34273e62b645', 'secret_key_632c0259f2aeef1993c12d001ac4c622_TeLqVd1a9325e0b0e4ae4958f65e6c040e94d');
    const task = instance.newTask('officepdf');

    await task.start();
    const file = new ILovePDFFile(filePath);
    await task.addFile(file);
    await task.process();
    const data = await task.download();

    // Ensure the directory exists
    fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
    fs.writeFileSync(outputFilePath, data);

    res.download(outputFilePath);
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send('Error processing file.');
  }
});


app.post('/imagetopdf', upload.single('imageFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const filePath = req.file.path;
  const outputFilePath = path.join(__dirname, 'converted', `${path.parse(req.file.originalname).name}.pdf`);

  try {
    const instance = new ILovePDFApi('project_public_783c62bbfd949442ce7e19c8a2f10709_B38Ex3bf5c310c69e174bc6cc34273e62b645', 'secret_key_632c0259f2aeef1993c12d001ac4c622_TeLqVd1a9325e0b0e4ae4958f65e6c040e94d');
    const task = instance.newTask('imagepdf');

    await task.start();
    const file = new ILovePDFFile(filePath);
    await task.addFile(file);
    await task.process();
    const data = await task.download();

    // Ensure the directory exists
    fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
    fs.writeFileSync(outputFilePath, data);

    res.download(outputFilePath);
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send('Error processing file.');
  }
});

app.post('/pdftopdfa', upload.single('pdfFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const filePath = req.file.path;
  const outputFilePath = path.join(__dirname, 'converted', `${path.parse(req.file.originalname).name}.pdf`);

  try {
    const instance = new ILovePDFApi('project_public_783c62bbfd949442ce7e19c8a2f10709_B38Ex3bf5c310c69e174bc6cc34273e62b645', 'secret_key_632c0259f2aeef1993c12d001ac4c622_TeLqVd1a9325e0b0e4ae4958f65e6c040e94d');
    const task = instance.newTask('pdfa');

    await task.start();
    const file = new ILovePDFFile(filePath);
    await task.addFile(file);
    await task.process();
    const data = await task.download();

    // Ensure the directory exists
    fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
    fs.writeFileSync(outputFilePath, data);

    res.download(outputFilePath);
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send('Error processing file.');
  }
});



app.post('/extractpdf', upload.single('pdfFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const filePath = req.file.path;
  const outputFilePath = path.join(__dirname, 'converted', `${path.parse(req.file.originalname).name}.pdf`);

  try {
    const instance = new ILovePDFApi('project_public_783c62bbfd949442ce7e19c8a2f10709_B38Ex3bf5c310c69e174bc6cc34273e62b645', 'secret_key_632c0259f2aeef1993c12d001ac4c622_TeLqVd1a9325e0b0e4ae4958f65e6c040e94d');
    const task = instance.newTask('extract');

    await task.start();
    const file = new ILovePDFFile(filePath);
    await task.addFile(file);
    await task.process();
    const data = await task.download();

    // Ensure the directory exists
    fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
    fs.writeFileSync(outputFilePath, data);

    res.download(outputFilePath);
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send('Error processing file.');
  }
});

// Handle file downloads
app.get('/download/', (req, res) => {
const filePath = path.join(__dirname, 'converted', req.params.filename);
res.download(filePath);
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
