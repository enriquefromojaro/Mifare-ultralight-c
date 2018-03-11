// LEE EL NÚMERO DE SERIE 
// LEE TODAS LAS PÁGINAS DE LA ULTRALIGHT C
//
card = new Card();
atr = card.reset(Card.RESET_COLD);
//print(atr);
//Lee el serial number de la tarjeta, para mifare ultralight. 07 es el numero de bytes del serial.
resp = card.plainApdu(new ByteString("FF CA 00 00 07", HEX));
print("SERIAL NUMBER: " + resp);
//print(card.SW.toString(16));
print();

//LECTURA DE LAS 16 PAGINAS DE UNA EN UNA
print("PAGINAS EN GRUPOS DE 4 OCTETOS:");			
for (var i = 0; i < 48; i++) {
            resp = card.sendApdu(0xFF, 0xB0, 0x00, i, 4);
			print("PAGINA " + ByteString.valueOf(i, 1) + ": "+  resp + "   " + resp.toString(ASCII));
			}

card.close();
