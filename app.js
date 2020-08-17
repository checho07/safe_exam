/*function registrar(){
    var email = document.getElementById('email').value;
    var contrasena = document.getElementById('contrasena').value;

    firebase.auth().createUserWithEmailAndPassword(email, contrasena)
    .then(function(){
        verificar()
    })
    .catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage );
        // ...
        
      });
}

function ingreso(){
    var email2 = document.getElementById('email2').value;
    var contrasena2 = document.getElementById('contrasena2').value;

    firebase.auth().signInWithEmailAndPassword(email2, contrasena2).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage );
        // ...
      });
}

function observador(){
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log(' existe usuario activo')
            aparece(user);
          // User is signed in.
          var displayName = user.displayName;

          var email = user.email;

            console.log('*****************');
            console.log(user.emailVerified)
            console.log('*****************');

          var emailVerified = user.emailVerified;
          var photoURL = user.photoURL;
          var isAnonymous = user.isAnonymous;
          var uid = user.uid;
          var providerData = user.providerData;
          // ...
        } else {
          // User is signed out.
          console.log('no existe usuario activo');
          contenido.innerHTML = `

          `;
          // ...
        }
      });
}
observador();


function aparece(user){
    var user = user;
    var contenido = document.getElementById('contenido');
    if(user.emailVerified){
        contenido.innerHTML = `
        <div class="container mt-5">
        <div class="alert alert-success" role="alert">
        <h4 class="alert-heading">Bienvenido! ${user.email} </h4>
        <div class="pregresp">
  <div class="pregunta">1. ¿Crees que HTML es una buena tecnología?<br />
  </div>
  <div class="respuestas">
    <input type="radio" name="preg1" value="1" /> Sí<br />
    <input type="radio" name="preg1" value="2" /> No<br />
    <input type="radio" name="preg1" value="3" /> Ns/Nc<br />
  </div>
</div>
        `;
    }

}

function cerrar(){
    firebase.auth().signOut()
    .then(function(){
        console.log('saliendo....')
    })
    .catch(function(error){
        console.log(error)
    })
}

function verificar(){
    var user = firebase.auth().currentUser;

user.updateEmail("user@example.com").then(function() {
  // Update successful.
  console.log('enviando correo');
}).catch(function(error) {
  // An error happened.
  console.log(error);
});
}*/

/*firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      console.log("usuario activo")
    } else {
      console.log("usuario inactivo")
}*/

//CRUD con Cloud Firestore

var db = firebase.firestore();
var coleccion = "usuarios";
var documento;

function LeerDatosUsuario(documento_) {
  let docRef = db.collection(coleccion).doc(documento_);
  docRef.get().then(function (doc) {
    if (doc.exists) {
      console.log("Datos del Documento:", doc.data());
    } else {
      console.log("No existe el documento");
    }
  }).catch(function (error) {
    console.log("Error obteniendo el documento:", error);
  });
}

function CrearUsuario(nombre_,email_,foto_,uid_) {
  db.collection(coleccion).add({
    nombre: String(nombre_),
    email: String(email_),
    fotoURL: String(foto_),
    UID: String(uid_)
  })
    .then(function (docRef) {
      documento = docRef.id;
      console.log("Usuario creado con ID: ", docRef.id);

      //Prueba de metodo leer, actualizar y eliminar
      LeerDatosUsuario(documento); 
      ActualizarDatosUsuario(documento,"a","c","t","u");
      //EliminarUsuario(documento);
    })
    .catch(function (error) {
      console.error("Error agregando usuario: ", error);
    });
}

function ActualizarDatosUsuario(documento_,nombre_,email_,foto_,uid_) {
  let datos = db.collection(coleccion).doc(documento_);
  return datos.update({
    nombre: nombre_,
    email: email_,
    fotoURL: foto_,
    UID: uid_
  })
    .then(function () {
      console.log("Documento actualizado");
    })
    .catch(function (error) {
      console.error("Error actualizando documento: ", error);
    });
}

function EliminarUsuario(documento_) {
  db.collection(coleccion).doc(documento_).delete().then(function () {
    console.log("Usuario elminado");
  }).catch(function (error) {
    console.error("Error eliminando usuario: ", error);
  });
}

// Varibles de acceso

var user = firebase.auth().currentUser;
var provider = new firebase.auth.GoogleAuthProvider();
var name, email, photoUrl, emailVerified, uid;

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
  provider.setCustomParameters({ hd: 'cun.edu.co' });

  firebase.auth().signInWithPopup(provider).then(function (result) {
    var email = result.user.email;

    if (ComprobarDominio(email) == true) {
      var token = result.credential.accessToken;
      name = result.user.displayName;
      email = result.user.email;
      photoUrl = result.user.photoURL;
      uid = result.user.uid;

      /*firebase.auth().currentUser.getIdToken(true).then(function(idToken) {
        console.log(idToken);
      }).catch(function(error) {
        // Handle error
      });*/

      //Agregar usuario a base de datos
      CrearUsuario(name, email, result.user.photoURL, result.user.uid);
      console.log("Correo válido, usuario creado");
    } else {
      alert("El correo ingresado no es de dominio @cun.edu.co. Por favor, ingrese un correo válido. Ejemplo: juan_perez@cun.edu.co");
      var usuarioaEliminar = firebase.auth().currentUser;
      usuarioaEliminar.delete().then(function () {
        //Se elimina el usuario de Auth
      }).catch(function (error) {
      });
    }

  }).catch(function (error) {
    // Datos de error.
    var errorCode = error.code;
    var errorMessage = error.message;
    var email = error.email;
    var credential = error.credential;
    console.log("Error de autenticación", errorMessage);
  });
}

