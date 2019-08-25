const Scene = require('Scene');
const Networking= require('Networking');
const Diagnostics = require('Diagnostics');
const Time = require('Time');
const m = require('Materials');
const te = require('Textures');
var URL = 'https://0d5f7f0a.ngrok.io/get-products';
// var URL = 'https://34dba00c.ngrok.io/name';
var getData = () =>{
Networking.fetch(URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({name: 'Electronics Company'})
})
    .then(function(result){
if((result.status >=200) && (result.status <300)){
    return result.json();
}else {
    throw new Error('HTTP Status Code :'+ result.status);
}
    }).then(function(json){
      //  let newChosenOne = json.name;
      if(!json.hasOwnProperty("status")) {
        Diagnostics.log("Error: no status found in the response")
      }
      if(json["status"]!="success") {
        Diagnostics.log("Error: error status found in the response")
        Diagnostics.log("Error: ", e)
      } else {
        Diagnostics.log(json);
        var companyjson = json.data.all[0];
        var productsjson = companyjson["products"];
        Diagnostics.log(companyjson);
        Diagnostics.log(productsjson);
        Scene.root.find('tvprice').text = "Rs."+productsjson[2]["price"].toString();
        Scene.root.find('tvname').text = productsjson[2]["product.name"];
        Scene.root.find('camprice').text = "Rs."+productsjson[1]["price"].toString();
        Scene.root.find('camname').text = productsjson[1]["product.name"];
        Scene.root.find('lapprice').text = "Rs."+productsjson[0]["price"].toString();
        Scene.root.find('lapname').text = productsjson[0]["product.name"];
        // Scene.root.find('tvdis').text = productsjson[2]["description"];
        // Scene.root.find('camdis').text = productsjson[1]["description"];
        // Scene.root.find('lapdis').text = productsjson[0]["description"];
        // var i=0;
        // Time.setInterval(() => {
        //   if(i==3){
        //     i=0;
        //   }

        //   for(var j=0;j<=2;j++){

        //     if(i==j){
        //       Scene.root.find('tvcomercial'+i).hidden = false;

        //     }
        //     else{
        //   Scene.root.find('tvcomercial'+j).hidden = true;

        //     }
        //   }
        // i++;
        // }, 2000);



      }
      
// json;
    })
    .catch(function(error){
        Diagnostics.log(error);
        // te.get('externalTexture0').url =newChosenOne;


    }); 
};
// getData();
// Time.setInterval(getData,3000);
Time.setTimeout(() => {
  getData();
}, 1000);