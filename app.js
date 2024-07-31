// Import required modules
const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const bodyParser = require('body-parser');

// Create an instance of the express app
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Keep the original file name
    }
});

// Initialize the multer middleware with the storage configuration
const upload = multer({ storage: storage });

// Create MySQL connection
const connection = mysql.createConnection({
    // host: 'localhost',
    // user: 'root',
    // password: '',
    // database: 'c237_cardcollectorapp'
    host: 'db4free.net',
    user: 'annabelle',
    password: 'AnnabelleCardApp',
    database: 'cardcollectorapp'
});

// Connect to database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL', err);
        return;
    }
    console.log('Connected successfully to database');
});

// Setup view engine
app.set('view engine', 'ejs');

// Enable static files
app.use(express.static('public'));

// Enable form processing
app.use(express.urlencoded({ extended: false }));

// Helper function to format categories
function formatCategory(category) {
    if (category.toLowerCase() === 'pokémon' || category.toLowerCase() === 'pokemon') {
        return 'Pokémon';
    } else {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
}

app.get("/", (req, res) => {
    const category = req.query.category;
    let sql = "SELECT * FROM cards";
    let params = [];

    if (category) {
        sql += " WHERE category = ?";
        params.push(category);
    }

    connection.query(sql, params, (err, result) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err.message);
        }

        // Preprocess the categories
        result.forEach(card => {
            card.category = formatCategory(card.category);
        });

        res.render("index", { cards: result, category: category });
    });
});

// Example route in Express.js
app.get('/card/:cardId', (req, res) => {
    const cardId = req.params.cardId;
    const sql = "SELECT * FROM cards WHERE cardId = ?";
    connection.query(sql, [cardId], (err, result) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err.message);
        }
        if (result.length === 0) {
            return res.status(404).send("Card not found");
        }
        const card = result[0];
        res.render('card', { card: card });
    });
});

// --------- [C] create new card -----------
// GET route to render the form for adding a new card
app.get('/addCard', (req, res) => {
    res.render('addCard');
});

// POST route to handle form submission for adding a new card
app.post('/addCard', upload.single('image'), (req, res) => {
    const { name, edition, category, value, quantity } = req.body;
    const image = req.file.filename;

    const sql = "INSERT INTO cards (cardName, edition, category, value, quantity, image) VALUES (?, ?, ?, ?, ?, ?)";
    connection.query(sql, [name, edition, category, value, quantity, image], (err, result) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err.message);
        }
        res.redirect('/');
    });
});

// --------- [U] update card -----------
app.post('/editCard/:cardId', upload.single('image'), (req, res) => {
    const cardId = req.params.cardId;
    const { name, edition, category, value, quantity } = req.body;
    const image = req.file ? req.file.filename : req.body.currentImage;

    const sql = "UPDATE cards SET cardName = ?, edition = ?, category = ?, value = ?, quantity = ?, image = ? WHERE cardId = ?";
    connection.query(sql, [name, edition, category, value, quantity, image, cardId], (err, result) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err.message);
        }
        res.redirect('/');
    });
});

// --------- [D] delete card -----------
app.get('/deleteCard/:cardId', (req, res) => {
    const cardId = req.params.cardId;

    const sql = "DELETE FROM cards WHERE cardId = ?";
    connection.query(sql, [cardId], (err, result) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err.message);
        }
        res.redirect('/');
    });
});

// --------- display card by ID for edit operation -----------
app.get("/editCard/:cardId", (req, res) => {
    const cardId = req.params.cardId;
    const sql = "SELECT * FROM cards WHERE cardId = ?";
    connection.query(sql, [cardId], (err, result) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err.message);
        }
        if (result.length === 0) {
            return res.status(404).send("Card not found");
        }
        res.render("editCard", { card: result[0] });
    });
});

// Search route
app.get('/search', (req, res) => {
    const query = req.query.q; // Get the search query from query parameters

    // Query to fetch cards from database based on search query
    const sql = "SELECT * FROM cards WHERE cardName LIKE ? OR category LIKE ?";
    const searchTerm = `%${query}%`; // To search for partial matches

    connection.query(sql, [searchTerm, searchTerm], (err, result) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err.message);
        }
        // Preprocess the categories
        result.forEach(card => {
            card.category = formatCategory(card.category);
        });

        // Render search results
        res.render('search', { cards: result, query: query });
    });
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
  });
  
// Handle the login form submission
app.post('/login', (req, res) => {
    const { email, password } = req.body;
  
    // Perform authentication logic here
    // (e.g., check against a database, verify credentials)
  
    // Example authentication logic
    if (email === 'admin@example.com' && password === 'password') {
      // Redirect to a dashboard or home page
      res.redirect('/dashboard');
    } else {
      // Render an error message
      res.render('login.ejs', { error: 'Invalid email or password' });
    }
});
  
app.get('/dashboard', (req, res) => {
    // Render the dashboard page
    res.render('dashboard.ejs');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', upload.single('image'), (req, res) => {
    const { name, username, email, password } = req.body;
    const sql = "INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)";
    connection.query(sql, [name, username, email, password], (err, result) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err.message);
        }
        res.redirect('/login');
    });
});


// GET route to fetch user details by userId
app.get('/user/:userId', (req, res) => {
    const userId = req.params.userId; // Retrieve userId from URL params

    // Example SQL query to fetch user details by userId
    const sql = "SELECT * FROM users WHERE userId = ?";
    connection.query(sql, [userId], (err, result) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err.message);
        }
        if (result.length === 0) {
            return res.status(404).send("User not found");
        }
        const user = result[0];
        res.json({ user: user });
    });
});


// POST route to add a new user
app.post('/user', upload.single('avatar'), (req, res) => {
    const { name, username, email, password } = req.body;
    const avatar = req.file ? `/images/${req.file.filename}` : null;

    // Example SQL query to insert a new user into the database
    const sql = "INSERT INTO users (name, username, email, password, avatar) VALUES (?, ?, ?, ?, ?)";
    connection.query(sql, [name, username, email, password, avatar], (err, result) => {
        if (err) {
            return res.status(500).send("An error occurred: " + err.message);
        }
        res.status(201).send("User added successfully");
    });
});

// Example route for category filtering
app.get('/category', (req, res) => {
    const category = req.query.category; // Get the category from query params
    // Implement logic to fetch cards based on category
    const cards = []; // Fetch cards based on category from your database
    res.render('category', { category, cards });
});


// Listen on port 3000
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
