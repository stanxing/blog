function outputAccessLog(count) {
    let access = `{
        "type" : "access",
        "method" : "GET",
        "url" : "/mocker",
        "remoteAddr" : "127.0.0.1",
        "responseStatus" : 200,
        "responseTime" : 0.01,
        "upstreamResponseTime" : 0.01,
        "timeUnit" : "s",
        "referr" : "http//referrr",          
        "userAgent" : "agent",
        "body": "1",
        "responseBodySize" : ${count},
        "reqId": "reqId"
    }`
    console.log(format(access))
}

function format(str) {
    str = str.replace(/\ +/g, "")
    str = str.replace(/[ ]/g, "")
    return str.replace(/[\r\n]/g, "")
}

function start() {
    var total = process.env.TOTAL || 1000000
    var count = 0;
    const startTime = new Date().getTime();
    while (true) {
        outputAccessLog(count);
        count ++;
        if (count > total) {
            break;
        }
    }
    const endTime = new Date().getTime();
    console.log('time: ', startTime, endTime);
    console.log('interval:', endTime - startTime, 'ms');
    console.log('count:', count);
}

start();