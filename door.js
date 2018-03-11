load('utils.js');
function openDoor(){
    var card = new Card();
    atr = card.reset(Card.RESET_COLD);
    var eraseVal = new ByteString('FF FF FF FF', HEX);
    var KTML = new ByteString('0001020304050607', HEX);
    var KTMR = new ByteString('18191A1B1C1D1E1F', HEX);
    try{
	card.authenticate();
	
	// Reading card type
	var cardType = card.readFile(4, 4)
	if (cardType.status === '9000')
	    cardType = cardType.data.toString(ASCII);
	else
	    throw '[ERROR] Error reading cardType: ' + card.status;
	
	if(cardType !== 'TODO' && cardType !== 'UNOC')
	    throw 'Invalid card type!!! access denied!!';
	if(cardType === 'UNOC'){
	    print('UNOC')
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