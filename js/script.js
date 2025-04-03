// Fuck Js ForEach Function
Array.prototype.ForEach = function (CallBack) {
    for (let i = 0; i < this.length; i++)
        CallBack(i, this)
    
    return this
}

// Function To Count Element That Satisfy A Condition
Array.prototype.Count = function(Condition) {
    let count = 0

    this.ForEach((index, array) => {
        if (Condition(array[index])) {
            count++
        }
    })

    return count
}


// Function To Generate Randon Integer In Specific Range (Including To)
function RandomInt(From, To) {
    return Math.floor(From + Math.random() * (To - From + 1))
}

// Function To Create Button With Onclick Function Evant
function CreateButton(Text, Class, OnClick){
    let Btn = document.createElement('button')

    // Set Init Propertis
    Btn.textContent = Text
    Btn.onclick     = OnClick
    Btn.className   = Class
    
    return Btn 
}

// Function Create Random Integers Array
function RandomIntArray(Size, From, To) {
    return new Array(Size).ForEach((Index, array) => {
        array[Index] = RandomInt(From, To)
    })
}

// Utills End

// Ui Elements
let OnScreenExpectedWinner = document.getElementById("Expected-Winner")
let OnScreenTurn           = document.getElementById("Turn")
let OnScreenGameState      = document.getElementById('Game-State')
let OnScreenLeftTurns      = document.getElementById('Left-Turns')
let OnScreenWinner         = document.getElementById('Winner')

function SetUiToDefaultValues(){
    OnScreenExpectedWinner.innerText = "Unknown"
    OnScreenTurn.innerText           = "Alice"
    OnScreenGameState.innerText      = "In Progress..."
    OnScreenLeftTurns.innerText      = LeftTurns
    OnScreenWinner.innerText         = "-"
}


// Main Functionality Start

// 
const BtnsContainerId  = "Buttons-Container"
const BtnClass         = "Btn"
let NumbersSize        // Got Choiced In Setup
let MinValue           = 0
let MaxValue           = 10 

// 
let Numbers
let OddCount
let EvenCount
let LeftTurns

// Alice Info
let Alice

// Alice Start First
let Turn = 0;

// Fast Check For Avaliable Odds, Even Buttons
let OddButtons, EvenButtons;

// This Functino Trigerd In The End Of The Game
function OnGameEnd(){
    console.log("Game End!");
    
    let Winner = Alice.Sum % 2 == 0 ? "Alice" : "Bob";
    
    OnScreenWinner.innerText    = Winner
    OnScreenGameState.innerText = "Game End!"
}

function OnAliceTurn(Value){
    Alice.Sum += Value

    console.log("Alice Sum : ", Alice.Sum, " Value : ", Value);

    // Quick Fix For Bob First Move Problem
    if (LeftTurns == Numbers.length){
        // To Fix Later On
        OnBobTurn()
        Turn =! Turn
    }
        

    OnScreenTurn.innerText = "Bob"
}

function OnBobTurn(Value){
    // Chat Gpt Ya Dawla -- Anbdl Hadchi Mn B3d
    console.log("Bob Took: ", Value);

    // Get All Enabled Buttons
    let buttons = document.querySelectorAll(`.${BtnClass}:not(:disabled)`);

    if (buttons.length === 0) return; // No moves left

    // Convert buttons' text to numbers
    let availableNumbers = Array.from(buttons).map(btn => Number(btn.textContent));

    let BobChoice;

    // Bob prefers odd numbers if odd turns are left, otherwise even
    if (LeftTurns % 2 === 1) {
        let oddChoices = availableNumbers.filter(num => num % 2 === 1);
        BobChoice = oddChoices.length > 0 ? oddChoices[0] : availableNumbers[0];
    } else {
        let evenChoices = availableNumbers.filter(num => num % 2 === 0);
        BobChoice = evenChoices.length > 0 ? evenChoices[0] : availableNumbers[0];
    }

    // Find the button with Bob's chosen value and click it
    for (let btn of buttons) {
        if (Number(btn.textContent) === BobChoice) {
            setTimeout(() => btn.click(), 500); // Simulate delay for realism
            break;
        }
    }

    OnScreenTurn.innerText = "Alice"; // Switch back to Alice
}


function ButtonOnClick(){
        // Visual Clicked Button
        this.style.background = "red";
        this.disabled = true

        // In Alice Turn Add Selected Number To Its Sum
        if (!Turn)
            OnAliceTurn(Number(this.textContent))
        else 
            OnBobTurn(Number(this.textContent))
            

        // Switch Turn
        Turn = !Turn


        // Each Play Dec Turns Count
        LeftTurns--
        OnScreenLeftTurns.innerText = LeftTurns

        // Game End No Turns Left
        if (LeftTurns == 0){
            OnGameEnd()
        }

        // Additional 
        this.style.cursor = 'default'
}

// Add The Buttons To The Document 
function AddButtons(){
    let ButtonsContainer = document.getElementById(BtnsContainerId) 

    Numbers.ForEach((index, array) => {
        // Create The Button
        let btn = CreateButton(String(array[index]), BtnClass, ButtonOnClick)

        // And Add It To The Container
        ButtonsContainer.appendChild(btn)
    })
}

function GetAliceTurns(){
    // Cause Alice Always Start First It Play Extra Turn In Case Of Odd Numbers Size
    return Math.floor((LeftTurns + 1) / 2)
}

function GetAliceOddsCanPlay(){
    // Cause Alice Always Start First It Can Take Extra Odd In Case Of Odd Numbers Size
    return Math.floor((OddCount + 1) / 2)
}

function GetAliceEvensCanPlay(){
    // Cause Alice Always Start First It Can Take Extra Even In Case Of Odd Numbers Size
    return Math.floor((EvenCount + 1) / 2)
}

// Function Bind Alice Propertys To An Object
function CreateAliceObject(){
    return {
        // At Start Left Turns = Numbers Size
        LeftTurns    : GetAliceTurns(),
        Sum          : 0,
        OddsCanPlay  : GetAliceOddsCanPlay(),
        EvensCanPlay : GetAliceEvensCanPlay()
    }
}

function Setup(){
    // Game Property Init
    NumbersSize = RandomInt(10, 20) 
    Numbers     = RandomIntArray(NumbersSize, MinValue, MaxValue)
    LeftTurns   = Numbers.length
    OddCount    = Numbers.Count((Num) => Num % 2)
    EvenCount   = Numbers.length - OddCount
    Alice       = CreateAliceObject()
    
    

    AddButtons()

    SetUiToDefaultValues();
}

function Reset(){
    let ButtonsContainer = document.getElementById(BtnsContainerId)
    ButtonsContainer.innerHTML = ""

    Setup()
}



Setup()


