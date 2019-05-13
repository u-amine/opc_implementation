/*global require,console,setTimeout */
var opcua = require("node-opcua");
var async = require("async");
var WebSocket = require('ws');

//needs to be changed
var client = new opcua.OPCUAClient();
var endpointUrl = "opc.tcp://" + require("os").hostname() + ":4334/UA/MyLittleServer";


var the_session, the_subscription;

async.series([

    // step 1 : connect to
    function(callback)  {
        client.connect(endpointUrl,function (err) {
            if(err) {
                console.log(" cannot connect to endpoint :" , endpointUrl );
            } else {
                console.log("connected !");
            }
            callback(err);
        });
    },

    // step 2 : createSession
    function(callback) {
        client.createSession( function(err,session) {
            if(!err) {
                the_session = session;
            }
            callback(err);
        });
    },

    // step 3 : browse
    function(callback) {
       the_session.browse("RootFolder", function(err,browseResult){
           if(!err) {
               browseResult.references.forEach(function(reference) {
                   console.log( reference.browseName.toString());
               });
           }
           callback(err);
       });
    },

    // step 4 : read a variable with readVariableValue
    function(callback) {
       the_session.readVariableValue("ns=1;s=rHMI_CytroBoxDruckistwert_gb", function(err,dataValue) {
           if (!err) {
               console.log(" ns 1 % = " , dataValue.toString());
           }
           callback(err);
       });
       
       
    },
    
    // step 4' : read a variable with read
    function(callback) {
       var maxAge = 0;
       var nodeToRead = { nodeId: "ns=1;s=rHMI_CytroBoxDruckistwert_gb", attributeId: opcua.AttributeIds.Value };
       the_session.read(nodeToRead, maxAge, function(err,dataValue) {
           if (!err) {
               console.log(" ns 2 % = " , dataValue.toString() );
           }
           callback(err);
       });
       
       
    },
    
    // step 5: install a subscription and install a monitored item for 10 seconds
    function(callback) {
       
       the_subscription=new opcua.ClientSubscription(the_session,{
           requestedPublishingInterval: 1000,
           requestedLifetimeCount: 10,
           requestedMaxKeepAliveCount: 2,
           maxNotificationsPerPublish: 10,
           publishingEnabled: true,
           priority: 10
       });
       
       the_subscription.on("started",function(){
           console.log("subscription started for 2 seconds - subscriptionId=",the_subscription.subscriptionId);
       }).on("keepalive",function(){
           console.log("keepalive");
       }).on("terminated",function(){
        console.log("terminated");
       });
       
       //needs to be changed
       var monitoredItem1  = the_subscription.monitor({
           nodeId: opcua.resolveNodeId("ns=1;s=rHMI_CytroBoxDruckistwert_gb"),
           attributeId: opcua.AttributeIds.Value
       },
       {
           samplingInterval: 100,
           discardOldest: true,
           queueSize: 10
       },
       opcua.read_service.TimestampsToReturn.Both
       );
       console.log("-------------------------------------");
        
        //needs to be changed
       var monitoredItem2  = the_subscription.monitor({
        nodeId: opcua.resolveNodeId("ns=1;s=rHMI_CytroBoxDrehzahlistwert_gb"),
        attributeId: opcua.AttributeIds.Value
        },
        {
            samplingInterval: 100,
            discardOldest: true,
            queueSize: 10
        },
        opcua.read_service.TimestampsToReturn.Both
        );
        console.log("-------------------------------------");

    },

    // close session
    function(callback) {
        the_session.close(function(err){
            if(err) {
                console.log("session closed failed ?");
            }
            callback();
        });
    }

],
function(err) {
    if (err) {
        console.log(" failure ",err);
    } else {
        console.log("done!");
    }
    client.disconnect(function(){});
}) ;
