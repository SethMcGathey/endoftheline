;
jQuery(function($){    
    'use strict';
    /**
     * All the code relevant to Socket.IO is collected in the IO namespace.
     *
     *Here @type {{init: Function, bindEvents: Function, onConnected: Function, onNewGameCreated: Function, playerJoinedRoom: Function, beginNewGame: Function, onNewWordData: Function, hostCheckAnswer: Function, gameOver: Function, error: Function}}
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
	    IO.socket.on('sendPlayerCount', IO.sendPlayerCount );
	    IO.socket.on('receiveSquare', IO.receiveSquare );
	    IO.socket.on('sendLoseMessage', IO.sendLoseMessage );
	    IO.socket.on('sendWinMessage', IO.sendWinMessage );
            IO.socket.on('beginNewGame', IO.beginNewGame );
            IO.socket.on('newWordData', IO.onNewWordData);
            IO.socket.on('hostCheckAnswer', IO.hostCheckAnswer);
            IO.socket.on('hostMovePlayer', IO.hostMovePlayer);
            IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('error', IO.error );
	    IO.socket.on('passedNewCard', IO.passedNewCard);
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
	
	sendPlayerCount : function(playerCount) {
		App.Player.assignPlayerCount(playerCount);	
	},

	sendLoseMessage : function(player) {
                App.Player.youLose(player);

        },

	sendWinMessage : function(player) {
                App.Player.youWin(player);

        },

	receiveSquare : function(square) {
                App.Player.playerStoreSquare(square);

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
//	    console.log("Data within hostMovePlayer myID " + data.myID + " answer " +  data.answer + " playerCardIndex " +  data.playerCardIndex);
//	    App.Host.drawCard(data.myID, data.answer, data.playerCardIndex);
	    if (App.currentRound == data.playerOrderId) {
	    //move player to next square
	    var playerX;
	    var playerY;
	    if (App.Host.player[App.currentRound][2] == 0 || App.Host.player[App.currentRound][2] == 1) {
	    	playerX = App.Host.player[App.currentRound][1];
            	playerY = App.Host.player[App.currentRound][0] - 1;
	    }
	    else if (App.Host.player[App.currentRound][2] == 2 || App.Host.player[App.currentRound][2] == 3) {
     	        playerX = App.Host.player[App.currentRound][1] + 1;
                playerY = App.Host.player[App.currentRound][0];
            }
	    else if (App.Host.player[App.currentRound][2] == 4 || App.Host.player[App.currentRound][2] == 5) {
                playerX = App.Host.player[App.currentRound][1];
                playerY = (App.Host.player[App.currentRound][0]) + 1;
            }
	    else if (App.Host.player[App.currentRound][2] == 6 || App.Host.player[App.currentRound][2] == 7) {
                playerX = (App.Host.player[App.currentRound][1]) - 1;
                playerY = App.Host.player[App.currentRound][0];
            }
	    //change turn
	    if (App.currentRound < (App.Host.numPlayersInRoom - 1)) {
		App.currentRound += 1;
		IO.checkIfOut(App.currentRound);
            }
	    else if (App.currentRound == (App.Host.numPlayersInRoom - 1)) {
		App.currentRound = 0;
		IO.checkIfOut(App.currentRound);
	    }

            if(App.myRole === 'Host') {
		//console.log('Player Turn: '+App.currentRound+', Answer: '+data.answer+', Player Y: '+playerY+', Player X: '+playerX+'. ');
                App.Host.square[data.answer] = data.cardAnswer;
		App.Host.addSquare(playerY, playerX, data.answer);
            }
	    }
        },

	checkIfOut : function(player) {
		if(App.Host.player[player][3] == 0) {
			if (App.currentRound < (App.Host.numPlayersInRoom - 1)) {
                		App.currentRound += 1;
                		IO.checkIfOut(App.currentRound);
            		}
            		else if (App.currentRound == (App.Host.numPlayersInRoom - 1)) {
                		App.currentRound = 0;
               			 IO.checkIfOut(App.currentRound);
            		}
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
        },


	passedNewCard : function(data) {
		App.Player.passedNewCard(data);
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
	    App.$doc.on('click', '.btnRotate',App.Player.onRotateClick);
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
		//[7,5,0] player 2

		App.Host.playersLeft = [App.numOfPlayers, 0]; //keeps track of players still in the game;

		var startingspots = [[0,2,4, '#D92442'],
				     [7,5,1, '#476BB4'],
				     [5,0,2, '#248838'],
				     [2,7,6, '#D36AB4'],
				     [7,3,1, '#E49937'],
				     [0,4,5, '#919792'],
				     [4,7,7, '#000000'],
			             [3,0,3, '#FFFFFF']];
		var innerPlayerArray = new Array(4);
                // Display the players' names on screen
		for(var i = 0; i < App.numOfPlayers; i++)
		{ 
		    $('#playerScores')
			
                    	.append('<div id="player'+ (i+1) + 'Score" class="playerScore col-xs-3"> <span class="score">&#x205C</span><span class="playerName">'+App.Host.players[i].playerName+'</span> </div>');
			$('#player'+(i+1)+'Score').children('.playerName').css('background-color',startingspots[i][3]);
			$('#player8Score').children('.playerName').css('color','#000000');
			innerPlayerArray = [startingspots[i][0], startingspots[i][1], startingspots[i][2], 1, startingspots[i][3]];
			//innerPlayerArray = [startingspots[i][0], startingspots[i][1], startingspots[i][2], App.Player.myName];
			App.Host.player[i] = innerPlayerArray;	
			//console.log("entered player " + startingspots[i][0] + " " +  startingspots[i][1] + " " + startingspots[i][2] + " " + App.Player.myName);
			// Set the Score section on screen to 0 for each player.
                	//$('#player' + i  + 'Score').find('.score').attr('id',App.Host.players[i-1].mySocketId);
		}
		//CODE BY BECKY - create board and display on page
		//App.Host.createBoard();
		//App.Host.drawBoard(6);
		//for (var player in App.Host.player) {
			//App.Host.showPlayer(App.Host.player[player][1]-1, App.Host.player[player][0]-1,App.Host.player[player][2]);

		//}
	//	App.Host.addSquare(2, 1, 2);
	/*	$('#board').append(App.Host.board+'<br>');
                $('#board').append('Original Board <br>');
		$('#board').append(App.Host.board[0] + '<br>');
		$('#board').append(App.Host.board[1] + '<br>');
                $('#board').append(App.Host.board[2] + '<br>');
                $('#board').append(App.Host.board[3] + '<br>');
                $('#board').append(App.Host.board[4] + '<br>');
                $('#board').append(App.Host.board[5] + '<br>');
                $('#board').append(App.Host.board[6] + '<br>');
                $('#board').append(App.Host.board[7] + '<br>');		
*/
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
		//ADDED BY BECKY
		$('#wordArea').html('<canvas id="myCanvas" width="600" height="600"></canvas>');
		App.Host.createBoard();
		App.Host.drawBoard(6);
		var displayPlayerStartingPoints = [[1, 0, 1], [4, 5, 4], [0, 4, 7], [5, 1, 3], [2, 5, 4], [3, 0, 0], [5, 3, 2], [0, 2, 6]]; 
		for (var player in displayPlayerStartingPoints) {
			if (player < App.Host.numPlayersInRoom) {
                        App.Host.showPlayer(displayPlayerStartingPoints[player][0], displayPlayerStartingPoints[player][1],displayPlayerStartingPoints[player][2], App.Host.player[player][4]);
			}
		}
		$('#turnDisplay').html(App.Host.players[0].playerName+'\'s Turn');
		//ADDED BY BECKY

                // Update the data for the current round
                App.Host.currentCorrectAnswer = data.answer;
                App.Host.currentRound = data.round;
            },
	    //DRAW GAMEBOARD **MC**
	    drawBoard : function(size) { 
				var c = document.getElementById("myCanvas");
                        	var ctx = c.getContext("2d");
				ctx.strokeStyle = 'rgba(0,0,0,.1)';
				ctx.lineWidth = 4;
				//vertical line generator
				for(var i = 1; i < size; i++){
					ctx.beginPath();
					ctx.moveTo((i * 100), 0);
					ctx.lineTo((i * 100), (size * 100));
					ctx.stroke();
				}
				//horizontal line generator
				for(var i = 1; i < size; i++){
					ctx.beginPath();
					ctx.moveTo(0, (i * 100));
					ctx.lineTo((size * 100), (i * 100));
					ctx.stroke();
				}
		         } , 	
	    /***********Added by Becky**************/ 
	    createBoard : function() {
		App.Host.board = new Array(8); 
		//App.Host.square = [[6, 5, 4, 7, 2, 1, 0, 3], [4, 7, 6, 5, 0, 3, 2, 1], [7, 6, 5, 4, 3, 2, 1, 0], [7, 6, 3, 2, 5, 4, 1, 0]];
		//App.Host.square = [[5, 4, 7, 6, 1, 0, 3, 2], [6, 3, 5, 1, 7, 2, 0, 4], [7, 6, 5, 4, 3, 2, 1, 0], [7, 6, 3, 2, 5, 4, 1, 0]];
		//App.Host.playerCards = [[0, 1, 2, 3], [3, 2, 1, 0], [1, 3, 2, 0], [2, 1, 0, 3]];
//	       App.Host.deal();	
	       App.Host.square =[[1,0,3,2,5,4,7,6],
				 [4,5,6,7,0,1,2,3],
				 [1,0,7,5,6,3,4,2],
				 [1,0,5,7,6,2,4,3],
				 [1,0,6,7,5,4,2,3],
				 [1,0,7,4,3,6,5,2],
				 [1,0,5,6,7,2,3,4],
				 [2,4,0,5,1,3,7,6],
				 [2,3,0,1,5,4,7,6],
				 [2,4,0,3,1,7,6,5],
				 [2,5,0,6,7,1,3,4],
				 [2,4,0,7,1,6,5,3],
				 [2,5,0,7,6,1,4,3],
				 [3,7,4,0,2,6,5,1],
				 [3,5,6,0,7,1,2,4],
				 [3,2,1,0,5,4,7,6],
				 [3,6,5,0,7,2,1,4],
				 [4,6,3,2,0,7,1,5],
				 [4,7,6,5,0,3,2,1],
				 [4,6,7,5,0,3,1,2],
				 [5,4,7,6,1,0,3,2],
				 [5,4,3,2,1,0,7,6],
				 [5,4,6,7,1,0,2,3],
				 [5,7,6,4,3,0,2,1],
				 [5,2,1,6,7,0,3,4],
				 [6,3,4,1,2,7,0,5],
				 [6,7,5,4,3,2,0,1],
				 [6,3,5,1,7,2,0,4],
				 [6,7,4,5,2,3,0,1],
				 [7,5,6,4,3,1,2,0],
				 [7,5,3,2,6,1,4,0],
				 [7,6,5,4,3,2,1,0],
				 [7,2,1,4,3,6,5,0],
				 [7,3,4,1,2,6,5,0],
				 [7,3,6,1,5,4,2,0]];
		var data = {
			square: App.Host.square,
			gameId: App.gameId
		}
		IO.socket.emit('sendSquare',data);
		App.Host.playerCards = [[0, 1, 2, 3], [3, 2, 1, 0], [1, 3, 2, 0], [2, 1, 0, 3]];
		for (var i = 0; i < 8; i++) {
			App.Host.board[i] = new Array(8);
			for (var j = 0; j < 8; j++) {
				App.Host.board[i][j] = '_';
			}
		}
           	var c = document.getElementById("myCanvas");
		var ctx = c.getContext("2d");
	
		
		App.Host.boardCoordinates = [];
		var boardsize = 8; //8x8

		for(var by = 0 ; by < boardsize; by ++) {
    			var column = [];
    			
			for(var xy = 0 ; xy < boardsize; xy ++) {
        			var row = [];
        			
				for(var sq = 0 ; sq < 8; sq ++) {
            				// adding ticks
           		 		var tick = [];
            				if(sq == 0){
            					tick.push((xy * 100) + 33);
            					tick.push(by * 100);
           				} else if (sq == 1){
            					tick.push((xy * 100) + 66);
            					tick.push(by * 100);
           				} else if (sq == 2){
            					tick.push((xy * 100) + 100);
            					tick.push((by * 100) + 33);
           				} else if (sq == 3){
            					tick.push((xy * 100) + 100);
          	  				tick.push((by * 100) + 66);
           	 			} else if (sq == 4){
            					tick.push((xy * 100) + 66);
            					tick.push((by * 100) + 100);
           				} else if (sq == 5){
            					tick.push((xy * 100) + 33);
            					tick.push((by * 100) + 100);
           				} else if (sq == 6){
            					tick.push(xy * 100);
            					tick.push((by * 100) + 66);
           				} else if (sq == 7){
            					tick.push(xy * 100);
            					tick.push((by * 100) + 33);
           	 			}	 
           				// tick.push("x"); // calulate number
           	 			// tick.push("y"); // calulate number

           		 		row.push(tick);
       		 		}
       				 column.push(row);
    			}
   			App.Host.boardCoordinates.push(column);
		}
//		console.log(App.Host.boardCoordinates);
	    },
	/*****Added by MC*****/
	   squareMaker : function(brdy, brdx, squareArr){
		
			var c = document.getElementById("myCanvas");
         	        var ctx = c.getContext("2d");
			var boardTile = App.Host.boardCoordinates[brdy][brdx];
			ctx.lineWidth = 5;
			ctx.strokeStyle = '#584D58';
			var newArr = [];

			for(var i = 0; i < squareArr.length; i++){
				ctx.beginPath();
				ctx.moveTo(boardTile[i][0], boardTile[i][1]);
				if ((i == 0 && squareArr[i] == 1) || (i == 1 && squareArr[i] == 0)) {
					ctx.bezierCurveTo(boardTile[i][0],(boardTile[i][1]+20),boardTile[squareArr[i]][0],(boardTile[squareArr[i]][1]+20),boardTile[squareArr[i]][0],boardTile[squareArr[i]][1]);
				} 
				else if ((i == 2 && squareArr[i] == 3) || (i == 3 && squareArr[i] == 2)) {
					ctx.bezierCurveTo(boardTile[i][0]-20,boardTile[i][1],boardTile[squareArr[i]][0]-20,boardTile[squareArr[i]][1],boardTile[squareArr[i]][0],boardTile[squareArr[i]][1]);
				}
				else if ((i == 4 && squareArr[i] == 5) || (i == 5 && squareArr[i] == 4)) {
					ctx.bezierCurveTo(boardTile[i][0],boardTile[i][1]-20,boardTile[squareArr[i]][0],boardTile[squareArr[i]][1]-20,boardTile[squareArr[i]][0],boardTile[squareArr[i]][1]);	
				}
				else if ((i == 6 && squareArr[i] == 7) || (i == 7 && squareArr[i] == 6)) {
                                	ctx.bezierCurveTo(boardTile[i][0]+20,boardTile[i][1],boardTile[squareArr[i]][0]+20,boardTile[squareArr[i]][1],boardTile[squareArr[i]][0],boardTile[squareArr[i]][1]);
				}
				else {
					ctx.lineTo(boardTile[squareArr[i]][0], boardTile[squareArr[i]][1]);
				}
				ctx.stroke();
				newArr.push(boardTile[squareArr[i]]);
			}
	
//			console.log(newArr);

	},
	/*****End Added by MC*****/	

	showPlayer : function (x,y,playerposition, color) {
		if(playerposition == 0){
			var brdx =((x * 100) + 33);
			var brdy = (y * 100);
		} else if (playerposition == 1){
			var brdx =((x * 100) + 66);
			var brdy = (y * 100);
		} else if (playerposition == 2){
			var brdx =((x * 100) + 100);
			var brdy = ((y * 100) + 33);
		} else if (playerposition == 3){
			var brdx =((x * 100) + 100);
			var brdy = ((y * 100) + 66);
		} else if (playerposition == 4){
			var brdx =((x * 100) + 66);
			var brdy = ((y * 100) + 100);
		} else if (playerposition == 5){
			var brdx =((x * 100) + 33);
			var brdy = ((y * 100) + 100);
		} else if (playerposition == 6){
			var brdx =(x * 100);
			var brdy = ((y * 100) + 66);
		} else if (playerposition == 7){
			var brdx =(x * 100);
			var brdy = ((y * 100) + 33);
		}
		var c = document.getElementById("myCanvas");
		var ctx = c.getContext("2d");
		ctx.beginPath();
		ctx.fillStyle = color;
     		ctx.arc(brdx, brdy, 7, 0, 2 * Math.PI, false);
		ctx.fill();
       		ctx.lineWidth = 2;
		ctx.stroke();

//		ctx.fillRect(brdx,brdy,15,15);
	},


           addSquare : function(y, x, squareNumber) {
		//change turn
		$('#turnDisplay').html(App.Host.players[App.currentRound].playerName+'\'s Turn');

		App.Host.board[y][x] = squareNumber; 
		/*$('#board').append(App.Host.board[0] + ' <br>');
                $('#board').append(App.Host.board[1] + ' <br>');
                $('#board').append(App.Host.board[2] + ' <br>');
                $('#board').append(App.Host.board[3] + ' <br>');
                $('#board').append(App.Host.board[4] + ' <br>');
                $('#board').append(App.Host.board[5] + ' <br>');
                $('#board').append(App.Host.board[6] + ' <br>');
                $('#board').append(App.Host.board[7] + ' <br>');*/
		//console.log("Current round" + App.currentRound + " ");
		$('#board').append(' <br>');
		//console.log(App.Host.player[0]);
		//console.log(App.Host.player[1]);
		App.Host.movePlayerRecursive(); //Added by seth
		App.Host.squareMaker(y-1,x-1,App.Host.square[squareNumber] );
		//App.Host.movePlayerRecursive(); //Added by seth
	   },		

	playerKilled : function(individual)
	{	
/*		console.log(" ");
		console.log("Individual 0 Y " + App.Host.player[0][0] + " X " + App.Host.player[0][1] + " P " + App.Host.player[0][2] + " isAlive " + App.Host.player[0][3]);
		console.log("Individual 1 Y " + App.Host.player[1][0] + " X " + App.Host.player[1][1] + " P " + App.Host.player[1][2] + " isAlive " + App.Host.player[1][3]);
		console.log("Individual 2 Y " + App.Host.player[2][0] + " X " + App.Host.player[2][1] + " P " + App.Host.player[2][2] + " isAlive " + App.Host.player[2][3]);
		console.log("Individual 3 Y " + App.Host.player[3][0] + " X " + App.Host.player[3][1] + " P " + App.Host.player[3][2] + " isAlive " + App.Host.player[3][3]);
		console.log("Individual 4 Y " + App.Host.player[4][0] + " X " + App.Host.player[4][1] + " P " + App.Host.player[4][2] + " isAlive " + App.Host.player[4][3]);
		console.log("Individual 5 Y " + App.Host.player[4][0] + " X " + App.Host.player[4][1] + " P " + App.Host.player[4][2] + " isAlive " + App.Host.player[4][3]);
		console.log("Individual 6 Y " + App.Host.player[4][0] + " X " + App.Host.player[4][1] + " P " + App.Host.player[4][2] + " isAlive " + App.Host.player[4][3]);
		console.log("Individual 7 Y " + App.Host.player[4][0] + " X " + App.Host.player[4][1] + " P " + App.Host.player[4][2] + " isAlive " + App.Host.player[4][3]);




		console.log("Players left " + App.Host.playersLeft[0]);
*/		if(((App.Host.player[individual][0] == 1 && (App.Host.player[individual][2] == 0 || App.Host.player[individual][2] == 1)) 
		||  (App.Host.player[individual][0] == 6 && (App.Host.player[individual][2] == 4 || App.Host.player[individual][2] == 5))
		||  (App.Host.player[individual][1] == 1 && (App.Host.player[individual][2] == 6 || App.Host.player[individual][2] == 7))
		||  (App.Host.player[individual][1] == 6 && (App.Host.player[individual][2] == 2 || App.Host.player[individual][2] == 3))) 
		&&  (App.Host.player[individual][3] != 0))
		{
			console.log("Player died");
			App.Host.player[individual][3] = 0; //player not Alive
			var data =  {
        			gameId: App.gameId,
        			player: individual
    			}
    			IO.socket.emit('playerLost',data);
			App.Host.playersLeft[0] = App.Host.playersLeft[0] - 1;
			$('#player'+(parseInt(individual)+1)+'Score').children('.playerName').html('Out!');
		}
	},
	

	   /***********Added by Seth**************/
	movePlayerRecursive : function()
	{
		//checks if player is in a touching square and also on the touching two positions of that square. If so then return true else false.
		var individual;
		var swapPosition = [5,4,7,6,1,0,3,2]; //swapPosition converts the position of old location into position of new location
		//App.Host.playersLeft = [0, App.numOfPlayers]; //keeps track of players still in the game;
		for(individual in App.Host.player)
		{
			App.Host.playerKilled(individual);
			if(App.Host.player[individual][3])
			{	
				//App.Host.playersLeft[0]++;
				App.Host.playersLeft[1] = individual;//stores the last living player 
				//console.log("Players left " + App.Host.playersLeft[0] + " Player who is left " + App.Host.playersLeft[1] + " Player life status " + App.Host.player[individual][3]);
				if(App.Host.player[individual][2] == 0 || App.Host.player[individual][2] == 1)
				{
					if(App.Host.board[ App.Host.player[individual][0]-1 ][ App.Host.player[individual][1] ] != '_')
					{
						App.Host.player[individual][0] = App.Host.player[individual][0]-1; //sets players y to y of new piece
						App.Host.player[individual][2] = App.Host.square[  App.Host.board[  App.Host.player[ individual ][ 0 ]  ][ App.Host.player[ individual ][ 1 ] ]  ][ swapPosition[ App.Host.player[ individual ][ 2 ] ]  ]; //maps players position to new position
                                               // console.log("Player" + individual + " " + App.Host.player[individual][0] + " " + App.Host.player[individual][1] + " " + App.Host.player[individual][2] + " " + swapPosition[App.Host.player[individual][2]]);
						App.Host.showPlayer(App.Host.player[individual][1]-1, App.Host.player[individual][0]-1,App.Host.player[individual][2], App.Host.player[individual][4]);
						App.Host.movePlayerRecursive();
	
					}
				}else if(App.Host.player[individual][2] == 2 || App.Host.player[individual][2] == 3)
				{
					if(App.Host.board[ App.Host.player[individual][0] ][ App.Host.player[individual][1]+1 ] != '_')
					{
						App.Host.player[individual][1] = App.Host.player[individual][1]+1; //sets players x to x of new piece	
						App.Host.player[individual][2] = App.Host.square[  App.Host.board[App.Host.player[individual][0]][App.Host.player[individual][1]]  ][  swapPosition[ App.Host.player[individual][2] ]  ]; //maps players position to new position
                                                //console.log("Player" + individual + " " + App.Host.player[individual][0] + " " + App.Host.player[individual][1] + " " + App.Host.player[individual][2] + " " + swapPosition[App.Host.player[individual][2]]);
						App.Host.showPlayer(App.Host.player[individual][1]-1, App.Host.player[individual][0]-1,App.Host.player[individual][2], App.Host.player[individual][4]);
						App.Host.movePlayerRecursive();	
					}
				}else if(App.Host.player[individual][2] == 4 || App.Host.player[individual][2] == 5)
				{
					if(App.Host.board[ App.Host.player[individual][0]+1 ][ App.Host.player[individual][1] ] != '_')
					{
						App.Host.player[individual][0] = App.Host.player[individual][0]+1; //sets players y to y of new piece	
						App.Host.player[individual][2] = App.Host.square[  App.Host.board[App.Host.player[individual][0]][App.Host.player[individual][1]]  ][  swapPosition[ App.Host.player[individual][2] ]  ]; //maps players position to new position		
                                                //console.log("Player" + individual + " " + App.Host.player[individual][0] + " " + App.Host.player[individual][1] + " " + App.Host.player[individual][2] + " " + swapPosition[App.Host.player[individual][2]]);
						App.Host.showPlayer(App.Host.player[individual][1]-1, App.Host.player[individual][0]-1,App.Host.player[individual][2], App.Host.player[individual][4]);
						App.Host.movePlayerRecursive();
					}
				}else if(App.Host.player[individual][2] == 6 || App.Host.player[individual][2] == 7)
				{
					if(App.Host.board[ App.Host.player[individual][0] ][ App.Host.player[individual][1]-1 ] != '_')
					{
						App.Host.player[individual][1] = App.Host.player[individual][1]-1; //sets players x to x of new piece
						App.Host.player[individual][2] = App.Host.square[  App.Host.board[App.Host.player[individual][0]][App.Host.player[individual][1]]  ][  swapPosition[ App.Host.player[individual][2] ]  ]; //maps players position to new position		
						//console.log("Player" + individual + " " + App.Host.player[individual][0] + " " + App.Host.player[individual][1] + " " + App.Host.player[individual][2] + " " + swapPosition[App.Host.player[individual][2]]);
						App.Host.showPlayer(App.Host.player[individual][1]-1, App.Host.player[individual][0]-1,App.Host.player[individual][2], App.Host.player[individual][4]);					
						App.Host.movePlayerRecursive();			
					}
				}
			}
		}
                /*console.log(" ");
                console.log("Individual 0 Y " + App.Host.player[0][0] + " X " + App.Host.player[0][1] + " P " + App.Host.player[0][2] + " isAlive " + App.Host.player[0][3]);
                console.log("Individual 1 Y " + App.Host.player[1][0] + " X " + App.Host.player[1][1] + " P " + App.Host.player[1][2] + " isAlive " + App.Host.player[1][3]);
                console.log("Individual 2 Y " + App.Host.player[2][0] + " X " + App.Host.player[2][1] + " P " + App.Host.player[2][2] + " isAlive " + App.Host.player[2][3]);
                console.log("Individual 3 Y " + App.Host.player[3][0] + " X " + App.Host.player[3][1] + " P " + App.Host.player[3][2] + " isAlive " + App.Host.player[3][3]);
                console.log("Individual 4 Y " + App.Host.player[4][0] + " X " + App.Host.player[4][1] + " P " + App.Host.player[4][2] + " isAlive " + App.Host.player[4][3]);
                console.log("Individual 5 Y " + App.Host.player[5][0] + " X " + App.Host.player[5][1] + " P " + App.Host.player[5][2] + " isAlive " + App.Host.player[5][3]);
                console.log("Individual 6 Y " + App.Host.player[6][0] + " X " + App.Host.player[6][1] + " P " + App.Host.player[6][2] + " isAlive " + App.Host.player[6][3]);
                console.log("Individual 7 Y " + App.Host.player[7][0] + " X " + App.Host.player[7][1] + " P " + App.Host.player[7][2] + " isAlive " + App.Host.player[7][3]);
                console.log("Players left " + App.Host.playersLeft[0]);*/

		if(App.Host.playersLeft[0] <= 1)
		{
			var data =  {
                                gameId: App.gameId,
                                player: App.Host.playersLeft[1]
                        }
			console.log(App.Host.playersLeft[1]);
                        IO.socket.emit('playerWin',data);
			//playersLeft[1] will be equal to the number to access the winning player;
			$('#turnDisplay').html('<div class="youWon">'+App.Host.players[App.Host.playersLeft[1]].playerName+' Is the Winner!</div>');
		}
	},

/*	deal : function()
	{	
		App.Host.isDealt = new Array(36);
		for(var i = 0; i < 36; i++)
		{
			App.Host.isDealt[i] = 0;
		}

		App.Host.cards = new Array(App.numOfPlayers);
		var cardArray;
		for(cardArray in App.Host.player)
		{
			App.Host.cards[cardArray] = [cardArray * 4 + 0, cardArray * 4 + 1, cardArray * 4 + 2, cardArray * 4 + 3];		
		}
		//console.log("Hey over here these are the cards " + App.Host.cards);		
		for(var i = 0; i < App.numOfPlayers * 4; i++)
		{
			App.Host.isDealt[i] = 1;
		}
	},

	//draw a card from the deck
	drawCard : function(myID, cardID, playerCardIndex)
	{
		console.log("Still calls this one");
		//console.log("Inside drawCard myID " + myID + " cardID " + cardID + " playerCardIndex " + playerCardIndex);
		//console.log("isDealt " + App.Host.isDealt);
		var cardIndex;
		for(cardIndex in App.Host.isDealt)
		{
			//console.log("isDealt[cardIndex] " + App.Host.isDealt[cardIndex]);
			if(App.Host.isDealt[cardIndex] == 0)
			{
				App.Host.cards[myID][cardID] = cardIndex;
				App.Host.isDealt[cardIndex] = 1;
				var data = {
					   	cardIndex: cardIndex,
					   	cardID: cardID,
						myID: myID,
					   	playerCardIndex: playerCardIndex,
						gameID: App.gameID,
						hostCards: App.Host.cards,
						numOfPlayers: App.numOfPlayers,
					 	squareArray: App.Host.square
					  }
				//console.log("Inside loop inside drawCard");
				IO.socket.emit('receiveNewCard',data);
				break;
				//send cardIndex, cardID, to playerID 
			}
		}
	},
*/
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

//	    },

	    turnSquare : function(/*turnRight*/){
		/*if(turnRight)
		{    
		    var swapSquare = [App.Host.square.shift(), App.Host.square.shift()];//set swap square to first two of square array
		    App.Host.square[6] = swapSquare[0];//moves these two to the end of square array
		    App.Host.square[7] = swapSquare[1];
		}else
		{*/
		var swapSquare = [App.Host.square.pop(), App.Host.square.pop()];//sets swapSquare to last two of square array
		App.Host.square.unshift(swapSquare[1], swapSquare[0]);//adds the two swapSquare onto the front of the square array
		//}
		for(var i = 0; i <= 7; i++)
		{
			App.Host.square[i] = (App.Host.square[i] + 2)%8;
			
		}
                /*for(var i = 0; i <= 7; i++)
                {
                        App.Host.square[i] = (App.Host.square[i] - 2)%8;
                        
                }*/
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
			//addSquare(); //added by Becky
			//movePlayer();//doesn't exist yet
				
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
	
	    myID: 0,
	    
	    totalPlayerCount: 0,
	
	    cards: new Array(8),	    
 
	    square: [],
            /**
             * Click handler for the 'JOIN' button
             */
	    /**
	    *gathering player Canvas and player Cnavas context
	    */	
	    pC : [],
	    pCctx : [],	
            onJoinClick: function () {
                // console.log('Clicked "Join A Game"');

                // Display the Join Game HTML on the player's screen.
                App.$gameArea.html(App.$templateJoinGame);
	//	console.log("Players new player count" + totalPlayerCount);
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
                    playerName : $('#inputPlayerName').val() || 'Jarvis'
		    //myID : App.Player.myID,
		    //cardID : 
               };
		//console.log("Players new player count" + totalPlayerCount);
                // Send the gameId and playerName to the server
                IO.socket.emit('playerJoinGame', data);
                // Set the appropriate properties for the current player.
                App.myRole = 'Player';
                App.Player.myName = data.playerName;
		/*******ADDED BY BECKY********/
	//	App.Player.cards = [[0, 1, 2, 3],[11, 27, 5, 9],[4, 10, 11, 9], [15, 20, 1, 0], [9, 10, 3, 19], [20, 32, 7, 4], [2, 17, 23, 24], [34, 6, 13, 19]];
		//App.Player.cards = [];
		/********Added By Seth**********/
		//App.Host.dealCards();


		/*******ADDED BY BECKY********/
		//App.Player.getPlayerCount();
            },


	    assignPlayerCount: function(playerCount) {
		App.Player.myID = playerCount;
		App.Player.totalPlayerCount = playerCount +1;
//	    console.log("Players new player count" + totalPlayerCount);
		},

	    onRotateClick: function() {
		var $btn = $(this);     
                var card = $btn.val();
		App.Player.turnSquare(card);
	    },
	    squareMaker2: function(context, squareArr){ 
		var pboard = [[33,0],[66,0],[100,33],[100,66],[66,100],[33,100],[0,66],[0,33]];
		context.lineWidth = 5;
		context.strokeStyle = '#584D58';

		for(var i = 0; i < squareArr.length; i++){
			context.beginPath();
			
			context.moveTo(pboard[i][0], pboard[i][1]);
			if ((i == 0 && squareArr[i] == 1) || (i == 1 && squareArr[i] == 0)) {
	                context.bezierCurveTo(pboard[i][0],(pboard[i][1]+20),pboard[squareArr[i]][0],(pboard[squareArr[i]][1]+20),pboard[squareArr[i]][0],pboard[squareArr[i]][1]);
			context.lineTo(pboard[squareArr[i]][0], pboard[squareArr[i]][1]);
			}
			else if ((i == 2 && squareArr[i] == 3) || (i == 3 && squareArr[i] == 2)) {
	                context.bezierCurveTo(pboard[i][0]-20,pboard[i][1],pboard[squareArr[i]][0]-20,pboard[squareArr[i]][1],pboard[squareArr[i]][0],pboard[squareArr[i]][1]);
	        }
	        else if ((i == 4 && squareArr[i] == 5) || (i == 5 && squareArr[i] == 4)) {
	                context.bezierCurveTo(pboard[i][0],pboard[i][1]-20,pboard[squareArr[i]][0],pboard[squareArr[i]][1]-20,pboard[squareArr[i]][0],pboard[squareArr[i]][1]);
	        }
	        else if ((i == 6 && squareArr[i] == 7) || (i == 7 && squareArr[i] == 6)) {
	                context.bezierCurveTo(pboard[i][0]+20,pboard[i][1],pboard[squareArr[i]][0]+20,pboard[squareArr[i]][1],pboard[squareArr[i]][0],pboard[squareArr[i]][1]);
	        }
	        else {
	                context.lineTo(pboard[squareArr[i]][0], pboard[squareArr[i]][1]);
	        }
			//context.lineTo(pboard[squareArr[i]][0], pboard[squareArr[i]][1]);
			context.stroke();
		}
	    },
	    // turnSquare : function(/*turnRight*/){
                /*if(turnRight)
                {    
                    var swapSquare = [App.Host.square.shift(), App.Host.square.shift()];//set swap square to first two of square array
                    App.Host.square[6] = swapSquare[0];//moves these two to the end of square array
                    App.Host.square[7] = swapSquare[1];
                }else
                {*/
	     turnSquare : function(card){
                var swapSquare = [App.Player.square[card].pop(), App.Player.square[card].pop()];//sets swapSquare to last two of square array
                App.Player.square[card].unshift(swapSquare[1], swapSquare[0]);//adds the two swapSquare onto the front of the square array
                //}
                for(var i = 0; i <= 7; i++)
                {
                      App.Player.square[card][i] = (App.Player.square[card][i] + 2)%8;
		}
		App.Player.clearCard()
            },
			
	    clearCard : function(){
		//Clears existing canvas on player and calls createPlayerCanvas to redraw square
                for(var n = 0; n < 4; n++){
                	 App.Player.pCctx[n].clearRect(0, 0, App.Player.pC[n].width, App.Player.pC[n].height);
                }	
		App.Player.createPlayerCanvas();
            },
            /**
             *  Click handler for the Player hitting a word in the word list.
             */
            onPlayerAnswerClick: function() {
                // console.log('Clicked Answer Button');
                var $btn = $(this);      // the tapped button
                var answer = $btn.val(); // The tapped word
		var buttonIndex;
		for(var card in App.Player.cards[App.Player.myID])
		{
console.log("Answer " + answer + " App.Player.cards[App.Player.myID][card] " + App.Player.cards[App.Player.myID][card]);
			if(App.Player.cards[App.Player.myID][card] == answer)
			{
			console.log("Answer " + answer + " App.Player.cards[App.Player.myID][card] " + App.Player.cards[App.Player.myID][card]);
				buttonIndex = card;
			}
		}
		
		var cardAnswer = App.Player.square[answer];
                // Send the player info and tapped word to the server so
                // the host can check the answer.
                var data = {
                	gameId: App.gameId,
                	playerId: App.mySocketId,
			myID: App.Player.myID,
			playerCardIndex: buttonIndex,
                	answer: answer,
			cardAnswer: cardAnswer,
			playerOrderId: App.Player.myID,
                	round: App.currentRound
                }
		console.log(data);
		App.Player.drawCard();
                IO.socket.emit('playerAnswer',data);
		//App.Player.drawCard();
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

/*	    passedNewCard : function(data)
	    {
		console.log("App.Player.myID " + App.Player.myID + " playerCardIndex " + data.playerCardIndex + "  data.myID " + data.myID + " cardID " + data.cardID);
		console.log("Player.cards " + App.Player.cards);
		console.log("Player.cards " + App.Player.cards[App.Player.myID]);
		console.log("Display player cards " + data.hostCards);
		//console.log("testing variables myname " +  


		for(var i = 0; i < data.numOfPlayers; i++)
		{
			
			App.Player.cards[i] = data.hostCards[i];
		}
		console.log("Display player cards " + data.hostCards);
		console.log("Display player cards " + App.Player.cards);
		if(App.Player.myID == data.myID)
		{
			App.Player.cards[App.Player.myID][data.playerCardIndex] = data.cardID;
			console.log("Player cards " + App.Player.cards);	
		}

		console.log("Print out this line of player.square " + App.Player.square[0]);

		App.Player.square = [,,,,,,,,];

		console.log("Print out this line of player.square " + App.Player.square[0]);
		console.log("Print out this line of data.squareArray " + data.squareArray[0]);
		for(var i = 0; i < data.squareArray.length; i++)
		{
			App.Player.square[i] = data.sqaureArray[i];
		}
		//App.Player.square = data.sqaureArray;
                App.Player.clearCard();    
	},

*/
	playerPassedNewCard : function(data)
            {
                console.log("App.Player.myID " + App.Player.myID + " playerCardIndex " + data.playerCardIndex + "  data.myID " + data.myID + " cardID " + data.cardID);
                console.log("Player.cards " + App.Player.cards);
                console.log("Player.cards " + App.Player.cards[App.Player.myID]);
                console.log("Display player cards " + data.hostCards);
                //console.log("testing variables myname " +  


                for(var i = 0; i < data.numOfPlayers; i++)
                {

                        App.Player.cards[i] = data.hostCards[i];
                }
                console.log("Display player cards " + data.hostCards);
                console.log("Display player cards " + App.Player.cards);
                if(App.Player.myID == data.myID)
                {
                        App.Player.cards[App.Player.myID][data.playerCardIndex] = data.cardID;
                        console.log("Player cards " + App.Player.cards);
                }

                console.log("Print out this line of player.square " + App.Player.square[0]);

                App.Player.square = [,,,,,,,,];

                console.log("Print out this line of player.square " + App.Player.square[0]);
                console.log("Print out this line of data.squareArray " + data.squareArray[0]);
                for(var i = 0; i < data.squareArray.length; i++)
                {
//                        App.Player.square[i] = data.sqaureArray[i];
                }
                //App.Player.square = data.sqaureArray;
                App.Player.clearCard();
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

	    youLose : function(player) {
		if (App.Player.myID == player && App.myRole == 'Player') {
                	$('#gameArea')
                    		.html('<div class="gameOver">Bummer, you lose!</div>');
            	}
	    },

	    youWin : function(player) {
                if (App.Player.myID == player && App.myRole == 'Player') {
                        $('#gameArea')
                                .html('<div class="gameOver">Awesome, you won!</div>');
                }
             },

	     playerStoreSquare : function(square) {
	     if (App.myRole == 'Player') {
		App.Player.square = square;
		App.Player.createPlayerCanvas();
	     }
             },
	     createPlayerCanvas : function(){
		var n = 0;
                for (var card in App.Player.cards[App.Player.myID]) {
                       // console.log(App.Player.square);
                       // console.log([App.Player.cards[App.Player.myID][card]]);
                        App.Player.squareMaker2(App.Player.pCctx[n],App.Player.square[App.Player.cards[App.Player.myID][card]]);
               		n += 1;
		 }
	     },	


	     drawCard : function()
            {
               console.log("Inside drawCard myID " + App.Player.myID + " cardID " + App.Player.cardID + " playerCardIndex " + App.Player.playerCardIndex);
               console.log("isDealt " + App.Host.isDealt);
                var cardIndex;
                for(cardIndex in App.Player.isDealt)
                {
                        //console.log("isDealt[cardIndex] " + App.Host.isDealt[cardIndex]);
                        if(App.Player.isDealt[cardIndex] == 0)
                        {
                                App.Player.cards[App.Player.myID][App.Player.cardID] = cardIndex;
                                App.Player.isDealt[cardIndex] = 1;
                                /*var data = {
                                                cardIndex: cardIndex,
                                                cardID: cardID,
                                                myID: myID,
                                                playerCardIndex: playerCardIndex,
                                                gameID: App.gameID,
                                                hostCards: App.Host.cards,
                                                numOfPlayers: App.numOfPlayers,
                                                squareArray: App.Host.square
                                          }*/
                                console.log("Inside loop inside drawCard");
                               // IO.socket.emit('receiveNewCard',data);
                                break;
                                //send cardIndex, cardID, to playerID 
                        }
                }
		App.Player.clearCard();
            },

            deal : function()
            {
                App.Player.isDealt = new Array(36);
                for(var i = 0; i < 36; i++)
                {
                        App.Player.isDealt[i] = 0;
                }

                App.Player.cards = new Array(App.numOfPlayers);
                var cardArray;
                for(cardArray in App.Player.player)
                {
                        App.Player.cards[cardArray] = [cardArray * 4 + 0, cardArray * 4 + 1, cardArray * 4 + 2, cardArray * 4 + 3];
                }
                console.log("Hey over here these are the cards " + App.Player.cards);
                for(var i = 0; i < App.numOfPlayers * 4; i++)
                {
                        App.Player.isDealt[i] = 1;
                }
             },


            /**
             * Show the list of words for the current round.
             * @param data{{round: *, word: *, answer: *, list: Array}}
             */
            newWord : function(data) {
                // Create an unordered list element
                //var $list = $('<ul/>').attr('id','ulAnswers');
		//App.Player.dealCards();
	
//		App.Player.deal();	
		App.Player.cards[App.Player.myID] =  [App.Player.myID * 4 + 0, App.Player.myID * 4 + 1, App.Player.myID * 4 + 2, App.Player.myID * 4 + 3];
		console.log(App.Player.cards[App.Player.myID]);
		/*******ADDED BY BECKY********/	
		//var topBox = '<div class="topBox">'+App.Player.myName+'</div>';
		//var $cardlist = $('<ul/>').attr('id','ulAnswers');
		//var $cardlist = $('<div/>').addClass('col-lg-10 col-md-10 col-sm-10 col-xs-10');
		var $cardlist = $('<ul/>').attr('id','ulAnswers');
		var card;
		var n = 0;
		for ( card in App.Player.cards[App.Player.myID]) {
		    var cardNumber = App.Player.cards[App.Player.myID][card];
		     $cardlist                                //  <ul> </ul>
			.append( $('<div/>')
				.addClass('row')
				.addClass('player-square') 
			    .append( $('<div/>')	
				    .addClass('col-xs-8')
                                .append( $('<li/>')              //  <ul> <li> </li> </ul>
                                    .append( $('<button/>')      //  <ul> <li> <button> </button> </li> </ul>
                                        .addClass('btnAnswer')   //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                        .addClass('btn')         //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                        .val(cardNumber)               //  <ul> <li> <button class='btnAnswer' value='word'> </button> </li> </ul>
                                .html('<canvas id="playerCanvas'+n+'" width="100" height="100"></canvas>')              //  <ul> <li> <button class='btnAnswer' value='word'>word</button> </li> </ul>
                                    )
                                )
		       	    )
		        	.append('<div class="col-xs-4 rotate"><button value='+cardNumber+' class="btnRotate"><i class="fa fa-repeat"></i></button></div>')
			)
		      n += 1;
		};	
		console.log('MyID: '+App.Player.myID);
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
		//$('#gameArea').html(topBox);
		$('#gameArea').html($cardlist);
		//Create Player Canvas and Context
		//pC----Player Canvas, pCctx----Player Canvas Context
                        for (var i = 0; i < 4; i++){
                                App.Player.pC.push(document.getElementById('playerCanvas'+i));
                        }
                console.log(App.Player.pC);
                for(var i = 0; i <App.Player.pC.length; i++){
                        App.Player.pCctx.push(App.Player.pC[i].getContext("2d"));
                }
                console.log(App.Player.pCctx);


		console.log('MyID: '+App.Player.myID);
                console.log('MyName: '+App.Player.myName);  
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
