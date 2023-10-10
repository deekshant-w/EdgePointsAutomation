// ==UserScript==
// @name         Edge MCQ
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Solve quiz if quiz exist
// @author       You
// @match        https://www.bing.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @grant        none
// @run-at       document-idle
// ==/UserScript==

window.setTimeout(function(){
    if (document.getElementsByClassName("rqQuestion") !== null){
        var answers = document.getElementsByClassName("rqQuestion")[0].nextElementSibling.firstChild.lastChild.firstChild.firstChild.firstChild.childNodes;
        for (var i=0; i<answers.length; i++){
            let ele = answers[i];
            let textColor = getComputedStyle(ele.firstChild.lastChild).color
            if(textColor !== "rgb(102, 102, 102)") continue;
            let correctness = ele.firstChild.getAttribute("iscorrectoption")
            if(correctness !== "True") continue;
            ele.firstChild.click();
        }
    }
}, 2000);