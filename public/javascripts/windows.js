console.log("click");

$(document).ready(function(){
$(".btnminimize").click(function(){
    $(this).toggleClass("btn-plus");
    $(".header").slideToggle();
});
});


// progress bar

function move(number) {
    var elem = document.getElementById("myBar"); 
    var width = 0;
    width = number;
    elem.style.width = width + '%';
    document.getElementById("ProgressRatio").innerHTML = width * 1  + '% Completed!'; 
}