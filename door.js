load('utils.js');
function openDoor(){
    var card = new Card();
    atr = card.reset(Card.RESET_COLD);
    var eraseVal = new ByteString('FF FF FF FF', HEX);
    var KTML = new ByteString('0001020304050607', HEX);
    var KTMR = new ByteString('18191A1B1C1D1E1F', HEX);
    var room = '4242';
    var today = Utils.time.getToday();
    var hotel = 'HT01';
    try{
	card.authenticate();
	
	// Reading card type
	var cardType = card.readFile(4, 4)
	if (cardType.status === '9000')
	    cardType = cardType.data.toString(ASCII);
	else
	    throw '[ERROR] Error reading cardType: ' + cardType.status;
	
	if(cardType !== 'TODO' && cardType !== 'UNOC')
	    throw 'Invalid card type!!! access denied!!';
	if(cardType === 'UNOC'){
	    var cardHotel = card.readFile(5, 4);
	    if (cardHotel.status === '9000')
		cardHotel = cardHotel.data.toString(ASCII);
	    else
		throw '[ERROR] Error reading card hotel field: ' + cardHotel.status;
	    if(cardHotel !== hotel)
		throw 'Wrong hotel!!! access denied!';

	    var cardRoom = card.readFile(0x0B, 4);
	    if (cardRoom.status === '9000')
		cardRoom = cardRoom.data.toString(ASCII);
	    else
		throw '[ERROR] Error reading card hotel field: ' + cardRoom.status;
	    if(cardRoom !== room)
		throw 'Wrong room!!! access denied!';
	    
	    var cardExitDate = card.readFile(9, 4);
	    if (cardExitDate.status === '9000')
		cardExitDate = cardExitDate.data.toString(ASCII);
	    else
		throw '[ERROR] Error reading card hotel field: ' + cardExitDate.status;
	    
	    var cardExitYear = card.readFile(0x0A, 4);
	    if (cardExitYear.status === '9000')
		cardExitDate += cardExitYear.data.toString(ASCII);
	    else
		throw '[ERROR] Error reading card hotel field: ' + cardExitYear.status;

	    cardExitDate = Utils.time.str2date(cardExitDate, '%d%m%Y');
	    if(cardExitDate < today)
		throw 'This room is no longer yours!!! Access denied!';

	}
	print('Access granted!!');

    }catch(err){
	print(err);
    }finally{
	print('Operation finished!!');
	card.close();
    }
}

openDoor();