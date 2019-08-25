const Scene = require('Scene');
const Networking= require('Networking');
const Diagnostics = require('Diagnostics');
const Time = require('Time');
const m = require('Materials');
const te = require('Textures');
var URL = 'https://66bc3d6e.ngrok.io/get-products';
// var URL = 'https://34dba00c.ngrok.io/name';
const t = require('TouchGestures');
Scene.root.find('camprice').hidden = true;

Scene.root.find('camname').hidden = true;

t.onTap().subscribe(()=>{
    Time.setTimeout(()=>{
        Scene.root.find('origami_portal').hidden = true;
        Scene.root.find('camprice').hidden = false;

        Scene.root.find('camname').hidden = false;
    },3000);
    

});
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
        Scene.root.find('camprice').text = "Rs.2499";
        Scene.root.find('camname').text = "Quechua Snow Hike Boots";

       

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
}, 5000);