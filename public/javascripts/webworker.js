function jobFunction(numbers) {
    var res = [],
        para1 = 1.5, para2 = 2;
    numbers.forEach(function(number){
        var number1 = number[0],
            number2 = number[1];
            res.push([para1 * number1,
                    para2 * number2]);
    });
    return res;

}

console.log("web worker!");


self.addEventListener('message', function(e) {
    if(e.data == "run") {
        self.postMessage("ready");
    }
    else {
        var procData = {};
        procData.data = jobFunction(e.data.data);
        procData.no = e.data.no;
        self.postMessage(procData);
        self.postMessage("ready");
    }
}, false);



