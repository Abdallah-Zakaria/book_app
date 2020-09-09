'use strict';

const express = require('express');
const superagent = require('superagent');
require('dotenv').config();
const pg = require('pg');
const methodOverride = require("method-override")

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static('./public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded());
app.use((methodOverride("_method")))


const client = new pg.Client(process.env.DATABASE_URL);

let arrayBooks = [];


app.get('/', homePage);
app.get('/searches/new', newSearches);
app.get('/hello', testPage)
app.post('/searches', search);
app.get('/searches/show', showSearch)
app.get("/books/:id", viewDetailsBook)
app.post("/books", addBookToDB)
app.put("/books/:id", updateBookDetails)
app.delete("/books/:id", deleteBookFromDB)
app.get('/error', ((req, res) => {
    res.render('pages/error');
}))

function homePage(req, res) {
    let SQL = `SELECT * FROM books;`
    client.query(SQL)
        .then(result => {
            res.render("pages/index", { data: result.rows });
        })
        .catch(() => {
            let whyNotWork = "Can't load database";
            console.log(whyNotWork)
            res.status(500).render("pages/error", { data: whyNotWork });
        })
}

function newSearches(req, res) {
    res.render('pages/searches/new')
}

async function search(req, res) {
    arrayBooks = []
    let searchType = req.body.searchType;
    let textSearch = req.body.search;
    let url = `https://www.googleapis.com/books/v1/volumes?q=${searchType}:${textSearch}`;
    await superagent.get(url)
        .then(result => {
            result.body.items.forEach(item => {
                new Book(item);
            })
            res.redirect("searches/show");
        })
        .catch(() => {
            let whyNotWork ="Can't find any data about your search."
            console.log(whyNotWork)
            res.status(500).redirect("pages/error" , {data : whyNotWork})
        })

}

function showSearch(req, res) {
    res.render("pages/searches/show", { data: arrayBooks })
}

async function viewDetailsBook(req, res) {
    let bookshelfArray = []
    let idSelected = req.params.id;
    let SQL1 = `SELECT * FROM books WHERE id =$1 `
    let SQL2 = `SELECT DISTINCT bookshelf FROM books`
    let values1 = [idSelected]
    await client.query(SQL2)
        .then((result1) => {
            bookshelfArray = result1.rows;
        })
    client.query(SQL1, values1)
        .then(result2 => {
            res.render("pages/books/show", { data: result2.rows[0], data2: bookshelfArray })
        })
        .catch(() => {
            let whyNotWork = "Can't load details.";
            console.log(whyNotWork);
            res.status(500).render("pages/error", { data: whyNotWork });
        })
}

function addBookToDB(req, res) {
    let indexOfBook = req.body.key
    let bookSelect = arrayBooks[indexOfBook]

    let SQL = `INSERT INTO books (author, title, isbn, image_url, description, bookshelf) VALUES ($1,$2,$3,$4,$5,$6)`
    let values = [bookSelect.author[0], bookSelect.title, bookSelect.isbn, bookSelect.url, bookSelect.desc, bookSelect.bookshelf[0]]

    let SQL2 = `SELECT * FROM books WHERE isbn=$1`
    let values2 = [bookSelect.isbn]

    client.query(SQL, values)
        .then(() => {
            client.query(SQL2, values2)
                .then((result) => {
                    let id = result.rows[0].id
                    res.redirect(`/books/${id}`);
                })
                .catch(() => {
                    let whyNotWork = "Can't update details of the book."
                    console.log(whyNotWork);
                    res.status(500).render("pages/error", { data: whyNotWork });
                })
        })
        .catch(() => {
            console.log("Bookshelf already in DB.")
        })
}

function updateBookDetails(req, res) {
    let index = req.params.id
    let { author, title, isbn, image_url, description, bookshelf } = req.body;
    let SQL = `UPDATE books SET author=$1,title=$2,isbn=$3,image_url=$4,description=$5,bookshelf=$6 WHERE id=$7;`
    let values = [author, title, isbn, image_url, description, bookshelf, index]
    client.query(SQL, values)
        .then(() => {
            res.redirect(`/books/${index}`)
        })
        .catch(error => {
            let whyNotWork = "Can't update details of the book."
            console.log(whyNotWork);
            res.status(500).render("pages/error", { data: whyNotWork });
        })
}

function deleteBookFromDB(req, res) {
    let index = req.params.id
    let SQL = `DELETE FROM books WHERE id=$1;`
    let values = [index];
    client.query(SQL, values)
        .then(() => {
            res.redirect('/')
        })
        .catch(() => {
            let whyNotWork = "Can't delete book."
            console.log(whyNotWork);
            res.status(500).render("pages/error", { data: whyNotWork });
        })
}

function testPage(req, res) { res.render("pages/index"); };


function Book(data) {
    this.url = data.volumeInfo.imageLinks || "";
    if (Object.keys(this.url) != 0) { this.url = this.url.thumbnail } else { this.url = "https://i.imgur.com/J5LVHEL.jpg" }
    this.title = data.volumeInfo.title || "Book title not available ";
    this.author = data.volumeInfo.authors || ["Author name not available"];
    this.desc = data.volumeInfo.description || "Descreption not available";
    this.isbn = data.volumeInfo.industryIdentifiers || "";
    if (Object.keys(this.isbn) != 0) { this.isbn = this.isbn[0].identifier } else { this.isbn = "123456789" }
    this.bookshelf = data.volumeInfo.categories || ["Not available."];


    arrayBooks.push(this);
}


app.use("*", (req, res) => {
    res.status(404).redirect("pages/error");
});

app.use((error, req, res) => {
    res.status(500).redirect("pages/error");
});

client.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Listening on ${PORT}`);
        })
    })



