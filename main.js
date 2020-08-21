/*db, coleccion_usuarios, coleccion_estudiantes, user, provider, name, email, photoUrl, emailVerified, uid,*/
/*import { db, uid, SalirDeLaCuenta} from './app.js';*/
function redireccionar_index() {
    location.href = "index.html";
}

function ListadoExamenes(){

}

var uid;
var db = firebase.firestore();
var coleccion_examenes = "examenes-asociados";

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        document.getElementById('BotonSalir').style.visibility = 'visible';
        uid = user.uid;
        console.log("usuario activo");
        console.log(uid);

        var docRef = db.collection(coleccion_examenes).doc("jeRsmVQncTSXOj5U6dUX9pTYBgD2");
        docRef.get().then(function (doc) {
            if (doc.exists) {
                console.log("El usuario tiene examenes asociados");

            } else {
                console.log("El usuario tiene examenes asociados");
            }
        });

    } else {
        
        setTimeout("redireccionar_index()", 1000);
        console.log("usuario inactivo");
        document.getElementById('BotonSalir').style.visibility = 'hidden';
    }
});

function SalirDeLaCuenta() {
    firebase.auth().signOut().then(function () {
        setTimeout("redireccionar_index()", 1000);
        // Sign-out successful.
    }).catch(function (error) {
        // An error happened.
    });
} 

/*document.addEventListener('contextmenu', event => event.preventDefault());*/
