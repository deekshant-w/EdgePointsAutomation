// ==UserScript==
// @name         Edge Updated
// @namespace    https://www.bing.com/
// @version      0.2
// @description  Edge Automation
// @author       You
// @match        https://www.bing.com/search*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

function choose(choices) {
    var index = Math.floor(Math.random() * choices.length);
    return choices[index];
  }

function Debug(DEBUG){
    if (DEBUG){
        let log = (...arg) => {
            console.log(...arg);
            // append to a log file
            let logFile = GM_getValue("logFile", "");
            logFile += arg + "\n";
            GM_setValue("logFile", logFile);
        }
        return log;
    }
    let nothing = (arg)=>(arg);
    return nothing;
}

function sleep(ms) {
    // use as await sleep(10000);
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitTill(
    waitBetweenTrials, maxTries, waitBetweenDoAndCheck, 
    doFunction, doFunctionArgs, 
    checkFunction, checkFunctionArgs){
    // checkFunction returns 2 values -> status, result
    let debug = Debug(true);
    var status, res;
    for (let i=0;i<maxTries;i++){
        [status, res] = await doFunction(...doFunctionArgs);
        debug('do',i,status, res);
        await sleep(waitBetweenDoAndCheck);
        if (status == false){
            await sleep(waitBetweenTrials);
            continue;
        }
        [status, res] = await checkFunction(...checkFunctionArgs);
        debug('check',i,status, res);
        if (status == true){
            return [true, res];
        }
        await sleep(waitBetweenTrials);
    }
    return [false, false];
}

async function openRewardsBox(){
    let debug = Debug(true);
    await waitTill(
        1000,
        4,
        2000,
        ()=>{
            let header = document.getElementsByTagName("header");
            debug("header", header);
            if (header.length == 0){
                return [false, 'no header'];
            }
            header = header[0];
            let rewardButtonZone = header.children[2];
            debug("rewardButtonZone", rewardButtonZone);
            let rewardButtons = rewardButtonZone.getElementsByTagName('a');
            debug("rewardButtons", rewardButtons);
            if (rewardButtons.length == 0){
                return [false, 'no rewardButtons'];
            }
            // iterate over rewardButtons and find the one with aria-Lable="Microsoft Rewards"
            let rewardButton, i;
            for (i=0;i<rewardButtons.length;i++){
                rewardButton = rewardButtons[i];
                let ariaLabel = rewardButton.getAttribute("aria-label");
                if (ariaLabel && rewardButton.getAttribute("aria-label").toLowerCase().includes("microsoft rewards")){
                    break;
                }
            }
            if (i == rewardButton.length){
                return [false, 'no rewardButton with aria-label="Microsoft Rewards"'];
            }
            debug("rewardButton", rewardButton);
            rewardButton.click();
            return [true, rewardButton];
        },
        [],
        ()=>{
            let rewardsPanelContainer = document.getElementById("rewardsLoadingAnimation");
            debug("rewardsPanelContainer", rewardsPanelContainer, rewardsPanelContainer==null);
            if (rewardsPanelContainer == null){
                return [false, 'no rewardsPanelContainer'];
            }
            let classList = rewardsPanelContainer.classList;
            debug("classList", classList);
            if (classList.contains("b_hide")){
                return [true, classList];
            }
            return [false, 'no b_hide'];
        },
        []
    );
}

function getRewards(){
    let debug = Debug(true);
    let rewardsPanelContainer = document.querySelectorAll("#rewardsPanelContainer");
    debug("rewardsPanelContainer", rewardsPanelContainer);
    if (rewardsPanelContainer.length == 0){
        return [false, 'no rewardsPanelContainer'];
    }
    rewardsPanelContainer = rewardsPanelContainer[0];
    let iframe = rewardsPanelContainer.getElementsByTagName("iframe");
    debug("iframe", iframe);
    if (iframe.length == 0){
        return [false, 'no iframe'];
    }
    iframe = iframe[0].contentDocument;
    debug("iframe", iframe);
    let rewards = iframe.querySelectorAll(".promo_cont");
    debug("rewards", rewards);
    return [true, rewards];
}

function getRewardUUID(reward){
    let debug = Debug(true);
    debug("reward", reward);
    let divs = reward.getElementsByTagName("div");
    let uuid, i, innerText;
    debug("divs", divs);
    debug("divs.length", divs.length);
    for (i=0;i<divs.length;i++){
        innerText = divs[i].innerText;
        if (innerText){
            uuid = innerText;
            break;
        }
    }
    if (i == divs.length){
        return [false, 'no uuid'];
    }
    return [true, uuid];
}

function getNumberFromString_forRandomSearch(str){
    let debug = Debug(true);
    debug("getNumberFromString_forRandomSearch", str);
    let arr = str.split(" ");
    debug("arr", arr);
    let number=-1;
    for (let i=0;i<arr.length;i++){
        let num = parseInt(arr[i]);
        if (num){
            number = num;
            break;
        }
    }
    debug("number", number);
    return number;
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

(async function() {
    'use strict';
    GM_setValue("logFile", "");
    console.log("Beginning script - A");
    let debug = Debug(true);
    // Open rewards box
    let openRewardsBoxStatus, openRewardsBoxResult = await openRewardsBox();
    debug("openRewardsBox", openRewardsBoxStatus, openRewardsBoxResult);
    // Get the list of rewards
    let rewards = getRewards();
    debug("rewards", rewards);
    if (rewards[0] == false){
        return;
    }
    rewards = rewards[1];
    let fallGracefully = false;

    // Get current state
    let overlay = await waitTill(
        0,
        3,
        500,
        ()=>[true, true],
        [],
        ()=>{
            let overlay = document.getElementById("overlayWrapper");
            debug("overlay event", overlay);
            if (overlay == null){
                return [false, 'no overlay'];
            }
            return [true, overlay];
        },
        []
    )
    debug("overlay await", overlay);
    // Some task is open
    if (overlay[0]){
        debug("overlay", overlay);
        // <------------ pollTitle1 ---------------------><pollTitle2><pollTitle3><pollTitle4><pollTitle5><pollTitle6><pollTitle7><8><pollTitle>
        // document.querySelectorAll(".TriviaOverlayData")[0].children[0].children[0].children[0].children[0].children[0].children[0].innerText
        // POLL
        let pollTitle1, pollTitle2, pollTitle3, pollTitle4, pollTitle5, pollTitle6, pollTitle7, pollTitle8, pollTitle;
        pollTitle1 = document.querySelectorAll(".TriviaOverlayData");
        debug("pollTitle1", pollTitle1);
        if (pollTitle1.length > 0){
            debug("pollTitle1", pollTitle1[0]);
            pollTitle2 = pollTitle1[0].children;
            debug("pollTitle2", pollTitle2);
            if (pollTitle2.length > 0){
                debug("pollTitle2", pollTitle2[0]);
                pollTitle3 = pollTitle2[0].children;
                debug("pollTitle3", pollTitle3);
                if (pollTitle3.length > 0){
                    debug("pollTitle3", pollTitle3[0]);
                    pollTitle4 = pollTitle3[0].children;
                    debug("pollTitle4", pollTitle4);
                    if (pollTitle4.length > 0){
                        debug("pollTitle4", pollTitle4[0]);
                        pollTitle5 = pollTitle4[0].children;
                        debug("pollTitle5", pollTitle5);
                        if (pollTitle5.length > 0){
                            debug("pollTitle5", pollTitle5[0]);
                            pollTitle6 = pollTitle5[0].children;
                            debug("pollTitle6", pollTitle6);
                            if (pollTitle6.length > 0){
                                debug("pollTitle6", pollTitle6[0]);
                                pollTitle7 = pollTitle6[0].children;
                                debug("pollTitle7", pollTitle7);
                                if (pollTitle7.length > 0){
                                    pollTitle8 = pollTitle7[0];
                                    debug("pollTitle8", pollTitle8);
                                    pollTitle = pollTitle8.innerText;
                                    debug("pollTitle", pollTitle);
                                }
                            }
                        }
                    }
                }
            }
        }

        if (pollTitle1 && 
            pollTitle2 &&
            pollTitle3 &&
            pollTitle4 &&
            pollTitle5 &&
            pollTitle6 &&
            pollTitle7 &&
            pollTitle8 &&
            pollTitle  && 
            pollTitle.toLowerCase().includes("poll")){
            // It is a poll
            // <----------------------- pollTitle6 ----------------------------------------------------------------------><pollTitle7><8><pollTitle>
            // document.querySelectorAll(".TriviaOverlayData")[0].children[0].children[0].children[0].children[0].children[0].children[0].innerText
            // document.querySelectorAll(".TriviaOverlayData")[0].children[0].children[0].children[0].children[0].children[1].children[0];
            let option1 = pollTitle6;
            debug("option1", option1);
            if (option1.length > 1){
                option1 = option1[1].children;
                debug("option1-2", option1);
                if (option1.length > 0){
                    option1 = option1[0];
                    debug("option1-3", option1);
                    if (option1){
                        option1.click();
                    }
                }
            }
        } 
        
        // QUIZ
        let quizContainer = document.getElementById("quizWelcomeContainer");
        debug("quizContainer", quizContainer);
        if (quizContainer != null){
            let startQuiz = quizContainer.getElementsByTagName("input");
            debug("startQuiz", startQuiz);
            if (startQuiz.length > 0){
                // It is a quiz
                // Press start quiz button
                for (let i=0;i<=3;i++){
                    // Try pressing start quiz button
                    try{
                        startQuiz[0].click();
                        break;
                    } catch (e){
                        // If it fails, wait for 1 second and try again
                        await sleep(1000);
                    }
                }
                await sleep(1000);
            } else {debug("no startQuiz button");fallGracefully = true;}
        } else {debug("no quizContainer");fallGracefully = true;}
    } 
    // Quiz is already open
    // let quizOptionsAll = document.getElementById("currentQuestionContainer").firstChild.lastChild.firstChild.lastChild.firstChild.firstChild.firstChild.children;
    // debug("quizOptionsAll", quizOptionsAll);
    let correctOptionsAll = document.querySelectorAll("[iscorrectoption='True']");
    for (let i=0;i<correctOptionsAll.length;i++){
        let correctOption = correctOptionsAll[i];
        debug("correctOption", correctOption);
        let backgroundColor = window.getComputedStyle(correctOption).backgroundColor;
        debug("backgroundColor", backgroundColor);
        if (backgroundColor == "rgb(255, 255, 255)"){
            correctOption.click();
            await sleep(1000);
        }
    }

    // Single choice MCQ is already open
    let singleChoiceMCQOptionsAll_infiniteLoopPrevention = 20;
    while (true){
        singleChoiceMCQOptionsAll_infiniteLoopPrevention--;
        if (singleChoiceMCQOptionsAll_infiniteLoopPrevention <= 0){break;}
        let singleChoiceMCQOptionsAll = document.getElementsByClassName("rq_button");
        let i;
        debug("singleChoiceMCQOptionsAll", singleChoiceMCQOptionsAll);
        for (i=0;i<singleChoiceMCQOptionsAll.length;i++){
            let singleChoiceMCQOption = singleChoiceMCQOptionsAll[i].firstChild.firstChild;
            debug("singleChoiceMCQOption", singleChoiceMCQOption);
            let borderColor = window.getComputedStyle(singleChoiceMCQOption).borderColor;
            debug("borderColor", borderColor);
            if (borderColor == 'rgb(255, 0, 0)'){
                debug("borderColor continue");
                continue;
            }
            singleChoiceMCQOption.click();
            await sleep(1000);
            break;
        }
        if (i >= singleChoiceMCQOptionsAll.length){
            break;
        }
    }
        

    
    // No task is open
    if (fallGracefully == true){await sleep(1000);}
    for (let i=0;i<rewards.length;i++){
        let reward = rewards[i];
        let rewardUUID = getRewardUUID(reward)[1];
        debug("reward", reward, rewardUUID);
        let previousRewardUUID = GM_getValue("previousRewardUUID", "");
        let checkMark = reward.getElementsByClassName("checkMark");
        debug("checkMark", checkMark);
        debug("previousRewardUUID", previousRewardUUID)
        /////////////////////////////
        // random search task
        /////////////////////////////
        if (reward.children[0].href==="https://www.bing.com/"){
            let randoC1 = reward.querySelectorAll(".promo_card")[0].lastChild.firstChild;
            debug("randoC1", randoC1);
            randoC1 = randoC1.innerText;
            debug("randoC1 innerText", randoC1);
            let randoC1Number = getNumberFromString_forRandomSearch(randoC1);
            debug("randoC1Number", randoC1Number);
            let randoC2 = reward.querySelectorAll(".promo_card")[0].lastChild.lastChild;
            debug("randoC2", randoC2);
            randoC2 = randoC2.innerText;
            debug("randoC2 innerText", randoC2);
            let randoC2Number = getNumberFromString_forRandomSearch(randoC2);
            debug("randoC2Number", randoC2Number);
            debug("randoC1Number != randoC2Number", randoC1Number != randoC2Number);
            if (randoC1Number == -1 || randoC2Number == -1){
                debug("randoC1Number == -1 || randoC2Number == -1", randoC1Number, randoC2Number);
            }
            else if (randoC1Number != randoC2Number){
                // Edit the search box
                debug("search box initial value", document.getElementsByTagName("form")[0].childNodes[1].children[2].value)
                document.getElementsByTagName("form")[0].childNodes[1].children[2].value = makeid(5) + "-" + randoC1Number + "-" + randoC2Number;
                debug("search box final value"  , document.getElementsByTagName("form")[0].childNodes[1].children[2].value)
                // Click the search button
                document.querySelectorAll("[value='Search']")[0].click(); 
                debug("search button", document.getElementsByTagName("form")[0].children[1].children[0].firstChild.firstChild.lastChild);
                document.getElementsByTagName("form")[0].children[1].children[0].firstChild.firstChild.lastChild.click();
                await sleep(3000);
            }
        }
        if (
            previousRewardUUID == rewardUUID || 
            checkMark.length > 0 || 
            reward.children[0].href==="https://www.bing.com/" ||
            reward.children[0].href.startsWith("https://rewards.bing.com/redeem")
            )
        {
            debug("previousRewardUUID == rewardUUID", previousRewardUUID, rewardUUID);
            debug("checkMark.length > 0", checkMark);
            debug("reward.children[0].href===", reward.children[0].href);
            continue;
        }
        debug("clicked", reward.children[0])
        var tab = window.open('about:blank', '_blank');
        tab.document.write(GM_getValue("logFile", "").replaceAll("\n", "<br>"));
        tab.document.close();
        debug(GM_getValue("logFile", ""));
        GM_setValue("previousRewardUUID", rewardUUID);
        reward.children[0].click();
        await sleep(3000);
    }

    console.log("Ending script");
})();