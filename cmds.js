
const model = require('./model');

const {log, biglog, errorlog, colorize } = require("./out");

/**
 * Muestra la ayuda
 */
exports.helpCmd = rl  => {
    log('Commandos:');
    log('  h|help - Muestra esta ayuda.');
    log('  list - Listar los quizzes existentes.');
    log('  show <id> - Muestra la pregunta y la respuesta el quiz indicado.');
    log('  add - Añadir un nuevo quiz interactivamente.');
    log('  delete <id> - Borrar el quiz indicado.');
    log('  edit <id> - Editar el quiz indicado.');
    log('  test <id> - Probar el quiz indicado.');
    log('  p|play - Jugar a preguntar aleatoriamente todos los quizzes.');
    log('  credits - Créditos.');
    log('  q|quit - Salir del programa.');
    rl.prompt();
};

/**
 * Terminar el programa.
 */
exports.quitCmd = rl  => {
    rl.close();
    rl.prompt();
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
exports.addCmd = rl  => {

    rl.question(colorize(' Introduzca una pregunta: ', 'red'),question => {
        rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
            model.add(question, answer);
           log(` ${colorize('Se ha añadido','magenta' )}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
            rl.prompt();
        });
    });
};

/**
 * Lista todos los quizzes existentes en el modelo.
 */
exports.listCmd = rl  => {
    model.getAll().forEach((quiz,id) =>{
        log(` [${colorize(id, 'magenta')}]: ${quiz.question}`);
    });

    rl.prompt();
};

/**
 * Muestra el quiz indicando el parámetro: la pregunta y la respuesta.
 * @param id Clave del quiz a mostrar
 */
exports.showCmd = (rl,id)  => {

    if(typeof id === "undefined"){
        errorlog(`Falta el parámetro id.`);
    } else {
        try{
            const quiz = model.getByIndex(id);
            log(` [${colorize(id, 'magenta')}]:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        } catch(error){
            errorlog(error.message);
        }
    }
    rl.prompt();
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
exports.testCmd = (rl , id) => {
    if(typeof id === "undefined"){
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {
           // log(`Se ha cambiado el quiz ${colorize(id, 'magenta')} por : ${question} ${colorize('=>','magenta')} ${answer}`);

            const quiz = model.getByIndex(id);
            rl.question(`${colorize(quiz.question,'red')} ${colorize(' ? ', 'red')}`, answer => {

                if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
                    log(`Su respuesta es:`);
                    biglog('CORRECTO','green');

                    rl.prompt();
                } else {

                    log(`Su respuesta es:`);
                   biglog('INCORRECTO', 'red');

                    rl.prompt();
                }
            });

        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};
/**
 * Pregunta a todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 */

exports.playCmd = rl  => {

    let score = 0; //puntuacion

    let toBeResolved = [];
    let quizzes = model.getAll();
    for(let i=0 ; i< quizzes.length; i++){
        toBeResolved.push(i); //meter los id
    }




    const playOne = () => {
        if((toBeResolved === null) || (toBeResolved.length === 0)){
            log(`No hay nada más que preguntar .`);
            log(`Fin del examen. Aciertos : `);
            biglog(`${score}`,'magenta');
            rl.prompt();
        } else {
            let id = Math.floor(Math.random()*toBeResolved.length);
            let quiz = quizzes[id];
            rl.question(`${colorize(quiz.question, 'red')} ${colorize(' ? ', 'red')}`, answer => {

                if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
                    score++;
                    toBeResolved.splice(id,1);
                    quizzes.splice(id,1);
                    log(`CORRECTO - lleva  ${score} aciertos.`);
                    playOne();
                } else {
                    log(`INCORRECTO.`);
                    log(`Fin del examen. Aciertos : `);
                    biglog(`${score}`,'magenta');
                    rl.prompt();
                }
            });
        }
    };

    playOne();
};

/**
 * Borra un quiz del modelo.
 * @param id Clave del quiz a borrar en el modelo.
 */

exports.deleteCmd = (rl, id)  => {


    if(typeof id === "undefined"){
        errorlog(`Falta el parámetro id.`);
    } else {
        try{
             model.deleteByINdex(id);
        } catch(error){
            errorlog(error.message);
        }
    }
    rl.prompt();
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
exports.editCmd = (rl, id) => {
    if(typeof id === "undefined"){
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);
             process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
            rl.question(colorize('Introduzca una pregunta:', 'red'),question =>{
                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
                rl.question(colorize('Introduzca la respuesta:', 'red'), answer =>{
                    model.update(id, question, answer);
                    log(`Se ha cambiado el quiz ${colorize(id, 'magenta')} por : ${question} ${colorize('=>','magenta')} ${answer}`);
                    rl.prompt();
                });
            });
        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};


/**
 * Muestra los nombres de los autores de la práctica.
 */
exports.creditsCmd = rl   => {
    log('Autores de la práctica.');
    log('Marta Hernández Muela','green');
    log('Carlos Caro Álvarez','green');
    rl.prompt();
};