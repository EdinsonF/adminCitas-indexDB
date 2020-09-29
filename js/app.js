/* VARIABLES */
const mascota = document.querySelector("#mascota"),
 propietario = document.querySelector("#propietario"),
 telefono = document.querySelector("#telefono"),
 fecha = document.querySelector("#fecha"),
 hora = document.querySelector("#hora"),
 sintomas = document.querySelector("#sintomas");
 const formulario = document.querySelector("#nueva-cita");
 const listaCitas = document.querySelector("#citas");

 const citasObj = {
    mascota : '',
    propietario: '',
    telefono: '',
    fecha: '',
    hora: '',
    sintomas: ''
 };


 let modActualizar;
let DB;

/* CLASES */
class Citas{
    constructor(){
        this.citas = [];
    }

    creandoCita(obj){
        this.citas = [...this.citas, obj];
        //console.log(this.citas);
    }

   

    actualizarCita(obj){
        this.citas = this.citas.map(cit => cit.id === obj.id ? obj : cit);        
    }
}

class Ui{

    mostrarMensaje(mensaje, tipo){
        const divPadre = document.querySelector("#mensajes");
        const divMensaje = document.createElement('div');
        divMensaje.classList.add('text-center'); 
        if(tipo === 'error'){
            divMensaje.classList.add('alert', 'alert-danger');          
        }else{
            divMensaje.classList.add('alert', 'alert-success');
        }
            divMensaje.innerHTML = mensaje;
            divPadre.appendChild(divMensaje);
            setTimeout(function(){
                divMensaje.remove();
            },2000);
    }

    mostrarCitas(){

        this.limpiarLista();
        
        //LEER EL CONTENIDO DE LA BASE DE DATOS
        const objectStore = DB.transaction('citas').objectStore('citas');
        objectStore.openCursor().onsuccess = function(e){
            const cursor = e.target.result;
            

            if(cursor){
                
                const {id, mascota, propietario, telefono, fecha, hora, sintomas} = cursor.value;

            const divCita = document.createElement('div');
            divCita.classList.add('cita', 'p-3');
            divCita.dataset.id = id;

            const mascotaP = document.createElement('h2');
            mascotaP.classList.add('card-title', 'font-weight-bolder');
            mascotaP.textContent = mascota;

            const propietarioP = document.createElement('p');
            propietarioP.innerHTML = `
            <span class="font-wight-bolder">Propietario: </span> ${propietario}`;

            const telefonoP = document.createElement('p');
            telefonoP.innerHTML = `
            <span class="font-wight-bolder">Telefono: </span> ${telefono}`;

            const fechaP = document.createElement('p');
            fechaP.innerHTML = `
            <span class="font-wight-bolder">Fecha: </span> ${fecha}`;

            const horaP = document.createElement('p');
            horaP.innerHTML = `
            <span class="font-wight-bolder">Hora: </span> ${hora}`;

            const sintomasP = document.createElement('p');
            sintomasP.innerHTML = `
            <span class="font-wight-bolder">Sintomas: </span> ${sintomas}`;

            const btnEditar = document.createElement('button');
            btnEditar.classList.add('btn', 'btn-info', 'editar-cita');
            btnEditar.textContent = "Editar";
            const cita = cursor.value;
            btnEditar.onclick = () =>{
                editarCita(cita);
            };
            
            const btnEliminar = document.createElement('button');
            btnEliminar.classList.add('btn', 'btn-danger', 'eliminar-cita');
            btnEliminar.textContent = "Eliminar";
            btnEliminar.onclick = () =>{
                eliminarCita(id);
            };


            divCita.appendChild(mascotaP);
            divCita.appendChild(propietarioP);
            divCita.appendChild(telefonoP);
            divCita.appendChild(fechaP);
            divCita.appendChild(horaP);
            divCita.appendChild(sintomasP);
            divCita.appendChild(btnEditar);
            divCita.appendChild(btnEliminar);


            listaCitas.appendChild(divCita);

            cursor.continue();
            }
            
        }
        cargarCalendario();

    }

    

    limpiarLista(){
        while(listaCitas.firstChild){
            listaCitas.removeChild(listaCitas.firstChild);
        }
    }

}



/* INSTANCIAS */

const CITA = new Citas();
const UI = new Ui();



/* EVENT LISTENER */
window.onload = () =>{
    crearConexion();
    eventListener();
}
function eventListener(){
    //cargarCalendario();
    formulario.addEventListener('submit', solicitarCita);

}



/* FUNCIONES */

function solicitarCita(e){
    e.preventDefault();
    //llenamos el objeto
    citasObj.mascota = mascota.value;
    citasObj.propietario = propietario.value;
    citasObj.telefono = telefono.value;
    citasObj.fecha = fecha.value;
    citasObj.hora = hora.value;
    citasObj.sintomas = sintomas.value;
    //citasObj.id = id.value;
    

    
    crearCita();
    
}

function crearCita(){
    
    console.log(citasObj);
    const {mascota,propietario,telefono,fecha,hora,sintomas} = citasObj;
    if(mascota ==='' || propietario==='' || telefono ==='' || fecha === '' || hora === '' || sintomas === ''){
        UI.mostrarMensaje("Todos los campos son obligatorios", "error");
    }else{
        if(modActualizar){
            console.log("editando");
      
            CITA.actualizarCita({...citasObj});

            const transaction = DB.transaction(['citas'], 'readwrite');
            const objectStore = transaction.objectStore('citas');
            objectStore.put(citasObj);

            transaction.oncomplete = () => {
                UI.mostrarMensaje("Datos actualizados", "succes");
        
                formulario.querySelector('button[type="submit"]').textContent ="CREAR CITA";
                
                modActualizar = false;
            }
            transaction.onerror = () => {
                console.log("Hubo un error");
            }


        }else{
        
            citasObj.id = Date.now();
             
            //REGISTRAR EN INDEXDB
            const transaction = DB.transaction(['citas'], 'readwrite');
    
            const objectStore = transaction.objectStore('citas');
             objectStore.add(citasObj);

            transaction.oncomplete = function(){
                
            UI.mostrarMensaje("Registro exitoso", "succes");
            consultarBD();
            }       
        }

        formulario.reset();
        UI.mostrarCitas();
        reniciarObjeto();
        
    }
    
    
}

function editarCita(cita){
    mascota.value = cita.mascota;
    propietario.value = cita.propietario;
    telefono.value = cita.telefono;
    fecha.value = cita.fecha;
    hora.value = cita.hora;
    sintomas.value = cita.sintomas;

    citasObj.mascota = cita.mascota;
    citasObj.propietario = cita.propietario;
    citasObj.telefono = cita.telefono;
    citasObj.fecha = cita.fecha;
    citasObj.hora = cita.hora;
    citasObj.sintomas = cita.sintomas;
    citasObj.id = cita.id;


    formulario.querySelector('button[type="submit"]').textContent ="ACTUALIZAR CITA";
    modActualizar = true; 
}

function eliminarCita(id){
    const transaction = DB.transaction(['citas'], 'readwrite');
    const objectStore = transaction.objectStore('citas');
    objectStore.delete(id);
    transaction.oncomplete = () =>{
        UI.mostrarCitas();
    }
    
}

function reniciarObjeto(){
    citasObj.mascota = "";
    citasObj.propietario = "";
    citasObj.telefono = "";
    citasObj.fecha = "";
    citasObj.hora = "";
    citasObj.sintomas = "";

    
}





 function nationalDays(date) {
    const {citas} = CITA;
    
   
    var m = date.getMonth();
    var d = date.getDate();
    var y = date.getFullYear();

     
    
    const fechas = citas.map(ar => ar.fecha.split("-"));
    console.log(fechas);
    
    for (i = 0; i < fechas.length; i++) {
        
      if ((d == fechas[i][0]) && (m == fechas[i][1] - 1) &&  (y == fechas[i][2]))
      {

        console.log("pasoooo false");
        
        return [false];
        
      }
      //console.log("d:", d, "dd:",fechas[i][0]-1,"--","m:",m,"mm:",fechas[i][1],"y:",y,"yy:",fechas[i][2]);
    }
    console.log("paso trtue");
    return [true];
  }

  function consultarBD(){
    
    //LEER EL CONTENIDO DE LA BASE DE DATOS
    const objectStore = DB.transaction('citas').objectStore('citas');
     objectStore.openCursor().onsuccess = function(e){
        const cursor = e.target.result;
        

        if(cursor){
            
            CITA.creandoCita(cursor.value);
            cursor.continue();
        }else{

            
               
        }  
        
       
    }
    

    
  }



function noWeekendsOrHolidays(date) {
    var noWeekend = $.datepicker.noWeekends(date);
      if (noWeekend[0]) {
        return nationalDays(date);
      } else {
        return noWeekend;
    }
  }
   function cargarCalendario(){
    const dd = new Date();
    $(".datepicker").datepicker({
        dateFormat: 'dd-mm-yy',
        minDate: new Date(dd.getFullYear(), 1 - 1, 1),
        maxDate: new Date(dd.getFullYear()+1, 11, 31),
  
        hideIfNoPrevNext: true,
        beforeShowDay: noWeekendsOrHolidays,
       });
   }
        
      
//CONEXION A LA BASE DE DATOS
function crearConexion(){
    //CREAR BSE DE DATOS
    let crmDB = window.indexedDB.open('citas', 1);
    
    //SI HAY UN ERRRO
    crmDB.onerror = function(){
        console.log("Hubo un error al crear la DB");
    }

    //SI SE CREA CORRECTAMENTE
    crmDB.onsuccess = function(){
        console.log("Base de datos creada...");
        DB = crmDB.result;
        //CARGAMOS LOS REGISTROS DE LA BASE DE DATOS
        UI.mostrarCitas();
        consultarBD();
    }

    //CONFIGURCION DE LA BASE DE DATOS
    crmDB.onupgradeneeded = function(e){
        // console.log("Este metodo solo se ejecuta una vez");
        const db = e.target.result;

        const objectStore = db.createObjectStore('citas', {
            keyPath: 'id',
            autoIncrement: true
        });
        //DEFINIMOS LAS COLUMNAS
        objectStore.createIndex('mascota', 'mascota', { unique: false});
        objectStore.createIndex('propietario', 'propietario', { unique: false});
        objectStore.createIndex('telefono', 'telefono', { unique: false});
        objectStore.createIndex('fecha', 'fecha', { unique: false});
        objectStore.createIndex('hora', 'hora', { unique: false});
        objectStore.createIndex('sintomas', 'sintomas', { unique: false});
        objectStore.createIndex('id', 'id', { unique: true});
        console.log("columnas creadas");
    }
}