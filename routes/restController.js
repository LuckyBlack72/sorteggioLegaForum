var express = require('express');
var router = express.Router();
var promiseMySql = require('promise-mysql');

//per le email con attachments
var nodeMailer = require('nodemailer');
var Excel = require('exceljs'); // LF 16/07/2018 per creare export Excel
//per le email con attachments

var connectionData = {
                      host : "localhost",
                      user : "root",
                      password : "",
                      database : "legaforum"
                    };

                    
/* GET getFasce. */
router.get('/getFasce', function(req, res, next) {

  promiseMySql.createConnection(connectionData).then(function(connection){

      var fasce = [];

      var queryText = 'select * from Sorteggio ' +  
                      'where `stagione` = ' + req.query.stagione + ' and `serie` = ' + '"' + req.query.serie + '"' +  ' ' + 
                      'order by `ranking`';

      fasce = connection.query(queryText);
      connection.end();
      return fasce;
      
  }).then(function(fasce){
    
      var fasceArray = [];
      var fascia = [];
      var valoreFascia;

      if(typeof fasce[0] !== "undefined"){ //controllo se ha trovato dati o no
        valoreFascia = fasce[0].fascia;
        for (var i=0; i < fasce.length; i++){
          
          if(fasce[i].fascia === valoreFascia){
            fascia.push(fasce[i]);
          }else{
            valoreFascia = fasce[i].fascia;
            fasceArray.push(fascia);
            fascia = [];
            fascia.push(fasce[i]);
          } 
        
        }
      
        fasceArray.push(fascia);
      
      }else{
      
        fasceArray = [];
      
      }

    //torno un'oggetto json
    res.status(200).json(fasceArray);
    
  });  

});


/* POST saveSerie. */
router.post('/saveSerie', function(req, res, next) {

  promiseMySql.createConnection(connectionData).then(function(connection){
    var fasceAfterDraft = req.body.fasceAfterDraft;
    connection.query('update Sorteggio set ' +
                     '`girone` = NULL, `ods` = 0 where `stagione` = ' + req.body.stagione + ' and ' + 
                     '`serie` = ' + '"' + req.body.serie + '"'
                    );
    for (var i = 0 ; i < fasceAfterDraft.length ; i++){
      for(var j = 0 ; j < fasceAfterDraft[i].length ; j++){
        connection.query('update Sorteggio set `girone` = ' + '"' + fasceAfterDraft[i][j].girone + '"' + 
        ' , `ods` = ' + fasceAfterDraft[i][j].ods +
        ' where `squadra`  = ' + '"' + fasceAfterDraft[i][j].squadra + '"' + ' and ' +
        '       `stagione` = ' + fasceAfterDraft[i][j].stagione + ' and ' +
        '       `serie`    = ' + '"' + fasceAfterDraft[i][j].serie + '"'
        );    
      }
    }
    connection.end();
  }).then(function(){
    //torno un'oggetto json
    console.log('return');
    res.status(200).json('OK');
  });  
});

/* POST getStagioni */
router.post('/getStagioni', function(req, res, next) {
  
  promiseMySql.createConnection(connectionData).then(function(connection){
    
    var listaStagione = connection.query('select distinct(`stagione`) from Sorteggio order by `stagione`');
    connection.end();
    return listaStagione;
      
  }).then(function(listaStagione){
    
    //torno un'oggetto json
    res.status(200).json(listaStagione);
    
  });  
  
});

/* POST getSquadre */
router.post('/getSquadre', function(req, res, next) {
    
  promiseMySql.createConnection(connectionData).then(function(connection){
    
    var listaSquadre = connection.query('select distinct(`squadra`) from Sorteggio order by `squadra`');
    connection.end();
    return listaSquadre;
      
  }).then(function(listaSquadre){
    
    //torno un'oggetto json
    res.status(200).json(listaSquadre);
    
  });  
    
});

/* POST getSorteggioStagione */
router.post('/getSorteggioStagione', function(req, res, next) {
  
  promiseMySql.createConnection(connectionData).then(function(connection){
    
    var sorteggioStagione = connection.query('select `id`,`squadra`,`allenatore`,`stagione`,`serie`,`fascia`,`ranking`,`girone`,`ods` ' + 
                                           'from Sorteggio where `stagione` = ' + '"' + req.body.stagione + '"' + '  ' + 
                                           'order by `serie` asc, `girone` asc, `ods` asc ');
    connection.end();
    return sorteggioStagione;
      
  }).then(function(sorteggioStagione){
    
      var serieArray = [];
      var gironeArray = [];
      var girone = [];
      var valoreSerie;
      var valoreGirone;

      if(typeof sorteggioStagione[0] !== "undefined"){ //controllo se ha trovato dati o no
        
        valoreSerie = sorteggioStagione[0].serie;
        valoreGirone = sorteggioStagione[0].girone;

        console.log('prima for : ' + valoreSerie + ' - ' + valoreGirone);
        
        for (var i=0; i < sorteggioStagione.length; i++){
          
          if(sorteggioStagione[i].serie === valoreSerie){
            if(sorteggioStagione[i].girone === valoreGirone){
              girone.push(sorteggioStagione[i]);
            }else{
              valoreGirone = sorteggioStagione[i].girone;
              gironeArray.push(girone);
              girone = [];
              girone.push(sorteggioStagione[i]);
            }
          } else{
            valoreSerie = sorteggioStagione[i].serie;
            valoreGirone = sorteggioStagione[i].girone;
            gironeArray.push(girone);
            serieArray.push(gironeArray);
            gironeArray = [];
            girone = [];
            girone.push(sorteggioStagione[i]);
          } 
        }

        gironeArray.push(girone);
        serieArray.push(gironeArray);

      }else{

        serieArray = [];

      }

    //torno un'oggetto json
    res.status(200).json(serieArray);
    
  });  

});
/* POST getSorteggioSquadra */
router.post('/getSorteggioSquadra', function(req, res, next) {

  promiseMySql.createConnection(connectionData).then(function(connection){
    
    var sorteggiSquadra = connection.query('select `id`,`squadra`,`allenatore`,`stagione`,`serie`,`fascia`,`ranking`,`girone`,`ods` ' + 
                                           'from Sorteggio where `squadra` = ' + '"' + req.body.squadra + '"' + ' order by `stagione` asc ');
    connection.end();
    return sorteggiSquadra;
      
  }).then(function(sorteggiSquadra){
    
    //torno un'oggetto json
    res.status(200).json(sorteggiSquadra);
    
  });  
  
});

/* POST getSquadre */
/* router.post('/checkPassword', function(req, res, next) {

  if (req.body.password == 'erika2013'){
    res.status(200).json('OK');
  }else{
    res.status(500).json('KO');
  }
  
}); */

router.post('/checkPassword', function(req, res, next) {
    
  promiseMySql.createConnection(connectionData).then(function(connection){

    var data = connection.query('select count(*) tot from password where `password` = ' + '"' + req.body.password + '"');
    connection.end();
    return data;
      
  }).then(function(data){
    
    if(parseInt(data[0].tot) > 0){
      res.status(200).json('OK');
    }else{
      res.status(500).json('KO');
    }   
    
  });  
    
});

/* POST getSorteggioStagioneSerie */
router.post('/getSorteggioStagioneSerie', function(req, res, next) {
  
  promiseMySql.createConnection(connectionData).then(function(connection){
    
    var sorteggioStagioneSerie = connection.query('select `id`,`squadra`,`allenatore`,`stagione`,`serie`,`fascia`,`ranking`,`girone`,`ods` ' + 
                                           'from Sorteggio where `stagione` = ' + '"' + req.body.stagione + '"' + ' and ' +  
                                           '`serie` = ' + '"' + req.body.serie + '"' + ' ' +
                                           'order by `serie` asc, `girone` asc, `ods` asc ');
    connection.end();
    return sorteggioStagioneSerie;
      
  }).then(function(sorteggioStagioneSerie){
    
    var gironeArray = [];
    var girone = [];
    var valoreGirone;

    if(typeof sorteggioStagioneSerie[0] !== "undefined"){ //controllo se ha trovato dati o no
      
      valoreGirone = sorteggioStagioneSerie[0].girone;

      for (var i=0; i < sorteggioStagioneSerie.length; i++){
        
          if(sorteggioStagioneSerie[i].girone === valoreGirone){
            girone.push(sorteggioStagioneSerie[i]);
          }else{
            valoreGirone = sorteggioStagioneSerie[i].girone;
            gironeArray.push(girone);
            girone = [];
            girone.push(sorteggioStagioneSerie[i]);
          }
      }

      gironeArray.push(girone);

    }else{

      gironeArray = [];

    }

    //torno un'oggetto json
    res.status(200).json(gironeArray);
    
  });  

});

//LF 18/07/2018
router.post('/sendMail', function(req, res, next) {

  //Creo il body del messsagio
  var mailRecipient = req.body.recipient;
  var mailSender    = req.body.sender;
  var mailSubject   = req.body.mailSubject;
  var mailText      = req.body.mailText;
  var environment   = req.body.environment;
  
  //i dati per il file Excel
  var serie     = req.body.serie;
  var stagione  = req.body.stagione;
  var excelData = req.body.excelData;

  var mailServer;

  if(environment === 'PRD') {
    mailServer = {
      host: 'smtps.aruba.it',
      port: 465,
      secure: true,
      auth: {
          user: mailSender,
          pass: 'provalf18'
      }
    };  
  } else {
    mailServer = {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
          user: mailSender,
          pass: 'fantacalcio72'
      }
    };  
  }

  let transporter = nodeMailer.createTransport(mailServer);

  let mailOptions = {
    from: '"Sorteggio Lega Forum" <' + mailSender + ' >', // sender address
    to: mailRecipient, // list of receivers
    subject: mailSubject, // Subject line
    text: mailText, // plain text body
    html: '<b>' + mailText + '</b>', // html body
    attachments: []
  };

  if(fs.existsSync('./export/' + 'ExportSerie' + serie + stagione + '.xlsx') && environment === 'PRD' ){ //il file esiste non lo devo generare
    
    mailOptions.attachments.push({path : './export/' + 'ExportSerie' + serie + stagione + '.xlsx'});

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).json('KO');
      }else{
        console.log('Message %s sent: %s', info.messageId, info.response);
        res.status(200).json('OK');
      }
    });
  
  } else {
    //Gestione Excel -----------------------------------------
    var excelRows = [];
    var workbook = new Excel.Workbook();
    workbook.creator = 'Applicazione Sorteggio Lega Forum';
    workbook.views = [
      {
        x: 0, y: 0, width: 10000, height: 20000,
        firstSheet: 0, activeTab: 1, visibility: 'visible'
      }
    ];

    //Loop sui dati

    // Serie
    for (let i = 0 ; i < excelData.length ; i++) {
      //Gironi della Serie
      for (let j = 0; j < excelData[i].length; j++) {
        excelRows.push(
                        {
                          squadra:    excelData[i][j].squadra,
                          allenatore: excelData[i][j].allenatore,
                          ods:        excelData[i][j].ods
                        }
                      );
      }
      workbook.addWorksheet('Serie' + ' ' + serie + ' - ' + 'Girone ' +  excelData[i][0].girone);
      var worksheet = workbook.getWorksheet('Serie' + ' ' + serie + ' - ' + 'Girone ' +  excelData[i][0].girone);
      worksheet.columns = [
        { header: 'Squadra', key: 'squadra', width: 30 },
        { header: 'Allenatore', key: 'allenatore', width: 30 },
        { header: 'ODS', key: 'ods', width: 5 }
    ];
      worksheet.addRows(excelRows);
      
      for(let x = 1; x < 4; x++){
        worksheet.getCell(1, x).alignment = { 
            horizontal : 'center'
          };
        worksheet.getCell(1, x).font = { 
            bold : true
          };
        worksheet.getCell(1 , x).fill = {
            type : 'pattern', 
            pattern : 'solid', 
            fgColor : {argb : 'FFFFC000'}
          };      
          worksheet.getCell(1 , x).border = {
            top: {style:'thin'},
            left: {style:'thin'},
            bottom: {style:'thin'},
            right: {style:'thin'}
          };
      }

      excelRows = []; // ripulisco la array
    }

    workbook.xlsx.writeFile('./export/' + 'ExportSerie' + serie + stagione + '.xlsx')
      .then(function() {
        mailOptions.attachments.push({path : './export/' + 'ExportSerie' + serie + stagione + '.xlsx'});

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
            res.status(500).json('KO');
          }else{
            console.log('Message %s sent: %s', info.messageId, info.response);
            res.status(200).json('OK');
          }
        });
      })
      .catch(error => { //gestione errore
        console.log(error);
        res.status(500).json('KO');
      });

    //--------------------------------------------------------
  }

});


router.post('/checkSorteggio', function(req, res, next) {
    
  promiseMySql.createConnection(connectionData).then(function(connection){

    var data = connection.query('select count(*) tot from sorteggio where `stagione` = ' + req.body.stagione + ' and `girone` is not null');
    connection.end();
    return data;
      
  }).then(function(data){
    
    if(parseInt(data[0].tot) < 96){
      res.status(200).json('OK');
    }else{
      res.status(500).json('KO');
    }   
    
  });  
    
});

module.exports = router;
