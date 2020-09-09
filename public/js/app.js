$("#formUpdate").hide();

$('#updateBtn').click(function () {
    $("#formUpdate").toggle();
    console.log("im in")
})

function openForm() {
    document.getElementById("formUpdate").style.display = "block";
    document.getElementById("formBG").style.display = "block";
}
function closeForm() {
    document.getElementById("formUpdate").style.display = "none";
    document.getElementById("formBG").style.display = "none";
}