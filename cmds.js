
const Sequelize = require('sequelize');

const {models}   = require('./model');

const {log, biglog, errorlog, colorize } = require("./out");

/**
 * Muestra la ayuda
 */
exports.helpCmd = (socket, rl ) => {
    log(socket, 'Commandos:');
    log(socket,'  h|help - Muestra esta ayuda.');
    log(socket,'  list - Listar los quizzes existentes.');
    log(socket,'  show <id> - Muestra la pregunta y la respuesta el quiz indicado.');
    log(socket,'  add - Añadir un nuevo quiz interactivamente.');
    log(socket,'  delete <id> - Borrar el quiz indicado.');
    log(socket,'  edit <id> - Editar el quiz indicado.');
    log(socket,'  test <id> - Probar el quiz indicado.');
    log(socket,'  p|play - Jugar a preguntar aleatoriamente todos los quizzes.');
    log(socket,'  credits - Créditos.');
    log(socket,'  q|quit - Salir del programa.');
    rl.prompt();
};

/**
 * Terminar el programa.
 */
exports.quitCmd = (socket, rl )  => {
    rl.close();
    socket.end();
};

//ESTA ES LA FUNCION QUE CONTIENE UNO DE LOS ERRORES
/**
 * Esta función convierte la llamada rl.question , que está basada en callbacks, en un
 * basada en promesas.
 *
 * Esta función devuelve una promesa que cuando se cumple, proporiona el texto introducido.
 * Entonces la llamada a then que hay que hacer la promesa devuelta sera:
 *       .then(answer => {...})
 *
 * También colorea en rojo el texto de la pregunta, elimina espacios al princiop y f
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param text Pregunta que hay que hacerle al usuario.
 */

const makeQuestion = (rl, text) => {
    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
        resolve(answer.trim());
        });
    });

};


/**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y la respuesta.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 */
exports.addCmd = (socket, rl )  => {
    makeQuestion(rl, 'Introduza la  pregunta ')
       .then(q => {
           return makeQuestion(rl, 'Introduzca la respuesta ')
               .then(a => {
                   return {question: q, answer: a};
               });
        })
            .then((quiz)=> {
                return models.quiz.create(quiz);
            })
            .then((quiz) => {
                log(socket, `${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
            })
            .catch(Sequelize.ValidationError, error => {
                errorlog(socket, 'El quiz es erroneo:');
                error.errors.forEach(({message}) => errorlog(message));
            })
            .catch(error => {
                errorlog(socket, error.message);
            })
            .then(() => {
                rl.prompt();
            });

    };

/**
 * Lista todos los quizzes existentes en el modelo.
 */
exports.listCmd =(socket, rl )  => {
    models.quiz.findAll() //esto es una promesa ,  me devolveratododentro de un rato
        .then(quizzes => {
            //este bucle en cada iteración recorre el array quizzes y se le pasa el parametro quiz
            quizzes.forEach(quiz => {
                log(socket,` [${colorize(quiz.id, 'magenta')}]:  ${quiz.question}`);
            });
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {   //el then lo que nos dice es que cuando ya haya pasado todas las promesas saco el prompt
            rl.prompt();
        });
        //PARA RECORRER QUIZZES TAMBIEN SE PODRIA HABER HECHO ASI
    //.each(quiz => {
    //log(` [${colorize(quiz.id, 'magenta')}]:  ${quiz.question}`);
    //})

};

/**
 * Esta función devuelve una promesa que:
 *   -Valida que se ha introducido un valor para el parametro.
 *   -Convierte el parametro en un numero entero.
 * Si toddo va bien, la promesa se satisface y devuelve el valor id a usar.
 *
 * @param id Parametro con el índice a validar.
 *
 */
const validateId = id => {

    return new Sequelize.Promise((resolve, reject) =>{
        if(typeof id === "undefined"){
            reject(new Error(`Falta el parametro <id>.`));
        } else {
            id = parseInt(id); //coger la parte entera y descarta lo demas
            if(Number.isNaN(id)) {
                reject(new Error(`El valor del parámetro <id> no es un número.`));
            } else{
                resolve(id);
            }
        }
    });
};


/**
 * Muestra el quiz indicando el parámetro: la pregunta y la respuesta.
 * @param id Clave del quiz a mostrar
 */
exports.showCmd = (socket, rl,id)  => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if(!quiz){
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            log(socket, ` [${colorize(quiz.id, 'magenta')}]:  ${quiz.question} ${colorize('=>', 'magenta ')} ${quiz.answer}`);
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });
};
/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la llamada.
 *
 * @param id Clave del quiz a probar.
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (socket, rl , id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if(!quiz){
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            return makeQuestion(rl, quiz.question )
                .then(a => {
                    if(a.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
                        log(socket, `Su respuesta es correcta`);
                        //biglog('Correcta', 'green');

                        rl.prompt();
                    } else{
                        log(socket, `Su respuesta es incorrecta`);
                        rl.prompt();
                        //biglog('Incorrecta','red');
                    }

                })
        })

        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });
};




/**
 * Pregunta a todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 */

exports.playCmd = (socket, rl )  => {

    let score = 0; //puntuacion
    let toBePlayed = [];


    const playOne = () => {
        return Promise.resolve()
            .then(() => {
                if((toBePlayed === null) || (toBePlayed.length === 0)){
                    log(socket, `No hay nada más que preguntar .`);
                    log(socket, `fin`);
                    log(socket, `Fin del examen. Aciertos : `);
                    biglog(socket, `${score}`, 'magenta');
                    rl.prompt();
                    return;
                }

                let pos = Math.floor(Math.random() * toBePlayed.length);
                let quiz = toBePlayed[pos];
                toBePlayed.splice(pos, 1);

                makeQuestion(rl, `${quiz.question}`)
                    .then(answer => {
                        if (answer.toLowerCase().trim()=== quiz.answer.toLowerCase().trim()) {
                            score++;
                            log(socket, `CORRECTO - Lleva ${score} aciertos`);
                            log(socket, `La respuesta es correcta`)
                            return playOne();
                        } else {
                            log(socket, `INCORRECTO.`);
                            log(socket, `La respuesta es incorrecta`)
                            log(socket, `Fin del examen. Aciertos : `);
                            log(socket, `fin`);
                           // biglog(`${score}`, 'magenta');
                            rl.prompt();
                        }
                    })
            })
    }

            models.quiz.findAll({raw : true})
                .then(quizzes => {
                    toBePlayed = quizzes;
                })
                .then(() => {
                    return playOne();
                })
                .catch(e => {
                    log(socket, 'error' + e);
                })
                .then(() => {
                    rl.prompt();
                })

};

/**
 * Borra un quiz del modelo.
 * @param id Clave del quiz a borrar en el modelo.
 */

exports.deleteCmd = (socket, rl, id)  => {

    validateId(id)
    .then(id => models.quiz.destroy({where: {id}}))
        .catch(error => {
        errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

/**
 * Edita un quiz del modelo.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (socket, rl, id) => {
  validateId(id)
      .then(id => models.quiz.findById(id))
      .then(quiz => {
      if(!quiz){
      throw new Error(`No existe un quiz asociado al id=${id}.`);
      }
      process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
      return makeQuestion(rl, 'Introduzca la pregunta: ')
          .then(q => {
          process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
          return makeQuestion(rl, 'Introduzca la respuesta: ')
              .then(a => {
              quiz.question = q;
              quiz.answer = a;
              return quiz;
          });
      });
    })
      .then(quiz => {
      return quiz.save();
    })
      .then(quiz => {
          log(socket, `${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);

      })
      .catch(Sequelize.ValidationError, error => {
      errorlog(socket, 'El quiz es erroneo:');
      error.errors.forEach(({message}) => errorlog(message));
})
      .catch(error => {
      errorlog(socket, error.message);
})
      .then(() => {
      rl.prompt();
});
};


/**
 * Muestra los nombres de los autores de la práctica.
 */
exports.creditsCmd = (socket, rl )   => {
    log(socket, 'Autores de la práctica.');
    log(socket, 'Marta Hernández Muela','green');
    log(socket, 'Carlos Caro Álvarez','green');
    rl.prompt();
};