//@flow

import {Hive} from './hive.js'

window.h_connect = function(){

  /** @type {HTMLInputElement} */
  let input = document.getElementById("host_address");
  let addr = input.value;
  let h = new Hive(addr);
  /** @var {HTMLButtonElement} */
  let btn = document.getElementById("connect_btn");
  if (btn != null){
    btn.innerText = "Disconnect";
    btn.onclick = function() {
      h.disconnect();
      btn.innerText =  "Connect"
      btn.onclick = function (){
        window.h_connect()
      }
    }
  }

  h.dothing();
    console.log("connect "+addr);
}




// let h = new Hive("192.168.1.110:3000");
// h.dothing();

