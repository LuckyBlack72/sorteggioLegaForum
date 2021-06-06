var express = require('express');
var router = express.Router();
var promisePostGres = require('pg-promise')();
var fs = require('fs');

//per le email con attachments
var nodeMailer = require('nodemailer');
var Excel = require('exceljs'); // LF 16/07/2018 per creare export Excel
//per le email con attachments


//se è definita POSTGRESQL_URI la usa altrimenti usa LocalHost
// postgresql://postgres:root@localhost:5432/postgres
var connectionData = process.env.DATABASE_URL || // URI 'postgres://postgres:root@localhost:5432/postgres';
                    {
                      host : 'localhost',
                      port : 5432,
                      database : 'postgres',
                      user : 'postgres',
                      password : 'root'
                    };

var db  =  promisePostGres(connectionData);               

/* GET getFasce. */ /* Fatto */
router.get('/getFasce', function(req, res, next) {

  var queryText = 'select * from legaforum.sorteggio ' +  
  'where stagione = ' + req.query.stagione + ' and serie = ' + '\'' + req.query.serie + '\'' +  ' ' + 
  'order by ranking';

  db.any(queryText).then(function (fasce) {

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
  })
  .catch(error => { //gestione errore
    fasceArray = [];
    res.status(200).json(fasceArray);
  });

});

/* POST saveSerie. */
router.post('/saveSerie', function(req, res, next) {

  var fasceAfterDraft = req.body.fasceAfterDraft;

  //gestione transazionale delle insert
  db.tx(function (t) {

    var queryText = 'update legaforum.sorteggio set ' +
    'girone = NULL, ods = 0 where stagione = ' + req.body.stagione + ' and ' + 
    'serie = ' + '\'' + req.body.serie + '\'';
    db.none(queryText).then(function () {
      var updates = [];
      for (var i = 0 ; i < fasceAfterDraft.length ; i++){
        for(var j = 0 ; j < fasceAfterDraft[i].length ; j++){
          queryText = 'update legaforum.sorteggio set girone = ' + '\'' + fasceAfterDraft[i][j].girone + '\'' + 
                      ' , ods = ' + fasceAfterDraft[i][j].ods +
                      ' where squadra  = ' + '\'' + fasceAfterDraft[i][j].squadra + '\'' + ' and ' +
                      '       stagione = ' + fasceAfterDraft[i][j].stagione + ' and ' +
                      '       serie    = ' + '\'' + fasceAfterDraft[i][j].serie + '\'';
          updates.push(db.none(queryText));
        }
      }       
      return t.batch(updates);
    });
  })
  .then(function (data) {
    res.status(200).json('OK');
  })
  .catch(function (error) {
    res.status(500).json(error);
  });
  //----------------------------------------------------------

});

/* POST getStagioni */ /* Fatto */
router.post('/getStagioni', function(req, res, next) {
  
  db.any('select distinct(stagione) from legaforum.sorteggio order by stagione').then(function (listaStagione) {

    //torno un'oggetto json
    res.status(200).json(listaStagione);
    
  })
  .catch(error => { //gestione errore
    res.status(200).json(listaStagione);
  });  
  
});

/* POST getSquadre */
router.post('/getSquadre', function(req, res, next) {
  
  db.any('select distinct(squadra) from legaforum.sorteggio order by squadra').then(function (listaSquadre) {

    //torno un'oggetto json
    res.status(200).json(listaSquadre);
    
  })
  .catch(error => { //gestione errore
    res.status(200).json(listaSquadre);
  });    
  
});

/* POST getSorteggioStagione */ /* Fatto */
router.post('/getSorteggioStagione', function(req, res, next) {

  var queryText = 'select id,squadra,allenatore,stagione,serie,fascia,ranking,girone,ods ' + 
  'from legaforum.sorteggio where stagione = ' + req.body.stagione  + '  ' + 
  'order by serie asc, girone asc, ods asc ';
  
  db.any(queryText).then(function (sorteggioStagione) {
    
    var serieArray = [];
    var gironeArray = [];
    var girone = [];
    var valoreSerie;
    var valoreGirone;

    if(typeof sorteggioStagione[0] !== "undefined"){ //controllo se ha trovato dati o no
      
      valoreSerie = sorteggioStagione[0].serie;
      valoreGirone = sorteggioStagione[0].girone;

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

  })
  .catch(error => { //gestione errore
    var serieArray = [];
    res.status(200).json(serieArray);
  });  

});

/* POST getSorteggioSquadra */
router.post('/getSorteggioSquadra', function(req, res, next) {

  var queryText = 'select id,squadra,allenatore,stagione,serie,fascia,ranking,girone,ods ' + 
  'from legaforum.sorteggio where squadra = ' + '\'' + req.body.squadra + '\'' + ' order by stagione asc ';
  
  db.any(queryText).then(function (sorteggiSquadra) {
    
    //torno un'oggetto json
    res.status(200).json(sorteggiSquadra);

  })
  .catch(error => { //gestione errore
    res.status(200).json(sorteggiSquadra);
  });  

});



/* POST checkPassword */
router.post('/checkPassword', function(req, res, next) {

  var queryText = 'select count(*) from legaforum.password where password = ' + '\'' + req.body.password + '\'';

  db.one(queryText).then(function (data) {
    
    if(parseInt(data.count) > 0){
      res.status(200).json('OK');
    }else{
      res.status(500).json('KO');
    }  
  })
  .catch(error => { //gestione errore
    res.status(500).json('KO');
  });  
  
});

//LF 18/07/2018
/* POST getSorteggioStagioneSerie */ /* Fatto */
router.post('/getSorteggioStagioneSerie', function(req, res, next) {

  var queryText = 'select id,squadra,allenatore,stagione,serie,fascia,ranking,girone,ods ' + 
  'from legaforum.sorteggio where stagione = ' + req.body.stagione  + '  and ' + 'serie = ' + '\'' + req.body.serie + '\'' + ' ' +
  'order by serie asc, girone asc, ods asc ';
  
  db.any(queryText).then(function (sorteggioStagioneSerie) {
    
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

  })
  .catch(error => { //gestione errore
    var gironeArray = [];
    res.status(200).json(gironeArray);
  });  

});
//LF 18/07/2018

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

/* POST checkSorteggio */
router.post('/checkSorteggio', function(req, res, next) {

  var queryText = 'select count(*) from legaforum.sorteggio where stagione = ' + req.body.stagione + ' ' +
                  'and girone is not null';

  console.log(queryText);

  db.one(queryText).then(function (data) {
    
    if(parseInt(data.count) < 96){
      res.status(200).json(true);
    }else{
      res.status(200).json(false);
    }  
  })
  .catch(error => { //gestione errore
    res.status(500).json(false);
  });  
  
});

/* POST importRanking */
router.post('/importRankingSorteggioClassifica', function(req, res, next) {

  var rankingSorteggio = req.body.rankingSorteggio;
  var importTipo = req.body.tipoImport;
  var stagione = req.body.stagione;
  var queryText = '';
  //gestione transazionale delle insert
  db.tx(function (t) {

    if(importTipo === 'C'){
      queryText = 'update legaforum.sorteggio set posizione = null ' +
      'where stagione = ' + stagione;
    } else {
      queryText = 'delete from legaforum.sorteggio ' +
      'where stagione = ' + stagione;
    }
    
    db.none(queryText).then(function () {
      var inserts = [];
      for (var i = 0 ; i < rankingSorteggio.length ; i++){

        if(importTipo === 'C'){

          queryText = 'update legaforum.sorteggio ' +
          'set posizione = ' + rankingSorteggio[i].posizione + ' ' +
          'where stagione = ' + rankingSorteggio[i].stagione + ' and ' +
          'squadra = ' + '\'' + rankingSorteggio[i].squadra + '\'';
          
          //console.log(queryText);
          
        } else {
        
          queryText = 'insert into legaforum.sorteggio ( allenatore, fascia, girone, ods, ranking, serie, squadra, stagione ) ' +
          'values ' +
          '( ' + 
          '\'' + rankingSorteggio[i].allenatore + '\'' + ', ' + //allenatore
          rankingSorteggio[i].fascia + ', '; //fascia
          
          if (importTipo === 'R'){
            queryText = queryText + 'NULL' + ', ' + //girone
            0 + ', '; //ods
          } else {
            queryText = queryText + '\'' + rankingSorteggio[i].girone + '\'' + ', ' + //girone
            rankingSorteggio[i].ods + ', '; //ods
          }

          queryText = queryText +
          rankingSorteggio[i].ranking + ', ' + //ranking
          '\'' + rankingSorteggio[i].serie + '\'' + ', ' + //serie
          '\'' + rankingSorteggio[i].squadra + '\'' + ', ' + //squadra
          rankingSorteggio[i].stagione + ' ' + //stagione
          ')';
          //  console.log(queryText);

        }

        inserts.push(db.none(queryText));

      }       
      return t.batch(inserts);
    });
  })
  .then(function (data) {
    res.status(200).json(true);
  })
  .catch(function (error) {
    res.status(500).json(false);
  });
  //----------------------------------------------------------

});

/* POST checkRanking */
router.post('/checkRanking', function(req, res, next) {

  var queryText = 'select count(*) from legaforum.sorteggio where stagione = ' + req.body.stagione;

  db.one(queryText).then(function (data) {
    
    if(parseInt(data.count) < 96){ //ranking non presente o non completo
      res.status(200).json(false);
    }else{
      res.status(200).json(true);
    }  
  })
  .catch(error => { //gestione errore
    res.status(500).json(false);
  });  
  
});


module.exports = router;
