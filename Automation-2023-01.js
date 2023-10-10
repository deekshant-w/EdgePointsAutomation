// ==UserScript==
// @name         Edge Points Automation
// @namespace    http://tampermonkey.net/
// @version      0.11
// @description  Aggregated Edge points automation.
// @author       Deekshant Wadhwa
// @match        https://www.bing.com/*
// @icon         https://cdn-icons-png.flaticon.com/512/539/539548.png
// @grant        GM_setValue
// @grant        GM_getValue
// @noframes
// ==/UserScript==

function waitForElementToDisplay(check, retry, callback, checkFrequencyInMs, timeoutInMs) {
    /*
        Function is async, code is exected even after this function is called.
        Add success/next exectuion function for SUCCESS inside callback.
        ***
        retry -> Execute function before testing
        ↳ it's success affects further execution
        check -> Verify if this function returns true
        ↳ if true, run callback
        ↳ rerun loopSearch
        timeoutInMs -> if function runs for this time after starting -> terminate
        checkFrequencyInMs -> retry after this interval untill timeout (timeoutInMs)
    */
    try{retry();}catch{};
    var startTimeInMs = Date.now();
    (function loopSearch() {
        var checkVar = false;
        try{checkVar=check()}catch{checkVar=false};
            if (checkVar == true) {
                callback();
                return;
            }
            else {
                setTimeout(function () {
                    if (timeoutInMs && Date.now() - startTimeInMs > timeoutInMs){
                        console.log("EXITING");
                        return;
                    }
                    try{retry();}catch{};
                    loopSearch();
                }, checkFrequencyInMs);
            }
    })();
}

function get_db(){
    var db = {};
    db.state = GM_getValue("state", "search");
    return db;
}

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function poll(){
    // Filter is correct debug rest.
    if (document.getElementById("btPollOverlay")){
        document.getElementById("btPollOverlay").firstChild.lastChild.firstChild.childNodes[0].click();
        GM_setValue("stopclicking", "false");
    }
}

function quiz(){
    let retries = 10;
    for(var r=0;r<retries;r++){
        var allGood = true;
        if (document.getElementsByClassName("rqQuestion").length){
            var answers = document.getElementsByClassName("rqQuestion")[0].nextElementSibling.firstChild.lastChild.firstChild.firstChild.firstChild.childNodes;
            for (var i=0; i<answers.length; i++){
                let ele = answers[i];
                console.log(ele);
                let textColor = getComputedStyle(ele.firstChild.lastChild).color;
                console.log(textColor);
                if(textColor !== "rgb(102, 102, 102)") continue;
                let correctness = ele.firstChild.getAttribute("iscorrectoption");
                console.log(correctness);
                if(correctness !== "True") continue;
                ele.firstChild.click();
                let newTextColor = getComputedStyle(ele.firstChild.lastChild).color;
                if(newTextColor == "rgb(102, 102, 102)"){allGood=false;};
            }
        }
    if(allGood){GM_setValue("stopclicking", "false");break};
    }
}

function checkOtherThings(){
    try{
        // Separate poll and quiz storage in memory and execute only that function
        poll();
        quiz();
        GM_setValue("noOtherThing", "true");
    } catch(err){console.log(err)};
}

function clickOnPoints(clickables, check){
    for(var i=0; i<clickables.length;i++){
        var classes = clickables[i].firstChild.firstChild.lastChild.firstChild.lastChild.firstChild.classList;
        var available = true;
        for(var c=0; c<classes.length; c++){
            if (classes[c] === "complete"){
                available = false;
                break
            }
        }
        // if c<classes.length
        if (available){
            try{
                try{
                    let stopClicking = check(clickables[i]);
                    if(stopClicking){
                        GM_setValue("stopclicking", "true");
                    }
                }catch(err){console.log(err)};
                clickables[i].firstChild.click();
            }catch(err){console.log("Cant Click");console.log(err);}
        }
    }
}

function clickTaskExecute(){
    // Check if anything else is open - quiz, poll, etc.
    checkOtherThings();
    // If stopclicking was set true, stop clicking task
    if (GM_getValue("stopclicking", null) == 'true'){
        return
    }
    // Items on the same page
    var clickables = document.getElementById("id_h").childNodes[5].getElementsByTagName("iframe")[0].contentDocument.lastChild.childNodes[1].childNodes[3].firstChild.childNodes[2].lastChild.firstChild.lastChild.firstChild.childNodes;
    // Check type of click task
    function check(ele){
        if(ele.firstChild.firstChild.lastChild.firstChild.firstChild.firstChild.textContent == 'Bonus quiz'){
            console.log("QUIZ");
            return true;
        }
        else if(ele.firstChild.firstChild.lastChild.firstChild.firstChild.firstChild.textContent == 'Daily poll'){
            console.log("POLL");
            return true;
        }
        return false
    }
    try{clickOnPoints(clickables, check)}catch{};
    // Show next page
    document.getElementById("id_h").childNodes[5].getElementsByTagName("iframe")[0].contentDocument.lastChild.childNodes[1].childNodes[3].firstChild.childNodes[2].lastChild.lastChild.lastChild.click();
    // Next Page
    var nextPageClickables = document.getElementById("id_h").childNodes[5].getElementsByTagName("iframe")[0].contentDocument.lastChild.childNodes[1].childNodes[3].firstChild.childNodes[2].lastChild.lastChild.lastChild.firstChild.childNodes;
    try{clickOnPoints(nextPageClickables)}catch{};
    // Top Item Clicks
    //
    // Close reward bar
    document.getElementsByClassName("id_button")[1].click();
    const date = new Date();
    GM_setValue("date", date.getDate().toString());
    console.log('END');
}

function clickTask(){
    function check(){
        return document.getElementById("id_h").childNodes[5].getElementsByTagName("iframe")[0].contentDocument.lastChild.childNodes[1].childNodes[3].firstChild.childNodes[2].lastChild.firstChild.lastChild.firstChild.childNodes;
    }
    function retry(){
        document.getElementsByClassName("id_button")[1].click();
    }
    function callback(){
        clickTaskExecute();
    }
    waitForElementToDisplay(check, retry, callback, 1000, 10000);
}

function searchPoints(pointsBox){
    var botBar = pointsBox.lastChild.firstChild.lastChild;
    var firstCounter = botBar.firstChild.children[0].firstChild.textContent;
    var [reward, total] = firstCounter.split("/");
    reward = parseInt(reward);
    total = parseInt(total);
    console.log(reward, "/", total);
    if(reward<total){
        let searchBar = document.getElementsByTagName("form")[0].lastChild;
        let searchBox = searchBar.firstChild;
        let searchButton = searchBar.childNodes[4].firstChild.firstChild.lastChild;
        searchBox.value = makeid(5) + "-" + reward;
        searchButton.click()
    }
    else{
        clickTask();
    }
}


function stateMachine(){
    let state = DB.state;
    var pointsBox = document.getElementById("id_h").childNodes[5].getElementsByTagName("iframe")[0].contentDocument.lastChild.childNodes[1].childNodes[3].firstChild;
    if(state === "search"){
        searchPoints(pointsBox);
    }else{}
}

function main(){
    //const date = new Date();
    //console.log(GM_getValue("date", null));
    //if (GM_getValue("date", null) == date.getDate().toString() && GM_getValue("noOtherThing",null) == "false"){
    //    if (document.getElementsByTagName("form")[0].lastChild.firstChild.value != 'f'){
    //        return
    //    }
    //}
    console.log("START");
    function check(){
        // Check if Reward button exists.
        return document.getElementById("id_h").childNodes[5].getElementsByTagName("iframe")[0].contentDocument.lastChild.childNodes[1].childNodes[3].firstChild.lastChild.firstChild.lastChild;
    }
    function retry(){
        // If the button exists, try clicking it.
        document.getElementsByClassName("id_button")[1].click();
    }
    function callback(){
        // If it's clicked, start further executions.
        // Close the bar first.
        document.getElementsByClassName("id_button")[1].click();
        stateMachine();
    }
    waitForElementToDisplay(check, retry, callback, 1000, 10000);
}

var DB = get_db()
(function() {
    'use strict';
    window.addEventListener('load', function () {
        main();
    })
})();