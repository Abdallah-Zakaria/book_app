'use strict';

const express = require('express');
const superagent = require('superagent');
require('dotenv').config();
const pg = require('pg');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static('./public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded());


const client = new pg.Client(process.env.DATABASE_URL);

let arrayBooks = [];

app.get('/', homePage);
app.get('/searches/new', newSearches);
app.get('/hello', testPage)
app.post('/searches', search);
app.get('/searches/show', showSearch)
app.get("/books/:id", savedBooks)
app.post("/books", addSeavedToDb)


function homePage(req, res) {
    let SQL = `SELECT * FROM books;`
    client.query(SQL)
        .then(result => {
            // console.log(result)
            res.render("pages/index", { data: result.rows });
        })
    // res.render("pages/index")
}

function newSearches(req, res) {
    // console.log(res.body);
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
            // console.log(arrayBooks);
            res.redirect("searches/show");
        })
        .catch(error => {
            console.log("Error | Can't find any data about your search.")
            res.status(500).redirect("pages/error")
        })

}

function showSearch(req, res) {
    res.render("pages/searches/show", { data: arrayBooks })
}

function savedBooks(req, res) {
    let idSelected = req.params.id;
    let SQL = `SELECT * FROM books WHERE id =$1 `
    let values = [idSelected]
    client.query(SQL, values)
        .then(result => {
            res.render("pages/books/show", { data: result.rows[0] })
        })
}

function addSeavedToDb(req, res) {
    let indexOfBook = req.body.key
    console.log(indexOfBook)
    let bookSelect = arrayBooks[indexOfBook]
    // console.log(bookSelect.title)
    // console.log(bookSelect.book.author)

    let SQL = `INSERT INTO books (author, title, isbn, image_url, description, bookshelf) VALUES ($1,$2,$3,$4,$5,$6)`
    let values = [bookSelect.author, bookSelect.title, bookSelect.isbn, bookSelect.url, bookSelect.desc,  bookSelect.bookshelf]
    client.query(SQL,values)
    .then(()=>{
        res.redirect('/');
    })
}


function testPage(req, res) { res.render("pages/index"); };


function Book(data) {
    this.url = data.volumeInfo.imageLinks || "";
    if (Object.keys(this.url) != 0) { this.url = this.url.thumbnail } else { this.url = "https://i.imgur.com/J5LVHEL.jpg" }
    this.title = data.volumeInfo.title || "Book title not available ";
    this.author = data.volumeInfo.authors || "Author name not available";
    this.desc = data.volumeInfo.description || "Descreption not available";
    this.isbn = data.volumeInfo.industryIdentifiers || "";
    if (Object.keys(this.isbn) != 0) { this.isbn = this.isbn[0].identifier } else { this.isbn = "123456789" }
    this.bookshelf = data.volumeInfo.categories || "Not available.";


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



