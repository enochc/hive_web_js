
const REQUEST_PEERS = "<p|"

const HEADER = 0x14;
const H_NAME = 0x67;
const PROPERTIES = 0x10;
const PROPERTY = 0x11;
const PEER_RESPONSE = 0x66;
const PEER_REQUESTS = 0x65;

HTMLUListElement.prototype.clear = function(){
  while (this.firstChild) {
    this.removeChild(this.firstChild);
  }
}

function SomeElement(element, data) {
  console.log("<< "+element);
  console.log("<<< "+data);
  this.data = data;
  this.element = element;
  element.value = data;
  element.addEventListener("change", this, false);
}
SomeElement.prototype.handleEvent = function(event) {
  /** I'm not sure what this is for, but it was in the example
   * https://stackoverflow.com/questions/16483560/how-to-implement-dom-data-binding-in-javascript
   */
  switch (event.type) {
    case "change": this.change(this.element.value);
  }
};

SomeElement.prototype.change = function(value) {
  this.data = value;
  this.element.innerText = value;
};


export class Hive {
  /** @member {WebSocket} */
  socket;
  /** @member {String} */
  remote_name;
  /** @member {string} */
  thing;
  /** @member {SomeElement} */
  status_out;
  /** @member {HTMLUListElement} */
  properties;
  /** @member {HTMLUListElement} */
  peers;
  /**
   * @param {String} address
   */
  constructor(address) {
    this.thing = "a thing"
    this.socket = new WebSocket("ws://"+address,"hive");
    this.socket.onclose = this.onClose.bind(this);
    this.socket.onopen = this.onOpen.bind(this);
    this.socket.onmessage = this.onMessage.bind(this);
    this.socket.binaryType = 'arraybuffer';
    this.status_out  = new SomeElement(document.getElementById("thing"), "hi");
    this.properties = document.getElementById("properties");
    this.peers = document.getElementById("peers");

  }

  disconnect(){
    this.socket.close();
    this.status_out.change("not connected");
    this.properties.clear();
    this.peers.clear();
  }

  /**
   * @param {ArrayBuffer} buffer
  */
  processMessage(buffer){
    let utf8_bytes = new Uint8Array(buffer)

    let t = this;
    let the_rest;
    switch (utf8_bytes[0]) {
      case HEADER:
        // let temp = String.fromCharCode(... utf8_bytes);
        // console.log("HEADER: "+temp+" - "+utf8_bytes[1]+" - "+H_NAME);
        switch (utf8_bytes[1]) {
          case H_NAME:
            let rest = String.fromCharCode(... utf8_bytes.slice(2));
            console.log("NAME!! "+rest);
            t.remote_name = rest;
            t.status_out.change(rest);
            break;
          default:
            console.log("nope...")
        }
        break;
      case H_NAME:
        console.log("NAME!!!! "+utf8_bytes)

      case PROPERTIES:
        // console.log(":: properties: "+utf8_bytes);
        the_rest = String.fromCharCode(... utf8_bytes.slice(1));
        the_rest.split("\n").forEach(function(pair) {
          if (pair !== ""){
            let v = pair.split("=");
            let name = v[0];
            let value = v[1];

            let li = document.createElement("li");
            li.setAttribute("id", "p_"+name);
            li.appendChild(document.createTextNode(name+" ==  "+value))
            t.properties.appendChild(li);
          }

        });

        break;

      case PROPERTY:
        the_rest = String.fromCharCode(... utf8_bytes.slice(1));
        let v = the_rest.split("=")
        let name = v[0];
        let val = v[1];
        let li = document.getElementById("p_"+name);
        if (li != null) {
          li.innerText = name+" == "+val;
        }
        break;

      case PEER_RESPONSE:
        this.peers.clear();
        the_rest = String.fromCharCode(... utf8_bytes.slice(1));
        console.log("the rest: "+the_rest)
        the_rest.split(",").forEach(function(pair) {

          let v = pair.split("|");
          let name = v[0];
          let value = v[1];
          console.log("<<<< peer: "+name+" value: "+value);

          let li = document.createElement("li");
          li.setAttribute("id", "peer_"+name);
          li.appendChild(document.createTextNode(name+", addr: "+value))
          t.peers.appendChild(li);
        });

        break;

      default:
        console.log("<< something else:  "+utf8_bytes[0]+" "+PEER_RESPONSE);
        break;

    }


  }
  onClose(event){
    console.log("closed");
    this.disconnect()

  }
  str2ab(str) {
    var buf = new ArrayBuffer(str.length); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }
  onOpen(event){

    let buffer = new ArrayBuffer(10);
    let u8buff = new Uint8Array(buffer)
    u8buff[0] = HEADER;
    u8buff[1] = PEER_REQUESTS;
    u8buff[2] = H_NAME;
    let str = "web_sock";
    for (let i = 3; i < 10; i++) {
      u8buff[i] = str.charCodeAt(i-3);
    }

    console.log("<<< connected and open");
    // let header_msg = HEADER+H_NAME+"web_sock"
    console.log("< header: "+buffer);
    this.socket.send(buffer);

    // this.socket.send("hello\r\n");
    // this.socket.send(REQUEST_PEERS+"\r\n");

    this.status_out.change("connected");
  }
  onMessage(event) {
    this.processMessage(event.data);


  }
  dothing(){
    console.log("did thing")
  }
}
