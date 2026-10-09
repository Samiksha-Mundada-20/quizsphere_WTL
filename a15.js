const express = require("express");
const mysql = require("mysql2");

const app = express();
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "wtl"
});

function databaseError(res, err) {
    console.error("Database query failed:", err.message);
    res.status(500).json({ error: "Database query failed" });
}

function readStudent(req, res) {
    const { name, email } = req.body || {};

    if (typeof name !== "string" || !name.trim() ||
        typeof email !== "string" || !email.trim()) {
        res.status(400).json({ error: "name and email are required" });
        return null;
    }

    return { name: name.trim(), email: email.trim() };
}

function readStudentId(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: "id must be a positive integer" });
        return null;
    }

    return id;
}

// GET
app.get("/students", (req, res) => {
    db.query("SELECT * FROM students", (err, result) => {
        if (err) return databaseError(res, err);
        res.json(result);
    });
});

// POST
app.post("/students", (req, res) => {
    const student = readStudent(req, res);
    if (!student) return;

    db.query(
        "INSERT INTO students(name,email) VALUES(?,?)",
        [student.name, student.email],
        err => {
            if (err) return databaseError(res, err);
            res.status(201).json({ message: "Student added" });
        }
    );
});

// PUT
app.put("/students/:id", (req, res) => {
    const id = readStudentId(req, res);
    if (id === null) return;

    const student = readStudent(req, res);
    if (!student) return;

    db.query(
        "UPDATE students SET name=?, email=? WHERE id=?",
        [student.name, student.email, id],
        (err, result) => {
            if (err) return databaseError(res, err);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Student not found" });
            }
            res.json({ message: "Student updated" });
        }
    );
});

// DELETE
app.delete("/students/:id", (req, res) => {
    const id = readStudentId(req, res);
    if (id === null) return;

    db.query(
        "DELETE FROM students WHERE id=?",
        [id],
        (err, result) => {
            if (err) return databaseError(res, err);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Student not found" });
            }
            res.json({ message: "Student deleted" });
        }
    );
});

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({ error: "Request body must be valid JSON" });
    }
    console.error("Request failed:", err.message);
    res.status(500).json({ error: "Request failed" });
});

db.connect(err => {
    if (err) {
        console.error(`Could not connect to MySQL (${err.code || "unknown error"}): ${err.message || String(err)}`);
        console.error("Check that MySQL is running and MYSQL_HOST, MYSQL_USER, and MYSQL_PASSWORD are correct.");
        process.exit(1);
    }

    console.log("MySQL connected to database:", process.env.MYSQL_DATABASE || "wtl");
    const port = Number(process.env.PORT) || 5000;
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});