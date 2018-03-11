Card.prototype.writeFile = function(fileNum, data){
    var command = new ByteString('FF D6 00 00',HEX).add(fileNum).concat(new ByteString('00', HEX).add(data.length)).concat(data);
    this.plainApdu(command);
    return {status: this.getStatus()};
}

Card.prototype.getStatus = function() {
    return this.SW.toString(16);
}

Card.prototype.readFile = function(file, length){
    var resp = this.sendApdu(0xFF, 0xB0, 0x00, file, length);
    return {
	data: resp,
	status: this.getStatus()
    };
}

Card.prototype.getSerialNumber = function(){
    var resp = this.sendApdu(0xFF, 0xCA, 0, 0, 7);
    return {
	data: resp,
	status: this.getStatus()
    };
}

Card.prototype.getCardKey = function(terminalKey){
    var serial =  card.getSerialNumber();
    if (serial.status === '9000')
        serial = serial.data;
    else{
        throw '[ERROR] Error reading the serial number: ' + resp.status;
    }
    var filledSerial = serial.concat(new ByteString('00', HEX));
    filledSerial = filledSerial.concat(filledSerial);
    return Utils.bytes.encryptAES_ECB(filledSerial, terminalKey);
}

Card.prototype.calcMAC = function(macChain, cardKey){
    var iv = cardKey.add(1);
    var mac = Utils.bytes.encryptAES_CBC(macChain, cardKey, iv);
    return mac.right(8).left(4);
}

Card.KTL = new ByteString('49 45 4D 4B 41 45 52 42', HEX);
Card.KTR = new ByteString('21 4E 41 43 55 4F 59 46', HEX);

Card.prototype.getChallenge = function(data){
    var command = new ByteString('FF 00 00 00 00', HEX).add(data.length).concat(data);
    var resp = this.plainApdu(command);
    return {
	status: this.getStatus(),
	data: resp
    };
}

Card.prototype.getPlainChallenge = function(){
    return this.getChallenge(new ByteString('1A 00', HEX));
}

Card.prototype.get3DESChallenge = function(rnd){
    return this.getChallenge(new ByteString('AF', HEX).concat(rnd));
}

Card.prototype.authenticate = function(){
    var resp = this.getPlainChallenge();
    if (resp.status === '9000')
	var cardRandom = resp.data.right(8);
    else
	throw "[ERROR] error in get challenge: " + resp.status;
    var terminalRandom = new Crypto().generateRandom(8);
    var cryptedRNDc = Utils.bytes.decrypt3DES_CBC(cardRandom, Card.KTL.concat(Card.KTR), new ByteString('00 00 00 00 00 00 00 00', HEX));
    cryptedRNDc = Utils.bytes.circularShift(cryptedRNDc, 'l');
    var rnd = terminalRandom.concat(cryptedRNDc);
    rnd = Utils.bytes.encrypt3DES_CBC(rnd, Card.KTL.concat(Card.KTR), cardRandom);
    resp = this.get3DESChallenge(rnd);
    if (resp.status === '9000'){
	var cardResponse = resp.data.right(8);
    }else
	throw "[ERROR] error in get 3DES challenge: " + resp.status;
    var RNDt = Utils.bytes.decrypt3DES_CBC(cardResponse, Card.KTL.concat(Card.KTR), rnd.right(8));

    RNDt = Utils.bytes.circularShift(RNDt, 'r');

    if(!terminalRandom.equals(RNDt))
	throw '[ERROR] terminal random does not match!!!';
    print('Authentication succeded!!!!');
}

Utils = {
    numbers : {},
    bytes : {},
    time: {}
};

Utils.numbers.fixedLengthIntString = function(num, length) {
    return ("00000000000000000" + num).slice(-1 * length);
}

Utils.bytes.encrypt3DES_CBC = function (plain, cypherKey, iv) {
    var crypto = new Crypto();
    var key = new Key();
    key.setComponent(Key.DES, cypherKey);
    
    var plaincpy = plain.pad(Crypto.ISO9797_METHOD_2, true);

    var cyphered = crypto.encrypt(key, Crypto.DES_CBC, plaincpy, iv);

    return cyphered;
}

Utils.bytes.decrypt3DES_CBC = function (crypted, cypherKey, iv) {

    var crypto = new Crypto();
    var key = new Key();
    key.setComponent(Key.DES, cypherKey);

    var decrypted = crypto.decrypt(key, Crypto.DES_CBC, crypted, iv);
    return decrypted;
}

Utils.bytes.encrypt3DES_ECB = function (plain, cypherKey) {
    var crypto = new Crypto();
    var key = new Key();
    var plaincpy = plain.pad(Crypto.ISO9797_METHOD_2, true);
    key.setComponent(Key.DES, cypherKey);

    var cyphered = crypto.encrypt(key, Crypto.DES_ECB, plaincpy);

    return cyphered;
}


Utils.bytes.decrypt3DES_ECB = function (crypted, cypherKey) {

    var crypto = new Crypto();
    var key = new Key();
    key.setComponent(Key.DES, cypherKey);

    var decrypted = crypto.decrypt(key, Crypto.DES_ECB, crypted);
    return decrypted;
}

Utils.bytes.circularShift = function(val, direction, places){
    places = 'undefined' == typeof places? 1: places;
    if(direction == 'l')
	return val.right(val.length - places).concat(val.left(places));
    if(direction == 'r')
	return val.right(places).concat(val.left( val.length - places));
    throw "[ERROR] '" + direction + "' is not a valid direction value"
}

Utils.time.getToday = function() {
    var today = new Date()
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    return today;
}

Utils.time.formatRegex = function(format) {
    var dictionary = {
	'%Y' : '\\d{4}',
	'%m' : '\\d{2}',
	'%d' : '\\d{2}'
    }

    var regex = '^' + format + '$';

    for ( var key in dictionary) {
	regex = regex.replace(key, '(' + dictionary[key] + ')');
    }
    return RegExp(regex);
}

Utils.time.str2date = function(dateString, format) {
    var options = [ '%Y', '%m', '%d' ];

    var equivalences = {
	'%Y' : 'year',
	'%m' : 'month',
	'%d' : 'date'
    };

    var regex = formatRegex(format);
    var groups = [];
    for (var i = 0; i < format.length; i++) {
	var index = format.search(options[i]);
	if (index >= 0)
	    groups[index] = equivalences[options[i]];
    }
    groups = groups.filter(function(elem) {
	return elem !== undefined;
    });

    var matches = dateString.match(regex);
    if (matches == null) {
	print('date invalid');
	exit;
    }
    var data = [];
    for (var i = 0; i < groups.length; i++) {
	data[groups[i]] = parseInt(matches[i + 1]);
    }
    var date = new Date(data['year'], data['month'] - 1, data['date'], 0, 0, 0,
	    0);
    return date;
}

Utils.time.formatDate = function(date, format) {

    // Replacing Full year
    var cloneFormat = format.replace("%Y", date.getFullYear());

    // Replacing months
    cloneFormat = cloneFormat.replace("%m", Utils.numbers.fixedLengthIntString(date
	    .getMonth() + 1, 2));

    // Replacing date
    cloneFormat = cloneFormat.replace("%d", Utils.numbers.fixedLengthIntString(
	    date.getDate(), 2));

    return cloneFormat;
}
