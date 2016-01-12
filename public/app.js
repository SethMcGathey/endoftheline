;
jQuery(function($){    
    'use strict';

    /**
     * All the code relevant to Socket.IO is collected in the IO namespace.
     *
     * @type {{init: Function, bindEvents: Function, onConnected: Function, onNewGameCreated: Function, playerJoinedRoom: Function, beginNewGame: Function, onNewWordData: Function, hostCheckAnswer: Function, gameOver: Function, error: Function}}
     */
    var IO = {

        /**
         * This is called when the page is displayed. It connects the Socket.IO client
         * to the Socket.IO server
         */
        init: function() {
            IO.socket = io.connect();
            IO.bindEvents();
        },

        /**
         * While connected, Socket.IO will listen to the following events emitted
         * by the Socket.IO server, then run the appropriate function.
         */
        bindEvents : function() {
            IO.socket.on('connected', IO.onConnected );
            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
            IO.socket.on('beginNewGame', IO.beginNewGame );
            IO.socket.on('newWordData', IO.onNewWordData);
            IO.socket.on('hostCheckAnswer', IO.hostCheckAnswer);
            IO.socket.on('hostMovePlayer', IO.hostMovePlayer);
            IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('error', IO.error );
        },

        /**
         * The client is successfully connected!
         */
        onConnected : function() {
            // Cache a copy of the client's socket.IO session ID on the App
            App.mySocketId = IO.socket.socket.sessionid;
            // console.log(data.message);
        },

        /**
         * A new game has been created and a random game ID has been generated.
         * @param data {{ gameId: int, mySocketId: * }}
         */
        onNewGameCreated : function(data) {
            App.Host.gameInit(data);
        },

        /**
         * A player has successfully joined the game.
         * @param data {{playerName: string, gameId: int, mySocketId: int}}
         */
        playerJoinedRoom : function(data) {
            // When a player joins a room, do the updateWaitingScreen funciton.
            // There are two versions of this function: one for the 'host' and
            // another for the 'player'.
            //
            // So on the 'host' browser window, the App.Host.updateWiatingScreen function is called.
            // And on the player's browser, App.Player.updateWaitingScreen is called.
            App[App.myRole].updateWaitingScreen(data);
        },

        /**
         * Both players have joined the game.
         * @param data
         */
        beginNewGame : function(data) {
            App[App.myRole].gameCountdown(data);
        },

        /**
         * A new set of words for the round is returned from the server.
         * @param data
         */
        onNewWordData : function(data) {
            // Update the current round
            App.currentRound = data.round;

            // Change the word for the Host and Player
            App[App.myRole].newWord(data);
        },

        /**
         * A player answered. If this is the host, check the answer.
         * @param data
         */
        hostCheckAnswer : function(data) {
            if(App.myRole === 'Host') {
                App.Host.checkAnswer(data);
            }
        },
	/*****ADDED BY BECKY*****/
	hostMovePlayer : function(data) {
	    //move player to next square
	    var playerX;
	    var playerY;
	    if (App.Host.player[App.currentRound][2] == 0 || App.Host.player[App.currentRound][2] == 1) {
	    	playerX = App.Host.player[App.currentRound][0];
            	playerY = App.Host.player[App.currentRound][1] - 1;
	    }
	    else if (App.Host.player[App.currentRound][2] == 2 || App.Host.player[App.currentRound][2] == 3) {
     	        playerX = App.Host.player[App.currentRound][0] + 1;
                playerY = App.Host.player[App.currentRound][1];
            }
	    else if (App.Host.player[App.currentRound][2] == 4 || App.Host.player[App.currentRound][2] == 5) {
                playerX = App.Host.player[App.currentRound][0];
                playerY = (App.Host.player[App.currentRound][1]) + 1;
            }
	    else if (App.Host.player[App.currentRound][2] == 6 || App.Host.player[App.currentRound][2] == 7) {
                playerX = (App.Host.player[App.currentRound][0]) - 1;
                playerY = App.Host.player[App.currentRound][1];
            }
	    //change turn
	    if (App.currentRound < (App.Host.numPlayersInRoom - 1)) {
		App.currentRound += 1;
            }
	    else if (App.currentRound == (App.Host.numPlayersInRoom - 1)) {
		App.currentRound = 0;
	    }
            if(App.myRole === 'Host') {
		console.log('Player Turn: '+App.currentRound+', Answer: '+data.answer+', Player X: '+playerX+', Player Y: '+playerY+'. ');
                App.Host.addSquare(playerX, playerY, data.answer);
            }
        },
	/*****ADDED BY BECKY*****/
        /**
         * Let everyone know the game has ended.
         * @param data
         */
        gameOver : function(data) {
            App[App.myRole].endGame(data);
        },

        /**
         * An error has occurred.
         * @param data
         */
        error : function(data) {
            alert(data.message);
        }

    };

    var App = {

        /**
         * Keep track of the gameId, which is identical to the ID
         * of the Socket.IO Room used for the players and host to communicate
         *
         */
        gameId: 0,

        /**
         * This is used to differentiate between 'Host' and 'Player' browsers.
         */
        myRole: '',   // 'Player' or 'Host'

        /**
         * The Socket.IO socket object identifier. This is unique for
         * each player and host. It is generated when the browser initially
         * connects to the server when the page loads for the first time.
         */
        mySocketId: '',

        /**
         * Identifies the current round. Starts at 0 because it corresponds
         * to the array of word data stored on the server.
         */
        currentRound: 0,

        /* *************************************
         *                Setup                *
         * *********************************** */

        /**
         * This runs when the page initially loads.
         */
        init: function () {
            App.cacheElements();
            App.showInitScreen();
            App.bindEvents();

            // Initialize the fastclick library
            FastClick.attach(document.body);
        },

        /**
         * Create references to on-screen elements used throughout the game.
         */
        cacheElements: function () {
            App.$doc = $(document);

            // Templates
            App.$gameArea = $('#gameArea');
            App.$templateIntroScreen = $('#intro-screen-template').html();
            App.$templateNewGame = $('#create-game-template').html();
            App.$templateJoinGame = $('#join-game-template').html();
            App.$hostGame = $('#host-game-template').html();
        },

        /**
         * Create some click handlers for the various buttons that appear on-screen.
         */
        bindEvents: function () {
            // Host
            App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);
           
            // Player
	    App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '#btnStart',App.Player.onPlayerStartClick);
            App.$doc.on('click', '.btnAnswer',App.Player.onPlayerAnswerClick);
            App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);
        },

        /* *************************************
         *             Game Logic              *
         * *********************************** */

        /**
         * Show the initial Anagrammatix Title Screen
         * (with Start and Join buttons)
         */
        showInitScreen: function() {
            App.$gameArea.html(App.$templateIntroScreen);
            App.doTextFit('.title');
        },


        /* *******************************
           *         HOST CODE           *
           ******************************* */
        Host : {

            /**
             * Contains references to player data
             */
            players : [],

            /**
             * Flag to indicate if a new game is starting.
             * This is used after the first game ends, and players initiate a new game
             * without refreshing the browser windows.
             */
            isNewGame : false,

            /**
             * Keep track of the number of players that have joined the game.
             */
            numPlayersInRoom: 0,

            /**
             * A reference to the correct answer for the current round.
             */
            currentCorrectAnswer: '',

            /**
             * Handler for the "Start" button on the Title Screen.
             */
            onCreateClick: function () {
                // console.log('Clicked "Create A Game"');
                IO.socket.emit('hostCreateNewGame');
		App.numOfPlayers = $("#numOfPlayers").val();
            },

            /**
             * The Host screen is displayed for the first time.
             * @param data{{ gameId: int, mySocketId: * }}
             */
            gameInit: function (data) {
                App.gameId = data.gameId;
                App.mySocketId = data.mySocketId;
                App.myRole = 'Host';
                App.Host.numPlayersInRoom = 0;

                App.Host.displayNewGameScreen();
                //console.log("Game started with ID: " + App.gameId + ' by host: ' + App.mySocketId);
	     },

            /**
             * Show the Host screen containing the game URL and unique game ID
             */
            displayNewGameScreen : function() {
                // Fill the game screen with the appropriate HTML
                App.$gameArea.html(App.$templateNewGame);

                // Display the URL on screen
                $('#gameURL').text(window.location.href);
                App.doTextFit('#gameURL');

                // Show the gameId / room id on screen
                $('#spanNewGameCode').text(App.gameId);
            },

            /**
             * Update the Host screen when the first player joins
             * @param data{{playerName: string}}
             */
            updateWaitingScreen: function(data) {
                // If this is a restarted game, show the screen.
                if ( App.Host.isNewGame ) {
                    App.Host.displayNewGameScreen();
                }
                // Update host screen
                $('#playersWaiting')
                    .append('<p/>')
                    .text('Player ' + data.playerName + ' joined the game.');

                // Store the new player's data on the Host.
                App.Host.players.push(data);

                // Increment the number of players in the room
                App.Host.numPlayersInRoom += 1;

                // If two players have joined, start the game!
				
                if (App.Host.numPlayersInRoom == App.numOfPlayers) {
                    // console.log('Room is full. Almost ready!');

                    // Let the server know that two players are present.
                    IO.socket.emit('hostRoomFull',App.gameId);
                }
            },

            /**
             * Show the countdown screen
             */
            gameCountdown : function() {

                // Prepare the game screen with new HTML
                App.$gameArea.html(App.$hostGame);
                App.doTextFit('#hostWord');

                // Begin the on-screen countdown timer
                var $secondsLeft = $('#hostWord');
                App.countDown( $secondsLeft, 5, function(){
                    IO.socket.emit('hostCountdownFinished', App.gameId);
                });
		App.Host.player = new Array(App.numOfPlayers);
		var startingspots = [[0,2,4],
				     [0,5,5],
				     [7,3,1],
				     [5,7,0],
				     [0,2,2],
				     [0,5,3],
				     [7,2,6],
			             [7,5,7]];
		var innerPlayerArray = new Array(4);
                // Display the players' names on screen
		for(var i = 0; i < App.numOfPlayers; i++)
		{ 
		    $('#playerScores')
			
                    	.append('<div id="player'+ (i+1) + 'Score" class="playerScore col-xs-3"> <span class="score">&#x205C</span><span class="playerName">Player' + (i+1)
+' </span> </div>');
			innerPlayerArray = [startingspots[i][0], startingspots[i][1], startingspots[i][2], "becky" + i];
			App.Host.player[i] = innerPlayerArray;	
			
			// Set the Score section on screen to 0 for each player.
                	//$('#player' + i  + 'Score').find('.score').attr('id',App.Host.players[i-1].mySocketId);
		}
		//CODE BY BECKY - create board and display on page
		App.Host.createBoard();

                $('#board').append(App.Host.board+'<br>');
		
	//	App.Host.addSquare(2, 1, 2);

		$('#board').append(App.Host.board);
	//	App.Host.addSquare(2, 1, 2);
		$('#board').append(App.Host.board+'<br>');
                $('#board').append('Original Board <br>');
		$('#board').append(App.Host.board[0] + '<br>');
		$('#board').append(App.Host.board[1] + '<br>');
                $('#board').append(App.Host.board[2] + '<br>');
                $('#board').append(App.Host.board[3] + '<br>');
                $('#board').append(App.Host.board[4] + '<br>');
                $('#board').append(App.Host.board[5] + '<br>');
                $('#board').append(App.Host.board[6] + '<br>');
                $('#board').append(App.Host.board[7] + '<br>');		

		//END CODE BY BECKY
            },

            /**
             * Show the word for the current round on screen.
             * @param data{{round: *, word: *, answer: *, list: Array}}
             */
            newWord : function(data) {
                // Insert the new word into the DOM
                $('#hostWord').text(data.word);
                App.doTextFit('#hostWord');

                // Update the data for the current round
                App.Host.currentCorrectAnswer = data.answer;
                App.Host.currentRound = data.round;
            },
	    /***********Added by Becky**************/ 
	    createBoard : function() {
		App.Host.board = new Array(8); 
		App.Host.square = [[6, 5, 4, 7, 2, 1, 0, 3], [4, 7, 6, 5, 0, 3, 2, 1], [7, 6, 5, 4, 3, 2, 1, 0], [7, 6, 3, 2, 5, 4, 1, 0]];
		for (var i = 0; i < 8; i++) {
			App.Host.board[i] = new Array(8);
			for (var j = 0; j < 8; j++) {
				App.Host.board[i][j] = null;
			}
		}
            },

           addSquare : function(x, y, squareNumber) {
		App.Host.board[x][y] = squareNumber; 
		$('#board').append(App.Host.board[0] + '<br>');
                $('#board').append(App.Host.board[1] + '<br>');
                $('#board').append(App.Host.board[2] + '<br>');
                $('#board').append(App.Host.board[3] + '<br>');
                $('#board').append(App.Host.board[4] + '<br>');
                $('#board').append(App.Host.board[5] + '<br>');
                $('#board').append(App.Host.board[6] + '<br>');
                $('#board').append(App.Host.board[7] + '<br>');
		App.Host.movePlayer(x,y);//Added by seth 
	   },		
	
	    /***********Added by Seth**************/
	    movePlayer : function(newX, newY){
		var individual;
		for(individual in App.Host.player)
		{
			var swapPosition = [5,4,7,6,1,0,3,2]; //swapPosition converts the position of old location into position of new location
			if(App.Host.checkForTouchingSquare(newX, newY, individual))
			{
				App.Host.player[individual][0] = newX; //sets players x to x of new piece
				App.Host.player[individual][1] = newY; //sets players y to y of new piece
				App.Host.player[individual][2] = App.Host.square[  App.Host.board[newX][newY]  ][  swapPosition[ App.Host.player[individual][2] ]  ]; //maps players position to new position
			}
			$('#board').append(App.Host.player[individual][3] + " " + App.Host.player[individual][0] + " " + App.Host.player[individual][1] + " " + App.Host.player[individual][2] + "<br> ");
			//print new player positions to screen 
		}
	   //added by Becky
		// Advance the round
                   /*     App.currentRound += 1;

                        // Prepare data to send to the server
                        var data = {
                            gameId : App.gameId,
                            round : App.currentRound
                        }

                        // Notify the server to start the next round.
                        IO.socket.emit('hostNextRound',data); */
	   //end added by Becky

	    },

	    checkForTouchingSquare : function(newX, newY, individual){
		//checks if player is in a touching square and also on the touching two positions of that square. If so then return true else false.
		if((App.Host.player[individual][0] == newX && App.Host.player[individual][1] == newY+1 && (App.Host.player[individual][2] == 0 || App.Host.player[individual][2] == 1)) ||
		(App.Host.player[individual][0] == newX-1 && App.Host.player[individual][1] == newY && (App.Host.player[individual][2] == 2 || App.Host.player[individual][2] == 3)) ||
		(App.Host.player[individual][0] == newX && App.Host.player[individual][1] == newY-1 && (App.Host.player[individual][2] == 4 || App.Host.player[individual][2] == 5)) ||
		(App.Host.player[individual][0] == newX+1 && App.Host.player[individual][1] == newY && (App.Host.player[individual][2] == 6 || App.Host.player[individual][2] == 7)))
		{	
			return true;
		}
		return false;
	    },	


	    turnSquare : function(turnRight){
		if(turnRight)
		{    
		    var swapSquare = [App.Host.square.shift(), App.Host.square.shift()];//set swap square to first two of square array
		    App.Host.square[6] = swapSquare[0];//moves these two to the end of square array
		    App.Host.square[7] = swapSquare[1];
		}else
		{
		    var swapSquare = [App.Host.square.pop(), App.Host.square.pop()];//sets swapSquare to last two of square array
		    App.Host.square.unshift(swapSquare[1], swapSquare[0]);//adds the two swapSquare onto the front of the square array
		}
	    },
	    /***********Added by Seth**************/

            /**
             * Check the answer clicked by a player.
             * @param data{{round: *, playerId: *, answer: *, gameId: *}}
             */
            checkAnswer : function(data) {
		
		//if(player.turn)//made up variable
		//{
			//set board[location] = square[chosenSquare];//made up vairables
		//	updateBoard();//doesn't exist yet
			addSquare(); //added by Becky
			movePlayer();//doesn't exist yet
				
		//}



                // Verify that the answer clicked is from the current round.
                // This prevents a 'late entry' from a player whos screen has not
                // yet updated to the current round.
		 /* if (data.round === App.currentRound){

                    // Get the player's score
                    var $pScore = $('#' + data.playerId);

                    // Advance player's score if it is correct
                    if( App.Host.currentCorrectAnswer === data.answer ) {
                        // Add 5 to the player's score
                        $pScore.text( +$pScore.text() + 5 );

                        // Advance the round
                        App.currentRound += 1;

                        // Prepare data to send to the server
                        var data = {
                            gameId : App.gameId,
                            round : App.currentRound
                        }

                        // Notify the server to start the next round.
                        IO.socket.emit('hostNextRound',data);

                    } else {
                        // A wrong answer was submitted, so decrement the player's score.
                        $pScore.text( +$pScore.text() - 3 );
                    }
                }*/
            },


            /**
             * All 10 rounds have played out. End the game.
             * @param data
             */
            endGame : function(data) {
                // Get the data for player 1 from the host screen
             /*  for(var i = 0; i < App.numOfPlayers; i++)
	       {
		  var player = 
			{
				$p = $('#player' + i + 'Score');
				pScore = +$p.find('.score').text();
				pName = $p.find('.playerName').text()		
			}
		  var $p1 = $('#player' + i + 'Score');
                  var p1Score = +$p1.find('.score').text();
                  var p1Name = $p1.find('.playerName').text();
	       }
                // Get the data for player 2 from the host screen
                var $p2 = $('#player2Score');
                var p2Score = +$p2.find('.score').text();
                var p2Name = $p2.find('.playerName').text();

		// Get the data for player 3 from the host screen
                var $p3 = $('#player3Score');
                var p3Score = +$p3.find('.score').text();
                var p3Name = $p3.find('.playerName').text();

                // Find the winner based on the scores
                //var second = (p1Score < p2Score) ? p2Name : p1Name;
		
		if(p1Score < p2Score)
		{
			var secondScore = p2Score;
			var second = p2Name;
		}else
		{
			var secondScore = p1Score;
			var second = p1Name;
		}
		//var winner = (second < p3Score) ?  p3Name : second;
                if(secondScore < p3Score)
                {
                        var winner = p3Name;
                }else
                {
                        var winner = second;
                }
                var tie = (p1Score === p2Score && p2Score === p3Score);
                // Display the winner (or tie game message)
                if(tie){
                    $('#hostWord').text("It's a Tie!");
                } else {
                    $('#hostWord').text( winner + ' Wins!!' );
                }
                App.doTextFit('#hostWord');

                // Reset game data
                App.Host.numPlayersInRoom = 0;
                App.Host.isNewGame = true;*/
            },

            /**
             * A player hit the 'Start Again' button after the end of a game.
             */
            restartGame : function() {
                App.$gameArea.html(App.$templateNewGame);
                $('#spanNewGameCode').text(Appi.gameId);
            }
        },


        /* *****************************
           *        PLAYER CODE        *
           ***************************** */

        Player : {

            /**
             * A reference to the socket ID of the Host
             */
            hostSocketId: '',

            /**
             * The player's name entered on the 'Join' screen.
             */
            myName: '',

            /**
             * Click handler for the 'JOIN' button
             */
            onJoinClick: function () {
                // console.log('Clicked "Join A Game"');

                // Display the Join Game HTML on the player's screen.
                App.$gameArea.html(App.$templateJoinGame);
            },

            /**
             * The player entered their name and gameId (hopefully)
             * and clicked Start.
             */
            onPlayerStartClick: function() {
                // console.log('Player clicked "Start"');

                // collect data to send to the server
                var data = {
                    gameId : +($('#inputGameId').val()),
                    playerName : $('#inputPlayerName').val() || 'anon'
                };

                // Send the gameId and playerName to the server
                IO.socket.emit('playerJoinGame', data);

                // Set the appropriate properties for the current player.
                App.myRole = 'Player';
                App.Player.myName = data.playerName;
		
		/*******ADDED BY BECKY********/
		App.Player.cards = [0, 1, 2, 3];
		/*******ADDED BY BECKY********/
            },

            /**
             *  Click handler for the Player hitting a word in the word list.
             */
            onPlayerAnswerClick: function() {
                // console.log('Clicked Answer Button');
                var $btn = $(this);      // the tapped button
                var answer = $btn.val(); // The tapped word

                // Send the player info and tapped word to the server so
                // the host can check the answer.
                var data = {
                    gameId: App.gameId,
                    playerId: App.mySocketId,
                    answer: answer,
                    round: App.currentRound
                }
                IO.socket.emit('playerAnswer',data);
            },

            /**
             *  Click handler for the "Start Again" button that appears
             *  when a game is over.
             */
            onPlayerRestart : function() {
                var data = {
                    gameId : App.gameId,
                    playerName : App.Player.myName
                }
                IO.socket.emit('playerRestart',data);
                App.currentRound = 0;
                $('#gameArea').html("<h3>Waiting on host to start new game.</h3>");
            },

            /**
             * Display the waiting screen for player 1
             * @param data
             */
            updateWaitingScreen : function(data) {
                if(IO.socket.socket.sessionid === data.mySocketId){
                    App.myRole = 'Player';
                    App.gameId = data.gameId;

                    $('#playerWaitingMessage')
                        .append('<p/>')
                        .text('Joined Game ' + data.gameId + '. Please wait for game to begin.');
                }
            },

            /**
             * Display 'Get Ready' while the countdown timer ticks down.
             * @param hostData
             */
            gameCountdown : function(hostData) {
                App.Player.hostSocketId = hostData.mySocketId;
                $('#gameArea')
                    .html('<div class="gameOver">Get Ready!</div>');
            },

            /**
             * Show the list of words for the current round.
             * @param data{{round: *, word: *, answer: *, list: Array}}
             */
            newWord : function(data) {
                // Create an unordered list element
                //var $list = $('<ul/>').attr('id','ulAnswers');

		/*******ADDED BY BECKY********/	
		var $cardlist = $('<ul/>').attr('id','ulAnswers');
		for (var card in App.Player.cards) {
		     $cardlist                                //  <ul> </ul>
                        .append( $('<li/>')              //  <ul> <li> </li> </ul>
                            .append( $('<button/>')      //  <ul> <li> <button> </button> </li> </ul>
                                .addClass('btnAnswer')   //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                .addClass('btn')         //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                .val(card)               //  <ul> <li> <button class='btnAnswer' value='word'> </button> </li> </ul>
                                .html(card)              //  <ul> <li> <button class='btnAnswer' value='word'>word</button> </li> </ul>
                            )
                        )
		};	
		
		/*******ADDED BY BECKY********/
                // Insert a list item for each word in the word list
                // received from the server.
                /*$.each(data.list, function(){
                    $list                                //  <ul> </ul>
                        .append( $('<li/>')              //  <ul> <li> </li> </ul>
                            .append( $('<button/>')      //  <ul> <li> <button> </button> </li> </ul>
                                .addClass('btnAnswer')   //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                .addClass('btn')         //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                .val(this)               //  <ul> <li> <button class='btnAnswer' value='word'> </button> </li> </ul>
                                .html(this)              //  <ul> <li> <button class='btnAnswer' value='word'>word</button> </li> </ul>
                            )
                        )
                });*/

                // Insert the list onto the screen.
               // $('#gameArea').html($list);
		$('#gameArea').append($cardlist);
            },

            /**
             * Show the "Game Over" screen.
             */
            endGame : function() {
                $('#gameArea')
                    .html('<div class="gameOver">Game Over!</div>')
                    .append(
                        // Create a button to start a new game.
                        $('<button>Start Again</button>')
                            .attr('id','btnPlayerRestart')
                            .addClass('btn')
                            .addClass('btnGameOver')
                    );
            }
        },


        /* **************************
                  UTILITY CODE
           ************************** */

        /**
         * Display the countdown timer on the Host screen
         *
         * @param $el The container element for the countdown timer
         * @param startTime
         * @param callback The function to call when the timer ends.
         */
        countDown : function( $el, startTime, callback) {

            // Display the starting time on the screen.
            $el.text(startTime);
            App.doTextFit('#hostWord');

            // console.log('Starting Countdown...');

            // Start a 1 second timer
            var timer = setInterval(countItDown,1000);

            // Decrement the displayed timer value on each 'tick'
            function countItDown(){
                startTime -= 1
                $el.text(startTime);
                App.doTextFit('#hostWord');

                if( startTime <= 0 ){
                    // console.log('Countdown Finished.');

                    // Stop the timer and do the callback.
                    clearInterval(timer);
                    callback();
                    return;
                }
            }

        },

        /**
         * Make the text inside the given element as big as possible
         * See: https://github.com/STRML/textFit
         *
         * @param el The parent element of some text
         */
        doTextFit : function(el) {
            textFit(
                $(el)[0],
                {
                    alignHoriz:true,
                    alignVert:false,
                    widthOnly:true,
                    reProcess:true,
                    maxFontSize:300
                }
            );
        }

    };

    IO.init();
    App.init();

}($));
