var db = firebase.firestore();
var doc_id;
var datos = "";

//Dirigirse a examen.html y crear en localstorage una llave ref con valor del id del quiz
function refExamen(id) {
    localStorage.setItem("ref", id);
    setTimeout(function () { location.href = "examen.html"; }, 0);
}

//Función que retorna la cadena de el tiempo restante con moment.js
function tiempoRelativo(tiempo) {
    var Tfinal = moment(tiempo * 1000, "x").fromNow();
    return Tfinal;
}

//Función para verificar estado del quiz en Cloud Firestore y modificar el estado en pantalla
function estadoActivo(est) {
    let cadena;
    if (est === true) { cadena = "Activo"; }
    else if (est === false) { cadena = "Cerrado"; }
    else if (est = "En curso") { cadena = "En curso"; }
    return cadena;
}

//Función para verificar nota del quiz en Cloud Firestore y modificar el valor en pantalla
function estadoNota(est, not) {
    let cadena;
    if (est === true) { cadena = " Pendiente"; }
    else { cadena = not }
    return cadena;
}

//Función escritura de CRUD para actualizar datos de un documento en la colección quiz  
function ActualizarDatosUsuario(email_, id_, estado_, nota_) {
    let datos = db.collection("estudiantes").doc(email_).collection("quiz").doc(id_);
    return datos.update({
        activo: estado_,
        nota: nota_
    })
        .then(function () {
            console.log("BD actualizada");
            return true;
        })
        .catch(function (error) {
            console.error("Error actualizando documento: ", error);
            return false;
        });
}

//Función para cerrar sesión
function SalirDeLaCuenta() {
    firebase.auth().signOut().then(function () {
        setTimeout(function () { location.href = "index.html"; }, 1000);
        // Sign-out successful.
    }).catch(function (error) {
        // An error happened.
    });
}

// Funciones CreatTarjeta y Card agregan código HTML a inicio.html por cada quiz que tenga el usuario actual
function CrearTarjeta(datos) {
    let contenedor = `<div class="row">` + datos + `</div>`;
    document.getElementById("contenedorQuices").innerHTML = contenedor;
    return contenedor;
}

function Card(asign, fechaf, nomb, nota, estado, color, dir) {
    datos += `
    <div class="col-md-3 col-sm-6 item d-flex align-items-stretch">
      <div class="card" `+dir+`">
        <img class="card-img-top" src="https://fakeimg.pl/350x200/?text=_" alt="Card image cap">
          <div class="card-body">
            <h5 class="card-title">`+ asign + `</h5>
            <p class="card-text">`+ nomb + `</p>
            <p class="card-text"> Calificación: `+ estadoNota(estado, nota) + `</p>
            <p class="card-text"> Estado: `+ estadoActivo(estado) + `</p>
          </div>
        <div class="card-footer `+ color + `">
          <small class="text-white">`+ fechaf + `</small>
        </div>
      </div>
    </div>`;
    CrearTarjeta(datos);
}

//Lectura y escritura de los quizes del usuario actual, actualización de estados y notas 
function GenerarModulos() {
    firebase.auth().onAuthStateChanged(function (user) {
        if(user){
        var horaAct = new Date(Date.now());
        horaAct = (horaAct[Symbol.toPrimitive]('number')) / 1000; //Hora actual en milisegundos
        doc_id = user.email;
        db.collection("estudiantes").doc(doc_id).collection("quiz").get().then(function (querySnapshot) {
            querySnapshot.forEach(function (doc) {
                var data = doc.data();
                var ref = data.id;         //ID del documento del quiz
                var nota = data.nota;      //Nota quiz
                var estado = data.activo;  //Estados del quiz

                db.collection("quiz").doc(ref).get().then(function (dataQuiz) {
                    var dataQ = dataQuiz.data();                           
                    var horaFinalQuiz = localStorage.getItem(ref);       //Hora final del quiz que esta en curso
                    var tiempoRest = tiempoRelativo(horaFinalQuiz/1000); //Calculo de tiempo del quiz en curso con moment.js
                    var asign = dataQ.asignatura;                        //Nombre de la asignatura
                    var fechaf = tiempoRelativo(dataQ.fechafinal);       //Calculo de tiempo para cierre de quiz con moment.js
                    var nomb = dataQ.nombre;                             //Nombre del quiz                                     
                    var col;                                             //Color del footer de cada card
                    var conDir = `onclick="refExamen(`+`'`+ref+`'`+`)"`; //Cadena de evento de un quiz que esta activo o en curso
                    var sinDir = `style="cursor:default;"`;              //Cadena para quiz inactivo

                    // Caso de quiz activo pero no en curso
                    if (data.activo === true && localStorage.getItem(ref) == null) {

                        // Caso en que la hora en que debia cerrarse el quiz es menor a la hora actual
                        if (dataQ.fechafinal < horaAct) {
                            ActualizarDatosUsuario(doc_id,data.id,false,"0"); //Se actualiza bd, se cierra el quiz con nota 0
                            col = "bg-danger";
                            Card(asign, fechaf, nomb, "0", false, col,sinDir); }
                          
                        // Caso en que la hora en que debia cerrarse el quiz es menor a la hora actual    
                        else {
                            col = "bg-success";
                            Card(asign, fechaf, nomb, nota, estado, col,conDir); }

                    // Caso de quiz inactivo y ya presentado
                    } else if (data.activo === false && localStorage.getItem(ref) == null) {

                        // Caso en que la hora en que debia cerrarse el quiz es menor a la hora actual
                        if (dataQ.fechafinal < horaAct) {
                        col = "bg-danger";
                        Card(asign, fechaf, nomb, nota, estado, col, sinDir); }
                        
                        // Caso en que el quiz ya se haya presentado
                        else{
                        col = "bg-danger";
                        Card(asign,"Ya fue presentado", nomb, nota, estado, col, sinDir); }

                    // Caso de quiz inactivo pero aún en curso
                    } else if (data.activo === false && localStorage.getItem(ref) !== null) {
                        console.log(localStorage.getItem(data.id))
                        // Caso en que la hora en que debia terminar el quiz es menor a la hora actual
                        if (horaFinalQuiz < (horaAct*1000)) {
                            localStorage.removeItem(ref);
                            ActualizarDatosUsuario(doc_id,data.id,false,"0");
                            col = "bg-danger";
                            Card(asign, tiempoRest, nomb, "0", false, col, sinDir); }

                        // Caso en que el quiz sigue en curso y el timempo no ha terminado
                        else {
                            col = "bg-warning";
                            Card(asign, tiempoRest, nomb, nota, "En curso", col, conDir); }
                    }
                });
            });
        });
    }else{
        SalirDeLaCuenta();
    }
    })
}
GenerarModulos();

