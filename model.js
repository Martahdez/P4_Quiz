
const Sequelize = require('sequelize');

const sequelize = new Sequelize("sqlite:quizzes.sqlite", {logging: false});

sequelize.define('quiz', {
    question: {
        type: Sequelize.STRING,
        unique: {msg: "Ya existe esa pregunta"},
        validate : {notEmpty: {msg : "La pregunta no puede estar vacía"}}
    },
    answer: {
        type: Sequelize.STRING,
        validate: {notEmpty: {msg: "La respuesta no puede estar vacía"}}
    }
});

sequelize.sync()
.then(() => sequelize.models.quiz.count())
.then(count => {
    if(!count){
        return sequelize.models.quiz.bulkCreate([
            {question: "Capital de Italia",  anserw: " Roma" },
            {question: "Capital de Francia",  anserw: "París"},
            {question: "Capital de España",   anserw: "Madrid"},
            {question: "Capital de Portugal", anserw: "Lisboa"}
            ]);
    }
})
.catch(error => {
    console.log(error);
});

module.exports = sequelize;