var db = firebase.firestore();
var email, tiempoBd, dirIP;
var focus = true;
var referencia = "";
//Arreglo que asigna la letra correspondiente al orden de cada pregunta generada
var indicadores = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
//Variable en la que se almacenan las respuestas asignadas por el docente
var respuestas = [];

if (localStorage.getItem("ref") === null) {Volver();}
else{referencia=localStorage.getItem("ref");} 

function respuestaRandom(arreglo, posRespuesta) {
    let Respuesta;
    for(let i = 0; i < indicadores.length; i++){
        if(indicadores[i] == posRespuesta){
            Respuesta = arreglo[i+1];
        }
    }

    let nuevoArreglo = [];
    for(let i = 1; i < arreglo.length - 1; i++){
        nuevoArreglo[i-1] = arreglo[i];
    }

    let temporal, posRandom;
    for (let i = nuevoArreglo.length; i > 1; i--) {
        posRandom = Math.floor(Math.random() * i);
        temporal = nuevoArreglo[posRandom];
        nuevoArreglo[posRandom] = nuevoArreglo[i-1];
        nuevoArreglo[i-1] = temporal;
    }

    for (let i = 0; i < nuevoArreglo.length; i++){
        if(nuevoArreglo[i] == Respuesta){
            respuestas.push(indicadores[i]);
            //console.log("respuestas correctas",respuestas);
        }
    }
    return nuevoArreglo;
}

function ActualizarDatosUsuario(email_, id_, estado_, nota_) {
    clearInterval(TiempoRestante);
    document.body.onbeforeunload = "";
    localStorage.removeItem(referencia);
    let datos = db.collection("estudiantes").doc(email_).collection("quiz").doc(id_);
    return datos.update({
        activo: estado_,
        nota: nota_,
        horaFin: firebase.firestore.Timestamp.now()
    })
        .then(function () {
            if(document.body.className === "focused"){
            //Se elimina el almacenanmiento local y se redirige
            setTimeout(function () { location.href = "inicio.html"; }, 5000);
            }else{
                window.onfocus = function () {
                    setTimeout(function () { location.href = "inicio.html"; }, 5000);
                    console.log("BD actualizada");
                }
            }
        })
        .catch(function (error) {
            console.error("Error actualizando documento: ", error);
        });
}

//Función que determina las cantidad de preguntas del exámen y genera código HTML basado
//en la estrucutura sugerida por la libreria quizlib.js
function CrearExamen(nombre, arreglo, id, rpta) {
    //Los exámenes en bd serán creados como arreglos en donde:
    //La posición 0 es el nombre de la pregunta 
    //La posición 1 en adeltante hasta la penúltima posoción, son las preguntas
    //La última posición es la respuesta correcta
    let arregloRespuestas = respuestaRandom(arreglo, rpta);
    let preg = "";
    for (let i = 1; i < arreglo.length - 1; i++) {
        preg += `<li><label><input type="radio" name="`+id+`" value=` + indicadores[i - 1] + `>` + arregloRespuestas[i-1] + `</label></li>`;
    }

    let contenedor = `
    <div class="card quizlib-question">
    <div class="quizlib-question-title"><h4>`+ nombre + `</h4></div>
    <div class="quizlib-question-answers">
        <ul>`+ preg + `
        </ul>
    </div>
    </div>
        `;

    document.getElementById('quiz').style.visibility = 'hidden';
    return contenedor;

}

firebase.auth().onAuthStateChanged(function (user) {
    //Si hay usuario activo
    if (user) {
        email = user.email;
        obtenerIP();
        db.collection("quiz").doc(referencia).get().then(function (doc) {
            if (doc.exists) {
                var dataDoc = doc.data();
                var preg = dataDoc.preguntas;
                tiempoBd = dataDoc.tiempo;
                document.getElementById("titulo").innerHTML = "<h1>"+dataDoc.nombre+"</h1>";
                var arregloAux = [];
                
                //Se crea un nuevo arreglo con las datos del objeto preguntas del quiz
                for (const prop in preg) {
                    arregloAux.push(preg[prop]);
                } 

                //Ciclo que cambia el orden de forma aleatoria del arreglo anteriormente creado
                let temporal, posRandom;
                for (let i = arregloAux.length; i > 1; i--) {
                    posRandom = Math.floor(Math.random() * i);
                    temporal = arregloAux[posRandom];
                    arregloAux[posRandom] = arregloAux[i-1];
                    arregloAux[i-1] = temporal;
                }
                //console.log("auxiliar",arregloAux);

                //Ciclo que se repite por cada llave dentro del arreglo auxiliar en donde prop es el arreglo con el encabezados,respuestas y rpta correcta
                for (const prop in arregloAux) {
                    var arreglo = arregloAux[prop];
                    //console.log("arr: ", arreglo);
                    //console.log(`obj.${prop} = ${arregloAux[prop]}`);
                    //Se insertan los bloques HTML del quiz junto con las preguntas importadas de firebase
                    document.getElementById("quiz").innerHTML += CrearExamen(arreglo[0], arreglo, prop, arreglo[arreglo.length - 1]);
                } 
                document.getElementById("cont").disabled = false;
                document.getElementById("cont").style.background = "#44b847";
                document.getElementById("cover-loader").style.display = "none";
                //Una vez insertado todo el código HTML se habilita el botón continuar
            }
        })
    }
    //Si no hay usuario activo
    else {
        Volver();
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

var tiempo_examen;
function CuentaRegresiva() {
    //Se comprueba que en localStorage en la llave "horaFin" este vacio
    if (localStorage.getItem(referencia) === null) {
        //Se asigna el tiempo de duración del exámen y se calcula a que hora según UTC debe finalizar
        tiempo_examen = tiempoBd;
        var t_miliseg = tiempo_examen * 1000;
        var fecha = Date.now();
        var horaActual = new Date(fecha);
        var horaInicio = horaActual.getTime();
        var horaFin = horaInicio + t_miliseg;
        //Se ingresa en localStorage la hora en que debe finalizar el exámen
        localStorage.setItem(referencia, horaFin);

    } //Tiempo del exámen en segundos
    if (localStorage.getItem(referencia) != null) { 
        var horaReingreso = new Date(Date.now());  
        var tiempo_examen = (localStorage.getItem(referencia) - horaReingreso.getTime()); 
    }
    //console.log("este es: ",localStorage.getItem(referencia));
    //Se pasa el tiempo a segundos
    var tActual = tiempo_examen/1000;
    //console.log(tActual);
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
    if (tActual <= 0) {
        document.getElementById('countdown').innerHTML = "Tiempo finalizado";
        clearInterval(TiempoRestante);
        TiempoTerminado();
    }
    else {

        //Método que hablita la advertencia de los botones de regreso, recargar y cerrar del navegador
        if (document.body.onbeforeunload !== "") {
            bloqueoNavegador();
        }

        //Método que detecta si el usuario abre otra pestaña o cambia de programa
        window.onblur = function () {
            document.body.className = 'blurred';
            TiempoTerminado();
        };

        //Disminucón unitaria del tiempo cada 1000 milseg, actualización del valor de hora actual en localStorage
        tActual--;
        var HoraAlmacenada = new Date(Date.now());  
        localStorage.setItem("horaActual", HoraAlmacenada);
    }
}
var TiempoRestante;

//Función de botón continuar de la alerta incial "recuerde"
function Continuar() {
    document.body.setAttribute("onbeforeunload", `"bloqueoNavegador()"`);
    let datos = db.collection("estudiantes").doc(email).collection("quiz").doc(referencia);
    document.getElementById("cover-loader").style.display = "block";
    if (localStorage.getItem(referencia) == null) {
        datos.update({
            horaInicio: firebase.firestore.Timestamp.now(),
            IP: dirIP
        })
    }

    datos.update({ activo: false, }).then(function () {
        //Se incia la cuenta regresiva actualizando la función cada 1000 milseg, se muestra el contenido del exámen
        document.getElementById("cover-loader").style.display = "none";
        TiempoRestante = setInterval('CuentaRegresiva()', 1000);
        EliminarContenedor("recuerde");
        document.getElementById('titulo').style.visibility = 'visible';
        document.getElementById('quiz').style.visibility = 'visible';
        document.getElementById('btn-fin').style.visibility = 'visible';
    });
}

//Se ejecuta cuanto la cuenta regresiva llega a 0:00:00
function TiempoTerminado() {
    //Se limpia el almcenamieto local, se revisa e imprime la nota del exámen y se redirige
    tiempo_examen = 0;
    localStorage.removeItem(referencia);
    Revision("quiz");
}

//Revisión del exámen con funciones de la libreria quizlib
function Revision() {
    var quiz = new Quiz('quiz', respuestas);
    setTimeout(`document.getElementById("cover-loader").style.display = "block"`,4000);
    // checkAnswers retorna true si todas las pregunsta fueron respondida
    if (quiz.checkAnswers(true)) {
        window.scrollTo(0, document.body.scrollHeight); //Scroll al fondo de la página para observar mensaje
        let quizScorePercent = (quiz.result.scorePercentFormatted*5)/100; //Nota
        let quizResultElement = document.getElementById('quiz-result');
        quizResultElement.style.display = 'block';
        ActualizarDatosUsuario(email,referencia,false,quizScorePercent.toString());
        // Bloquear botónn de finalizar
        document.getElementById("fin").disabled = true;
        document.getElementById("fin").style.background = "#c6d4c7";

        if (tiempo_examen !== 0 && document.body.className == 'focused') {
            quizResultElement.style.backgroundColor = '#4caf50';
            document.getElementById('quiz-mssg').innerHTML = "Intento finalizado. La nota será publicada luego de la revisión.";
        } else if(tiempo_examen == 0 && document.body.className == "focused"){
            quizResultElement.style.backgroundColor = '#f44336';
            window.scrollTo(0, document.body.scrollHeight); //Scroll al fondo de la página para observar mensaje
            document.getElementById('quiz-mssg').innerHTML = "El tiempo ha terminado. La nota será publicada luego de la revisión.";
        } else if(tiempo_examen == 0 && document.body.className == 'blurred'){
            quizResultElement.style.backgroundColor = '#f44336';
            window.scrollTo(0, document.body.scrollHeight); //Scroll al fondo de la página para observar mensaje
            document.getElementById('quiz-mssg').innerHTML = "El examen ha sido cancelado, ha abierto una pestaña o ventana diferente a la del examen. ";
        }

    //checkAnswers es false cuando faltan preguntas por responder
    }else if(quiz.checkAnswers(false)){
        window.scrollTo(0, document.body.scrollHeight); //Scroll al fondo de la página para observar mensaje
        let quizScorePercent = (quiz.result.scorePercentFormatted*5)/100; //Nota
        let quizResultElement = document.getElementById('quiz-result');
        quizResultElement.style.display = 'block';

        if ( tiempo_examen !== 0  && document.body.className == "focused") {
            quizResultElement.style.backgroundColor = '#deda10';
            document.getElementById('quiz-mssg').innerHTML = "Faltan preguntas por responder.";

        } else if (tiempo_examen == 0 && document.body.className == "focused") {
            ActualizarDatosUsuario(email, referencia, false, quizScorePercent.toString());
            quizResultElement.style.backgroundColor = '#f44336';
            document.getElementById('quiz-mssg').innerHTML = "El tiempo ha terminado. La nota será publicada luego de la revisión.";
            document.getElementById("fin").disabled = true;
            document.getElementById("fin").style.background = "#c6d4c7";

        } else if (tiempo_examen == 0 && document.body.className == 'blurred') {
            ActualizarDatosUsuario(email, referencia, false, quizScorePercent.toString());
            quizResultElement.style.backgroundColor = '#f44336';
            document.getElementById('quiz-mssg').innerHTML = "El examen ha sido cancelado, ha abierto una pestaña o ventana diferente a la del examen. ";
            document.getElementById("fin").disabled = true;
            document.getElementById("fin").style.background = "#c6d4c7";
        }
    }
}

//Retorno a página de inicio
function Volver() {
    location.href = "inicio.html";
}

//Evento que bloquea el click derecho
document.addEventListener('contextmenu', event => event.preventDefault());

// Evento de conexión perdida
window.addEventListener("offline", function (e) {
    console.log("Conexión perdida");
    localStorage.setItem("offline",Date.now());
    let toast = document.getElementById("toast");
    toast.style.background = "#dc3545";
    toast.innerHTML = "Se ha perdido la conexión a internet";
    toast.style.visibility = "visible";
    toast.className = "mostrar";
});

// Evento de conexión En línea
window.addEventListener("online", function (e) {
    console.log("En línea");
    let offline = localStorage.getItem("offline");
    let datos = db.collection("estudiantes").doc(email).collection("quiz").doc(referencia);
    if (localStorage.getItem("offline") !== null) {
        datos.update({
            horaOffline : firebase.firestore.Timestamp.fromMillis(offline),
            horaOnline  : firebase.firestore.Timestamp.now()
        })
    }
    let toast = document.getElementById("toast");
    toast.style.background = "#44b847";
    toast.className = "ocultar";
    toast.innerHTML = "Conexión recuperada";
    setTimeout(function(){ toast.className = toast.className.replace("ocultar", ""); toast.style.visibility = "hidden"; }, 3000);
});

//Función para obtener la IP pública del usuario
function obtenerIP() {
    $.getJSON('https://api.ipify.org?format=jsonp&callback=?', function (data) {
        dirIP = data["ip"];
    });
}

//Función para advertir cancelación del exámen en botones de regreso o cerrar del navegador
function bloqueoNavegador() {  
    window.onbeforeunload = function (evento) {
        mensaje = "¿Desea abandonar el sitio?";
        evento.returnValue = mensaje;
        return mensaje;
      };
}

//Prueba de función para advertir con javascript
/*function bloqueoNavegador() {  
    window.addEventListener("beforeunload", function(event) {
        event = setInterval(
            function () {
                var mensaje = document.getElementById("mensajeAlerta");
                mensaje.style.visibility = "visible";
                mensaje.innerHTML = 
                `<div class="mensajeAlerta-header">Aviso</div>
                <span class="closebtn" onclick="this.parentElement.style.visibility='hidden';">×</span>
                <div class="mensajeAlerta-container">
                    <p>Esta saliendo de la pagína actual, el examen será calificado con las respuestas contestadas ¿Está seguro que desea salir?</p>
                </div>`; 
            }, 10000
          );
    });
}*/
