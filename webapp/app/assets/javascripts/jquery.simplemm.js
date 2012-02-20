/*

jquery.simplemm.js 
=================

Simple MindMap for jQuery using jsPlumb and underscore.js

*/
(function ($) {

  // opciones por defecto de jsplumb
  jsPlumb.Defaults.Endpoint = ["Dot", { radius: -1 } ];
  jsPlumb.Defaults.HoverPaintStyle = { strokeStyle: "#FF0000", lineWidth: 2 };
  jsPlumb.Defaults.Connector = ["StateMachine", { curviness: 20 }];
  jsPlumb.Defaults.Anchor = "Continuous";
  jsPlumb.Defaults.PaintStyle = { lineWidth : 2, strokeStyle : "#737373" },
  jsPlumb.Defaults.MaxConnections = -1;
  jsPlumb.Defaults.ConnectionOverlays = [
    ["Arrow", { location: 1, id: "arrow", length: 14, foldback: 0.8 }],
    ["Label", { id: "label" }]
  ];

  $.simpleMM = {

    connectionsClean: function(){
      // borra todas las conexiones del nodo seleccionado (.hl)
      var node_id = $('.hl').attr('id');
      connections = this._getAllConnections({node:node_id});

      for(var i=0; i<connections.length; i++) {
        var value = connections[i];
        jsPlumb.detach(value);
      }
    },

    _getAllConnections: function(options) {
      if (options.node === null) {
        // si no hay nodo dicho, conseguimos todas las conexiones
        var all_conns = []; var connections = jsPlumb.getConnections();
        for (var i=0; i<connections.length; i++){
          // las conexiones aparecen duplicadas, por el endpoint + overlay
          // vamos a tomar 1 de cada 2 y a darlo por hecho
          if (i%2===0){ all_conns.push({'source': connections[i].sourceId, 'target': connections[i].targetId}); }
        }
        return all_conns;
      } else {
        // consigue todas las conexiones para un nodo dado
        var targets = jsPlumb.getConnections({target:options.node});
        var sources = jsPlumb.getConnections({source:options.node});
        return Array.prototype.push.apply(sources, targets);
      }
    },

    initShow: function(){
      // opciones especificas solo para la navegacion con jsplumb
    
      jsPlumb.makeTarget($(".node"), {
        dropOptions: { hoverClass: "dragHover" },
        endpoint: { anchor: "Continuous" }
      });
    
    
      $('.node').click( function(e){
        e.preventDefault();
        $(this).zoomTo({ targetsize: 0.2 });
      });
    
      $("body").click(function(evt) {
         console.log('bla');
         $(this).zoomTo({targetsize:1.0});
         evt.stopPropagation();
      });
    
    },

    initEdit: function() {
      // opciones especificas para la edicion con jsplumb
    
      $("#footer").hide();

      // permitir que los nodos se arrastren
      jsPlumb.draggable($(".node"), {
        stop: function() {
          var data = $.simpleMM.nodeToData($(this));
          var node_id = $(this).attr('id');
          $.ajax({ type: "PUT", url: '/nodes/' + node_id, data: data, dataType: "json" });
      }}); //, {containment: "#mapmind-editor"});
      // TODO: Tiene que dejar en algun lado para que lo levante 
      // el ajax_update_nodes
    
      // conectar los node-connect con los nodos
      $(".node-connect").each(function (i, e) {
        var p = $(e).parent();
        jsPlumb.makeSource($(e), { parent: p });
      });
      jsPlumb.makeTarget($(".node"), {
        dropOptions: { hoverClass: "dragHover" },
        endpoint: { anchor: "Continuous" }
      });
    
      jsPlumb.bind("jsPlumbConnection", function (c) {
        var data = 'connection[source_id]=' + c.sourceId + '&connection[target_id]=' + c.targetId;
        $.post('/connections.json', data);
      });
    
      // INTERACTIVIDAD CRUD
      jsPlumb.bind("click", function (c) {
        var connection_name = prompt("¿Nombre de la conexion?", "");
        /// TODO DRY
        var data = "source=" + c.sourceId + "&target=" + c.targetId;
        var update = data + "&label=" + connection_name
        // como no tenemos un ID primero tenemos que buscar la conexion en la BBDD, conseguirlo 
        // y por ultimo borrarla
        $.get("/connections/search.json", data, function(resp){
          var conn_id = resp[0]._id;
          console.log(update);
          $.ajax({ type: "PUT", url: '/connections/' + conn_id, data: update });
          c.setLabel(connection_name);
        })
      });
    
      jsPlumb.bind("contextmenu", function (c) {
        var confirm_remove = confirm("¿Quieres borrar esta conexión?");
        if ( confirm_remove === true ){ 
          var data = "source=" + c.sourceId + "&target=" + c.targetId;
          // como no tenemos un ID primero tenemos que buscar la conexion en la BBDD, conseguirlo 
          // y por ultimo borrarla
          $.get("/connections/search.json", data, function(resp){
            var conn_id = resp[0]._id;
            $.ajax({ type: "DELETE", url: '/connections/' + conn_id + '.json', dataType: "json" });
            jsPlumb.detach(c);
          });
        }
      });
    
    
    // FIXME: toggle o algo mas chulo q esto q tiene bugs
      $('.node').click( function(e){
        e.preventDefault();
        var title = $(this).children('span').html();
        $('#node-title').html(title);
        $('.hl').removeClass('hl');
        $(this).toggleClass('hl');
        $('.node-selected').show('slow');
      });
    
    
      $('.hl').bind('click', function(e){
        e.preventDefault();
        $(this).removeClass('hl');
        $('.node-selected').hide('slow');
      });
    
    
    },

    nodeToData: function($node){
      var label = $node.children('span').text();
      var pos_left = $node.css('left').replace('px','');
      var pos_top = $node.css('top').replace('px','');
      var data = "node[label]=" + label + "&node[pos_top]=" +  pos_top + "&node[pos_left]=" + pos_left;
      return data;
    },

    drawConnection: function (properties){
      // pinta las uniones entre los nodos
      // recibe un objeto de este tipo:
      // {source: node._id, target:node._id, label:str}
    
      var endpoint_options = {
        anchor: "Continuous",
        connector: ["StateMachine", { curviness: 20 }],
        connectorStyle: { strokeStyle: "#737373", lineWidth: 2 },
        maxConnections: -1
      }          
    
      jsPlumb.addEndpoint(properties.source, endpoint_options);
      jsPlumb.addEndpoint(properties.target, endpoint_options);
    
      if (properties.label == null){
        jsPlumb.connect({ source:properties.source, target:properties.target, fireEvent: properties.fireEvent});
      } else {
        jsPlumb.connect({ source:properties.source, target:properties.target, fireEvent: properties.fireEvent})
          .setLabel(properties.label);
      }
    
    },

    drawNode: function(properties){
      // dibuja un nodo recibiendo  un objeto
      // draw_node({id: node._id, label: node.label, pos_left: node.pos_left, post_top: node.pos_top});
      // en caso de no recibir la propiedad ID, lo crea con otro template 
      
      if (properties.id == null) {
        var tmplMarkup = $('#tmpl-node-new').html();
        var data = { "label": properties.label, "pos_left": properties.pos_left + 'px', "pos_top": properties.pos_top + 'px'};
      } else {
        var tmplMarkup = $('#tmpl-node').html();
        var data = { "id": properties.id, "label": properties.label, "pos_left": properties.pos_left + 'px', "pos_top": properties.pos_top + 'px'};
      }
      var compiledTmpl = _.template(tmplMarkup, data);
      $('#mapmind-editor, #mapmind').append(compiledTmpl);
    },

    loadMap: function(mode){
      // consigue los nodos por JSON y los pinta
    
      $.getJSON("/nodes.json", function(d){ 
        for(var i=0; i<d.length; i++) $.simpleMM.drawNode({id: d[i]._id, label: d[i].label, pos_left: d[i].pos_left, pos_top: d[i].pos_top});
        switch(mode){
          case "editable":
            $.simpleMM.initEdit();
            break;
          case "navegable":
            $.simpleMM.initShow();
            break;
          default:
            $.simpleMM.initShow();
        }
      });
    
      $.getJSON("/connections.json", function(d){ 
        for(var i=0; i<d.length; i++){
          if (d[i].label === null) { 
            $.simpleMM.drawConnection({ source: d[i].source_id, target: d[i].target_id, fireEvent: false });
          } else { console.log(d[i].label) }
        }
      });
    },
    
    createNode: function(){
      var node_name = prompt("¿Nombre del nodo?", "");
      if ( !(node_name === "")){ 
        $('.hl').removeClass('hl');
        $('.node-selected').show('slow');
        var data = "node[label]=" + node_name;
        $.post('/nodes.json', data, function(resp){
          // actualizamos los IDs de los nodos, los necesitamos para guardar las conexiones del JSPlumb
          $.simpleMM.drawNode({id: resp._id, label: node_name, pos_left: 0, pos_top: 0});
          $.simpleMM.initEdit();
        });
      }
    },

    removeNode: function(){
      var confirm_remove = confirm("¿Quieres borrar este nodo?");
      if ( confirm_remove === true ){ 
        $('.hl').fadeOut(300, function() { $(this).remove() });
        $('.node-selected').hide('slow');
        $.simpleMM.connections_clean();
        var node_id = $('.hl').attr('id');
        $.ajax({ type: "DELETE", url: '/nodes/' + node_id + '.json', dataType: "json" });
        // TODO: lo tiene que dejar en algun lado para que lo levante 
        // el ajax_update_nodes
      }
    },

    updateNode: function(){
      var node_name_old = $('.hl').children('.node_name').text();
      var node_name = prompt("¿Nombre del nodo?", node_name_old);
      if ( !(node_name === "")){ 
        $('.hl').children('.node_name').html(node_name);
        $('.node-selected').hide('slow');
        var data = $.simpleMM.nodeToData($('.hl'));
        var node_id = $('.hl').attr('id');
        $.ajax({ type: "PUT", url: '/nodes/' + node_id, data: data, dataType: "json" });
      }
    }

    
  };

})(jQuery);
