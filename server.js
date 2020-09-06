'use strict';

const express = require('express');
const superagent = require('superagent');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static('./public'));
app.set('view engine','ejs');
app.use(express.urlencoded());

let arrayBooks = [];

app.get('/',homePage);
app.get('/searches/new',newSearches);
app.get('/hello', testPage)
app.post('/searches', search);
app.get('/searches/show', showSearch)

function homePage(req,res) {
    res.render("pages/index");
}

function newSearches(req,res){
    // console.log(res.body);
    res.render('pages/searches/new')
}

async function search(req,res){
    let searchType = req.body.searchType;
    let textSearch = req.body.search;
    let url = `https://www.googleapis.com/books/v1/volumes?q=${searchType}:${textSearch}`;
    await superagent.get(url)
    .then(result =>{
        result.body.items.forEach(item =>{
        new Book(item);
        })
        console.log(arrayBooks);
        res.redirect("searches/show");
    })
    .catch(error =>{
        console.log("Error | Can't find any data about your search.")
        res.status(500).redirect("pages/error")
    })

}

function showSearch(req,res) {
    
    res.render("pages/searches/show", {data:arrayBooks})
}


function testPage(req,res){res.render("pages/index");};


function Book(data){
    this.url = data.volumeInfo.imageLinks || "";
    if(Object.keys(this.url) != 0){this.url = this.url.thumbnail}else{this.url = "https://i.imgur.com/J5LVHEL.jpg"}
    this.title = data.volumeInfo.title || "Book title not available ";
    this.author = data.volumeInfo.authors || "Author name not available";
    this.desc = data.volumeInfo.description || "Descreption not available";
    this.isbn = data.volumeInfo.industryIdentifiers || "";
    if(Object.keys(this.isbn) != 0){this.isbn = this.isbn[0].identifier}else{this.isbn = "123456789"}
    this.bookshelf = data.volumeInfo.categories || "Not available.";

    arrayBooks.push(this);
}

app.use("*", (req, res) => {
    res.status(404).redirect("pages/error");
});

app.use((error, req, res) => {
    res.status(500).redirect("pages/error");
});

app.listen(PORT,()=>{
    console.log(`Listening on ${PORT}`);
})