//CRUD con Cloud Firestore
var db = firebase.firestore();
var coleccion_estudiantes = "estudiantes";

//Método que verifica si el usuario puede usar localStorage
function verificarCookies(){
  var cookiesHabilitados = navigator.cookieEnabled;
  if (!cookiesHabilitados){ 
      document.cookie = "testcookie";
      cookiesHabilitados = document.cookie.indexOf("testcookie")!=-1;
  }
  return cookiesHabilitados || errorCookies();
}

function errorCookies(){
  alert("Lo sentimos, su navegador no soporta el almacenamiento local. "+ 
  "Verfique en la configuración de su navegador que el uso de cookies este habilitado para este sitio web.");
}
verificarCookies();

function VerificarEstado() {
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      console.log("usuario activo")
      if(ComprobarDominio(email) == true){
        setTimeout(function () { location.href = "inicio.html"; }, 0)
      }else{
        console.log("Usuario incorrecto");
      }
    } else {
      console.log("usuario inactivo")
    }
  });
}
//Verficar si hay sesión iniciada
VerificarEstado();

//Función para agregar usuarios a la colección estudiantes 
function CrearUsuario(email_, nombre_, foto_) {
    let data = { 
      correo: String(email_) ,
      foto: String(foto_) ,
      nombre: String(nombre_)
    }
    db.collection(coleccion_estudiantes).doc(email_).set(data);
    return true;
}

function ActualizarDatosUsuario(coleccion_, email_, nombre_, foto_) {
  let datos = db.collection(coleccion_).doc(email_);
  return datos.update({
    correo: String(email_) ,
    foto: String(foto_) ,
    nombre: String(nombre_)
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

// Varibles de acceso

var user = firebase.auth().currentUser;
var provider = new firebase.auth.GoogleAuthProvider();
var name, email, photoUrl;

function ComprobarDominio(stringemail) {
  if (stringemail.endsWith("@cun.edu.co")) {
    return true;
  }
}

//Autenticación con Google

function AccederConCuentaGoogle() {
  //Autorización para lectura de datos
  //provider.addScope("https://www.googleapis.com/auth/contacts.readonly");

  //Sugiere el ingreso o registro unicamente con correos con dominio cun.edu.co
  provider.setCustomParameters({ prompt: 'select_account', hd: 'cun.edu.co' });

  //Ingreso con ventana emergente de Google
  firebase.auth().signInWithPopup(provider).then(function (result) {
    email = result.user.email;
    name = result.user.displayName;
    photoUrl = result.user.photoURL;

    if (ComprobarDominio(email) == true) {

      let EstudiantesRef = db.collection(coleccion_estudiantes).doc(email);
      EstudiantesRef.get().then(function (doc) {
        if (doc.exists) {
          //Actualizar datos de usuario que ya existe en la coleccion estudiantes
          if(ActualizarDatosUsuario(coleccion_estudiantes, email, name, photoUrl)){
            VerificarEstado();
          }
          //console.log("El documento ya existia y se actualizo");

        } else {
          //Agregar usuario a la coleccion estudiantes
          if(CrearUsuario(email, name, result.user.photoURL)){
            VerificarEstado();
          }
          //console.log("Correo válido, usuario creado en la colección estudiantes");
        }
      });
    }
    
    else {
      alert("El correo ingresado no es de dominio @cun.edu.co. Por favor, ingrese un correo válido. Ejemplo: juan_perez@cun.edu.co");
      
      var usuarioaEliminar = firebase.auth().currentUser;
      usuarioaEliminar.delete().then(function () {
        //Se elimina el usuario de Auth cuando el correo ingresado no es de dominio CUN
      })
      firebase.auth().signOut().then(function () { 


      });
    }

  }).catch(function (error) {
    // Datos de error.
    var errorMessage = error.message;
    console.log("Error de autenticación", errorMessage);
  });
}

