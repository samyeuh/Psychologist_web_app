const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

router.get('/libres', (req, res) => {
  // Recevoir la date depuis les paramètres de la requête
  const { dateCreneau } = req.query; // Assurez-vous que cette date est envoyée au format YYYY-MM-DD
  if (!dateCreneau) {
    return res.status(400).send("La date du créneau est requise.");
  }

  const date = new Date(dateCreneau);
  const creneaux = [];

  // Générer les créneaux de 8h à 20h pour la date donnée
  for (let hour = 8; hour <= 20; hour++) {
    const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour);
    creneaux.push(newDate);
  }

  // Convertir les dates en format SQL datetime
  const formatSQL = creneaux.map(c => c.toISOString().slice(0, 19).replace('T', ' '));

  // Requête pour obtenir les créneaux occupés
  var sql = `SELECT Creneaux FROM Calendrier
    WHERE Creneaux IN (?) AND DATE(Creneaux) = ?`;

  req.connection.query(sql, [formatSQL, dateCreneau], function (err, result) {
    if (err) {
      console.error('Erreur', err);
      res.status(500).send('Erreur lors de la récupération des Créneaux libres');
      return;
    }
    // Filtrer pour obtenir les créneaux libres
    const occupied = new Set(result.map(item => item.Creneaux));
    const freeSlots = formatSQL.filter(c => !occupied.has(c));

    res.send(freeSlots);
  });
});

  
router.get('/moisn-1', (req, res) => {
    var sql = "SELECT * FROM resamoisprecedent";
    req.connection.query(sql, function (err, result) {
      if (err) {
        console.error('Erreur', err);
        res.status(500).send('Erreur lors de la récupération des Creneaux du mois précédent');
        return;
      }
      res.send(result);
    });
});

router.get('/moisn', (req, res) => {
  var sql = "SELECT * FROM resamoisactuel";
  req.connection.query(sql, function (err, result) {
    if (err) {
      console.error('Erreur', err);
      res.status(500).send('Erreur lors de la récupération des Creneaux du mois en cours');
      return;
    }
    res.send(result);
  });
});

router.get('/all', (req, res) => {
  var sql = "SELECT * FROM allresa";
  req.connection.query(sql, function (err, result) {
    if (err) {
      console.error('Erreur', err);
      res.status(500).send('Erreur lors de la récupération des Creneaux');
      return;
    }
    res.send(result);
  });
});

router.post('/add', (req, res) => {
  const date = req.body;
  var id = uuidv4();

  var sql = 'INSERT INTO calendrier (IdCalendrier, Creneaux) VALUES (?, ?)';
  req.connection.query(sql, [id, date], function (err, result) {
    if (err) {
      console.error('Erreur', err);
      res.status(500).send('Erreur lors de l\'ajout du Creneau');
      return;
    }
    res.send({ message: 'Creneau ajouté avec succès' });
  });
});

router.get('/', (req, res) => {
  var sql = 'SELECT Creneaux FROM calendrier';
  req.connection.query(sql, function (err, result) {
    if (err) {
      console.error('Erreur', err);
      res.status(500).send('Erreur lors de la récupération des Creneaux');
      return;
    }
    res.send(result);
  });
});
  

router.put('/update/:id', (req, res) => {
    const idCalendrier = req.params.id;
    const formData = req.body;

    var sql = 'UPDATE calendrier SET Creneaux = ? WHERE IdCalendrier = ?';
    req.connection.query(sql, [formData, idCalendrier], function (err, result) {
        if (err) {
          console.error('Erreur', err);
          res.status(500).send('Erreur lors de la modification du Creneau');
          return;
        }
        res.send({ message: 'Creneau modifié avec succès' });
    });
});

router.delete('/delete/:id', (req, res) => {
    const idCreneau = req.params.id;
    console.log(idCreneau);
    var sqlConsult = 'DELETE FROM consulter WHERE IdCalendrier = ?';

    req.connection.query(sqlConsult, [idCreneau], function (err, result) {
        if (err) {
          console.error('Erreur', err);
          res.status(500).send('Erreur lors de la suppression du Creneau');
          return;
        }
    });

    var sql = 'DELETE FROM calendrier WHERE IdCalendrier = ?';
    req.connection.query(sql, [idCreneau], function (err, result) {
        if (err) {
          console.error('Erreur', err);
          res.status(500).send('Erreur lors de la suppression du Creneau');
          return;
        }
        res.send({ message: 'Creneau supprimé avec succès' });
    });
});

router.get('/:id', (req, res) => {
    var sql = "select concat(`psychologue`.`patient`.`Nom`,' ',substr(`psychologue`.`patient`.`Prenom`,1,1),'.') AS `title`,date_format(`psychologue`.`calendrier`.`Creneaux`,'%Y-%m-%dT%H:%i:%sZ') AS `start` from ((`psychologue`.`calendrier` join `psychologue`.`consulter` on(`psychologue`.`calendrier`.`IdCalendrier` = `psychologue`.`consulter`.`IdCalendrier`)) join `psychologue`.`patient` on(`psychologue`.`consulter`.`IdPatient` = `psychologue`.`patient`.`IdPatient`)) WHERE patient.IdPatient = ?";
    req.connection.query(sql, [req.params.id], function (err, result) {
      if (err) {
        console.error('Erreur', err);
        res.status(500).send('Erreur lors de la récupération des créneaux');
        return;
      }
      res.send(result);
    });
});

module.exports = router;