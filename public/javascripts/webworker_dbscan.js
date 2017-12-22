function jobFunction_web(numbers, index) {
    var res = new Array(index[1] - index[0] + 1);
    for(var i = index[0]; i <= index[1]; i++ ) {
        res[i - index[0]] = new Array(numbers.length).fill(0);
        for (var j = Math.max(i, 0) + 1; j < numbers.length; j++) {
            res[i - index[0]][j] = distance(numbers[i], numbers[j]);
        } 
    }
    // console.log("res is ", res);
    return res;
}

function distance(p, q) {
    var sum = 0;
    var i = Math.min(p.length, q.length);

    while (i--) {
        sum += (p[i] - q[i]) * (p[i] - q[i]);
    }
    return Math.sqrt(sum);
}

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
        var index = [(e.data.no[0] - 1) * e.data.no[1], e.data.no[0] * e.data.no[1] - 1];
        procData.data = jobFunction_web(e.data.data, index);
        procData.no = e.data.no;
        // console.log(procData.data);
        self.postMessage(procData);
        self.postMessage("ready");
    }
}  



