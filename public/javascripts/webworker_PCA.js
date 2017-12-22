
function jobFunction(numbers) {
    var res = {}, 
    ret = {},
    diag = [], 
    idem_matrix = [], 
    X = numbers,
    lambda, U,
    colMeans = mean(numbers);
    for(var i = 0; i < numbers.length; i++ ) {
        diag.push(1 - 1.0 / numbers.length);
    }
    idem_matrix = numeric.diag(diag);
    ret = numeric.svd(numeric.dot(idem_matrix, X));
    U = ret.V;
    lambda = numeric.diag(ret.S);
    res.colMeans = colMeans;
    res.lambda = lambda;
    res.U = U;
    console.log("lambda is ", res.lambda);
    return res;

}

//compute column mean of matrix A
function mean(A) { return numeric.div(numeric.add.apply(null, A), A.length); }

console.log("web worker!");


if( 'function' === typeof importScripts) {
   importScripts('https://cdnjs.cloudflare.com/ajax/libs/numeric/1.2.6/numeric.min.js');
   addEventListener('message', onMessage);  
}


function onMessage(e) { 
     // do some work here 
     if(e.data == "run") {
        self.postMessage("ready");
        console.log("hello");
    }
    else {
        var procData = {};
        procData.data = jobFunction(e.data.data);
        procData.no = e.data.no;
        self.postMessage(procData);
        self.postMessage("ready");
    }
}  
// self.addEventListener('message', function(e) {
//     if(e.data == "run") {
//         self.postMessage("ready");
//         console.log("hello");
//     }
//     else {
//         var procData = {};
//         procData.data = jobFunction(e.data.data);
//         procData.no = e.data.no;
//         self.postMessage(procData);
//         self.postMessage("ready");
//     }
// }, false);



