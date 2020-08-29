var db = firebase.firestore();
var coleccion_curso = "curso";
var coleccion_examenes_asoc = "examenes-asociados";
var uid, campos, curso, examen, referencia, docRef;
//Arreglo que asigna la letra correspondiente al orden de cada pregunta generada
var preguntas = ['a','b','c','d','e','f','g','h','i','j','k','l'];
//Variable en la que se almacenan las respuestas asignadas por el docente
var respuestas = [];

//Función que determina las cantidad de preguntas del exámen y genera código HTML basado
//en la estrucutura sugerida por la libreria quizlib.js
function CrearExamen(nombre, arreglo, id, rpta) {
    //Los exámenes en bd serán creados como arreglos en donde:
    //La posición 0 es el nombre de la pregunta 
    //La posición 1 en adeltante hasta la penúltima posoción, son las preguntas
    //La última posición es la respuesta correcta
    let preg = "";
    respuestas.push(rpta);
    for (let i = 1; i < arreglo.length - 1; i++) {
        preg += `<li><label><input type="radio" name="`+id+`" value=` + preguntas[i - 1] + `>` + arreglo[i] + `</label></li>`;
    }

    let contenedor = `
    <div class="card quizlib-question">
    <div class="quizlib-question-title">`+ nombre + `</div>
    <div class="quizlib-question-answers">
        <ul>`+ preg + `
        </ul>
    </div>
    </div>
        `;

    document.getElementById('quiz').style.visibility = 'hidden';
    console.log(respuestas);
    return contenedor;

}

//Función al ingreso de página que verifica el usuario activo, su id y la bd del exámen a realizar
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        uid = user.uid;
        //Se identifica el doc en la subcolleción examenes-asociados que posee el enlace 
        //directo a la colección de posee las preguntas del exámen
        docRef = db.collection(coleccion_examenes_asoc).doc(user.uid).collection("examenes").doc("9E7UEDEZkanqKd36XUrV");
        
        docRef.get().then(function (doc) {
            if (doc.exists) {
                campos = doc.data();
                referencia = campos["referencia"];
                //Se obtiene la referencia de la colleción del exámen y se redirige a esa base de datos
                db.doc(referencia).get().then(function (doc_) {
                    if (doc_.exists) {
                        var data = doc_.data();
                        //Ciclo que se repite por cada llave dentro del objeto data que son las preguntas del exámen
                        for (const prop in data) {
                            var arreglo = data[prop];
                            console.log(`obj.${prop} = ${data[prop]}`);
                            //Se insertan los bloques HTML del quiz junto con las preguntas importadas de firebase
                            document.getElementById("quiz").innerHTML += CrearExamen(arreglo[0], arreglo, prop, arreglo[arreglo.length-1]);
                        } document.getElementById("cont").disabled = false;
                        document.getElementById("cont").style.background = "#44b847";
                        //Una vez insertado todo el código HTML se habilita el botón continuar
                    }
                });

            }
        });
    }
});

//Función para eliminar contenedores de códigos HTML por su id
function EliminarContenedor(id) {
    child = document.getElementById(id);
    if (!child) {
        alert("id no existe");
    } else {
        parent = child.parentNode;
        parent.removeChild(child);
    }
}

//Función de botón continuar de la alerta incial "recuerde"
function Continuar() {
    //Se incia la cuenta regresica actualizando la función cada 1000 milseg, se muestra el contenido del exámen
    TiempoRestante = setInterval('CuentaRegresiva()', 1000);
    EliminarContenedor("recuerde");
    document.getElementById('titulo').style.visibility = 'visible';
    document.getElementById('quiz').style.visibility = 'visible';
    document.getElementById('btn-fin').style.visibility = 'visible';
}

var tiempo_examen;
function CuentaRegresiva() {
    //Se comprueba que en localStorage en la llave "horaFin" este vacio
    if (localStorage.getItem("horaFin") === null) {
        //Se asigna el tiempo de duración del exámen y se calcula a que hora según UTC debe finalizar
        tiempo_examen = 90;
        var t_miliseg = tiempo_examen * 1000;
        var fecha = Date.now()
        var horaActual = new Date(fecha);
        var horaInicio = horaActual.getTime();
        var horaFin = horaInicio + t_miliseg;
        //Se ingresa en localStorage la hora en que debe finalizar el exámen
        localStorage.setItem("horaFin", horaFin);

    } //Tiempo del exámen en segundos
    if (localStorage.getItem("horaFin") != null) { 
        var horaReingreso = new Date(Date.now());  
        var tiempo_examen = (localStorage.getItem("horaFin") - horaReingreso.getTime()); 
    }
    console.log(localStorage.getItem("horaFin"));
    //Se pasa el tiempo a segundos
    var tActual = tiempo_examen/1000;
    console.log(tActual);
    //Se convierte el tiempo actual en minutos y horas
    var minutos = Math.round((tActual - 30) / 60) % 60;
    var segundos = Math.round(tActual) % 60;
    var hora = Math.floor(tActual / 3600);
    if (segundos < 10) {
        segundos = "0" + segundos;
    }
    if (minutos < 10) {
        minutos = "0" + minutos;
    }
    document.getElementById('countdown').innerHTML = "Tiempo restante: " + hora + ":" + minutos + ":" + segundos;
     //Cuando el tiempo se acaba se hace revisión y se limpia el almacenamiento local
    if (tActual <= 1) {
        clearInterval(TiempoRestante);
        TiempoTerminado();
    }
    else {

        //Método que detecta si el usuario abre otra pestaña o cambia de programa
        window.onblur = function () {
            document.body.className = 'blurred';
            TiempoTerminado();
            alert("El exámen ha sido cancelado, ha abierto una pestaña o ventana diferente a la del exámen");
        };

        //Disminucón unitaria del tiempo cada 1000 milseg, actualización del valor de hora actual en localStorage
        tActual--;
        var HoraAlmacenada = new Date(Date.now());  
        localStorage.setItem("horaActual", HoraAlmacenada);
    }
}
var TiempoRestante;

//Se ejecuta cuanto la cuenta regresiva llega a 0:00:00
function TiempoTerminado() {
    //Se limpia el almcenamieto local, se revisa e imprime la nota del exámen y se redirige
    localStorage.clear();
    Revision("quiz");
    setTimeout(function(){ location.href = "inicio.html";}, 5000); 
}

//Revisión del exámen con funciones de la libreria quizlib
function Revision() {
    // checkAnswers retorna true isi todas las pregunsta fueron respondida
    var quiz = new Quiz('quiz', respuestas);

    if (quiz.checkAnswers(true)) {
        let quizScorePercent = (quiz.result.scorePercentFormatted*5)/100; //Nota
        let quizResultElement = document.getElementById('quiz-result');
        quizResultElement.style.display = 'block';
        document.getElementById('quiz-score').innerHTML = "Correctas: "+ quiz.result.score.toString()+ " /";
        document.getElementById('quiz-max-score').innerHTML = quiz.result.totalQuestions.toString() ;
        document.getElementById('quiz-percent').innerHTML = "Nota: " + quizScorePercent.toString() + " - ";
        document.getElementById('quiz-mssg').innerHTML = ".";

        // Cambiar color de fondo del resultado
        if (quizScorePercent >= 3){quizResultElement.style.backgroundColor = '#4caf50';}
        else {quizResultElement.style.backgroundColor = '#f44336';}

        document.getElementById("fin").disabled = true;
        document.getElementById("fin").style.background = "#c6d4c7";

        //Se elimina el almacenanmiento local y se redirige
        clearInterval(TiempoRestante);
        localStorage.clear();
        setTimeout(function () { location.href = "inicio.html"; }, 5000);

    //checkAnswers es false cuando faltan preguntas por responder
    }else if(quiz.checkAnswers(false) && tiempo_examen == 0){

        let quizScorePercent = (quiz.result.scorePercentFormatted*5)/100; //Nota
        let quizResultElement = document.getElementById('quiz-result');
        quizResultElement.style.display = 'block';
        document.getElementById('quiz-score').innerHTML = "Correctas: "+ quiz.result.score.toString()+ " /";
        document.getElementById('quiz-max-score').innerHTML = quiz.result.totalQuestions.toString() ;
        document.getElementById('quiz-percent').innerHTML = "Nota: " + quizScorePercent.toString() + " - ";
        document.getElementById('quiz-mssg').innerHTML = ".";

        // Cambiar color de fondo del resultado
        if (quizScorePercent >= 3){quizResultElement.style.backgroundColor = '#4caf50';}
        else {quizResultElement.style.backgroundColor = '#f44336';}

        document.getElementById("fin").disabled = true;
        document.getElementById("fin").style.background = "#c6d4c7";

        //Se elimina el almacenanmiento local y se redirige
        clearInterval(TiempoRestante);
        localStorage.clear();
        setTimeout(function () { location.href = "inicio.html"; }, 5000);

    }else{
        
        //Caso en que faltan respuestas y se desea terminar el exámen
        let quizResultElement = document.getElementById('quiz-result');
        quizResultElement.style.display = 'block';
        document.getElementById('quiz-mssg').innerHTML = "Faltan preguntas por responder";
        quizResultElement.style.backgroundColor = '#ffc107';
    }
}

// Método para revisión de quiz
function myHandleAnswerMethod(quiz, question, no, correct) {
    if (!correct) {
        var answers = question.getElementsByTagName('input');
        for (var i = 0; i < answers.length; i++) {
            if (answers[i].type === "checkbox" || answers[i].type === "radio"){ 
                // If the current input element is part of the correct answer, highlight it
                if (quiz.answers[no].indexOf(answers[i].value) > -1) {
                    answers[i].parentNode.classList.add(Quiz.Classes.CORRECT);
                }
            } else {
                // If the input is anything other than a checkbox or radio button, show the correct answer next to the element
                var correctAnswer = document.createElement('span');
                correctAnswer.classList.add(Quiz.Classes.CORRECT);
                correctAnswer.classList.add(Quiz.Classes.TEMP); // quiz.checkAnswers will automatically remove elements with the temp class
                correctAnswer.innerHTML = quiz.answers[no];
                correctAnswer.style.marginLeft = '10px';
                answers[i].parentNode.insertBefore(correctAnswer, answers[i].nextSibling);
            }
        }
    }
}

//Retorno a página de inicio
function Volver() {
    location.href = "inicio.html";
}

//Evento que bloque el click derecho
document.addEventListener('contextmenu', event => event.preventDefault());

//Método que verifica si el usuario puede usar localStorage
/*if (typeof(Storage) !== "undefined") {
            // Store
            localStorage.setItem("tiempoActual",tActual);
            // Retrieve
            console.log(localStorage.getItem("tiempoActual"));
          } else {
            alert("Sorry, your browser does not support Web Storage...");
          }*/

