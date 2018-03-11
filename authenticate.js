load('utils.js');
card = new Card();

try{
    card.authenticate();
}catch(err){
    print(err);
}finally{
    card.close();
}