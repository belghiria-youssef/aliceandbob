        const firebaseConfig = {
            apiKey: "AIzaSyAH8xioaqqQf8Fijo4BWujFV8yBNJccZiA",
            authDomain: "alice-3ffcf.firebaseapp.com",
            databaseURL: "https://alice-3ffcf-default-rtdb.firebaseio.com",
            projectId: "alice-3ffcf",
            storageBucket: "alice-3ffcf.firebasestorage.app",
            messagingSenderId: "36062752063",
            appId: "1:36062752063:web:75d82e0c29d5ffa83f778a",
            measurementId: "G-LYN0WNTBY3"
        };

        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();

        let gameId = '';
        let playerNumber = 0;
        let RandArray = [];
        let Turn = 0;
        let PLayer1Sum = 0;
        let LeftTurns = 0;
        let gameActive = false;
        let playerId = Math.random().toString(36).substring(2, 15);
        let chatRef;
        let turnTimer;

        const lobbyScreen = document.getElementById('lobby-screen');
        const gameScreen = document.getElementById('game-screen');
        const gameIdInput = document.getElementById('game-id-input');
        const joinGameBtn = document.getElementById('join-game-btn');
        const createGameBtn = document.getElementById('create-game-btn');
        const playerInfo = document.getElementById('player-info');
        const waitingMessage = document.getElementById('waiting-message');
        const OnScreenTurn = document.getElementById("Turn");
        const TurnIndicator = document.getElementById("Turn-Indicator");
        const OnScreenSum = document.getElementById("Sum");
        const OnScreenExpectedWinner = document.getElementById("Expected-Winner");
        const OnScreenInfo = document.getElementById('Info');
        const OnScreenWinner = document.getElementById('Winner');
        const OnScreenWinnerName = document.getElementById('Winner-Name');
        const OnScreenLeftTurns = document.getElementById('Left-Turns');
        const Container = document.getElementById('container');
        
        waitingMessage.style.display = 'none';

        function RandomInt(From, To) {
            return Math.floor(From + Math.random() * (To - From + 1));
        }

        function RandomIntArray(Size, From, To) {
            let array = new Array(Size);
            for (let i = 0; i < Size; i++) {
                array[i] = RandomInt(From, To);
            }
            return array;
        }

        function Count(Array, Condition) {
            let count = 0;
            for (let i = 0; i < Array.length; i++) {
                if (Condition(Array[i])) {
                    count++;
                }
            }
            return count;
        }

        function GetPlayer1State() {
            let OddCount = Count(RandArray, a => a % 2 == 1);
            let EvenCount = RandArray.length - OddCount;
            
            return {
                Turns: Math.floor((RandArray.length + 1) / 2),
                Odds: Math.floor((OddCount + 1) / 2),
                Evens: Math.floor((EvenCount + 1) / 2)
            };
        }

        function WhoWin() {
            let Player1Info = GetPlayer1State();
            let Result = (Player1Info.Odds + Player1Info.Evens == Player1Info.Turns) && (Player1Info.Odds % 2 == 1);
            return Result ? "Belghiria" : "Hicham";
        }

        function ObjectToString(Obj) {
            let StrObj = "{";
            for (let Key in Obj){
                StrObj += Key.toString() + ' : ' + Obj[Key] + ', ';        
            }
            StrObj = StrObj.slice(0, -2);
            StrObj += '}';
            return StrObj;
        }

        function UpdateTurnDisplay() {
            if (playerNumber === 0) {
                OnScreenTurn.textContent = "Spectating";
                TurnIndicator.textContent = Turn ? "Belghiria's Turn" : "Hicham's Turn";
                TurnIndicator.className = "turn-indicator spectator-view";
            } else {
                OnScreenTurn.textContent = Turn ? "Belghiria" : "Hicham";
                TurnIndicator.textContent = Turn ? "Belghiria's Turn" : "Hicham's Turn";
                TurnIndicator.className = Turn ? "turn-indicator player2-turn" : "turn-indicator player1-turn";
            }
        }

        function OnGameEnd(){
            OnScreenWinnerName.innerText = WhoWin();
            OnScreenWinner.classList.add('show');
            gameActive = false;
            clearInterval(turnTimer);
        }

        function createGameBoard() {
            Container.innerHTML = '';
            
            for (let i = 0; i < RandArray.length; i++) {
                let btn = document.createElement("button");
                btn.className = 'number-btn ' + (RandArray[i] % 2 === 1 ? 'odd' : 'even');
                btn.textContent = RandArray[i];
                btn.id = 'btn-' + i;
                btn.disabled = true;

                btn.onclick = function() {
                    if (!gameActive || (Turn !== (playerNumber - 1)) || playerNumber === 0) return;
                    
                    btn.disabled = true;
                    if (playerNumber === 1) {
                        PLayer1Sum += Number(btn.textContent);
                        OnScreenSum.innerText = PLayer1Sum;
                    }

                    const updates = {};
                    updates[`games/${gameId}/selectedButtons/${i}`] = true;
                    updates[`games/${gameId}/currentTurn`] = Turn === 0 ? 1 : 0;
                    updates[`games/${gameId}/player1Sum`] = PLayer1Sum;
                    updates[`games/${gameId}/leftTurns`] = LeftTurns - 1;
                    
                    database.ref().update(updates);
                };

                Container.appendChild(btn);
            }

            OnScreenExpectedWinner.innerText = WhoWin();
            OnScreenInfo.innerText = ObjectToString(GetPlayer1State());
            OnScreenLeftTurns.innerText = LeftTurns;
            UpdateTurnDisplay();
        }

        function startTurnTimer() {
            clearInterval(turnTimer);
            let turnTimeLeft = 30;
            document.getElementById('timer').textContent = turnTimeLeft;
            turnTimer = setInterval(() => {
                turnTimeLeft--;
                document.getElementById('timer').textContent = turnTimeLeft;
                if (turnTimeLeft <= 0) {
                    clearInterval(turnTimer);
                    if (gameActive && (Turn === (playerNumber - 1) && playerNumber !== 0) ){
                        // Auto-pass turn
                        const updates = {};
                        updates[`games/${gameId}/currentTurn`] = Turn === 0 ? 1 : 0;
                        database.ref().update(updates);
                    }
                }
            }, 1000);
        }

        function setupChat() {
            // Clear existing messages
            document.getElementById('chat-messages').innerHTML = '';
            
            // Send message handler
            document.getElementById('send-message').addEventListener('click', sendMessage);
            document.getElementById('chat-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
            });
            
            // Listen for new messages
            chatRef.limitToLast(50).on('child_added', (snapshot) => {
                const msg = snapshot.val();
                displayMessage(msg);
            });
        }

        function sendMessage() {
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (message && gameActive) {
                const msgData = {
                    text: message,
                    player: playerNumber || 'spectator',
                    senderId: playerId,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                };
                
                chatRef.push(msgData);
                input.value = '';
            }
        }

        function displayMessage(msg) {
            const messagesDiv = document.getElementById('chat-messages');
            const msgElement = document.createElement('div');
            
            let playerClass = '';
            let displayName = '';
            
            if (msg.player === 1) {
                playerClass = 'player-1';
                displayName = 'Hicham';
            } else if (msg.player === 2) {
                playerClass = 'player-2';
                displayName = 'Belghiria';
            } else {
                playerClass = 'spectator';
                displayName = 'Spectator';
            }
            
            msgElement.className = `message ${playerClass}`;
            msgElement.innerHTML = `<strong>${displayName}:</strong> ${msg.text}`;
            
            messagesDiv.appendChild(msgElement);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function initializeGame(gameData) {
            RandArray = gameData.numbers || [];
            LeftTurns = gameData.leftTurns || RandArray.length;
            PLayer1Sum = gameData.player1Sum || 0;
            Turn = gameData.currentTurn || 0;
            gameActive = true;
            
            createGameBoard();
            startTurnTimer();
            
            // Initialize chat
            chatRef = database.ref(`games/${gameId}/messages`);
            setupChat();

            // Enable buttons if it's our turn
            if (playerNumber > 0 && Turn === (playerNumber - 1)) {
                for (let i = 0; i < RandArray.length; i++) {
                    if (!gameData.selectedButtons || !gameData.selectedButtons[i]) {
                        const btn = document.getElementById('btn-' + i);
                        if (btn) btn.disabled = false;
                    }
                }
            }
            
            // Show game screen
            lobbyScreen.style.display = 'none';
            gameScreen.style.display = 'block';
            waitingMessage.style.display = (playerNumber === 1 && !gameData.player2) ? 'block' : 'none';
        }

        function createNewGame() {
            gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
            gameIdInput.value = gameId;
            playerNumber = 1;
            playerInfo.textContent = `Game ID: ${gameId} - You are Player 1`;
            waitingMessage.style.display = 'block';
            
            // Generate random numbers for the game
            const numbers = RandomIntArray(RandomInt(10, 20), 0, 10);
            
            // Create game in Firebase
            database.ref(`games/${gameId}`).set({
                player1: playerId,
                player2: null,
                numbers: numbers,
                selectedButtons: {},
                currentTurn: 0,
                player1Sum: 0,
                leftTurns: numbers.length,
                messages: {}
            });
            
            // Listen for game updates
            setupGameListener();
        }

        function joinExistingGame() {
            gameId = gameIdInput.value.trim();
            if (!gameId) {
                alert('Please enter a game ID');
                return;
            }
            
            const gameRef = database.ref(`games/${gameId}`);
            gameRef.once('value').then((snapshot) => {
                const gameData = snapshot.val();
                if (!gameData) {
                    alert('Game not found');
                    return;
                }
                
                if (gameData.player1 && gameData.player2) {
                    if (confirm('Game is full. Would you like to spectate?')) {
                        playerNumber = 0; // Spectator
                        playerInfo.textContent = `You are Spectating`;
                        initializeGame(gameData);
                        return;
                    } else {
                        return;
                    }
                }
                
                playerNumber = gameData.player1 ? 2 : 1;
                playerInfo.textContent = `You are Player ${playerNumber}`;
                waitingMessage.style.display = 'none';
                
                // Join the game
                const updates = {};
                updates[`games/${gameId}/player${playerNumber}`] = playerId;
                database.ref().update(updates);
                
                setupGameListener();
            });
        }

        function setupGameListener() {
            database.ref(`games/${gameId}`).on('value', (snapshot) => {
                const gameData = snapshot.val();
                if (!gameData) return;
                
                // Check if opponent disconnected
                if (playerNumber === 1 && gameData.player2 === null && gameActive) {
                    alert('Player 2 has disconnected');
                    resetGame();
                    return;
                }
                
                if (playerNumber === 2 && gameData.player1 === null && gameActive) {
                    alert('Player 1 has disconnected');
                    resetGame();
                    return;
                }
                
                // Initialize or update game
                if (!gameActive && ((playerNumber === 1 && gameData.player2) || playerNumber === 2 || playerNumber === 0)) {
                    initializeGame(gameData);
                } else if (gameActive) {
                    RandArray = gameData.numbers || RandArray;
                    Turn = gameData.currentTurn || 0;
                    PLayer1Sum = gameData.player1Sum || 0;
                    LeftTurns = gameData.leftTurns || 0;
                    
                    // Update the board
                    for (let i = 0; i < RandArray.length; i++) {
                        const btn = document.getElementById('btn-' + i);
                        if (btn) {
                            btn.disabled = (gameData.selectedButtons && gameData.selectedButtons[i]) || 
                                          (playerNumber === 0) || 
                                          (Turn !== (playerNumber - 1));
                        }
                    }
                    
                    OnScreenSum.innerText = PLayer1Sum;
                    OnScreenLeftTurns.innerText = LeftTurns;
                    UpdateTurnDisplay();
                    startTurnTimer();
                    
                    if (LeftTurns === 0) {
                        OnGameEnd();
                    }
                }
            });
        }

        function resetGame() {
            if (gameId) {
                database.ref(`games/${gameId}`).off();
            }
            if (chatRef) {
                chatRef.off();
            }
            clearInterval(turnTimer);
            gameActive = false;
            lobbyScreen.style.display = 'block';
            gameScreen.style.display = 'none';
            OnScreenWinner.classList.remove('show');
            document.getElementById('chat-messages').innerHTML = '';
        }

        createGameBtn.addEventListener('click', createNewGame);
        joinGameBtn.addEventListener('click', joinExistingGame);

        gameIdInput.value = '';
