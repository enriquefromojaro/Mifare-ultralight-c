load('utils.js');
function registerCard(masterKey, hotelID, userInfo, entryDate, exitDate){
    var card = new Card();
    var eraseVal = new ByteString('FF FF FF FF', HEX);
    var KTML = new ByteString('0001020304050607', HEX);
    var KTMR = new ByteString('18191A1B1C1D1E1F', HEX);
    try{
	// Writing key type
	var keyType = masterKey? 'TODO': 'UNOC';
	var resp = card.writeFile(4, new ByteString(keyType, ASCII));
	if (resp.status !== '9000')
	    throw '[ERROR] Error writing key type: ' + resp.status;
	
	// Writing hotel ID:
	var resp = card.writeFile(5, new ByteString(hotelID.substring(0, 4), ASCII));
	if (resp.status !== '9000')
	    throw '[ERROR] Error writing hotel ID: ' + resp.status;
	
	// Writing client/empolye ID
	var pID = masterKey? 'E': 'C';
	pID += Utils.numbers.fixedLengthIntString(userInfo.id, 3);
	resp = card.writeFile(6, new ByteString(pID, ASCII));
	if (resp.status !== '9000')
	    throw '[ERROR] Error writing client/employe ID: ' + resp.status;

	// Writing entry date or employe birth date
	var entryDate = masterKey? userInfo.birthDay : entryDate;
	var entryStr = Utils.time.formatDate(entryDate, '%d%m');
	resp = card.writeFile(7, new ByteString(entryStr, ASCII));
	if (resp.status !== '9000')
	    throw '[ERROR] Error writing entry date/empolye birthday: ' + resp.status;
	
	// Writing entry year
	var yearStr = Utils.time.formatDate(entryDate, '%Y');
	resp = card.writeFile(8, new ByteString(entryStr, ASCII));
	if (resp.status !== '9000')
	    throw '[ERROR] Error writing entry year /empolye birth year: '+ resp.status;

	if (!masterKey) {
	    /* 
	     * If the card is a key for a client, we write the files for
	     * exit and room with that info
	     */
	    
	    // Writing exit date
	    var exitDateStr = Utils.time.formatDate(exitDate, '%d%m');
	    resp = card.writeFile(9, new ByteString(exitDateStr, ASCII));
	    if (resp.status !== '9000')
		throw '[ERROR] Error exit date: ' + resp.status;

	    // Writing exit year
	    var exitYearStr = Utils.time.formatDate(exitDate, '%Y');
	    resp = card.writeFile(0x0A, new ByteString(exitYearStr, ASCII));
	    if (resp.status !== '9000')
		throw '[ERROR] Error writing exit year: ' + resp.status;
	    
	    var room = Utils.numbers.fixedLengthIntString(userInfo.room, 4);
	    resp = card.writeFile(0x0B, new ByteString(room, ASCII));
	    if (resp.status !== '9000')
		throw '[ERROR] Error writing room: ' + resp.status;
	}else{
	    /*
	     * If it is a master key, we fill the fields for the exit
	     * and the room with FFFFFFFFH
	     */
	    
	    // Writing exit date
	    resp = card.writeFile(9, eraseVal);
	    if (resp.status !== '9000')
		throw '[ERROR] Error exit date: ' + resp.status;

	    // Writing exit year
	    resp = card.writeFile(0x0A, eraseVal);
	    if (resp.status !== '9000')
		throw '[ERROR] Error writing exit year: ' + resp.status;
	    
	    resp = card.writeFile(0x0B, eraseVal);
	    if (resp.status !== '9000')
		throw '[ERROR] Error writing room: ' + resp.status;
	}

	// Writing MAC:
	var eraseStr = eraseVal.toString(ASCII);
	var erasedFields = eraseStr + eraseStr + eraseStr;
	var macChain = keyType + hotelID.substring(0, 4) + pID + Utils.time.formatDate(entryDate, '%d%m%Y');
	macChain += masterKey? erasedFields: Utils.time.formatDate(exitDate, '%d%m%Y') + room;

	var cardKey = card.getCardKey(KTML.concat(KTMR), 'FF');
	var mac = card.calcMAC(new ByteString(macChain,ASCII), cardKey);
	resp = card.writeFile(0x0C, mac);
	if (resp.status !== '9000')
	    throw '[ERROR] Error writing mac: ' + resp.status;

    }catch(err){
	print(err);
    }finally{
	card.close();
    }
}

var userData = {
    id : 42,
    room: 4242,
    birthDay : new Date(1997, 04, 5)
};
registerCard(false, 'HT01', userData, Utils.time.getToday(), new Date(2018, 02, 30));



