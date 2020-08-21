
function EliminarContenedor(id){
	child = document.getElementById(id);	
	if (!child){
		alert("id no existe");
	} else {
		parent = child.parentNode;
		parent.removeChild(child);
	}
}

function TiempoTerminado() {
    alert("El tiempo ha terminado");
    location.href = "inicio.html";
}

function Continuar(){
    setTimeout("TiempoTerminado()", 5000); //30 min = 18000000

    EliminarContenedor("recuerde");

    /*contenido.innerHTML = `
        <div class="container mt-5">
        </div>
        `;*/
}

document.addEventListener('contextmenu', event => event.preventDefault());

/*function startTime() {
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();
    m = checkTime(m);
    s = checkTime(s);
    document.getElementById('txt').innerHTML =
        h + ":" + m + ":" + s;
    var t = setTimeout(startTime, 500);
}
function checkTime(i) {
    if (i < 10) { i = "0" + i };  // add zero in front of numbers < 10
    return i;
}*/