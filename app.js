//Verficar si hay sesión iniciada
function redireccionar_inicio() {
  location.href = "inicio.html";
}

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    //document.getElementById('BotonEntrar').style.visibility = 'hidden';
    setTimeout(redireccionar_inicio(), 1000);
    console.log("usuario activo")

  } else {
    console.log("usuario inactivo")
    //document.getElementById('BotonEntrar').style.visibility = 'visible';
  }
});


//CRUD con Cloud Firestore

var db = firebase.firestore();
var coleccion_usuarios = "usuarios";
var coleccion_estudiantes = "estudiantes";
var documento;

function CrearUsuario(uid_, email_, nombre_, foto_) {
  if (nombre_ == undefined) {
    let data = { email: email_ }
    db.collection(coleccion_estudiantes).doc(String(uid_)).set(data);
  }
  else {
    db.collection(coleccion_usuarios).add({
      UID: String(uid_),
      email: String(email_),
      nombre: String(nombre_),
      fotoURL: String(foto_)
    })
      .then(function (docRef) {
        documento = docRef.id;
        console.log("Usuario creado con ID: ", docRef.id);
        LeerDatosUsuario(documento);
      })
      .catch(function (error) {
        console.error("Error agregando usuario: ", error);
      });
  }
}

function LeerDatosUsuario(documento_) {
  let docRef = db.collection(coleccion_estudiantes).doc(documento_);
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

function ActualizarDatosUsuario(coleccion_, documento_, nombre_, foto_) {
  let datos = db.collection(coleccion_).doc(documento_);
  return datos.update({
    nombre: nombre_,
    fotoURL: foto_,
  })
    .then(function () {
      console.log("BD actualizada");
    })
    .catch(function (error) {
      console.error("Error actualizando documento: ", error);
    });
}

function EliminarUsuario(coleccion_, documento_) {
  db.collection(coleccion_).doc(documento_).delete().then(function () {
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
    var token = result.credential.accessToken;
    email = result.user.email;
    name = result.user.displayName;
    photoUrl = result.user.photoURL;
    uid = result.user.uid;

    if (ComprobarDominio(email) == true) {

      let EstudiantesRef = db.collection(coleccion_estudiantes).doc(result.user.uid);
      EstudiantesRef.get().then(function (doc) {
        if (doc.exists) {
          //Actualizar datos de usuario que ya existe en la coleccion estudiantes
          ActualizarDatosUsuario(coleccion_estudiantes, result.user.uid, name, photoUrl);
          document.getElementById('BotonSalir').style.visibility = 'visible';
          console.log("El documento ya existia y se actualizo");

        } else {
          //Agregar usuario a la coleccion usuarios
          CrearUsuario(result.user.uid, email, name, result.user.photoURL);
          //Agregar usuario a la coleccion estudiantes
          CrearUsuario(result.user.uid, email);
          document.getElementById('BotonSalir').style.visibility = 'visible';
          console.log("Correo válido, usuario creado en las 2 colecciones");
        }
      });
    }
    
    else {
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

document.addEventListener('contextmenu', event => event.preventDefault());

