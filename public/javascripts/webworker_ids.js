function jobFunction_web(numbers) {
    var res = {}, 
    matrix = numbers,
    variance = new Array(matrix[0].length),
    rows = numbers.length,
    colMeans = mean(numbers);
    res.mean = colMeans;
    for (var i = 0; i < matrix.length; i++) {
        matrix[i] -= colMeans;
    }
    matrix = numeric.transpose(matrix);
    for (var i = 0; i < matrix.length; i++) {
        variance[i] = numeric.div(numeric.norm2Squared(matrix[i]), rows);
    }
    res.variance = variance;
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
        procData.data = jobFunction_web(e.data.data);
        procData.no = e.data.no;
        console.log(procData.data);
        self.postMessage(procData);
        self.postMessage("ready");
    }
}  



