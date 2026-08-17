const fs = require('fs');


let rawData = fs.readFileSync('package.json');
let data = JSON.parse(rawData);

console.log(data);